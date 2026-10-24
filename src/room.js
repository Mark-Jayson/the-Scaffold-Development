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

/* Abstract outline marking an empty slot in the honeycomb; `core: false` leaves the middle clear for a floor label.
   Placeholders stay hidden until `revealGhost` asks for one, then fade in and out. */
const ghostLine = opacity => new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity, depthWrite: false });
const ghostDash = (opacity, dashSize, gapSize) => new THREE.LineDashedMaterial({ color: 0xffffff, transparent: true, opacity, dashSize, gapSize, depthWrite: false });
const corners = radius => Array.from({ length: 7 }, (_, index) => new THREE.Vector3(Math.sin((index + 0.5) * Math.PI / 3) * radius, 0, Math.cos((index + 0.5) * Math.PI / 3) * radius));
const traceInto = group => (points, material, Kind = THREE.Line) => {
  const line = new Kind(new THREE.BufferGeometry().setFromPoints(points), material);
  if (material.isLineDashedMaterial) line.computeLineDistances();
  group.add(line);
};
const ghosts = [];
export function ghostHex(parent, position, { core: withCore = true } = {}) {
  const group = node(parent, position.x, 1.6, position.z), trace = traceInto(group);
  const look = { faint: ghostLine(0), soft: ghostLine(0), accent: ghostLine(0), dashed: ghostDash(0, 0.7, 0.55) };
  const outer = corners(HEX_RADIUS + 0.3), wall = corners(CORNER_RADIUS), core = corners(4.2);
  trace(outer, look.soft);
  trace(corners(HEX_RADIUS - 0.9), look.faint);
  trace(wall, look.dashed);
  const brackets = [], spokes = [];
  for (let corner = 0; corner < 6; corner += 1) {
    for (const neighbour of [outer[(corner + 5) % 6], outer[corner + 1]]) brackets.push(outer[corner], outer[corner].clone().lerp(neighbour, 0.14));
    spokes.push(core[corner], wall[corner]);
  }
  trace(brackets, look.accent, THREE.LineSegments);
  if (withCore) {
    trace(core, look.faint);
    trace(spokes, look.faint, THREE.LineSegments);
    trace([new THREE.Vector3(-0.8, 0, 0), new THREE.Vector3(0.8, 0, 0), new THREE.Vector3(0, 0, -0.8), new THREE.Vector3(0, 0, 0.8)], look.soft, THREE.LineSegments);
  }
  group.visible = false;
  group.userData.ghost = { look, reveal: 0, target: 0 };
  ghosts.push(group);
  return group;
}
export const revealGhost = (group, on) => {
  group.userData.ghost.target = on ? 1 : 0;
};
// Fades each placeholder toward its target while the accent corners keep breathing.
export function updateGhosts(time, delta) {
  for (const group of ghosts) {
    const state = group.userData.ghost, { faint, soft, accent, dashed } = state.look;
    state.reveal = damp(state.reveal, state.target, 7, delta);
    group.visible = state.reveal > 0.01;
    faint.opacity = 0.16 * state.reveal;
    soft.opacity = 0.4 * state.reveal;
    dashed.opacity = 0.32 * state.reveal;
    accent.opacity = (0.62 + Math.sin(time * 1.4) * 0.22) * state.reveal;
  }
}

// Walkways run along the line joining two cell centres. Each end says how far from its centre the deck reaches
// (through a doorway, or onto a landing) and where the open stretch begins.
const WALK_WIDTH = DOOR_WIDTH / 2;
export const ROOM_END = { reach: INNER, clear: APOTHEM + THICK / 2 };
const HUB_RADIUS = 1.8, HUB_APOTHEM = HUB_RADIUS * Math.cos(Math.PI / 6);
export const HUB_END = { reach: HUB_APOTHEM, clear: HUB_APOTHEM };
const run = (parent, from, to, y) => {
  const dx = to.x - from.x, dz = to.z - from.z;
  return { group: node(parent, from.x, y, from.z, Math.atan2(dx, dz)), distance: Math.hypot(dx, dz) };
};

