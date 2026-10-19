import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const UP = new THREE.Vector3(0, 1, 0);
const materials = new Map();
const keyOf = (type, color, options) => `${type}|${color}|${Object.entries(options).map(([key, value]) => `${key}:${value?.uuid ?? value}`).join(',')}`;

export const mat = (color, options = {}) => {
  const key = keyOf('std', color, options);
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.04, ...options }));
  return materials.get(key);
};
export const basic = (color, options = {}) => {
  const key = keyOf('basic', color, options);
  if (!materials.has(key)) materials.set(key, new THREE.MeshBasicMaterial({ color, ...options }));
  return materials.get(key);
};
export const glow = (color, intensity = 1.2, options = {}) => mat(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.4, ...options });
export const screen = (texture, options = {}) => mat(0xffffff, { map: texture, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: 0.62, roughness: 0.32, ...options });
export const glass = (color = 0xd6ecff, opacity = 0.16) => mat(color, { transparent: true, opacity, roughness: 0.06, metalness: 0.15, depthWrite: false });

export const C = {
  white: mat(0xf1f0e9), offWhite: mat(0xe2e1da), metal: mat(0xadb5c2, { metalness: 0.5, roughness: 0.36 }), steel: mat(0x7d8591, { metalness: 0.55, roughness: 0.4 }),
  dark: mat(0x262b36), black: mat(0x15171c, { roughness: 0.5 }), plastic: mat(0x3a3f4a, { roughness: 0.55 }), screenBack: mat(0x1d2027, { roughness: 0.45 }),
  wood: mat(0xb88a5c), woodDark: mat(0x7a5638), woodLight: mat(0xd8b88c), paper: mat(0xfbfaf5), cardboard: mat(0xb88d5d), soil: mat(0x4e3a2a, { roughness: 1 }),
  leaf: mat(0x4f9a52, { flatShading: true }), leafDark: mat(0x356f3b, { flatShading: true }), terracotta: mat(0xc0704d), red: mat(0xd2413a), rubber: mat(0x1b1d22, { roughness: 0.95 }),
};

export const node = (parent, x = 0, y = 0, z = 0, ry = 0) => {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = ry;
  parent.add(group);
  return group;
};
const place = (parent, geometry, material, x, y, z, ry = 0) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};
// Boxes and tubes are placed by their bottom face so furniture reads like "sits on y".
export const block = (parent, w, h, d, material, x = 0, y = 0, z = 0, ry = 0) => place(parent, new THREE.BoxGeometry(w, h, d), material, x, y + h / 2, z, ry);
export const tube = (parent, top, bottom, h, material, x = 0, y = 0, z = 0, segments = 14) => place(parent, new THREE.CylinderGeometry(top, bottom, h, segments), material, x, y + h / 2, z);
export const ball = (parent, r, material, x = 0, y = 0, z = 0, w = 12, h = 9) => place(parent, new THREE.SphereGeometry(r, w, h), material, x, y, z);
export const dome = (parent, r, material, x = 0, y = 0, z = 0, w = 14) => place(parent, new THREE.SphereGeometry(r, w, 7, 0, Math.PI * 2, 0, Math.PI / 2), material, x, y, z);
export const blob = (parent, r, material, x = 0, y = 0, z = 0, detail = 1) => place(parent, new THREE.IcosahedronGeometry(r, detail), material, x, y, z);
export const plane = (parent, w, h, material, x = 0, y = 0, z = 0, ry = 0) => place(parent, new THREE.PlaneGeometry(w, h), material, x, y, z, ry);
export const flat = (parent, w, d, material, x = 0, y = 0, z = 0, ry = 0) => {
  const mesh = place(parent, new THREE.PlaneGeometry(w, d), material, x, y, z);
  mesh.rotation.set(-Math.PI / 2, ry, 0, 'YXZ');
  return mesh;
};
export const disc = (parent, r, material, x = 0, y = 0, z = 0, segments = 28) => {
  const mesh = place(parent, new THREE.CircleGeometry(r, segments), material, x, y, z);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
};
export const ring = (parent, radius, thickness, material, x = 0, y = 0, z = 0, segments = 28) => {
  const mesh = place(parent, new THREE.TorusGeometry(radius, thickness, 6, segments), material, x, y, z);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
};
export const rod = (parent, from, to, radius, material, segments = 8, radiusTo = radius) => {
  const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to);
  const mesh = place(parent, new THREE.CylinderGeometry(radiusTo, radius, start.distanceTo(end), segments), material, 0, 0, 0);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UP, end.sub(start).normalize());
  return mesh;
};
export const cable = (parent, points, radius, material) => {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  return place(parent, new THREE.TubeGeometry(curve, points.length * 6, radius, 5), material, 0, 0, 0);
};

export const rng = seed => () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);
export const pick = (random, list) => list[Math.floor(random() * list.length)];
export const range = (random, min, max) => min + random() * (max - min);

// Anything flagged live (or a light, line or point cloud) survives baking so it can animate.
const keep = object => object.userData.live || object.isLight || object.isLine || object.isPoints;

// Plain opaque colours differ only by colour, so they share one vertex-coloured material per finish.
const isPlain = material => material.isMeshStandardMaterial && !material.map && !material.transparent && material.emissive.getHex() === 0;
const finishes = new Map();
const finishOf = material => {
  const key = `${material.roughness}|${material.metalness}|${material.flatShading}|${material.side}`;
  if (!finishes.has(key)) finishes.set(key, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: material.roughness, metalness: material.metalness, flatShading: material.flatShading, side: material.side }));
  return finishes.get(key);
};
const paint = (geometry, { r, g, b }) => {
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  for (let index = 0; index < colors.length; index += 3) {
    colors[index] = r;
    colors[index + 1] = g;
    colors[index + 2] = b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
};

// Collapses every static mesh under root into one mesh per material: thousands of props, a few draw calls.
export function bake(root) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const buckets = new Map(), survivors = [];
  const visit = object => {
    for (const child of [...object.children]) {
      if (keep(child)) {
        survivors.push(child);
        continue;
      }
      if (child.isMesh) {
        const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
        geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, child.matrixWorld));
        for (const name of Object.keys(geometry.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geometry.deleteAttribute(name);
        let material = child.material;
        if (isPlain(material)) {
          paint(geometry, material.color);
          material = finishOf(material);
        }
        if (!buckets.has(material)) buckets.set(material, []);
        buckets.get(material).push(geometry);
        child.geometry.dispose();
      }
      visit(child);
    }
  };
  visit(root);
  survivors.forEach(survivor => root.attach(survivor));
  [...root.children].filter(child => !keep(child)).forEach(child => root.remove(child));
  for (const [material, geometries] of buckets) {
    const mesh = new THREE.Mesh(mergeGeometries(geometries), material);
    mesh.castShadow = !material.transparent && !material.userData.noShadow;
    mesh.receiveShadow = !material.transparent;
    root.add(mesh);
    geometries.forEach(geometry => geometry.dispose());
  }
  return root;
}
