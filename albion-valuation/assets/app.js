/* Renders every table, chart and the calculator from AlbionModel. */
(function () {
  'use strict';
  var M = window.AlbionModel;
  var $ = function (id) { return document.getElementById(id); };
  var SVGNS = 'http://www.w3.org/2000/svg';

  // ---------- formatting ----------
  function money(x, d) { if (x == null || isNaN(x)) return '–'; var neg = x < 0; var v = Math.abs(x); var s = '$' + v.toLocaleString('en-CA', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); return neg ? '(' + s + ')' : s; }
  function mm(x, d) { return '$' + (x / 1e6).toFixed(d == null ? 2 : d) + 'M'; }
  function k(x) { if (Math.abs(x) < 500) return '–'; var s = '$' + Math.round(Math.abs(x) / 1000).toLocaleString('en-CA') + 'K'; return x < 0 ? '(' + s + ')' : s; }
  function pct(x, d) { return (x * 100).toFixed(d == null ? 1 : d) + '%'; }
  function n(x) { return Math.round(x).toLocaleString('en-CA'); }
  function td(v, cls) { return '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + v + '</td>'; }
  function th(v, cls) { return '<th' + (cls ? ' class="' + cls + '"' : '') + '>' + v + '</th>'; }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function el(tag, attrs, parent) { var e = document.createElementNS(SVGNS, tag); for (var a in attrs) e.setAttribute(a, attrs[a]); if (parent) parent.appendChild(e); return e; }
  function txt(parent, x, y, s, attrs) { var t = el('text', Object.assign({ x: x, y: y }, attrs || {}), parent); t.textContent = s; return t; }

  // ---------- tooltip ----------
  var tip = $('tip');
  function showTip(e, html) { tip.innerHTML = html; tip.style.display = 'block'; moveTip(e); }
  function moveTip(e) { var x = e.clientX + 14, y = e.clientY + 14; var w = tip.offsetWidth, h = tip.offsetHeight; if (x + w > innerWidth - 8) x = e.clientX - w - 14; if (y + h > innerHeight - 8) y = e.clientY - h - 14; tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
  function hideTip() { tip.style.display = 'none'; }
  function hover(node, html) { node.addEventListener('mouseenter', function (e) { showTip(e, html); }); node.addEventListener('mousemove', moveTip); node.addEventListener('mouseleave', hideTip); node.setAttribute('tabindex', '0'); node.addEventListener('focus', function () { var r = node.getBoundingClientRect(); showTip({ clientX: r.right, clientY: r.top }, html); }); node.addEventListener('blur', hideTip); }

  // ---------- scenarios ----------
  var SCEN = {
    down: { rentMainFront: 40, rentMainInterior: 35, rentOffice: 18, rentBasement: 15, capMain: 0.065, capOffice: 0.09, capBasement: 0.0975, monthsOffice: 24, monthsBasement: 15, capex: 400000, exitCap: 0.0775 },
    base: {},
    up: { rentMainFront: 45, rentMainInterior: 40, rentOffice: 26, rentBasement: 18, capMain: 0.0575, capOffice: 0.08, capBasement: 0.09, monthsOffice: 12, monthsBasement: 9, capex: 150000, exitCap: 0.07 }
  };
  var DCA = { low: [300, 90, 50], base: [330, 110, 60], high: [360, 130, 70] };
  function dcaValue(r, o) { var B = M.BUILDING; return B.gfaMain * r[0] + B.gfaSecond * r[1] + B.gfaBasement * r[2] - M.leaseUp(o).total; }
  var R = {};
  ['down', 'base', 'up'].forEach(function (s) { R[s] = { asIs: M.asIs(SCEN[s]), dcf: M.dcf(SCEN[s]) }; });
  var ip = M.inPlace();
  var dca = { low: dcaValue(DCA.low), base: dcaValue(DCA.base), high: dcaValue(DCA.high) };
  var W = { dc: 0.5, dcf: 0.3, dca: 0.2 };
  var reconciled = W.dc * R.base.asIs.value + W.dcf * R.base.dcf.pv + W.dca * dca.base;

  // ---------- theme ----------
  $('themeBtn').addEventListener('click', function () {
    var root = document.documentElement, cur = root.getAttribute('data-theme');
    var dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', dark ? 'light' : 'dark');
    try { localStorage.setItem('albion-theme', root.getAttribute('data-theme')); } catch (e) {}
    drawCharts();
  });
  try { var saved = localStorage.getItem('albion-theme'); if (saved) document.documentElement.setAttribute('data-theme', saved); } catch (e) {}

  // ================= CHARTS =================
  function football() {
    var host = $('footballChart'); host.innerHTML = '';
    var rows = [
      { label: 'Direct cap + lease-up', lo: R.down.asIs.value, mid: R.base.asIs.value, hi: R.up.asIs.value, note: 'Stabilized NOI ÷ blended cap, less lease-up and capital; downside–upside scenarios' },
      { label: '10-yr DCF (9% discount)', lo: R.down.dcf.pv, mid: R.base.dcf.pv, hi: R.up.dcf.pv, note: 'Present value of 10 years of cash flow plus exit at 7.25%' },
      { label: 'Sales cross-check', lo: dca.low, mid: dca.base, hi: dca.high, note: 'Per-level $/sf (main $300–360, office $90–130, basement $50–70) less lease-up' },
      { label: 'In-place NOI only', lo: ip.noi / 0.075, mid: ip.noi / 0.07, hi: ip.noi / 0.065, note: 'Today\'s normalized NOI of ' + money(ip.noi) + ' at 6.5–7.5%, no credit for leasing up (a floor)' },
      { label: 'Concluded value', lo: 3700000, mid: reconciled, hi: 4600000, note: 'Weighted 50% direct cap, 30% DCF, 20% sales cross-check', strong: true }
    ];
    var refs = [
      { v: 2480000, label: '2011 purchase $2.48M' },
      { v: 4385000, label: 'MPAC (2016 values) $4.39M' },
      { v: 6999000, label: 'Asking $7.0M' },
      { v: 9330000, label: 'Draft appraisal $9.33M' }
    ];
    var w = Math.max(320, host.clientWidth), narrow = w < 560;
    var padL = narrow ? 118 : 170, padR = 16, rowH = 38, top = 54, h = top + rows.length * rowH + 30;
    var x0 = 2000000, x1 = 10000000, sx = function (v) { return padL + (v - x0) / (x1 - x0) * (w - padL - padR); };
    var svg = el('svg', { class: 'chart', viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, role: 'img', 'aria-label': 'Valuation range by method compared with asking price and appraisal' }, host);
    for (var t = 2; t <= 10; t++) { var gx = sx(t * 1e6); el('line', { x1: gx, x2: gx, y1: top - 6, y2: h - 26, class: 'gridline' }, svg); txt(svg, gx, h - 10, '$' + t + 'M', { 'text-anchor': 'middle' }); }
    refs.forEach(function (r, i) {
      var x = sx(r.v);
      el('line', { x1: x, x2: x, y1: top - 8, y2: h - 26, stroke: css('--ink-2'), 'stroke-width': 1, 'stroke-dasharray': '0' , opacity: 0.55 }, svg);
      var ty = i % 2 === 0 ? 14 : 32;
      var anchor = r.v > 8.5e6 ? 'end' : (r.v < 3e6 ? 'start' : 'middle');
      var lbl = narrow ? r.label.replace(/ \(2016 values\)/, '').replace('Draft appraisal', 'Appraisal').replace('2011 purchase', '2011') : r.label;
      txt(svg, x + (anchor === 'end' ? 4 : 0), ty, lbl, { 'text-anchor': anchor, class: 'lbl-strong', style: 'font-size:11.5px' });
    });
    rows.forEach(function (r, i) {
      var y = top + i * rowH + rowH / 2;
      txt(svg, padL - 10, y + 4, r.label, { 'text-anchor': 'end', class: r.strong ? 'lbl-strong' : '' });
      var g = el('g', {}, svg);
      var bar = el('rect', { x: sx(r.lo), y: y - 9, width: Math.max(4, sx(r.hi) - sx(r.lo)), height: 18, rx: 4, fill: r.strong ? css('--s1') : css('--h2') }, g);
      el('circle', { cx: sx(r.mid), cy: y, r: 6, fill: r.strong ? css('--h6') : css('--s1'), stroke: css('--surface'), 'stroke-width': 2 }, g);
      txt(g, sx(r.hi) + 8, y + 4, mm(r.mid, 2), { class: r.strong ? 'lbl-strong' : '' });
      el('rect', { x: padL, y: y - rowH / 2, width: w - padL - padR, height: rowH, fill: 'transparent' }, g);
      hover(g, '<b>' + r.label + '</b>Base ' + mm(r.mid) + ' · range ' + mm(r.lo) + '–' + mm(r.hi) + '<br><span class="muted">' + r.note + '</span>');
    });
  }

  function occupancy() {
    var host = $('occChart'); host.innerHTML = '';
    var cats = [['leased', 'Leased', '--s1'], ['informal', 'Month-to-month, no lease', '--s2'], ['owner', 'Owner use', '--s3'], ['vacant', 'Vacant', '--neutral']];
    $('occLegend').innerHTML = cats.map(function (c) { return '<span><span class="dot" style="background:var(' + c[2] + ')"></span>' + c[1] + '</span>'; }).join('');
    var floors = ['Main', 'Second', 'Basement'];
    var w = Math.max(320, host.clientWidth), padL = 78, padR = 70, rowH = 40, h = floors.length * rowH + 8;
    var max = 9000, sx = function (v) { return v / max * (w - padL - padR); };
    var svg = el('svg', { class: 'chart', viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, role: 'img', 'aria-label': 'Leasable area by floor and status' }, host);
    floors.forEach(function (f, i) {
      var y = i * rowH + 8, x = padL, tot = 0, occ = 0;
      txt(svg, padL - 10, y + 16, f, { 'text-anchor': 'end' });
      cats.forEach(function (c) {
        var units = M.UNITS.filter(function (u) { return u.floor === f && u.status === c[0]; });
        var sf = units.reduce(function (s, u) { return s + u.sf; }, 0); tot += sf; if (c[0] === 'leased' || c[0] === 'informal') occ += sf;
        if (!sf) return;
        var wpx = sx(sf);
        var r = el('rect', { x: x, y: y, width: Math.max(1, wpx - 2), height: 22, rx: 3, fill: css(c[2]) }, svg);
        hover(r, '<b>' + f + ' · ' + c[1] + '</b>' + n(sf) + ' sf<br>' + units.map(function (u) { return u.id; }).join(', '));
        if (wpx > 52) txt(svg, x + 6, y + 15, n(sf), { fill: c[0] === 'vacant' ? css('--ink') : '#fff', style: 'fill:' + (c[0] === 'vacant' ? 'var(--ink)' : '#fff') + ';font-size:11.5px' });
        x += wpx;
      });
      txt(svg, x + 6, y + 15, pct(occ / tot, 0) + ' occ.', { class: 'lbl-strong' });
    });
  }

  function bridge() {
    var host = $('bridgeChart'); host.innerHTML = '';
    var steps = M.appraisalBridge().steps;
    var w = Math.max(320, host.clientWidth), narrow = w < 640;
    var padL = narrow ? 10 : 250, padR = 70, rowH = narrow ? 52 : 34, h = steps.length * rowH + 30;
    var max = 9500000, sx = function (v) { return padL + v / max * (w - padL - padR); };
    var svg = el('svg', { class: 'chart', viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, role: 'img', 'aria-label': 'Bridge from appraisal value to concluded value' }, host);
    for (var t = 0; t <= 9; t += 1) { var gx = sx(t * 1e6); el('line', { x1: gx, x2: gx, y1: 0, y2: h - 22, class: 'gridline' }, svg); if (!narrow || t % 3 === 0) txt(svg, gx, h - 6, '$' + t + 'M', { 'text-anchor': 'middle' }); }
    var prev = null;
    steps.forEach(function (s, i) {
      var y = i * rowH + (narrow ? 22 : 6), bh = 20;
      if (narrow) txt(svg, padL, y - 6, s.label, { style: 'font-size:11.5px' });
      else { var lab = txt(svg, padL - 12, y + 14, s.label, { 'text-anchor': 'end' }); }
      var g = el('g', {}, svg);
      if (prev == null || i === steps.length - 1) {
        el('rect', { x: sx(0), y: y, width: sx(s.value) - sx(0), height: bh, rx: 4, fill: i === 0 ? css('--neutral') : css('--s1') }, g);
      } else {
        var a = Math.min(prev, s.value), b = Math.max(prev, s.value);
        el('rect', { x: sx(0), y: y + 8, width: sx(Math.min(prev, s.value)) - sx(0), height: 4, rx: 2, fill: css('--grid') }, g);
        el('rect', { x: sx(a), y: y, width: Math.max(2, sx(b) - sx(a)), height: bh, rx: 4, fill: s.value < prev ? css('--down') : css('--up') }, g);
      }
      var delta = prev == null ? '' : ' (' + (s.value < prev ? '−' : '+') + mm(Math.abs(s.value - prev)) + ')';
      txt(g, Math.max(sx(s.value), prev ? sx(prev) : 0) + 6, y + 14, mm(s.value), { class: 'lbl-strong' });
      el('rect', { x: 0, y: y - (narrow ? 18 : 4), width: w, height: rowH, fill: 'transparent' }, g);
      hover(g, '<b>' + s.label + '</b>' + mm(s.value) + delta);
      prev = s.value;
    });
  }

  function dcfChart() {
    var host = $('dcfChart'); host.innerHTML = '';
    var rows = R.base.dcf.rows;
    var w = Math.max(320, host.clientWidth), h = 220, padL = 52, padR = 10, top = 10, bot = 26;
    var min = -150000, max = 450000;
    var sy = function (v) { return top + (max - v) / (max - min) * (h - top - bot); };
    var band = (w - padL - padR) / rows.length, bw = Math.min(18, band / 2 - 3);
    var svg = el('svg', { class: 'chart', viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, role: 'img', 'aria-label': 'DCF NOI and cash flow by year' }, host);
    for (var v = -100000; v <= 400000; v += 100000) { el('line', { x1: padL, x2: w - padR, y1: sy(v), y2: sy(v), class: v === 0 ? 'axis' : 'gridline' }, svg); txt(svg, padL - 6, sy(v) + 4, (v === 0 ? '$0' : (v < 0 ? '−$' : '$') + Math.abs(v / 1000) + 'K'), { 'text-anchor': 'end' }); }
    rows.forEach(function (r, i) {
      var cx = padL + band * i + band / 2;
      txt(svg, cx, h - 8, 'Y' + r.year, { 'text-anchor': 'middle' });
      var g = el('g', {}, svg);
      [[r.noi, '--s1', -bw - 1], [r.cf, '--s2', 1]].forEach(function (b) {
        var y0 = sy(0), y1 = sy(b[0]);
        var y = Math.min(y0, y1), hh = Math.abs(y1 - y0);
        el('rect', { x: cx + b[2], y: y, width: bw, height: Math.max(1, hh), rx: 3, fill: css(b[1]) }, g);
      });
      el('rect', { x: cx - band / 2, y: top, width: band, height: h - top - bot, fill: 'transparent' }, g);
      hover(g, '<b>Year ' + r.year + '</b>Occupancy ' + pct(r.occ, 0) + '<br>NOI ' + money(r.noi) + '<br>TI + commissions ' + money(r.ti + r.lc) + (r.capex ? '<br>Capital ' + money(r.capex) : '') + '<br>Cash flow ' + money(r.cf));
    });
  }

  function drawCharts() { football(); occupancy(); bridge(); dcfChart(); if ($('gridTable').innerHTML) gridT(); }

  // ================= TABLES =================
  function rentRoll(filter) {
    var rows = M.UNITS.filter(function (u) { return filter === 'All' || u.floor === filter; });
    var st = { leased: 'Leased', informal: 'No lease', vacant: 'Vacant', owner: 'Owner use' };
    var h = '<thead><tr>' + th('Unit') + th('Tenant') + th('Use') + th('Status') + th('Measured sf', 'r') + th('Billed sf', 'r') + th('Base $/sf', 'r') + th('Base / yr', 'r') + th('Add\'l / yr', 'r') + th('Gross / yr', 'r') + th('Gross $/sf', 'r') + th('Term') + '</tr></thead><tbody>';
    var tot = { sf: 0, base: 0, addl: 0 };
    rows.forEach(function (u) {
      var g = u.base + u.addl; tot.sf += u.sf; tot.base += u.base; tot.addl += u.addl;
      var area = u.status === 'leased' ? u.billed : u.sf;
      h += '<tr>' + td('<b>' + u.id + '</b>') + td(u.tenant + (u.note ? ' <span class="muted small">· ' + u.note + '</span>' : '')) + td(u.use || '') + td('<span class="tag">' + st[u.status] + '</span>') +
        td(n(u.sf), 'r') + td(u.status === 'leased' ? n(u.billed) : '–', 'r') + td(u.status === 'leased' ? money(u.base / u.billed, 2) : '–', 'r') + td(u.base ? money(u.base) : '–', 'r') + td(u.addl ? money(u.addl) : '–', 'r') + td(g ? money(g) : '–', 'r') + td(g ? money(g / area, 2) : '–', 'r') +
        td(u.status === 'leased' ? u.start + '–' + u.end + (u.since && u.since < u.start ? ' <span class="muted small">(since ' + u.since + ')</span>' : '') : '') + '</tr>';
    });
    h += '<tr class="total">' + td('Total') + td('') + td('') + td('') + td(n(tot.sf), 'r') + td('', 'r') + td('', 'r') + td(money(tot.base), 'r') + td(money(tot.addl), 'r') + td(money(tot.base + tot.addl), 'r') + td('', 'r') + td('') + '</tr></tbody>';
    $('rrTable').innerHTML = h;
  }
  function rrFilters() {
    var box = $('rrFilters');
    ['All', 'Main', 'Second', 'Basement'].forEach(function (f, i) {
      var b = document.createElement('button'); b.className = 'chip'; b.type = 'button'; b.textContent = f === 'All' ? 'All floors' : f + (f === 'Second' ? ' floor' : f === 'Main' ? ' floor' : '');
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () { box.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); rentRoll(f); });
      box.appendChild(b);
    });
    rentRoll('All');
  }

  function ownerOpex() {
    var h = '<thead><tr>' + th('Line item') + th('2025', 'r') + th('$/sf GFA', 'r') + '</tr></thead><tbody>';
    M.OPEX_2025.forEach(function (l) { h += '<tr>' + td(l[0]) + td(money(l[1]), 'r') + td(money(l[1] / M.BUILDING.gfa, 2), 'r') + '</tr>'; });
    h += '<tr class="total">' + td('Total as reported') + td(money(ip.ownerOpex), 'r') + td(money(ip.ownerOpex / M.BUILDING.gfa, 2), 'r') + '</tr>';
    h += '<tr class="sub">' + td('Gross rent (rent roll)') + td(money(ip.gross), 'r') + td('') + '</tr>';
    h += '<tr class="sub">' + td('NOI implied by owner figures') + td(money(ip.ownerNoi), 'r') + td('') + '</tr>';
    h += '<tr class="sub">' + td('…after adding insurance (~$24K)') + td(money(ip.ownerNoiWithIns), 'r') + td('') + '</tr></tbody>';
    $('ownerOpex').innerHTML = h;
  }
  function ipTable() {
    var h = '<tbody>';
    h += '<tr>' + td('Base rent, formal leases') + td(money(ip.formalBase), 'r') + '</tr>';
    h += '<tr>' + td('Additional rent ($17/sf × 13,008 billed sf)') + td(money(ip.formalAddl), 'r') + '</tr>';
    h += '<tr>' + td('Cash / no-lease occupants') + td(money(ip.informalRent), 'r') + '</tr>';
    h += '<tr class="total">' + td('Gross income') + td(money(ip.gross), 'r') + '</tr>';
    h += '<tr>' + td('Credit allowance') + td(money(-ip.allowance), 'r') + '</tr>';
    h += '<tr class="total">' + td('Effective gross income') + td(money(ip.egi), 'r') + '</tr>';
    ip.opex.lines.forEach(function (l) { h += '<tr class="sub">' + td(l[0]) + td(money(-l[1]), 'r') + '</tr>'; });
    h += '<tr class="total">' + td('Operating costs') + td(money(-ip.opex.total), 'r') + '</tr>';
    h += '<tr class="total">' + td('Normalized in-place NOI') + td(money(ip.noi), 'r') + '</tr></tbody>';
    $('ipTable').innerHTML = h;
  }
  function expiry() {
    var by = {};
    M.UNITS.filter(function (u) { return u.status === 'leased'; }).forEach(function (u) { (by[u.end] = by[u.end] || []).push(u); });
    var h = '<thead><tr>' + th('Expiry') + th('Units') + th('Billed sf', 'r') + th('Gross rent / yr', 'r') + th('% of in-place gross', 'r') + th('Note') + '</tr></thead><tbody>';
    var notes = { 2026: 'Pharmacy: 2026 is now, so confirm renewal (option on file).', 2027: 'School at $30.39 gross vs ~$22 market: expect a roll-down.', 2030: 'Four main-floor renewals and two basement leases, all signed 2025.' };
    h += '<tr>' + td('No lease (month-to-month)') + td('B101, B103, B111') + td(n(789 + 706 + 638), 'r') + td(money(ip.informalRent), 'r') + td(pct(ip.informalRent / ip.gross), 'r') + td('Cash. Can leave, or be removed, on short notice.') + '</tr>';
    Object.keys(by).sort().forEach(function (y) {
      var g = by[y].reduce(function (s, u) { return s + u.base + u.addl; }, 0), sf = by[y].reduce(function (s, u) { return s + u.billed; }, 0);
      h += '<tr>' + td(y) + td(by[y].map(function (u) { return u.id + ' ' + u.tenant.split(' ')[0]; }).join(', ')) + td(n(sf), 'r') + td(money(g), 'r') + td(pct(g / ip.gross), 'r') + td(notes[y] || '') + '</tr>';
    });
    $('expiryTable').innerHTML = h + '</tbody>';
  }
  function sales() {
    var h = '<thead><tr>' + th('Property') + th('Area') + th('Date') + th('Price', 'r') + th('Size sf', 'r') + th('$/sf', 'r') + th('Cap', 'r') + th('Implied NOI $/sf', 'r') + th('Notes') + '</tr></thead><tbody>';
    M.SALES.forEach(function (s) {
      h += '<tr>' + td(s.addr) + td(s.city) + td(s.date) + td(money(s.price), 'r') + td(n(s.sf), 'r') + td(money(s.price / s.sf), 'r') + td(s.cap ? pct(s.cap, 2) : '–', 'r') + td(s.cap ? money(s.price / s.sf * s.cap, 2) : '–', 'r') + td('<span class="small">' + s.note + '</span>') + '</tr>';
    });
    var st = R.base.asIs.stabilized;
    h += '<tr class="total">' + td('Subject at asking price') + td('Rexdale') + td('Sept 2026 ask') + td(money(M.BUILDING.ask), 'r') + td(n(M.BUILDING.gfa), 'r') + td(money(M.BUILDING.ask / M.BUILDING.gfa), 'r') + td(pct(ip.noi / M.BUILDING.ask, 2) + '*', 'r') + td(money(st.noi / M.BUILDING.gfa, 2) + '†', 'r') + td('<span class="small">*on normalized in-place NOI · †stabilized NOI per sf GFA</span>') + '</tr>';
    $('salesTable').innerHTML = h + '</tbody>';
  }
  function stab() {
    var s = R.base.asIs.stabilized, A = s.A;
    var h = '<thead><tr>' + th('Income stream') + th('Area sf', 'r') + th('Market gross $/sf', 'r') + th('Potential gross', 'r') + th('Vacancy', 'r') + th('EGI', 'r') + th('NOI (costs pro rata)', 'r') + th('Cap', 'r') + th('Value', 'r') + '</tr></thead><tbody>';
    var rent = { mainFront: A.rentMainFront, mainInterior: A.rentMainInterior, office: A.rentOffice, basement: A.rentBasement };
    Object.keys(s.byCls).forEach(function (c) { var b = s.byCls[c]; h += '<tr>' + td(b.label) + td(n(b.sf), 'r') + td(money(rent[c], 2), 'r') + td(money(b.pgi), 'r') + td(pct(b.vac / b.pgi, 0), 'r') + td(money(b.egi), 'r') + td(money(b.noi), 'r') + td(pct(b.cap, 2), 'r') + td(money(b.value), 'r') + '</tr>'; });
    h += '<tr class="total">' + td('Total') + td(n(Object.keys(s.byCls).reduce(function (t, c) { return t + s.byCls[c].sf; }, 0)), 'r') + td('', 'r') + td(money(s.pgi), 'r') + td(pct(s.vac / s.pgi), 'r') + td(money(s.egi), 'r') + td(money(s.noi), 'r') + td(pct(s.cap, 2), 'r') + td(money(s.value), 'r') + '</tr>';
    h += '<tr class="group"><td colspan="9">Stabilized operating costs</td></tr>';
    s.opex.lines.forEach(function (l) { h += '<tr class="sub"><td colspan="6">' + l[0] + '</td>' + td(money(l[1]), 'r') + '<td colspan="2"></td></tr>'; });
    h += '<tr class="total"><td colspan="6">Total costs (' + money(s.opex.total / M.BUILDING.leasable, 2) + '/sf leasable)</td>' + td(money(s.opex.total), 'r') + '<td colspan="2"></td></tr>';
    $('stabTable').innerHTML = h + '</tbody>';
  }
  function leaseUpT() {
    var lu = R.base.asIs.leaseUp;
    var h = '<thead><tr>' + th('Item') + th('Amount', 'r') + '</tr></thead><tbody>';
    h += '<tr>' + td('Rent lost while leasing ' + n(lu.rows.reduce(function (s, r) { return s + r.sf; }, 0)) + ' sf (incl. free rent)') + td(money(lu.lost), 'r') + '</tr>';
    h += '<tr>' + td('Tenant improvements') + td(money(lu.ti), 'r') + '</tr>';
    h += '<tr>' + td('Leasing commissions') + td(money(lu.lc), 'r') + '</tr>';
    h += '<tr>' + td('Near-term capital allowance (roof / HVAC)') + td(money(lu.capex), 'r') + '</tr>';
    h += '<tr>' + td('Risk / entrepreneurial profit (15%)') + td(money(lu.profit), 'r') + '</tr>';
    h += '<tr class="total">' + td('Total deduction') + td(money(lu.total), 'r') + '</tr></tbody>';
    $('leaseUpTable').innerHTML = h;
  }
  function contractT() {
    var ca = R.base.asIs.contract;
    var h = '<thead><tr>' + th('Unit') + th('Tenant') + th('Contract gross', 'r') + th('Market gross', 'r') + th('Difference / yr', 'r') + th('Years left', 'r') + th('PV', 'r') + '</tr></thead><tbody>';
    ca.rows.forEach(function (r) { h += '<tr>' + td(r.id) + td(r.tenant) + td(money(r.contract), 'r') + td(money(r.market), 'r') + td('<span class="' + (r.diff < 0 ? 'neg' : '') + '">' + money(r.diff) + '</span>', 'r') + td(r.years.toFixed(2), 'r') + td(money(r.pv), 'r') + '</tr>'; });
    h += '<tr class="total"><td colspan="6">Net present value of contract vs market</td>' + td(money(ca.pv), 'r') + '</tr>';
    $('contractTable').innerHTML = h + '</tbody>';
  }
  function dcSummary() {
    var a = R.base.asIs;
    var h = '<tbody>';
    h += '<tr>' + td('Stabilized NOI') + td(money(a.stabilized.noi), 'r') + '</tr>';
    h += '<tr>' + td('÷ blended cap rate') + td(pct(a.stabilized.cap, 2), 'r') + '</tr>';
    h += '<tr class="total">' + td('Stabilized value') + td(money(a.stabilized.value), 'r') + '</tr>';
    h += '<tr>' + td('Less lease-up and capital') + td(money(-a.leaseUp.total), 'r') + '</tr>';
    h += '<tr>' + td('Plus contract-vs-market adjustment') + td(money(a.contract.pv), 'r') + '</tr>';
    h += '<tr class="total">' + td('As-is value, direct capitalization') + td(money(a.value), 'r') + '</tr>';
    h += '<tr class="sub">' + td('Per sf GFA / per sf leasable') + td(money(a.value / M.BUILDING.gfa) + ' / ' + money(a.value / M.BUILDING.leasable), 'r') + '</tr></tbody>';
    $('dcSummary').innerHTML = h;
  }
  function dcfT() {
    var d = R.base.dcf;
    var h = '<thead><tr>' + th('') + d.rows.map(function (r) { return th('Y' + r.year, 'r'); }).join('') + '</tr></thead><tbody>';
    function row(label, f, cls) { h += '<tr' + (cls ? ' class="' + cls + '"' : '') + '>' + td(label) + d.rows.map(function (r) { return td(f(r), 'r'); }).join('') + '</tr>'; }
    row('Occupancy', function (r) { return pct(r.occ, 0); });
    row('Gross rent', function (r) { return k(r.gross); });
    row('EGI (4% credit)', function (r) { return k(r.egi); });
    row('Operating costs', function (r) { return k(-r.opex); });
    row('NOI', function (r) { return k(r.noi); }, 'total');
    row('TI + commissions', function (r) { return k(-(r.ti + r.lc)); });
    row('Capital', function (r) { return r.capex ? k(-r.capex) : '–'; });
    row('Cash flow', function (r) { return k(r.cf); }, 'total');
    h += '</tbody>';
    h += '<tbody><tr class="sub"><td colspan="11">Exit: year-11 NOI ' + money(d.exitNoi) + ' ÷ 7.25% = ' + money(d.exitValue) + ', less 2% costs. <b>Present value at 9.0%: ' + money(d.pv) + '</b></td></tr></tbody>';
    $('dcfTable').innerHTML = h;
  }
  function dcaT() {
    var B = M.BUILDING, lu = M.leaseUp().total;
    var h = '<thead><tr>' + th('Level') + th('GFA sf', 'r') + th('Low $/sf', 'r') + th('Base $/sf', 'r') + th('High $/sf', 'r') + th('Basis') + '</tr></thead><tbody>';
    var basis = ['Fully leased mixed-use comps at $341–440/sf (urban, better locations); 964-1010 Albion at $568 includes redevelopment land', 'Suburban Class B/C office: income-supported value at $22 gross and 8.5% is about $98/sf', 'Below-grade space typically trades at 15–25% of the main-floor rate'];
    [['Main floor', B.gfaMain], ['Second floor', B.gfaSecond], ['Basement', B.gfaBasement]].forEach(function (l, i) {
      h += '<tr>' + td(l[0]) + td(n(l[1]), 'r') + td(money(DCA.low[i]), 'r') + td(money(DCA.base[i]), 'r') + td(money(DCA.high[i]), 'r') + td('<span class="small">' + basis[i] + '</span>') + '</tr>';
    });
    h += '<tr>' + td('Less lease-up and capital') + td('', 'r') + td(money(-lu), 'r') + td(money(-lu), 'r') + td(money(-lu), 'r') + td('') + '</tr>';
    h += '<tr class="total">' + td('Indicated as-is value') + td('', 'r') + td(money(dca.low), 'r') + td(money(dca.base), 'r') + td(money(dca.high), 'r') + td('') + '</tr></tbody>';
    $('dcaTable').innerHTML = h;
  }
  function scenarioT() {
    var labels = { down: 'Downside', base: 'Base', up: 'Upside' };
    var desc = { down: 'Rents $40 / $35 / $18 / $15; caps +50 bps; office leases in 24 months; $400K capital', base: 'Rents $43 / $38 / $22 / $17; caps 6.0 / 8.5 / 9.25%; office 18 months; $250K capital', up: 'Medical second floor at $26; $45 / $40 / $18; caps −25 bps; office 12 months; $150K capital' };
    var h = '<thead><tr>' + th('Case') + th('Assumptions') + th('Stabilized NOI', 'r') + th('Cap', 'r') + th('Direct cap as-is', 'r') + th('DCF value', 'r') + '</tr></thead><tbody>';
    ['down', 'base', 'up'].forEach(function (s) { var a = R[s].asIs; h += '<tr' + (s === 'base' ? ' class="total"' : '') + '>' + td(labels[s]) + td('<span class="small">' + desc[s] + '</span>') + td(money(a.stabilized.noi), 'r') + td(pct(a.stabilized.cap, 2), 'r') + td(money(a.value), 'r') + td(money(R[s].dcf.pv), 'r') + '</tr>'; });
    $('scenarioTable').innerHTML = h + '</tbody>';
  }
  function reconT() {
    var h = '<thead><tr>' + th('Approach') + th('Indication', 'r') + th('Weight', 'r') + th('Contribution', 'r') + '</tr></thead><tbody>';
    [['Direct capitalization with lease-up deductions', R.base.asIs.value, W.dc], ['10-year DCF (9.0% discount, 7.25% exit)', R.base.dcf.pv, W.dcf], ['Sales comparison cross-check (per-level $/sf)', dca.base, W.dca]].forEach(function (r) {
      h += '<tr>' + td(r[0]) + td(money(r[1]), 'r') + td(pct(r[2], 0), 'r') + td(money(r[1] * r[2]), 'r') + '</tr>';
    });
    h += '<tr class="total">' + td('Weighted indication') + td('', 'r') + td('100%', 'r') + td(money(reconciled), 'r') + '</tr>';
    h += '<tr class="total">' + td('Concluded as-is market value (rounded)') + td('', 'r') + td('', 'r') + td('$4,100,000', 'r') + '</tr></tbody>';
    $('reconTable').innerHTML = h;
  }
  function gridT() {
    var caps = [0.065, 0.0675, 0.07, 0.0725, 0.075], rents = [16, 19, 22, 25, 28];
    var g = M.grid({}, caps, rents);
    var lo = 3300000, hi = 4900000;
    var ramp = ['--h1', '--h2', '--h3', '--h4', '--h5', '--h6'];
    var h = '<thead><tr>' + th('Office rent (gross) ↓ / Cap rate →') + caps.map(function (c) { return th(pct(c, 2), 'r'); }).join('') + '</tr></thead><tbody>';
    g.forEach(function (row, i) {
      h += '<tr>' + td('$' + rents[i] + '/sf' + (rents[i] === 22 ? ' (base)' : '')) + row.map(function (v, j) {
        var t = Math.max(0, Math.min(0.999, (v - lo) / (hi - lo))); var idx = Math.floor(t * ramp.length);
        var hex = css(ramp[idx]).replace('#', ''); var lum = (parseInt(hex.substr(0, 2), 16) * 0.299 + parseInt(hex.substr(2, 2), 16) * 0.587 + parseInt(hex.substr(4, 2), 16) * 0.114) / 255;
        var dark = lum < 0.55;
        return '<td class="r" style="background:var(' + ramp[idx] + ');color:' + (dark ? '#fff' : 'var(--ink)') + (caps[j] === 0.07 && rents[i] === 22 ? ';font-weight:700;outline:2px solid var(--ink);outline-offset:-2px' : '') + '">' + n(v / 1000) + '</td>';
      }).join('') + '</tr>';
    });
    $('gridTable').innerHTML = h + '</tbody>';
  }
  function offerT() {
    var prices = [[3500000, 'Opening offer'], [3750000, 'Target (low)'], [3900000, 'Target (high)'], [4100000, 'Walk-away (fair value)'], [4400000, 'Step-up if 2nd floor pre-leased*'], [M.BUILDING.ask, 'Seller asking'], [M.BUILDING.appraisal, 'Draft appraisal']];
    var lu = M.leaseUp(), st = R.base.asIs.stabilized;
    var h = '<thead><tr>' + th('Price point') + th('Price', 'r') + th('$/sf GFA', 'r') + th('Today\'s yield', 'r') + th('Stabilized yield', 'r') + th('Closing costs', 'r') + th('Max loan', 'r') + th('All-in equity', 'r') + th('Unlevered IRR', 'r') + '</tr></thead><tbody>';
    prices.forEach(function (p) {
      var d = M.dcf({}, p[0]), db = M.debt({}, p[0]);
      h += '<tr' + (p[1].indexOf('Walk-away') === 0 ? ' class="total"' : '') + '>' + td(p[1]) + td(money(p[0]), 'r') + td(money(p[0] / M.BUILDING.gfa), 'r') + td(pct(ip.noi / p[0]), 'r') + td(pct(st.noi / p[0]), 'r') + td(money(M.ltt(p[0]) * 2 + 60000), 'r') + td(money(db.loan), 'r') + td(money(db.equity + lu.ti + lu.lc + lu.capex), 'r') + td('<span class="' + (d.irr < 0.075 ? 'neg' : '') + '">' + pct(d.irr) + '</span>', 'r') + '</tr>';
    });
    $('offerTable').innerHTML = h + '</tbody>';
  }

  // ================= CALCULATOR =================
  var CTL = [
    ['Market rents (gross $/sf/yr)', [
      ['rentMainFront', 'Main floor street-front', 30, 55, 0.5, 'd', 'In-place 2025 deals: $41–46'],
      ['rentMainInterior', 'Main floor interior (108/109)', 25, 50, 0.5, 'd'],
      ['rentOffice', 'Second-floor office', 12, 32, 0.5, 'd', '$8 net across the street; subject asking $12 net'],
      ['rentBasement', 'Basement', 8, 24, 0.5, 'd', '2025 basement leases: $18']]],
    ['Stabilized vacancy & credit loss', [
      ['vacMain', 'Main floor', 0, 0.2, 0.01, 'p'], ['vacOffice', 'Office', 0, 0.3, 0.01, 'p'], ['vacBasement', 'Basement', 0, 0.3, 0.01, 'p']]],
    ['Cap rates', [
      ['capMain', 'Main-floor retail', 0.045, 0.085, 0.0025, 'p2'], ['capOffice', 'Office', 0.065, 0.11, 0.0025, 'p2'], ['capBasement', 'Basement', 0.07, 0.12, 0.0025, 'p2']]],
    ['Lease-up & capital', [
      ['monthsOffice', 'Months to lease office', 3, 36, 1, 'm'], ['monthsBasement', 'Months to lease basement', 3, 30, 1, 'm'],
      ['capex', 'Near-term capital (roof/HVAC)', 0, 800000, 10000, '$', 'Replace with BCA figure'], ['insurance', 'Insurance / yr', 10000, 50000, 1000, '$']]],
    ['DCF & financing', [
      ['discount', 'Discount rate (unlevered target)', 0.06, 0.12, 0.0025, 'p2'], ['exitCap', 'Exit cap rate', 0.055, 0.09, 0.0025, 'p2'],
      ['growth', 'Rent & cost growth', 0, 0.04, 0.0025, 'p2'], ['renewProb', 'Renewal probability', 0.3, 0.95, 0.05, 'p'],
      ['rate', 'Mortgage rate', 0.04, 0.08, 0.0025, 'p2']]]
  ];
  var calc = {};
  function fmtCtl(v, f) { return f === 'd' ? '$' + (+v).toFixed(2) : f === 'p' ? pct(v, 0) : f === 'p2' ? pct(v, 2) : f === 'm' ? v + ' mo' : money(+v); }
  function buildCalc() {
    var box = $('calcControls'); var h = '';
    CTL.forEach(function (g) {
      h += '<div class="ctl-group"><h4>' + g[0] + '</h4>';
      g[1].forEach(function (c) {
        var v = M.DEFAULTS[c[0]]; calc[c[0]] = v;
        h += '<div class="ctl"><label for="c_' + c[0] + '">' + c[1] + '</label><output id="o_' + c[0] + '">' + fmtCtl(v, c[5]) + '</output><input type="range" id="c_' + c[0] + '" min="' + c[2] + '" max="' + c[3] + '" step="' + c[4] + '" value="' + v + '" data-k="' + c[0] + '" data-f="' + c[5] + '">' + (c[6] ? '<span class="hint">' + c[6] + '</span>' : '') + '</div>';
      });
      h += '</div>';
    });
    h += '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-s="down">Downside</button><button class="btn primary" type="button" data-s="base">Base (reset)</button><button class="btn" type="button" data-s="up">Upside</button></div>';
    box.innerHTML = h;
    box.querySelectorAll('input[type=range]').forEach(function (inp) {
      inp.addEventListener('input', function () { calc[inp.dataset.k] = +inp.value; $('o_' + inp.dataset.k).textContent = fmtCtl(inp.value, inp.dataset.f); calcOut(); });
    });
    box.querySelectorAll('button[data-s]').forEach(function (b) {
      b.addEventListener('click', function () {
        var sc = SCEN[b.dataset.s];
        box.querySelectorAll('input[type=range]').forEach(function (inp) {
          var key = inp.dataset.k, v = sc[key] != null ? sc[key] : M.DEFAULTS[key];
          inp.value = v; calc[key] = v; $('o_' + key).textContent = fmtCtl(v, inp.dataset.f);
        });
        calcOut();
      });
    });
    calcOut();
  }
  function calcOut() {
    var priceEl = $('calcPrice'); var price = priceEl ? +priceEl.value.replace(/[^0-9.]/g, '') : 3900000;
    var o = Object.assign({}, calc);
    var a = M.asIs(o), d = M.dcf(o, price || 1), db = M.debt(o, price || 1), ipx = M.inPlace(o);
    var out = $('calcOut');
    if (!priceEl) {
      out.innerHTML = '<div class="tile"><div class="label">As-is value (direct cap)</div><div class="hero-num" id="r_val"></div><div class="sub" id="r_sub"></div></div>' +
        '<div class="tbl-wrap" style="margin-top:12px"><table id="r_tbl"></table></div>' +
        '<h4 style="margin:12px 0 6px">Test a purchase price</h4><input class="price-in" id="calcPrice" inputmode="numeric" value="3,900,000" aria-label="Purchase price">' +
        '<div class="tbl-wrap" style="margin-top:10px"><table id="r_px"></table></div>';
      $('calcPrice').addEventListener('input', calcOut);
      return calcOut();
    }
    $('r_val').textContent = mm(a.value, 2);
    $('r_sub').textContent = 'DCF ' + mm(d.pv, 2) + ' · ' + money(a.value / M.BUILDING.gfa) + '/sf GFA';
    $('r_tbl').innerHTML = '<tbody>' +
      '<tr><td>Stabilized NOI</td><td class="r">' + money(a.stabilized.noi) + '</td></tr>' +
      '<tr><td>Blended cap rate</td><td class="r">' + pct(a.stabilized.cap, 2) + '</td></tr>' +
      '<tr><td>Stabilized value</td><td class="r">' + money(a.stabilized.value) + '</td></tr>' +
      '<tr><td>Lease-up &amp; capital</td><td class="r">' + money(-a.leaseUp.total) + '</td></tr>' +
      '<tr><td>Contract vs market</td><td class="r">' + money(a.contract.pv) + '</td></tr>' +
      '<tr class="total"><td>As-is value</td><td class="r">' + money(a.value) + '</td></tr>' +
      '<tr><td>DCF value</td><td class="r">' + money(d.pv) + '</td></tr></tbody>';
    $('r_px').innerHTML = '<tbody>' +
      '<tr><td>Yield on today\'s NOI (' + k(ipx.noi) + ')</td><td class="r">' + pct(ipx.noi / price, 2) + '</td></tr>' +
      '<tr><td>Yield on stabilized NOI</td><td class="r">' + pct(a.stabilized.noi / price, 2) + '</td></tr>' +
      '<tr><td>Closing costs (LTT + MLTT + legal)</td><td class="r">' + money(M.ltt(price) * 2 + 60000) + '</td></tr>' +
      '<tr><td>Max loan (1.25× DSCR on today\'s NOI)</td><td class="r">' + money(db.loan) + '</td></tr>' +
      '<tr><td>Equity at closing</td><td class="r">' + money(db.equity) + '</td></tr>' +
      '<tr class="total"><td>10-yr unlevered IRR</td><td class="r">' + pct(d.irr) + '</td></tr></tbody>';
  }

  // ---------- init ----------
  rrFilters(); ownerOpex(); ipTable(); expiry(); sales(); stab(); leaseUpT(); contractT(); dcSummary(); dcfT(); dcaT(); scenarioT(); reconT(); gridT(); offerT(); buildCalc();
  drawCharts();
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(drawCharts, 150); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', drawCharts);
})();
