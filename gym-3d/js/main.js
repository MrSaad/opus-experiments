import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { buildWorld, MIRROR, SPAWN, LIGHTS } from './world.js';
import { createMirror } from './mirror.js';
import { Avatar } from './avatar.js';

// ---------------------------------------------------------------- renderer, scene
const renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.xr.enabled = true;
renderer.xr.setFoveation(0.5);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060a);

const EYE = 1.62;
const rig = new THREE.Group();
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.03, 300);
camera.position.y = EYE;
rig.add(camera);
scene.add(rig);

const { gym, lobby, colliders } = buildWorld();
scene.add(gym, lobby);

const mirror = createMirror(scene, MIRROR);
mirror.reflect(gym);
const avatar = new Avatar(mirror);

// Lights are placed symmetrically about the mirror plane, so the reflection is lit exactly like
// the room (and the room gets the extra bounce a mirror wall really gives).
scene.add(new THREE.HemisphereLight(0xfff2e2, 0x303034, 1.6));
for (const L of LIGHTS) {
  for (const z of [L.z, 2 * MIRROR.z - L.z]) {
    const p = new THREE.PointLight(0xffe2c2, 22, 16, 1.6);
    p.position.set(L.x, L.y, z);
    scene.add(p);
  }
}

// ---------------------------------------------------------------- XR controllers
const modelFactory = new XRControllerModelFactory();
const grips = [0, 1].map((i) => {
  const grip = renderer.xr.getControllerGrip(i);
  grip.add(modelFactory.createControllerModel(grip));
  grip.userData.handedness = null;
  grip.addEventListener('connected', (e) => { grip.userData.handedness = e.data.handedness; });
  grip.addEventListener('disconnected', () => { grip.userData.handedness = null; });
  rig.add(grip);
  return grip;
});

// ---------------------------------------------------------------- movement & collisions
const PLAYER_R = 0.22;
function blocked(x, z) {
  for (const c of colliders) {
    if (c.type === 'box') {
      if (x > c.x0 - PLAYER_R && x < c.x1 + PLAYER_R && z > c.z0 - PLAYER_R && z < c.z1 + PLAYER_R) return true;
    } else {
      const dx = x - c.x, dz = z - c.z, r = c.r + PLAYER_R;
      if (dx * dx + dz * dz < r * r) return true;
    }
  }
  return false;
}

const head = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();

// Current head pose in world space. In XR this reads this frame's view poses, so the
// mirror avatar has no lag.
function updateHeadPose() {
  rig.updateMatrixWorld(true);
  const xrCam = renderer.xr.isPresenting ? renderer.xr.getCamera() : null;
  if (xrCam && xrCam.cameras.length) {
    const cams = xrCam.cameras;
    _v.set(0, 0, 0);
    for (const c of cams) _v.add(c.position);
    _v.divideScalar(cams.length);
    _m.compose(_v, cams[0].quaternion, new THREE.Vector3(1, 1, 1)).premultiply(rig.matrixWorld);
    _m.decompose(head.pos, head.quat, _v);
  } else {
    camera.updateMatrixWorld(true);
    camera.matrixWorld.decompose(head.pos, head.quat, _v);
  }
}

function moveHorizontally(dx, dz) {
  const x = head.pos.x, z = head.pos.z;
  if (blocked(x, z)) { rig.position.x += dx; rig.position.z += dz; return; } // let people walk out of walls
  if (!blocked(x + dx, z)) { rig.position.x += dx; head.pos.x += dx; }
  if (!blocked(head.pos.x, z + dz)) { rig.position.z += dz; head.pos.z += dz; }
}

// rotate the rig about a vertical axis through the head
function turn(angle) {
  _v.set(head.pos.x, 0, head.pos.z);
  rig.position.sub(_v).applyAxisAngle(THREE.Object3D.DEFAULT_UP, angle).add(_v);
  rig.rotation.y += angle;
}

function headYaw() {
  _v.set(0, 0, -1).applyQuaternion(head.quat);
  return Math.atan2(-_v.x, -_v.z);
}

function respawn() {
  vy = 0; rig.position.y = 0;
  if (renderer.xr.isPresenting) {
    updateHeadPose();
    turn(SPAWN.yaw - headYaw());
    updateHeadPose();
    rig.position.x += SPAWN.x - head.pos.x;
    rig.position.z += SPAWN.z - head.pos.z;
  } else {
    rig.position.set(SPAWN.x, 0, SPAWN.z);
    rig.rotation.set(0, SPAWN.yaw, 0);
    pitch = 0; camera.rotation.set(0, 0, 0);
  }
}

