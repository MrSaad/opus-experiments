// Procedurally generated canvas textures, so the site has no binary assets.
import * as THREE from 'three';

export function rng(seed) {
  // mulberry32
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c, { repeat = true, srgb = true, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  return t;
}

function grey(v) { v = Math.max(0, Math.min(255, v | 0)); return `rgb(${v},${v},${v})`; }

// Black rubber gym flooring, one 1 m tile per texture repeat.
export function rubberTexture() {
  const [c, g] = canvas(512, 512);
  const r = rng(11);
  g.fillStyle = '#1c1c1e'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(60,60,64,0.55)' : 'rgba(8,8,9,0.6)';
    g.fillRect(r() * 512, r() * 512, 1.5, 1.5);
  }
  // Subtle scuffs
  for (let i = 0; i < 25; i++) {
    g.strokeStyle = 'rgba(80,80,85,0.08)'; g.lineWidth = 6 + r() * 12;
    g.beginPath(); const x = r() * 512, y = r() * 512;
    g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 200, y + (r() - 0.5) * 60); g.stroke();
  }
  g.strokeStyle = '#0b0b0c'; g.lineWidth = 3; g.strokeRect(0, 0, 512, 512);
  return toTexture(c, { aniso: 8 });
}

// Grey slate tiles for the lobby and corridor. One repeat = 2.4 m.
export function slateTexture() {
  const [c, g] = canvas(1024, 1024);
  const r = rng(22);
  const s = 1024 / 4; // 0.6 m tiles
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const v = 88 + r() * 26;
      g.fillStyle = grey(v); g.fillRect(col * s, row * s, s, s);
      for (let i = 0; i < 40; i++) { // streaks in the stone
        g.strokeStyle = `rgba(${r() < 0.5 ? '40,40,44' : '150,150,155'},${0.05 + r() * 0.07})`;
        g.lineWidth = 1 + r() * 4;
        const y = row * s + r() * s;
        g.beginPath(); g.moveTo(col * s, y); g.lineTo(col * s + s, y + (r() - 0.5) * 40); g.stroke();
      }
    }
  }
  for (let i = 0; i < 12000; i++) {
    g.fillStyle = `rgba(0,0,0,${r() * 0.12})`; g.fillRect(r() * 1024, r() * 1024, 2, 2);
  }
  g.strokeStyle = '#3c3d40'; g.lineWidth = 3;
  for (let i = 0; i <= 4; i++) {
    g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, i * s); g.lineTo(1024, i * s); g.stroke();
  }
  return toTexture(c, { aniso: 8 });
}

// Charcoal horizontal tiles of the elevator wall. One repeat = 1.2 m.
export function darkTileTexture() {
  const [c, g] = canvas(512, 512);
  const r = rng(33);
  const rows = 8, th = 512 / rows, tw = 256;
  for (let row = 0; row < rows; row++) {
    const off = (row % 2) * tw / 2;
    for (let col = -1; col < 3; col++) {
      const v = 36 + r() * 12;
      const x = col * tw + off;
      const grd = g.createLinearGradient(x, 0, x + tw, 0);
      grd.addColorStop(0, grey(v)); grd.addColorStop(1, grey(v + 6));
      g.fillStyle = grd; g.fillRect(x, row * th, tw, th);
    }
  }
  g.fillStyle = '#18181a';
  for (let row = 0; row <= rows; row++) g.fillRect(0, row * th - 1, 512, 2);
  for (let row = 0; row < rows; row++) {
    const off = (row % 2) * tw / 2;
    for (let col = 0; col <= 2; col++) g.fillRect(col * tw + off - 1, row * th, 2, th);
  }
  return toTexture(c);
}

export function concreteTexture() {
  const [c, g] = canvas(512, 512);
  const r = rng(44);
  g.fillStyle = '#d6d0c4'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14000; i++) {
    const d = r() < 0.5;
    g.fillStyle = d ? `rgba(120,112,100,${r() * 0.18})` : `rgba(255,255,250,${r() * 0.2})`;
    const s = 1 + r() * 3; g.fillRect(r() * 512, r() * 512, s, s);
  }
  for (let i = 0; i < 60; i++) { // bug holes
    g.fillStyle = 'rgba(90,85,75,0.35)';
    g.beginPath(); g.arc(r() * 512, r() * 512, 1 + r() * 2, 0, 7); g.fill();
  }
  // formwork seams
  g.fillStyle = 'rgba(140,132,120,0.25)'; g.fillRect(0, 255, 512, 2);
  return toTexture(c);
}

