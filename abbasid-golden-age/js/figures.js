'use strict';
// Reusable cut-paper figures and props.

// A person in profile. o.face = 1 (right) or -1 (left).
// Returns helpers for positioning things in the hand, and for drawing the
// arm later (o.armLater) so props can sit between body and arm.
function person(x, y, s, o = {}) {
  const dir = o.face === -1 ? -1 : 1;
  const skin = o.skin || PAL.skin;
  const robe = o.robe || PAL.lapis;
  const sit = !!o.sit;
  const hy = sit ? -76 : -96;
  const sh = sit ? [4, -58] : [4, -76];
  const nod = o.nod || 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);

  if (o.cloak) paper(sit ? [[-14, -66], [0, -66], [-6, -14], [-30, -14]] : [[-13, -86], [-2, -86], [-8, -4], [-28, -4]], o.cloak, 2);
  if (sit) {
    paper(E(6, -12, 42, 14, 24), o.robe2 || shade(robe, 0.12), 3);
    paper([[-15, -66], [14, -66], [24, -16], [-22, -16]], robe, 3);
  } else {
    paper(E(-9, -2, 8, 3.5, 10), PAL.ink, 1);
    paper(E(11, -2, 8, 3.5, 10), PAL.ink, 1);
    paper([[-13, -86], [13, -86], [24, -4], [-22, -4]], robe, 3);
  }
  if (o.sash) paper(R(sit ? -19 : -17, sit ? -36 : -52, sit ? 40 : 35, 6), o.sash, 1);

  ctx.save();
  ctx.translate(0, hy + 10);
  ctx.rotate(nod);
  ctx.translate(0, -(hy + 10));
  paper(R(-4, hy + 6, 8, 11), skin, 0);
  if (o.veil) paper([[6, hy - 13], [-4, hy - 16], [-15, hy - 8], [-18, hy + 8], [-19, hy + 26], [-6, hy + 26], [-3, hy + 10], [-2, hy - 4], [7, hy - 7]], o.veil, 2);
  paper(C(0, hy, 11, 16), skin, 2);
  paper([[9, hy - 3], [14, hy + 3], [9, hy + 4]], skin, 0, 0.3);
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(4.5, hy - 2.5, 2.4, 2.4);
  if (o.beard) paper([[-6, hy + 2], [10, hy + 4], [9, hy + 13], [2, hy + 19], [-5, hy + 12]], o.beard, 1, 0.5);
  if (o.hat === 'qalansuwa') {
    // Tall cap of the Abbasid court, in the dynasty's colour, black.
    paper([[-10, hy - 7], [10, hy - 7], [8, hy - 38], [1, hy - 45], [-8, hy - 38]], o.hatColor || PAL.black, 2);
    paper(E(0, hy - 8, 13.5, 5.5, 16), o.turban || PAL.cream, 1);
  } else if (o.turban) {
    paper(E(0, hy - 9, 13.5, 8.5, 18), o.turban, 2);
    paper(E(-1.5, hy - 15, 10, 6, 14), o.turban, 1);
    paper(E(2, hy - 10, 11, 1.6, 10), shade(o.turban, 0.12), 0, 0.3);
  }
  ctx.restore();

  const armCol = o.sleeve || shade(robe, 0.16);
  const drawArm = (a, len = 34) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * dir, s);
    ctx.translate(sh[0], sh[1]);
    ctx.rotate(-a);
    paper([[-5, -2], [5, -2], [4.5, len], [-4.5, len]], armCol, 2);
    paper(C(0, len + 3, 4.6, 10), skin, 1);
    ctx.restore();
    return { x: x + dir * s * (sh[0] + Math.sin(a) * (len + 3)), y: y + s * (sh[1] + Math.cos(a) * (len + 3)) };
  };
  // Aim the hand at a world-space point.
  const reach = (tx, ty, maxLen = 60) => {
    const sx = x + dir * s * sh[0], sy = y + s * sh[1];
    const a = Math.atan2(dir * (tx - sx), ty - sy);
    const len = clamp(Math.hypot(tx - sx, ty - sy) / s - 3, 18, maxLen);
    return drawArm(a, len);
  };

  ctx.restore();
  const hand = o.armLater ? null : drawArm(o.arm ?? 0.25, o.armLen ?? 34);
  return { hand, drawArm, reach, head: { x, y: y + s * hy } };
}