let vy = 0;
function jump() { if (rig.position.y <= 0.0001) vy = 3.4; }
function applyGravity(dt) {
  if (rig.position.y > 0 || vy > 0) {
    vy -= 9.8 * dt;
    rig.position.y = Math.max(0, rig.position.y + vy * dt);
    if (rig.position.y === 0) vy = 0;
  }
}

// ---------------------------------------------------------------- desktop / touch input
let pitch = 0;
const keys = new Set();
const touchMove = { id: null, x0: 0, y0: 0, x: 0, y: 0 };
const touchLook = { id: null, x: 0, y: 0 };
const overlay = document.getElementById('overlay');

function look(dx, dy) {
  if (renderer.xr.isPresenting) return;
  rig.rotation.y -= dx;
  pitch = THREE.MathUtils.clamp(pitch - dy, -1.45, 1.45);
  camera.rotation.set(pitch, 0, 0, 'YXZ');
}

window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'Space') { jump(); e.preventDefault(); }
  if (e.code === 'KeyR') respawn();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());

document.getElementById('start').addEventListener('click', () => {
  overlay.classList.add('hidden');
  if (matchMedia('(pointer: fine)').matches) renderer.domElement.requestPointerLock?.();
});
renderer.domElement.addEventListener('click', () => {
  if (!renderer.xr.isPresenting && matchMedia('(pointer: fine)').matches) renderer.domElement.requestPointerLock?.();
});
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement) overlay.classList.add('hidden');
});
document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement === renderer.domElement) look(e.movementX * 0.0022, e.movementY * 0.0022);
});

// Touch: left half of the screen is a move stick, right half drags to look.
// Mouse without pointer lock (e.g. the Quest 2D browser): drag to look.
let dragging = null;
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch') {
    if (e.clientX < window.innerWidth / 2 && touchMove.id === null) Object.assign(touchMove, { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY });
    else if (touchLook.id === null) Object.assign(touchLook, { id: e.pointerId, x: e.clientX, y: e.clientY });
  } else if (!document.pointerLockElement) dragging = { x: e.clientX, y: e.clientY };
});
window.addEventListener('pointermove', (e) => {
  if (e.pointerId === touchMove.id) { touchMove.x = e.clientX; touchMove.y = e.clientY; }
  else if (e.pointerId === touchLook.id) {
    look((e.clientX - touchLook.x) * 0.005, (e.clientY - touchLook.y) * 0.005);
    touchLook.x = e.clientX; touchLook.y = e.clientY;
  } else if (dragging) {
    look((e.clientX - dragging.x) * 0.004, (e.clientY - dragging.y) * 0.004);
    dragging.x = e.clientX; dragging.y = e.clientY;
  }
});
const endPointer = (e) => {
  if (e.pointerId === touchMove.id) touchMove.id = null;
  if (e.pointerId === touchLook.id) touchLook.id = null;
  dragging = null;
};
window.addEventListener('pointerup', endPointer);
window.addEventListener('pointercancel', endPointer);

function desktopInput(dt) {
  let f = 0, s = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) s += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) s -= 1;
  if (touchMove.id !== null) {
    s += THREE.MathUtils.clamp((touchMove.x - touchMove.x0) / 60, -1, 1);
    f -= THREE.MathUtils.clamp((touchMove.y - touchMove.y0) / 60, -1, 1);
  }
  const len = Math.hypot(f, s);
  if (len > 1) { f /= len; s /= len; }
  const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 4.5 : 2.2;
  const yaw = rig.rotation.y;
  moveHorizontally((-Math.sin(yaw) * f + Math.cos(yaw) * s) * speed * dt, (-Math.cos(yaw) * f - Math.sin(yaw) * s) * speed * dt);
}

// ---------------------------------------------------------------- XR input (VRChat-style)
// Left stick: move relative to where you look. Left stick click: sprint.
// Right stick: snap turn 30° (click it to switch to smooth turning). A: jump. B: respawn.
const xrState = { smoothTurn: false, snapLatched: false, sprint: false, prev: {} };
const DEAD = 0.15;

function pressedEdge(hand, idx, gp) {
  const key = hand + idx;
  const now = !!gp.buttons[idx]?.pressed;
  const was = !!xrState.prev[key];
  xrState.prev[key] = now;
  return now && !was;
}

