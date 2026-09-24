'use strict';

const TOTAL = 60;
const TR = 1.0;   // length of the paper-wipe transition between scenes

const SCENES = [
  { fn: sceneDawn, start: 0, end: 9 },
  { fn: sceneWisdom, start: 9, end: 18.5, cap: ['بيت الحكمة', 'The House of Wisdom: Greek, Persian and Indian learning is translated into Arabic'] },
  { fn: sceneStars, start: 18.5, end: 28, cap: ['علم الفلك', 'Astronomers map the sky. Altair, Vega and Deneb still carry their Arabic names'] },
  { fn: sceneSouq, start: 28, end: 37.5, cap: ['السوق', 'In the souq: silk from China, spices from India, and paper from Baghdad’s own mills'] },
  { fn: sceneGarden, start: 37.5, end: 47, cap: ['البستان', 'In palace gardens, musicians and poets gather beside the fountain'] },
  { fn: sceneDusk, start: 47, end: 55, cap: ['دجلة', 'At dusk, boats crowd the Tigris, carrying goods and ideas across a connected world'] },
  { fn: sceneEnd, start: 55, end: TOTAL },
];
SCENES.forEach((s, i) => { s.seed = (i + 1) * 100000; });

const canvas = document.getElementById('stage');
ctx = canvas.getContext('2d');
let grain = null;

function makeGrain() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = 222 + Math.random() * 33;
    d[i] = v; d[i + 1] = v - 3; d[i + 2] = v - 10; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * W, y = Math.random() * H, r = 30 + Math.random() * 120;
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(170,130,80,0.06)'); rg.addColorStop(1, 'rgba(170,130,80,0)');
    g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.strokeStyle = 'rgba(120,90,50,0.12)'; g.lineWidth = 0.7;
  for (let i = 0; i < 700; i++) {
    const x = Math.random() * W, y = Math.random() * H, a = Math.random() * Math.PI * 2, l = 4 + Math.random() * 14;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * l / 2 + (Math.random() - 0.5) * 5, y + Math.sin(a) * l / 2 + (Math.random() - 0.5) * 5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  return c;
}

function resize() {
  const maxW = window.innerWidth - 32, maxH = window.innerHeight - 32 - 48;
  const cssW = Math.max(240, Math.min(maxW, maxH * W / H));
  const cssH = cssW * H / W;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  SCALE = canvas.width / W;
  render(time);
}

function drawScene(s, t) {
  SEED = s.seed;
  const lt = t - s.start;
  ctx.save();
  s.fn(lt, s.end - s.start);
  if (s.cap) caption(lt, s.cap[0], s.cap[1]);
  ctx.restore();
}

// The next scene slides in like a fresh sheet of torn paper.
function wipe(q, draw) {
  const e = easeInOut(q);
  const x0 = W + 40 - (W + 140) * e;
  const pts = [[W + 60, -30], [W + 60, H + 30]];
  for (let y = H + 30; y >= -30; y -= 16) pts.push([x0 + (h1(y * 0.37) - 0.5) * 14 + Math.sin(y * 0.021) * 12, y]);
  ctx.save(); ctx.translate(-12, 0); trace(pts); ctx.fillStyle = 'rgba(30,15,5,0.3)'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(-4, 0); trace(pts); ctx.fillStyle = PAL.cream; ctx.fill(); ctx.restore();
  ctx.save(); trace(pts); ctx.clip(); draw(); ctx.restore();
}

function render(t) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  BOIL = Math.floor(t * 6);

  let i = SCENES.findIndex(s => t >= s.start && t < s.end);
  if (i < 0) i = SCENES.length - 1;
  const s = SCENES[i];
  if (i > 0 && t < s.start + TR) {
    drawScene(SCENES[i - 1], t);
    wipe((t - s.start) / TR, () => drawScene(s, t));
  } else {
    drawScene(s, t);
  }

  // Paper grain and a warm vignette over everything.
  if (grain) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.6;
    ctx.drawImage(grain, 0, 0, W, H);
    ctx.restore();
  }
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
  v.addColorStop(0, 'rgba(60,30,10,0)');
  v.addColorStop(1, 'rgba(60,30,10,0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);

  // Fade in from blank paper.
  const fade = 1 - t / 0.8;
  if (fade > 0) { ctx.fillStyle = `rgba(243,231,204,${fade})`; ctx.fillRect(0, 0, W, H); }
}

// ---------- playback ----------
let time = 0, playing = true, last = null;
const playBtn = document.getElementById('play');
const restartBtn = document.getElementById('restart');
const scrub = document.getElementById('scrub');
const timeLabel = document.getElementById('time');

const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function syncUI() {
  scrub.value = time.toFixed(2);
  timeLabel.textContent = `${fmt(time)} / ${fmt(TOTAL)}`;
  const replay = !playing && time >= TOTAL;
  playBtn.textContent = playing ? '❚❚' : (replay ? '↻' : '▶');
  playBtn.setAttribute('aria-label', playing ? 'Pause' : (replay ? 'Replay' : 'Play'));
}

function setPlaying(v) {
  if (v && time >= TOTAL) time = 0;
  playing = v;
  last = null;
  syncUI();
}

function frame(now) {
  if (playing) {
    if (last !== null) time += Math.min(0.1, (now - last) / 1000);
    last = now;
    if (time >= TOTAL) { time = TOTAL; playing = false; }
    render(Math.min(time, TOTAL - 0.001));
    syncUI();
  }
  requestAnimationFrame(frame);
}

playBtn.addEventListener('click', () => setPlaying(!playing));
restartBtn.addEventListener('click', () => { time = 0; setPlaying(true); render(0); });
scrub.addEventListener('input', () => {
  time = parseFloat(scrub.value);
  render(Math.min(time, TOTAL - 0.001));
  syncUI();
});
window.addEventListener('keydown', e => {
  if (e.target === scrub && e.key.startsWith('Arrow')) return;
  if (e.code === 'Space' || e.key === 'k') { e.preventDefault(); setPlaying(!playing); }
  else if (e.key === 'r') { time = 0; setPlaying(true); }
  else if (e.key === 'ArrowRight') { time = Math.min(TOTAL, time + 5); render(Math.min(time, TOTAL - 0.001)); syncUI(); }
  else if (e.key === 'ArrowLeft') { time = Math.max(0, time - 5); render(time); syncUI(); }
});
window.addEventListener('resize', resize);

// Allow ?t=SECONDS to jump to a moment (handy for previews).
const qs = new URLSearchParams(location.search);
if (qs.has('t')) { time = clamp(parseFloat(qs.get('t')) || 0, 0, TOTAL); playing = !qs.has('paused'); }

// Wait briefly for the web fonts (the film still runs offline with fallbacks).
const fontsReady = document.fonts
  ? Promise.race([
      Promise.all([
        document.fonts.load(`700 40px Amiri`, 'بغداد'),
        document.fonts.load(`italic 500 24px "Cormorant Garamond"`),
        document.fonts.load(`600 24px "Cormorant Garamond"`),
      ]),
      new Promise(r => setTimeout(r, 2000)),
    ]).catch(() => {})
  : Promise.resolve();

grain = makeGrain();
resize();
fontsReady.then(() => {
  render(Math.min(time, TOTAL - 0.001));
  syncUI();
  requestAnimationFrame(frame);
});
