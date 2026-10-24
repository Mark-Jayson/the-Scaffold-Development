import { C, mat, glass, screen, node, block, tube, plane, flat, rod, pick } from '../kit.js';
import { tiled } from '../room.js';
import * as T from '../textures.js';
import { person, officeChair, sofa, table, workstation, deskPod, laptop, mug, notebook, papers, stickies, cabinet, bookshelf, plantPot, rug, floorLamp, tv, trashBin, wallClock, whiteboardStand, waterCooler, coatRack, fireExtinguisher } from '../props.js';

const SHIRTS = [0x1e3a5f, 0xf5f5f4, 0x0f766e, 0xc2410c, 0x6d28d9, 0x334155, 0xbe185d, 0x0369a1, 0xa16207];

function hourglass(parent, x, y, z) {
  const group = node(parent, x, y, z), wood = C.woodDark, clear = glass(0xf5f5f4, 0.35), sand = mat(0xe0b26b);
  block(group, 0.14, 0.02, 0.14, wood, 0, 0, 0);
  block(group, 0.14, 0.02, 0.14, wood, 0, 0.3, 0);
  for (const [dx, dz] of [[-0.055, -0.055], [0.055, -0.055], [0.055, 0.055], [-0.055, 0.055]]) rod(group, [dx, 0.02, dz], [dx, 0.3, dz], 0.008, wood, 4);
  tube(group, 0.005, 0.05, 0.13, clear, 0, 0.02, 0, 10).rotation.x = Math.PI;
  tube(group, 0.05, 0.005, 0.13, clear, 0, 0.15, 0, 10).rotation.x = Math.PI;
  tube(group, 0.045, 0.01, 0.05, sand, 0, 0.022, 0, 10);
  tube(group, 0.005, 0.03, 0.04, sand, 0, 0.16, 0, 10);
}
function deskCalendar(parent, x, y, z, ry, face) {
  const group = node(parent, x, y, z, ry);
  for (const side of [-1, 1]) {
    const leaf = block(group, 0.22, 0.16, 0.004, C.paper, 0, 0, side * 0.035);
    leaf.rotation.x = side * 0.42;
  }
  const front = plane(group, 0.2, 0.13, face, 0, 0.08, 0.072);
  front.rotation.x = -0.42;
}

