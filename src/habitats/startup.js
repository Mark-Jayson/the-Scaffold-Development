import * as THREE from 'three';
import { C, mat, basic, glow, screen, node, block, tube, ball, plane, flat, disc, rod, cable, pick, range } from '../kit.js';
import { WALL_HEIGHT, DOOR_WIDTH, DOOR_HEIGHT, tiled } from '../room.js';
import * as T from '../textures.js';
import { person, officeChair, sofa, beanbag, bookshelf, laptop, monitor, keyboard, mug, can, stickies, papers, rack, whiteboardStand, rug, plantPot, crate, trashBin, wallClock } from '../props.js';

const SHIRTS = [0x111827, 0xe5e7eb, 0x6366f1, 0xf97316, 0x10b981, 0x1f2937, 0xef4444, 0x0ea5e9, 0x9ca3af, 0xfacc15, 0x7c3aed];
const CANS = [0x2563eb, 0x16a34a, 0xdc2626, 0x111827, 0xf59e0b, 0xe5e7eb];
const HALF_WALL = 11.4 * Math.tan(Math.PI / 6);

function brickFace(decor, material, hasDoor) {
  const spans = hasDoor ? [[-HALF_WALL, -DOOR_WIDTH / 2 - 0.07], [DOOR_WIDTH / 2 + 0.07, HALF_WALL]] : [[-HALF_WALL, HALF_WALL]];
  for (const [from, to] of spans) {
    const texture = material.map.clone();
    texture.repeat.set((to - from) / 3.2, WALL_HEIGHT / 1.6);
    texture.needsUpdate = true;
    plane(decor, to - from, WALL_HEIGHT - 0.08, mat(0xffffff, { map: texture, roughness: 0.92 }), (from + to) / 2, WALL_HEIGHT / 2 - 0.04, 0.004);
  }
  if (hasDoor) {
    const texture = material.map.clone();
    texture.repeat.set(DOOR_WIDTH / 3.2, (WALL_HEIGHT - DOOR_HEIGHT) / 1.6);
    texture.needsUpdate = true;
    plane(decor, DOOR_WIDTH, WALL_HEIGHT - DOOR_HEIGHT - 0.15, mat(0xffffff, { map: texture, roughness: 0.92 }), 0, (WALL_HEIGHT + DOOR_HEIGHT) / 2 + 0.04, 0.004);
  }
}

function trestleTable(parent, x, z, ry, width, depth) {
  const group = node(parent, x, 0, z, ry), top = mat(0xd8b98a), leg = mat(0x2b2f36);
  block(group, width, 0.05, depth, top, 0, 0.78, 0);
  for (const side of [-1, 1]) {
    const tx = side * (width / 2 - 0.4);
    for (const end of [-1, 1]) rod(group, [tx, 0.78, end * 0.12], [tx, 0, end * (depth / 2 - 0.08)], 0.03, leg, 6);
    block(group, 0.06, 0.06, depth * 0.6, leg, tx, 0.72, 0);
  }
  return group;
}

