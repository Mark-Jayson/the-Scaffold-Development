import * as THREE from 'three';
import { C, mat, glow, glass, screen, node, block, tube, ball, plane, flat, rod, pick } from '../kit.js';
import { floorShape, wallStrip, tiled } from '../room.js';
import * as T from '../textures.js';
import { person, deskPod, sofa, table, officeChair, stool, bookshelf, cabinet, plantPot, rug, floorLamp, laptop, mug, notebook, bottle, tv, waterCooler, trashBin, coatRack, fireExtinguisher, wallClock, vent, outlet, partition } from '../props.js';

const SHIRTS = [0x5b7bd5, 0xf2f2ee, 0x34495e, 0xa3c4f3, 0xd96c5f, 0x6aa38b, 0xe8c26c, 0x8e7cc3, 0x2f3542];

function kitchenette(frame) {
  const body = mat(0xf3f2ee), counter = mat(0x2f3237, { roughness: 0.35 }), seam = mat(0xc9cbcf), handle = C.steel;
  block(frame, 6.0, 0.1, 0.6, C.dark, -2.0, 0, 0.3);
  block(frame, 6.0, 0.78, 0.62, body, -2.0, 0.1, 0.31);
  block(frame, 6.06, 0.05, 0.68, counter, -2.0, 0.88, 0.34);
  for (let x = -5.0; x <= 1.0; x += 0.6) block(frame, 0.012, 0.74, 0.01, seam, x, 0.12, 0.625);
  for (let x = -4.7; x < 1.0; x += 0.6) block(frame, 0.16, 0.02, 0.025, handle, x, 0.78, 0.635);
  flat(frame, 0.62, 0.42, C.metal, -3.2, 0.932, 0.34);
  rod(frame, [-3.2, 0.93, 0.08], [-3.2, 1.24, 0.08], 0.022, C.metal, 8);
  rod(frame, [-3.2, 1.24, 0.08], [-3.2, 1.2, 0.3], 0.018, C.metal, 8);
  tube(frame, 0.13, 0.15, 0.035, mat(0xe5e7eb), -2.2, 0.93, 0.36, 18);
  for (const [dx, dz, color] of [[0, 0, 0xf59e0b], [0.08, 0.05, 0xdc2626], [-0.06, 0.06, 0xfacc15], [0.03, -0.07, 0x84cc16]]) ball(frame, 0.05, mat(color, { roughness: 0.5 }), -2.2 + dx, 1.0, 0.36 + dz, 8, 6);
  const coffee = node(frame, -1.0, 0.93, 0.32);
  block(coffee, 0.36, 0.46, 0.36, C.black, 0, 0, 0);
  block(coffee, 0.3, 0.12, 0.02, C.metal, 0, 0.26, 0.18);
  block(coffee, 0.22, 0.03, 0.12, C.steel, 0, 0.0, 0.2);
  block(coffee, 0.1, 0.06, 0.01, glow(0x38bdf8, 1.2), 0.08, 0.4, 0.181);
  mug(frame, -1.0, 0.96, 0.46, 0xf4f4f0);
  mug(frame, -0.62, 0.93, 0.5, 0x2f5d8a);
  tube(frame, 0.08, 0.09, 0.22, C.metal, -0.3, 0.93, 0.35, 12);
  const microwave = node(frame, 0.45, 0.93, 0.3);
  block(microwave, 0.52, 0.3, 0.38, mat(0xe8e8e6), 0, 0, 0);
  block(microwave, 0.34, 0.22, 0.01, mat(0x14161b, { roughness: 0.2 }), -0.06, 0.04, 0.19);
  tube(frame, 0.06, 0.06, 0.26, C.paper, -4.4, 0.93, 0.3, 12).rotation.z = Math.PI / 2;
}

function phoneBooth(parent, x, z, ry, random) {
  const group = node(parent, x, 0, z, ry), felt = mat(0x2f6f73, { roughness: 1 }), frame = mat(0x1f2937);
  block(group, 1.3, 0.06, 1.3, frame, 0, 0, 0);
  block(group, 1.3, 0.1, 1.3, frame, 0, 2.25, 0);
  block(group, 1.3, 2.2, 0.08, felt, 0, 0.05, -0.61);
  for (const side of [-1, 1]) block(group, 0.08, 2.2, 1.3, felt, side * 0.61, 0.05, 0);
  block(group, 1.14, 2.18, 0.03, glass(0xe0f4ff, 0.2), 0, 0.06, 0.63);
  block(group, 0.04, 0.5, 0.05, C.metal, 0.45, 0.95, 0.66);
  block(group, 0.8, 0.04, 0.4, C.woodLight, 0, 0.98, -0.37);
  block(group, 1.0, 0.03, 0.6, glow(0xfff4dc, 0.8), 0, 2.22, 0);
  person(group, 0, 0.1, 0, { random, pose: 'phone', shirt: pick(random, SHIRTS) });
  laptop(group, 0.2, 1.02, -0.38, 0.4, screen(T.screens.email()));
  return group;
}