export default {
  id: 'planning',
  name: 'Life Planner',
  accent: 0x70c7d9,
  room: () => ({ floor: tiled(T.carpet('#3d5f70', '#44687b'), 2.4), wall: mat(0xf1eee8), glassSides: [0, 1, 2], glassFrom: 1.0 }),
  build({ content, room, random, tick }) {
    const pool = ['calendar', 'email', 'sheet', 'calendar', 'dashboard'].map(kind => screen(T.screens[kind]()));
    const paperCalendar = mat(0xffffff, { map: T.screens.calendar(), roughness: 0.9 });

    /* Giant month calendar across the upper-left wall */
    const wall = room.decor(5);
    block(wall, 7.25, 2.92, 0.05, mat(0xb8bec7, { metalness: 0.4 }), -0.4, 0.38, 0.02);
    plane(wall, 7.1, 2.78, mat(0xffffff, { map: T.calendarWall(new Date()), roughness: 0.6, emissive: 0xffffff, emissiveIntensity: 0.06 }), -0.4, 1.84, 0.05);
    block(wall, 6.4, 0.04, 0.14, mat(0xb8bec7), -0.4, 0.34, 0.09);
    for (const [dx, color] of [[-2.6, 0xdc2626], [-2.45, 0x2563eb], [-2.3, 0x16a34a]]) rod(wall, [dx, 0.39, 0.12], [dx + 0.11, 0.39, 0.12], 0.012, mat(color), 6);
    for (const [dx, color] of [[-1.9, 0xfde68a], [-1.7, 0xfbcfe8], [-1.5, 0xbfdbfe]]) block(wall, 0.12, 0.03, 0.12, mat(color), dx, 0.38, 0.12);
    const mainClock = T.clock('BASE TIME', 0);
    wallClock(wall, 4.75, 2.05, 0, 0, mainClock, 0.95);
    person(room.frame(5), -1.4, 0.75, Math.PI, { random, pose: 'write', shirt: SHIRTS[6], style: 'ponytail', holding: hand => block(hand, 0.08, 0.08, 0.01, mat(0xfde68a), 0, 0, 0.05) });
    person(room.frame(5), 0.9, 1.9, Math.PI + 0.2, { random, pose: 'crossed', shirt: SHIRTS[0], lanyard: 0x70c7d9 });
    cabinet(room.frame(5), -5.0, 0.3, 0, 0.9, 1.35, 0.6, 0x9ca3af, 4);
    plantPot(room.frame(5), -5.0, 0.3, 0.6, 'bush', 1.35, mat(0xf1f5f9));
    plantPot(room.frame(5), 4.6, 0.45, 1.1, 'tall');

    /* World clocks, credenza and timeline TV on the top wall */
    const clocks = [['MOON', 0], ['HOUSTON', -5], ['LONDON', 1], ['TOKYO', 9]].map(([label, offset], index) => {
      const texture = T.clock(label, offset);
      wallClock(room.decor(4), -5.55 + index * 0.95, 2.35, 0, 0, texture, 0.62);
      return texture;
    });
    const credenza = node(room.frame(4), -3.95, 0, 0.3);
    cabinet(credenza, 0, 0, 0, 3.6, 0.75, 0.55, 0xd6cfc4, 2);
    for (let index = 0; index < 7; index += 1) block(credenza, 0.07, 0.3, 0.26, mat(pick(random, [0x1e3a5f, 0xbe185d, 0x0f766e, 0xa16207])), -1.4 + index * 0.08, 0.75, 0);
    block(credenza, 0.55, 0.3, 0.42, mat(0xe5e7eb), 0.3, 0.75, 0);
    block(credenza, 0.3, 0.02, 0.2, C.paper, 0.3, 1.0, 0.18);
    plantPot(credenza, 1.35, 0, 0.5, 'fern', 0.75, C.white);
    tv(room.decor(4), 3.95, 1.05, 0, 0, screen(T.screens.gantt(), { emissiveIntensity: 0.75 }), 2.6, 1.46);
    cabinet(room.frame(4), 3.95, 0.25, 0, 2.2, 0.5, 0.45, 0x4b5563, 1);
    block(room.frame(4), 0.6, 0.06, 0.06, C.black, 3.95, 2.56, 0.04);
    coatRack(room.frame(4), 2.2, 0.55, [0x1e3a5f, 0x7c2d12]);

    /* Kanban and roadmap boards on the upper-right wall */
    const boards = room.decor(3);
    for (const [x, texture] of [[-3.95, T.kanban()], [3.95, T.roadmap()]]) {
      block(boards, 3.9, 2.0, 0.04, mat(0xb8bec7, { metalness: 0.3 }), x, 0.9, 0.02);
      plane(boards, 3.8, 1.9, mat(0xffffff, { map: texture, roughness: 0.4 }), x, 1.85, 0.045);
      block(boards, 3.2, 0.03, 0.1, mat(0xb8bec7), x, 0.88, 0.07);
    }
    person(room.frame(3), -3.5, 0.75, Math.PI, { random, pose: 'write', shirt: SHIRTS[2], holding: hand => block(hand, 0.08, 0.08, 0.01, mat(0xbbf7d0), 0, 0, 0.05) });
    person(room.frame(3), 4.3, 1.4, Math.PI - 0.3, { random, pose: 'point', shirt: SHIRTS[3] });
    person(room.frame(3), 3.2, 2.1, Math.PI + 0.15, { random, pose: 'cup', shirt: SHIRTS[7], holding: hand => mug(hand, 0, -0.05, 0.02, 0xf4f4f0) });
    fireExtinguisher(room.decor(4), -1.98, 0.03, 0);
    waterCooler(room.frame(5), 3.65, 0.3, 0);

    /* Planning table */
    const planner = node(content, 2.6, 0, 2.8, 0);
    rug(planner, 0, 0, 0, 7.2, 4.4, 0x2c4a5a, 0x22394a);
    table(planner, 0, 0, 0, 5.2, 2.3, mat(0xe9e2d6), C.dark, 0.8, true);
    const seats = [[-1.35, -1.25, 0, 'type'], [0, -1.3, 0, 'read'], [1.35, -1.25, 0, null], [-1.35, 1.25, Math.PI, 'sit'], [0, 1.3, Math.PI, 'type'], [1.35, 1.25, Math.PI, 'type'], [-2.9, 0, Math.PI / 2, null], [2.9, 0, -Math.PI / 2, 'sit']];
    seats.forEach(([x, z, turn, pose], index) => {
      officeChair(planner, x, z, turn + (pose ? 0 : 0.4), 0x1f2937);
      if (!pose) return;
      person(planner, x, z, turn, { random, pose, shirt: SHIRTS[index % SHIRTS.length], holding: pose === 'read' ? hand => block(hand, 0.22, 0.3, 0.004, C.paper, 0, 0, 0.05) : undefined });
      const reach = [Math.sin(turn) * 0.62, Math.cos(turn) * 0.62];
      if (pose === 'type') laptop(planner, x + reach[0], 0.8, z + reach[1], turn + Math.PI, pick(random, pool));
      else notebook(planner, x + reach[0], 0.8, z + reach[1], turn + 0.2, pick(random, [0x1e3a5f, 0xbe185d, 0x0f766e]));
    });
    for (const [x, z, turn] of [[-0.6, -0.2, 0.2], [0.7, 0.25, -0.4], [1.8, -0.3, 0.9]]) flat(planner, 0.3, 0.21, paperCalendar, x, 0.805, z, turn);
    papers(planner, -1.8, 0.81, 0.2, random, 3);
    stickies(planner, 0.1, 0.81, -0.55, 0, random, 1);
    for (const [x, z, color] of [[0.15, -0.5, 0xfde68a], [0.27, -0.48, 0xfbcfe8], [-0.4, 0.55, 0xbfdbfe]]) block(planner, 0.1, 0.03, 0.1, mat(color), x, 0.8, z);
    hourglass(planner, -0.2, 0.8, 0.15);
    deskCalendar(planner, 1.0, 0.8, -0.2, 0.3, mat(0xffffff, { map: T.sign(String(new Date().getDate()), '#ffffff', '#dc2626', 128, 96, 64) }));
    tube(planner, 0.1, 0.12, 0.05, C.black, 0.45, 0.8, -0.05, 3);
    tube(planner, 0.07, 0.06, 0.24, glass(0xdbeafe, 0.45), -1.0, 0.8, -0.1, 12);
    for (const [x, z] of [[-0.8, 0.1], [-1.15, -0.3]]) tube(planner, 0.035, 0.03, 0.1, glass(0xdbeafe, 0.45), x, 0.8, z, 8);
    mug(planner, 1.7, 0.8, 0.45, 0xbe185d);
    mug(planner, -2.2, 0.8, -0.25, 0xf4f4f0);
    person(planner, 3.45, -0.9, -1.2, { random, pose: 'gesture', shirt: SHIRTS[4], lanyard: 0x70c7d9 });

    /* Sprint huddle at a standing table */
    const huddle = node(content, -5.0, 0, 2.6);
    table(huddle, 0, 0, 0, 1.1, 1.1, mat(0xf8fafc), C.steel, 1.05, true);
    laptop(huddle, 0.1, 1.05, -0.05, 2.6, pool[0]);
    stickies(huddle, -0.25, 1.06, 0.2, 0, random, 1);
    for (const [x, z, color] of [[-0.3, 0.15, 0xfde68a], [-0.15, 0.25, 0xbbf7d0], [0.25, 0.3, 0xfbcfe8]]) block(huddle, 0.1, 0.03, 0.1, mat(color), x, 1.05, z);
    person(huddle, -0.85, 0.25, 1.85, { random, pose: 'cup', shirt: SHIRTS[5], holding: hand => mug(hand, 0, -0.05, 0.02, 0xf4f4f0) });
    person(huddle, 0.7, 0.6, -2.3, { random, pose: 'crossed', shirt: SHIRTS[8] });
    person(huddle, 0.2, -0.85, 0.2, { random, pose: 'phone', shirt: SHIRTS[1] });

    /* Weekly planner board on wheels */
    whiteboardStand(content, -3.6, -7.0, 0.55, mat(0xffffff, { map: T.kanban(), roughness: 0.35 }), 2.0, 1.15);
    person(content, -2.95, -6.1, -2.7, { random, pose: 'write', shirt: SHIRTS[0], holding: hand => rod(hand, [0, 0, 0], [0, 0, 0.12], 0.012, mat(0x2563eb), 6) });

    /* Scheduling pod and a focus table */
    deskPod(content, 4.2, -5.6, 0, { random, screens: pool, monitors: 2, chair: 0x1f2937, divider: 0x70a5b5, top: mat(0xe9e2d6), mess: 0.6 }, [true, false, true, true], [SHIRTS[5], 0, SHIRTS[8], SHIRTS[6]]);
    const focus = node(content, -6.4, 0, 6.6, -0.5);
    table(focus, 0, 0, 0, 2.2, 1.0, mat(0xe9e2d6), C.dark, 0.78);
    for (const [x, sheet] of [[-0.4, 0.1], [0.45, -0.2]]) flat(focus, 0.6, 0.42, paperCalendar, x, 0.785, sheet, sheet);
    for (const [x, side] of [[-0.5, -1], [0.5, 1]]) {
      officeChair(focus, x, side * 0.85, side > 0 ? Math.PI : 0, 0x334155);
      person(focus, x, side * 0.85, side > 0 ? Math.PI : 0, { random, pose: 'read', shirt: pick(random, SHIRTS), holding: hand => block(hand, 0.22, 0.3, 0.004, C.paper, 0, 0, 0.05) });
    }
    mug(focus, 0.9, 0.78, 0.2, 0x1e3a5f);
    plantPot(content, -7.3, 9.0, 1.0, 'tall');
    plantPot(content, 7.6, -1.6, 0.9, 'snake');

    /* Personal desks by the lower-left window */
    for (const [x, shirt] of [[2.6, SHIRTS[7]], [4.5, SHIRTS[3]]]) workstation(room.frame(0), x, 0.45, 0, { random, screens: pool, monitors: 2, shirt, mess: 0.6, top: mat(0xe9e2d6) });
    plantPot(room.frame(0), -1.0, 0.5, 1.0, 'tall');
    trashBin(room.frame(0), 1.4, 0.5);

    /* Reading nook and launch countdown near the lower-right window */
    const nook = room.frame(2);
    rug(nook, -0.8, 1.6, 0, 3.0, 2.4, 0xd6c6a8, 0x9a7b4f);
    sofa(nook, -1.8, 1.2, 0.5, 0xc2410c, 1.05, 0.9);
    sofa(nook, 0.4, 1.0, -0.5, 0x0f766e, 1.05, 0.9);
    person(nook, 0.4, 1.05, -0.5, { random, pose: 'lounge', shirt: SHIRTS[1], y: -0.02, holding: hand => block(hand, 0.22, 0.3, 0.004, C.paper, 0, 0, 0.05) });
    tube(nook, 0.3, 0.3, 0.04, C.woodLight, -0.7, 0.5, 2.0, 18);
    tube(nook, 0.04, 0.05, 0.5, C.dark, -0.7, 0, 2.0, 8);
    mug(nook, -0.6, 0.54, 2.0, 0x0f766e);
    floorLamp(nook, -2.6, 0.45);
    bookshelf(nook, 3.0, 0.2, 0, 1.6, 1.3, random, mat(0xd6cfc4));

    const countdownTexture = T.countdown(Date.now() + (12 * 24 + 4) * 3600000 + 22 * 60000);
    const kiosk = node(content, 7.4, 0, 6.1, Math.PI / 3);
    block(kiosk, 0.7, 0.04, 0.5, C.dark, 0, 0, 0);
    block(kiosk, 0.12, 1.1, 0.1, C.steel, 0, 0.04, 0);
    block(kiosk, 1.3, 0.62, 0.08, C.black, 0, 1.1, 0);
    plane(kiosk, 1.24, 0.56, screen(countdownTexture, { emissiveIntensity: 0.95 }), 0, 1.41, 0.041);

    let lastSecond = -1;
    tick(() => {
      const second = Math.floor(Date.now() / 1000);
      if (second === lastSecond) return;
      lastSecond = second;
      mainClock.redraw();
      clocks.forEach(texture => texture.redraw());
      countdownTexture.redraw();
    });
  },
};
