(function () {
  const D = window.DATA, C = window.CONTENT, M = window.MODEL, CH = window.Charts;
  const $ = (s) => document.querySelector(s);
  const COL = C.colors, NAMES = C.names, TICKS = ['SNDK', 'STX', 'WDC'];
  const fmtUSD = (v, d = 0) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = (v, d = 0) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d) + '%';
  const sign = (v) => (v >= 0 ? 'pos' : 'neg');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ------------------------------------------------------------------ theme + nav
  const root = document.documentElement;
  try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch (e) {}
  $('#themeBtn').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  });
  const links = [...document.querySelectorAll('.topnav a.nl')];
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section').forEach((s) => io.observe(s));

  // ------------------------------------------------------------------ derived numbers
  const snap = {};
  TICKS.forEach((t) => {
    const c = M.COMPANIES[t], s = c.start;
    const px = D.px[t], last = px[px.length - 1][1];
    const yearAgo = px.find((p) => p[0] >= '2025-09-22') || px[0];
    const hi52 = Math.max(...px.filter((p) => p[0] >= '2025-09-23').map((p) => p[1]));
    const ebit = s.rev * s.gm / 100 - s.opex;
    const eps = M.runRateEps(t);
    snap[t] = { price: c.price, chg1y: (c.price / yearAgo[1] - 1) * 100, offHigh: (c.price / hi52 - 1) * 100, mcap: c.price * c.sharesOut / 1000, ebit, eps, pe: c.price / eps };
  });
  // 52-week highs from the full daily file are higher than the weekly sample; use daily values recorded at build time
  const HI52 = { SNDK: 2335.0, STX: 1094.04, WDC: 746.23 };
  const YR = { SNDK: 106.4, STX: 228.13, WDC: 110.25 };
  TICKS.forEach((t) => { snap[t].offHigh = (snap[t].price / HI52[t] - 1) * 100; snap[t].chg1y = (snap[t].price / YR[t] - 1) * 100; });
  const EXTRA = {
    SNDK: { fy: '$20.2B (+175%)', gmLast: '84.6%', gmGuide: '83–85%', trailPE: 70.88, netCash: 4.8, ev: 266.0 - 4.8, vis: '>50% of FY27 bits, ~⅔ of FY28 under NBMs', ins: '$133M / $0' },
    STX: { fy: '$12.2B (+34%)', gmLast: '52.7%', gmGuide: '~57% (implied)', trailPE: 15.58, netCash: -1.9, ev: 209.4 + 1.9, vis: 'Nearline allocated into CY2028', ins: '$572M / $0' },
    WDC: { fy: '$12.9B (+36%)', gmLast: '54.4%', gmGuide: '55–56%', trailPE: 10.22, netCash: 0.5, ev: 473.69 * 388 / 1000 - 0.5, vis: 'LTA to CY2029; talks to 2031', ins: '$75M / $0' },
  };

  // ------------------------------------------------------------------ verdict cards
  function renderVerdicts() {
    $('#verdictCards').innerHTML = ['WDC', 'STX', 'SNDK'].map((t) => {
      const c = M.COMPANIES[t], info = C.companies[t];
      const r = { bear: M.run(t, c.presets.bear, 'bear'), base: M.run(t, c.presets.base, 'base'), bull: M.run(t, c.presets.bull, 'bull') };
      const w = M.weighted(t, c.presets, c.probs);
      const stars = '★★★★★'.slice(0, Math.floor(info.stars)) + (info.stars % 1 ? '½' : '') ;
      return `<div class="card verdict" style="--c:var(${COL[t]})">
        <div class="tick">${t}</div><div class="name">${NAMES[t]}</div>
        <div class="rating">${esc(info.rating)} <span class="stars" aria-label="${info.stars} of 5">${stars}</span></div>
        <p>${esc(info.oneLiner)}</p>
        <div class="scenario-strip" title="Annualized 5-year return by scenario">
          <div>Bear<b class="${sign(r.bear.cagr5)}">${pct(r.bear.cagr5)}</b></div>
          <div>Likely (base)<b class="${sign(r.base.cagr5)}">${pct(r.base.cagr5)}</b></div>
          <div>Bull<b class="${sign(r.bull.cagr5)}">${pct(r.bull.cagr5)}</b></div>
        </div>
        <div class="kv">
          <span>Price (Sep 23)</span><span>${fmtUSD(c.price, 2)}</span>
          <span>P/E on run-rate EPS</span><span>${snap[t].pe.toFixed(1)}×</span>
          <span>Base-case price, FY29 / FY31</span><span>${fmtUSD(r.base.px3)} / ${fmtUSD(r.base.px5)}</span>
          <span>Probability-weighted, 3 / 5 yr</span><span class="${sign(w.cagr5)}">${pct(w.cagr3, 1)} / ${pct(w.cagr5, 1)}/yr</span>
          <span>Weights bull / base / bear</span><span>${c.probs.bull}/${c.probs.base}/${c.probs.bear}</span>
        </div>
      </div>`;
    }).join('');
  }
  renderVerdicts();

  // ------------------------------------------------------------------ snapshot table
  (function () {
    const rows = [
      ['Share price (Sep 23, 2026)', (t) => fmtUSD(snap[t].price, 2)],
      ['Change, 12 months', (t) => `<span class="pos">${pct(snap[t].chg1y)}</span>`],
      ['Below 52-week high', (t) => `<span class="neg">${pct(snap[t].offHigh)}</span>`],
      ['Market cap', (t) => '$' + snap[t].mcap.toFixed(0) + 'B'],
      ['FY26 revenue (growth)', (t) => EXTRA[t].fy],
      ['Run-rate revenue (FQ1 guide × 4)', (t) => '$' + (M.COMPANIES[t].start.rev / 1000).toFixed(1) + 'B'],
      ['Gross margin, June qtr (non-GAAP)', (t) => EXTRA[t].gmLast],
      ['Gross margin, Sept guide', (t) => EXTRA[t].gmGuide],
      ['Run-rate EPS (non-GAAP)', (t) => fmtUSD(snap[t].eps, 2)],
      ['P/E on run-rate EPS', (t) => snap[t].pe.toFixed(1) + '×'],
      ['P/E on FY26 EPS', (t) => (snap[t].price / EXTRA[t].trailPE).toFixed(1) + '×'],
      ['EV / run-rate EBIT', (t) => (EXTRA[t].ev / (snap[t].ebit / 1000)).toFixed(1) + '×'],
      ['Net cash (debt), Jul 3', (t) => (EXTRA[t].netCash >= 0 ? '$' : '−$') + Math.abs(EXTRA[t].netCash).toFixed(1) + 'B'],
      ['Contracted visibility', (t) => `<span class="small">${EXTRA[t].vis}</span>`],
      ['Insider sales / buys, 12 mo', (t) => EXTRA[t].ins],
    ];
    let h = '<table class="data"><thead><tr><th>Metric</th>' + TICKS.map((t) => `<th><span class="dotc" style="--c:var(${COL[t]});display:inline-block;width:9px;height:9px;border-radius:50%;background:var(${COL[t]});margin-right:6px"></span>${NAMES[t]}</th>`).join('') + '</tr></thead><tbody>';
    rows.forEach((r) => { h += `<tr><td>${r[0]}</td>` + TICKS.map((t) => `<td>${r[1](t)}</td>`).join('') + '</tr>'; });
    $('#snapshotTable').innerHTML = h + '</tbody></table>';
  })();

  // ------------------------------------------------------------------ financial charts
  const finSeries = (key, fromIdx) => TICKS.map((t) => ({ name: NAMES[t], color: COL[t], points: D.fins[t].filter((r) => r.end >= '2023-12-01').map((r) => [r.end, r[key]]) }));
  const guideSeries = (key) => TICKS.map((t) => {
    const f = D.fins[t], last = f[f.length - 1];
    return { name: NAMES[t] + ' guide', color: COL[t], dashed: true, hideLegend: true, points: [[last.end, last[key]], [D.guide[t].end, D.guide[t][key]]] };
  });
  CH.register($('#chRevenue'), CH.line, { series: [...finSeries('rev'), ...guideSeries('rev')], yUnit: '$M', yFmt: (v) => CH.fmtNum(v), xStyle: 'q', xFmt: (t) => CH.fmtDate(t, 'q'), endLabels: false });
  CH.register($('#chGM'), CH.line, { series: [...finSeries('gm'), ...guideSeries('gm')], yUnit: '%', yMin: 0, yMax: 100, tipUnit: '%', xFmt: (t) => CH.fmtDate(t, 'q') });

  // long-run gross margin
  (function () {
    const fyDate = (lab, cal) => (lab.startsWith('FY') ? `20${lab.slice(2)}-06-30` : `${lab}-12-31`);
    const S = [
      { name: 'Seagate', color: COL.STX, points: D.longrun.STX.map(([l, v]) => [fyDate(l), v]) },
      { name: 'Western Digital', color: COL.WDC, points: D.longrun.WDC.map(([l, v]) => [fyDate(l), v]) },
      { name: 'NAND (SanDisk → Sandisk)', color: COL.SNDK, points: D.longrun.NAND.filter(([l]) => !l.startsWith('FY')).map(([l, v]) => [fyDate(l), v]) },
      { name: 'Sandisk', color: COL.SNDK, hideLegend: true, points: D.longrun.NAND.filter(([l]) => l.startsWith('FY')).map(([l, v]) => [fyDate(l), v]) },
    ];
    CH.register($('#chLongGM'), CH.line, { series: S, yMin: 0, yMax: 80, yUnit: '%', tipUnit: '%', xFmt: (t) => new Date(t).getUTCFullYear() + '', hlines: [{ y: 37.3, label: 'HDD peak 2009–24: 37%' }], dotsAll: true });
  })();

  // price index (log), base = first Sandisk week
  (function () {
    const base = '2025-02-24';
    const S = TICKS.map((t) => {
      const pts = D.px[t].filter((p) => p[0] >= base);
      const b = pts[0][1];
      return { name: NAMES[t], color: COL[t], points: pts.map((p) => [p[0], +(p[1] / b).toFixed(3)]) };
    });
    CH.register($('#chPx'), CH.line, { series: S, yLog: true, yMin: 0.5, yFmt: (v) => (v >= 1 ? '$' + CH.fmtNum(v) : '$' + v), tipUnit: '×', endLabels: true, xFmt: (t) => new Date(t).toISOString().slice(0, 10) });
  })();

  // ------------------------------------------------------------------ thesis charts
  (function () {
    const names = ['Microsoft', 'Alphabet', 'Amazon', 'Meta', 'Oracle'];
    const cols = ['--s1', '--s2', '--s3', '--s4', '--s5'];
    const cats = D.capex.map((r) => `${r.q.slice(4)} '${r.q.slice(2, 4)}`);
    CH.register($('#chCapex'), CH.columns, { cats, stacked: true, totalLabels: true, yUnit: '$B', tipUnit: 'B', series: names.map((n, i) => ({ name: n, color: cols[i], values: D.capex.map((r) => r[n] ?? null) })) });
  })();
  (function () {
    const qOf = (d) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() - 10); return `Q${Math.floor(x.getUTCMonth() / 3) + 1} '${String(x.getUTCFullYear()).slice(2)}`; };
    const all = [...new Set([...D.eb.STX, ...D.eb.WDC].map((r) => r.end).map(qOf))];
    const order = [...new Set([...D.eb.STX, ...D.eb.WDC].sort((a, b) => a.end.localeCompare(b.end)).map((r) => qOf(r.end)))];
    const val = (t) => order.map((q) => { const r = D.eb[t].find((x) => qOf(x.end) === q); return r ? r.eb : null; });
    CH.register($('#chEB'), CH.columns, { cats: order, yUnit: 'EB', tipUnit: ' EB', series: [{ name: 'Seagate', color: COL.STX, values: val('STX') }, { name: 'Western Digital', color: COL.WDC, values: val('WDC') }] });
    CH.register($('#chPTB'), CH.line, { yMin: 10, yMax: 18, yUnit: '$/TB', yFmt: (v) => '$' + v, tipUnit: '', xFmt: (t) => CH.fmtDate(t, 'q'), series: [
      { name: 'Seagate', color: COL.STX, dots: true, points: D.eb.STX.map((r) => [r.end, r.usd_tb]) },
      { name: 'Western Digital', color: COL.WDC, dots: true, points: D.eb.WDC.map((r) => [r.end, r.usd_tb]) }] });
  })();
  CH.register($('#chTokens'), CH.line, { yLog: true, yMin: 1, yUnit: 'T tok/mo', series: [{ name: 'Google monthly tokens', color: '--s1', dots: true, area: false, points: D.tokens.map((r) => [r.d, r.v, r.note]) }], endLabels: false, tipUnit: 'T', xFmt: (t) => CH.fmtDate(t) });

  // frontier scatter
  (function () {
    const labelSet = new Set(['GPT-2 XL', 'GPT-NeoX', 'BLOOM', 'Llama 3.1 405B', 'Kimi K3']);
    const pts = D.frontier.map((f) => ({ x: f.d, y: f.b, name: f.name, tip: `${f.b >= 1000 ? (f.b / 1000).toFixed(2) + 'T' : f.b + 'B'} parameters · released ${f.d}`, label: labelSet.has(f.name) ? f.name : '', left: ['Kimi K3', 'Llama 3.1 405B'].includes(f.name), dy: f.name === 'Llama 3.1 405B' ? 16 : 4, mobile: ['GPT-2 XL', 'Kimi K3'].includes(f.name) }));
    CH.register($('#chFrontier'), CH.scatter, { points: pts, yUnit: 'B params', trend: [['2024-07-16', 406], ['2026-06-13', 2780]], height: 320 });
  })();
  CH.register($('#chHFWeights'), CH.columns, { cats: D.hf.filter((r) => r.m >= '2023-01').map((r) => { const [y, m] = r.m.split('-'); return (m === '01' ? "Jan '" + y.slice(2) : ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m] + " '" + y.slice(2)); }), yUnit: 'TB/mo', tipUnit: ' TB', totalLabels: true, series: [{ name: 'New weights', color: '--s1', values: D.hf.filter((r) => r.m >= '2023-01').map((r) => r.weights_tb) }] });
  (function () {
    const last = D.hf[D.hf.length - 1];
    const sum12 = D.hf.slice(-12).reduce((a, r) => a + r.models, 0);
    const tiles = [
      ['Public models on the Hub', '3.09M', `${(sum12 / 1e6).toFixed(2)}M created in the last 12 months`],
      ['Weights stored (safetensors)', `${last.cum_weights_pb.toFixed(1)} PB`, 'Sum over all surviving public repos'],
      ['Public dataset bytes', `${last.cum_data_pb.toFixed(1)} PB`, 'Up from 5.2 PB at end of 2024'],
      ['Largest open model', '2.78T params', 'Kimi K3 (Jun 2026); 5.6 TB per BF16 copy'],
    ];
    $('#hfStats').innerHTML = tiles.map(([l, v, d]) => `<div class="stat"><div class="label">${l}</div><div class="value">${v}</div><div class="delta">${d}</div></div>`).join('');
  })();
  CH.register($('#chBytes'), CH.hbars, { log: true, ml: 230, rows: C.bytes.map((b, i) => ({ ...b, color: i < 5 ? '--s1' : i < 7 ? '--s4' : '--s7' })), tickFmt: (v) => { const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']; let i = 0; while (v >= 1000 && i < 5) { v /= 1000; i++; } return v + ' ' + u[i]; } });

  // calculator
  (function () {
    const ctl = [
      { id: 'n', label: 'AI video clips generated / day', min: 1, max: 5000, step: 1, val: 1000, fmt: (v) => (v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'B' : v + 'M'), hint: 'Millions. For scale, ~500 hours of video is uploaded to YouTube every minute (≈ 4M 10-s clips/day)' },
      { id: 's', label: 'Clip length (seconds)', min: 2, max: 120, step: 1, val: 10, fmt: (v) => v + ' s' },
      { id: 'r', label: 'Resolution / bitrate', min: 0, max: 3, step: 1, val: 2, fmt: (v) => ['720p · 4 Mbps', '1080p · 8 Mbps', '4K · 40 Mbps', '4K ProRes · 700 Mbps'][v] },
      { id: 'k', label: 'Share retained long-term', min: 1, max: 100, step: 1, val: 100, fmt: (v) => v + '%' },
      { id: 'o', label: 'Storage overhead (replicas / erasure coding)', min: 1, max: 3, step: 0.1, val: 1.5, fmt: (v) => v.toFixed(1) + '×' },
    ];
    const mbps = [4, 8, 40, 700];
    $('#calcControls').innerHTML = ctl.map((c) => `<div class="ctl"><label for="c_${c.id}">${c.label}<b id="v_${c.id}"></b></label><input type="range" id="c_${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.val}">${c.hint ? `<div class="hint">${c.hint}</div>` : ''}</div>`).join('');
    function calc() {
      const v = {}; ctl.forEach((c) => { v[c.id] = +$('#c_' + c.id).value; $('#v_' + c.id).textContent = c.fmt(v[c.id]); });
      const bytesDay = v.n * 1e6 * v.s * (mbps[v.r] * 1e6 / 8) * (v.k / 100) * v.o;
      const ebYr = (bytesDay * 365) / 1e18;
      const shareHDD = (ebYr / 1900) * 100, shareGrowth = (ebYr / 400) * 100;
      $('#calcResults').innerHTML = [
        ['Storage per year', ebYr >= 1 ? ebYr.toFixed(1) + ' EB' : (ebYr * 1000).toFixed(0) + ' PB'],
        ['Share of annual HDD shipments', shareHDD.toFixed(shareHDD < 1 ? 2 : 1) + '%'],
        ['Share of one year\'s shipment growth', shareGrowth.toFixed(shareGrowth < 1 ? 2 : 1) + '%'],
      ].map(([l, x]) => `<div class="stat"><div class="label">${l}</div><div class="value" style="font-size:22px">${x}</div></div>`).join('');
      $('#calcNote').textContent = shareHDD < 2
        ? 'At these settings AI video output is small next to industry shipments. It matters at the margin (see the share of annual growth), but volumes would need to rise 10× or more before it becomes a primary driver by itself.'
        : shareHDD < 10
          ? 'At these settings AI video output is a meaningful incremental driver, a real slice of each year\'s ~400 EB of shipment growth.'
          : 'At these settings AI video output alone would be a primary driver of storage demand, a large share of total industry shipments.';
    }
    ctl.forEach((c) => $('#c_' + c.id).addEventListener('input', calc));
    calc();
  })();

  // Civitai
  (function () {
    const V = D.civitai.versions, I = D.civitai.images;
    CH.register($('#chCivitai'), CH.line, { yUnit: 'M', series: [
      { name: 'Model versions (cumulative)', color: '--s1', points: V.map(([d, v]) => [d, +(v / 1e6).toFixed(3)]) },
      { name: 'Images posted ÷ 50', color: '--s2', points: I.map(([d, v]) => [d, +(v / 50e6).toFixed(3)]) },
    ], tipUnit: 'M', xFmt: (t) => new Date(t).toISOString().slice(0, 10) });
    // monthly rates by interpolating cumulative counters at month starts
    function monthly(pts) {
      const P = pts.map(([d, v]) => [new Date(d).getTime(), v]);
      const at = (t) => { for (let i = 1; i < P.length; i++) if (P[i][0] >= t) { const a = P[i - 1], b = P[i]; return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]); } return null; };
      const out = [];
      for (let y = 2023; y <= 2026; y++) for (let m = 0; m < 12; m++) {
        const t0 = Date.UTC(y, m, 1), t1 = Date.UTC(y, m + 1, 1);
        if (t0 < P[0][0] || t1 > P[P.length - 1][0]) continue;
        out.push([new Date(t0 + 14 * 864e5).toISOString().slice(0, 10), +(((at(t1) - at(t0)) / 1000).toFixed(1))]);
      }
      return out;
    }
    // smooth to 3-month averages to remove sampling noise
    const smooth = (a) => a.map((p, i) => { const w = a.slice(Math.max(0, i - 1), i + 2); return [p[0], +(w.reduce((s, q) => s + q[1], 0) / w.length).toFixed(1)]; });
    CH.register($('#chRates'), CH.line, { yUnit: 'K/mo', tipUnit: 'K', series: [
      { name: 'Civitai model versions / mo', color: '--s1', points: smooth(monthly(V)) },
      { name: 'Hugging Face new models / mo', color: '--s2', points: D.hf.filter((r) => r.m >= '2023-01').map((r) => [r.m + '-15', +(r.models / 1000).toFixed(1)]) },
    ] });
  })();
  // video datasets come from a separate aggregation embedded here to keep data.js lean
  (function () {
    const vd = [['2024-01', 34], ['2024-04', 57], ['2024-07', 108], ['2024-10', 85], ['2025-01', 524], ['2025-04', 2002], ['2025-07', 3084], ['2025-10', 3707], ['2026-01', 5565], ['2026-02', 4841], ['2026-03', 5573], ['2026-04', 5718], ['2026-05', 9500], ['2026-06', 7316], ['2026-07', 8624], ['2026-08', 8106]];
    const host = $('#chVideoHF');
    const rec = { series: [
      { name: 'Video-generation models', color: '--s1', points: D.hf.filter((r) => r.m >= '2024-01').map((r) => [r.m + '-15', r.video_models]) },
      { name: 'Video-tagged datasets', color: '--s2', points: vd.map(([m, v]) => [m + '-15', v]) },
    ], yLog: true, yMin: 1, yUnit: 'repos/mo' };
    CH.register(host, CH.line, rec);
  })();
  CH.register($('#chHFData'), CH.line, { yUnit: 'PB', tipUnit: ' PB', series: [
    { name: 'Datasets (cumulative)', color: '--s1', area: true, points: D.hf.map((r) => [r.m + '-15', r.cum_data_pb]) },
    { name: 'Model weights (cumulative)', color: '--s2', points: D.hf.map((r) => [r.m + '-15', r.cum_weights_pb]) },
  ] });

  // ------------------------------------------------------------------ exec charts
  CH.register($('#chVis'), CH.line, { step: true, yMin: 0, yMax: 60, yUnit: 'months', tipUnit: ' months', xMax: '2026-09-25', height: 280,
    series: TICKS.map((t) => ({ name: NAMES[t], color: COL[t], dots: true, points: C.visibility[t].map(([d, v, n]) => [d, v, n]) })), xFmt: (t) => 'Call on or before ' + new Date(t).toISOString().slice(0, 10) });
  CH.register($('#chBeat'), CH.columns, { cats: C.beats.cats, yUnit: '% beat', tipUnit: '%', series: TICKS.map((t) => ({ name: NAMES[t], color: COL[t], values: C.beats[t] })) });
  (function () {
    const months = [];
    for (let d = new Date(Date.UTC(2025, 9, 1)); d <= new Date(Date.UTC(2026, 8, 1)); d.setUTCMonth(d.getUTCMonth() + 1)) months.push(d.toISOString().slice(0, 7));
    CH.register($('#chInsider'), CH.columns, { stacked: true, totalLabels: 'all', yUnit: '$M', tipUnit: 'M', cats: months.map((m) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m.slice(5) - 1] + " '" + m.slice(2, 4)),
      series: TICKS.map((t) => ({ name: NAMES[t], color: COL[t], values: months.map((m) => D.insider[t][m] || 0) })) });
  })();
  (function () {
    const themes = ['AI', 'inference', 'agentic', 'physical AI', 'KV cache', 'video', 'open source', 'LTA/NBM', 'visibility', 'pricing', 'allocation', 'tight supply', 'cyclical', 'HAMR'];
    const keys = Object.keys(D.kw).sort((a, b) => a.localeCompare(b));
    const order = ['sndk', 'stx', 'wdc'];
    const rows = [], vals = [];
    let prev = null; const seps = [];
    order.forEach((co) => keys.filter((k) => k.startsWith(co + '_')).forEach((k) => {
      const r = D.kw[k]; const y = k.slice(-6, -2), q = k.slice(-1);
      if (prev && prev !== co) seps.push(rows.length);
      prev = co;
      rows.push(`${co.toUpperCase()} FY${y.slice(2)} Q${q}`);
      vals.push(themes.map((th) => +(r[th] / r.words * 1e4).toFixed(1)));
    }));
    const hdrs = themes.map((t) => t === 'HAMR' ? 'HAMR/ Mozaic' : t);
    CH.heatmap($('#chHeat'), { rows, cols: hdrs, values: vals, max: 30, fmt: (v) => (v >= 10 ? v.toFixed(0) : v.toFixed(1)), unit: 'mentions per 10k words', rowClass: (i) => (seps.includes(i) ? 'sep' : '') });
  })();

  // quotes
  (function () {
    const opts = ['All', 'SNDK', 'STX', 'WDC'];
    let cur = 'All';
    function draw() {
      $('#quoteTabs').innerHTML = opts.map((o) => `<button type="button" aria-pressed="${o === cur}" data-q="${o}">${o === 'All' ? 'All' : NAMES[o]}</button>`).join('');
      $('#quotes').innerHTML = C.quotes.filter((q) => cur === 'All' || q.co === cur).map((q) => `<div class="quote" style="--c:var(${COL[q.co]})"><q>${esc(q.q)}</q><div class="who">${esc(q.who)}, ${NAMES[q.co]} · ${esc(q.when)}<span class="tag">${esc(q.tag)}</span></div></div>`).join('');
      $('#quoteTabs').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { cur = b.dataset.q; draw(); }));
    }
    draw();
  })();
  $('#targetsTable').innerHTML = '<table class="data"><thead><tr><th></th>' + TICKS.map((t) => `<th style="text-align:left">${NAMES[t]}</th>`).join('') + '</tr></thead><tbody>' +
    C.targets.map((r) => `<tr><td><b>${r[0]}</b></td>${r.slice(1).map((c) => `<td class="wrap">${esc(c)}</td>`).join('')}</tr>`).join('') + `</tbody></table><p class="small muted" style="margin:8px 12px">${esc(C.targetsNote)}</p>`;

  // ------------------------------------------------------------------ company panels
  (function () {
    const tabs = $('#coTabs'), panels = $('#coPanels');
    tabs.innerHTML = TICKS.map((t, i) => `<button role="tab" type="button" aria-selected="${i === 0}" data-t="${t}"><span class="swatch" style="--c:var(${COL[t]})"></span>${NAMES[t]} (${t})</button>`).join('');
    panels.innerHTML = TICKS.map((t, i) => {
      const x = C.companies[t], c = M.COMPANIES[t];
      const r = ['bear', 'base', 'bull'].map((k) => [k, M.run(t, c.presets[k], k)]);
      return `<div class="panel" role="tabpanel" data-t="${t}" ${i ? 'hidden' : ''}>
        <div class="grid g2">
          <div class="card" style="border-top:4px solid var(${COL[t]})">
            <h3>${NAMES[t]}: ${esc(x.rating)}</h3>
            <p class="ink2">${esc(x.what)}</p>
            <h4>Key facts from the filings</h4>
            <ul class="tight">${x.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
            <h4>What changed</h4>
            <p class="ink2">${esc(x.changed)}</p>
          </div>
          <div class="card">
            <h3>Investability scorecard</h3>
            <div class="sub">1–5, my judgment from the evidence on this page</div>
            ${Object.entries(x.scores).map(([k, v]) => `<div class="scoreline" style="--c:var(${COL[t]})"><span class="lbl">${k}</span><span class="bar"><i style="width:${v * 20}%"></i></span><span class="n">${v}</span></div>`).join('')}
            <h4 style="margin-top:14px">5-year scenarios (from the model)</h4>
            <div class="tablewrap" style="border:0"><table class="data"><thead><tr><th>FY31</th><th>Gross margin</th><th>EPS</th><th>Price</th><th>Per year</th></tr></thead><tbody>
            ${r.map(([k, o]) => { const y = o.years[4]; return `<tr><td>${k[0].toUpperCase() + k.slice(1)}</td><td>${y.gm.toFixed(0)}%</td><td>$${y.eps.toFixed(0)}</td><td>${fmtUSD(o.px5)}</td><td class="${sign(o.cagr5)}">${pct(o.cagr5, 1)}</td></tr>`; }).join('')}
            </tbody></table></div>
          </div>
          <div class="card"><h3>Bull case</h3><ul class="tight">${x.bull.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>
          <div class="card"><h3>Bear case</h3><ul class="tight">${x.bear.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>
        </div>
      </div>`;
    }).join('');
    tabs.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      tabs.querySelectorAll('button').forEach((x) => x.setAttribute('aria-selected', x === b));
      panels.querySelectorAll('.panel').forEach((p) => (p.hidden = p.dataset.t !== b.dataset.t));
    }));
  })();

  // ------------------------------------------------------------------ valuation model UI
  (function () {
    let tk = 'WDC', kind = 'base';
    const state = {};
    TICKS.forEach((t) => (state[t] = { ...M.COMPANIES[t].presets.base, kind: 'base' }));
    const defs = [
      { k: 'vol', l: (u) => `${u === 'bit' ? 'Bit' : 'Exabyte'} growth, avg %/yr`, min: 0, max: 40, step: 1, h: 'Management: Seagate/WD mid-20s, Sandisk mid-to-high teens' },
      { k: 'p1', l: (u) => `Price per ${u === 'bit' ? 'GB' : 'TB'}, year 1`, min: -50, max: 30, step: 1, h: 'FY27; mostly contracted already' },
      { k: 'p2', l: () => 'Price change, year 2', min: -60, max: 30, step: 1, h: 'FY28; where a down-cycle would bite first' },
      { k: 'p3', l: () => 'Price change, years 3–5 avg', min: -30, max: 20, step: 1, h: 'Historically HDD −5 to −10%/yr, NAND −20 to −30%/yr' },
      { k: 'gm2', l: () => 'Gross margin, year 2 (%)', min: 15, max: 90, step: 1, h: '' },
      { k: 'gm5', l: () => 'Gross margin, year 5 (%)', min: 15, max: 90, step: 1, h: 'History: HDD 14–37%, NAND 2–47%' },
      { k: 'pe', l: () => 'Exit P/E (×)', min: 5, max: 40, step: 0.5, h: 'Applied to year-3 and year-5 EPS' },
      { k: 'bb', l: () => 'Net share count reduction %/yr', min: 0, max: 10, step: 0.5, h: 'Buybacks net of dilution' },
    ];
    $('#mTabs').innerHTML = TICKS.map((t) => `<button role="tab" type="button" data-t="${t}" aria-selected="${t === tk}"><span class="swatch" style="--c:var(${COL[t]})"></span>${NAMES[t]}</button>`).join('');
    $('#mTabs').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { tk = b.dataset.t; $('#mTabs').querySelectorAll('button').forEach((x) => x.setAttribute('aria-selected', x === b)); build(); }));
    function presetBar() {
      const s = state[tk];
      $('#mPresets').innerHTML = ['bear', 'base', 'bull'].map((k) => `<button type="button" data-k="${k}" aria-pressed="${s.kind === k && !s.custom}">${k === 'base' ? 'Base (likely)' : k[0].toUpperCase() + k.slice(1)}</button>`).join('') + (s.custom ? '<span class="pill" style="margin-left:6px">Custom</span>' : '');
      $('#mPresets').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { state[tk] = { ...M.COMPANIES[tk].presets[b.dataset.k], kind: b.dataset.k }; build(); }));
    }
    function build() {
      const c = M.COMPANIES[tk], s = state[tk];
      presetBar();
      $('#mControls').innerHTML = defs.map((d) => `<div class="ctl"><label for="m_${d.k}">${d.l(c.unit)}<b id="mv_${d.k}"></b></label><input type="range" id="m_${d.k}" min="${d.min}" max="${d.max}" step="${d.step}" value="${s[d.k]}">${d.h ? `<div class="hint">${d.h}</div>` : ''}</div>`).join('') +
        `<div class="ctl"><div class="hint">Start (run-rate): revenue $${(c.start.rev / 1000).toFixed(1)}B, gross margin ${c.start.gm}%, opex $${(c.start.opex / 1000).toFixed(2)}B growing ${c.opexGrowth}%/yr, ${c.start.shares}M diluted shares, tax ${c.start.tax}%. ${s.kind === 'bear' ? 'Bear preset: unit growth is zero in year 2 (digestion), with the average carried by the other years.' : ''}</div></div>`;
      defs.forEach((d) => $('#m_' + d.k).addEventListener('input', (e) => { s[d.k] = +e.target.value; s.custom = true; presetBar(); calc(); }));
      calc();
    }
    function calc() {
      const c = M.COMPANIES[tk], s = state[tk];
      defs.forEach((d) => { const v = s[d.k]; $('#mv_' + d.k).textContent = ['vol', 'p1', 'p2', 'p3'].includes(d.k) ? pct(v) : d.k === 'pe' ? v + '×' : d.k === 'bb' ? v + '%' : v + '%'; });
      const r = M.run(tk, s, s.kind);
      const y5 = r.years[4];
      $('#mResults').innerHTML = [
        ['Price today', fmtUSD(c.price), ''],
        ['FY29 (3-yr) implied', fmtUSD(r.px3), `<span class="${sign(r.cagr3)}">${pct(r.cagr3, 1)}/yr</span>`],
        ['FY31 (5-yr) implied', fmtUSD(r.px5), `<span class="${sign(r.cagr5)}">${pct(r.cagr5, 1)}/yr</span>`],
        ['FY31 EPS', fmtUSD(y5.eps, 2), `vs run-rate ${fmtUSD(M.runRateEps(tk), 2)}`],
      ].map(([l, v, d]) => `<div class="stat"><div class="label">${l}</div><div class="value" style="font-size:22px">${v}</div><div class="delta">${d}</div></div>`).join('');
      const pts = [['2026-09-23', c.price]].concat(r.years.map((y, i) => [`${2027 + i}-07-01`, +(y.eps * s.pe).toFixed(0)]));
      CH.line($('#chModel'), { height: 220, series: [{ name: 'Implied price (EPS × exit P/E)', color: COL[tk], dots: true, points: pts }], hlines: [{ y: c.price, label: 'today ' + fmtUSD(c.price) }], yFmt: (v) => '$' + CH.fmtNum(v), xFmt: (t) => { const d = new Date(t); return d.getUTCFullYear() === 2026 ? 'Today' : 'FY' + d.getUTCFullYear(); } });
      $('#mTable').innerHTML = '<table class="data"><thead><tr><th>' + NAMES[tk] + '</th><th>Run-rate</th>' + r.years.map((y, i) => `<th>FY${27 + i}</th>`).join('') + '</tr></thead><tbody>' +
        `<tr><td>Revenue</td><td>$${(c.start.rev / 1000).toFixed(1)}B</td>${r.years.map((y) => `<td>$${(y.rev / 1000).toFixed(1)}B</td>`).join('')}</tr>` +
        `<tr><td>Gross margin</td><td>${c.start.gm}%</td>${r.years.map((y) => `<td>${y.gm.toFixed(1)}%</td>`).join('')}</tr>` +
        `<tr><td>Operating margin</td><td>${(((c.start.rev * c.start.gm / 100 - c.start.opex) / c.start.rev) * 100).toFixed(1)}%</td>${r.years.map((y) => `<td>${y.opm.toFixed(1)}%</td>`).join('')}</tr>` +
        `<tr><td>Net income</td><td>–</td>${r.years.map((y) => `<td>$${(y.ni / 1000).toFixed(1)}B</td>`).join('')}</tr>` +
        `<tr><td>Diluted shares</td><td>${c.start.shares}M</td>${r.years.map((y) => `<td>${y.shares.toFixed(0)}M</td>`).join('')}</tr>` +
        `<tr><td>EPS</td><td>${fmtUSD(M.runRateEps(tk), 2)}</td>${r.years.map((y) => `<td>${fmtUSD(y.eps, 2)}</td>`).join('')}</tr>` +
        `<tr><td>Implied price at ${s.pe}×</td><td>${fmtUSD(c.price)}</td>${r.years.map((y) => `<td>${fmtUSD(y.eps * s.pe)}</td>`).join('')}</tr>` +
        '</tbody></table>';
    }
    build();
  })();

  // scenario summary with editable probabilities
  (function () {
    const probs = {}; TICKS.forEach((t) => (probs[t] = { ...M.COMPANIES[t].probs }));
    function draw() {
      let h = '<div class="tablewrap" style="border:0"><table class="data"><thead><tr><th>Company</th><th>Bear 5-yr</th><th>Base 5-yr</th><th>Bull 5-yr</th><th>Weights bear / base / bull (%)</th><th>Weighted 3-yr</th><th>Weighted 5-yr</th></tr></thead><tbody>';
      TICKS.forEach((t) => {
        const c = M.COMPANIES[t];
        const r = { bear: M.run(t, c.presets.bear, 'bear'), base: M.run(t, c.presets.base, 'base'), bull: M.run(t, c.presets.bull, 'bull') };
        const w = M.weighted(t, c.presets, probs[t]);
        const inp = (k) => `<input type="number" min="0" max="100" step="5" value="${probs[t][k]}" data-t="${t}" data-k="${k}" aria-label="${NAMES[t]} ${k} weight" style="width:56px;font:inherit;padding:2px 4px;background:var(--surface-2);color:var(--ink);border:1px solid var(--border);border-radius:6px">`;
        const cell = (o) => `<td><span class="${sign(o.cagr5)}">${pct(o.cagr5, 1)}</span> <span class="muted small">(${fmtUSD(o.px5)})</span></td>`;
        h += `<tr><td><span class="dotc" style="--c:var(${COL[t]})"></span>${NAMES[t]}</td>${cell(r.bear)}${cell(r.base)}${cell(r.bull)}<td>${inp('bear')} ${inp('base')} ${inp('bull')}</td><td class="${sign(w.cagr3)}">${pct(w.cagr3, 1)}</td><td class="${sign(w.cagr5)}"><b>${pct(w.cagr5, 1)}</b></td></tr>`;
      });
      $('#scenarioTable').innerHTML = h + '</tbody></table></div><p class="small muted" style="margin-top:6px">Annualized from Sep 23, 2026 prices, including current dividend yield. Price in parentheses = implied FY31 share price. Weights don\'t need to sum to 100; they are normalized.</p>';
      $('#scenarioTable').querySelectorAll('input').forEach((i) => i.addEventListener('change', () => { probs[i.dataset.t][i.dataset.k] = Math.max(0, +i.value || 0); draw(); }));
    }
    draw();
  })();

  // signposts
  $('#signposts').innerHTML = '<table class="data"><thead><tr><th>Signal</th><th style="text-align:left">Where to look</th><th style="text-align:left">Bullish if</th><th style="text-align:left">Bearish if</th><th style="text-align:left">Reading today</th></tr></thead><tbody>' +
    C.signposts.map((r) => `<tr><td><b>${esc(r[0])}</b></td>${r.slice(1).map((c) => `<td class="wrap sp">${esc(c)}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
})();