function frond(x, y, len, ang, droop, wid, col) {
  const n = 12, top = [], bot = [];
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len + droop;
  const cx = x + Math.cos(ang) * len * 0.55, cy = y + Math.sin(ang) * len * 0.55 - droop * 0.2;
  for (let i = 0; i <= n; i++) {
    const t = i / n, mt = 1 - t;
    const px = mt * mt * x + 2 * mt * t * cx + t * t * ex;
    const py = mt * mt * y + 2 * mt * t * cy + t * t * ey;
    const dx = 2 * mt * (cx - x) + 2 * t * (ex - cx), dy = 2 * mt * (cy - y) + 2 * t * (ey - cy);
    const l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    const w = wid * Math.sin(Math.PI * Math.min(1, t * 1.08)) * (i % 2 ? 1 : 0.5);
    top.push([px + nx * w, py + ny * w]);
    bot.push([px - nx * w * 0.7, py - ny * w * 0.7]);
  }
  paper(top.concat(bot.reverse()), col, 2, 0.5);
}

function palm(x, by, h, sway, col, trunkCol, dates = true) {
  const n = 8, L = [], Rt = [];
  const bend = sway * h * 0.5;
  for (let i = 0; i <= n; i++) {
    const t = i / n, px = x + bend * t * t, py = by - h * t, w = lerp(8, 4.5, t) * (h / 150);
    L.push([px - w, py]); Rt.push([px + w, py]);
  }
  paper(L.concat(Rt.reverse()), trunkCol, 2, 0.5);
  ctx.strokeStyle = 'rgba(30,15,5,0.22)';
  ctx.lineWidth = 1.2;
  for (let i = 1; i < 10; i++) {
    const t = i / 10, px = x + bend * t * t, py = by - h * t, w = lerp(8, 4.5, t) * (h / 150);
    ctx.beginPath(); ctx.moveTo(px - w, py); ctx.lineTo(px + w, py - 3); ctx.stroke();
  }
  const tx = x + bend, ty = by - h;
  const angs = [-3.0, -2.55, -2.1, -1.62, -1.1, -0.62, -0.15];
  angs.forEach((a, i) => {
    const wig = Math.sin(sway * 9 + i) * 0.05;
    frond(tx, ty, h * (0.4 + 0.12 * rand(i, x)), a + sway * 0.6 + wig, h * (0.16 + 0.06 * Math.abs(Math.cos(a))), h * 0.055, i % 2 ? col : shade(col, 0.12));
  });
  if (dates) {
    paperGroup([C(tx - 6, ty + 9, 6, 10), C(tx + 5, ty + 11, 6, 10), C(tx, ty + 16, 5, 10)], '#a45b27', 1);
  }
}

function cypress(x, by, h, w, lean, col) {
  const n = 14, L = [], Rt = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const r = (w / 2) * (t < 0.28 ? lerp(0.75, 1, t / 0.28) : Math.pow((1 - t) / 0.72, 0.85));
    const off = lean * t * t * 30;
    L.push([x - r + off, by - h * t]); Rt.push([x + r + off, by - h * t]);
  }
  paper(R(x - 4, by - 8, 8, 12), PAL.woodDk, 1);
  paper(L.concat(Rt.reverse()), col, 3);
  // a lighter inner flame for depth
  const L2 = [], R2 = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const r = (w / 4) * (t < 0.3 ? lerp(0.6, 1, t / 0.3) : Math.pow((1 - t) / 0.7, 0.9));
    const off = lean * t * t * 30 - w * 0.12 * (1 - t);
    L2.push([x - r + off, by - 10 - (h - 30) * t]); R2.push([x + r + off, by - 10 - (h - 30) * t]);
  }
  paper(L2.concat(R2.reverse()), tint(col, 0.12), 0);
}

function cloud(x, y, s, col) {
  const parts = [[-40, 4, 42, 14], [-5, -10, 36, 20], [36, 2, 34, 14], [0, 8, 72, 12]];
  paperGroup(parts.map(([dx, dy, rx, ry]) => E(x + dx * s, y + dy * s, rx * s, ry * s, 20)), col, 2);
}

function bird(x, y, s, flap, col) {
  paper([[x - 14 * s, y - 8 * s * flap], [x, y + s], [x + 14 * s, y - 8 * s * flap], [x, y + 5 * s]], col, 1, 0.3);
}

function flock(lt, x0, y0, speed, n, s, col, seed = 0) {
  for (let i = 0; i < n; i++) {
    const bx = x0 + lt * speed + (i % 3) * 38 * s + rand(i, seed) * 50;
    const by = y0 + i * 14 * s * (i % 2 ? 1 : -0.6) + Math.sin(lt * 2 + i) * 5;
    bird(bx, by, s * (0.8 + 0.4 * rand(i, seed + 1)), Math.sin(lt * 9 + i * 1.7), col);
  }
}