// Speckled cork/granite pin board.
export function speckleTexture() {
  const [c, g] = canvas(256, 256);
  const r = rng(55);
  g.fillStyle = '#7d7c79'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(20,20,20,0.6)' : 'rgba(230,230,225,0.6)';
    g.fillRect(r() * 256, r() * 256, 1.5, 1.5);
  }
  return toTexture(c);
}

// The black-and-white harbour map mural in the lobby, with the cove light wash baked in.
export function muralTexture() {
  const W = 2048, H = 1024;
  const [c, g] = canvas(W, H);
  const r = rng(66);
  g.fillStyle = '#e9e8e3'; g.fillRect(0, 0, W, H);
  g.lineCap = 'round';

  // faint contour / shoreline lines
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = `rgba(30,30,30,${0.08 + r() * 0.12})`; g.lineWidth = 1 + r() * 1.5;
    g.beginPath();
    const y0 = 80 + i * 34 + r() * 20;
    g.moveTo(0, y0);
    for (let x = 0; x <= W; x += 64) g.lineTo(x, y0 + Math.sin(x * 0.004 + i) * 30 + (r() - 0.5) * 8);
    g.stroke();
  }
  // fan of railway tracks sweeping across the top
  for (let i = 0; i < 46; i++) {
    g.strokeStyle = `rgba(20,20,20,${0.55 + r() * 0.35})`; g.lineWidth = 1.5 + r() * 1.5;
    g.beginPath();
    g.moveTo(260 + i * 4, H * 0.62);
    g.bezierCurveTo(500 + i * 10, 250 - i * 3, 1100 + i * 6, 60 + i * 5, W + 40, -40 + i * 11);
    g.stroke();
  }
  // radial lines like the feathered pattern top-left
  for (let i = 0; i < 70; i++) {
    g.strokeStyle = 'rgba(25,25,25,0.5)'; g.lineWidth = 1;
    const a = -2.4 + i * 0.022;
    g.beginPath(); g.moveTo(420, 300);
    g.lineTo(420 + Math.cos(a) * (200 + r() * 160), 300 + Math.sin(a) * (200 + r() * 160)); g.stroke();
  }
  // piers and slips: long rectangles filled with stippling
  function stippled(x, y, w, h, rot, density) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.strokeStyle = 'rgba(15,15,15,0.9)'; g.lineWidth = 3; g.strokeRect(-w / 2, -h / 2, w, h);
    g.strokeRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20);
    g.fillStyle = 'rgba(15,15,15,0.75)';
    const n = w * h * density;
    for (let i = 0; i < n; i++) {
      const px = -w / 2 + 12 + r() * (w - 24), py = -h / 2 + 12 + r() * (h - 24);
      g.fillRect(px, py, 2, 2);
    }
    g.restore();
  }
  const piers = [
    [700, 700, 70, 460, 0.02], [820, 690, 90, 480, 0.02], [980, 720, 60, 420, 0.03],
    [1120, 700, 110, 470, 0.02], [1290, 730, 80, 440, 0.01], [1440, 700, 120, 500, 0.02],
    [1620, 720, 70, 450, 0.01], [1780, 700, 100, 480, 0.02], [560, 780, 50, 300, 0.03],
  ];
  for (const p of piers) stippled(p[0], p[1], p[2], p[3], p[4], 0.02 + r() * 0.03);
  // a few boxy buildings
  for (let i = 0; i < 18; i++) {
    const x = 120 + r() * 380, y = 480 + r() * 380, w = 20 + r() * 60, h = 20 + r() * 50;
    g.strokeStyle = 'rgba(20,20,20,0.8)'; g.lineWidth = 2; g.strokeRect(x, y, w, h);
    for (let k = 0; k < w; k += 5) { g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + k, y + h); g.stroke(); }
  }
  // tiny illegible labels
  g.fillStyle = 'rgba(20,20,20,0.7)'; g.font = 'italic 18px Georgia, serif';
  for (let i = 0; i < 24; i++) {
    let s = ''; const n = 4 + (r() * 8 | 0);
    for (let k = 0; k < n; k++) s += String.fromCharCode(97 + (r() * 26 | 0));
    g.save(); g.translate(100 + r() * 1800, 150 + r() * 700); g.rotate((r() - 0.5) * 0.8);
    g.fillText(s, 0, 0); g.restore();
  }
  g.fillStyle = 'rgba(15,15,15,0.85)'; g.font = '64px Georgia, serif';
  const word = 'H  A  R  B  O  U  R';
  g.fillText(word, W * 0.42, H - 50);

  // wall-wash from the ceiling cove: bright at the top, falling off downwards
  const wash = g.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, 'rgba(255,252,245,0.55)');
  wash.addColorStop(0.35, 'rgba(255,252,245,0.1)');
  wash.addColorStop(1, 'rgba(0,0,0,0.12)');
  g.fillStyle = wash; g.fillRect(0, 0, W, H);
  return toTexture(c, { repeat: false, aniso: 8 });
}

