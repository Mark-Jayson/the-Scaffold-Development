import * as THREE from 'three';
import { mat, node, rng } from './kit.js';
import { FLOOR_Y, platform, hexRoom, updateCutaway } from './room.js';

// Endeavors are shown as blueprint line art pinned to the screen: the same habitat, built once,
// stripped of its small pieces and traced along its creases and silhouettes from the default view.
const MIN_PIECE = 0.85;
const CREASE = Math.cos(THREE.MathUtils.degToRad(35));
const INK = new THREE.LineBasicMaterial({ color: 0xe4efff, transparent: true, opacity: 0.95 });
// Lines behind a surface stay as faint construction lines, like on a drafting sheet.
const HIDDEN = new THREE.LineBasicMaterial({ color: 0xe4efff, transparent: true, opacity: 0.1, depthWrite: false, depthFunc: THREE.GreaterDepth });
const OCCLUDER = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });

function build(habitat, doors, view) {
  const root = new THREE.Group(), trim = mat(habitat.accent);
  platform(root, trim);
  const content = node(root, 0, FLOOR_Y, 0);
  const room = hexRoom(content, { trim, doors, ...habitat.room() });
  habitat.build({ content, room, random: rng(habitat.seed), tick: () => {} });
  // Fold away the walls facing the viewer, exactly as the live rooms do.
  updateCutaway(room, view, 10);
  root.updateMatrixWorld(true);
  return root;
}

// World-space triangles of every visible mesh, skipping people and see-through panes.
function triangles(root) {
  const meshes = [];
  const visit = object => {
    if (!object.visible || object.userData.person) return;
    if (object.isMesh && !(object.material.transparent && object.material.opacity < 0.4)) meshes.push(object);
    object.children.forEach(visit);
  };
  visit(root);
  return meshes.map(mesh => {
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
    const points = geometry.attributes.position.clone().applyMatrix4(mesh.matrixWorld).array;
    if (geometry !== mesh.geometry) geometry.dispose();
    return points;
  });
}

// Splits one mesh into touching pieces (merged meshes hold many) and drops those smaller than `minPiece`.
function largePieces(points, minPiece) {
  const ids = new Map(), parent = [], vertex = new Int32Array(points.length / 3);
  const find = id => {
    while (parent[id] !== id) id = parent[id] = parent[parent[id]];
    return id;
  };
  for (let index = 0; index < vertex.length; index += 1) {
    const key = `${Math.round(points[index * 3] * 500)},${Math.round(points[index * 3 + 1] * 500)},${Math.round(points[index * 3 + 2] * 500)}`;
    if (!ids.has(key)) {
      ids.set(key, parent.length);
      parent.push(parent.length);
    }
    vertex[index] = ids.get(key);
  }
  for (let index = 0; index < vertex.length; index += 3) {
    const a = find(vertex[index]);
    parent[find(vertex[index + 1])] = a;
    parent[find(vertex[index + 2])] = a;
  }
  const boxes = new Map();
  for (let index = 0; index < vertex.length; index += 1) {
    const root = find(vertex[index]);
    if (!boxes.has(root)) boxes.set(root, new THREE.Box3());
    boxes.get(root).expandByPoint(new THREE.Vector3().fromArray(points, index * 3));
  }
  const size = new THREE.Vector3();
  const big = new Set([...boxes].filter(([, box]) => Math.max(...box.getSize(size).toArray()) >= minPiece).map(([root]) => root));
  const kept = [];
  for (let index = 0; index < vertex.length; index += 3) if (big.has(find(vertex[index]))) kept.push(index);
  return { vertex, kept };
}

