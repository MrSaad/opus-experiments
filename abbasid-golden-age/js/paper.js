'use strict';
// Paper-cutout drawing core: every shape is a polygon with slightly torn,
// "boiling" edges and a flat drop shadow, like layered cut paper.

const W = 1280, H = 720;
let ctx = null;
let SCALE = 1;   // device pixels per logical unit
let BOIL = 0;    // edge wobble frame (updates ~6x per second, stop-motion feel)
let SEED = 0;    // per-shape counter so each shape keeps its own wobble

const F_EN = '"Cormorant Garamond", Georgia, "Times New Roman", serif';
const F_AR = 'Amiri, "Noto Naskh Arabic", "Times New Roman", serif';

// Palette drawn from the period: lapis & turquoise tilework, saffron, terracotta
// brick, gilding, date-palm greens, Tigris water and unbleached paper.
const PAL = {
  ink: '#2b1d14', paper: '#f3e7cc', cream: '#f6ecd6', white: '#faf4e4',
  sand: '#e6cf9f', sandDk: '#cfae74', ochre: '#c98a3b', saffron: '#e3a72f',
  gold: '#d6a94a', goldDk: '#a57a2c', terracotta: '#b8552f', brick: '#8f3c25',
  rose: '#c7695a', pomegranate: '#a8322d', lapis: '#1f3d73', lapisDk: '#172d56',
  indigo: '#141c38', turq: '#2f8f89', turqLt: '#6cbcae', palm: '#4e6a3a',
  palmDk: '#3a5230', olive: '#76803f', skin: '#c08a5f', wood: '#7a4a2b',
  woodDk: '#4f2f1c', black: '#231d20',
};
const SHADOW = 'rgba(45,22,8,0.28)';

// ---------- math ----------
const fract = x => x - Math.floor(x);
const h1 = n => fract(Math.sin(n * 12.9898 + 78.233) * 43758.5453);
const rand = (i, k = 0) => h1(i * 31.7 + k * 7.13 + 0.5);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeInOut = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

// ---------- colour ----------
const _rgb = {};
function rgb(hex) {
  let c = _rgb[hex];
  if (!c) { const n = parseInt(hex.slice(1), 16); c = _rgb[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  return c;
}
function mixHex(a, b, t) {
  const A = rgb(a), B = rgb(b); t = clamp(t);
  const c = i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0');
  return '#' + c(0) + c(1) + c(2);
}
const mix = (a, b, t) => mixHex(a, b, t);
const shade = (hex, k) => mixHex(hex, '#1a0f08', k);
const tint = (hex, k) => mixHex(hex, '#fff6e0', k);
function alpha(hex, a) { const c = rgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

// ---------- geometry ----------
function R(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }

function E(cx, cy, rx, ry, n = 28, a0 = 0, a1 = Math.PI * 2) {
  const full = Math.abs(a1 - a0) >= Math.PI * 2 - 1e-6;
  const pts = [], cnt = full ? n : n + 1;
  for (let i = 0; i < cnt; i++) {
    const a = a0 + (a1 - a0) * i / n;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}
const C = (cx, cy, r, n) => E(cx, cy, r, r, n || Math.max(10, Math.round(r / 2)));

// Pointed (two-centred) arch: apex at y, bottom at y + h.
function arch(x, y, w, h, f = 0.72, n = 12) {
  const r = w * f, th = Math.acos((0.5 - f) / f), sy = y + r * Math.sin(th);
  const pts = [[x, y + h], [x, sy]];
  for (let i = 1; i <= n; i++) { const a = Math.PI - (Math.PI - th) * i / n; pts.push([x + r + r * Math.cos(a), sy - r * Math.sin(a)]); }
  for (let i = 1; i <= n; i++) { const a = (Math.PI - th) * (1 - i / n); pts.push([x + w - r + r * Math.cos(a), sy - r * Math.sin(a)]); }
  pts.push([x + w, y + h]);
  return pts;
}

// Slightly bulbous pointed dome sitting on base line by.
function dome(cx, by, w, h, n = 14) {
  const L = [], Rt = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const r = (w / 2) * Math.pow(Math.cos(t * Math.PI / 2), 0.75) * (1 + 0.14 * Math.sin(t * Math.PI));
    L.push([cx - r, by - h * t]); Rt.push([cx + r, by - h * t]);
  }
  return L.concat(Rt.reverse());
}

function star(n, cx, cy, r1, r2, rot = 0) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1, a = rot + i * Math.PI / n - Math.PI / 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

function chamfer(x, y, w, h, c) {
  return [[x + c, y], [x + w - c, y], [x + w, y + c], [x + w, y + h - c], [x + w - c, y + h], [x + c, y + h], [x, y + h - c], [x, y + c]];
}

function rotRect(cx, cy, w, h, rot) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]
    .map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}

// ---------- paper rendering ----------
function rough(pts, amt = 1, step = 16) {
  const seed = ++SEED, out = [], n = pts.length;
  let k = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const segs = Math.max(1, Math.ceil(Math.hypot(dx, dy) / step));
    for (let s = 0; s < segs; s++) {
      const t = s / segs;
      const r1 = h1(seed * 1.37 + k * 0.917 + BOIL * 3.11);
      const r2 = h1(seed * 2.71 + k * 1.173 + BOIL * 5.37 + 11.3);
      out.push([a[0] + dx * t + (r1 - 0.5) * 2 * amt, a[1] + dy * t + (r2 - 0.5) * 2 * amt]);
      k++;
    }
  }
  return out;
}