// Night city seen through the windows, wrapped round a big cylinder.
export function skylineTexture() {
  const W = 2048, H = 1024;
  const [c, g] = canvas(W, H);
  const r = rng(77);
  const horizon = 500;
  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#04060c'); sky.addColorStop(0.7, '#0c1120'); sky.addColorStop(1, '#2a2432');
  g.fillStyle = sky; g.fillRect(0, 0, W, horizon);
  const ground = g.createLinearGradient(0, horizon, 0, H);
  ground.addColorStop(0, '#12121a'); ground.addColorStop(1, '#040406');
  g.fillStyle = ground; g.fillRect(0, horizon, W, H - horizon);

  function building(x, w, top, bottom, shade, litChance) {
    g.fillStyle = shade; g.fillRect(x, top, w, bottom - top);
    const cols = Math.max(1, (w / 7) | 0), rows = ((bottom - top) / 9) | 0;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      if (r() < litChance) {
        const warm = r() < 0.7;
        g.fillStyle = warm ? `rgba(255,${190 + r() * 50 | 0},${110 + r() * 60 | 0},${0.5 + r() * 0.5})`
                           : `rgba(170,210,255,${0.4 + r() * 0.5})`;
        g.fillRect(x + 2 + i * 7, top + 3 + j * 9, 3, 4);
      }
    }
    if (bottom - top > 260 && r() < 0.6) { g.fillStyle = '#ff2020'; g.fillRect(x + w / 2 - 2, top - 4, 4, 4); }
  }
  // far layer, then near layer
  for (let x = 0; x < W;) {
    const w = 18 + r() * 50; const h = 30 + r() * 150;
    building(x, w, horizon - h, horizon + 40, '#0b0d14', 0.18); x += w + r() * 6;
  }
  for (let x = 0; x < W;) {
    const w = 30 + r() * 80; const h = r() < 0.12 ? 250 + r() * 200 : 40 + r() * 190;
    building(x, w, horizon - h, horizon + 140 + r() * 120, '#07080d', 0.3); x += w + 4 + r() * 30;
  }
  // street lights far below
  for (let i = 0; i < 5000; i++) {
    const y = horizon + 150 + Math.pow(r(), 1.6) * (H - horizon - 150);
    g.fillStyle = r() < 0.8 ? `rgba(255,190,110,${0.3 + r() * 0.6})` : `rgba(255,255,255,${0.3 + r() * 0.5})`;
    g.fillRect(r() * W, y, 2, 2);
  }
  for (let k = 0; k < 18; k++) { // a few long avenues
    const y = horizon + 170 + r() * (H - horizon - 190), slope = (r() - 0.5) * 0.15;
    for (let x = 0; x < W; x += 6) {
      g.fillStyle = 'rgba(255,200,130,0.7)'; g.fillRect(x, y + x * slope % 300, 2, 2);
    }
  }
  const t = toTexture(c, { aniso: 4 });
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

export function screenTexture(kind = 'treadmill') {
  const [c, g] = canvas(256, 160);
  const grd = g.createLinearGradient(0, 0, 256, 160);
  grd.addColorStop(0, '#0a2d73'); grd.addColorStop(1, '#2f86e0');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 160);
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 6;
  g.beginPath(); g.arc(128, 80, 26, 0.3, Math.PI * 2 - 0.3); g.stroke();
  if (kind === 'led') {
    g.fillStyle = '#0a0f0a'; g.fillRect(0, 0, 256, 160);
    g.fillStyle = '#58ff7a'; g.font = 'bold 44px monospace'; g.fillText('0:00', 70, 70);
    g.fillStyle = '#ffb347'; g.fillRect(20, 100, 216, 10);
  }
  return toTexture(c, { repeat: false });
}

