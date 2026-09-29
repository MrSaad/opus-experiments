// Builds the gym, the lobby and the locker-room corridor from primitives.
//
// Coordinates are metres. +x runs east along the treadmill row, +z runs south, y is up.
//   Gym:      x 0..17,    z -7.5..0   (glass curtain wall on the north side, the mirror on z = 0)
//   Lobby:    x 12.8..17, z 0..7      (dark tiled elevator wall on x = 17, mural wall on x = 12.8)
//   Corridor: x 11..12.4, z 0..9      (locker rooms)
// Everything north of the mirror goes in `gym` so it can be reflected; the rest goes in `lobby`.
import * as THREE from 'three';
import { Builder, Frame } from './builder.js';
import * as TX from './textures.js';

export const GYM_H = 4.3, LOBBY_H = 3.2, CORR_H = 2.8;
export const MIRROR = { x0: 0.3, x1: 10.8, y0: 0.03, y1: 3.0, z: 0 };
export const SPAWN = { x: 6.2, z: -4.2, yaw: Math.PI + 0.35 };
export const LIGHTS = [ // gym ceiling lights; each is mirrored across z = 0 as well
  { x: 2.8, y: 2.7, z: -3.75 }, { x: 8.5, y: 2.7, z: -3.75 }, { x: 14.2, y: 2.7, z: -3.75 },
];