// Creases, outer borders and the silhouette as seen along `toCamera`.
function edges(points, { vertex, kept }, toCamera, out) {
  const open = new Map(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const corner = new Map();
  for (const index of kept) {
    a.fromArray(points, index * 3);
    b.fromArray(points, index * 3 + 3);
    c.fromArray(points, index * 3 + 6);
    const normal = new THREE.Vector3().subVectors(c, b).cross(a.clone().sub(b));
    if (normal.lengthSq() < 1e-12) continue;
    normal.normalize();
    for (let side = 0; side < 3; side += 1) {
      const from = index + side, to = index + ((side + 1) % 3), one = vertex[from], two = vertex[to];
      if (one === two) continue;
      corner.set(one, from);
      corner.set(two, to);
      const key = one < two ? `${one}|${two}` : `${two}|${one}`, seen = open.get(key);
      if (!seen) open.set(key, { normal, keep: false, ends: [one, two] });
      else if (normal.dot(seen.normal) <= CREASE || normal.dot(toCamera) * seen.normal.dot(toCamera) < 0) seen.keep = true;
      else if (seen.keep === false) seen.keep = null;
    }
  }
  // `false` means only one face ever touched the edge: an outer border, so it is drawn too.
  for (const { keep, ends } of open.values()) {
    if (keep === null) continue;
    for (const end of ends) out.push(points[corner.get(end) * 3], points[corner.get(end) * 3 + 1], points[corner.get(end) * 3 + 2]);
  }
}

const geometryOf = values => new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(values, 3));
let renderer;

/** Builds the blueprint figure for an Endeavor; `corner` pins it to the screen, `onOpen` makes it clickable.
    `model(toCamera)` draws a stand-in object instead of the habitat itself, with every piece kept. */
export function blueprint(habitat, { doors, cameraOffset, corner, onOpen, model }) {
  const toCamera = cameraOffset.clone().normalize();
  const root = model ? model(toCamera) : build(habitat, doors, cameraOffset.clone().setY(0).normalize());
  root.updateMatrixWorld(true);
  const lines = [], solid = [];
  for (const points of triangles(root)) {
    const pieces = largePieces(points, model ? 0 : MIN_PIECE);
    edges(points, pieces, toCamera, lines);
    for (const index of pieces.kept) for (let offset = 0; offset < 9; offset += 1) solid.push(points[index * 3 + offset]);
  }
  root.traverse(object => object.geometry?.dispose());

  const scene = new THREE.Scene(), linework = geometryOf(lines);
  scene.add(new THREE.Mesh(geometryOf(solid), OCCLUDER), new THREE.LineSegments(linework, INK), new THREE.LineSegments(linework, HIDDEN));
  // Fit an orthographic camera snugly around the drawing as seen from the main view direction.
  linework.computeBoundingSphere();
  const { center, radius } = linework.boundingSphere;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, radius * 4);
  camera.position.copy(center).addScaledVector(toCamera, radius * 2);
  camera.lookAt(center);
  camera.updateMatrixWorld();
  const bounds = new THREE.Box3().setFromPoints(Array.from({ length: lines.length / 3 }, (_, index) => new THREE.Vector3().fromArray(lines, index * 3).applyMatrix4(camera.matrixWorldInverse)));
  const pad = radius * (model ? 0.08 : 0.03);
  Object.assign(camera, { left: bounds.min.x - pad, right: bounds.max.x + pad, top: bounds.max.y + pad, bottom: bounds.min.y - pad });
  // Objects sit in a frame as wide as the old hexagon drawings (about 5:4), centred, so tall ones do not grow taller.
  if (model) {
    const extra = (1.25 * (camera.top - camera.bottom) - (camera.right - camera.left)) / 2;
    if (extra > 0) Object.assign(camera, { left: camera.left - extra, right: camera.right + extra });
  }
  camera.updateProjectionMatrix();

  const figure = document.createElement(onOpen ? 'button' : 'div');
  figure.className = 'blueprint';
  figure.dataset.corner = corner;
  if (onOpen) {
    figure.type = 'button';
    figure.addEventListener('click', onOpen);
  }
  const name = document.createElement('strong');
  name.textContent = habitat.name;
  const canvas = document.createElement('canvas');
  canvas.style.aspectRatio = `${camera.right - camera.left} / ${camera.top - camera.bottom}`;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `Blueprint of ${habitat.name}`);
  figure.append(name, canvas);

  // Drawn once per size change through a shared off-screen renderer; nothing here animates.
  new ResizeObserver(() => {
    const ratio = Math.min(devicePixelRatio, 2), width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    renderer ??= new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.getContext('2d').drawImage(renderer.domElement, 0, 0, canvas.width, canvas.height);
  }).observe(canvas);
  return figure;
}
