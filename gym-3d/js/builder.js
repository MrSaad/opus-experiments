// Collects many small primitives and merges them into one mesh per material,
// which keeps draw calls low enough for a standalone headset.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _n = new THREE.Vector3();
const _p = new THREE.Vector3();

// Replace UVs with a world-space box projection so tiled textures keep a real-world scale.
function worldUV(geo, scale) {
  const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    _p.fromBufferAttribute(pos, i); _n.fromBufferAttribute(nor, i);
    const ax = Math.abs(_n.x), ay = Math.abs(_n.y), az = Math.abs(_n.z);
    let u, v;
    if (ay >= ax && ay >= az) { u = _p.x; v = -_p.z; }
    else if (ax >= az) { u = _n.x > 0 ? -_p.z : _p.z; v = _p.y; }
    else { u = _n.z > 0 ? _p.x : -_p.x; v = _p.y; }
    uv.setXY(i, u * scale, v * scale);
  }
}

export class Builder {
  constructor() { this.buckets = new Map(); }

  add(geo, mat, matrix) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(matrix);
    if (mat.userData.worldUV) worldUV(g, mat.userData.worldUV);
    if (!this.buckets.has(mat)) this.buckets.set(mat, []);
    this.buckets.get(mat).push(g);
    geo.dispose();
  }

  build(name) {
    const group = new THREE.Group(); group.name = name;
    for (const [mat, geos] of this.buckets) {
      const merged = mergeGeometries(geos, false);
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, mat);
      mesh.matrixAutoUpdate = false;
      mesh.name = `${name}:${mat.name || mat.type}`;
      if (mat.userData.renderOrder) mesh.renderOrder = mat.userData.renderOrder;
      group.add(mesh);
      for (const g of geos) g.dispose();
    }
    this.buckets.clear();
    return group;
  }
}

// Transform helper: T(x, y, z, rx, ry, rz)
export function T(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) {
  const m = new THREE.Matrix4();
  m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')),
    new THREE.Vector3(s, s, s));
  return m;
}

// "Local frame": chain matrices, e.g. F(base).box(...)
export class Frame {
  constructor(builder, matrix = new THREE.Matrix4()) { this.b = builder; this.m = matrix; }
  sub(x, y, z, rx, ry, rz) { return new Frame(this.b, this.m.clone().multiply(T(x, y, z, rx, ry, rz))); }
  put(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    this.b.add(geo, mat, this.m.clone().multiply(T(x, y, z, rx, ry, rz)));
    return this;
  }
  box(mat, w, h, d, x, y, z, rx, ry, rz) { return this.put(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz); }
  rbox(mat, w, h, d, r, x, y, z, rx, ry, rz) {
    return this.put(new RoundedBox(w, h, d, r), mat, x, y, z, rx, ry, rz);
  }
  // cylinder along Y
  cyl(mat, rt, rb, h, x, y, z, rx, ry, rz, seg = 16) {
    return this.put(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, rx, ry, rz);
  }
  // cylinder along X
  cylX(mat, r, len, x, y, z, seg = 20) { return this.put(new THREE.CylinderGeometry(r, r, len, seg), mat, x, y, z, 0, 0, Math.PI / 2); }
  // bar between two points
  bar(mat, r, a, b, seg = 8) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const len = va.distanceTo(vb);
    const g = new THREE.CylinderGeometry(r, r, len, seg);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    const m = new THREE.Matrix4().compose(va.clone().add(vb).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
    this.b.add(g, mat, this.m.clone().multiply(m));
    return this;
  }
  sphere(mat, r, x, y, z, seg = 16) { return this.put(new THREE.SphereGeometry(r, seg, seg * 0.75 | 0), mat, x, y, z); }
  // plane facing +Z in local frame
  plane(mat, w, h, x, y, z, rx, ry, rz) { return this.put(new THREE.PlaneGeometry(w, h), mat, x, y, z, rx, ry, rz); }
}

// Small rounded box (cheaper than RoundedBoxGeometry, good enough for equipment shells).
export class RoundedBox extends THREE.BufferGeometry {
  constructor(w, h, d, r = 0.02, seg = 2) {
    super();
    const box = new THREE.BoxGeometry(w, h, d, seg * 2 + 1, seg * 2 + 1, seg * 2 + 1);
    const pos = box.attributes.position;
    const hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r;
    const v = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      c.set(THREE.MathUtils.clamp(v.x, -hw, hw), THREE.MathUtils.clamp(v.y, -hh, hh), THREE.MathUtils.clamp(v.z, -hd, hd));
      const dlt = v.clone().sub(c);
      if (dlt.lengthSq() > 1e-12) v.copy(c).add(dlt.normalize().multiplyScalar(r));
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    box.computeVertexNormals();
    this.copy(box);
  }
}