function materials() {
  const lam = (name, color, o = {}) => { const m = new THREE.MeshLambertMaterial({ color, ...o }); m.name = name; return m; };
  const basic = (name, o) => { const m = new THREE.MeshBasicMaterial(o); m.name = name; return m; };
  const M = {};
  M.white = lam('white', 0xe6e2da);
  M.ledge = lam('ledge', 0xf3f1ea, { emissive: 0x3a3a36 });
  M.ceiling = lam('ceiling', 0xeeebe5);
  M.ceilingLow = lam('ceilingLow', 0xeeebe5, { emissive: 0x2a2926 }); // lobby/corridor: lit by bounce, not by the lamps
  M.rubber = lam('rubber', 0xffffff, { map: TX.rubberTexture() }); M.rubber.userData.worldUV = 1;
  M.slate = lam('slate', 0xffffff, { map: TX.slateTexture() }); M.slate.userData.worldUV = 1 / 2.4;
  M.darkTile = lam('darkTile', 0xffffff, { map: TX.darkTileTexture() }); M.darkTile.userData.worldUV = 1 / 1.2;
  const conc = TX.concreteTexture(); conc.repeat.set(2, 3);
  M.concrete = lam('concrete', 0xffffff, { map: conc });
  M.panel = lam('panel', 0x3f4043);
  M.corridor = lam('corridor', 0x55565a);
  M.mullion = lam('mullion', 0x26272a);
  M.frame = lam('frame', 0x2f3033);
  M.door = lam('door', 0x4f5154);
  M.elevator = lam('elevator', 0x6a6c6f);
  M.steel = lam('steel', 0xb7babe, { emissive: 0x151515 });
  M.silver = lam('silver', 0x9ea2a7);
  M.plasticDark = lam('plasticDark', 0x2d2f32);
  M.plasticGrey = lam('plasticGrey', 0x5f6266);
  M.housing = lam('housing', 0x6f7276);
  M.belt = lam('belt', 0x111112);
  M.seat = lam('seat', 0x222325);
  M.orange = lam('orange', 0xd98a2b, { emissive: 0x3a1c00 });
  M.purple = lam('purple', 0x4a2b6e);
  M.teal = lam('teal', 0x2a9d93);
  M.pink = lam('pink', 0xd14a86);
  M.black = lam('black', 0x171718);
  M.yellow = lam('yellow', 0xf3c21b, { emissive: 0x2a2000 });
  M.ballRed = lam('ballRed', 0x7c2723);
  M.ballGrey = lam('ballGrey', 0x3a3b3e);
  M.grille = lam('grille', 0x8d8d8a);
  M.speckle = lam('speckle', 0xffffff, { map: TX.speckleTexture() });
  M.plaque = lam('plaque', 0xffffff, { map: TX.plaqueTexture() });
  M.clock = lam('clock', 0xffffff, { map: TX.clockTexture() });
  M.poster = lam('poster', 0xffffff, { map: TX.controlsPosterTexture(), emissive: 0x202020 });
  M.papers = [1, 2, 3, 4, 5].map((s) => lam('paper' + s, 0xffffff, { map: TX.paperTexture(s, { header: s % 2 === 1 }) }));
  const mural = TX.muralTexture();
  M.mural = lam('mural', 0xffffff, { map: mural, emissive: 0xffffff, emissiveMap: mural, emissiveIntensity: 0.35 });
  const sky = TX.skylineTexture(); sky.repeat.set(3, 1);
  M.skyline = basic('skyline', { map: sky, side: THREE.BackSide });
  M.screen = basic('screen', { map: TX.screenTexture() });
  M.screenLed = basic('screenLed', { map: TX.screenTexture('led') });
  M.exit = basic('exit', { map: TX.exitTexture() });
  M.downlight = basic('downlight', { color: 0xfff4de });
  M.cove = basic('cove', { color: 0xfff0d6 });
  M.glass = lam('glass', 0x1d2a3a, { transparent: true, opacity: 0.22, depthWrite: false });
  M.darkGlass = lam('darkGlass', 0x0b0e13, { transparent: true, opacity: 0.8, depthWrite: false });
  M.wash = basic('wash', { map: TX.glowTexture(), color: 0x7a6a55, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  M.blob = basic('blob', { map: TX.blobTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  return M;
}

// Wall running along X. Its face is at z = zf; dir = +1 when the room is on the +z side.
function wallX(f, mat, zf, dir, x0, x1, y0, y1, openings = [], t = 0.25) {
  const zc = zf - dir * t / 2;
  const xs = [...new Set([x0, x1, ...openings.flatMap((o) => [o.a0, o.a1])])].sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1]; if (b - a < 1e-4) continue;
    const mid = (a + b) / 2, o = openings.find((o) => mid > o.a0 && mid < o.a1);
    for (const [s, e] of o ? [[y0, o.y0], [o.y1, y1]] : [[y0, y1]]) {
      if (e - s > 1e-4) f.box(mat, b - a, e - s, t, mid, (s + e) / 2, zc);
    }
  }
}
// Wall running along Z. Face at x = xf; dir = +1 when the room is on the +x side.
function wallZ(f, mat, xf, dir, z0, z1, y0, y1, openings = [], t = 0.25) {
  const xc = xf - dir * t / 2;
  const zs = [...new Set([z0, z1, ...openings.flatMap((o) => [o.a0, o.a1])])].sort((a, b) => a - b);
  for (let i = 0; i < zs.length - 1; i++) {
    const a = zs[i], b = zs[i + 1]; if (b - a < 1e-4) continue;
    const mid = (a + b) / 2, o = openings.find((o) => mid > o.a0 && mid < o.a1);
    for (const [s, e] of o ? [[y0, o.y0], [o.y1, y1]] : [[y0, y1]]) {
      if (e - s > 1e-4) f.box(mat, t, e - s, b - a, xc, (s + e) / 2, mid);
    }
  }
}

const UP = -Math.PI / 2;   // plane rx that faces +y
const DOWN = Math.PI / 2;  // plane rx that faces -y
const FACE_E = Math.PI / 2, FACE_W = -Math.PI / 2, FACE_N = Math.PI; // plane ry

// ---------------------------------------------------------------- equipment
function treadmill(F, M, x, z, led) {
  const f = F.sub(x, 0, z);
  f.rbox(M.plasticDark, 0.86, 0.16, 2.0, 0.03, 0, 0.09, 0.1);
  f.box(M.belt, 0.56, 0.02, 1.55, 0, 0.18, 0.25);
  for (const s of [-1, 1]) {
    f.box(M.orange, 0.022, 0.012, 1.55, s * 0.3, 0.184, 0.25);
    f.box(M.plasticGrey, 0.12, 0.03, 1.55, s * 0.37, 0.18, 0.25);
    f.box(M.silver, 0.07, 1.2, 0.09, s * 0.39, 0.8, -0.72, 0.18);
    f.box(M.silver, 0.05, 0.05, 0.55, s * 0.39, 1.12, -0.35);
    f.box(M.plasticDark, 0.06, 0.06, 0.1, s * 0.39, 1.12, -0.06);
  }
  f.rbox(M.plasticDark, 0.86, 0.3, 0.5, 0.06, 0, 0.19, -0.72);
  f.box(M.plasticDark, 0.72, 0.045, 0.045, 0, 1.3, -0.47);
  const c = f.sub(0, 1.5, -0.6, -0.45);
  c.rbox(M.plasticDark, 0.8, 0.46, 0.1, 0.03);
  c.plane(led ? M.screenLed : M.screen, 0.46, 0.28, 0, 0.05, 0.052);
  c.box(M.orange, 0.56, 0.025, 0.02, 0, -0.16, 0.05);
  c.rbox(M.plasticGrey, 0.8, 0.07, 0.26, 0.02, 0, -0.25, 0.12);
}

function elliptical(F, M, x, z) {
  const f = F.sub(x, 0, z);
  f.box(M.plasticDark, 0.22, 0.1, 1.6, 0, 0.05, 0.05);
  f.box(M.plasticDark, 0.62, 0.06, 0.12, 0, 0.03, -0.72);
  f.box(M.plasticDark, 0.55, 0.06, 0.12, 0, 0.03, 0.82);
  f.cylX(M.housing, 0.34, 0.46, 0, 0.42, 0.6, 28);
  f.rbox(M.housing, 0.46, 0.46, 0.36, 0.1, 0, 0.3, 0.42);
  f.cylX(M.silver, 0.1, 0.47, 0, 0.42, 0.6, 16);
  for (const s of [-1, 1]) {
    f.box(M.plasticDark, 0.14, 0.04, 0.4, s * 0.13, 0.36, -0.02);
    f.bar(M.silver, 0.022, [s * 0.13, 0.36, 0.16], [s * 0.2, 0.5, 0.52]);
    f.bar(M.silver, 0.022, [s * 0.26, 0.45, -0.05], [s * 0.3, 1.55, -0.3]);
    f.bar(M.plasticDark, 0.03, [s * 0.3, 1.2, -0.26], [s * 0.31, 1.62, -0.33]);
    f.bar(M.silver, 0.02, [s * 0.26, 0.45, -0.05], [s * 0.13, 0.37, 0.1]);
  }
  f.bar(M.silver, 0.05, [0, 0.05, -0.62], [0, 1.35, -0.42]);
  const c = f.sub(0, 1.42, -0.42, -0.6);
  c.rbox(M.plasticDark, 0.36, 0.26, 0.08, 0.02);
  c.plane(M.screen, 0.22, 0.13, 0, 0.02, 0.041);
}

function uprightBike(F, M, x, z) {
  const f = F.sub(x, 0, z);
  f.box(M.plasticDark, 0.5, 0.06, 0.1, 0, 0.03, -0.45);
  f.box(M.plasticDark, 0.5, 0.06, 0.1, 0, 0.03, 0.45);
  f.bar(M.silver, 0.04, [0, 0.06, 0.45], [0, 0.55, 0.02]);
  f.rbox(M.housing, 0.22, 0.5, 0.62, 0.1, 0, 0.33, -0.15);
  f.bar(M.silver, 0.03, [0, 0.5, 0.05], [0, 0.86, 0.18]);
  f.rbox(M.seat, 0.22, 0.07, 0.28, 0.03, 0, 0.89, 0.2);
  f.bar(M.silver, 0.035, [0, 0.5, -0.32], [0, 1.05, -0.42]);
  f.bar(M.plasticDark, 0.02, [-0.23, 1.02, -0.36], [0.23, 1.02, -0.36]);
  f.bar(M.plasticDark, 0.02, [-0.23, 1.02, -0.36], [-0.2, 1.08, -0.52]);
  f.bar(M.plasticDark, 0.02, [0.23, 1.02, -0.36], [0.2, 1.08, -0.52]);
  const c = f.sub(0, 1.16, -0.46, -0.5);
  c.rbox(M.plasticDark, 0.28, 0.2, 0.06, 0.02);
  c.plane(M.screen, 0.18, 0.1, 0, 0.02, 0.031);
  f.cylX(M.plasticDark, 0.025, 0.4, 0, 0.35, -0.05);
  for (const s of [-1, 1]) f.box(M.plasticDark, 0.1, 0.025, 0.18, s * 0.22, 0.35, -0.05);
}

function recumbentBike(F, M, x, z) {
  const f = F.sub(x, 0, z);
  f.box(M.plasticDark, 0.18, 0.08, 1.5, 0, 0.06, 0.05);
  f.box(M.plasticDark, 0.5, 0.05, 0.1, 0, 0.03, 0.72);
  f.box(M.plasticDark, 0.5, 0.05, 0.1, 0, 0.03, -0.62);
  f.bar(M.silver, 0.035, [0, 0.08, 0.35], [0, 0.5, 0.35]);
  f.rbox(M.seat, 0.46, 0.08, 0.4, 0.03, 0, 0.53, 0.33);
  f.rbox(M.seat, 0.46, 0.62, 0.08, 0.03, 0, 0.86, 0.6, 0.3);
  for (const s of [-1, 1]) f.bar(M.silver, 0.018, [s * 0.29, 0.45, 0.2], [s * 0.29, 0.62, 0.48]);
  f.rbox(M.housing, 0.25, 0.46, 0.5, 0.1, 0, 0.3, -0.45);
  f.bar(M.silver, 0.035, [0, 0.45, -0.52], [0, 1.02, -0.4]);
  const c = f.sub(0, 1.08, -0.38, -0.4);
  c.rbox(M.plasticDark, 0.28, 0.2, 0.06, 0.02);
  c.plane(M.screen, 0.18, 0.1, 0, 0.02, 0.031);
  for (const s of [-1, 1]) f.box(M.plasticDark, 0.1, 0.025, 0.18, s * 0.2, 0.42, -0.72);
}

function wetFloorSign(F, M, x, z, ry) {
  const f = F.sub(x, 0, z, 0, ry);
  f.box(M.yellow, 0.3, 0.64, 0.012, 0, 0.31, 0.07, -0.2);
  f.box(M.yellow, 0.3, 0.64, 0.012, 0, 0.31, -0.07, 0.2);
  f.box(M.black, 0.16, 0.12, 0.014, 0, 0.36, 0.068, -0.2);
}

function radiatorCover(f, M, x0, x1, z, dir) {
  // along X, against a wall; dir = +1 when the room is to +z
  const d = 0.3, h = 0.45;
  f.box(M.white, x1 - x0, h, d, (x0 + x1) / 2, h / 2, z + dir * d / 2);
  f.box(M.grille, x1 - x0 - 0.1, 0.005, 0.12, (x0 + x1) / 2, h + 0.003, z + dir * d / 2);
}

// ---------------------------------------------------------------- world
export function buildWorld() {
  const M = materials();
  const gb = new Builder(), lb = new Builder();
  const G = new Frame(gb), L = new Frame(lb);
  const colliders = []; // {type:'box', x0,z0,x1,z1} | {type:'circle', x,z,r}
  const boxC = (x0, z0, x1, z1) => colliders.push({ type: 'box', x0, z0, x1, z1 });
  const blob = (x, z, w, d) => G.plane(M.blob, w, d, x, 0.004, z, UP);

  // ---- gym shell
  G.box(M.rubber, 17, 0.1, 7.5, 8.5, -0.05, -3.75);
  G.box(M.ceiling, 17, 0.1, 7.5, 8.5, GYM_H + 0.05, -3.75);

  // west wall with a slit window and a tall window
  const westWin = [{ a0: -5.6, a1: -5.25, y0: 0.6, y1: 3.8 }, { a0: -3.0, a1: -1.8, y0: 0.9, y1: 3.5 }];
  wallZ(G, M.white, 0, 1, -7.5, 0, 0, GYM_H, westWin, 0.3);
  for (const w of westWin) {
    const zc = (w.a0 + w.a1) / 2, zl = w.a1 - w.a0, hc = (w.y0 + w.y1) / 2, hl = w.y1 - w.y0;
    G.plane(M.glass, zl, hl, -0.2, hc, zc, 0, FACE_E);
    G.box(M.mullion, 0.06, hl, 0.04, -0.2, hc, w.a0 + 0.02); G.box(M.mullion, 0.06, hl, 0.04, -0.2, hc, w.a1 - 0.02);
    G.box(M.mullion, 0.06, 0.04, zl, -0.2, w.y0 + 0.02, zc); G.box(M.mullion, 0.06, 0.04, zl, -0.2, w.y1 - 0.02, zc);
    if (zl > 1) G.box(M.mullion, 0.06, 0.04, zl, -0.2, 2.6, zc);
  }
  boxC(-1, -8, 0.02, 0);

  // north wall: white | glass curtain wall | white
  const CW0 = 7.1, CW1 = 14.2;
  const northWin = [{ a0: 1.3, a1: 2.5, y0: 0.9, y1: 3.6 }, { a0: 4.3, a1: 5.5, y0: 0.9, y1: 3.6 }];
  wallX(G, M.white, -7.5, 1, 0, CW0, 0, GYM_H, northWin, 0.3);
  wallX(G, M.white, -7.5, 1, CW1, 17, 0, GYM_H, [], 0.3);
  for (const w of northWin) {
    const xc = (w.a0 + w.a1) / 2, xl = w.a1 - w.a0, hc = (w.y0 + w.y1) / 2, hl = w.y1 - w.y0;
    G.plane(M.glass, xl, hl, xc, hc, -7.7);
    G.box(M.mullion, 0.04, hl, 0.06, w.a0 + 0.02, hc, -7.7); G.box(M.mullion, 0.04, hl, 0.06, w.a1 - 0.02, hc, -7.7);
    G.box(M.mullion, xl, 0.04, 0.06, xc, w.y0 + 0.02, -7.7); G.box(M.mullion, xl, 0.04, 0.06, xc, w.y1 - 0.02, -7.7);
    G.box(M.mullion, xl, 0.04, 0.06, xc, 2.6, -7.7);
    radiatorCover(G, M, w.a0 - 0.1, w.a1 + 0.1, -7.5, 1);
  }
  // curtain wall
  G.plane(M.glass, CW1 - CW0, GYM_H, (CW0 + CW1) / 2, GYM_H / 2, -7.56);
  const bays = 5;
  for (let i = 0; i <= bays; i++) G.box(M.mullion, 0.07, GYM_H, 0.16, CW0 + (CW1 - CW0) * i / bays, GYM_H / 2, -7.52);
  for (const y of [0.34, 2.5, 3.4, GYM_H - 0.04]) G.box(M.mullion, CW1 - CW0, 0.07, 0.14, (CW0 + CW1) / 2, y, -7.52);
  G.box(M.ledge, CW1 - CW0, 0.32, 0.26, (CW0 + CW1) / 2, 0.16, -7.37);
  boxC(-1, -9, 18, -7.24);

  // east wall (the dark tiled elevator wall), gym part
  wallZ(G, M.darkTile, 17, -1, -7.5, 0, 0, GYM_H, [], 0.3);
  boxC(16.98, -8, 18, 8);

  // round concrete columns
  for (const [x, z] of [[7.3, -7.02], [14.05, -7.02], [3.4, -4.6]]) {
    G.cyl(M.concrete, 0.3, 0.3, GYM_H, x, GYM_H / 2, z, 0, 0, 0, 28);
    colliders.push({ type: 'circle', x, z, r: 0.3 });
  }

  // ceiling downlights and a couple of vents
  for (let x = 1.3; x < 16.6; x += 2.15) for (const z of [-6.2, -3.75, -1.3]) {
    G.put(new THREE.CircleGeometry(0.075, 16), M.downlight, x, GYM_H - 0.002, z, DOWN);
  }
  for (const x of [4.3, 10.8]) G.box(M.grille, 0.6, 0.01, 0.6, x, GYM_H - 0.004, -2.5);

  // ---- equipment along the window
  const treadX = [8.1, 9.3, 10.5, 11.7, 12.9];
  treadX.forEach((x, i) => {
    treadmill(G, M, x, -5.7, i === treadX.length - 1);
    blob(x, -5.6, 1.2, 2.5); boxC(x - 0.45, -6.8, x + 0.45, -4.6);
  });
  for (const x of [15.0, 16.15]) {
    elliptical(G, M, x, -5.4);
    blob(x, -5.3, 0.9, 2.1); boxC(x - 0.34, -6.2, x + 0.34, -4.5);
  }
  uprightBike(G, M, 6.35, -6.2); blob(6.35, -6.2, 0.8, 1.3); boxC(6.05, -6.8, 6.65, -5.7);
  recumbentBike(G, M, 5.1, -6.0); blob(5.1, -6.0, 0.8, 1.8); boxC(4.8, -6.75, 5.4, -5.25);
  wetFloorSign(G, M, 7.45, -6.0, 0.4);
  wetFloorSign(G, M, 13.55, -6.3, -0.3);

  // wall dressing
  G.plane(M.plaque, 0.42, 0.54, 6.3, 1.75, -7.497);
  G.plane(M.plaque, 0.42, 0.54, 16.4, 1.75, -7.497);
  G.cyl(M.clock, 0.2, 0.2, 0.04, 15.3, 3.05, -7.48, Math.PI / 2, 0, 0, 32);
  G.cyl(M.plasticDark, 0.205, 0.205, 0.035, 15.3, 3.05, -7.485, Math.PI / 2, 0, 0, 32);
  G.plane(M.poster, 0.62, 0.85, 0.013, 1.55, -4.1, 0, FACE_E);
  G.box(M.frame, 0.02, 0.89, 0.66, 0.0, 1.55, -4.1);

  // functional corner: med balls, plyo boxes, step platforms, mat, foam rollers
  const rack = G.sub(3.35, 0, -7.2);
  rack.box(M.plasticDark, 0.06, 1.15, 0.06, 0, 0.575, 0);
  rack.box(M.plasticDark, 0.4, 0.04, 0.3, 0, 0.02, 0.1);
  [M.ballGrey, M.ballRed, M.ballGrey, M.ballRed].forEach((m, i) => {
    const y = 0.28 + i * 0.26;
    rack.box(M.plasticDark, 0.03, 0.03, 0.2, 0, y, 0.1);
    rack.sphere(m, 0.12 - i * 0.008, 0, y + 0.1, 0.19);
  });
  boxC(3.1, -7.5, 3.6, -6.9);
  G.rbox(M.purple, 0.75, 0.5, 0.6, 0.05, 0.75, 0.25, -6.9);
  G.rbox(M.purple, 0.75, 0.6, 0.6, 0.05, 0.55, 0.3, -6.1, 0, 0.25);
  G.rbox(M.purple, 0.6, 0.3, 0.5, 0.05, 0.55, 0.75, -6.05, 0, 0.25);
  boxC(0, -7.5, 1.2, -5.7);
  for (let i = 0; i < 3; i++) {
    const y = 0.02 + i * 0.13;
    G.box(i % 2 ? M.teal : M.pink, 0.8, 0.08, 0.3, 0.45, y + 0.04, -4.95);
    G.rbox(M.black, 0.92, 0.05, 0.36, 0.015, 0.45, y + 0.105, -4.95);
  }
  boxC(0, -5.2, 0.95, -4.7);
  G.box(M.black, 1.2, 0.02, 2.0, 2.2, 0.011, -2.3);
  G.box(M.black, 0.9, 0.02, 1.8, 7.5, 0.011, -2.0, 0, 0.3);
  G.cylX(M.ballGrey, 0.075, 0.9, 1.2, 0.075, -3.4);
  G.cylX(M.teal, 0.075, 0.9, 1.25, 0.075, -3.2);

  // east wall bits in the gym: drinking fountain, thermostat, cove light
  const fz = -0.75;
  G.rbox(M.steel, 0.36, 0.14, 0.44, 0.03, 16.8, 0.86, fz);
  G.box(M.steel, 0.2, 0.3, 0.3, 16.9, 0.64, fz);
  G.box(M.plasticDark, 0.03, 0.12, 0.08, 16.98, 1.5, -1.9);
  G.box(M.cove, 0.1, 0.035, 2.0, 16.9, LOBBY_H - 0.25, -1.0);
  G.plane(M.wash, 2.0, 1.4, 16.97, LOBBY_H - 0.95, -1.0, 0, FACE_W);

  // paper towel dispenser, spray bottle and bin by the end of the mirror
  G.rbox(M.black, 0.3, 0.38, 0.13, 0.03, 10.94, 1.45, -0.07);
  G.cyl(M.white, 0.03, 0.035, 0.18, 11.07, 1.1, -0.05);
  G.cyl(M.black, 0.16, 0.14, 0.45, 10.85, 0.225, -0.24, 0, 0, 0, 20);
  colliders.push({ type: 'circle', x: 10.85, z: -0.24, r: 0.17 });

  // night city outside (a big cylinder; reflected too, so it lives in the gym group)
  G.put(new THREE.CylinderGeometry(70, 70, 120, 48, 1, true), M.skyline, 8.5, 0, -3.75);

  // ---------------------------------------------------------------- lobby & corridor (not reflected)
  // mirror wall and the bulkhead over the lobby / corridor openings
  wallX(L, M.white, 0, -1, 0, 11.0, 0, GYM_H, [], 0.25);
  L.box(M.white, 6.0, GYM_H - LOBBY_H, 0.25, 14.0, (GYM_H + LOBBY_H) / 2, 0.125);
  L.box(M.white, 1.4, LOBBY_H - CORR_H, 0.25, 11.7, (LOBBY_H + CORR_H) / 2, 0.125);
  boxC(-1, -0.02, 11.0, 0.3);
  // mirror panel seams and base trim (drawn on top of the reflection)
  for (let i = 1; i < 5; i++) L.box(M.frame, 0.004, MIRROR.y1 - MIRROR.y0, 0.004, MIRROR.x0 + i * 2.1, (MIRROR.y0 + MIRROR.y1) / 2, -0.002);
  L.box(M.frame, 11.0, 0.03, 0.02, 5.5, 0.015, -0.01);

  // floors & ceilings
  L.box(M.slate, 4.6, 0.1, 7.0, 14.7, -0.05, 3.5);
  L.box(M.slate, 1.4, 0.1, 9.0, 11.7, -0.05, 4.5);
  L.box(M.ceilingLow, 4.6, 0.1, 6.75, 14.7, LOBBY_H + 0.05, 3.625);
  L.box(M.ceilingLow, 1.4, 0.1, 8.75, 11.7, CORR_H + 0.05, 4.625);

  // east wall, lobby part: bulletin board, elevator, door with card reader
  const elev = { a0: 1.9, a1: 3.1, y0: 0, y1: 2.3 }, door = { a0: 3.9, a1: 4.85, y0: 0, y1: 2.2 };
  wallZ(L, M.darkTile, 17, -1, 0, 7, 0, LOBBY_H, [elev, door], 0.3);
  L.box(M.elevator, 0.04, 2.3, 0.6, 17.1, 1.15, 2.2); L.box(M.elevator, 0.04, 2.3, 0.6, 17.1, 1.15, 2.8);
  L.box(M.frame, 0.02, 2.3, 0.006, 17.08, 1.15, 2.5);
  L.box(M.frame, 0.08, 0.06, 1.3, 16.97, 2.33, 2.5);
  for (const z of [1.87, 3.13]) L.box(M.frame, 0.08, 2.36, 0.06, 16.97, 1.18, z);
  L.box(M.steel, 0.02, 0.18, 0.1, 16.97, 1.1, 3.35);
  L.box(M.door, 0.05, 2.2, 0.95, 17.05, 1.1, 4.375);
  L.box(M.frame, 0.07, 2.24, 0.04, 16.98, 1.12, 3.88); L.box(M.frame, 0.07, 2.24, 0.04, 16.98, 1.12, 4.87);
  L.box(M.frame, 0.07, 0.04, 1.03, 16.98, 2.22, 4.375);
  L.box(M.steel, 0.06, 0.03, 0.14, 16.99, 1.05, 4.72);
  L.box(M.steel, 0.012, 0.06, 0.2, 17.02, 1.62, 4.375);
  L.box(M.plasticDark, 0.03, 0.12, 0.08, 16.98, 1.2, 5.1);
  L.box(M.speckle, 0.03, 1.35, 1.05, 16.98, 1.35, 0.85);
  L.box(M.white, 0.035, 1.39, 0.02, 16.98, 1.35, 0.32); L.box(M.white, 0.035, 1.39, 0.02, 16.98, 1.35, 1.38);
  L.box(M.white, 0.035, 0.02, 1.08, 16.98, 2.04, 0.85); L.box(M.white, 0.035, 0.02, 1.08, 16.98, 0.66, 0.85);
  [[0.6, 1.75], [0.85, 1.72], [1.1, 1.75], [0.85, 1.45], [0.6, 1.35]].forEach(([z, y], i) =>
    L.plane(M.papers[i], 0.2, 0.26, 16.962, y, z, 0, FACE_W));
  L.plane(M.papers[2], 0.2, 0.26, 16.99, 1.45, 3.45, 0, FACE_W);
  L.box(M.cove, 0.1, 0.035, 7.0, 16.9, LOBBY_H - 0.25, 3.5);
  L.plane(M.wash, 7.0, 1.4, 16.97, LOBBY_H - 0.95, 3.5, 0, FACE_W);

  // south wall with the glass door and the wall box above a radiator
  const gdoor = { a0: 13.3, a1: 14.7, y0: 0, y1: 2.45 };
  wallX(L, M.white, 7, -1, 12.8, 17, 0, LOBBY_H, [gdoor], 0.25);
  L.plane(M.darkGlass, 1.4, 2.45, 14.0, 1.225, 7.1, 0, FACE_N);
  for (const x of [13.33, 14.0, 14.67]) L.box(M.frame, 0.06, 2.45, 0.08, x, 1.225, 7.1);
  L.box(M.frame, 1.4, 0.08, 0.08, 14.0, 2.41, 7.1);
  L.box(M.steel, 0.03, 0.4, 0.03, 13.88, 1.1, 7.05);
  radiatorCover(L, M, 15.4, 16.6, 7, -1);
  L.box(M.white, 0.8, 0.62, 0.08, 16.0, 1.3, 6.96);
  L.plane(M.papers[3], 0.66, 0.48, 16.0, 1.3, 6.919, 0, FACE_N);
  boxC(12.4, 6.98, 18, 8);

  // mural wall (lobby west side) and the dark block at its north end
  wallZ(L, M.white, 12.8, 1, 0.4, 7, 0, LOBBY_H, [], 0.2);
  L.plane(M.mural, 6.6, LOBBY_H, 12.805, LOBBY_H / 2, 3.7, 0, FACE_E);
  L.box(M.panel, 0.55, LOBBY_H, 0.4, 12.675, LOBBY_H / 2, 0.2);
  L.box(M.cove, 0.1, 0.01, 6.6, 12.9, LOBBY_H - 0.006, 3.7);
  L.box(M.exit, 0.02, 0.18, 0.4, 12.81, 2.55, 6.55);
  boxC(12.38, 0, 12.97, 0.42); boxC(12.38, 0.4, 12.82, 9.5);

  // locker-room corridor
  const cdoors = [{ a0: 2.0, a1: 2.9, y0: 0, y1: 2.2 }, { a0: 4.4, a1: 5.3, y0: 0, y1: 2.2 }, { a0: 6.8, a1: 7.7, y0: 0, y1: 2.2 }];
  wallZ(L, M.corridor, 11.0, 1, 0.25, 9, 0, CORR_H, [], 0.2);
  wallZ(L, M.corridor, 12.4, -1, 0.4, 9, 0, CORR_H, [], 0.2);
  for (const d of cdoors) {
    const zc = (d.a0 + d.a1) / 2;
    L.box(M.door, 0.03, 2.2, 0.9, 12.385, 1.1, zc);
    L.box(M.steel, 0.03, 0.9, 0.03, 12.35, 1.1, d.a0 + 0.12);
    L.box(M.steel, 0.05, 0.03, 0.03, 12.375, 0.66, d.a0 + 0.12); L.box(M.steel, 0.05, 0.03, 0.03, 12.375, 1.54, d.a0 + 0.12);
  }
  boxC(10.7, 0, 11.02, 9.5);
  const endWin = { a0: 11.3, a1: 12.1, y0: 0.7, y1: 2.5 };
  wallX(L, M.white, 9, -1, 11.0, 12.4, 0, CORR_H, [endWin], 0.25);
  L.plane(M.glass, 0.8, 1.8, 11.7, 1.6, 9.15, 0, FACE_N);
  L.box(M.mullion, 0.04, 1.8, 0.05, 11.7, 1.6, 9.15);
  radiatorCover(L, M, 11.25, 12.15, 9, -1);
  boxC(10.5, 8.95, 13, 10);
  L.box(M.frame, 0.02, 0.5, 0.36, 11.01, 1.6, 3.2);
  L.plane(M.papers[0], 0.3, 0.42, 11.022, 1.6, 3.2, 0, FACE_E);
  // open frameless glass door with long pulls
  L.box(M.glass, 0.012, 2.4, 0.9, 12.33, 1.2, 0.9);
  L.box(M.steel, 0.025, 1.2, 0.025, 12.3, 1.1, 1.25); L.box(M.steel, 0.025, 1.2, 0.025, 12.36, 1.1, 1.25);
  L.box(M.frame, 1.4, 0.06, 0.06, 11.7, CORR_H - 0.03, 0.3);
  L.box(M.exit, 0.4, 0.18, 0.02, 11.7, 2.62, 0.02);

  // lobby / corridor downlights
  for (const x of [13.7, 15.9]) for (let z = 0.8; z < 6.8; z += 1.4) L.put(new THREE.CircleGeometry(0.07, 16), M.downlight, x, LOBBY_H - 0.002, z, DOWN);
  for (let z = 1.0; z < 9; z += 1.9) L.put(new THREE.CircleGeometry(0.06, 16), M.downlight, 11.7, CORR_H - 0.002, z, DOWN);

  const gym = gb.build('gym');
  const lobby = lb.build('lobby');
  return { gym, lobby, colliders, materials: M };
}
