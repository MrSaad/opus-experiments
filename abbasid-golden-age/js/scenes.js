'use strict';
// Each scene is a pure function of its local time (lt, seconds) so the
// whole film can be scrubbed. dur is the scene's nominal length.

// ---------------------------------------------------------------------------
// 1. Dawn over Madinat al-Salam, the Round City
// ---------------------------------------------------------------------------
function sceneDawn(lt, dur) {
  const p = lt / dur;
  const d = smooth(0, 0.85, p);   // 0 = pre-dawn, 1 = morning

  [[-30, '#1d2550', '#7098c0'], [110, '#3a3c6c', '#a3c2cf'], [200, '#7a4b6b', '#ead3a8'],
   [275, '#c26957', '#f3dcaa'], [335, '#e6984f', '#f8e6b6']]
    .forEach(([y, c1, c2], i) => band(y, 9, 0.006, i * 1.7 + lt * 0.15, mix(c1, c2, d), i ? 3 : 0));

  const sx = 860, sy = lerp(470, 262, easeOut(p * 1.1));
  paper(C(sx, sy, 150, 40), 'rgba(255,238,200,0.14)', 0);
  paper(C(sx, sy, 104, 34), 'rgba(255,238,200,0.18)', 0);
  paper(C(sx, sy, 56, 28), mix('#ef8a4c', '#f7c95c', d), 3);

  const cloudCol = mix('#a8708a', '#fbefdc', d);
  cloud(fract((200 + lt * 9) / 1500) * 1500 - 100, 150, 1.1, cloudCol);
  cloud(1040 + lt * 6, 205, 0.8, cloudCol);
  cloud(420 + lt * 12, 92, 0.7, cloudCol);

  // Far city: the palace's Green Dome at the heart of the Round City.
  const far = mix('#6b4a60', '#c89a74', d), farDk = mix('#553a52', '#b0825e', d);
  paper(R(582, 352, 116, 100), far, 3);
  paper(dome(640, 354, 132, 118), mix('#2c5a52', '#3f8f72', d), 3);
  paper(R(638, 222, 4, 18), PAL.gold, 1);
  paper(C(640, 219, 5, 10), PAL.gold, 1);
  [450, 835].forEach(mx => {
    paper(R(mx - 8, 270, 16, 200), far, 3);
    paper(R(mx - 14, 300, 28, 8), farDk, 2);
    paper(dome(mx, 272, 20, 26), farDk, 2);
  });
  paper(R(-20, 430, W + 40, 60), farDk, 3);
  for (let x = -10; x < W + 20; x += 28) paper(R(x, 421, 14, 11), farDk, 0, 0.5);
  for (let x = 60; x < W; x += 180) {
    paper(R(x - 20, 404, 40, 86), far, 3);
    for (let k = 0; k < 3; k++) paper(R(x - 20 + k * 15, 396, 10, 10), far, 0, 0.5);
  }

  const palmCol = mix('#2f3a34', PAL.palm, d), trunk = mix('#3a2c2c', '#7a5634', d);
  const sw = i => Math.sin(lt * 1.1 + i) * 0.05;
  palm(250, 560, 170, sw(0), palmCol, trunk);
  palm(700, 560, 190, sw(1), palmCol, trunk);
  palm(1120, 560, 160, sw(2), palmCol, trunk);

  // Houses with lamp-lit windows that go dark as the sun rises.
  const houseCols = ['#e3c28c', '#d6a266', '#c98d5c', '#e8cf9f', '#d9b079'];
  const dusk = '#6e4a55';
  for (let i = 0; i < 13; i++) {
    const hx = i * 104 - 30 + rand(i, 1) * 20, hw = 88 + rand(i, 2) * 40, hh = 60 + rand(i, 3) * 70;
    const col = mix(dusk, houseCols[i % 5], 0.35 + 0.65 * d);
    const top = 580 - hh;
    paper(R(hx, top, hw, hh + 10), col, 3);
    paper(R(hx - 3, top - 6, hw + 6, 8), mix(dusk, '#b98655', 0.35 + 0.65 * d), 1);
    if (rand(i, 4) > 0.6) paper(dome(hx + hw / 2, top - 5, hw * 0.45, hw * 0.35), mix(dusk, '#ede1c6', 0.3 + 0.7 * d), 2);
    else if (rand(i, 5) > 0.4) {
      // badgir wind-catcher
      paper(R(hx + hw * 0.62, top - 34, 18, 30), col, 2);
      paper(R(hx + hw * 0.62 + 4, top - 28, 10, 12), '#3a2626', 0, 0.4);
    }
    const nw = 1 + Math.floor(rand(i, 6) * 3);
    for (let k = 0; k < nw; k++) {
      const wx = hx + (k + 0.5) * hw / nw - 7;
      const lit = rand(i * 7 + k, 8) > 0.4;
      paper(arch(wx, top + 18, 14, 26, 0.7, 5), lit ? mix('#ffc864', '#4a3030', smooth(0.1, 0.6, p)) : '#4a3030', 0, 0.5);
    }
  }
  palm(90, 600, 150, sw(3), palmCol, trunk);
  palm(930, 600, 175, sw(4), palmCol, trunk);

  // The Tigris
  band(578, 3, 0.02, lt, mix('#34506a', '#4b8a8e', d), 3);
  for (let i = 0; i < 26; i++) {
    const wx = fract((i * 97 + lt * 26 * (1 + (i % 3) * 0.3)) / (W + 200)) * (W + 200) - 100;
    const wy = 600 + (i * 37) % 110;
    paper(E(wx, wy, 26 + (i % 4) * 10, 2.2, 12), 'rgba(255,240,210,0.3)', 0, 0.4);
  }
  for (let k = 0; k < 7; k++) {
    const w = 64 - k * 7 + Math.sin(lt * 3 + k) * 8;
    paper(R(sx - w / 2 + Math.sin(lt * 2 + k) * 6, 596 + k * 16, w, 4), alpha('#f7c95c', 0.55 * d + 0.2), 0, 0.5);
  }
  paper([[-20, 570], [W + 20, 570], [W + 20, 582], [-20, 586]], mix('#4a3a34', '#9c8a52', d), 2);

  // Distant sail and a coracle ferrying a boatman.
  dhow(lerp(980, 1160, p), 602, 0.32, lt, { hull: mix('#3a2a2a', '#5a3822', d), sail: mix('#b7a3a3', '#f4e3bf', d) });
  const qx = lerp(170, 470, easeInOut(p)), qy = 668 + Math.sin(lt * 1.5) * 3;
  seg(qx + 30, qy - 120, qx + 58, qy + 30, 4, PAL.woodDk, 2);
  person(qx, qy - 4, 0.95, { robe: '#e8dcc0', turban: '#f4ecd8', beard: '#3a2a20', arm: 1.9, armLen: 30, face: 1, skin: '#a8744d', sash: PAL.terracotta });
  quffa(qx, qy, 1, '#7a5634');

  flock(lt, -120, 190, 55, 6, 1, mix('#2b1d2a', '#3a2a24', d));

  // Title cartouche
  const a = easeOut((lt - 0.7) / 1.5);
  if (a > 0) {
    const bw = 470, bh = 196, bx = (W - bw) / 2, by = lerp(-bh - 20, 42, a);
    paper(chamfer(bx - 10, by - 10, bw + 20, bh + 20, 26), PAL.lapis, 6);
    paper(chamfer(bx, by, bw, bh, 20), PAL.cream, 0);
    const inner = rough(chamfer(bx + 9, by + 9, bw - 18, bh - 18, 15), 0.6);
    trace(inner); ctx.strokeStyle = alpha(PAL.gold, 0.9); ctx.lineWidth = 2; ctx.stroke();
    [[bx + 30, by + 98], [bx + bw - 30, by + 98]].forEach(([x, y]) => paper(star(8, x, y, 12, 6), PAL.turq, 1));
    const ta = smooth(1.2, 2.2, lt);
    text('بغداد', W / 2, by + 62, { font: `700 66px ${F_AR}`, color: PAL.ink, alpha: ta });
    text('BAGHDAD · MADĪNAT AL-SALĀM', W / 2, by + 124, { font: `600 22px ${F_EN}`, color: PAL.terracotta, spacing: 3, alpha: ta });
    text('The City of Peace, c. 830 CE', W / 2, by + 156, { font: `italic 500 22px ${F_EN}`, color: PAL.lapis, alpha: smooth(1.8, 2.8, lt) });
  }
}

