// A simple floating-torso avatar (head, body, mitts) that only exists inside the mirror world,
// so you can see yourself in the mirror without it blocking your own view.
import * as THREE from 'three';
import { RoundedBox } from './builder.js';

const _fwd = new THREE.Vector3();

export class Avatar {
  constructor(mirror) {
    const R = (m) => mirror.reflectMaterial(m);
    const shell = R(new THREE.MeshLambertMaterial({ color: 0xeeeae3 }));
    const accent = R(new THREE.MeshLambertMaterial({ color: 0x3a6fd8 }));
    const visor = R(new THREE.MeshLambertMaterial({ color: 0x15171c }));
    const eye = R(new THREE.MeshBasicMaterial({ color: 0x6ff3ff }));
    const order = -20;
    const mesh = (g, m) => { const o = new THREE.Mesh(g, m); o.renderOrder = order; return o; };

    this.head = new THREE.Group();
    this.head.add(mesh(new RoundedBox(0.22, 0.24, 0.25, 0.07, 3), shell));
    const v = mesh(new RoundedBox(0.2, 0.1, 0.05, 0.02, 2), visor); v.position.set(0, 0.01, -0.115); this.head.add(v);
    for (const s of [-1, 1]) {
      const e = mesh(new THREE.CircleGeometry(0.017, 12), eye);
      e.position.set(s * 0.045, 0.015, -0.1415); e.rotation.y = Math.PI; this.head.add(e);
      const ear = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16), accent);
      ear.rotation.z = Math.PI / 2; ear.position.set(s * 0.12, 0, 0.01); this.head.add(ear);
    }
    const ant = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 6), visor); ant.position.set(0.05, 0.16, 0.03); this.head.add(ant);
    const tip = mesh(new THREE.SphereGeometry(0.018, 10, 8), accent); tip.position.set(0.05, 0.215, 0.03); this.head.add(tip);

    this.body = new THREE.Group();
    const torso = mesh(new THREE.CapsuleGeometry(0.15, 0.28, 6, 16), accent); torso.scale.set(1.15, 1, 0.75); torso.position.y = -0.1;
    const neck = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.12, 12), shell); neck.position.y = 0.2;
    const belt = mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.1, 16), shell); belt.scale.z = 0.8; belt.position.y = -0.36;
    this.body.add(torso, neck, belt);

    this.hands = [0, 1].map(() => {
      const g = new THREE.Group();
      g.add(mesh(new RoundedBox(0.075, 0.1, 0.12, 0.03, 2), shell));
      const cuff = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12), accent);
      cuff.rotation.x = Math.PI / 2; cuff.position.z = 0.08; g.add(cuff);
      return g;
    });

    this.root = new THREE.Group();
    this.root.name = 'avatar';
    this.root.add(this.head, this.body, ...this.hands);
    mirror.world.add(this.root);
    this.bodyYaw = null;
  }

  // Poses are in world space; the mirror world's reflection is applied by its parent.
  update(headPos, headQuat, hands, dt) {
    this.head.position.copy(headPos);
    this.head.quaternion.copy(headQuat);

    _fwd.set(0, 0, -1).applyQuaternion(headQuat);
    const yaw = Math.atan2(-_fwd.x, -_fwd.z);
    if (this.bodyYaw === null) this.bodyYaw = yaw;
    let d = yaw - this.bodyYaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.bodyYaw += d * (1 - Math.exp(-dt * 5));
    this.body.rotation.set(0, this.bodyYaw, 0);
    this.body.position.set(headPos.x + Math.sin(this.bodyYaw) * 0.07, headPos.y - 0.42, headPos.z + Math.cos(this.bodyYaw) * 0.07);

    hands.forEach((h, i) => {
      const o = this.hands[i];
      o.visible = !!h;
      if (h) { o.position.copy(h.position); o.quaternion.copy(h.quaternion); }
    });
  }
}
