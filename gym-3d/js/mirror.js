// Planar mirror done as a "mirror world": a reflected copy of the room drawn only where the
// mirror is visible (stencil mask). Unlike a render-to-texture reflector it is correct for each
// eye in VR and costs no extra render passes.
//
// Draw order inside the opaque pass (lower renderOrder first):
//   -30  mirror quad writes stencil = 1 (no colour, no depth)
//   -20  reflected opaque objects, stencil test == 1
//   -15  reflected see-through objects (glass, glows), blended but still in the opaque pass
//   -10  mirror quad writes its own depth, so real things behind the mirror plane stay hidden
//     0  the real world
import * as THREE from 'three';

export function createMirror(scene, rect) {
  const world = new THREE.Group();
  world.name = 'mirrorWorld';
  world.scale.z = -1;
  world.position.z = 2 * rect.z;
  scene.add(world);

  const cache = new Map();
  function reflectMaterial(mat) {
    if (cache.has(mat)) return cache.get(mat);
    const m = mat.clone();
    m.stencilWrite = true;
    m.stencilRef = 1;
    m.stencilFunc = THREE.EqualStencilFunc;
    m.stencilFail = m.stencilZFail = m.stencilZPass = THREE.KeepStencilOp;
    m.userData = { ...mat.userData, mirrorOrder: -20 };
    if (mat.transparent) {
      m.transparent = false; // keep it in the opaque pass so it lands before the depth quad
      if (m.blending === THREE.NormalBlending) {
        m.blending = THREE.CustomBlending;
        m.blendEquation = THREE.AddEquation;
        m.blendSrc = THREE.SrcAlphaFactor;
        m.blendDst = THREE.OneMinusSrcAlphaFactor;
      }
      m.depthWrite = false;
      m.userData.mirrorOrder = -15;
    }
    cache.set(mat, m);
    return m;
  }

  function reflect(object) {
    const copy = object.clone();
    copy.traverse((o) => {
      if (o.isMesh) {
        o.material = reflectMaterial(o.material);
        o.renderOrder = o.material.userData.mirrorOrder;
      }
    });
    world.add(copy);
    return copy;
  }

  const w = rect.x1 - rect.x0, h = rect.y1 - rect.y0;
  const geo = new THREE.PlaneGeometry(w, h);
  const place = (mesh, dz = 0) => {
    mesh.position.set((rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2, rect.z + dz);
    mesh.rotation.y = Math.PI; // faces -z, into the gym
    scene.add(mesh);
    return mesh;
  };

  const stencilMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  stencilMat.stencilWrite = true;
  stencilMat.stencilRef = 1;
  stencilMat.stencilFunc = THREE.AlwaysStencilFunc;
  stencilMat.stencilZPass = THREE.ReplaceStencilOp;
  place(new THREE.Mesh(geo, stencilMat)).renderOrder = -30;

  const depthMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthFunc: THREE.AlwaysDepth });
  place(new THREE.Mesh(geo, depthMat)).renderOrder = -10;

  // a faint green-grey tint like real mirror glass
  const tint = new THREE.MeshBasicMaterial({ color: 0x0c1a14, transparent: true, opacity: 0.07, depthWrite: false });
  place(new THREE.Mesh(geo, tint), -0.001);

  return { world, reflect, reflectMaterial };
}