// ---------------------------------------------------------------------------
// 2. Bayt al-Hikma, the House of Wisdom
// ---------------------------------------------------------------------------
const BOOK_COLS = [PAL.terracotta, PAL.lapis, PAL.olive, PAL.ochre, PAL.brick, PAL.turq, '#5a3a5a', PAL.goldDk];

function shelves(x, y, w, h, seed) {
  paper(R(x, y, w, h), '#6b3f25', 4);
  paper(R(x + 10, y + 10, w - 20, h - 20), '#3d2416', 0);
  const rows = 4, rh = (h - 20) / rows;
  for (let r = 0; r < rows; r++) {
    const by = y + 10 + rh * (r + 1);
    let cx = x + 16, k = 0;
    while (cx < x + w - 44) {
      const id = seed + r * 17 + k;
      if (rand(id, 1) < 0.72) {
        // Codices were stored lying flat, in stacks.
        const n = 2 + Math.floor(rand(id, 2) * 4), bw = 32 + rand(id, 3) * 14;
        let yy = by - 8;
        for (let b = 0; b < n; b++) {
          const bh = 6 + rand(id * 3 + b, 4) * 4;
          paper(R(cx + (rand(id + b, 5) - 0.5) * 5, yy - bh, bw, bh), BOOK_COLS[Math.floor(rand(id * 5 + b, 6) * 8)], 1, 0.4);
          yy -= bh;
        }
        cx += bw + 8;
      } else {
        for (let sI = 0; sI < 3; sI++) paper(C(cx + 6 + sI * 12, by - 15, 6, 10), PAL.cream, 1, 0.3);
        paper(C(cx + 12, by - 26, 6, 10), '#e8d6b0', 1, 0.3);
        cx += 44;
      }
      k++;
    }
    paper(R(x + 6, by - 8, w - 12, 8), '#8a5532', 2);
  }
}