// Round reed coracle, a fixture of the Tigris at Baghdad for millennia.
function quffa(x, y, s, col) {
  paper(E(x, y, 56 * s, 7 * s, 24), shade(col, 0.3), 1);
  paper(E(x, y, 56 * s, 26 * s, 20, 0, Math.PI), col, 3);
  ctx.strokeStyle = 'rgba(30,15,5,0.25)';
  ctx.lineWidth = 1.2;
  for (let k = -3; k <= 3; k++) {
    ctx.beginPath();
    ctx.moveTo(x + k * 14 * s, y + 2);
    ctx.quadraticCurveTo(x + k * 12 * s, y + 18 * s, x + k * 7 * s, y + 24 * s * Math.cos(k * 0.35));
    ctx.stroke();
  }
}

// Lateen-rigged river boat.
function dhow(x, y, s, t, o = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(Math.sin(t * 1.3) * 0.025);
  const hull = o.hull || '#4a2a18', sail = o.sail || '#f1dcb4', stripe = o.stripe || PAL.terracotta;
  seg(0, 0, -4, -190, 7, PAL.woodDk, 2);
  const sailPts = [[-96, -54], [-30, -118], [62, -206], [58, -140], [46, -26]];
  paper(sailPts, sail, 3);
  paper([[-60, -44], [-16, -92], [12, -84], [-26, -38]], stripe, 0, 0.4);
  seg(-104, -46, 72, -214, 4, PAL.woodDk, 2);
  if (o.crew) {
    person(-50, -6, 0.55, { robe: '#e8d9b8', turban: PAL.cream, beard: PAL.ink, arm: 1.1, face: 1, skin: '#9c6a48' });
    person(70, -6, 0.55, { robe: '#5a6f86', turban: PAL.cream, arm: 0.4, face: -1, skin: '#9c6a48' });
  }
  paper([[-128, -22], [122, -30], [100, 4], [64, 14], [-76, 14], [-106, 4]], hull, 3);
  paper([[-122, -18], [116, -25], [112, -18], [-116, -12]], PAL.ochre, 0, 0.4);
  ctx.restore();
}

// Camel walking left, feet at y.
function camel(x, y, s, t, col = '#c9965b') {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 10) * 1.5 * s);
  ctx.scale(s, s);
  const legDk = shade(col, 0.22);
  const leg = (lx, ph, c) => {
    const a = Math.sin(t * 5 + ph) * 0.28;
    const fx = lx - Math.sin(a) * 110, fy = -Math.cos(a) * 3;
    seg(lx, -118, fx, fy - 2, 13, c, 2);
    paper(E(fx - 3, fy - 2, 9, 4, 10), shade(c, 0.2), 1);
  };
  leg(-38, Math.PI, legDk); leg(50, 0, legDk);
  paper([[76, -150], [88, -128], [84, -98], [80, -130]], shade(col, 0.15), 1);
  paperGroup([E(10, -150, 80, 42, 24), E(18, -186, 42, 38, 20, Math.PI, Math.PI * 2)], col, 3);
  // saddle cloth and bundles
  paper([[-30, -212], [60, -214], [66, -168], [-38, -166]], PAL.brick, 2);
  paper([[-30, -202], [62, -204], [63, -196], [-31, -194]], PAL.saffron, 0, 0.3);
  paper(E(-6, -222, 26, 14, 16), '#e6d2a8', 2);
  paper(E(36, -224, 24, 14, 16), '#9c6a3c', 2);
  paper(rotRect(-22, -150, 26, 48, 0.1), PAL.lapis, 2);
  // neck and head
  paper([[-52, -170], [-72, -150], [-118, -214], [-106, -234], [-96, -228]], col, 3);
  paper([[-100, -242], [-148, -232], [-152, -218], [-138, -214], [-106, -220]], col, 3);
  paper(E(-102, -242, 5, 8, 8), shade(col, 0.2), 0);
  ctx.fillStyle = PAL.ink; ctx.fillRect(-122, -235, 3, 3);
  paper(E(-150, -222, 4, 5, 8), PAL.ink, 0, 0.3);
  leg(-58, 0, col); leg(32, Math.PI, col);
  ctx.restore();
}