function hackSeat(table, x, side, random, pool, options = {}) {
  const facing = side < 0 ? 0 : Math.PI, seatZ = side * 1.18, edge = side * 0.42;
  const seat = node(table, x + range(random, -0.12, 0.12), 0, seatZ + range(random, -0.08, 0.12), facing + range(random, -0.28, 0.28));
  officeChair(seat, 0, 0, 0, pick(random, [0x1f2937, 0x374151, 0x7f1d1d, 0x1e3a8a]));
  if (options.empty) seat.rotation.y += range(random, -0.9, 0.9);
  else person(seat, 0, 0, 0, { random, pose: options.pose ?? 'type', shirt: pick(random, SHIRTS), headset: random() > 0.6, glasses: random() > 0.6 });
  laptop(table, x + range(random, -0.1, 0.1), 0.83, edge, facing + Math.PI + range(random, -0.2, 0.2), pick(random, pool), pick(random, [C.metal, mat(0x2b2f36), C.metal]));
  if (random() > 0.3) monitor(table, x + range(random, -0.35, 0.35), 0.83, side * 0.1, facing + Math.PI + range(random, -0.25, 0.25), pick(random, pool), 0.75, 0.44);
  for (let index = 0; index < 1 + Math.floor(random() * 3); index += 1) can(table, x + range(random, -0.6, 0.6), 0.83, side * range(random, 0.15, 0.6), pick(random, CANS), random() > 0.75);
  if (random() > 0.5) mug(table, x + range(random, -0.6, 0.6), 0.83, side * range(random, 0.2, 0.55), pick(random, [0xf4f4f0, 0x111827, 0xf97316]));
  if (random() > 0.5) stickies(table, x - 0.3, 0.84, side * 0.62, 0, random, 2);
  if (random() > 0.6) papers(table, x + 0.4, 0.83, side * 0.45, random, 2);
  cable(table, [[x, 0.84, edge - side * 0.1], [x + 0.1, 0.84, side * 0.05], [x + 0.2, 0.6, side * 0.05], [x + 0.1, 0.02, 0.0]], 0.012, C.black);
}

function pizzaBox(parent, x, y, z, ry, open = false) {
  const group = node(parent, x, y, z, ry);
  block(group, 0.42, 0.05, 0.42, C.cardboard, 0, 0, 0);
  if (!open) {
    flat(group, 0.2, 0.08, mat(0xb91c1c), 0, 0.051, 0);
    return group;
  }
  const lid = node(group, 0, 0.05, -0.21);
  lid.rotation.x = -1.8;
  block(lid, 0.42, 0.01, 0.42, C.cardboard, 0, 0, 0.21);
  const pizza = new THREE.Mesh(new THREE.CircleGeometry(0.18, 20, 0, Math.PI * 1.55), mat(0xf2b544));
  pizza.rotation.x = -Math.PI / 2;
  pizza.position.y = 0.052;
  group.add(pizza);
  for (const [px, pz] of [[0.06, 0.05], [-0.08, 0.03], [0.02, -0.09], [-0.05, -0.06], [0.1, -0.04]]) tube(group, 0.025, 0.025, 0.008, mat(0xb4322a), px, 0.053, pz, 8);
  return group;
}

function pingPong(parent, x, z, ry, random, tick) {
  const group = node(parent, x, 0, z, ry), top = mat(0x1d6b4f, { roughness: 0.45 }), line = C.white;
  block(group, 1.52, 0.04, 2.74, top, 0, 0.72, 0);
  flat(group, 1.52, 0.03, line, 0, 0.761, 1.355);
  flat(group, 1.52, 0.03, line, 0, 0.761, -1.355);
  flat(group, 0.02, 2.74, line, 0, 0.761, 0);
  for (const side of [-1, 1]) {
    flat(group, 0.03, 2.74, line, side * 0.745, 0.761, 0);
    for (const end of [-1, 1]) block(group, 0.06, 0.72, 0.06, C.dark, side * 0.6, 0, end * 1.1);
  }
  block(group, 1.7, 0.15, 0.02, mat(0x111827, { transparent: true, opacity: 0.75 }), 0, 0.76, 0);
  block(group, 1.7, 0.02, 0.025, line, 0, 0.91, 0);
  const paddle = color => hand => {
    rod(hand, [0, 0, 0], [0, -0.1, 0.04], 0.018, C.woodLight, 6);
    const blade = tube(hand, 0.08, 0.08, 0.015, mat(color), 0, -0.1, 0.12, 14);
    blade.rotation.x = Math.PI / 2;
  };
  person(group, 0.2, -1.85, 0, { random, pose: 'cup', shirt: 0xf97316, holding: paddle(0xdc2626) });
  person(group, -0.25, 1.85, Math.PI, { random, pose: 'cup', shirt: 0x0ea5e9, holding: paddle(0x111827) });
  const rally = node(group);
  rally.userData.live = true;
  const ballMesh = ball(rally, 0.03, mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.25 }), 0, 1, 0, 8, 6);
  tick(time => {
    const phase = (time * 0.9) % 2, t = phase < 1 ? phase : 2 - phase;
    ballMesh.position.set(THREE.MathUtils.lerp(0.25, -0.2, t), 0.79 + Math.abs(Math.sin(t * Math.PI * 2)) * 0.32, THREE.MathUtils.lerp(-1.5, 1.5, t));
  });
}