function sceneWisdom(lt, dur) {
  ctx.fillStyle = '#e6cf9e';
  ctx.fillRect(0, 0, W, H);

  // Tiled frieze
  paper(R(-10, 30, W + 20, 80), PAL.lapis, 3);
  for (let i = 0; i < 15; i++) {
    const cx = 20 + i * 92;
    paper(star(8, cx, 70, 24, 13, Math.PI / 8), PAL.turq, 2);
    paper(C(cx, 70, 6, 10), PAL.gold, 1);
    paper(star(4, cx + 46, 70, 10, 4), PAL.gold, 1);
  }
  paper(R(-10, 108, W + 20, 10), PAL.gold, 2);

  // Arched windows onto the city
  [150, 560, 970].forEach((wx, i) => {
    paper(arch(wx - 12, 148, 184, 334), PAL.terracotta, 4);
    paper(arch(wx, 162, 160, 318), '#a9cfd0', 0);
    paper(R(wx + 18, 420, 60, 60), '#e6cc9c', 0, 0.5);
    paper(dome(wx + 110, 432, 60, 52), i === 1 ? '#5c9a86' : '#dcc093', 0, 0.5);
    paper(R(wx + 80, 430, 60, 50), '#e2c490', 0, 0.5);
    paper(R(wx - 22, 474, 204, 14), PAL.sandDk, 3);
  });

  shelves(348, 168, 192, 306, 11);
  shelves(758, 168, 192, 306, 57);

  // Tiled floor and carpet
  paper(R(-10, 486, W + 20, 244), '#b86b3e', 3);
  ctx.strokeStyle = 'rgba(80,30,10,0.18)'; ctx.lineWidth = 1.5;
  for (let x = -200; x < W + 200; x += 70) { ctx.beginPath(); ctx.moveTo(x, 490); ctx.lineTo(x + 230, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 230, 490); ctx.lineTo(x, H); ctx.stroke(); }
  paper(R(230, 560, 820, 130), '#8a2c28', 3);
  paper(R(246, 572, 788, 106), PAL.lapisDk, 0);
  paper(R(262, 586, 756, 78), '#a5402f', 0);
  for (let x = 262; x <= 1018; x += 27) { paper(star(4, x, 579, 5, 2.5), PAL.gold, 0, 0.3); paper(star(4, x, 671, 5, 2.5), PAL.gold, 0, 0.3); }
  paper(star(8, 640, 625, 36, 22, Math.PI / 8), PAL.gold, 1);
  paper(C(640, 625, 10, 12), PAL.lapis, 0);

  // Light beams and drifting dust
  const beamA = 0.13 + 0.03 * Math.sin(lt * 0.8);
  [150, 560, 970].forEach(wx => {
    trace([[wx + 20, 250], [wx + 140, 250], [wx + 290, H], [wx + 70, H]]);
    ctx.fillStyle = `rgba(255,244,212,${beamA})`; ctx.fill();
  });
  for (let i = 0; i < 40; i++) {
    const wx = [150, 560, 970][i % 3];
    const u = fract(rand(i, 1) + lt * 0.03 * (0.5 + rand(i, 2)));
    const px = wx + 60 + u * 150 + Math.sin(lt + i) * 10 + rand(i, 3) * 60, py = 260 + u * 420;
    ctx.fillStyle = `rgba(255,248,225,${0.5 * Math.sin(u * Math.PI)})`;
    ctx.beginPath(); ctx.arc(px, py, 1.6, 0, Math.PI * 2); ctx.fill();
  }

  // Scholar reading from a codex on a rahla stand; the page turns.
  person(380, 648, 1.5, { sit: true, robe: '#2f4f7f', hat: 'qalansuwa', turban: PAL.cream, beard: '#9a9086', arm: 1.2, armLen: 40, sash: PAL.gold, nod: Math.sin(lt * 0.9) * 0.03 });
  const spX = 470, spY = 606;
  seg(452, 648, 490, 596, 5, PAL.wood, 2);
  seg(488, 648, 450, 596, 5, PAL.wood, 2);
  const wing = (ang, col) => seg(spX, spY, spX + Math.cos(ang) * 40, spY + Math.sin(ang) * 40, 5, col, 1);
  wing(-2.35, PAL.brick); wing(-0.8, PAL.brick);
  wing(-2.28, PAL.cream); wing(-0.87, PAL.cream);
  const flip = smooth(0, 0.7, fract(lt / 3.2) * 3.2 - 2.2);
  if (flip > 0 && flip < 1) wing(lerp(-0.87, -2.28, flip), '#fff7e4');

  // Brass oil lamp
  oilLamp(640, 648, lt, 1);

  // Scholar copying the translation, writing right-to-left.
  const pb = person(900, 648, 1.5, { sit: true, face: -1, robe: '#9a4a2e', turban: PAL.white, beard: PAL.ink, sash: PAL.lapis, armLater: true });
  const board = rotRect(830, 596, 96, 64, -0.08);
  paper(board, PAL.wood, 3);
  paper(rotRect(830, 594, 84, 54, -0.08), '#f7ecd2', 0, 0.5);
  const lines = 4;
  let ix = 868, iy = 578;
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  for (let i = 0; i < lines; i++) {
    const u = clamp((lt - 0.6 - i * 1.9) / 1.7);
    if (u <= 0) break;
    const y0 = 572 + i * 11;
    const len = 68 * u;
    ctx.beginPath();
    for (let s = 0; s <= len; s += 2) {
      // follow the board's tilt; small risers suggest letter strokes
      const x = 866 - s, y = y0 + s * 0.08 + Math.sin(s * 0.9 + i) * 1.6 - (s % 14 < 3 ? 3 : 0);
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      ix = x; iy = y;
    }
    ctx.stroke();
  }
  const hand = pb.reach(ix + 4, iy - 6, 62);
  seg(hand.x, hand.y, ix, iy, 2.5, PAL.goldDk, 1);

  // Letters drift from the Greek codex to the Arabic page, changing script.
  const greek = ['Α', 'Β', 'Γ', 'Δ', 'Θ', 'Λ', 'Σ', 'Ω', 'Φ'];
  const arabic = ['ا', 'ب', 'ج', 'د', 'ط', 'ل', 'س', 'و', 'ف'];
  for (let i = 0; i < greek.length; i++) {
    const u = (lt - 0.8 - i * 0.85) / 3.4;
    if (u <= 0 || u >= 1) continue;
    const mt = 1 - u, cxp = 650, cyp = 300 + (i % 3) * 30;
    const px = mt * mt * 480 + 2 * mt * u * cxp + u * u * 820 + Math.sin(lt * 2 + i) * 6;
    const py = mt * mt * 560 + 2 * mt * u * cyp + u * u * 560;
    const fade = smooth(0, 0.12, u) * (1 - smooth(0.86, 1, u));
    const k = smooth(0.4, 0.6, u);
    text(greek[i], px, py, { font: `600 44px ${F_EN}`, color: PAL.lapis, alpha: fade * (1 - k) });
    text(arabic[i], px, py, { font: `700 50px ${F_AR}`, color: PAL.brick, alpha: fade * k });
  }
}