function cat(x, y, t) {
  paper(E(x, y - 10, 28, 11, 18), '#8a6a4a', 2);
  const flick = Math.sin(t * 2.6) * 0.4;
  seg(x + 24, y - 6, x + 44 + Math.cos(flick) * 6, y - 22 - Math.sin(flick) * 10, 5, '#8a6a4a', 1);
  paper(C(x - 26, y - 20, 10, 12), '#8a6a4a', 2);
  paper([[-34, -26], [-30, -40], [-24, -28]].map(([a, b]) => [x + a + 2, y + b]), '#8a6a4a', 0, 0.2);
  paper([[-24, -28], [-18, -38], [-16, -26]].map(([a, b]) => [x + a, y + b]), '#8a6a4a', 0, 0.2);
  ctx.fillStyle = PAL.ink;
  const blink = fract(t * 0.3) > 0.94 ? 0.6 : 2.4;
  ctx.fillRect(x - 32, y - 22, 3, blink);
  ctx.fillStyle = 'rgba(40,20,10,0.35)';
  for (let k = 0; k < 3; k++) ctx.fillRect(x - 6 + k * 9, y - 20, 3, 9);
}

// Brass astrolabe: mater, plate, rotating rete and alidade.
function astrolabe(cx, cy, r, rot) {
  strokePts(C(cx, cy - r - 9, 7, 12), PAL.gold, 3, 1);
  paper(C(cx, cy, r, 32), PAL.gold, 3);
  paper(C(cx, cy, r * 0.84, 28), '#23315c', 0);
  ctx.strokeStyle = alpha(PAL.gold, 0.55); ctx.lineWidth = 1;
  [0.35, 0.55, 0.72].forEach(k => { ctx.beginPath(); ctx.arc(cx, cy, r * k, 0, Math.PI * 2); ctx.stroke(); });
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  strokePts(E(r * 0.12, 0, r * 0.6, r * 0.6, 26), PAL.gold, 2.2, 0);
  for (let k = 0; k < 6; k++) {
    const a = k * 1.05 + 0.3, rr = r * (0.62 + 0.14 * (k % 2));
    paper([[Math.cos(a) * rr, Math.sin(a) * rr], [Math.cos(a + 0.18) * rr * 0.72, Math.sin(a + 0.18) * rr * 0.72], [Math.cos(a - 0.18) * rr * 0.72, Math.sin(a - 0.18) * rr * 0.72]], PAL.gold, 0, 0.2);
  }
  ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-rot * 0.6 + 0.4);
  paper(R(-r * 0.95, -2.5, r * 1.9, 5), PAL.goldDk, 1, 0.3);
  ctx.restore();
  paper(C(cx, cy, 3.5, 8), PAL.ink, 0, 0.2);
}

function oilLamp(x, y, t, s = 1) {
  const fl = 1 + Math.sin(t * 17) * 0.08 + Math.sin(t * 29) * 0.06;
  const g = ctx.createRadialGradient(x, y - 22 * s, 2, x, y - 22 * s, 90 * s);
  g.addColorStop(0, 'rgba(255,210,120,0.45)');
  g.addColorStop(1, 'rgba(255,210,120,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y - 22 * s, 90 * s, 0, Math.PI * 2); ctx.fill();
  paper([[x - 22 * s, y - 10 * s], [x + 30 * s, y - 16 * s], [x + 18 * s, y - 4 * s], [x - 18 * s, y]], PAL.goldDk, 2);
  paper(E(x, y - 10 * s, 20 * s, 9 * s, 16), PAL.gold, 2);
  paper([[x + 26 * s, y - 16 * s], [x + 32 * s - 5 * s, y - 34 * s * fl], [x + 32 * s + 5 * s, y - 20 * s]], '#f5a53a', 0, 0.3);
  paper([[x + 28 * s, y - 17 * s], [x + 30 * s, y - 28 * s * fl], [x + 33 * s, y - 19 * s]], '#fde6a2', 0, 0.2);
}

function hangingLamp(x, topY, len, swing, s = 1) {
  const bx = x + Math.sin(swing) * len, by = topY + Math.cos(swing) * len;
  ctx.strokeStyle = PAL.woodDk; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x, topY); ctx.lineTo(bx, by); ctx.stroke();
  ctx.save(); ctx.translate(bx, by); ctx.rotate(-swing); ctx.scale(s, s);
  paper(dome(0, 6, 20, 14, 8), PAL.gold, 2);
  paper([[-14, 6], [14, 6], [8, 26], [-8, 26]], PAL.goldDk, 2);
  paper([[-4, 12], [4, 12], [3, 20], [-3, 20]], '#fbd67a', 0, 0.2);
  paper(E(0, 28, 5, 3, 8), PAL.gold, 1);
  ctx.restore();
}