function gong(parent, x, z, ry) {
  const group = node(parent, x, 0, z, ry), wood = mat(0x5b3a24);
  for (const side of [-1, 1]) {
    block(group, 0.08, 1.7, 0.08, wood, side * 0.55, 0, 0);
    block(group, 0.12, 0.05, 0.5, wood, side * 0.55, 0, 0);
  }
  block(group, 1.24, 0.08, 0.08, wood, 0, 1.7, 0);
  const disk = tube(group, 0.42, 0.42, 0.03, mat(0xc89b3c, { metalness: 0.8, roughness: 0.3 }), 0, 1.05, 0, 28);
  disk.rotation.x = Math.PI / 2;
  rim(group, 0.42, 0.025, mat(0xa47a2a, { metalness: 0.8, roughness: 0.3 }), 0, 1.07, 0);
  for (const side of [-1, 1]) rod(group, [side * 0.3, 1.7, 0], [side * 0.22, 1.43, 0], 0.008, C.dark, 4);
  rod(group, [0.65, 0.02, 0.2], [0.55, 0.6, 0.15], 0.02, C.woodLight, 6);
  ball(group, 0.07, mat(0x7f1d1d), 0.55, 0.62, 0.15, 8, 6);
  plane(group, 0.6, 0.18, screen(T.sign('DEAL CLOSED', '#111827', '#facc15', 256, 80, 30), { emissiveIntensity: 0.2 }), 0, 1.93, 0.01);
}
function rim(parent, radius, thickness, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 6, 28), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
}

function dog(parent, x, z, ry) {
  const group = node(parent, x, 0, z, ry), fur = mat(0xd6a157, { roughness: 1 }), dark = mat(0x8a5a2b);
  const bed = tube(group, 0.55, 0.6, 0.14, mat(0x6b7280, { roughness: 1 }), 0, 0, 0, 18);
  bed.scale.z = 0.75;
  const body = ball(group, 0.3, fur, 0, 0.28, 0, 12, 9);
  body.scale.set(0.8, 0.6, 1.3);
  ball(group, 0.15, fur, 0.04, 0.33, 0.42, 10, 8);
  const snout = ball(group, 0.07, fur, 0.05, 0.3, 0.56, 8, 6);
  snout.scale.z = 1.4;
  ball(group, 0.025, C.black, 0.05, 0.31, 0.65, 6, 4);
  for (const side of [-1, 1]) {
    const ear = ball(group, 0.06, dark, 0.04 + side * 0.11, 0.38, 0.4, 6, 5);
    ear.scale.set(0.5, 1.3, 0.8);
    rod(group, [side * 0.12, 0.18, 0.25], [side * 0.14, 0.16, 0.5], 0.05, fur, 6);
  }
  rod(group, [0, 0.3, -0.38], [0.25, 0.22, -0.6], 0.035, fur, 6, 0.02);
}

function guitar(parent, x, z, ry) {
  const group = node(parent, x, 0, z, ry), body = mat(0xb45309, { roughness: 0.4 });
  const lower = ball(group, 0.2, body, 0, 0.25, 0, 14, 10);
  lower.scale.z = 0.35;
  const upper = ball(group, 0.15, body, 0, 0.5, 0, 14, 10);
  upper.scale.z = 0.35;
  disc(group, 0.06, C.black, 0, 0.42, 0.075, 14).rotation.x = 0;
  block(group, 0.06, 0.62, 0.03, C.woodDark, 0, 0.6, 0);
  block(group, 0.09, 0.14, 0.03, C.woodDark, 0, 1.2, 0);
  group.rotation.x = -0.22;
}