// ---------------------------------------------------------------------------
// 3. Rooftop observatory by night
// ---------------------------------------------------------------------------
function sceneStars(lt, dur) {
  ctx.fillStyle = '#0e1430';
  ctx.fillRect(0, 0, W, H);
  band(200, 6, 0.004, 1, '#141c42', 0);
  band(330, 6, 0.005, 2, '#1a2552', 0);
  band(420, 5, 0.006, 3, '#23315f', 0);

  // Sky turning slowly about the pole.
  const pole = [300, -120], rot = lt * 0.012;
  const rotP = (x, y) => {
    const dx = x - pole[0], dy = y - pole[1], c = Math.cos(rot), s = Math.sin(rot);
    return [pole[0] + dx * c - dy * s, pole[1] + dx * s + dy * c];
  };
  for (let i = 0; i < 180; i++) {
    const [x, y] = rotP(rand(i, 1) * W * 1.3 - W * 0.1, rand(i, 2) * 520);
    const tw = 0.55 + 0.45 * Math.sin(lt * (2 + rand(i, 4) * 3) + i);
    const size = 0.7 + Math.pow(rand(i, 3), 3) * 2.2;
    if (rand(i, 3) > 0.94) paper(star(4, x, y, size * 3.2, size * 0.9, 0), `rgba(251,238,200,${0.7 + 0.3 * tw})`, 0, 0.2);
    else {
      ctx.fillStyle = `rgba(246,236,214,${0.35 + 0.55 * tw})`;
      ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Crescent moon
  const g = ctx.createRadialGradient(1090, 130, 10, 1090, 130, 120);
  g.addColorStop(0, 'rgba(250,236,200,0.22)'); g.addColorStop(1, 'rgba(250,236,200,0)');
  ctx.fillStyle = g; ctx.fillRect(960, 0, 260, 260);
  const moon = [];
  for (let i = 0; i <= 20; i++) { const a = -Math.PI / 2 + Math.PI * i / 20; moon.push([Math.cos(a) * 46, Math.sin(a) * 46]); }
  for (let i = 20; i >= 0; i--) { const a = -Math.PI / 2 + Math.PI * i / 20; moon.push([Math.cos(a) * 18, Math.sin(a) * 46]); }
  ctx.save(); ctx.translate(1090, 130); ctx.rotate(-0.5);
  paper(moon, '#f3e6c4', 2);
  ctx.restore();

  // The Summer Triangle, three stars that kept their Arabic names.
  const tri = [
    { p: rotP(515, 150), name: 'Vega', ar: 'al-Wāqiʿ', dx: -18, al: 'right' },
    { p: rotP(735, 104), name: 'Deneb', ar: 'Dhanab', dx: 18, al: 'left' },
    { p: rotP(640, 330), name: 'Altair', ar: 'al-Ṭāʾir', dx: 18, al: 'left' },
  ];
  ctx.save();
  ctx.strokeStyle = alpha(PAL.gold, 0.75); ctx.lineWidth = 1.6; ctx.setLineDash([5, 6]);
  for (let e = 0; e < 3; e++) {
    const u = clamp((lt - 1.6 - e * 0.9) / 0.9);
    if (u <= 0) continue;
    const a = tri[e].p, b = tri[(e + 1) % 3].p;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], u), lerp(a[1], b[1], u)); ctx.stroke();
  }
  ctx.restore();
  tri.forEach((s, i) => {
    const pulse = 1 + 0.15 * Math.sin(lt * 3 + i);
    paper(star(4, s.p[0], s.p[1], 11 * pulse, 2.6, 0), '#fff4d2', 0, 0.2);
    paper(star(4, s.p[0], s.p[1], 6 * pulse, 2, Math.PI / 4), '#fff4d2', 0, 0.2);
    const la = smooth(4.2 + i * 0.5, 5.2 + i * 0.5, lt);
    text(s.name, s.p[0] + s.dx, s.p[1] - 8, { font: `600 22px ${F_EN}`, color: '#f6ecd6', align: s.al, alpha: la });
    text(s.ar, s.p[0] + s.dx, s.p[1] + 14, { font: `italic 500 18px ${F_EN}`, color: PAL.gold, align: s.al, alpha: la });
  });

  // Skyline
  const sil = '#1b2045';
  paper(R(-10, 470, W + 20, 80), sil, 0);
  [[90, 60, 50], [230, 90, 70], [1010, 70, 60], [1180, 50, 44]].forEach(([x, w, h]) => paper(dome(x, 474, w, h), sil, 0));
  paper(R(160, 380, 14, 100), sil, 0); paper(dome(167, 382, 16, 20), sil, 0);
  paper(R(1100, 400, 12, 80), sil, 0); paper(dome(1106, 402, 14, 18), sil, 0);

  // Roof terrace
  paper(R(-10, 520, W + 20, 220), '#3b3354', 3);
  const lanternX = 238, lanternY = 470;
  const lg = ctx.createRadialGradient(lanternX, lanternY + 20, 5, lanternX, lanternY + 20, 190);
  lg.addColorStop(0, 'rgba(255,196,110,0.4)'); lg.addColorStop(1, 'rgba(255,196,110,0)');
  ctx.fillStyle = lg; ctx.fillRect(lanternX - 200, lanternY - 180, 400, 400);
  seg(190, 600, 190, 420, 6, '#2a2238', 2);
  seg(190, 424, 240, 424, 4, '#2a2238', 1);
  hangingLamp(238, 424, 26, Math.sin(lt * 1.2) * 0.08, 1.1);

  // Apprentice recording the observations
  person(320, 604, 1.35, { sit: true, robe: '#6b4a3a', turban: '#d8ccb0', skin: '#a8744d', arm: 1.3, armLen: 30, sash: PAL.brick });
  paper(rotRect(378, 578, 40, 26, -0.25), '#e8dcbc', 2);

  // Armillary sphere
  const ax = 945, ay = 360, Rr = 118;
  seg(ax, 470, ax, 600, 14, PAL.goldDk, 3);
  paper(R(ax - 52, 588, 104, 16), PAL.goldDk, 3);
  const ang = lt * 0.55;
  ctx.save(); ctx.translate(ax, ay); ctx.rotate(0.42);
  strokePts(E(0, 0, Rr * Math.abs(Math.cos(ang)) + 1, Rr, 40), PAL.goldDk, 4, 2);
  strokePts(E(0, 0, Rr, Rr * 0.34 * Math.sin(ang * 0.7 + 1), 40), PAL.gold, 4, 2);
  seg(0, -Rr - 22, 0, Rr + 22, 3, PAL.gold, 1);
  ctx.restore();
  strokePts(E(ax, ay, Rr + 6, Rr + 6, 48), PAL.gold, 6, 3);
  strokePts(E(ax, ay, Rr + 6, 30, 40), PAL.gold, 5, 2);
  paper(C(ax, ay, 16, 16), '#2f5f8a', 2);
  paper(C(ax - 4, ay - 4, 5, 8), '#6cbcae', 0);

  // Astronomer sighting Altair through an astrolabe
  const pa = person(590, 604, 1.45, { robe: '#5a4a6e', cloak: PAL.black, turban: '#e0d4b8', beard: '#d8d0c4', skin: '#a8744d', arm: 2.0, armLen: 40, sash: PAL.gold });
  astrolabe(pa.hand.x + 4, pa.hand.y + 52, 40, lt * 0.35);
  ctx.strokeStyle = alpha(PAL.gold, 0.8); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(pa.hand.x, pa.hand.y); ctx.lineTo(pa.hand.x + 4, pa.hand.y + 3); ctx.stroke();

  // Parapet with stepped merlons
  paper(R(-10, 598, W + 20, 130), '#4e4168', 3);
  for (let x = -6; x < W; x += 52) paper([[x, 600], [x, 586], [x + 8, 586], [x + 8, 578], [x + 24, 578], [x + 24, 586], [x + 32, 586], [x + 32, 600]], '#4e4168', 2, 0.5);
  for (let x = 30; x < W; x += 120) paper(star(8, x, 660, 14, 8, Math.PI / 8), '#3e3358', 0, 0.4);
}

// ---------------------------------------------------------------------------
// 4. The souq
// ---------------------------------------------------------------------------
function awning(x, w, colA, colB, lt) {
  const n = Math.round(w / 32), sw = (w + 30) / n;
  for (let i = 0; i < n; i++) {
    const x0 = x - 15 + i * sw, fl = Math.sin(lt * 4 + i * 0.8 + x) * 2.5;
    const pts = [[x0, 272], [x0 + sw, 272]];
    E(x0 + sw / 2, 318 + fl, sw / 2, 12, 8, 0, Math.PI).forEach(pt => pts.push(pt));
    paper(pts, i % 2 ? colB : colA, i === 0 ? 3 : 1, 0.6);
  }
  paper(R(x - 18, 264, w + 36, 12), PAL.woodDk, 3);
}

function stallFrame(x, w, colA, colB, back, lt) {
  seg(x + 4, 540, x + 4, 272, 9, PAL.wood, 3);
  seg(x + w - 4, 540, x + w - 4, 272, 9, PAL.wood, 3);
  paper(R(x + 8, 300, w - 16, 180), back, 0);
  awning(x, w, colA, colB, lt);
}

function counter(x, w) {
  paper(R(x - 6, 470, w + 12, 72), '#8a5530', 3);
  paper(R(x - 6, 470, w + 12, 8), '#a8693c', 1);
  for (let k = x + 20; k < x + w; k += 34) paper(star(4, k, 508, 9, 4), '#6e4125', 0, 0.4);
}

