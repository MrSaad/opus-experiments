/* Minimal dependency-free SVG charts: line/step, column (grouped or stacked), scatter, heatmap.
 * Every chart gets: HTML legend (>=2 series), recessive hairline grid, hover tooltip,
 * and re-renders on resize. Colors are CSS custom properties so light/dark swap in CSS. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const charts = [];

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, cls, parent, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---------- scales & ticks
  function niceStep(span, n) {
    const raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const r = raw / mag;
    return (r >= 5 ? 10 : r >= 2 ? 5 : r >= 1 ? 2 : 1) * mag;
  }
  function linTicks(min, max, n) {
    const step = niceStep(max - min || 1, n);
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const t = [];
    for (let v = lo; v <= hi + step / 2; v += step) t.push(+v.toFixed(10));
    return t;
  }
  function logTicks(min, max) {
    const t = [];
    for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) { const v = Math.pow(10, e); if (v >= min * 0.999 && v <= max * 1.001) t.push(v); }
    return t;
  }
  const toTime = (d) => (typeof d === 'number' ? d : new Date(d.length === 7 ? d + '-15' : d).getTime());

  function fmtNum(v) {
    const a = Math.abs(v);
    if (a >= 1e12) return +(v / 1e12).toFixed(1) + 'T';
    if (a >= 1e9) return +(v / 1e9).toFixed(1) + 'B';
    if (a >= 1e6) return +(v / 1e6).toFixed(1) + 'M';
    if (a >= 1e4) return +(v / 1e3).toFixed(0) + 'K';
    if (a >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (a >= 10) return +v.toFixed(0) + '';
    if (a >= 1) return +v.toFixed(1) + '';
    return +v.toPrecision(2) + '';
  }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(t, style) {
    const d = new Date(t);
    if (style === 'year') return d.getUTCFullYear() + '';
    if (style === 'q') return "Q" + (Math.floor(d.getUTCMonth() / 3) + 1) + " '" + String(d.getUTCFullYear()).slice(2);
    return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }
  function timeTicks(min, max, width) {
    const years = (max - min) / (365.25 * 864e5);
    const maxTicks = Math.max(2, Math.floor(width / 70));
    let stepMonths = years > 12 ? 60 : years > 6 ? 24 : years > 3 ? 12 : years > 1.5 ? 6 : 3;
    while ((years * 12) / stepMonths > maxTicks) stepMonths *= 2;
    const t = [];
    const d0 = new Date(min);
    let y = d0.getUTCFullYear(), m = 0;
    while (Date.UTC(y, m, 1) < min) { m += stepMonths; while (m >= 12) { m -= 12; y++; } }
    for (let i = 0; i < 40; i++) {
      const v = Date.UTC(y, m, 1);
      if (v > max) break;
      t.push(v);
      m += stepMonths; while (m >= 12) { m -= 12; y++; }
    }
    return { ticks: t, style: stepMonths >= 12 ? 'year' : 'month' };
  }

  // ---------- shared chrome
  function frame(host, opts) {
    host.innerHTML = '';
    host.classList.add('chart');
    const legendItems = (opts.legend || []).filter((s) => !s.hideLegend);
    if (legendItems.length > 1) {
      const lg = h('div', 'legend', host);
      legendItems.forEach((s) => {
        const it = h('span', 'legend-item', lg);
        h('span', 'swatch' + (s.dashed ? ' dashed' : '') + (s.kind === 'line' ? ' line' : ''), it).style.setProperty('--c', `var(${s.color})`);
        h('span', '', it, s.name);
      });
    }
    const wrap = h('div', 'plot', host);
    const W = Math.max(280, wrap.clientWidth || host.clientWidth || 600);
    const H = opts.height || (W < 520 ? 240 : 300);
    const svg = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': opts.aria || '' }, wrap);
    const tip = h('div', 'tip', wrap);
    tip.hidden = true;
    return { wrap, svg, tip, W, H };
  }
  function showTip(f, html, x, y) {
    f.tip.innerHTML = html;
    f.tip.hidden = false;
    const tw = f.tip.offsetWidth, th = f.tip.offsetHeight;
    let left = x + 14, top = y - th - 10;
    if (left + tw > f.W) left = x - tw - 14;
    if (left < 0) left = 4;
    if (top < 0) top = y + 14;
    f.tip.style.left = left + 'px';
    f.tip.style.top = top + 'px';
  }
  function tipRow(color, name, val, dashed) {
    return `<div class="tip-row"><span class="swatch${dashed ? ' dashed' : ''}" style="--c:var(${color})"></span><span class="tip-name">${name}</span><span class="tip-val">${val}</span></div>`;
  }
  function yAxis(g, f, m, ticks, sy, fmt, unit) {
    ticks.forEach((t) => {
      const y = sy(t);
      el('line', { x1: m.l, x2: f.W - m.r, y1: y, y2: y, class: 'grid' }, g);
      const tx = el('text', { x: m.l - 8, y: y + 4, class: 'tick', 'text-anchor': 'end' }, g);
      tx.textContent = fmt(t);
    });
    if (unit) {
      const u = el('text', { x: m.l - 8, y: m.t - 10, class: 'tick unit', 'text-anchor': 'end' }, g);
      u.textContent = unit;
    }
  }

  // ---------- line / step chart
  function line(host, opts) {
    const f = frame(host, { ...opts, legend: opts.series.map((s) => ({ ...s, kind: 'line' })) });
    const m = { l: opts.ml || 52, r: opts.mr || 18, t: 26, b: 28 };
    const pts = opts.series.flatMap((s) => s.points.map((p) => [toTime(p[0]), p[1]]));
    let xmin = Math.min(...pts.map((p) => p[0])), xmax = Math.max(...pts.map((p) => p[0]));
    if (opts.xMax) xmax = toTime(opts.xMax);
    const ys = pts.map((p) => p[1]).filter((v) => v != null);
    let ymin = opts.yMin != null ? opts.yMin : Math.min(0, ...ys), ymax = opts.yMax != null ? opts.yMax : Math.max(...ys);
    let yt, sy;
    const ph = f.H - m.t - m.b;
    if (opts.yLog) {
      ymin = opts.yMin || Math.pow(10, Math.floor(Math.log10(Math.min(...ys))));
      ymax = Math.pow(10, Math.ceil(Math.log10(ymax)));
      yt = logTicks(ymin, ymax);
      sy = (v) => m.t + ph - ((Math.log10(v) - Math.log10(ymin)) / (Math.log10(ymax) - Math.log10(ymin))) * ph;
    } else {
      yt = linTicks(ymin, ymax, opts.yTicks || 5);
      ymin = yt[0]; ymax = yt[yt.length - 1];
      sy = (v) => m.t + ph - ((v - ymin) / (ymax - ymin)) * ph;
    }
    const sx = (t) => m.l + ((t - xmin) / (xmax - xmin || 1)) * (f.W - m.l - m.r);
    const g = el('g', {}, f.svg);
    const fmt = opts.yFmt || fmtNum;
    yAxis(g, f, m, yt, sy, fmt, opts.yUnit);
    const tt = timeTicks(xmin, xmax, f.W - m.l - m.r);
    tt.ticks.forEach((t) => {
      const tx = el('text', { x: sx(t), y: f.H - 8, class: 'tick', 'text-anchor': 'middle' }, g);
      tx.textContent = fmtDate(t, tt.style);
    });
    el('line', { x1: m.l, x2: f.W - m.r, y1: sy(opts.yLog ? ymin : Math.max(ymin, 0)), y2: sy(opts.yLog ? ymin : Math.max(ymin, 0)), class: 'axis' }, g);
    (opts.bands || []).forEach((b) => {
      const x1 = sx(toTime(b.from)), x2 = sx(toTime(b.to));
      el('rect', { x: x1, y: m.t, width: Math.max(1, x2 - x1), height: ph, class: 'band' }, g);
      const tx = el('text', { x: x1 + 4, y: m.t + 12, class: 'tick' }, g);
      tx.textContent = b.label;
    });
    (opts.hlines || []).forEach((hl) => {
      const y = sy(hl.y);
      el('line', { x1: m.l, x2: f.W - m.r, y1: y, y2: y, class: 'refline' }, g);
      const tx = el('text', { x: m.l + 6, y: y - 5, class: 'tick' }, g);
      tx.textContent = hl.label;
    });
    const series = opts.series.map((s) => ({ ...s, P: s.points.filter((p) => p[1] != null).map((p) => [toTime(p[0]), p[1], p[2]]) }));
    series.forEach((s) => {
      let d = '';
      s.P.forEach((p, i) => {
        const x = sx(p[0]), y = sy(p[1]);
        if (i === 0) d += `M${x},${y}`;
        else if (opts.step) d += `H${x}V${y}`;
        else d += `L${x},${y}`;
      });
      if (opts.step && s.P.length) d += `H${sx(xmax)}`;
      if (s.area) {
        const base = sy(opts.yLog ? ymin : Math.max(ymin, 0));
        el('path', { d: d + `L${sx(s.P[s.P.length - 1][0])},${base}L${sx(s.P[0][0])},${base}Z`, style: `fill:var(${s.color});opacity:.1` }, g);
      }
      el('path', { d, class: 'ln' + (s.dashed ? ' dashed' : ''), style: `stroke:var(${s.color})` }, g);
      if (s.dots) s.P.forEach((p) => el('circle', { cx: sx(p[0]), cy: sy(p[1]), r: 4, class: 'dot', style: `fill:var(${s.color})` }, g));
      const last = s.P[s.P.length - 1];
      if (last && !opts.noEndDots) el('circle', { cx: sx(last[0]), cy: sy(last[1]), r: 4, class: 'dot', style: `fill:var(${s.color})` }, g);
      if (last && opts.endLabels) {
        const tx = el('text', { x: sx(last[0]) - 6, y: sy(last[1]) - 9, class: 'endlabel', 'text-anchor': 'end' }, g);
        tx.textContent = (s.label || s.name) + ' ' + fmt(last[1]);
      }
    });
    // hover
    const cross = el('line', { y1: m.t, y2: m.t + ph, class: 'cross' }, g);
    cross.style.display = 'none';
    const hov = el('g', {}, g);
    const hit = el('rect', { x: m.l, y: m.t, width: f.W - m.l - m.r, height: ph, fill: 'transparent' }, g);
    const xfmt = opts.xFmt || ((t) => fmtDate(t, opts.xStyle || 'month'));
    function onMove(ev) {
      const r = f.svg.getBoundingClientRect();
      const mx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      const t = xmin + ((mx - m.l) / (f.W - m.l - m.r)) * (xmax - xmin);
      let best = null;
      series.forEach((s) => s.P.forEach((p) => { if (!best || Math.abs(p[0] - t) < Math.abs(best - t)) best = p[0]; }));
      if (best == null) return;
      const x = sx(best);
      cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.style.display = '';
      hov.innerHTML = '';
      let rows = '', note = '';
      series.forEach((s) => {
        let p = null;
        if (opts.step) { s.P.forEach((q) => { if (q[0] <= best) p = q; }); }
        else p = s.P.find((q) => q[0] === best);
        if (!p) return;
        el('circle', { cx: x, cy: sy(p[1]), r: 5, class: 'dot', style: `fill:var(${s.color})` }, hov);
        rows += tipRow(s.color, s.name, fmt(p[1]) + (opts.tipUnit || ''), s.dashed);
        if (p[2]) note += `<div class="tip-note">${p[2]}</div>`;
      });
      showTip(f, `<div class="tip-h">${xfmt(best)}</div>${rows}${note}`, x, mx < 0 ? 0 : sy(ymax) + 40);
    }
    hit.addEventListener('mousemove', onMove);
    hit.addEventListener('touchstart', onMove, { passive: true });
    hit.addEventListener('mouseleave', () => { cross.style.display = 'none'; hov.innerHTML = ''; f.tip.hidden = true; });
  }

  // ---------- column chart (grouped or stacked)
  function roundTop(x, y, w, hgt, r) {
    if (hgt <= 0) return '';
    r = Math.min(r, w / 2, hgt);
    return `M${x},${y + hgt}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + hgt}Z`;
  }
  function columns(host, opts) {
    const f = frame(host, { ...opts, legend: opts.series });
    const m = { l: opts.ml || 52, r: 14, t: 26, b: 30 };
    const cats = opts.cats, n = cats.length, S = opts.series;
    const totals = cats.map((_, i) => (opts.stacked ? S.reduce((a, s) => a + (s.values[i] || 0), 0) : Math.max(...S.map((s) => s.values[i] || 0))));
    const yt = linTicks(0, Math.max(...totals) * 1.02, 5);
    const ymax = yt[yt.length - 1], ph = f.H - m.t - m.b;
    const sy = (v) => m.t + ph - (v / ymax) * ph;
    const g = el('g', {}, f.svg);
    const fmt = opts.yFmt || fmtNum;
    yAxis(g, f, m, yt, sy, fmt, opts.yUnit);
    const band = (f.W - m.l - m.r) / n;
    const groupW = opts.stacked ? Math.min(24, band * 0.7) : Math.min(24 * S.length + 2 * (S.length - 1), band * 0.8);
    const bw = opts.stacked ? groupW : (groupW - 2 * (S.length - 1)) / S.length;
    const every = Math.ceil(n / Math.floor((f.W - m.l - m.r) / 46));
    cats.forEach((c, i) => {
      const cx = m.l + band * i + band / 2;
      if (i % every === 0) {
        const tx = el('text', { x: cx, y: f.H - 10, class: 'tick', 'text-anchor': 'middle' }, g);
        tx.textContent = c;
      }
      let acc = 0;
      S.forEach((s, j) => {
        const v = s.values[i] || 0;
        if (opts.stacked) {
          const y0 = sy(acc), y1 = sy(acc + v);
          const top = j === S.length - 1 || S.slice(j + 1).every((q) => !q.values[i]);
          const hh = Math.max(0, y0 - y1 - (j > 0 ? 2 : 0));
          const d = top ? roundTop(cx - bw / 2, y1, bw, hh, 4) : `M${cx - bw / 2},${y1}h${bw}v${hh}h${-bw}Z`;
          el('path', { d, style: `fill:var(${s.color})` }, g);
          acc += v;
        } else {
          const x = cx - groupW / 2 + j * (bw + 2);
          el('path', { d: roundTop(x, sy(v), bw, sy(0) - sy(v), 4), style: `fill:var(${s.color})` }, g);
        }
      });
      if (opts.totalLabels && (i === n - 1 || opts.totalLabels === 'all')) {
        const tx = el('text', { x: cx, y: sy(totals[i]) - 6, class: 'endlabel', 'text-anchor': 'middle' }, g);
        tx.textContent = fmt(totals[i]);
      }
      const hit = el('rect', { x: m.l + band * i, y: m.t, width: band, height: ph, fill: 'transparent' }, g);
      hit.addEventListener('mousemove', () => {
        let rows = S.map((s) => tipRow(s.color, s.name, s.values[i] == null ? '–' : fmt(s.values[i]) + (opts.tipUnit || ''))).reverse().join('');
        if (opts.stacked) rows += `<div class="tip-row tip-total"><span class="tip-name">Total</span><span class="tip-val">${fmt(totals[i])}${opts.tipUnit || ''}</span></div>`;
        showTip(f, `<div class="tip-h">${c}</div>${rows}`, cx, sy(totals[i]));
        hit.setAttribute('class', 'hoverband');
      });
      hit.addEventListener('mouseleave', () => { f.tip.hidden = true; hit.removeAttribute('class'); });
    });
    el('line', { x1: m.l, x2: f.W - m.r, y1: sy(0), y2: sy(0), class: 'axis' }, g);
  }

  // ---------- horizontal bars (log or linear)
  function hbars(host, opts) {
    const f = frame(host, { ...opts, height: opts.rows.length * 34 + 40 });
    const m = { l: Math.min(opts.ml || 190, f.W * 0.45), r: 70, t: 10, b: 28 };
    const vals = opts.rows.map((r) => r.v);
    const lo = opts.log ? Math.pow(10, Math.floor(Math.log10(Math.min(...vals)))) : 0;
    const hi = opts.log ? Math.pow(10, Math.ceil(Math.log10(Math.max(...vals)))) : Math.max(...vals);
    const pw = f.W - m.l - m.r;
    const sx = opts.log ? (v) => m.l + ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * pw : (v) => m.l + (v / hi) * pw;
    const g = el('g', {}, f.svg);
    const ticks = opts.log ? logTicks(lo, hi) : linTicks(0, hi, 4);
    const every = Math.ceil(ticks.length / Math.max(2, Math.floor(pw / 60)));
    ticks.forEach((t, i) => {
      el('line', { x1: sx(t), x2: sx(t), y1: m.t, y2: f.H - m.b, class: 'grid' }, g);
      if (i % every === 0) {
        const tx = el('text', { x: sx(t), y: f.H - 8, class: 'tick', 'text-anchor': 'middle' }, g);
        tx.textContent = (opts.tickFmt || fmtNum)(t);
      }
    });
    opts.rows.forEach((r, i) => {
      const y = m.t + i * 34 + 8, bh = 18;
      const lab = el('text', { x: m.l - 10, y: y + 13, class: 'rowlabel', 'text-anchor': 'end' }, g);
      lab.textContent = r.label;
      const x0 = m.l, x1 = sx(r.v);
      el('path', { d: `M${x0},${y}H${x1 - 4}Q${x1},${y} ${x1},${y + 4}V${y + bh - 4}Q${x1},${y + bh} ${x1 - 4},${y + bh}H${x0}Z`, style: `fill:var(${r.color || '--s1'})` }, g);
      const vt = el('text', { x: x1 + 6, y: y + 13, class: 'endlabel' }, g);
      vt.textContent = r.text;
      const hit = el('rect', { x: 0, y: y - 6, width: f.W, height: 30, fill: 'transparent' }, g);
      hit.addEventListener('mousemove', () => showTip(f, `<div class="tip-h">${r.label}</div><div class="tip-note">${r.note || r.text}</div>`, x1, y));
      hit.addEventListener('mouseleave', () => (f.tip.hidden = true));
    });
  }

  // ---------- scatter (time x, log y) with selective labels
  function scatter(host, opts) {
    const f = frame(host, { ...opts, legend: opts.legend });
    const m = { l: 56, r: 24, t: 26, b: 28 };
    const P = opts.points.map((p) => ({ ...p, t: toTime(p.x) }));
    const xmin = Math.min(...P.map((p) => p.t)) - 90 * 864e5, xmax = Math.max(...P.map((p) => p.t)) + 120 * 864e5;
    const ys = P.map((p) => p.y);
    const lo = Math.pow(10, Math.floor(Math.log10(Math.min(...ys)))), hi = Math.pow(10, Math.ceil(Math.log10(Math.max(...ys))));
    const ph = f.H - m.t - m.b;
    const sx = (t) => m.l + ((t - xmin) / (xmax - xmin)) * (f.W - m.l - m.r);
    const sy = (v) => m.t + ph - ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * ph;
    const g = el('g', {}, f.svg);
    yAxis(g, f, m, logTicks(lo, hi), sy, opts.yFmt || fmtNum, opts.yUnit);
    const tt = timeTicks(xmin, xmax, f.W - m.l - m.r);
    tt.ticks.forEach((t) => { const tx = el('text', { x: sx(t), y: f.H - 8, class: 'tick', 'text-anchor': 'middle' }, g); tx.textContent = fmtDate(t, tt.style); });
    if (opts.trend) {
      const [a, b] = opts.trend; // [ [date,val], [date,val] ]
      el('line', { x1: sx(toTime(a[0])), y1: sy(a[1]), x2: sx(toTime(b[0])), y2: sy(b[1]), class: 'refline' }, g);
      if (opts.trendLabel) { const tx = el('text', { x: sx(toTime(b[0])) - 4, y: sy(b[1]) + 16, class: 'tick', 'text-anchor': 'end' }, g); tx.textContent = opts.trendLabel; }
    }
    P.forEach((p) => {
      const c = el('circle', { cx: sx(p.t), cy: sy(p.y), r: 5, class: 'dot', style: `fill:var(${p.color || '--s1'})` }, g);
      if (p.label && (f.W >= 560 || p.mobile)) {
        const tx = el('text', { x: sx(p.t) + (p.left ? -8 : 8), y: sy(p.y) + (p.dy || 4), class: 'endlabel small', 'text-anchor': p.left ? 'end' : 'start' }, g);
        tx.textContent = p.label;
      }
      const hit = el('circle', { cx: sx(p.t), cy: sy(p.y), r: 12, fill: 'transparent' }, g);
      hit.addEventListener('mousemove', () => showTip(f, `<div class="tip-h">${p.name}</div><div class="tip-note">${p.tip}</div>`, sx(p.t), sy(p.y)));
      hit.addEventListener('mouseleave', () => (f.tip.hidden = true));
    });
  }

  // ---------- heatmap (rows x cols), sequential single hue
  function heatmap(host, opts) {
    host.innerHTML = '';
    host.classList.add('chart');
    const wrap = h('div', 'plot heat', host);
    const tbl = h('table', 'heat-table', wrap);
    const thead = h('thead', '', tbl), tr0 = h('tr', '', thead);
    h('th', '', tr0, '');
    opts.cols.forEach((c) => h('th', '', tr0, c));
    const tb = h('tbody', '', tbl);
    const max = opts.max || Math.max(...opts.values.flat());
    opts.rows.forEach((r, i) => {
      const tr = h('tr', opts.rowClass ? opts.rowClass(i) : '', tb);
      h('th', '', tr, r);
      opts.values[i].forEach((v, j) => {
        const td = h('td', '', tr);
        const step = Math.min(6, Math.round((v / max) * 6));
        td.dataset.step = step;
        td.textContent = v ? (opts.fmt ? opts.fmt(v) : v) : '';
        td.title = `${r} · ${opts.cols[j]}: ${opts.fmt ? opts.fmt(v) : v} ${opts.unit || ''}`;
      });
    });
  }

  function register(host, fn, opts) {
    const rec = { host, fn, opts };
    charts.push(rec);
    fn(host, opts);
    return rec;
  }
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => charts.forEach((c) => { if (c.host.offsetParent !== null) c.fn(c.host, c.opts); }), 150);
  });
  function rerenderVisible(scope) {
    charts.forEach((c) => { if (scope.contains(c.host)) c.fn(c.host, c.opts); });
  }

  window.Charts = { line, columns, hbars, scatter, heatmap, register, rerenderVisible, fmtNum, fmtDate };
})();