export default {
  id: 'studios',
  name: 'Workplace',
  caption: 'Open office',
  accent: 0x879dff,
  room: () => ({ floor: tiled(T.carpet('#5a6878', '#637387'), 2.4), wall: mat(0xebe8e1), glassSides: [0, 1, 2], glassFrom: 1.0 }),
  build({ content, room, random, tick }) {
    const pool = ['code', 'sheet', 'dashboard', 'design', 'email', 'calendar'].map(kind => screen(T.screens[kind]()));
    const planksTexture = T.planks([196, 156, 112]);

    /* Kitchenette along the upper-right wall */
    floorShape(room.frame(3), wallStrip(3.6), tiled(planksTexture, 4.5));
    kitchenette(room.frame(3));
    const kitchenDecor = room.decor(3), cupboard = mat(0xf3f2ee);
    block(kitchenDecor, 3.4, 0.75, 0.36, cupboard, -3.3, 1.55, 0.18);
    for (let x = -4.95; x <= -1.6; x += 0.68) {
      block(kitchenDecor, 0.012, 0.71, 0.01, mat(0xc9cbcf), x, 1.57, 0.365);
      block(kitchenDecor, 0.02, 0.14, 0.025, C.steel, x + 0.6, 1.6, 0.375);
    }
    block(kitchenDecor, 2.2, 0.04, 0.3, C.woodLight, -0.25, 1.7, 0.15);
    for (const [x, color] of [[-1.15, 0xf4f4f0], [-0.95, 0x2f5d8a], [-0.75, 0xd2413a], [-0.55, 0xf2c94c]]) mug(kitchenDecor, x, 1.74, 0.15, color);
    for (const x of [-0.1, 0.12, 0.34]) tube(kitchenDecor, 0.07, 0.07, 0.2, glass(0xf5e1b8, 0.6), x, 1.74, 0.15, 10);
    plantPot(kitchenDecor, 0.65, 0.15, 0.45, 'fern', 1.74);
    const moonClock = T.clock('MOON BASE', 0);
    wallClock(kitchenDecor, 1.75, 2.62, 0, 0, moonClock, 0.55);
    vent(kitchenDecor, 4.4, 2.75, 0, 0);
    outlet(kitchenDecor, -2.5, 1.05, 0.005, 0);
    outlet(kitchenDecor, 0.2, 1.05, 0.005, 0);
    const fridge = node(room.frame(3), 1.75, 0, 0.38);
    block(fridge, 0.86, 2.0, 0.74, mat(0xc9ced6, { metalness: 0.55, roughness: 0.3 }), 0, 0, 0);
    block(fridge, 0.84, 0.012, 0.01, C.steel, 0, 1.3, 0.371);
    for (const y of [0.6, 1.5]) block(fridge, 0.03, 0.42, 0.04, C.steel, -0.34, y, 0.39);
    plane(fridge, 0.08, 0.08, mat(0xfde68a), 0.15, 1.6, 0.372);
    plane(fridge, 0.1, 0.07, mat(0xbfdbfe), 0.05, 1.45, 0.372, 0.2);
    waterCooler(room.frame(3), 2.9, 0.3, 0);
    [[3.95, 0x2563eb], [4.4, 0x16a34a], [4.85, 0x6b7280]].forEach(([x, color]) => {
      block(room.frame(3), 0.4, 0.62, 0.42, mat(color), x, 0, 0.3);
      block(room.frame(3), 0.42, 0.04, 0.44, mat(new THREE.Color(color).multiplyScalar(0.7).getHex()), x, 0.62, 0.3);
    });

    const bar = node(room.frame(3), -2.8, 0, 2.4);
    table(bar, 0, 0, 0, 0.9, 0.9, mat(0xfafaf7), C.steel, 1.05, true);
    mug(bar, 0.15, 1.05, -0.1, 0xd2413a);
    notebook(bar, -0.18, 1.05, 0.05, 0.4, 0x1f2937);
    stool(bar, 0.62, 0.3, 0.78);
    stool(bar, -0.6, 0.35, 0.78);
    person(bar, 0.68, 0.33, -2.0, { random, pose: 'stool', shirt: SHIRTS[3] });
    person(bar, -0.15, -0.72, 0.15, { random, pose: 'cup', shirt: SHIRTS[4], holding: hand => mug(hand, 0, -0.05, 0.02, 0xf4f4f0) });
    person(room.frame(3), -1.0, 1.0, Math.PI, { random, pose: 'work', shirt: SHIRTS[6] });

    /* Glass meeting room on the upper-left wall */
    const meeting = room.frame(5);
    floorShape(meeting, [[-6.58, 0], [1.4, 0], [1.4, 3.7], [-4.45, 3.7]], mat(0x3e4a5c, { roughness: 1 }), 0.007);
    partition(meeting, [-4.4, 3.7], [-0.3, 3.7]);
    partition(meeting, [0.75, 3.7], [1.4, 3.7]);
    partition(meeting, [1.4, 0], [1.4, 3.7]);
    block(meeting, 1.0, 2.4, 0.03, glass(0xdff3ff, 0.2), 0.37, 0.05, 4.02, 0.7);
    block(meeting, 0.03, 0.6, 0.06, C.metal, 0.05, 0.8, 4.28, 0.7);
    tv(room.decor(5), -1.3, 1.05, 0, 0, pool[2], 2.0, 1.15);
    cabinet(meeting, -1.3, 0.24, 0, 1.8, 0.55, 0.45, 0xd9d4ca, 2);
    table(meeting, -1.3, 2.0, 0, 1.2, 2.2, mat(0xefe9df), C.steel, 0.8);
    tube(meeting, 0.12, 0.14, 0.04, C.black, -1.3, 0.8, 2.0, 3);
    plantPot(meeting, -1.3, 2.85, 0.4, 'bush', 0.8, C.white);
    bottle(meeting, -1.55, 0.8, 1.6);
    bottle(meeting, -1.0, 0.8, 2.4);
    [[-2.35, 1.4, Math.PI / 2, 'type'], [-2.35, 2.5, Math.PI / 2, 'sit'], [-0.25, 1.4, -Math.PI / 2, null], [-0.25, 2.5, -Math.PI / 2, 'type']].forEach(([x, z, turn, pose], index) => {
      officeChair(meeting, x, z, turn + (pose ? 0 : (random() - 0.5) * 0.5), 0x1f2937);
      if (!pose) return;
      person(meeting, x, z, turn, { random, pose, shirt: SHIRTS[index] });
      const inward = Math.sign(-x - 1.3);
      if (pose === 'sit') notebook(meeting, x + inward * 0.55, 0.8, z, turn, 0xb5473a);
      else laptop(meeting, x + inward * 0.62, 0.8, z, turn + Math.PI, pool[index % pool.length]);
    });
    person(meeting, 0.45, 0.7, -0.7, { random, pose: 'gesture', shirt: 0x2f3542, lanyard: 0x3b82f6 });
    plantPot(meeting, -3.6, 2.7, 1.1, 'tall');

    /* Bookshelf and art outside the meeting room */
    bookshelf(room.frame(5), 3.6, 0.2, 0, 2.0, 2.0, random);
    plane(room.decor(5), 0.8, 1.06, mat(0xffffff, { map: T.poster('leaf') }), 3.6, 2.7, 0.03);
    block(room.decor(5), 0.88, 1.14, 0.03, C.woodDark, 3.6, 2.13, 0.0);

    /* Phone booth and print station along the top wall */
    phoneBooth(room.frame(4), 3.9, 0.7, 0, random);
    const print = node(room.frame(4), -4.0, 0, 0.32);
    cabinet(print, 0, 0, 0, 1.3, 0.72, 0.6, 0xd7dbe0, 2);
    block(print, 0.6, 0.34, 0.46, mat(0xe5e7eb), 0.15, 0.72, 0);
    block(print, 0.6, 0.06, 0.46, mat(0x4b5563), 0.15, 1.06, 0);
    block(print, 0.36, 0.02, 0.26, C.paper, 0.15, 0.95, 0.3);
    block(print, 0.25, 0.25, 0.3, C.cardboard, -0.42, 0.72, 0);
    trashBin(print, 0.95, 0.1);
    fireExtinguisher(room.decor(4), 2.3, 0.02, 0);
    outlet(room.decor(4), -2.6, 0.35, 0.005, 0);

    /* Open-plan desk pods */
    deskPod(content, 4.2, -2.8, 0, { random, screens: pool, monitors: 2, chair: 0x374151, divider: 0x7c9a8a }, [true, true, false, true, false, true], [SHIRTS[0], SHIRTS[5], 0, SHIRTS[8], 0, SHIRTS[3]], 3);
    deskPod(content, 4.0, 7.8, 0, { random, screens: pool, monitors: 1, chair: 0x374151, divider: 0x7c9a8a, top: mat(0xe7dccb) }, [true, false, true, true, true, false], [SHIRTS[7], 0, SHIRTS[2], SHIRTS[1], SHIRTS[6]], 3);
    deskPod(content, -3.6, 3.0, 0, { random, screens: pool, monitors: 2, chair: 0x4b5563, divider: 0xb48a6a }, [true, true, false, true], [SHIRTS[4], SHIRTS[2], 0, SHIRTS[5]]);
    person(content, 6.9, 5.9, -2.4, { random, pose: 'cup', shirt: 0xe8c26c, holding: hand => mug(hand, 0, -0.05, 0.02, 0x2f5d8a) });

    /* Communal hot-desk table */
    const commons = node(content, 0, 0, -6.2);
    table(commons, 0, 0, 0, 3.6, 1.2, mat(0xd8c3a5), C.dark, 0.78);
    [[-1.15, -1, true], [0, -1, false], [1.15, -1, true], [-1.15, 1, false], [0, 1, true], [1.15, 1, false]].forEach(([x, side, occupied]) => {
      const turn = side > 0 ? Math.PI : 0;
      officeChair(commons, x, side * 0.95, turn + (occupied ? 0 : 0.35), 0x6b7280);
      if (!occupied) return;
      person(commons, x, side * 0.95, turn, { random, pose: 'type', shirt: pick(random, SHIRTS) });
      laptop(commons, x, 0.78, side * 0.3, turn + Math.PI, pick(random, pool));
    });
    plantPot(commons, 0.6, 0, 0.35, 'bush', 0.78, C.white);
    mug(commons, -0.55, 0.78, 0.1, 0xd2413a);
    block(commons, 0.5, 0.05, 0.2, C.dark, -1.5, 0.78, 0);

    /* Lockers beside the lounge */
    const lockers = node(room.frame(2), 4.0, 0, 0.26);
    for (let index = 0; index < 4; index += 1) {
      block(lockers, 0.4, 1.3, 0.5, mat([0x8fb3d9, 0xf2c94c, 0x8fb3d9, 0xe5e7eb][index]), -0.6 + index * 0.4, 0, 0);
      block(lockers, 0.02, 0.12, 0.02, C.steel, -0.48 + index * 0.4, 0.75, 0.26);
      for (let slot = 0; slot < 3; slot += 1) block(lockers, 0.2, 0.012, 0.01, C.dark, -0.6 + index * 0.4, 1.05 + slot * 0.04, 0.251);
    }

    /* Lounge facing the window */
    const lounge = room.frame(2);
    rug(lounge, 0.3, 2.0, 0, 3.4, 2.6, 0xc9b79c, 0x8d6e53);
    sofa(lounge, 0.3, 0.6, 0, 0x4a6fa5, 2.4);
    person(lounge, 0.75, 0.68, 0, { random, pose: 'lounge', shirt: 0xf2f2ee, holding: hand => block(hand, 0.24, 0.02, 0.17, C.dark, 0, 0, 0.05) });
    table(lounge, 0.3, 1.9, 0, 1.2, 0.6, C.woodLight, C.woodDark, 0.42);
    for (let index = 0; index < 3; index += 1) block(lounge, 0.3, 0.012, 0.22, mat(pick(random, [0xd96c5f, 0x1f2937, 0xf2f2ee])), -0.05 + index * 0.05, 0.42 + index * 0.012, 1.95, 0.3 * index);
    mug(lounge, 0.65, 0.42, 1.85, 0xf2c94c);
    sofa(lounge, -1.6, 2.2, 1.73, 0xc0704d, 1.05, 0.9);
    floorLamp(lounge, 1.95, 0.4);
    plantPot(lounge, -1.9, 0.45, 1.1, 'tall');

    /* Odds and ends */
    coatRack(room.frame(0), 2.6, 0.45, [0x374151, 0x9a3412, 0x1e3a8a]);
    plantPot(room.frame(0), -5.0, 0.5, 1.05, 'tall');
    plantPot(room.frame(1), -4.6, 0.45, 0.95, 'snake');
    trashBin(content, 6.4, -5.2);
    trashBin(content, 1.4, 9.8);

    /* Someone strolling from the kitchen with a coffee */
    const walker = person(content, 0, 0, 0, { random, pose: 'cup', shirt: 0x6aa38b, holding: hand => mug(hand, 0, -0.05, 0.02, 0xf4f4f0) });
    walker.userData.live = true;
    const rig = walker.userData.rig, heading = Math.atan2(0.866, 0.5);
    tick(time => {
      const phase = time * 0.085, along = Math.sin(phase) * 6.6, stride = Math.sin(time * 5);
      walker.position.set(along * 0.866 - 0.9 * 0.5, 0, along * 0.5 + 0.9 * 0.866);
      walker.rotation.y = Math.cos(phase) >= 0 ? heading : heading + Math.PI;
      rig.legs[0].rotation.x = stride * 0.4;
      rig.legs[1].rotation.x = -stride * 0.4;
      rig.arms[0].rotation.x = stride * 0.3;
      rig.hips.position.y = 1.0 + Math.abs(Math.cos(time * 5)) * 0.025;
    });

    let lastSecond = -1;
    tick(() => {
      const second = Math.floor(Date.now() / 1000);
      if (second !== lastSecond) moonClock.redraw();
      lastSecond = second;
    });
  },
};