// Solid railed walkway, only ever between two built habitats.
export function bridge(parent, from, to, accent, [start, end] = [ROOM_END, ROOM_END]) {
  const { group, distance } = run(parent, from, to, FLOOR_Y);
  const deckFrom = start.reach, deckTo = distance - end.reach, openFrom = start.clear, openTo = distance - end.clear;
  const open = openTo - openFrom, middle = (openFrom + openTo) / 2, posts = Math.max(1, Math.round(open / 3.2));
  block(group, WALK_WIDTH, 0.2, deckTo - deckFrom, mat(0xd1d0c8), 0, -0.2, (deckFrom + deckTo) / 2);
  flat(group, 0.12, open, mat(accent, { emissive: accent, emissiveIntensity: 0.45 }), 0, 0.006, middle);
  for (const side of [-1, 1]) {
    const x = side * (WALK_WIDTH / 2 - 0.05);
    block(group, 0.04, 0.95, open, glass(0xd9f1ff, 0.22), x, 0, middle);
    block(group, 0.06, 0.05, open, C.metal, x, 0.95, middle);
    for (let index = 0; index <= posts; index += 1) block(group, 0.08, 1.0, 0.08, C.metal, x, 0, openFrom + 0.04 + index * (open - 0.08) / posts);
  }
  block(group, 0.6, 0.35, open + 1.4, C.dark, 0, -0.55, middle);
  return bake(group);
}

// Blueprint walkway for anything that touches an empty Endeavor cell: its outline and a dashed centre line.
const PATH = { edge: ghostLine(0.4), centre: ghostDash(0.3, 0.45, 0.35) };
export function ghostPath(parent, from, to, [start, end] = [ROOM_END, ROOM_END]) {
  const { group, distance } = run(parent, from, to, FLOOR_Y + 0.02), trace = traceInto(group);
  const near = start.clear, far = distance - end.clear, half = WALK_WIDTH / 2, at = (x, z) => new THREE.Vector3(x, 0, z);
  trace([at(-half, near), at(-half, far), at(half, near), at(half, far), at(-half, near), at(half, near), at(-half, far), at(half, far)], PATH.edge, THREE.LineSegments);
  trace([at(0, near), at(0, far)], PATH.centre);
  return group;
}

// Blueprint landing in the middle of an empty Endeavor cell, where its walkways meet.
export function ghostLanding(parent, position) {
  const group = node(parent, position.x, FLOOR_Y + 0.02, position.z), trace = traceInto(group);
  trace(corners(HUB_RADIUS), PATH.edge);
  trace(corners(HUB_RADIUS * 0.55), PATH.centre);
  return group;
}

// Grows each furnishing about the middle of its footprint (heights scale from the floor, so things stay stacked),
// then nudges it back inside the walls. Anything that still would not fit, like a wall-long counter, keeps its size.
const NORMALS = Array.from({ length: 6 }, (_, side) => sideNormal(side));
const reach = (box, [nx, nz]) => Math.max(box.min.x * nx, box.max.x * nx) + Math.max(box.min.z * nz, box.max.z * nz);
export function enlarge(content, items, factor, { ceiling = Infinity } = {}) {
  // Refresh from the top so the habitat's own placement is included, not just the room's local layout.
  content.updateWorldMatrix(true, true);
  const origin = new THREE.Vector3().setFromMatrixPosition(content.matrixWorld);
  const box = new THREE.Box3(), pivot = new THREE.Vector3(), shift = new THREE.Vector3(), position = new THREE.Vector3();
  for (const item of items) {
    box.setFromObject(item);
    if (box.isEmpty()) continue;
    box.translate(position.copy(origin).negate());
    pivot.set((box.min.x + box.max.x) / 2, 0, (box.min.z + box.max.z) / 2);
    const grown = box.clone().translate(position.copy(pivot).negate());
    grown.min.multiplyScalar(factor);
    grown.max.multiplyScalar(factor);
    grown.translate(pivot);
    const limits = NORMALS.map(normal => Math.max(INNER - 0.02, reach(box, normal)));
    shift.set(0, 0, 0);
    NORMALS.forEach((normal, side) => {
      const over = reach(grown, normal) - limits[side];
      if (over > 0) shift.add(position.set(-normal[0] * over, 0, -normal[1] * over));
    });
    grown.translate(shift);
    if (NORMALS.some((normal, side) => reach(grown, normal) > limits[side] + 0.05) || grown.max.y > Math.max(ceiling, box.max.y)) continue;
    pivot.add(origin);
    item.getWorldPosition(position).sub(pivot).multiplyScalar(factor).add(pivot).add(shift);
    item.position.copy(item.parent.worldToLocal(position));
    item.scale.multiplyScalar(factor);
  }
}