function sceneSouq(lt, dur) {
  const p = lt / dur;
  ctx.fillStyle = '#f5ddaa';
  ctx.fillRect(0, 0, W, H);
  paper(dome(1060, 190, 150, 130), '#ecca8e', 0);
  paper(R(1150, 60, 18, 140), '#ecca8e', 0);
  paper(dome(1159, 62, 22, 26), '#ecca8e', 0);
  cloud(fract((300 + lt * 10) / 1500) * 1500 - 100, 80, 0.9, '#fdf2dc');

  // Street facade behind the stalls
  paper(R(-10, 170, W + 20, 390), '#dca864', 3);
  paper(R(-10, 160, W + 20, 16), '#b87a44', 2);
  for (let i = 0; i < 7; i++) {
    const x = 20 + i * 190;
    paper(arch(x, 190, 120, 200), '#b27442', 1);
    paper(arch(x + 12, 204, 96, 186), '#7a4a2c', 0);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) paper(star(4, x + 36 + c * 24, 262 + r * 28, 7, 3), '#a0693c', 0, 0.3);
  }

  // Bunting
  [[150, 36], [120, 30]].forEach(([y0, sag], row) => {
    ctx.strokeStyle = PAL.woodDk; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = -10; x <= W + 10; x += 20) { const y = y0 + sag * Math.sin(Math.PI * x / W) + row * 4; x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    const cols = [PAL.terracotta, PAL.saffron, PAL.lapis, PAL.turq, PAL.cream];
    for (let x = 20 + row * 25; x < W; x += 50) {
      const y = y0 + sag * Math.sin(Math.PI * x / W) + row * 4, fl = Math.sin(lt * 5 + x * 0.05) * 5;
      paper([[x - 10, y], [x + 10, y], [x + fl, y + 26]], cols[(x / 50 + row) % 5 | 0], 1, 0.4);
    }
  });

  // Stall 1: spices
  stallFrame(60, 320, PAL.terracotta, PAL.cream, '#8e5a34', lt);
  for (let k = 0; k < 4; k++) paper(E(110 + k * 70, 350, 12, 22, 10), ['#9a3a2a', '#6d7f3a', '#c9a24a', '#7a5a3a'][k], 2, 0.5);
  person(215, 540, 1.3, { robe: '#3f6f5e', turban: PAL.white, beard: '#3a2a20', arm: 1.1 + Math.sin(lt * 2.2) * 0.35, armLen: 34, sash: PAL.saffron });
  counter(60, 320);
  const spices = [PAL.saffron, '#8f2a2a', '#e8c23c', '#8a6436', '#6d7f3a'];
  spices.forEach((c, k) => {
    const bx = 92 + k * 60;
    paper(dome(bx, 468, 44, 34 + (k % 2) * 8), c, 2);
    paper(E(bx, 468, 28, 12, 16, 0, Math.PI), '#9a6a3a', 2);
    paper(E(bx, 468, 28, 4, 16), '#7a4f2a', 0, 0.4);
  });

  // Stall 2: silk, cloth and paper
  stallFrame(470, 330, PAL.lapis, PAL.cream, '#5a4a6a', lt);
  const cloths = [['#c7695a', PAL.gold], [PAL.turq, PAL.cream], [PAL.saffron, PAL.brick], ['#6e3b6e', PAL.gold]];
  cloths.forEach(([c1, c2], k) => {
    const x0 = 500 + k * 44, swy = Math.sin(lt * 1.6 + k) * 6;
    paper([[x0, 330], [x0 + 34, 330], [x0 + 34 + swy, 450], [x0 + swy, 450]], c1, 2, 0.6);
    paper([[x0, 390], [x0 + 34, 390], [x0 + 34 + swy * 0.6, 398], [x0 + swy * 0.6, 398]], c2, 0, 0.3);
  });
  // Balance scale hanging from the awning
  const tilt = Math.sin(lt * 1.4) * 0.12;
  const pvx = 730, pvy = 350;
  ctx.strokeStyle = PAL.woodDk; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(pvx, 290); ctx.lineTo(pvx, pvy); ctx.stroke();
  const ex = Math.cos(tilt) * 44, ey = Math.sin(tilt) * 44;
  seg(pvx - ex, pvy - ey, pvx + ex, pvy + ey, 4, PAL.goldDk, 1);
  [[pvx - ex, pvy - ey], [pvx + ex, pvy + ey]].forEach(([x, y]) => {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 12, y + 44); ctx.moveTo(x, y); ctx.lineTo(x + 12, y + 44); ctx.stroke();
    paper(E(x, y + 44, 16, 6, 12, 0, Math.PI), PAL.gold, 1);
  });
  paper(C(pvx + ex, pvy + ey + 38, 5, 8), PAL.saffron, 0);
  person(660, 540, 1.3, { robe: '#e0cfa6', cloak: '#7a3a2a', turban: PAL.lapis, beard: PAL.ink, arm: 1.6, armLen: 30 });
  counter(470, 330);
  for (let k = 0; k < 3; k++) {
    paper(R(492, 452 - k * 14, 70, 14), [PAL.rose, PAL.turq, PAL.saffron][k], 2);
    paper(E(562, 459 - k * 14, 5, 7, 8), shade([PAL.rose, PAL.turq, PAL.saffron][k], 0.2), 0);
  }
  for (let k = 0; k < 6; k++) paper(R(700 + (k % 2) * 3, 462 - k * 4, 74, 4), k % 2 ? '#f6ecd6' : '#ece0c0', 1, 0.3);

  // Stall 3: glazed pottery and brass lamps
  stallFrame(880, 330, PAL.turq, PAL.cream, '#6e5a3e', lt);
  [930, 1010, 1090, 1170].forEach((x, k) => hangingLamp(x, 322, 26 + (k % 2) * 12, Math.sin(lt * 1.8 + k * 1.3) * 0.18, 0.9));
  person(1045, 540, 1.3, { robe: PAL.brick, turban: PAL.cream, beard: '#5a4a3a', arm: 0.7 + Math.sin(lt * 1.5) * 0.15, sash: PAL.turq });
  counter(880, 330);
  [[915, PAL.turq], [975, '#2f6f9f'], [1135, PAL.turq], [1190, '#c8a060']].forEach(([x, c], k) => {
    paper(E(x, 440, 22, 28, 18), c, 2);
    paper(R(x - 8, 400, 16, 16), c, 1);
    paper(E(x, 400, 12, 4, 10), shade(c, 0.2), 0);
    paper(E(x, 440, 22, 4, 14), alpha(PAL.cream, 0.6), 0, 0.4);
  });
  paper(E(1055, 452, 38, 18, 16, 0, Math.PI), '#b98a3a', 2);
  paper(E(1055, 452, 38, 5, 16), '#d9b25c', 0);

  // Street
  paper(R(-10, 540, W + 20, 200), '#d8b27a', 3);
  for (let i = 0; i < 40; i++) paper(E(rand(i, 1) * W, 560 + rand(i, 2) * 150, 10 + rand(i, 3) * 10, 3, 8), '#c9a068', 0, 0.4);
  cat(430, 600, lt);

  // Shopper with a basket, walking in
  const bxw = lerp(-80, 380, easeOut(p * 1.3));
  const walk = Math.sin(lt * 7);
  const shopper = person(bxw, 648 - Math.abs(walk) * 3, 1.35, { robe: '#6e3b6e', veil: PAL.cream, skin: '#b88258', arm: 0.2 + walk * 0.1, armLen: 32 });
  paper(E(shopper.hand.x, shopper.hand.y + 10, 18, 12, 14, 0, Math.PI), '#9a6a3a', 2);
  paperGroup([C(shopper.hand.x - 6, shopper.hand.y + 6, 5, 8), C(shopper.hand.x + 5, shopper.hand.y + 5, 5, 8)], PAL.pomegranate, 1);

  // Camel caravan arriving with its handler
  const cx = lerp(1500, 860, easeOut(p * 1.05));
  const ht = lt;
  const handler = person(cx - 210, 700, 1.3, { robe: '#e8d9b8', turban: PAL.brick, beard: PAL.ink, face: -1, arm: 0.5, skin: '#9c6a48', sash: PAL.lapis });
  camel(cx, 704, 1.05, ht);
  ctx.strokeStyle = PAL.woodDk; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(handler.hand.x, handler.hand.y);
  ctx.quadraticCurveTo((handler.hand.x + cx - 150) / 2, handler.hand.y + 40, cx - 150, 704 - 232 * 1.05);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// 5. A palace garden
