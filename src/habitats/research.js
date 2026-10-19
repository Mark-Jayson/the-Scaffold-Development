import * as THREE from 'three';
import { C, mat, glow, glass, screen, node, block, tube, ball, dome, plane, flat, disc, rod, cable, pick, range } from '../kit.js';
import { floorShape, tiled } from '../room.js';
import * as T from '../textures.js';
import { person, officeChair, stool, monitor, keyboard, laptop, mug, notebook, papers, rack, partition, plantPot, trashBin, fireExtinguisher, wallClock, deskLamp } from '../props.js';

const LIQUIDS = [0x60a5fa, 0xf472b6, 0x34d399, 0xfbbf24, 0xa78bfa, 0xf87171];
const coatOptions = random => ({ random, coat: true, gloves: 0x60a5fa, goggles: random() > 0.4, shirt: pick(random, [0x94a3b8, 0x334155, 0x0ea5e9]) });

function labBench(parent, x, z, ry, width, depth, random, shelf = false) {
  const group = node(parent, x, 0, z, ry), body = mat(0xf1f3f5), top = mat(0x22262c, { roughness: 0.35 });
  block(group, width, 0.86, depth, body, 0, 0, 0);
  for (let px = -width / 2 + 0.3; px < width / 2; px += 0.6) {
    for (const side of shelf ? [-1, 1] : [1]) {
      block(group, 0.55, 0.012, 0.01, mat(0xc6cbd2), px, 0.6, side * (depth / 2 + 0.002));
      block(group, 0.16, 0.025, 0.025, C.steel, px, 0.7, side * (depth / 2 + 0.015));
    }
  }
  block(group, width + 0.04, 0.05, depth + 0.04, top, 0, 0.86, 0);
  if (shelf) {
    for (const side of [-1, 1]) block(group, 0.04, 1.1, 0.04, C.steel, side * (width / 2 - 0.1), 0.91, 0);
    for (const y of [1.42, 1.9]) {
      block(group, width - 0.1, 0.03, 0.34, mat(0xd7dce2, { transparent: true, opacity: 0.85 }), 0, y, 0);
      for (let bx = -width / 2 + 0.25; bx < width / 2 - 0.2; bx += range(random, 0.14, 0.24)) reagent(group, bx, y + 0.03, range(random, -0.08, 0.08), random);
    }
  }
  return group;
}
function reagent(parent, x, y, z, random) {
  const amber = random() > 0.5, height = range(random, 0.14, 0.24);
  tube(parent, 0.045, 0.05, height, amber ? mat(0x92400e, { transparent: true, opacity: 0.85 }) : glass(0xe0f2fe, 0.5), x, y, z, 10);
  tube(parent, 0.024, 0.024, 0.04, mat(pick(random, [0x1f2937, 0xdc2626, 0x2563eb, 0xf8fafc])), x, y + height, z, 8);
  block(parent, 0.06, 0.05, 0.002, C.paper, x, y + height * 0.35, z + 0.05);
}
function beaker(parent, x, y, z, color, size = 1) {
  tube(parent, 0.06 * size, 0.06 * size, 0.15 * size, glass(0xeaf6ff, 0.35), x, y, z, 12);
  tube(parent, 0.055 * size, 0.055 * size, 0.08 * size, mat(color, { transparent: true, opacity: 0.75, emissive: color, emissiveIntensity: 0.15 }), x, y + 0.004, z, 12);
}
function flask(parent, x, y, z, color) {
  tube(parent, 0.025, 0.09, 0.15, glass(0xeaf6ff, 0.35), x, y, z, 12);
  tube(parent, 0.05, 0.085, 0.06, mat(color, { transparent: true, opacity: 0.75, emissive: color, emissiveIntensity: 0.15 }), x, y + 0.004, z, 12);
  tube(parent, 0.022, 0.022, 0.08, glass(0xeaf6ff, 0.35), x, y + 0.15, z, 8);
}
function tubeRack(parent, x, y, z, ry, random) {
  const group = node(parent, x, y, z, ry);
  block(group, 0.36, 0.08, 0.12, mat(0x93c5fd), 0, 0, 0);
  for (let index = 0; index < 6; index += 1) {
    tube(group, 0.014, 0.014, 0.16, glass(0xeaf6ff, 0.5), -0.15 + index * 0.06, 0.02, 0, 6);
    tube(group, 0.012, 0.012, 0.07, mat(pick(random, LIQUIDS), { transparent: true, opacity: 0.85 }), -0.15 + index * 0.06, 0.025, 0, 6);
  }
}
function microscope(parent, x, y, z, ry) {
  const group = node(parent, x, y, z, ry), body = mat(0xe8eaed), dark = C.dark;
  block(group, 0.24, 0.05, 0.3, body, 0, 0, 0);
  const arm = block(group, 0.07, 0.4, 0.08, body, 0, 0.05, -0.1);
  arm.rotation.x = 0.15;
  block(group, 0.18, 0.02, 0.16, dark, 0, 0.18, 0.02);
  rod(group, [0, 0.42, -0.06], [0, 0.26, 0.04], 0.03, dark, 8);
  for (const side of [-1, 1]) rod(group, [0, 0.43, -0.06], [side * 0.04, 0.52, 0.06], 0.018, dark, 6);
  return group;
}
function fumeHood(parent, x, z, random) {
  const group = node(parent, x, 0, z), body = mat(0xf1f3f5);
  block(group, 2.0, 0.86, 0.85, body, 0, 0, 0);
  block(group, 2.04, 0.05, 0.89, mat(0x22262c), 0, 0.86, 0);
  for (const side of [-1, 1]) block(group, 0.12, 1.55, 0.85, body, side * 0.94, 0.91, 0);
  block(group, 2.0, 0.55, 0.85, body, 0, 2.46, 0);
  block(group, 1.76, 1.55, 0.04, mat(0xd1d5db), 0, 0.91, -0.4);
  block(group, 1.76, 0.02, 0.5, glow(0xf8fafc, 1.2), 0, 2.44, -0.1);
  block(group, 1.78, 0.75, 0.025, glass(0xe0f2fe, 0.25), 0, 1.65, 0.4);
  block(group, 1.78, 0.04, 0.05, C.steel, 0, 1.64, 0.42);
  block(group, 0.3, 0.12, 0.02, glow(0x22c55e, 0.8), 0.7, 2.6, 0.43);
  tube(group, 0.18, 0.18, 0.5, C.metal, 0, 3.0, -0.1, 14);
  flask(group, -0.4, 0.91, -0.1, LIQUIDS[2]);
  beaker(group, 0.1, 0.91, 0.05, LIQUIDS[1]);
  tubeRack(group, 0.5, 0.91, -0.15, 0, random);
  block(group, 1.9, 0.01, 0.12, mat(0xfacc15), 0, 0.006 - 0.0, 0.62);
  return group;
}
function cryostat(parent, x, z, tick) {
  const group = node(parent, x, 0, z), frame = mat(0x9ca3af, { metalness: 0.6, roughness: 0.35 }), gold = mat(0xd4a64a, { metalness: 0.9, roughness: 0.25 }), copper = mat(0xc77b4a, { metalness: 0.85, roughness: 0.3 });
  disc(group, 1.15, mat(0x111827), 0, 0.01, 0, 6).rotation.z = Math.PI / 6;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) block(group, 0.08, 3.0, 0.08, frame, sx * 0.72, 0, sz * 0.72);
  block(group, 1.6, 0.1, 1.6, frame, 0, 2.95, 0);
  const tiers = [[2.75, 0.55], [2.35, 0.46], [1.95, 0.38], [1.6, 0.3], [1.28, 0.22]];
  tiers.forEach(([y, radius], index) => {
    tube(group, radius, radius, 0.06, gold, 0, y, 0, 24);
    if (index < tiers.length - 1) {
      for (let post = 0; post < 4; post += 1) {
        const angle = post * Math.PI / 2 + index * 0.3, next = tiers[index + 1];
        rod(group, [Math.sin(angle) * radius * 0.8, y, Math.cos(angle) * radius * 0.8], [Math.sin(angle) * next[1] * 0.8, next[0] + 0.06, Math.cos(angle) * next[1] * 0.8], 0.018, gold, 6);
      }
      for (let coil = 0; coil < 3; coil += 1) {
        const angle = coil * 2.1 + index;
        cable(group, [[Math.sin(angle) * radius * 0.5, y, Math.cos(angle) * radius * 0.5], [Math.sin(angle + 0.6) * radius * 0.65, y - 0.2, Math.cos(angle + 0.6) * radius * 0.65], [Math.sin(angle + 1.1) * tiers[index + 1][1] * 0.5, tiers[index + 1][0] + 0.06, Math.cos(angle + 1.1) * tiers[index + 1][1] * 0.5]], 0.012, copper);
      }
    }
  });
  tube(group, 0.08, 0.14, 0.4, gold, 0, 0.88, 0, 16);
  rod(group, [0, 2.95, 0], [0, 2.8, 0], 0.12, frame, 10);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod(group, [sx * 1.0, 0, sz * 1.0], [sx * 1.0, 0.9, sz * 1.0], 0.025, mat(0xfacc15), 6);
  for (const [from, to] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]]]) rod(group, [from[0], 0.9, from[1]], [to[0], 0.9, to[1]], 0.02, mat(0xfacc15), 6);
  const halo = node(group);
  halo.userData.live = true;
  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 8, 40), glow(0x60a5fa, 2.2));
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.y = 0.06;
  halo.add(glowRing);
  tick(time => {
    glowRing.material.emissiveIntensity = 1.6 + Math.sin(time * 2.4) * 0.8;
  });
  const sign = node(group, 0.9, 0, 1.05, 0.3);
  rod(sign, [0, 0, 0], [0, 1.15, 0], 0.025, C.dark, 6);
  plane(sign, 0.62, 0.3, screen(T.sign('QPU-1 · 12 mK', '#0b1220', '#7dd3fc', 256, 120, 34), { emissiveIntensity: 0.7 }), 0, 1.25, 0.03);
}

