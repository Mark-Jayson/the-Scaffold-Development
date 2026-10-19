import * as THREE from 'three';
import { C, mat, glass, glow, node, block, tube, flat, bake } from './kit.js';

export const HEX_RADIUS = 15.2;
export const FLOOR_Y = 1.75;
export const APOTHEM = 11.6;
export const THICK = 0.4;
export const INNER = APOTHEM - THICK / 2;
export const WALL_HEIGHT = 3.4;
export const DOOR_WIDTH = 3.2;
export const DOOR_HEIGHT = 2.75;
const LIP = 0.55;
const WALL_LENGTH = 2 * APOTHEM * Math.tan(Math.PI / 6);
const CORNER_RADIUS = APOTHEM / Math.cos(Math.PI / 6);

// Side k of a hexagon faces outward along angle k·60° (measured from +z toward +x).
export const sideAngle = side => side * Math.PI / 3;
export const sideNormal = side => [Math.sin(sideAngle(side)), Math.cos(sideAngle(side))];

function hexShape(apothem) {
  const radius = apothem / Math.cos(Math.PI / 6), shape = new THREE.Shape();
  for (let corner = 0; corner < 6; corner += 1) {
    const angle = (corner + 0.5) * Math.PI / 3, x = Math.sin(angle) * radius, y = -Math.cos(angle) * radius;
    if (corner) shape.lineTo(x, y);
    else shape.moveTo(x, y);
  }
  return shape;
}

// Floor texture repeats once per `tile` world units because ShapeGeometry UVs are plain coordinates.
export function floorPatch(parent, apothem, material, y = 0.004) {
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(hexShape(apothem)), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
// Any floor polygon given as [x, z] points (in the parent's frame), e.g. a zone hugging one wall.
export function floorShape(parent, points, material, y = 0.008) {
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)))), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
// Trapezoid covering the strip of floor `depth` deep along a wall frame.
export const wallStrip = depth => {
  const half = INNER * Math.tan(Math.PI / 6), inset = half - depth * Math.tan(Math.PI / 6);
  return [[-half, 0], [half, 0], [inset, depth], [-inset, depth]];
};
export const tiled = (texture, tile, options = {}) => {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1 / tile, 1 / tile);
  return mat(0xffffff, { map: texture, roughness: 0.85, ...options });
};

const shade = (color, factor) => new THREE.Color(color).multiplyScalar(factor).getHex();
// Thin outer skin on the walls, so the shell takes the habitat's colour while the inside keeps its own.
const CLAD = 0.04;

// With a `color` the base takes that tint; without one it keeps the original white body.
export function platform(sector, trimMaterial, color) {
  const slab = new THREE.Mesh(new THREE.CylinderGeometry(HEX_RADIUS, HEX_RADIUS * 0.965, 3.1, 6), mat(color ?? 0xe5e5e0));
  slab.rotation.y = Math.PI / 6;
  slab.castShadow = slab.receiveShadow = true;
  sector.add(slab);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(HEX_RADIUS + 0.32, HEX_RADIUS + 0.32, 0.45, 6, 1, true), mat(color ? shade(color, 0.68) : 0x8c919b));
  rim.rotation.y = Math.PI / 6;
  rim.position.y = -0.88;
  sector.add(rim);
  const underside = new THREE.Mesh(new THREE.CylinderGeometry(HEX_RADIUS * 0.84, HEX_RADIUS * 0.78, 0.7, 6), C.dark);
  underside.rotation.y = Math.PI / 6;
  underside.position.y = -1.9;
  sector.add(underside);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry((APOTHEM + 0.5) / Math.cos(Math.PI / 6), (APOTHEM + 0.5) / Math.cos(Math.PI / 6), FLOOR_Y - 1.55, 6), mat(color ? shade(color, 0.84) : 0xcfd0cb));
  plate.rotation.y = Math.PI / 6;
  plate.position.y = (FLOOR_Y + 1.55) / 2;
  plate.castShadow = plate.receiveShadow = true;
  sector.add(plate);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(HEX_RADIUS - 0.55, 0.075, 4, 6), trimMaterial);
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 1.57;
  sector.add(trim);
}

/**
 * Builds an open-top hexagonal room on `content` (whose origin sits on the finished floor).
 * Each wall has a static lip plus an `upper` part that folds away whenever it stands between
 * the camera and the room, so the interior is always visible while orbiting.
 * `frame(side)` / `decor(side)` give interior wall frames: origin on the inner face at floor level,
 * +x along the wall, +z pointing into the room. Decor is hidden along with its wall.
 */