// ---------------------------------------------------------------------------
function sceneGarden(lt, dur) {
  ctx.fillStyle = '#bfd9d0';
  ctx.fillRect(0, 0, W, H);
  cloud(fract((200 + lt * 8) / 1500) * 1500 - 100, 110, 1, '#f6efdc');
  cloud(900 + lt * 5, 70, 0.7, '#f6efdc');

  // Arcade
  paper(R(-10, 150, W + 20, 380), '#efe0bf', 3);
  paper(R(-10, 136, W + 20, 30), PAL.turq, 3);
  for (let x = 10; x < W; x += 40) paper(star(8, x, 151, 10, 5, Math.PI / 8), PAL.cream, 0, 0.3);
  for (let i = 0; i < 6; i++) {
    const x = 35 + i * 210;
    paper(arch(x - 10, 196, 170, 320), PAL.terracotta, 3);
    paper(arch(x, 208, 150, 308), '#23406e', 0);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
      if (r === 0 && c !== 1) continue;
      paper(star(8, x + 35 + c * 40, 262 + r * 50, 13, 7, Math.PI / 8), alpha(PAL.turqLt, 0.55), 0, 0.3);
    }
    paper(R(x + 150 + 12, 200, 24, 330), '#e2cfa6', 2);
  }
  cypress(110, 540, 380, 70, Math.sin(lt * 0.9) * 0.3, '#2f4f35');
  cypress(1170, 540, 360, 64, Math.sin(lt * 0.9 + 1) * 0.3, '#2f4f35');
  cypress(470, 530, 250, 48, Math.sin(lt * 0.9 + 2) * 0.3, '#3a5a3c');
  cypress(810, 530, 250, 48, Math.sin(lt * 0.9 + 3) * 0.3, '#3a5a3c');

  // Pomegranate tree
  seg(1000, 560, 1004, 430, 16, '#6a4428', 2);
  seg(1003, 470, 960, 420, 8, '#6a4428', 1);
  seg(1003, 460, 1050, 410, 8, '#6a4428', 1);
  const leafy = [[960, 400, 55, 45], [1050, 390, 60, 48], [1005, 360, 64, 52], [940, 440, 40, 30], [1070, 440, 44, 32]];
  paperGroup(leafy.map(([x, y, rx, ry]) => E(x + Math.sin(lt + x) * 2, y, rx, ry, 22)), '#557a3a', 3);
  paperGroup(leafy.map(([x, y, rx, ry]) => E(x - 8, y - 8, rx * 0.6, ry * 0.5, 16)), '#6a8f45', 0);
  [[950, 420], [1000, 380], [1040, 420], [1080, 380], [980, 340], [1030, 350], [930, 380], [1070, 450]].forEach(([x, y], i) => {
    const bob = Math.sin(lt * 1.3 + i) * 2;
    paper(C(x, y + bob, 9, 12), PAL.pomegranate, 2);
    paper([[x - 3, y - 9 + bob], [x, y - 13 + bob], [x + 3, y - 9 + bob]], shade(PAL.pomegranate, 0.2), 0, 0.2);
  });

  // Paving and the water channel
  paper(R(-10, 520, W + 20, 220), '#d5bb86', 3);
  for (let r = 0; r < 5; r++) for (let c = -2; c < 20; c++) {
    const y = 530 + r * 40, x = c * 70 + (r % 2) * 35 + (y - 530) * (c - 9) * 0.06;
    paper(star(4, x, y + 10, 8, 3), '#c4a570', 0, 0.3);
  }
  paper([[560, 730], [720, 730], [684, 540], [596, 540]], PAL.cream, 2);
  paper([[574, 730], [706, 730], [676, 544], [604, 544]], '#3f9c95', 0);
  for (let i = 0; i < 8; i++) {
    const u = fract(i / 8 + lt * 0.12), y = 560 + u * 170, hw = lerp(34, 60, u);
    paper(E(640, y, hw * 0.6, 2 + u * 2, 14), `rgba(220,245,235,${0.45 * (1 - u)})`, 0, 0.3);
  }

  // Fountain
  paper(E(640, 552, 118, 30, 32), PAL.cream, 3);
  paper(E(640, 548, 104, 22, 32), '#4fb0a4', 0);
  for (let i = 0; i < 3; i++) {
    const u = fract(lt * 0.5 + i / 3);
    ctx.strokeStyle = `rgba(240,252,248,${0.6 * (1 - u)})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(640, 548, 20 + u * 80, 4 + u * 16, 0, 0, Math.PI * 2); ctx.stroke();
  }
  paper(R(631, 478, 18, 70), PAL.cream, 2);
  paper(E(640, 478, 34, 9, 18), '#e6d7b6', 2);
  paper(E(640, 474, 28, 5, 18), '#4fb0a4', 0);
  paper([[636, 474], [644, 474], [642, 440], [638, 440]], 'rgba(230,250,245,0.85)', 0, 0.4);
  for (let i = 0; i < 80; i++) {
    const ph = fract(lt * 0.7 + i / 80), side = i % 2 ? 1 : -1;
    const x = 640 + side * (30 + rand(i, 1) * 70) * ph;
    const y = 440 - 302 * ph + 380 * ph * ph + (rand(i, 2) - 0.5) * 6;
    ctx.fillStyle = `rgba(236,250,246,${0.9 - ph * 0.5})`;
    ctx.beginPath(); ctx.arc(x, y, 2.2 - ph, 0, Math.PI * 2); ctx.fill();
  }

  // Flower beds
  [[-20, 330], [960, 1300]].forEach(([x0, x1], b) => {
    const pts = [[x0, 730], [x0, 690]];
    for (let x = x0; x <= x1; x += 30) pts.push([x, 668 + Math.sin(x * 0.05 + b) * 10]);
    pts.push([x1, 730]);
    paper(pts, '#4f7038', 3);
    for (let x = x0 + 15; x < x1; x += 34) {
      const y = 672 + Math.sin(x * 0.05 + b) * 10 + Math.sin(lt * 2 + x) * 1.5;
      paper(star(5, x, y, 8, 4, x), x % 3 ? '#c7485a' : '#f0c4b4', 1, 0.3);
      paper(C(x, y, 2.5, 6), PAL.saffron, 0, 0.1);
    }
  });

  // Musician with an oud
  paper(R(240, 636, 180, 22), PAL.brick, 2);
  paper(R(250, 642, 160, 10), PAL.saffron, 0, 0.4);
  const mus = person(320, 648, 1.5, { sit: true, robe: '#2f4f7f', turban: PAL.saffron, beard: PAL.ink, sash: PAL.gold, armLater: true, nod: Math.sin(lt * 2.4) * 0.05 });
  ctx.save(); ctx.translate(372, 594); ctx.rotate(-0.42);
  paper(R(18, -5, 70, 10), '#6a3a1c', 2);
  paper([[86, -6], [104, 6], [98, 12], [84, 4]], '#6a3a1c', 1);
  paper(E(0, 0, 36, 26, 24), '#9a5a2c', 3);
  paper(E(-4, 3, 28, 19, 20), '#b87038', 0);
  paper(C(8, -4, 6, 12), '#3a2010', 0);
  ctx.strokeStyle = 'rgba(250,240,220,0.7)'; ctx.lineWidth = 0.8;
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(-26, k * 1.6); ctx.lineTo(88, k * 1.4); ctx.stroke(); }
  ctx.restore();
  mus.reach(372 + Math.sin(lt * 9) * 6, 600 + Math.cos(lt * 9) * 3, 40);

  // Notes rising from the strings
  for (let i = 0; i < 7; i++) {
    const u = fract(lt * 0.28 + i / 7);
    const x = 400 + u * 180 + Math.sin(u * 8 + i) * 12, y = 580 - u * 240;
    ctx.save(); ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
    paper(E(x, y, 6, 4.5, 10), PAL.lapisDk, 0, 0.2);
    paper(R(x + 4, y - 22, 2.5, 22), PAL.lapisDk, 0, 0.1);
    if (i % 2) paper([[x + 6, y - 22], [x + 16, y - 14], [x + 6, y - 16]], PAL.lapisDk, 0, 0.1);
    ctx.restore();
  }

  // Poet reciting from a leaf of verse, with ewer and dates
  paper(R(860, 636, 200, 22), PAL.lapis, 2);
  paper(R(872, 642, 176, 10), PAL.turq, 0, 0.4);
  const poet = person(960, 648, 1.5, { sit: true, face: -1, robe: '#e3cfa2', cloak: PAL.rose, turban: PAL.white, beard: '#7a6a5a', arm: 1.5 + Math.sin(lt * 1.1) * 0.1, armLen: 32, nod: Math.sin(lt * 1.1) * 0.04 });
  paper(rotRect(poet.hand.x - 16, poet.hand.y - 12, 26, 36, 0.2), PAL.cream, 2);
  paper([[800, 640], [830, 640], [826, 608], [836, 596], [812, 580], [796, 596], [806, 608]], PAL.gold, 2);
  seg(830, 604, 846, 592, 4, PAL.gold, 1);
  paper(E(760, 646, 26, 10, 14, 0, Math.PI), PAL.turq, 2);
  paperGroup([C(752, 640, 5, 8), C(764, 638, 5, 8), C(758, 634, 5, 8)], '#6a3a1c', 0);

  // Drifting petals
  for (let i = 0; i < 26; i++) {
    const x = fract(rand(i, 1) + lt * 0.02 * (1 + rand(i, 2))) * (W + 100) - 50;
    const y = fract(rand(i, 3) + lt * 0.05 * (0.6 + rand(i, 4))) * (H + 40) - 20;
    ctx.save(); ctx.translate(x + Math.sin(lt * 2 + i) * 10, y); ctx.rotate(lt * 2 + i);
    paper(E(0, 0, 5, 2.6, 8), i % 3 ? '#e8a0a0' : '#f4d0c0', 0, 0.2);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// 6. Dusk on the Tigris
// ---------------------------------------------------------------------------
function sceneDusk(lt, dur) {
  const p = lt / dur;
  ctx.fillStyle = '#2d2350';
  ctx.fillRect(0, 0, W, H);
  [[100, '#5b2f5e'], [190, '#9a4460'], [270, '#dc6e4c'], [335, '#f4a55a'], [382, '#fbd08a']]
    .forEach(([y, c], i) => band(y, 8, 0.005, i * 1.3 + lt * 0.1, c, 3));

  const sx = 700, sy = lerp(360, 440, p);
  paper(C(sx, sy, 130, 36), 'rgba(255,220,160,0.18)', 0);
  paper(C(sx, sy, 72, 30), '#fcd97a', 3);
  cloud(fract((300 + lt * 8) / 1500) * 1500 - 100, 180, 1.2, '#b85a6a');
  cloud(1000 + lt * 5, 250, 0.9, '#e48a6a');
  flock(lt, -200, 220, 70, 9, 1.1, '#2d1e33', 5);

  // Far bank silhouette, windows lighting up one by one
  const sil = '#3a2447';
  paper(R(-10, 400, W + 20, 60), sil, 2);
  const blds = [[40, 90, 40], [150, 70, 60], [300, 100, 30], [470, 80, 55], [620, 120, 70], [800, 90, 40], [960, 110, 50], [1120, 100, 45]];
  blds.forEach(([x, w, h]) => paper(R(x, 400 - h, w, h + 10), sil, 0));
  paper(R(582, 300, 116, 60), sil, 0);
  paper(dome(640, 302, 132, 112), '#2f2040', 0);
  paper(R(638, 176, 4, 18), '#2f2040', 0);
  [380, 890].forEach(x => { paper(R(x - 7, 250, 14, 160), sil, 0); paper(R(x - 12, 280, 24, 7), sil, 0); paper(dome(x, 252, 18, 22), sil, 0); });
  [230, 1050].forEach((x, i) => palm(x, 410, 120, Math.sin(lt + i) * 0.04, sil, sil, false));
  for (let i = 0; i < 22; i++) {
    const b = blds[i % blds.length];
    const wx = b[0] + 10 + rand(i, 1) * (b[1] - 20), wy = 400 - b[2] + 10 + rand(i, 2) * (b[2] - 10);
    const on = smooth(0.5 + rand(i, 3) * 5, 1 + rand(i, 3) * 5, lt);
    if (on > 0) paper(R(wx, wy, 5, 7), `rgba(255,200,100,${on})`, 0, 0.3);
  }

  // Pontoon bridge of boats
  for (let x = -20; x < 470; x += 34) paper(E(x, 456, 17, 6, 12, 0, Math.PI), '#2a1a33', 0);
  paper(R(-20, 448, 490, 5), '#4a3050', 0);
  for (let i = 0; i < 4; i++) {
    const fx = fract(rand(i, 7) + lt * 0.02) * 470;
    paper([[fx - 3, 448], [fx + 3, 448], [fx + 2, 434], [fx - 2, 434]], '#2a1a33', 0, 0.2);
    paper(C(fx, 431, 3, 8), '#2a1a33', 0, 0.2);
  }

  // River
  band(460, 2, 0.02, lt, '#7a3f5f', 2);
  band(520, 3, 0.015, lt * 1.2, '#5d3358', 2);
  band(610, 4, 0.012, lt * 1.4, '#43284c', 2);
  for (let k = 0; k < 12; k++) {
    const y = 466 + k * 20, w = 150 - k * 10 + Math.sin(lt * 3 + k) * 14;
    paper(R(sx - w / 2 + Math.sin(lt * 2 + k) * 8, y, w, 4), alpha('#fcd97a', 0.7 - k * 0.045), 0, 0.5);
  }
  for (let i = 0; i < 24; i++) {
    const wx = fract((i * 131 + lt * 24 * (1 + (i % 3) * 0.3)) / (W + 200)) * (W + 200) - 100;
    const wy = 490 + (i * 43) % 220;
    paper(E(wx, wy, 24 + (i % 4) * 10, 2, 12), 'rgba(255,200,170,0.25)', 0, 0.4);
  }

  dhow(lerp(1380, 900, p), 528, 0.5, lt + 2, { hull: '#2e1c24', sail: '#e9b89a', stripe: '#8a3a4a' });
  quffa(lerp(1000, 1180, p), 690 + Math.sin(lt * 1.6) * 3, 0.9, '#4a2e2a');
  dhow(lerp(-260, 520, easeInOut(p * 0.95)), 640 + Math.sin(lt * 1.2) * 3, 1.05, lt, { hull: '#3b2217', sail: '#f3dcb8', stripe: PAL.terracotta, crew: true });
}

// ---------------------------------------------------------------------------
// 7. Closing card: an eight-pointed star rosette
// ---------------------------------------------------------------------------
function sceneEnd(lt, dur) {
  ctx.fillStyle = PAL.lapis;
  ctx.fillRect(0, 0, W, H);
  const cx = 640, cy = 250;
  for (let r = -1; r < 10; r++) for (let c = -1; c < 17; c++) {
    const x = c * 84 + (r % 2) * 42, y = r * 84 + 20;
    const dd = Math.hypot(x - cx, y - cy);
    const a = smooth(dd / 420, dd / 420 + 0.6, lt);
    if (a <= 0) continue;
    paper(star(8, x, y, 22 * a, 12 * a, Math.PI / 8), PAL.lapisDk, 0, 0.4);
    paper(star(4, x + 42, y + 42, 8 * a, 3 * a), alpha(PAL.gold, 0.35), 0, 0.3);
  }
  const s = easeOut(lt / 1.6), rot = lt * 0.08;
  if (s > 0) {
    paper(C(cx, cy, 168 * s, 60), PAL.cream, 5);
    paper(star(8, cx, cy, 150 * s, 110 * s, rot), PAL.gold, 3);
    paper(star(8, cx, cy, 124 * s, 84 * s, -rot + Math.PI / 8), PAL.turq, 3);
    paper(C(cx, cy, 70 * s, 32), PAL.cream, 2);
    paper(star(8, cx, cy, 56 * s, 34 * s, rot * 2), PAL.lapis, 2);
    paper(C(cx, cy, 16 * s, 16), PAL.gold, 1);
    for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8 + rot, rr = 160 * s;
      paper(C(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 6 * s, 10), PAL.terracotta, 1);
    }
  }
  text('العصر الذهبي', W / 2, 470, { font: `700 52px ${F_AR}`, color: PAL.gold, alpha: smooth(0.8, 1.8, lt), shadow: 'rgba(0,0,0,0.3)' });
  text('The Golden Age of the Abbasid Caliphate', W / 2, 538, { font: `600 44px ${F_EN}`, color: PAL.cream, alpha: smooth(1.3, 2.3, lt), shadow: 'rgba(0,0,0,0.3)' });
  text('Baghdad  ·  762 – 1258 CE', W / 2, 588, { font: `italic 500 26px ${F_EN}`, color: PAL.gold, alpha: smooth(1.9, 2.9, lt), spacing: 1 });
}

// Paper caption label that drops in from the top of the frame.
function caption(lt, ar, en) {
  const a = easeOut((lt - 0.5) / 0.9);
  if (a <= 0) return;
  ctx.save();
  ctx.font = `italic 500 23px ${F_EN}`;
  const bw = Math.max(ctx.measureText(en).width + 80, 320), bh = 88, bx = (W - bw) / 2;
  const by = lerp(-bh - 20, 16, a);
  ctx.strokeStyle = PAL.woodDk; ctx.lineWidth = 1.5;
  [bx + 40, bx + bw - 40].forEach(x => { ctx.beginPath(); ctx.moveTo(x, -5); ctx.lineTo(x, by + 4); ctx.stroke(); });
  paper(chamfer(bx, by, bw, bh, 14), PAL.cream, 5, 0.8);
  const inner = rough(chamfer(bx + 6, by + 6, bw - 12, bh - 12, 10), 0.6);
  trace(inner); ctx.strokeStyle = alpha(PAL.lapis, 0.7); ctx.lineWidth = 1.5; ctx.stroke();
  [bx + 22, bx + bw - 22].forEach(x => paper(star(8, x, by + bh / 2, 7, 3.5), PAL.terracotta, 0, 0.3));
  text(ar, W / 2, by + 30, { font: `700 26px ${F_AR}`, color: PAL.terracotta });
  text(en, W / 2, by + 63, { font: `italic 500 23px ${F_EN}`, color: PAL.ink });
  ctx.restore();
}
