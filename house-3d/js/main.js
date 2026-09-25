/* Raised-ranch house, modelled from three street-level photos.
 * Units are metres. The house faces +z (toward the street); x runs left→right
 * as seen from the street. Grade is y = 0.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  document.getElementById('app').appendChild(renderer.domElement);
  const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 600);

  // Deterministic randomness so the model looks the same on every load.
  let seed = 20260925;
  function rand() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const rr = (a, b) => a + (b - a) * rand();

  // ---------------------------------------------------------------- textures
  function canvasTexture(size, tileMetres, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    draw(g, size);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = MAX_ANISO;
    // Geometry UVs are in metres, so one repeat == one tile.
    t.repeat.set(1 / tileMetres, 1 / tileMetres);
    return t;
  }

  function speckle(g, S, n, colours, maxR) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = colours[(rand() * colours.length) | 0];
      const r = rand() * maxR + 0.4;
      g.fillRect(rand() * S, rand() * S, r, r);
    }
  }

  function brickTexture(hue, sat, light, mortar) {
    // 1.2 m tile: 6 bricks (0.2 m) per course, 18 courses (0.0667 m).
    return canvasTexture(512, 1.2, (g, S) => {
      const cols = 6, rows = 18, bw = S / cols, bh = S / rows, m = 3.2;
      g.fillStyle = mortar; g.fillRect(0, 0, S, S);
      speckle(g, S, 3000, ['rgba(0,0,0,0.08)', 'rgba(255,255,255,0.12)'], 1.5);
      for (let r = 0; r < rows; r++) {
        const colours = [];
        for (let c = 0; c < cols; c++) {
          const dark = rand() < 0.12 ? -10 : 0;
          colours.push(`hsl(${hue + rr(-4, 4)},${sat + rr(-6, 6)}%,${light + rr(-6, 5) + dark}%)`);
        }
        const off = (r % 2) * bw / 2;
        for (let c = -1; c < cols; c++) {
          g.fillStyle = colours[(c + cols) % cols];
          g.fillRect(c * bw + off + m / 2, r * bh + m / 2, bw - m, bh - m);
        }
      }
      speckle(g, S, 14000, ['rgba(60,30,20,0.18)', 'rgba(255,240,220,0.18)', 'rgba(0,0,0,0.12)'], 1.6);
    });
  }

  const tex = {
    brick: brickTexture(22, 38, 64, '#d6cdc0'),
    redBrick: brickTexture(8, 42, 38, '#b3a89c'),
    siding: canvasTexture(256, 1.2, (g, S) => {
      const boards = 6, bh = S / boards;
      for (let i = 0; i < boards; i++) {
        const y = i * bh;
        const grad = g.createLinearGradient(0, y, 0, y + bh);
        grad.addColorStop(0, '#c4c5bf'); grad.addColorStop(1, '#a9aba4');
        g.fillStyle = grad; g.fillRect(0, y, S, bh);
        g.fillStyle = '#7f827b'; g.fillRect(0, y + bh - 3, S, 3);
      }
      speckle(g, S, 1500, ['rgba(0,0,0,0.05)', 'rgba(255,255,255,0.08)'], 1);
    }),
    shingle: canvasTexture(512, 2.0, (g, S) => {
      const rows = 14, tabs = 6, rh = S / rows, tw = S / tabs;
      g.fillStyle = '#4a3a30'; g.fillRect(0, 0, S, S);
      for (let r = 0; r < rows; r++) {
        const off = ((r * 0.37) % 1) * tw;
        const colours = [];
        for (let c = 0; c < tabs; c++) colours.push(`hsl(${rr(18, 26)},${rr(18, 26)}%,${rr(30, 38)}%)`);
        for (let c = -1; c < tabs; c++) {
          g.fillStyle = colours[(c + tabs) % tabs];
          g.fillRect(c * tw + off + 1, r * rh, tw - 2, rh - 3);
        }
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, r * rh + rh - 3, S, 3);
      }
      speckle(g, S, 26000, ['rgba(0,0,0,0.22)', 'rgba(255,230,200,0.12)', 'rgba(20,10,5,0.3)'], 1.4);
    }),
    grass: canvasTexture(512, 3.0, (g, S) => {
      g.fillStyle = '#5d8a36'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 9000; i++) {
        g.strokeStyle = `hsl(${rr(78, 100)},${rr(35, 55)}%,${rr(26, 46)}%)`;
        g.lineWidth = rr(0.6, 1.6);
        const x = rand() * S, y = rand() * S;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(-2, 2), y - rr(3, 8)); g.stroke();
      }
    }),
    concrete: canvasTexture(512, 3.0, (g, S) => {
      g.fillStyle = '#c8c5be'; g.fillRect(0, 0, S, S);
      speckle(g, S, 20000, ['rgba(0,0,0,0.07)', 'rgba(255,255,255,0.12)', 'rgba(90,80,70,0.08)'], 2);
      g.fillStyle = 'rgba(70,65,60,0.55)'; g.fillRect(0, 0, S, 2); g.fillRect(0, 0, 2, S);
    }),
    asphalt: canvasTexture(256, 4.0, (g, S) => {
      g.fillStyle = '#4b4b4d'; g.fillRect(0, 0, S, S);
      speckle(g, S, 9000, ['rgba(0,0,0,0.25)', 'rgba(255,255,255,0.12)'], 1.5);
    }),
    mulch: canvasTexture(256, 1.5, (g, S) => {
      g.fillStyle = '#5a3d2b'; g.fillRect(0, 0, S, S);
      speckle(g, S, 6000, ['#3e2a1d', '#7a5539', '#6b4a33', '#8d6a4c'], 3);
    }),
  };

  function plaqueTexture(text) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 112;
    const g = c.getContext('2d');
    g.fillStyle = '#ddd5c6'; g.fillRect(0, 0, 256, 112);
    speckle(g, 256, 2500, ['rgba(0,0,0,0.08)', 'rgba(255,255,255,0.2)'], 1.5);
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 6; g.strokeRect(8, 8, 240, 96);
    g.font = 'bold 64px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillText(text, 129, 60);
    g.fillStyle = '#8c8272'; g.fillText(text, 127, 58);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  // ---------------------------------------------------------------- materials
  // Hex colours are authored in sRGB; convert them to the linear working space.
  const std = (o) => {
    for (const k of ['color', 'emissive']) {
      if (o[k] !== undefined) o[k] = new THREE.Color(o[k]).convertSRGBToLinear();
    }
    return new THREE.MeshStandardMaterial(o);
  };
  const mat = {
    brick: std({ map: tex.brick, roughness: 0.92, shadowSide: THREE.DoubleSide }),
    redBrick: std({ map: tex.redBrick, roughness: 0.92, shadowSide: THREE.DoubleSide }),
    siding: std({ map: tex.siding, roughness: 0.7, shadowSide: THREE.DoubleSide }),
    shingle: std({ map: tex.shingle, roughness: 0.95 }),
    soffit: std({ color: 0xece9e2, roughness: 0.8 }),
    trim: std({ color: 0xf6f4ee, roughness: 0.55 }),
    stone: std({ color: 0xd8d0c0, roughness: 0.85 }),
    ridge: std({ color: 0x4a3a30, roughness: 0.95 }),
    glass: std({ color: 0xc9d2d8, roughness: 0.08, metalness: 0.45, envMapIntensity: 1.2 }),
    darkGlass: std({ color: 0x1d2328, roughness: 0.05, metalness: 0.6 }),
    concrete: std({ map: tex.concrete, roughness: 0.9 }),
    grass: std({ map: tex.grass, roughness: 1 }),
    asphalt: std({ map: tex.asphalt, roughness: 0.95 }),
    mulch: std({ map: tex.mulch, roughness: 1 }),
    black: std({ color: 0x1b1b1b, roughness: 0.5, metalness: 0.4 }),
    brass: std({ color: 0xc9a44c, roughness: 0.3, metalness: 0.9 }),
    lamp: std({ color: 0xfff1cc, emissive: 0x6b5a30, roughness: 0.3 }),
  };

  // ---------------------------------------------------------------- helpers
  const UP = new THREE.Vector3(0, 1, 0);

  function shadowed(m) { m.castShadow = true; m.receiveShadow = true; return m; }

  function box(parent, sx, sy, sz, x, y, z, material) {
    const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material));
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  // Box whose UVs are in metres on every face (for tiled textures).
  function meterBox(parent, sx, sy, sz, x, y, z, material) {
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const uv = geo.attributes.uv;
    const dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]]; // px nx py ny pz nz
    for (let f = 0; f < 6; f++) {
      for (let i = 0; i < 4; i++) {
        const k = f * 4 + i;
        uv.setXY(k, uv.getX(k) * dims[f][0], uv.getY(k) * dims[f][1]);
      }
    }
    const m = shadowed(new THREE.Mesh(geo, material));
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  // Horizontal ground patch with metre UVs.
  function flat(parent, x0, x1, z0, z1, y, material) {
    const w = x1 - x0, d = z1 - z0;
    const geo = new THREE.PlaneGeometry(w, d);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w + x0, uv.getY(i) * d - z1);
    const m = new THREE.Mesh(geo, material);
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  /* A flat wall from a 2D outline (metres, local x along the wall, y up).
   * rotY: 0 faces +z, PI/2 faces +x, PI faces -z, -PI/2 faces -x. The origin
   * is the wall's left end as seen from outside. */
  function wall(parent, outline, material, x, y, z, rotY) {
    const s = new THREE.Shape();
    s.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) s.lineTo(outline[i][0], outline[i][1]);
    s.closePath();
    const m = shadowed(new THREE.Mesh(new THREE.ShapeGeometry(s), material));
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    parent.add(m);
    return m;
  }

  // Plain side wall: brick up to `split`, vinyl siding above.
  function splitWall(parent, len, h, split, x, z, rotY) {
    wall(parent, [[0, 0], [len, 0], [len, split], [0, split]], mat.brick, x, 0, z, rotY);
    wall(parent, [[0, split], [len, split], [len, h], [0, h]], mat.siding, x, 0, z, rotY);
    // little brick ledge where the siding starts
    const g = new THREE.Group();
    box(g, len, 0.04, 0.05, len / 2, split, 0.025, mat.trim);
    g.position.set(x, 0, z); g.rotation.y = rotY;
    parent.add(g);
  }

  // Thin box stretched between two points; its local x stays horizontal.
  function beam(parent, a, b, w, h, material) {
    const len = a.distanceTo(b);
    const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, len), material));
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.lookAt(b);
    parent.add(m);
    return m;
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // One planar roof face: shingles on top, soffit underneath.
  function roofFace(parent, pts, thick) {
    thick = thick || 0.12;
    let v = pts.map((p) => V(p[0], p[1], p[2]));
    const n = V().subVectors(v[1], v[0]).cross(V().subVectors(v[2], v[0])).normalize();
    if (n.y < 0) { v.reverse(); n.negate(); }
    const e = V().crossVectors(UP, n);
    if (e.lengthSq() < 1e-8) e.set(1, 0, 0);
    e.normalize();
    const s = V().crossVectors(n, e).normalize();

    function build(verts, material, flip) {
      const pos = [], uv = [];
      for (let i = 1; i < verts.length - 1; i++) {
        const tri = flip ? [verts[0], verts[i + 1], verts[i]] : [verts[0], verts[i], verts[i + 1]];
        for (const p of tri) { pos.push(p.x, p.y, p.z); uv.push(p.dot(e), p.dot(s)); }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      geo.computeVertexNormals();
      parent.add(shadowed(new THREE.Mesh(geo, material)));
    }
    build(v, mat.shingle, false);
    build(v.map((p) => p.clone().addScaledVector(n, -thick)), mat.soffit, true);
  }

  // Hip roof over an x-long rectangle (edges already include overhang).
  function hipRoof(parent, x0, x1, z0, z1, edge, pitch) {
    const d = z1 - z0, zc = (z0 + z1) / 2, top = edge + (d / 2) * pitch;
    const xa = x0 + d / 2, xb = x1 - d / 2;
    roofFace(parent, [[x0, edge, z1], [x1, edge, z1], [xb, top, zc], [xa, top, zc]]);
    roofFace(parent, [[x1, edge, z0], [x0, edge, z0], [xa, top, zc], [xb, top, zc]]);
    roofFace(parent, [[x0, edge, z0], [x0, edge, z1], [xa, top, zc]]);
    roofFace(parent, [[x1, edge, z1], [x1, edge, z0], [xb, top, zc]]);
    beam(parent, V(xa, top + 0.02, zc), V(xb, top + 0.02, zc), 0.26, 0.06, mat.ridge);
    for (const [cx, cz, rx] of [[x0, z0, xa], [x0, z1, xa], [x1, z0, xb], [x1, z1, xb]]) {
      beam(parent, V(cx, edge + 0.02, cz), V(rx, top + 0.02, zc), 0.2, 0.05, mat.ridge);
    }
    const f = edge - 0.1;
    beam(parent, V(x0, f, z1), V(x1, f, z1), 0.06, 0.22, mat.trim);
    beam(parent, V(x0, f, z0), V(x1, f, z0), 0.06, 0.22, mat.trim);
    beam(parent, V(x0, f, z0), V(x0, f, z1), 0.06, 0.22, mat.trim);
    beam(parent, V(x1, f, z0), V(x1, f, z1), 0.06, 0.22, mat.trim);
  }

  // Front-facing gable roof (ridge runs along z, gable end at z1).
  function gableRoof(parent, x0, x1, z0, z1, edge, pitch) {
    const xc = (x0 + x1) / 2, top = edge + ((x1 - x0) / 2) * pitch;
    roofFace(parent, [[x0, edge, z1], [xc, top, z1], [xc, top, z0], [x0, edge, z0]]);
    roofFace(parent, [[x1, edge, z1], [x1, edge, z0], [xc, top, z0], [xc, top, z1]]);
    beam(parent, V(xc, top + 0.02, z1), V(xc, top + 0.02, z0), 0.26, 0.06, mat.ridge);
    // white rake boards and eave fascia
    const dz = z1 + 0.02, dy = -0.09;
    beam(parent, V(x0 - 0.02, edge + dy, dz), V(xc, top + dy, dz), 0.06, 0.24, mat.trim);
    beam(parent, V(x1 + 0.02, edge + dy, dz), V(xc, top + dy, dz), 0.06, 0.24, mat.trim);
    beam(parent, V(x0, edge - 0.1, z1), V(x0, edge - 0.1, z0), 0.06, 0.22, mat.trim);
    beam(parent, V(x1, edge - 0.1, z1), V(x1, edge - 0.1, z0), 0.06, 0.22, mat.trim);
    // gable end returns (little boxed eave ends)
    box(parent, 0.45, 0.22, 0.4, x0 + 0.2, edge - 0.1, z1 - 0.2, mat.trim);
    box(parent, 0.45, 0.22, 0.4, x1 - 0.2, edge - 0.1, z1 - 0.2, mat.trim);
  }

  // ---------------------------------------------------------------- openings
  // All opening builders return a Group whose origin is bottom-centre, facing +z.
  function rectWindow(w, h, cols, rows) {
    const g = new THREE.Group(), f = 0.08;
    box(g, w, f, 0.1, 0, f / 2, 0.05, mat.trim);
    box(g, w, f, 0.1, 0, h - f / 2, 0.05, mat.trim);
    box(g, f, h, 0.1, -w / 2 + f / 2, h / 2, 0.05, mat.trim);
    box(g, f, h, 0.1, w / 2 - f / 2, h / 2, 0.05, mat.trim);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * f, h - 2 * f), mat.glass);
    glass.position.set(0, h / 2, 0.02);
    g.add(glass);
    const iw = w - 2 * f, ih = h - 2 * f;
    for (let i = 1; i < cols; i++) box(g, 0.04, ih, 0.05, -iw / 2 + (i * iw) / cols, h / 2, 0.05, mat.trim);
    for (let i = 1; i < rows; i++) box(g, iw, 0.04, 0.05, 0, f + (i * ih) / rows, 0.05, mat.trim);
    box(g, w + 0.16, 0.07, 0.14, 0, -0.035, 0.07, mat.stone); // sill
    return g;
  }

  function archShape(r, rectH, y0) {
    const s = new THREE.Shape();
    s.moveTo(-r, y0); s.lineTo(r, y0); s.lineTo(r, rectH);
    s.absarc(0, rectH, r, 0, Math.PI, false);
    s.lineTo(-r, y0);
    return s;
  }

  function archWindow(w, rectH, cols, spokes, sill) {
    const g = new THREE.Group(), f = 0.09, r = w / 2, ri = r - f, hubR = 0.13;
    const outer = archShape(r, rectH, 0);
    outer.holes.push(archShape(ri, rectH, f));
    const frame = shadowed(new THREE.Mesh(
      new THREE.ExtrudeGeometry(outer, { depth: 0.1, bevelEnabled: false, curveSegments: 40 }), mat.trim));
    g.add(frame);
    // soldier-course brick arch around the head
    const band = archShape(r + 0.16, rectH, rectH);
    band.holes.push(archShape(r, rectH, rectH));
    const bandMesh = shadowed(new THREE.Mesh(
      new THREE.ExtrudeGeometry(band, { depth: 0.04, bevelEnabled: false, curveSegments: 40 }), mat.brick));
    g.add(bandMesh);
    box(g, 0.2, 0.26, 0.06, 0, rectH + r + 0.05, 0.03, mat.stone); // keystone

    const glass = new THREE.Mesh(new THREE.ShapeGeometry(archShape(ri, rectH, f), 40), mat.glass);
    glass.position.z = 0.02;
    g.add(glass);
    const bodyH = rectH - f;
    for (let i = 1; i < cols; i++) box(g, 0.04, bodyH, 0.05, -ri + (i * 2 * ri) / cols, f + bodyH / 2, 0.05, mat.trim);
    if (rectH > f + 0.05) box(g, 2 * ri, 0.06, 0.06, 0, rectH, 0.05, mat.trim);
    for (let k = 1; k <= spokes; k++) {
      const a = (Math.PI * k) / (spokes + 1), mid = (hubR + ri) / 2;
      const sp = box(g, 0.035, ri - hubR, 0.05, Math.cos(a) * mid, rectH + Math.sin(a) * mid, 0.05, mat.trim);
      sp.rotation.z = a - Math.PI / 2;
    }
    const hub = new THREE.Mesh(new THREE.CircleGeometry(hubR, 20, 0, Math.PI), mat.trim);
    hub.position.set(0, rectH, 0.08);
    g.add(hub);
    if (sill) box(g, w + 0.16, 0.07, 0.14, 0, -0.035, 0.07, mat.stone);
    return g;
  }

  function frontDoor() {
    const g = new THREE.Group();
    const dw = 0.92, dh = 2.05, sw = 0.36, f = 0.09;
    const total = dw + sw + 3 * f;
    const x0 = -total / 2;
    // jambs and head
    box(g, f, dh + f, 0.14, x0 + f / 2, (dh + f) / 2, 0.07, mat.trim);
    box(g, f, dh + f, 0.14, x0 + f + dw + f / 2, (dh + f) / 2, 0.07, mat.trim);
    box(g, f, dh + f, 0.14, x0 + total - f / 2, (dh + f) / 2, 0.07, mat.trim);
    box(g, total, f, 0.14, 0, dh + f / 2, 0.07, mat.trim);
    // door slab with raised panels and an oval glass insert
    const dx = x0 + f + dw / 2;
    box(g, dw, dh, 0.05, dx, dh / 2, 0.03, mat.trim);
    box(g, dw - 0.24, 0.5, 0.03, dx, 0.35, 0.065, mat.trim);
    const oval = new THREE.Shape();
    oval.absellipse(0, 0, 0.24, 0.52, 0, Math.PI * 2, false, 0);
    const ovalFrame = new THREE.Shape();
    ovalFrame.absellipse(0, 0, 0.3, 0.6, 0, Math.PI * 2, false, 0);
    const hole = new THREE.Path();
    hole.absellipse(0, 0, 0.24, 0.52, 0, Math.PI * 2, true, 0);
    ovalFrame.holes.push(hole);
    const of = shadowed(new THREE.Mesh(new THREE.ExtrudeGeometry(ovalFrame, { depth: 0.03, bevelEnabled: false, curveSegments: 32 }), mat.trim));
    of.position.set(dx, 1.35, 0.05);
    g.add(of);
    const og = new THREE.Mesh(new THREE.ShapeGeometry(oval, 32), mat.darkGlass);
    og.position.set(dx, 1.35, 0.057);
    g.add(og);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), mat.brass);
    knob.position.set(dx + dw / 2 - 0.1, 1.0, 0.09);
    g.add(knob);
    // sidelight
    const sx = x0 + 2 * f + dw + sw / 2;
    const sl = new THREE.Mesh(new THREE.PlaneGeometry(sw, dh - 0.4), mat.darkGlass);
    sl.position.set(sx, (dh - 0.4) / 2 + 0.3, 0.03);
    g.add(sl);
    box(g, sw, 0.3, 0.05, sx, 0.15, 0.03, mat.trim);
    box(g, sw, 0.1, 0.05, sx, dh - 0.05, 0.03, mat.trim);
    return g;
  }

  function garageDoor(w, h) {
    const g = new THREE.Group();
    box(g, w, h, 0.06, 0, h / 2, 0.0, mat.trim);
    const rows = 4, cols = 8, pw = w / cols, ph = h / rows;
    for (let r = 0; r < rows; r++) {
      box(g, w, 0.02, 0.07, 0, r * ph, 0.01, std({ color: 0xd8d6d0 })); // section joint
      for (let c = 0; c < cols; c++) {
        box(g, pw - 0.14, ph - 0.16, 0.03, -w / 2 + pw * (c + 0.5), ph * (r + 0.5), 0.04, mat.trim);
      }
    }
    // brick-mould trim around the opening
    box(g, w + 0.24, 0.12, 0.1, 0, h + 0.06, 0.03, mat.trim);
    box(g, 0.12, h + 0.12, 0.1, -w / 2 - 0.06, (h + 0.12) / 2, 0.03, mat.trim);
    box(g, 0.12, h + 0.12, 0.1, w / 2 + 0.06, (h + 0.12) / 2, 0.03, mat.trim);
    return g;
  }

  function coachLight() {
    const g = new THREE.Group();
    box(g, 0.14, 0.2, 0.04, 0, 0, 0.02, mat.black);
    box(g, 0.04, 0.04, 0.14, 0, 0, 0.09, mat.black);
    box(g, 0.2, 0.03, 0.2, 0, 0.19, 0.2, mat.black);
    box(g, 0.14, 0.26, 0.14, 0, 0.04, 0.2, mat.lamp);
    box(g, 0.18, 0.03, 0.18, 0, -0.1, 0.2, mat.black);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.1, 4), mat.black);
    cap.position.set(0, 0.25, 0.2); cap.rotation.y = Math.PI / 4;
    g.add(cap);
    return g;
  }

  function place(parent, obj, x, y, z, rotY) {
    obj.position.set(x, y, z);
    obj.rotation.y = rotY || 0;
    parent.add(obj);
    return obj;
  }

  // ---------------------------------------------------------------- the house
  const house = new THREE.Group();
  scene.add(house);

  const P = 0.5;          // roof pitch (6/12)
  const OH = 0.3;         // overhang
  const EAVE = 4.0;       // main wall height
  const G_EAVE = 3.6;     // garage wall height
  const SPLIT = 1.35;     // brick/siding line on side & rear walls

  // Footprint (x left→right, z back→front)
  const MX0 = -7.5, MX1 = 5.5, MZ0 = -10, MZ1 = -1;   // main body
  const BX0 = -7.5, BX1 = -3.3, BZ1 = 0.0;            // left gable bay
  const GX0 = -1.0, GX1 = 5.5, GZ1 = 3.0;             // garage bay

  // Left gable bay front (pentagon), with the arched window
  const bw = BX1 - BX0;
  wall(house, [[0, 0], [bw, 0], [bw, EAVE], [bw / 2, EAVE + (bw / 2) * P], [0, EAVE]], mat.brick, BX0, 0, BZ1, 0);
  wall(house, [[0, 0], [BZ1 - MZ1, 0], [BZ1 - MZ1, EAVE], [0, EAVE]], mat.brick, BX1, 0, BZ1, Math.PI / 2);
  place(house, archWindow(1.78, 1.85, 4, 7, true), (BX0 + BX1) / 2, 1.72, BZ1);
  place(house, rectWindow(1.7, 0.72, 3, 1), (BX0 + BX1) / 2, 0.28, BZ1);

  // Recessed entry
  const EX = (BX1 + GX0) / 2;
  wall(house, [[0, 0], [GX0 - BX1, 0], [GX0 - BX1, EAVE], [0, EAVE]], mat.brick, BX1, 0, MZ1, 0);
  place(house, frontDoor(), EX - 0.05, 0.6, MZ1);
  place(house, archWindow(1.1, 0.14, 1, 5, false), EX - 0.05, 3.0, MZ1);
  place(house, coachLight(), BX1 + 0.25, 2.05, MZ1);
  // landing + steps
  box(house, GX0 - BX1, 0.6, 1.3, EX, 0.3, MZ1 + 0.65, mat.concrete);
  box(house, 1.9, 0.4, 0.3, EX, 0.2, MZ1 + 1.45, mat.concrete);
  box(house, 1.9, 0.2, 0.3, EX, 0.1, MZ1 + 1.75, mat.concrete);

  // Garage bay
  const gw = GX1 - GX0, gPeak = G_EAVE + (gw / 2) * P, GXC = (GX0 + GX1) / 2;
  wall(house, [[0, 0], [gw, 0], [gw, G_EAVE], [gw / 2, gPeak], [0, G_EAVE]], mat.brick, GX0, 0, GZ1, 0);
  wall(house, [[0, 0], [GZ1 - MZ1, 0], [GZ1 - MZ1, G_EAVE], [0, G_EAVE]], mat.brick, GX0, 0, MZ1, -Math.PI / 2);
  place(house, garageDoor(4.9, 2.25), GXC, 0, GZ1);
  place(house, coachLight(), GX0 + 0.33, 2.05, GZ1);
  place(house, coachLight(), GX1 - 0.33, 2.05, GZ1);
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.27, 0.05), [
    mat.stone, mat.stone, mat.stone, mat.stone, std({ map: plaqueTexture('2275'), roughness: 0.8 }), mat.stone,
  ]);
  plaque.position.set(GXC, 4.05, GZ1 + 0.025);
  house.add(shadowed(plaque));
  // soldier course over the garage door
  box(house, 5.3, 0.2, 0.03, GXC, 2.47, GZ1 + 0.015, mat.brick);

  // Side and rear walls (brick below, grey vinyl siding above)
  splitWall(house, BZ1 - MZ0, EAVE, SPLIT, MX0, MZ0, -Math.PI / 2);          // left
  splitWall(house, MZ1 - MZ0, EAVE, SPLIT, MX1, MZ1, Math.PI / 2);           // right (main)
  wall(house, [[0, 0], [GZ1 - MZ1, 0], [GZ1 - MZ1, G_EAVE], [0, G_EAVE]], mat.brick, GX1, 0, GZ1, Math.PI / 2);
  splitWall(house, MX1 - MX0, EAVE, SPLIT, MX1, MZ0, Math.PI);                // rear
  place(house, rectWindow(1.3, 1.25, 2, 1), MX0, 2.1, -4.5, -Math.PI / 2);
  place(house, rectWindow(1.2, 0.6, 2, 1), MX0, 0.35, -6.5, -Math.PI / 2);
  place(house, rectWindow(1.3, 1.25, 2, 1), MX1, 2.1, -6.0, Math.PI / 2);
  for (const x of [-5.5, -1.5, 2.8]) place(house, rectWindow(1.4, 1.25, 2, 1), x, 2.1, MZ0, Math.PI);
  for (const x of [-5.5, 2.8]) place(house, rectWindow(1.2, 0.6, 2, 1), x, 0.35, MZ0, Math.PI);

  // Roofs
  hipRoof(house, MX0 - OH, MX1 + OH, MZ0 - OH, MZ1 + OH, EAVE - OH * P, P);
  gableRoof(house, BX0 - OH, BX1 + OH, -3.6, BZ1 + 0.35, EAVE - OH * P, P);
  gableRoof(house, GX0 - OH, GX1 + OH, -4.2, GZ1 + 0.35, G_EAVE - OH * P, P);

  // Downspouts
  for (const [x, z] of [[GX0 + 0.06, GZ1 + 0.05], [GX1 - 0.06, GZ1 + 0.05], [BX0 + 0.06, BZ1 + 0.05], [MX1 - 0.06, MZ0 - 0.05]]) {
    box(house, 0.07, 3.5, 0.07, x, 1.75, z, mat.trim);
  }
  // Roof vents
  for (const x of [-4.5, -1.5]) box(house, 0.4, 0.25, 0.4, x, 5.0, -8.2, mat.black);

  // ---------------------------------------------------------------- landscape
  const site = new THREE.Group();
  scene.add(site);

  flat(site, -80, 80, -60, 11.3, 0, mat.grass);                  // lawns
  flat(site, -80, 80, 11.5, 60, -0.12, mat.asphalt);              // street
  box(site, 160, 0.14, 0.25, 0, -0.05, 11.4, mat.concrete);       // curb
  flat(site, -80, 80, 8.4, 9.9, 0.02, mat.concrete);              // sidewalk
  flat(site, GX0, GX1 + 0.4, GZ1, 11.5, 0.025, mat.concrete);      // driveway
  flat(site, BX1 + 0.1, GX0, MZ1 + 1.9, 4.6, 0.022, mat.concrete); // walk to steps
  flat(site, BX0 - 0.1, BX1 + 0.1, BZ1, 1.9, 0.015, mat.mulch);    // front bed
  for (let x = BX0; x < BX1; x += 0.42) box(site, 0.4, 0.1, 0.16, x + 0.2, 0.05, 1.95, mat.stone);
  // lamp standard at the entry walk
  box(site, 0.08, 0.02, 0.08, -3.9, 0.01, 3.2, mat.black);

  // Foliage ---------------------------------------------------------------
  function lumpy(geo, amount, freq, s) {
    const p = geo.attributes.position, v = V();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = Math.sin(v.x * freq + s) * Math.sin(v.y * freq * 1.3 + s * 2) +
        Math.sin(v.z * freq * 0.9 + s * 3) * Math.cos(v.x * freq * 1.7);
      v.multiplyScalar(1 + amount * n * 0.5);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }
  const leaf = (c) => std({ color: c, roughness: 0.9, flatShading: true });
  const leafMats = [leaf(0x3f6a2a), leaf(0x4d7a30), leaf(0x365c24), leaf(0x557f34)];
  const everMat = leaf(0x2c4a22);

  function shrub(x, z, r, sy) {
    const m = shadowed(new THREE.Mesh(lumpy(new THREE.IcosahedronGeometry(r, 2), 0.22, 6 / r, rand() * 10),
      leafMats[(rand() * leafMats.length) | 0]));
    m.position.set(x, r * (sy || 0.85) * 0.85, z);
    m.scale.set(1, sy || 0.85, 1);
    site.add(m);
    return m;
  }

  function evergreen(x, z, h, r) {
    const g = new THREE.Group();
    const geo = lumpy(new THREE.ConeGeometry(r, h, 14, 8), 0.12, 7, rand() * 10);
    const cone = shadowed(new THREE.Mesh(geo, everMat));
    cone.position.y = h / 2 + 0.1;
    g.add(cone);
    const base = shadowed(new THREE.Mesh(lumpy(new THREE.IcosahedronGeometry(r * 0.95, 2), 0.15, 8, rand() * 10), everMat));
    base.position.y = r * 0.8;
    base.scale.y = 1.1;
    g.add(base);
    g.position.set(x, 0, z);
    site.add(g);
  }

  // Scatter flower heads over a bush.
  const flowerGeo = new THREE.IcosahedronGeometry(1, 0);
  function flowers(cx, cy, cz, rx, ry, rz, count, colour, size) {
    const im = new THREE.InstancedMesh(flowerGeo, std({ color: colour, roughness: 0.7, flatShading: true }), count);
    const d = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const u = rand() * Math.PI * 2, w = Math.acos(rr(-0.3, 1));
      d.position.set(cx + Math.sin(w) * Math.cos(u) * rx, cy + Math.cos(w) * ry, cz + Math.sin(w) * Math.sin(u) * rz);
      const s = size * rr(0.7, 1.3);
      d.scale.set(s, s * rr(0.6, 1), s);
      d.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
    }
    im.castShadow = true;
    site.add(im);
  }

  function roseBush(x, z, r) {
    shrub(x, z, r, 0.8);
    flowers(x, r * 0.62, z, r * 1.02, r * 0.78, r * 1.02, Math.round(80 * r), 0xc81d3a, 0.06);
  }

  function pot(x, y, z, colour) {
    const p = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.3, 16), std({ color: 0x8a4b2f, roughness: 0.8 })));
    p.position.set(x, y + 0.15, z);
    site.add(p);
    const b = shadowed(new THREE.Mesh(lumpy(new THREE.IcosahedronGeometry(0.2, 1), 0.3, 12, rand() * 5), leafMats[1]));
    b.position.set(x, y + 0.38, z);
    site.add(b);
    flowers(x, y + 0.36, z, 0.2, 0.16, 0.2, 18, colour, 0.04);
  }

  // Front bed under the arched window
  evergreen(BX0 + 0.45, 0.75, 1.9, 0.42);
  evergreen(BX1 - 0.25, 0.8, 2.1, 0.42);
  shrub(-6.4, 1.35, 0.36);
  shrub(-5.4, 1.45, 0.33);
  shrub(-4.5, 1.35, 0.36);
  roseBush(-5.95, 0.55, 0.28);
  roseBush(-4.9, 0.6, 0.3);
  // Along the walk
  shrub(BX1 - 0.05, 2.4, 0.34);
  shrub(BX1 - 0.05, 3.5, 0.3);
  shrub(GX0 - 0.35, 3.35, 0.32);
  pot(BX1 + 0.3, 0.6, MZ1 + 1.0, 0xe24a6b);
  pot(GX0 - 0.3, 0.6, MZ1 + 1.0, 0xf2d84b);
  pot(GX0 + 0.35, 0.02, GZ1 + 0.3, 0xe24a6b);
  pot(GX1 - 0.35, 0.02, GZ1 + 0.3, 0xd23b3b);
  // Roses out on the lawn
  roseBush(-8.6, 3.4, 0.55);
  roseBush(-9.6, 4.2, 0.45);

  // Japanese tree lilac in the front lawn
  (function tree(x, z) {
    const bark = std({ color: 0x5b4a3c, roughness: 1 });
    const trunk = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.6, 10), bark));
    trunk.position.set(x, 1.3, z);
    site.add(trunk);
    for (const [ax, az] of [[0.6, 0.2], [-0.5, 0.4], [0.1, -0.6]]) {
      const b = beam(site, V(x, 2.2, z), V(x + ax, 3.3, z + az), 0.07, 0.07, bark);
      b.castShadow = true;
    }
    const blobs = [[0, 3.9, 0, 1.35], [0.9, 3.6, 0.3, 1.0], [-0.9, 3.7, 0.2, 1.05], [0.2, 4.6, -0.3, 1.0],
      [-0.3, 3.5, -0.8, 0.95], [0.4, 3.4, 0.9, 0.9], [-0.5, 4.5, 0.6, 0.85]];
    for (const [bx, by, bz, r] of blobs) {
      const m = shadowed(new THREE.Mesh(lumpy(new THREE.IcosahedronGeometry(r, 2), 0.25, 5, rand() * 10), leafMats[(rand() * 4) | 0]));
      m.position.set(x + bx, by, z + bz);
      site.add(m);
      flowers(x + bx, by, z + bz, r * 1.02, r * 1.02, r * 1.02, Math.round(90 * r), 0xf4efd8, 0.085);
    }
    roseBush(x + 0.2, z + 0.5, 0.42);
  })(-4.3, 7.6);

  // ---------------------------------------------------------------- car
  (function car() {
    const g = new THREE.Group();
    const paint = std({ color: 0x5d5f63, roughness: 0.28, metalness: 0.75 });
    const W = 1.82;
    const body = new THREE.Shape();
    [[-2.45, 0.32], [2.4, 0.32], [2.47, 0.58], [2.38, 0.82], [1.55, 0.98], [-1.95, 1.02], [-2.4, 0.95], [-2.5, 0.62]]
      .forEach(([x, y], i) => (i ? body.lineTo(x, y) : body.moveTo(x, y)));
    const bodyGeo = new THREE.ExtrudeGeometry(body, { depth: W, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3 });
    bodyGeo.translate(0, 0, -W / 2);
    g.add(shadowed(new THREE.Mesh(bodyGeo, paint)));
    const cab = new THREE.Shape();
    [[1.45, 0.98], [0.55, 1.42], [-1.05, 1.43], [-1.85, 1.0]].forEach(([x, y], i) => (i ? cab.lineTo(x, y) : cab.moveTo(x, y)));
    const cabGeo = new THREE.ExtrudeGeometry(cab, { depth: W - 0.3, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
    cabGeo.translate(0, 0, -(W - 0.3) / 2);
    g.add(shadowed(new THREE.Mesh(cabGeo, mat.darkGlass)));
    box(g, 1.45, 0.05, W - 0.2, -0.25, 1.45, 0, paint);          // roof panel
    for (const z of [-1, 1]) {
      box(g, 0.08, 0.44, 0.06, 0.05, 1.22, z * (W / 2 - 0.12), paint);   // B-pillars
      box(g, 0.12, 0.2, 0.5, -2.5, 0.78, z * 0.55, std({ color: 0xa3121c, emissive: 0x300004, roughness: 0.3 })); // tail lights
      box(g, 0.06, 0.12, 0.42, 2.46, 0.72, z * 0.58, std({ color: 0xeef2f5, roughness: 0.1, metalness: 0.5 }));   // headlights
    }
    box(g, 0.05, 0.12, 0.36, -2.52, 0.62, 0, std({ color: 0xf0f0f0 })); // plate
    const tyre = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 24);
    tyre.rotateX(Math.PI / 2);
    const rim = new THREE.CylinderGeometry(0.22, 0.22, 0.25, 16);
    rim.rotateX(Math.PI / 2);
    const tMat = std({ color: 0x151515, roughness: 0.9 });
    const rMat = std({ color: 0xb8bcc0, roughness: 0.25, metalness: 0.9 });
    for (const x of [-1.55, 1.5]) for (const z of [-1, 1]) {
      const t = shadowed(new THREE.Mesh(tyre, tMat)); t.position.set(x, 0.34, z * (W / 2 - 0.08)); g.add(t);
      const r = new THREE.Mesh(rim, rMat); r.position.set(x, 0.34, z * (W / 2 - 0.07)); g.add(r);
    }
    g.position.set(GXC + 0.2, 0.03, 5.9);
    g.rotation.y = Math.PI / 2 + 0.03; // nose toward the garage
    site.add(g);
  })();

  // Wheelie bins + recycling at the curb
  (function curbside() {
    const binMat = std({ color: 0x1f1f20, roughness: 0.6 });
    for (const x of [-5.6, -4.6]) {
      const b = box(site, 0.66, 1.05, 0.7, x, 0.53, 10.6, binMat);
      b.rotation.y = rr(-0.15, 0.15);
      box(site, 0.72, 0.06, 0.78, x, 1.08, 10.6, binMat);
    }
    box(site, 0.55, 0.35, 0.4, -3.1, 0.18, 10.5, std({ color: 0x2a5fb4, roughness: 0.5 }));
    box(site, 0.5, 0.3, 0.38, -2.5, 0.15, 10.6, std({ color: 0xc92b2b, roughness: 0.5 }));
    box(site, 0.3, 0.25, 0.3, -3.1, 0.47, 10.5, std({ color: 0xb58d5e, roughness: 0.9 }));
  })();

  // Green utility pedestal (right of the drive in photo 1)
  box(site, 0.8, 1.0, 0.6, GX1 + 1.6, 0.5, 5.2, std({ color: 0x55664d, roughness: 0.7 }));

  // ---------------------------------------------------------------- neighbours
  function neighbour(x0, x1, zFront, depth, garageOnLeft) {
    const g = new THREE.Group();
    const w = x1 - x0, h = 3.3;
    meterBox(g, w, h, depth, (x0 + x1) / 2, h / 2, zFront - depth / 2, mat.redBrick);
    hipRoof(g, x0 - 0.3, x1 + 0.3, zFront - depth - 0.3, zFront + 0.3, h - 0.12, 0.42);
    const gx = garageOnLeft ? x0 + 2.2 : x1 - 2.2;
    place(g, garageDoor(3.0, 2.2), gx, 0, zFront + 0.01);
    const wx = garageOnLeft ? x1 - 2.3 : x0 + 2.3;
    place(g, rectWindow(1.1, 1.3, 2, 1), wx, 1.6, zFront + 0.01);
    place(g, rectWindow(1.1, 0.6, 2, 1), wx, 0.25, zFront + 0.01);
    place(g, frontDoor(), (gx + wx) / 2, 0.3, zFront + 0.01);
    box(g, 1.6, 0.3, 1.0, (gx + wx) / 2, 0.15, zFront + 0.5, mat.concrete);
    flat(g, gx - 1.6, gx + 1.6, zFront, 11.5, 0.024, mat.concrete);
    scene.add(g);
  }
  neighbour(-19, -10, -0.5, 10, false);
  neighbour(8.5, 17.5, 0.5, 10, true);
  neighbour(-31, -22, -0.8, 10, true);
  neighbour(20.5, 29.5, 0.2, 10, false);

  // Big background trees
  function bigTree(x, z, s) {
    const trunk = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 5 * s, 8), std({ color: 0x4b3d31 })));
    trunk.position.set(x, 2.5 * s, z);
    scene.add(trunk);
    for (let i = 0; i < 6; i++) {
      const r = rr(2.2, 3.4) * s;
      const m = shadowed(new THREE.Mesh(lumpy(new THREE.IcosahedronGeometry(r, 1), 0.3, 1.2, rand() * 10), leafMats[(rand() * 4) | 0]));
      m.position.set(x + rr(-2.5, 2.5) * s, rr(6, 9.5) * s, z + rr(-2.5, 2.5) * s);
      scene.add(m);
    }
  }
  for (const [x, z, s] of [[-10, -22, 1.0], [0, -25, 1.15], [10, -21, 0.95], [-22, -24, 1.1], [21, -23, 1.0], [-5, -33, 1.25], [13, -34, 1.2], [-30, -30, 1.1], [28, -31, 1.2]]) bigTree(x, z, s);

  // ---------------------------------------------------------------- sky + light
  (function sky() {
    const c = document.createElement('canvas');
    c.width = 2; c.height = 512;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#5f9ad8'); grad.addColorStop(0.6, '#a9cbeb'); grad.addColorStop(1, '#dde9f2');
    g.fillStyle = grad; g.fillRect(0, 0, 2, 512);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    scene.background = t;
    scene.fog = new THREE.Fog(0xd3e3ef, 70, 190);

    // Environment map from a simple gradient dome, for glass and car paint.
    const envScene = new THREE.Scene();
    const dome = new THREE.SphereGeometry(50, 32, 16);
    const cols = [], top = new THREE.Color(0x6fa6e0), hor = new THREE.Color(0xf2f6fa), gnd = new THREE.Color(0x5b6b48);
    const p = dome.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 50, col = new THREE.Color();
      if (y > 0) col.copy(hor).lerp(top, Math.pow(y, 0.6)); else col.copy(hor).lerp(gnd, Math.min(1, -y * 4));
      cols.push(col.r, col.g, col.b);
    }
    dome.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    envScene.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(envScene, 0.02).texture;
  })();

  scene.add(new THREE.HemisphereLight(0xdcecff, 0x5d6b45, 0.45));
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.7);
  sun.position.set(-22, 34, 30);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const sc = sun.shadow.camera;
  sc.left = -32; sc.right = 32; sc.top = 28; sc.bottom = -28; sc.near = 5; sc.far = 110;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  // ---------------------------------------------------------------- camera + UI
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 4;
  controls.maxDistance = 80;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.autoRotateSpeed = 0.6;

  // Roughly matching the three reference photos, plus an overview.
  const views = [
    { pos: [10.5, 2.4, 14.5], target: [-0.8, 2.6, 0.5] },
    { pos: [0.6, 2.5, 19.5], target: [-0.6, 2.7, 0] },
    { pos: [-13.5, 2.4, 14.5], target: [-1.5, 2.5, 0.5] },
    { pos: [22, 20, 26], target: [-1, 1.5, -2] },
  ];
  const buttons = document.querySelectorAll('[data-view]');
  let tween = null;
  function goTo(i, instant) {
    const v = views[i];
    buttons.forEach((b) => b.classList.toggle('on', +b.dataset.view === i));
    const to = { pos: V(...v.pos), target: V(...v.target) };
    if (instant) {
      camera.position.copy(to.pos); controls.target.copy(to.target); controls.update();
      return;
    }
    tween = { from: { pos: camera.position.clone(), target: controls.target.clone() }, to, t0: performance.now(), dur: 1400 };
  }
  buttons.forEach((b) => b.addEventListener('click', () => goTo(+b.dataset.view)));
  const spin = document.getElementById('spin');
  spin.addEventListener('click', () => {
    controls.autoRotate = !controls.autoRotate;
    spin.classList.toggle('on', controls.autoRotate);
  });
  controls.addEventListener('start', () => { tween = null; buttons.forEach((b) => b.classList.remove('on')); });
  goTo(1, true);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  renderer.setAnimationLoop((now) => {
    if (tween) {
      let k = Math.min(1, (now - tween.t0) / tween.dur);
      k = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.lerpVectors(tween.from.pos, tween.to.pos, k);
      controls.target.lerpVectors(tween.from.target, tween.to.target, k);
      if (k >= 1) tween = null;
    }
    controls.update();
    renderer.render(scene, camera);
  });
})();