export default {
  id: 'startup',
  name: 'Startup',
  caption: 'Hack floor',
  accent: 0xef9b7e,
  room: () => ({ floor: tiled(T.concrete(), 7), wall: mat(0x6d5b52, { roughness: 0.95 }) }),
  build({ content, room, random, tick }) {
    const pool = ['code', 'terminal', 'dashboard', 'design', 'code', 'sheet', 'terminal'].map(kind => screen(T.screens[kind]()));
    const brick = mat(0xffffff, { map: T.brick() });
    room.walls.forEach(wall => brickFace(wall.decor, brick, wall.hasDoor));

    /* Whiteboard wall where the big ideas happen */
    const board = room.decor(3);
    block(board, 7.6, 2.12, 0.05, mat(0xc5cad3, { metalness: 0.3 }), -0.8, 0.86, 0.02);
    plane(board, 7.45, 1.98, mat(0xffffff, { map: T.whiteboard(0), roughness: 0.3 }), -0.8, 1.92, 0.05);
    block(board, 6.0, 0.04, 0.12, mat(0xc5cad3), -0.8, 0.84, 0.08);
    for (const [dx, color] of [[-2.8, 0x2563eb], [-2.65, 0xdc2626], [-2.5, 0x16a34a], [-2.35, 0x111827]]) rod(board, [dx, 0.89, 0.1], [dx + 0.11, 0.89, 0.1], 0.013, mat(color), 6);
    block(board, 0.14, 0.05, 0.06, mat(0x374151), -1.9, 0.89, 0.1);
    for (let row = 0; row < 4; row += 1) stickies(board, 3.6, 2.6 - row * 0.32, 0.03, 0, random, 4);
    person(room.frame(3), -1.6, 0.75, Math.PI, { random, pose: 'write', shirt: SHIRTS[1], holding: hand => rod(hand, [0, 0, 0], [0, 0, 0.12], 0.012, mat(0x2563eb), 6) });
    person(room.frame(3), 0.5, 1.9, Math.PI + 0.25, { random, pose: 'crossed', shirt: SHIRTS[5], glasses: true });
    person(room.frame(3), 1.6, 1.6, Math.PI - 0.35, { random, pose: 'phone', shirt: SHIRTS[9] });

    /* Couch corner under the neon */
    const lounge = room.frame(5);
    plane(room.decor(5), 2.6, 0.65, basic(0xffffff, { map: T.neon('SHIP IT', '#ff3ea5'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 1.5, 2.55, 0.04);
    plane(room.decor(5), 0.75, 1.0, mat(0xffffff, { map: T.poster('rocket') }), -1.6, 1.95, 0.03);
    plane(room.decor(5), 0.75, 1.0, mat(0xffffff, { map: T.poster('done') }), -2.65, 1.95, 0.03, 0.04);
    const metrics = room.decor(5);
    block(metrics, 1.86, 1.08, 0.06, C.black, 4.5, 1.35, 0.03);
    plane(metrics, 1.8, 1.02, screen(T.screens.metrics(), { emissiveIntensity: 0.75 }), 4.5, 1.89, 0.065);
    const dart = node(room.decor(5), -4.6, 1.75, 0.04);
    for (const [radius, color] of [[0.26, 0x111827], [0.22, 0xf1e7d0], [0.16, 0xdc2626], [0.1, 0xf1e7d0], [0.05, 0x16a34a], [0.02, 0xdc2626]]) {
      const face = disc(dart, radius, mat(color), 0, 0, 0.01 + (0.26 - radius) * 0.05, 24);
      face.rotation.x = 0;
    }
    rug(lounge, 1.4, 1.9, 0, 4.0, 2.8, 0xe0a458, 0x2b6777);
    sofa(lounge, 1.5, 0.55, 0, 0x7a4a32, 2.5);
    const sleeper = person(lounge, 0.45, 0.62, 0, { random, pose: 'stand', shirt: SHIRTS[2], style: 'curly', glasses: false });
    sleeper.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
    sleeper.position.y = 0.64;
    block(lounge, 0.45, 0.14, 0.34, mat(0xf2f2ee), 2.45, 0.49, 0.6, 0.1);
    block(lounge, 1.1, 0.04, 0.5, mat(0x7c3aed, { roughness: 1 }), 1.0, 0.75, 0.62, 0.05);
    beanbag(lounge, 0.4, 2.5, 0xf97316);
    beanbag(lounge, 2.6, 2.7, 0x6366f1);
    person(lounge, 0.4, 2.45, 0.4, { random, pose: 'lounge', shirt: SHIRTS[4], y: -0.05, holding: hand => block(hand, 0.38, 0.02, 0.26, C.metal, 0, 0, 0.05) });
    dog(lounge, -0.9, 1.3, 0.6);
    guitar(lounge, 3.0, 0.25, -0.3);
    can(lounge, 2.0, 0, 1.6, CANS[0], true);
    can(lounge, 0.9, 0, 3.3, CANS[3]);

    /* Server rack, boxes and the deal gong along the top wall */
    const top = room.frame(4), leds = T.serverFront();
    rack(top, -4.8, 0.7, 0, screen(leds, { emissiveIntensity: 0.9 }), random, 2.1);
    cable(top, [[-4.6, 1.2, 1.36], [-4.2, 0.6, 1.6], [-3.6, 0.02, 2.0], [-2.2, 0.02, 2.6]], 0.02, mat(0x2563eb));
    cable(top, [[-4.9, 1.0, 1.36], [-4.7, 0.3, 1.8], [-4.0, 0.02, 2.4], [-2.6, 0.02, 3.0]], 0.02, mat(0xf59e0b));
    for (const [x, y, z, size, turn] of [[-3.1, 0, 0.4, 0.6, 0.1], [-3.0, 0.6, 0.42, 0.5, -0.2], [-2.5, 0, 0.5, 0.55, 0.4], [-3.15, 1.1, 0.4, 0.4, 0.3], [-2.4, 0.55, 0.5, 0.35, 0.1]]) crate(top, x, y, z, turn, size, size, size);
    const fridge = node(top, 2.5, 0, 0.36);
    block(fridge, 0.6, 0.85, 0.6, mat(0xe5e7eb), 0, 0, 0);
    block(fridge, 0.03, 0.3, 0.04, C.steel, -0.24, 0.45, 0.31);
    for (const [px, py, color] of [[0.05, 0.6, 0xf97316], [0.15, 0.35, 0x6366f1], [-0.05, 0.2, 0x10b981], [0.1, 0.72, 0xfacc15]]) plane(fridge, 0.12, 0.09, mat(color), px, py, 0.301, (px - py) * 0.6);
    for (let index = 0; index < 4; index += 1) can(fridge, -0.2 + index * 0.13, 0.85, 0, CANS[index]);
    bookshelf(top, 3.7, 0.2, 0, 1.2, 1.7, random, mat(0x2b2f36));
    gong(top, 5.1, 0.6, -0.3);

    /* Hack tables */
    const tableOne = trestleTable(content, 2.5, -3.2, 0, 6.0, 1.5);
    [[-2, -1], [0, -1], [2, -1], [-2, 1], [0, 1], [2, 1]].forEach(([x, side], index) => hackSeat(tableOne, x, side, random, pool, { empty: index === 4 }));
    person(tableOne, 0.35, 2.05, Math.PI + 0.2, { random, pose: 'work', shirt: SHIRTS[6] });
    const drone = node(tableOne, 1.0, 0.83, 0.05, 0.4);
    block(drone, 0.16, 0.06, 0.16, C.dark, 0, 0, 0);
    for (const angle of [0.785, 2.356, 3.927, 5.498]) {
      rod(drone, [0, 0.03, 0], [Math.sin(angle) * 0.2, 0.03, Math.cos(angle) * 0.2], 0.012, C.dark, 4);
      tube(drone, 0.07, 0.07, 0.008, mat(0x9ca3af, { transparent: true, opacity: 0.6 }), Math.sin(angle) * 0.2, 0.05, Math.cos(angle) * 0.2, 12);
    }
    trashBin(content, -0.9, -4.6, 0x374151);
    for (let index = 0; index < 5; index += 1) can(content, range(random, -0.5, 5.5), 0, range(random, -4.6, -1.8), pick(random, CANS), true);

    const tableTwo = trestleTable(content, 4.4, 3.4, 0.12, 5.0, 1.4);
    [[-1.6, -1], [0.2, -1], [1.7, 1]].forEach(([x, side]) => hackSeat(tableTwo, x, side, random, pool));
    hackSeat(tableTwo, -0.4, 1, random, pool, { empty: true });
    pizzaBox(tableTwo, 1.3, 0.83, -0.25, 0.3, true);
    pizzaBox(tableTwo, -0.9, 0.83, 0.2, -0.2);
    pizzaBox(tableTwo, -0.92, 0.88, 0.22, 0.1);
    pizzaBox(tableTwo, 2.3, 0.83, -0.2, 0.7);
    tube(tableTwo, 0.05, 0.06, 0.32, mat(0x166534, { transparent: true, opacity: 0.8 }), 0.6, 0.83, 0.3, 10);
    plantPot(tableTwo, -2.2, 0.15, 0.4, 'snake', 0.83, mat(0xf2f2ee));

    const tableThree = trestleTable(content, -3.5, -7.2, 0, 4.0, 1.4);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, side], index) => hackSeat(tableThree, x, side, random, pool, { empty: index === 1 }));
    block(tableThree, 0.5, 0.35, 0.4, C.cardboard, 1.6, 0.83, 0.1, 0.3);
    const tableFour = trestleTable(content, -4.2, 8.6, -0.08, 4.0, 1.4);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, side]) => hackSeat(tableFour, x, side, random, pool));
    const tableFive = trestleTable(content, 4.5, 8.0, 0.05, 4.8, 1.5);
    [[-1.6, -1], [0, -1], [1.6, -1], [-1.6, 1], [0, 1], [1.6, 1]].forEach(([x, side], index) => hackSeat(tableFive, x, side, random, pool, { empty: index === 5 }));
    pizzaBox(tableFive, 2.1, 0.83, 0.05, -0.4);

    /* Triple-monitor battlestation */
    const station = node(content, -7.6, 0, -1.5, -Math.PI / 2);
    block(station, 2.2, 0.05, 0.85, C.black, 0, 0.78, 0);
    for (const side of [-1, 1]) block(station, 0.06, 0.78, 0.7, C.dark, side * 1.0, 0, 0);
    block(station, 2.1, 0.02, 0.02, glow(0xa855f7, 1.5), 0, 0.76, 0.42);
    [[-0.78, 0.45], [0, 0], [0.78, -0.45]].forEach(([x, turn]) => monitor(station, x, 0.83, -0.18 + Math.abs(turn) * 0.25, turn, pick(random, pool), 0.76, 0.45));
    keyboard(station, 0, 0.83, 0.16);
    block(station, 0.22, 0.48, 0.48, mat(0x111827), 0.8, 0.83, -0.05);
    block(station, 0.01, 0.4, 0.4, glow(0x22d3ee, 0.9), 0.69, 0.87, -0.05);
    can(station, -0.7, 0.83, 0.2, CANS[4]);
    can(station, -0.55, 0.83, 0.25, CANS[2], true);
    const gamingSeat = node(station, 0, 0, 0.85, Math.PI);
    officeChair(gamingSeat, 0, 0, 0, 0x7f1d1d);
    person(gamingSeat, 0, 0, 0, { random, pose: 'type', shirt: SHIRTS[0], headset: true, style: 'buzz' });

    /* Arcade cabinet and espresso cart */
    const arcade = node(content, 6.4, 0, -7.0, -0.9);
    block(arcade, 0.75, 1.75, 0.7, mat(0x1e1b4b), 0, 0, 0);
    block(arcade, 0.78, 0.3, 0.72, glow(0xec4899, 0.6), 0, 1.75, 0);
    const arcadeScreen = plane(arcade, 0.58, 0.46, screen(T.screens.dashboard(), { emissiveIntensity: 1 }), 0, 1.35, 0.36);
    arcadeScreen.rotation.x = -0.2;
    block(arcade, 0.7, 0.08, 0.3, mat(0x312e81), 0, 0.95, 0.4);
    ball(arcade, 0.035, mat(0xef4444), -0.15, 1.06, 0.45, 8, 6);
    for (const dx of [0.05, 0.15, 0.25]) ball(arcade, 0.025, mat(0xfacc15), dx, 1.04, 0.45, 8, 6);
    const cart = node(content, 3.4, 0, -7.4, 0.25);
    block(cart, 1.1, 0.04, 0.55, C.metal, 0, 0.9, 0);
    block(cart, 1.1, 0.04, 0.55, C.metal, 0, 0.35, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      block(cart, 0.03, 0.9, 0.03, C.steel, sx * 0.52, 0.06, sz * 0.24);
      ball(cart, 0.04, C.black, sx * 0.52, 0.04, sz * 0.24, 6, 5);
    }
    block(cart, 0.32, 0.38, 0.3, mat(0xb91c1c, { metalness: 0.4 }), -0.25, 0.94, 0);
    for (let index = 0; index < 4; index += 1) mug(cart, 0.15 + (index % 2) * 0.14, 0.94, -0.08 + Math.floor(index / 2) * 0.16, pick(random, [0xf4f4f0, 0x111827]));
    for (let index = 0; index < 6; index += 1) block(cart, 0.14, 0.2, 0.06, mat(pick(random, [0xf97316, 0xef4444, 0x22c55e, 0xfacc15])), -0.4 + index * 0.15, 0.39, 0);

    /* Rolling whiteboards scattered mid-debate */
    whiteboardStand(content, -3.6, 1.6, 0.9, mat(0xffffff, { map: T.whiteboard(1), roughness: 0.3 }));
    person(content, -2.75, 2.35, -2.3, { random, pose: 'point', shirt: SHIRTS[7] });
    person(content, -2.2, 1.2, -1.6, { random, pose: 'crossed', shirt: SHIRTS[10] });
    whiteboardStand(content, -5.2, 5.4, 2.3, mat(0xffffff, { map: T.whiteboard(2), roughness: 0.3 }));

    /* Ping-pong for the 2am breaks */
    pingPong(content, 9.3, -0.2, 0, random, tick);

    /* Standing desk by the window */
    const standing = node(room.frame(2), -3.0, 0, 0.45);
    block(standing, 1.4, 0.04, 0.7, mat(0xf5f5f4), 0, 1.08, 0);
    for (const side of [-1, 1]) {
      block(standing, 0.07, 1.08, 0.07, C.dark, side * 0.6, 0, 0);
      block(standing, 0.08, 0.04, 0.6, C.dark, side * 0.6, 0, 0);
    }
    monitor(standing, -0.3, 1.12, -0.1, 0.15, pool[0], 0.7, 0.42);
    monitor(standing, 0.35, 1.12, -0.1, -0.15, pool[1], 0.7, 0.42);
    keyboard(standing, 0, 1.12, 0.18);
    can(standing, 0.6, 1.12, 0.15, CANS[1]);
    person(standing, 0, 0.75, Math.PI, { random, pose: 'work', shirt: SHIRTS[0], headset: true });
    block(room.frame(2), 0.9, 0.02, 0.6, mat(0x111827, { roughness: 1 }), -3.0, 0, 1.2);

    /* Floor clutter */
    const scooter = node(content, -6.2, 0, -2.9, 0.5);
    block(scooter, 0.16, 0.05, 0.9, C.dark, 0, 0.08, 0);
    for (const end of [-1, 1]) ball(scooter, 0.08, C.rubber, 0, 0.08, end * 0.42, 10, 8).scale.x = 0.4;
    rod(scooter, [0, 0.1, 0.42], [0, 1.0, 0.36], 0.022, C.metal, 6);
    rod(scooter, [-0.22, 1.0, 0.36], [0.22, 1.0, 0.36], 0.02, C.dark, 6);
    const backpack = block(content, 0.36, 0.42, 0.2, mat(0x9a3412, { roughness: 1 }), -0.9, 0, -1.7, 0.6);
    backpack.rotation.x = 0.4;
    block(content, 0.6, 0.05, 0.5, mat(0x4b5563, { roughness: 1 }), 6.9, 0, -5.3, 1.1);
    const skate = node(content, 7.2, 0, 4.9, 1.2);
    block(skate, 0.22, 0.03, 0.8, mat(0xdc2626), 0, 0.07, 0);
    for (const end of [-1, 1]) for (const side of [-1, 1]) tube(skate, 0.03, 0.03, 0.03, mat(0xfef08a), side * 0.08, 0.02, end * 0.28, 8).rotation.z = Math.PI / 2;
    cable(content, [[2.5, 0.01, -3.2], [1.6, 0.01, -1.0], [3.4, 0.01, 0.8], [4.4, 0.01, 3.4]], 0.018, mat(0x111827));
    cable(content, [[4.4, 0.01, 3.4], [5.5, 0.01, 5.6], [4.5, 0.01, 8.0]], 0.018, mat(0x111827));
    cable(content, [[-3.5, 0.01, -7.2], [-5.0, 0.01, -4.5], [-7.6, 0.01, -1.5]], 0.018, mat(0xf97316));
    for (const [x, z, size, turn] of [[-0.2, 5.6, 0.55, 0.5], [0.2, 6.2, 0.4, 1.1], [-6.6, 3.0, 0.5, 0.3], [7.4, -3.8, 0.45, 0.8], [6.8, 6.0, 0.6, 0.2], [6.9, 6.0, 0.4, 0.9]]) crate(content, x, x === 6.9 ? 0.6 : 0, z, turn, size, size * 0.8, size);
    for (const [x, z] of [[-1.2, -0.4], [6.8, -0.6], [0.9, 5.2], [-6.0, 1.9]]) officeChair(content, x, z, random() * 6, pick(random, [0x1f2937, 0x374151, 0x7f1d1d]));
    for (let index = 0; index < 10; index += 1) can(content, range(random, -7, 8), 0, range(random, -7, 9), pick(random, CANS), true);
    for (let index = 0; index < 8; index += 1) flat(content, 0.21, 0.29, C.paper, range(random, -7, 8), 0.004, range(random, -7, 9), random() * 3);
    block(content, 0.5, 0.04, 0.12, mat(0xe5e7eb), 1.6, 0, -1.0, 0.7);
    const wallTime = T.clock('SF', -7);
    wallClock(room.decor(3), 4.6, 1.2, 0, 0, wallTime, 0.5);
    let lastSecond = -1, lastBlink = 0;
    tick(time => {
      const second = Math.floor(Date.now() / 1000);
      if (second !== lastSecond) wallTime.redraw();
      lastSecond = second;
      if (time - lastBlink > 0.3) {
        leds.redraw();
        lastBlink = time;
      }
    });
  },
};