export function hexRoom(content, { floor, wall, trim, shell, doors = [], glassSides = [], glassFrom = 1.0, mullion = C.white, height = WALL_HEIGHT, signMaterial }) {
  floorPatch(content, APOTHEM + THICK / 2, floor);
  // `shell` colours the outside of the walls and posts; without it they stay white.
  const walls = [], posts = [], pane = glass(0xd9f1ff, 0.14), skin = mat(shell ?? 0xd9dadf), outside = THICK / 2 + CLAD / 2;
  for (let side = 0; side < 6; side += 1) {
    const [nx, nz] = sideNormal(side), hasDoor = doors.includes(side), isGlass = glassSides.includes(side);
    const holder = node(content, nx * APOTHEM, 0, nz * APOTHEM, sideAngle(side));
    const upper = node(holder, 0, LIP, 0);
    upper.userData.live = true;
    const frame = node(holder, 0, 0, -THICK / 2, Math.PI);
    const decor = node(upper, 0, -LIP, -THICK / 2, Math.PI);
    const spans = hasDoor ? [[-WALL_LENGTH / 2, -DOOR_WIDTH / 2], [DOOR_WIDTH / 2, WALL_LENGTH / 2]] : [[-WALL_LENGTH / 2, WALL_LENGTH / 2]];
    for (const [from, to] of spans) {
      const width = to - from, center = (from + to) / 2;
      block(holder, width, LIP, THICK, wall, center, 0, 0);
      if (shell) {
        block(holder, width, LIP, CLAD, skin, center, 0, outside);
        block(upper, width, (isGlass ? glassFrom : height) - LIP, CLAD, skin, center, 0, outside);
      }
      if (isGlass) {
        block(upper, width, glassFrom - LIP, THICK, wall, center, 0, 0);
        block(upper, width, height - glassFrom, 0.05, pane, center, glassFrom - LIP, 0);
        block(upper, width, 0.1, 0.16, mullion, center, glassFrom - LIP, 0);
        const count = Math.max(1, Math.round(width / 2.2));
        for (let index = 0; index <= count; index += 1) block(upper, 0.09, height - glassFrom, 0.14, mullion, from + 0.05 + index * (width - 0.1) / count, glassFrom - LIP, 0);
      } else block(upper, width, height - LIP, THICK, wall, center, 0, 0);
      block(upper, width, 0.08, THICK + 0.06, trim, center, height - LIP, 0);
    }
    if (hasDoor) {
      block(upper, DOOR_WIDTH, height - DOOR_HEIGHT, THICK, wall, 0, DOOR_HEIGHT - LIP, 0);
      if (shell) block(upper, DOOR_WIDTH, height - DOOR_HEIGHT, CLAD, skin, 0, DOOR_HEIGHT - LIP, outside);
      for (const edge of [-1, 1]) {
        block(holder, 0.14, LIP, THICK + 0.1, trim, edge * DOOR_WIDTH / 2, 0, 0);
        block(upper, 0.14, DOOR_HEIGHT - LIP, THICK + 0.1, trim, edge * DOOR_WIDTH / 2, 0, 0);
      }
      block(upper, DOOR_WIDTH + 0.14, 0.14, THICK + 0.1, trim, 0, DOOR_HEIGHT - LIP, 0);
      flat(frame, DOOR_WIDTH, 0.5, mat(0x4b5563, { roughness: 0.6 }), 0, 0.008, 0.3);
      if (signMaterial) {
        block(decor, 0.62, 0.22, 0.05, C.white, 0, DOOR_HEIGHT + 0.16, 0);
        const face = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.17), signMaterial);
        face.position.set(0, DOOR_HEIGHT + 0.27, 0.027);
        decor.add(face);
      }
    }
    walls.push({ side, normal: new THREE.Vector3(nx, 0, nz), upper, frame, decor, hasDoor, amount: 1 });
  }
  for (let corner = 0; corner < 6; corner += 1) {
    const angle = (corner + 0.5) * Math.PI / 3, x = Math.sin(angle) * CORNER_RADIUS, z = Math.cos(angle) * CORNER_RADIUS;
    tube(content, 0.38, 0.4, LIP + 0.02, C.steel, x, 0, z, 12);
    const post = node(content, x, LIP + 0.02, z);
    post.userData.live = true;
    tube(post, 0.33, 0.35, height - LIP + 0.06, skin, 0, 0, 0, 12);
    tube(post, 0.36, 0.36, 0.08, trim, 0, height - LIP + 0.06, 0, 12);
    tube(post, 0.12, 0.16, 0.12, glow(0xfff1d0, 1.6), 0, height - LIP + 0.14, 0, 10);
    posts.push({ object: post, sides: [corner, (corner + 1) % 6] });
  }
  return {
    walls, posts,
    frame: side => walls[side].frame,
    decor: side => walls[side].decor,
    // Wall parts are baked on their own so they can still fold away independently.
    bake() {
      walls.forEach(entry => bake(entry.upper));
      posts.forEach(entry => bake(entry.object));
    },
  };
}