export function exitTexture() {
  const [c, g] = canvas(256, 110);
  g.fillStyle = '#e8e6e2'; g.fillRect(0, 0, 256, 110);
  g.fillStyle = '#ff1a1a'; g.font = 'bold 72px Arial, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('EXIT', 128, 58);
  return toTexture(c, { repeat: false });
}

export function paperTexture(seed = 1, { header = false, color = '#f4f2ee' } = {}) {
  const [c, g] = canvas(128, 164);
  const r = rng(seed);
  g.fillStyle = color; g.fillRect(0, 0, 128, 164);
  if (header) { g.fillStyle = '#2d4f7c'; g.fillRect(10, 10, 108, 26); }
  g.fillStyle = 'rgba(40,40,40,0.55)';
  for (let y = header ? 48 : 16; y < 150; y += 9) {
    g.fillRect(12, y, 30 + r() * 74, 3);
  }
  return toTexture(c, { repeat: false });
}

export function plaqueTexture() {
  const [c, g] = canvas(256, 330);
  g.fillStyle = '#d9d7d2'; g.fillRect(0, 0, 256, 330);
  g.strokeStyle = '#5a5a5a'; g.lineWidth = 6; g.strokeRect(3, 3, 250, 324);
  g.fillStyle = '#333'; g.font = 'bold 22px Arial'; g.textAlign = 'center';
  g.fillText('FITNESS CENTRE', 128, 44);
  g.font = '15px Arial'; g.fillText('RULES & REGULATIONS', 128, 68);
  const r = rng(9);
  g.fillStyle = 'rgba(40,40,40,0.6)';
  for (let y = 92; y < 310; y += 12) g.fillRect(24, y, 90 + r() * 118, 4);
  return toTexture(c, { repeat: false });
}

export function clockTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#1b1b1d'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
  g.strokeStyle = '#e8e8e8';
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    g.lineWidth = i % 3 ? 3 : 6;
    g.beginPath(); g.moveTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100);
    g.lineTo(128 + Math.cos(a) * 116, 128 + Math.sin(a) * 116); g.stroke();
  }
  g.lineWidth = 7; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + 50, 128 - 30); g.stroke();
  g.lineWidth = 4; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 - 20, 128 - 88); g.stroke();
  return toTexture(c, { repeat: false });
}

// Vertical white-to-transparent gradient for light-wash planes.
export function glowTexture() {
  const [c, g] = canvas(8, 256);
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 8, 256);
  return toTexture(c, { repeat: false });
}

// Soft round shadow blob used under equipment.
export function blobTexture() {
  const [c, g] = canvas(128, 128);
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,0.75)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return toTexture(c, { repeat: false, srgb: false });
}

export function controlsPosterTexture() {
  const [c, g] = canvas(512, 700);
  g.fillStyle = '#f3f1ec'; g.fillRect(0, 0, 512, 700);
  g.fillStyle = '#1d1d1f'; g.fillRect(0, 0, 512, 110);
  g.fillStyle = '#fff'; g.font = 'bold 44px Arial'; g.textAlign = 'center';
  g.fillText('WELCOME', 256, 72);
  g.fillStyle = '#222'; g.textAlign = 'left'; g.font = 'bold 28px Arial';
  const lines = [
    ['VR', true],
    ['Left stick  ·  walk', false],
    ['Left stick click  ·  sprint', false],
    ['Right stick  ·  turn', false],
    ['Right stick click  ·  snap / smooth', false],
    ['A  ·  jump      B  ·  respawn', false],
    ['', false],
    ['DESKTOP', true],
    ['Click  ·  look with mouse', false],
    ['WASD  ·  walk    Shift  ·  run', false],
    ['Space  ·  jump    R  ·  respawn', false],
  ];
  let y = 170;
  for (const [t, head] of lines) {
    g.font = head ? 'bold 30px Arial' : '26px Arial';
    g.fillStyle = head ? '#b0362f' : '#222';
    g.fillText(t, 40, y); y += head ? 46 : 42;
  }
  return toTexture(c, { repeat: false });
}