function xrInput(dt) {
  const session = renderer.xr.getSession();
  if (!session) return;
  for (const src of session.inputSources) {
    const gp = src.gamepad;
    if (!gp) continue;
    const ax = gp.axes.length >= 4 ? [gp.axes[2], gp.axes[3]] : [gp.axes[0] || 0, gp.axes[1] || 0];
    if (src.handedness === 'left') {
      if (pressedEdge('l', 3, gp)) xrState.sprint = !xrState.sprint;
      if (pressedEdge('l', 4, gp)) jump();           // X
      if (pressedEdge('l', 5, gp)) respawn();        // Y
      let [sx, sy] = ax;
      const mag = Math.hypot(sx, sy);
      if (mag > DEAD) {
        const k = (mag - DEAD) / (1 - DEAD) / mag;
        sx *= k; sy *= k;
        const yaw = headYaw();
        const speed = xrState.sprint ? 4.5 : 2.2;
        const f = -sy, s = sx;
        moveHorizontally((-Math.sin(yaw) * f + Math.cos(yaw) * s) * speed * dt, (-Math.cos(yaw) * f - Math.sin(yaw) * s) * speed * dt);
      } else if (mag < 0.05) xrState.sprint = false;
    } else if (src.handedness === 'right') {
      if (pressedEdge('r', 3, gp)) xrState.smoothTurn = !xrState.smoothTurn;
      if (pressedEdge('r', 4, gp)) jump();           // A
      if (pressedEdge('r', 5, gp)) respawn();        // B
      const tx = ax[0];
      if (xrState.smoothTurn) {
        if (Math.abs(tx) > DEAD) turn(-Math.sign(tx) * (Math.abs(tx) - DEAD) / (1 - DEAD) * 2.2 * dt);
      } else if (Math.abs(tx) > 0.7 && !xrState.snapLatched) {
        turn(-Math.sign(tx) * Math.PI / 6);
        xrState.snapLatched = true;
      } else if (Math.abs(tx) < 0.3) xrState.snapLatched = false;
    }
  }
}

let needsXRSpawn = false;
renderer.xr.addEventListener('sessionstart', () => {
  camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0);
  overlay.classList.add('hidden');
  needsXRSpawn = true;
});
renderer.xr.addEventListener('sessionend', () => {
  camera.position.set(0, EYE, 0); camera.rotation.set(0, 0, 0); pitch = 0;
  rig.position.y = 0; vy = 0;
  // keep the direction the player was facing
  rig.rotation.set(0, headYaw(), 0);
  rig.position.x = head.pos.x; rig.position.z = head.pos.z;
});

// ---------------------------------------------------------------- loop
const timer = new THREE.Timer();
const handPoses = [null, null];
const gripPoses = [0, 1].map(() => ({ position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }));

function frame(time) {
  timer.update(time);
  const dt = Math.min(timer.getDelta(), 0.05);
  const xr = renderer.xr.isPresenting;

  updateHeadPose();
  if (xr) {
    if (needsXRSpawn && renderer.xr.getCamera().cameras.length) { needsXRSpawn = false; respawn(); }
    xrInput(dt);
  } else {
    desktopInput(dt);
  }
  applyGravity(dt);
  updateHeadPose();

  // avatar hands: controllers in VR, resting by the sides on desktop
  if (xr) {
    for (let i = 0; i < 2; i++) {
      const g = grips[i];
      const idx = g.userData.handedness === 'left' ? 0 : 1;
      if (g.userData.handedness && g.visible) {
        g.matrixWorld.decompose(gripPoses[idx].position, gripPoses[idx].quaternion, _v);
        handPoses[idx] = gripPoses[idx];
      } else if (g.userData.handedness) handPoses[idx] = null;
    }
  } else {
    const yaw = rig.rotation.y;
    _q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
    for (const [i, side] of [[0, -1], [1, 1]]) {
      gripPoses[i].position.set(side * 0.24, -0.62, -0.12).applyQuaternion(_q).add(head.pos);
      gripPoses[i].quaternion.copy(_q);
      handPoses[i] = gripPoses[i];
    }
  }
  avatar.update(head.pos, head.quat, handPoses, dt);

  renderer.render(scene, camera);
}

respawn();
renderer.setAnimationLoop(frame);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.body.appendChild(VRButton.createButton(renderer));

// handy for debugging from the console
window.gym = { scene, camera, rig, renderer, respawn,
  view(x, z, yaw, p = 0, y = 0) { rig.position.set(x, y, z); rig.rotation.set(0, yaw, 0); pitch = p; camera.rotation.set(p, 0, 0, 'YXZ'); } };