function trace(pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

// Shadow offset is applied in device space so it stays consistent
// (down and slightly right) even inside rotated / scaled groups.
function shadowPass(fn, depth) {
  const m = ctx.getTransform();
  ctx.save();
  ctx.setTransform(m.a, m.b, m.c, m.d, m.e + depth * 0.7 * SCALE, m.f + depth * SCALE);
  fn();
  ctx.restore();
}

function paper(pts, color, depth = 3, amt = 1) {
  const r = rough(pts, amt);
  if (depth > 0) shadowPass(() => { trace(r); ctx.fillStyle = SHADOW; ctx.fill(); }, depth);
  trace(r);
  ctx.fillStyle = color;
  ctx.fill();
  return r;
}

function paperGroup(list, color, depth = 3, amt = 1) {
  const rs = list.map(p => rough(p, amt));
  if (depth > 0) shadowPass(() => { ctx.fillStyle = SHADOW; for (const r of rs) { trace(r); ctx.fill(); } }, depth);
  ctx.fillStyle = color;
  for (const r of rs) { trace(r); ctx.fill(); }
}

// Thick straight strip between two points (poles, legs, spars).
function seg(x1, y1, x2, y2, w, col, depth = 2) {
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l * w / 2, ny = dx / l * w / 2;
  paper([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]], col, depth, 0.4);
}

// Stroked outline (rings, strings) with a paper shadow.
function strokePts(pts, color, lw, depth = 2, closed = true, amt = 0.6) {
  const r = rough(pts, amt);
  const draw = () => {
    ctx.beginPath(); ctx.moveTo(r[0][0], r[0][1]);
    for (let i = 1; i < r.length; i++) ctx.lineTo(r[i][0], r[i][1]);
    if (closed) ctx.closePath();
    ctx.stroke();
  };
  ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (depth > 0) shadowPass(() => { ctx.strokeStyle = SHADOW; draw(); }, depth);
  ctx.strokeStyle = color; draw();
}

function text(str, x, y, o = {}) {
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.font = o.font || `24px ${F_EN}`;
  ctx.fillStyle = o.color || PAL.ink;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.base || 'middle';
  if (o.spacing && 'letterSpacing' in ctx) ctx.letterSpacing = o.spacing + 'px';
  if (o.shadow) {
    ctx.fillStyle = o.shadow; ctx.fillText(str, x + 1.5, y + 2);
    ctx.fillStyle = o.color || PAL.ink;
  }
  ctx.fillText(str, x, y);
  ctx.restore();
}

// Horizontal band with a gently waving top edge (sky layers, water).
function band(y, amp, freq, phase, color, depth = 3) {
  const pts = [[-20, H + 20]];
  for (let x = -20; x <= W + 20; x += 40) pts.push([x, y + Math.sin(x * freq + phase) * amp]);
  pts.push([W + 20, H + 20]);
  paper(pts, color, depth, 0.8);
}