const damp = THREE.MathUtils.damp;
export function updateCutaway(room, view, delta) {
  for (const wall of room.walls) {
    wall.amount = damp(wall.amount, wall.normal.dot(view) > 0.16 ? 0 : 1, 9, delta);
    wall.upper.scale.y = Math.max(wall.amount, 0.001);
    wall.upper.visible = wall.amount > 0.01;
  }
  for (const post of room.posts) {
    const amount = Math.max(...post.sides.map(side => room.walls[side].amount));
    post.object.scale.y = Math.max(amount, 0.001);
    post.object.visible = amount > 0.01;
  }
}

/* Abstract outline marking an empty slot in the honeycomb */
const ghostLine = opacity => new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity, depthWrite: false });
const GHOST = {
  faint: ghostLine(0.16), soft: ghostLine(0.4), accent: ghostLine(0.85),
  dashed: new THREE.LineDashedMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, dashSize: 0.7, gapSize: 0.55, depthWrite: false }),
};
const corners = radius => Array.from({ length: 7 }, (_, index) => new THREE.Vector3(Math.sin((index + 0.5) * Math.PI / 3) * radius, 0, Math.cos((index + 0.5) * Math.PI / 3) * radius));
export function ghostHex(parent, position) {
  const group = node(parent, position.x, 1.6, position.z);
  const trace = (points, material, Kind = THREE.Line) => {
    const line = new Kind(new THREE.BufferGeometry().setFromPoints(points), material);
    if (material.isLineDashedMaterial) line.computeLineDistances();
    group.add(line);
  };
  const outer = corners(HEX_RADIUS + 0.3), wall = corners(CORNER_RADIUS), core = corners(4.2);
  trace(outer, GHOST.soft);
  trace(corners(HEX_RADIUS - 0.9), GHOST.faint);
  trace(wall, GHOST.dashed);
  trace(core, GHOST.faint);
  const brackets = [], spokes = [];
  for (let corner = 0; corner < 6; corner += 1) {
    for (const neighbour of [outer[(corner + 5) % 6], outer[corner + 1]]) brackets.push(outer[corner], outer[corner].clone().lerp(neighbour, 0.14));
    spokes.push(core[corner], wall[corner]);
  }
  trace(brackets, GHOST.accent, THREE.LineSegments);
  trace(spokes, GHOST.faint, THREE.LineSegments);
  trace([new THREE.Vector3(-0.8, 0, 0), new THREE.Vector3(0.8, 0, 0), new THREE.Vector3(0, 0, -0.8), new THREE.Vector3(0, 0, 0.8)], GHOST.soft, THREE.LineSegments);
  return group;
}
export const pulseGhosts = time => {
  GHOST.accent.opacity = 0.62 + Math.sin(time * 1.4) * 0.22;
};

export function bridge(parent, from, to, accent) {
  const dx = to.x - from.x, dz = to.z - from.z, distance = Math.hypot(dx, dz);
  const group = node(parent, (from.x + to.x) / 2, FLOOR_Y, (from.z + to.z) / 2, Math.atan2(dx, dz));
  const length = distance - 2 * INNER, gap = distance - 2 * (APOTHEM + THICK / 2);
  block(group, DOOR_WIDTH - 0.12, 0.24, length, mat(0xd1d0c8), 0, -0.24, 0);
  flat(group, 0.22, gap, mat(accent, { emissive: accent, emissiveIntensity: 0.45 }), 0, 0.006, 0);
  for (const side of [-1, 1]) {
    block(group, 0.05, 1.05, gap, glass(0xd9f1ff, 0.22), side * (DOOR_WIDTH / 2 - 0.08), 0, 0);
    block(group, 0.08, 0.06, gap, C.metal, side * (DOOR_WIDTH / 2 - 0.08), 1.05, 0);
    for (const end of [-1, 1]) block(group, 0.1, 1.1, 0.1, C.metal, side * (DOOR_WIDTH / 2 - 0.08), 0, end * (gap / 2 - 0.05));
  }
  block(group, 1.2, 0.5, gap + 1.4, C.dark, 0, -0.74, 0);
  return bake(group);
}