export default {
  id: 'research',
  name: 'Research',
  caption: 'Servers & wet lab',
  accent: 0xe985b5,
  room: () => ({ floor: tiled(T.epoxy(), 3), wall: mat(0xf4f6f8), glassSides: [0, 1, 2], glassFrom: 1.0 }),
  build({ content, room, random, tick }) {
    const pool = ['dashboard', 'terminal', 'code', 'sheet'].map(kind => screen(T.screens[kind]()));
    const leds = T.serverFront(), rackFace = screen(leds, { emissiveIntensity: 0.95 });

    /* Raised-floor server hall behind a glass partition */
    floorShape(content, [[-2.6, -11.4], [-6.58, -11.4], [-13.16, 0], [-6.58, 11.4], [-2.6, 11.4]], tiled(T.raisedFloor(), 1.2), 0.01);
    partition(content, [-2.6, -11.3], [-2.6, -0.75], 3.0, { frost: false, frame: mat(0x64748b, { metalness: 0.5 }) });
    partition(content, [-2.6, 0.75], [-2.6, 11.3], 3.0, { frost: false, frame: mat(0x64748b, { metalness: 0.5 }) });
    block(content, 0.08, 0.2, 1.5, mat(0x64748b), -2.6, 2.8, 0);
    plane(content, 1.3, 0.24, screen(T.sign('SERVER HALL · AUTHORIZED', '#111827', '#f472b6', 512, 96, 34), { emissiveIntensity: 0.6 }), -2.55, 3.2, 0, Math.PI / 2);
    for (const [rowX, count, height] of [[-10.0, 7, 2.9], [-6.2, 11, 2.6]]) {
      for (let index = 0; index < count; index += 1) rack(content, rowX, (index - (count - 1) / 2) * 1.0, Math.PI / 2, rackFace, random, height);
      const length = count * 1.0;
      for (const side of [-0.35, 0.35]) block(content, 0.06, 0.06, length, mat(0xfacc15), rowX + side, height + 0.32, 0);
      for (let rung = -length / 2; rung <= length / 2; rung += 0.5) block(content, 0.76, 0.04, 0.05, mat(0xfacc15), rowX, height + 0.3, rung);
      for (let post = -length / 2 + 0.5; post < length / 2; post += 2) rod(content, [rowX, height + 0.08, post], [rowX, height + 0.3, post], 0.03, C.steel, 6);
      for (let drop = 0; drop < count; drop += 2) cable(content, [[rowX - 0.2, height + 0.33, (drop - (count - 1) / 2)], [rowX - 0.3, height + 0.2, (drop - (count - 1) / 2) + 0.2], [rowX - 0.45, height - 0.05, (drop - (count - 1) / 2) + 0.25]], 0.02, mat(pick(random, [0x3b82f6, 0xf59e0b, 0x22c55e])));
    }
    for (const [frame, x] of [[room.frame(4), 1.0], [room.frame(5), -1.0]]) {
      const unit = node(frame, x, 0, 0.48);
      block(unit, 1.9, 2.2, 0.9, mat(0xe5e7eb), 0, 0, 0);
      for (let slat = 0; slat < 8; slat += 1) block(unit, 1.6, 0.03, 0.02, mat(0x9ca3af), 0, 1.0 + slat * 0.12, 0.46);
      block(unit, 0.36, 0.2, 0.02, screen(T.screens.dashboard(), { emissiveIntensity: 0.8 }), -0.6, 0.55, 0.46);
      block(unit, 1.6, 0.6, 0.02, mat(0xcbd5e1), 0, 0.15, 0.46);
    }
    for (const x of [-4.8, -4.2, -3.6]) {
      tube(content, 0.24, 0.24, 1.55, C.red, x, 0, -10.75, 16);
      ball(content, 0.24, C.red, x, 1.55, -10.75, 12, 6).scale.y = 0.5;
      block(content, 0.1, 0.12, 0.1, C.dark, x, 1.68, -10.75);
    }
    rod(content, [-4.8, 1.75, -10.75], [-3.6, 1.75, -10.75], 0.025, C.steel, 6);
    const noc = node(content, -4.1, 0, 8.0, -Math.PI / 2);
    block(noc, 1.6, 0.05, 0.75, mat(0x334155), 0, 0.78, 0);
    for (const side of [-1, 1]) block(noc, 0.05, 0.78, 0.65, C.dark, side * 0.75, 0, 0);
    monitor(noc, -0.38, 0.83, -0.15, 0.18, pool[0], 0.7, 0.42);
    monitor(noc, 0.38, 0.83, -0.15, -0.18, pool[1], 0.7, 0.42);
    keyboard(noc, 0, 0.83, 0.17);
    mug(noc, 0.6, 0.83, 0.15, 0x111827);
    officeChair(noc, 0, 0.8, Math.PI, 0x1f2937);
    person(noc, 0, 0.8, Math.PI, { random, pose: 'type', shirt: 0x334155, headset: true, lanyard: 0xe985b5 });
    person(content, -8.1, -1.2, -Math.PI / 2, { random, pose: 'cup', shirt: 0x0f172a, lanyard: 0xe985b5, holding: hand => block(hand, 0.2, 0.28, 0.015, C.dark, 0, -0.02, 0.06) });
    const crash = node(content, -4.6, 0, -3.0, -Math.PI / 2 - 0.2);
    block(crash, 0.7, 0.04, 0.5, C.steel, 0, 0.9, 0);
    block(crash, 0.7, 0.04, 0.5, C.steel, 0, 0.25, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      block(crash, 0.03, 0.9, 0.03, C.metal, sx * 0.33, 0.06, sz * 0.23);
      ball(crash, 0.04, C.black, sx * 0.33, 0.04, sz * 0.23, 6, 5);
    }
    monitor(crash, 0, 0.94, -0.1, 0, pool[1], 0.55, 0.34);
    keyboard(crash, 0, 0.94, 0.12);
    cable(crash, [[0, 0.95, -0.2], [0.1, 0.6, -0.4], [0.3, 0.3, -0.9], [0.0, 1.0, -1.4]], 0.015, mat(0x3b82f6));
    person(crash, 0, 0.62, Math.PI, { random, pose: 'work', shirt: 0x1e3a8a, lanyard: 0xe985b5 });

    /* Wet lab: fume hood, freezer and coat hooks on the top-right wall */
    fumeHood(room.frame(3), 3.0, 0.45, random);
    person(room.frame(3), 3.0, 1.3, Math.PI, { ...coatOptions(random), pose: 'work' });
    const freezer = node(room.frame(3), 4.95, 0, 0.45);
    block(freezer, 0.9, 1.95, 0.85, mat(0xf8fafc), 0, 0, 0);
    block(freezer, 0.03, 0.5, 0.04, C.steel, -0.38, 0.9, 0.44);
    block(freezer, 0.26, 0.1, 0.01, glow(0x38bdf8, 1.0), 0.15, 1.6, 0.43);
    block(freezer, 0.9, 0.12, 0.85, mat(0x9ca3af), 0, 0, 0);
    plane(room.decor(3), 1.0, 0.62, mat(0xffffff, { map: T.periodicTable() }), 4.95, 2.55, 0.03);
    for (let hook = 0; hook < 3; hook += 1) {
      block(room.decor(3), 0.04, 0.04, 0.1, C.steel, -2.35 + hook * 0.3, 1.9, 0.05);
      const coat = block(room.decor(3), 0.26, 0.9, 0.1, mat(0xf8fafc, { roughness: 0.9 }), -2.35 + hook * 0.3, 1.0, 0.1);
      coat.rotation.z = (hook - 1) * 0.05;
    }
    fireExtinguisher(room.decor(3), -2.1, 0.03, 0);
    flat(content, 2.2, 0.08, mat(0xfacc15), 3.0, 0.012, -9.85);

    /* Island bench with reagent shelving */
    const island = labBench(content, 4.2, -3.6, 0, 5.0, 1.5, random, true);
    microscope(island, -1.6, 0.91, -0.4, Math.PI);
    stool(island, -1.6, -1.15, 0.72);
    person(island, -1.6, -1.12, 0, { ...coatOptions(random), pose: 'stool', y: -0.06 });
    tubeRack(island, -0.6, 0.91, -0.45, 0.1, random);
    beaker(island, -0.1, 0.91, -0.5, LIQUIDS[0]);
    flask(island, 0.15, 0.91, -0.45, LIQUIDS[3]);
    tube(island, 0.2, 0.22, 0.24, mat(0xf8fafc), 1.1, 0.91, -0.4, 18);
    dome(island, 0.2, mat(0x60a5fa, { transparent: true, opacity: 0.6 }), 1.1, 1.15, -0.4);
    notebook(island, 0.5, 0.91, 0.45, 0.2, 0x1e3a8a);
    tubeRack(island, -0.3, 0.91, 0.45, -0.1, random);
    beaker(island, 0.95, 0.91, 0.45, LIQUIDS[4]);
    rod(island, [1.55, 0.91, 0.4], [1.55, 1.25, 0.4], 0.02, C.metal, 6);
    rod(island, [1.55, 1.25, 0.4], [1.55, 1.18, 0.25], 0.016, C.metal, 6);
    flat(island, 0.45, 0.35, C.metal, 1.55, 0.912, 0.35);
    person(island, 0.2, 1.15, Math.PI, { ...coatOptions(random), pose: 'work', holding: hand => rod(hand, [0, 0, 0], [0, 0.2, 0.02], 0.012, mat(0x60a5fa), 6) });
    person(island, 2.95, 0.3, -Math.PI / 2, { ...coatOptions(random), pose: 'cup', holding: hand => flask(hand, 0, -0.05, 0.02, LIQUIDS[1]) });
    trashBin(island, -2.85, 0.6, 0xfacc15);
    block(island, 0.2, 0.12, 0.02, mat(0xdc2626), -2.85, 0.32, 0.77);

    /* Quantum cryostat */
    cryostat(content, 6.2, -7.8, tick);
    person(content, 4.9, -6.6, 2.3, { ...coatOptions(random), pose: 'cup', coat: false, shirt: 0x312e81, holding: hand => block(hand, 0.2, 0.28, 0.015, C.dark, 0, -0.02, 0.06) });

    /* Perimeter bench under the window */
    const perimeter = labBench(room.frame(2), -1.25, 0.42, 0, 7.5, 0.75, random);
    const incubator = node(perimeter, -3.0, 0.91, -0.02);
    block(incubator, 0.75, 0.7, 0.62, mat(0xf8fafc), 0, 0, 0);
    block(incubator, 0.6, 0.55, 0.01, glass(0xffedd5, 0.4), 0, 0.08, 0.31);
    block(incubator, 0.56, 0.5, 0.02, glow(0xfb923c, 0.6), 0, 0.1, 0.0);
    const pcr = node(perimeter, -1.9, 0.91, 0);
    block(pcr, 0.45, 0.22, 0.45, mat(0xe5e7eb), 0, 0, 0);
    block(pcr, 0.45, 0.06, 0.4, mat(0x6366f1), 0, 0.22, -0.02);
    block(pcr, 0.15, 0.06, 0.01, glow(0x22c55e, 1), 0.1, 0.1, 0.226);
    microscope(perimeter, -0.9, 0.91, 0, 0);
    for (let index = 0; index < 5; index += 1) beaker(perimeter, -0.2 + index * 0.17, 0.91, (index % 2) * 0.12, LIQUIDS[index], 0.9);
    laptop(perimeter, 1.4, 0.91, 0.05, 0, pool[3]);
    tubeRack(perimeter, 2.4, 0.91, 0, 0, random);
    papers(perimeter, 3.0, 0.92, 0.05, random);
    for (const x of [3.6, 3.95, 4.3]) {
      tube(room.frame(2), 0.13, 0.13, 1.45, mat(pick(random, [0x2563eb, 0x16a34a, 0x9ca3af])), x, 0, 0.25, 14);
      ball(room.frame(2), 0.13, mat(0x9ca3af), x, 1.45, 0.25, 10, 6).scale.y = 0.6;
      tube(room.frame(2), 0.03, 0.03, 0.12, C.dark, x, 1.52, 0.25, 8);
    }
    rod(room.frame(2), [3.4, 1.1, 0.42], [4.5, 1.1, 0.42], 0.012, C.steel, 6);

    /* Instrument bench and analysis desks */
    const instrument = labBench(content, 3.0, 5.6, 0, 4.0, 1.3, random);
    const spec = node(instrument, -0.9, 0.91, -0.05);
    block(spec, 1.3, 0.75, 0.75, mat(0xf3f4f6), 0, 0, 0);
    block(spec, 0.4, 0.26, 0.02, screen(T.screens.dashboard(), { emissiveIntensity: 0.8 }), 0.35, 0.36, 0.38);
    block(spec, 1.3, 0.08, 0.75, mat(0x6366f1), 0, 0.75, 0);
    tube(spec, 0.2, 0.2, 0.1, mat(0xcbd5e1), -0.35, 0.83, 0, 18);
    for (let index = 0; index < 8; index += 1) tube(spec, 0.015, 0.015, 0.06, glass(0xbfdbfe, 0.7), -0.35 + Math.sin(index * 0.785) * 0.14, 0.93, Math.cos(index * 0.785) * 0.14, 6);
    laptop(instrument, 0.6, 0.91, 0.2, 0.2, pool[0]);
    deskLamp(instrument, 1.5, 0.91, -0.3, -0.5);
    person(instrument, 0.5, 1.05, Math.PI, { ...coatOptions(random), pose: 'work' });
    for (const x of [2.5, 5.0]) {
      const station = node(room.frame(0), -x, 0, 0.42);
      block(station, 1.5, 0.05, 0.75, mat(0xe5e7eb), 0, 0.78, 0);
      for (const side of [-1, 1]) block(station, 0.05, 0.78, 0.65, mat(0x94a3b8), side * 0.7, 0, 0);
      monitor(station, -0.3, 0.83, -0.12, 0.12, pick(random, pool), 0.62, 0.38);
      monitor(station, 0.32, 0.83, -0.12, -0.12, pick(random, pool), 0.62, 0.38);
      keyboard(station, 0, 0.83, 0.15);
      officeChair(station, 0, 0.8, Math.PI, 0x334155);
      person(station, 0, 0.8, Math.PI, { random, pose: 'type', shirt: pick(random, [0x0ea5e9, 0x334155, 0xe985b5]), lanyard: 0xe985b5 });
    }
    plantPot(room.frame(0), -7.0, 0.4, 0.9, 'snake');

    /* Automation bench: liquid-handling robot and biosafety cabinet */
    const automation = labBench(content, -1.0, 3.5, Math.PI / 2, 3.4, 1.0, random);
    const handler = node(automation, -0.75, 0.91, 0);
    block(handler, 1.3, 0.1, 0.8, mat(0x334155), 0, 0, 0);
    for (let column = 0; column < 4; column += 1) for (let row = 0; row < 2; row += 1) block(handler, 0.2, 0.03, 0.14, mat(pick(random, [0xf8fafc, 0x93c5fd, 0xfca5a5, 0xfde68a])), -0.45 + column * 0.3, 0.1, -0.15 + row * 0.3);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) block(handler, 0.04, 0.72, 0.04, C.metal, sx * 0.63, 0.1, sz * 0.38);
    block(handler, 1.3, 0.05, 0.8, mat(0x334155), 0, 0.82, 0);
    for (const sx of [-1, 1]) block(handler, 0.02, 0.7, 0.78, glass(0xe0f2fe, 0.18), sx * 0.64, 0.11, 0);
    block(handler, 1.26, 0.7, 0.02, glass(0xe0f2fe, 0.18), 0, 0.11, 0.39);
    block(handler, 0.3, 0.06, 0.01, glow(0x22c55e, 1), 0.4, 0.86, 0.401);
    const rail = node(handler);
    rail.userData.live = true;
    const carriage = node(rail, 0, 0.62, 0);
    block(carriage, 1.2, 0.05, 0.06, C.steel, 0, 0, 0);
    const head = node(carriage, 0, 0, 0);
    block(head, 0.12, 0.18, 0.12, mat(0xe2e8f0), 0, -0.12, 0);
    for (let tip = 0; tip < 4; tip += 1) rod(head, [-0.045 + tip * 0.03, -0.12, 0], [-0.045 + tip * 0.03, -0.3, 0], 0.006, mat(0xf8fafc), 4);
    tick(time => {
      carriage.position.z = Math.sin(time * 0.7) * 0.25;
      head.position.x = Math.sin(time * 1.3) * 0.45;
      head.position.y = Math.max(0, Math.sin(time * 2.6)) * -0.08;
    });
    const cabinetBSC = node(automation, 0.85, 0.91, -0.05);
    block(cabinetBSC, 1.3, 0.05, 0.75, mat(0xf1f3f5), 0, 0, 0);
    for (const side of [-1, 1]) block(cabinetBSC, 0.06, 0.95, 0.75, mat(0xf1f3f5), side * 0.62, 0, 0);
    block(cabinetBSC, 1.3, 0.35, 0.75, mat(0xf1f3f5), 0, 0.95, 0);
    block(cabinetBSC, 1.18, 0.95, 0.03, mat(0xcbd5e1), 0, 0.05, -0.36);
    block(cabinetBSC, 1.18, 0.02, 0.5, glow(0xc4b5fd, 1.4), 0, 0.93, -0.05);
    block(cabinetBSC, 1.18, 0.45, 0.02, glass(0xe9d5ff, 0.3), 0, 0.5, 0.37);
    beaker(cabinetBSC, -0.2, 0.05, -0.1, LIQUIDS[5]);
    tubeRack(cabinetBSC, 0.2, 0.05, -0.05, 0, random);
    stool(automation, 0.85, 0.95, 0.72);
    person(automation, 0.85, 0.92, Math.PI, { ...coatOptions(random), pose: 'stool', y: -0.06 });

    /* UPS cabinets behind the big racks */
    for (const [frame, x] of [[room.frame(4), -4.4], [room.frame(5), 4.4]]) {
      const ups = node(frame, x, 0, 0.45);
      block(ups, 1.2, 2.0, 0.85, mat(0x1f2937, { metalness: 0.3 }), 0, 0, 0);
      block(ups, 0.3, 0.18, 0.01, screen(T.sign('UPS 98%', '#052e16', '#4ade80', 256, 128, 52), { emissiveIntensity: 0.9 }), 0.25, 1.5, 0.43);
      for (let slot = 0; slot < 6; slot += 1) block(ups, 0.9, 0.02, 0.01, mat(0x374151), 0, 0.3 + slot * 0.15, 0.43);
    }

    /* Safety shower and eyewash by the lower door */
    const shower = node(room.frame(1), 3.6, 0, 0.3);
    rod(shower, [0, 0, 0], [0, 2.4, 0], 0.04, mat(0x16a34a), 8);
    rod(shower, [0, 2.4, 0], [0, 2.4, 0.4], 0.03, mat(0x16a34a), 8);
    tube(shower, 0.14, 0.04, 0.12, mat(0x16a34a), 0, 2.28, 0.42, 14);
    tube(shower, 0.16, 0.08, 0.08, mat(0xfacc15), 0, 1.0, 0.3, 14);
    rod(shower, [0, 1.6, 0.05], [0.25, 1.4, 0.3], 0.012, mat(0xfacc15), 4);
    flat(shower, 1.2, 1.2, mat(0x16a34a, { transparent: true, opacity: 0.35 }), 0, 0.012, 0.5);
    plane(room.decor(1), 0.5, 0.36, screen(T.sign('EYEWASH', '#15803d', '#ffffff', 256, 96, 34), { emissiveIntensity: 0.3 }), 3.6, 2.75, 0.03);
    const labClock = T.clock('LAB UTC', 0);
    wallClock(room.decor(4), -3.2, 2.35, 0, 0, labClock, 0.5);
    let lastSecond = -1, lastBlink = 0;
    tick(time => {
      const second = Math.floor(Date.now() / 1000);
      if (second !== lastSecond) labClock.redraw();
      lastSecond = second;
      if (time - lastBlink > 0.22) {
        leds.redraw();
        lastBlink = time;
      }
    });
  },
};
