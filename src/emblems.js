// Stand-in objects for the Endeavors, drawn as blueprint line art in the screen corners:
// a tree for Tree, a light bulb for Idea Space and a ring-bound desk calendar for Life Planner.
// Each builder gets the direction toward the camera so flat faces can turn to the viewer.
import * as THREE from 'three';
import { mat } from './kit.js';

const solid = mat(0xffffff);
const add = (parent, geometry, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(geometry, solid);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
};
// A stick from `from` to `to`, for branches and rays.
const stick = (parent, from, to, radius, radiusTo = radius, sides = 6) => {
  const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to);
  const mesh = add(parent, new THREE.CylinderGeometry(radiusTo, radius, start.distanceTo(end), sides));
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
  return mesh;
};
// Turns a group so its +z side faces the camera across the ground.
const faceViewer = (group, toCamera) => {
  group.rotation.y = Math.atan2(toCamera.x, toCamera.z);
  return group;
};

function tree() {
  const root = new THREE.Group();
  add(root, new THREE.CylinderGeometry(3.6, 4, 0.5, 18), 0, 0.25, 0);
  add(root, new THREE.CylinderGeometry(0.62, 1, 4.6, 7), 0, 2.8, 0);
  // Roots spread over the mound, branches fork into the canopy.
  for (const angle of [0.4, 2.2, 4.1]) stick(root, [0, 0.9, 0], [Math.sin(angle) * 1.6, 0.5, Math.cos(angle) * 1.6], 0.28, 0.12);
  stick(root, [0, 4.3, 0], [-1.9, 6.1, 0.4], 0.32, 0.16);
  stick(root, [0, 4.6, 0], [1.8, 6.4, -0.3], 0.3, 0.15);
  stick(root, [0, 5, 0], [0.2, 7.4, 0.2], 0.3, 0.16);
  for (const [x, y, z, r] of [[0, 7.2, 0, 2.8], [-2.4, 6.3, 0.6, 2.1], [2.3, 6.6, -0.4, 2.2], [0.4, 9.1, 0.1, 2], [-1.1, 8.4, -1.4, 1.7], [1.6, 8.3, 1.3, 1.6]]) {
    // Faceted, low-poly crowns give the canopy enough edges to read as foliage in line art.
    add(root, new THREE.IcosahedronGeometry(r, 0), x, y, z).rotation.set(x, y, z);
  }
  return root;
}

function bulb(toCamera) {
  const root = new THREE.Group();
  // Glass: a lathe from the neck out to the round crown.
  const profile = [[1.25, 0], [1.3, 0.6], [1.75, 1.6], [2.55, 2.8], [2.95, 4], [2.9, 5.1], [2.45, 6.1], [1.7, 6.8], [0.8, 7.15], [0, 7.25]].map(([r, y]) => new THREE.Vector2(r, y));
  add(root, new THREE.LatheGeometry(profile, 28), 0, 2.4, 0);
  // Screw base with threads and a contact tip.
  add(root, new THREE.CylinderGeometry(1.3, 1.3, 2.2, 20), 0, 1.3, 0);
  for (const y of [0.55, 1.05, 1.55, 2.05]) add(root, new THREE.TorusGeometry(1.33, 0.12, 6, 24), 0, y, 0).rotation.x = Math.PI / 2;
  add(root, new THREE.CylinderGeometry(1.1, 0.5, 0.55, 16), 0, -0.07, 0);
  // Rays fan out in the plane facing the viewer, so they read as a burst rather than spikes into the page.
  const up = new THREE.Vector3(0, 1, 0), across = new THREE.Vector3().crossVectors(up, toCamera).normalize();
  const centre = new THREE.Vector3(0, 6.6, 0);
  for (let index = 0; index < 7; index += 1) {
    const angle = (-90 + index * 30) * (Math.PI / 180), direction = across.clone().multiplyScalar(Math.sin(angle)).addScaledVector(up, Math.cos(angle));
    stick(root, centre.clone().addScaledVector(direction, 4.1).toArray(), centre.clone().addScaledVector(direction, 5.6).toArray(), 0.16, 0.16, 6);
  }
  return root;
}

function calendar(toCamera) {
  const root = faceViewer(new THREE.Group(), toCamera), page = new THREE.Group();
  // A tent calendar: a stand behind, the page leaning back slightly.
  add(root, new THREE.BoxGeometry(9.4, 0.4, 3.6), 0, 0.2, -0.6);
  const back = add(root, new THREE.BoxGeometry(8.6, 9.6, 0.25), 0, 5, -1.9);
  back.rotation.x = 0.3;
  page.position.set(0, 0.4, 0.4);
  page.rotation.x = -0.16;
  root.add(page);
  add(page, new THREE.BoxGeometry(9, 10, 0.35), 0, 5, 0);
  add(page, new THREE.BoxGeometry(9, 1.9, 0.2), 0, 9.05, 0.27);
  // Day grid: 7 × 5 raised cells, one of them circled.
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 7; column += 1) add(page, new THREE.BoxGeometry(1.02, 1.12, 0.14), -3.72 + column * 1.24, 6.95 - row * 1.36, 0.24);
  }
  add(page, new THREE.TorusGeometry(0.72, 0.09, 6, 24), -3.72 + 4 * 1.24, 6.95 - 2 * 1.36, 0.34);
  // Binder rings over the top edge.
  for (const x of [-3, -1, 1, 3]) add(page, new THREE.TorusGeometry(0.42, 0.11, 8, 18), x, 10.05, 0).rotation.y = Math.PI / 2;
  return root;
}

export const EMBLEMS = { tree, maker: bulb, planning: calendar };
