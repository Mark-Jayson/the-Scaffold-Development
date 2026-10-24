import * as THREE from 'three';
import { C, mat, basic, glow, glass, screen, node, block, tube, ball, plane, flat, disc, rod, cable, pick, range } from '../kit.js';
import { tiled } from '../room.js';
import * as T from '../textures.js';
import { person, stool, laptop, mug, notebook, papers, deskLamp, plantPot, crate, trashBin, fireExtinguisher, wallClock } from '../props.js';

const SHIRTS = [0x1f2937, 0x374151, 0xf97316, 0x0ea5e9, 0x65a30d, 0xe5e7eb, 0x7c3aed, 0xb91c1c];
const CYAN = 0x5ee7ff;
const holo = (options = {}) => basic(CYAN, { transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, ...options });

function pegboard(decor, from, to, random) {
  const texture = T.pegboard();
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set((to - from) / 1.6, 1.8 / 1.6);
  plane(decor, to - from, 1.8, mat(0xffffff, { map: texture, roughness: 0.9 }), (from + to) / 2, 2.0, 0.02);
  block(decor, to - from + 0.08, 0.06, 0.06, C.woodDark, (from + to) / 2, 1.07, 0.03);
  block(decor, to - from + 0.08, 0.06, 0.06, C.woodDark, (from + to) / 2, 2.9, 0.03);
  const tools = [
    group => { rod(group, [0, -0.25, 0], [0, 0.1, 0], 0.02, C.woodLight, 6); block(group, 0.16, 0.06, 0.05, C.steel, 0, 0.08, 0); },
    group => { rod(group, [0, -0.2, 0], [0, -0.04, 0], 0.025, mat(pick(random, [0xdc2626, 0xfacc15, 0x2563eb])), 6); rod(group, [0, -0.04, 0], [0, 0.12, 0], 0.008, C.steel, 4); },
    group => { block(group, 0.04, 0.3, 0.015, C.steel, 0, -0.2, 0); tube(group, 0.04, 0.04, 0.015, C.steel, 0, 0.1, 0, 8).rotation.x = Math.PI / 2; },
    group => { rod(group, [-0.03, -0.2, 0], [0.01, 0.05, 0], 0.012, mat(0xdc2626), 4); rod(group, [0.03, -0.2, 0], [-0.01, 0.05, 0], 0.012, mat(0xdc2626), 4); },
    group => { tube(group, 0.06, 0.06, 0.05, mat(0xfacc15), 0, -0.05, 0, 12).rotation.x = Math.PI / 2; },
    group => { for (let spool = 0; spool < 3; spool += 1) tube(group, 0.025, 0.025, 0.06, mat(pick(random, [0xec4899, 0x22c55e, 0x3b82f6, 0xf97316, 0xfacc15])), -0.06 + spool * 0.06, -0.08, 0, 8); },
  ];
  for (let x = from + 0.25; x < to - 0.15; x += range(random, 0.22, 0.34)) {
    const y = range(random, 1.45, 2.65), holder = node(decor, x, y, 0.06);
    block(holder, 0.015, 0.015, 0.05, C.steel, 0, 0.12, -0.02);
    pick(random, tools)(holder);
  }
}

function printer(parent, x, y, z, random, tick, animated) {
  const group = node(parent, x, y, z), frame = C.black, filament = pick(random, [0xf97316, 0x22c55e, 0x3b82f6, 0xec4899, 0xfacc15]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) block(group, 0.03, 0.55, 0.03, frame, sx * 0.24, 0, sz * 0.22);
  block(group, 0.52, 0.04, 0.48, frame, 0, 0.55, 0);
  block(group, 0.52, 0.05, 0.48, frame, 0, 0, 0);
  block(group, 0.4, 0.015, 0.36, mat(0x111827, { roughness: 0.3 }), 0, 0.12, 0);
  tube(group, 0.05, 0.08, 0.12, mat(filament, { flatShading: true }), 0, 0.135, 0, 6);
  const spool = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.045, 8, 18), mat(filament));
  spool.position.set(0.3, 0.45, 0);
  spool.rotation.y = Math.PI / 2;
  group.add(spool);
  block(group, 0.12, 0.08, 0.02, glow(0x60a5fa, 0.9), 0.15, 0.04, 0.245);
  const rig = node(group);
  rig.userData.live = true;
  const gantry = node(rig, 0, 0.32, 0);
  block(gantry, 0.48, 0.03, 0.03, C.steel, 0, 0, 0);
  const nozzle = node(gantry, 0, 0, 0);
  block(nozzle, 0.07, 0.08, 0.07, mat(0x374151), 0, -0.06, 0);
  tube(nozzle, 0.006, 0.02, 0.03, mat(0xfbbf24), 0, -0.09, 0, 6);
  if (animated) tick(time => {
    nozzle.position.x = Math.sin(time * 3.1 + x) * 0.14;
    gantry.position.z = Math.cos(time * 1.7 + x) * 0.12;
  });
}

function robotArm(parent, x, z, ry, tick) {
  const group = node(parent, x, 0, z, ry), orange = mat(0xf97316, { roughness: 0.45, metalness: 0.2 }), joint = mat(0x374151, { metalness: 0.4 });
  tube(group, 0.42, 0.48, 0.5, mat(0x4b5563), 0, 0, 0, 16);
  for (const [tx, tz, w, d] of [[0, -1.2, 2.52, 0.12], [0, 1.2, 2.52, 0.12], [-1.2, 0, 0.12, 2.52], [1.2, 0, 0.12, 2.52]]) flat(group, w, d, mat(0xfacc15), tx, 0.012, tz);
  const live = node(group, 0, 0.5, 0);
  live.userData.live = true;
  const base = node(live);
  tube(base, 0.3, 0.34, 0.3, orange, 0, 0, 0, 16);
  const shoulder = node(base, 0, 0.42, 0);
  ball(shoulder, 0.17, joint, 0, 0, 0, 12, 9);
  block(shoulder, 0.22, 1.0, 0.24, orange, 0, 0, 0);
  const elbow = node(shoulder, 0, 1.0, 0);
  ball(elbow, 0.14, joint, 0, 0, 0, 12, 9);
  block(elbow, 0.18, 0.85, 0.2, orange, 0, 0, 0);
  const wrist = node(elbow, 0, 0.85, 0);
  ball(wrist, 0.1, joint, 0, 0, 0, 10, 8);
  block(wrist, 0.18, 0.08, 0.12, C.steel, 0, 0.06, 0);
  for (const side of [-1, 1]) block(wrist, 0.03, 0.16, 0.08, C.steel, side * 0.07, 0.12, 0);
  tick(time => {
    base.rotation.y = Math.sin(time * 0.45) * 1.1;
    shoulder.rotation.x = -0.35 + Math.sin(time * 0.7) * 0.25;
    elbow.rotation.x = 1.15 + Math.sin(time * 0.9 + 1) * 0.35;
    wrist.rotation.x = 0.6 + Math.sin(time * 1.3) * 0.4;
  });
}

function exosuit(parent, x, z, ry) {
  const group = node(parent, x, 0, z, ry), metal = mat(0x4b5563, { metalness: 0.6, roughness: 0.35 });
  tube(group, 0.85, 0.9, 0.14, C.dark, 0, 0, 0, 32);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.025, 6, 40), glow(CYAN, 1.6));
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.15;
  group.add(halo);
  for (const side of [-1, 1]) block(group, 0.12, 2.75, 0.12, metal, side * 0.7, 0, -0.55);
  block(group, 1.52, 0.12, 0.14, metal, 0, 2.7, -0.55);
  for (const side of [-1, 1]) rod(group, [side * 0.35, 2.7, -0.5], [side * 0.3, 1.78, -0.05], 0.025, metal, 6);
  person(group, 0, 0, 0, { random: Math.random, pose: 'stand', shirt: 0x9b1c1c, pants: 0x9b1c1c, skin: 0xc8a13a, shoes: 0x7f1d1d, gloves: 0xc8a13a, style: 'bald', glasses: false, sleeves: 'long', y: 0.14 });
  disc(group, 0.07, glow(0xbaf6ff, 2.5), 0, 1.5, 0.15, 18).rotation.x = 0;
  for (const side of [-1, 1]) {
    block(group, 0.05, 0.015, 0.01, glow(0xbaf6ff, 2.5), side * 0.055, 1.98, 0.15);
    const pad = ball(group, 0.12, mat(0xc8a13a, { metalness: 0.7, roughness: 0.3 }), side * 0.28, 1.68, 0, 10, 8);
    pad.scale.y = 0.7;
  }
  plane(group, 0.5, 0.16, screen(T.sign('EXO MK-07', '#0b1220', '#5ee7ff', 256, 80, 34), { emissiveIntensity: 0.7 }), 0, 0.07, 0.91).rotation.x = -0.6;
}

function starkDesk(parent, tick, random) {
  const desk = node(parent, -0.6, 0, 0.4, 0.75), dark = mat(0x111827, { metalness: 0.6, roughness: 0.3 }), grid = T.starkGrid();
  for (const side of [-1, 1]) {
    block(desk, 0.7, 0.84, 1.7, dark, side * 1.45, 0, 0);
    block(desk, 0.02, 0.6, 1.4, glow(CYAN, 1.4), side * 1.1, 0.1, 0);
  }
  block(desk, 4.2, 0.07, 2.1, mat(0x0b1626, { metalness: 0.4, roughness: 0.15 }), 0, 0.84, 0);
  const top = plane(desk, 4.1, 2.0, mat(0xffffff, { map: grid, emissive: 0xffffff, emissiveMap: grid, emissiveIntensity: 0.95, roughness: 0.12, metalness: 0.3 }), 0, 0.912, 0);
  top.rotation.x = -Math.PI / 2;
  for (const [w, d, x, z] of [[4.2, 0.03, 0, 1.06], [4.2, 0.03, 0, -1.06], [0.03, 2.1, 2.11, 0], [0.03, 2.1, -2.11, 0]]) block(desk, w, 0.03, d, glow(CYAN, 2), x, 0.85, z);
  const projector = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 8, 32), glow(CYAN, 2.2));
  projector.rotation.x = Math.PI / 2;
  projector.position.y = 0.93;
  desk.add(projector);
  tube(desk, 0.28, 0.3, 0.03, mat(0x0f172a), 0, 0.91, 0, 28);
  laptop(desk, 1.45, 0.91, 0.55, -0.5, screen(T.screens.code()), mat(0x1f2937));
  mug(desk, -1.6, 0.91, 0.65, 0xb91c1c);
  const helper = node(desk, -1.7, 0.91, -0.6, 0.6);
  tube(helper, 0.12, 0.14, 0.08, mat(0x374151), 0, 0, 0, 12);
  rod(helper, [0, 0.08, 0], [0.05, 0.45, 0.05], 0.03, mat(0x9ca3af), 6);
  rod(helper, [0.05, 0.45, 0.05], [0.25, 0.4, 0.2], 0.025, mat(0x9ca3af), 6);
  block(helper, 0.06, 0.06, 0.1, C.dark, 0.27, 0.36, 0.22);

  const hologram = node(desk, 0, 0, 0);
  hologram.userData.live = true;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.32, 1.6, 40, 1, true), holo({ opacity: 0.09 }));
  beam.position.y = 0.93 + 0.8;
  hologram.add(beam);
  const core = node(hologram, 0, 2.35, 0);
  const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 2), holo({ wireframe: true, opacity: 0.75 }));
  core.add(globe);
  const rings = [0.85, 1.0, 1.15].map((radius, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.016, 6, 64), holo({ opacity: 0.85 }));
    ring.rotation.set(index * 0.9, index * 0.5, 0);
    core.add(ring);
    return ring;
  });
  const scan = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.01, 4, 48), holo({ opacity: 0.9 }));
  scan.rotation.x = Math.PI / 2;
  hologram.add(scan);
  const panels = [[-2.05, 2.3, -0.45, 0.55], [2.05, 2.35, -0.45, -0.55], [-1.05, 3.15, -0.95, 0.25], [1.1, 3.1, -0.95, -0.25]].map(([x, y, z, turn], index) => {
    const panel = plane(hologram, 1.15, 1.15, holo({ map: T.holoPanel(index), opacity: 0.9 }), x, y, z, turn);
    panel.userData.base = y;
    return panel;
  });
  const board = plane(hologram, 3.6, 1.8, holo({ map: T.holoBoard(), opacity: 0.85 }), 0, 2.45, -1.45);
  board.renderOrder = 2;
  const sparkCount = 50, sparks = new Float32Array(sparkCount * 3);
  for (let index = 0; index < sparkCount; index += 1) sparks.set([range(random, -0.9, 0.9), range(random, 1, 3.2), range(random, -0.9, 0.9)], index * 3);
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparks, 3));
  hologram.add(new THREE.Points(sparkGeometry, new THREE.PointsMaterial({ color: CYAN, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })));
  tick((time, delta) => {
    globe.rotation.y = time * 0.5;
    rings.forEach((ring, index) => {
      ring.rotation.x += delta * (0.4 + index * 0.25);
      ring.rotation.y += delta * (0.3 - index * 0.15);
    });
    scan.position.y = 1.0 + ((time * 0.45) % 1) * 1.6;
    scan.scale.setScalar(0.55 + ((time * 0.45) % 1) * 1.5);
    panels.forEach((panel, index) => {
      panel.position.y = panel.userData.base + Math.sin(time * 1.1 + index) * 0.05;
      panel.material.opacity = 0.75 + Math.sin(time * 7 + index * 3) * 0.08;
    });
    for (let index = 0; index < sparkCount; index += 1) {
      let y = sparks[index * 3 + 1] + delta * 0.5;
      if (y > 3.3) y = 1;
      sparks[index * 3 + 1] = y;
    }
    sparkGeometry.attributes.position.needsUpdate = true;
  });
  person(desk, 0.25, 1.5, Math.PI, { random, pose: 'gesture', shirt: 0x111827, style: 'short', glasses: false });
  stool(desk, -1.9, 1.55, 0.72);
  person(desk, -1.9, 1.55, Math.PI + 0.5, { random, pose: 'read', shirt: 0x6b7280, y: 0.2, holding: hand => block(hand, 0.24, 0.02, 0.17, C.dark, 0, 0, 0.05) });
  return desk;
}

export default {
  id: 'maker',
  name: 'Idea Space',
  accent: 0xe8c26c,
  room: () => ({ floor: tiled(T.rubber('#4a505a'), 2.5), wall: mat(0x767d8a, { roughness: 0.9 }), glassSides: [0, 1, 2], glassFrom: 1.0, mullion: mat(0x3b414c) }),
  build({ content, room, random, tick }) {
    const pool = ['code', 'design', 'terminal'].map(kind => screen(T.screens[kind]()));
    starkDesk(content, tick, random);

    /* Craft bench with pegboard on the upper-left wall */
    const craft = node(room.frame(5), -1.4, 0, 0.45);
    block(craft, 7.2, 0.86, 0.85, mat(0x6b7280), 0, 0, 0);
    block(craft, 7.3, 0.08, 0.9, mat(0xc79a62), 0, 0.86, 0);
    for (let drawer = -3.3; drawer < 3.5; drawer += 0.6) block(craft, 0.5, 0.02, 0.01, mat(0x9ca3af), drawer, 0.7, 0.43);
    const matTexture = T.cuttingMat();
    for (const x of [-2.4, 0.3]) flat(craft, 1.1, 0.68, mat(0xffffff, { map: matTexture, roughness: 0.8 }), x, 0.942, 0.02);
    const sewing = node(craft, -3.2, 0.94, 0);
    block(sewing, 0.5, 0.12, 0.25, mat(0xf3f4f6), 0, 0, 0);
    block(sewing, 0.1, 0.3, 0.2, mat(0xf3f4f6), 0.18, 0.12, 0);
    block(sewing, 0.4, 0.1, 0.2, mat(0xf3f4f6), 0, 0.38, 0);
    rod(sewing, [-0.15, 0.38, 0.05], [-0.15, 0.17, 0.05], 0.01, C.steel, 4);
    for (const [x, color] of [[-1.2, 0xec4899], [-1.05, 0x3b82f6], [-0.9, 0xfacc15]]) ball(craft, 0.07, mat(color, { roughness: 1 }), x, 1.0, -0.2, 10, 8);
    for (let jar = 0; jar < 5; jar += 1) {
      tube(craft, 0.04, 0.04, 0.09, glass(0xf8fafc, 0.5), 1.2 + jar * 0.12, 0.94, -0.25, 10);
      tube(craft, 0.036, 0.036, 0.05, mat([0xef4444, 0x3b82f6, 0xfacc15, 0x22c55e, 0xa855f7][jar]), 1.2 + jar * 0.12, 0.945, -0.25, 10);
    }
    tube(craft, 0.05, 0.05, 0.14, mat(0x6b7280), 2.0, 0.94, -0.2, 10);
    for (let brush = 0; brush < 4; brush += 1) rod(craft, [2.0 + (brush - 1.5) * 0.02, 1.0, -0.2], [2.0 + (brush - 1.5) * 0.05, 1.22, -0.2 + brush * 0.01], 0.008, C.woodLight, 4);
    for (const [x, color] of [[2.6, 0x0ea5e9], [2.85, 0xf97316], [3.1, 0x84cc16]]) tube(craft, 0.07, 0.07, 0.6, mat(color, { roughness: 1 }), x, 0.94, 0.1, 12).rotation.x = Math.PI / 2;
    const tape = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.02, 6, 14), mat(0xd6c39a));
    tape.position.set(-0.4, 0.96, 0.25);
    tape.rotation.x = Math.PI / 2;
    craft.add(tape);
    rod(craft, [0.5, 0.96, 0.05], [0.8, 0.96, 0.22], 0.012, mat(0xdc2626), 6);
    notebook(craft, -1.6, 0.94, 0.15, 0.3, 0xf59e0b);
    papers(craft, 0.0, 0.95, -0.05, random, 3);
    deskLamp(craft, -0.6, 0.94, -0.25, 0.5, 0x0f766e);
    stool(craft, -2.2, 1.3, 0.72);
    person(craft, -2.2, 1.28, Math.PI, { random, pose: 'stool', shirt: 0xf59e0b, apron: 0x1e3a8a, y: -0.06, style: 'bun' });
    pegboard(room.decor(5), -5.0, 2.3, random);

    /* 3D printing shelf and tool chest on the top wall */
    const printShelf = node(room.frame(4), -3.75, 0, 0.36);
    for (const side of [-1, 1]) block(printShelf, 0.05, 1.75, 0.7, C.steel, side * 1.3, 0, 0);
    for (const y of [0.05, 0.85, 1.65]) block(printShelf, 2.65, 0.04, 0.7, mat(0x9ca3af), 0, y, 0);
    printer(printShelf, -0.75, 0.89, 0, random, tick, true);
    printer(printShelf, 0.15, 0.89, 0, random, tick, false);
    printer(printShelf, -0.3, 0.09, 0.02, random, tick, true);
    for (let spool = 0; spool < 4; spool += 1) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.05, 8, 16), mat(pick(random, [0xf97316, 0x22c55e, 0x3b82f6, 0xec4899, 0xfacc15, 0xffffff])));
      coil.position.set(0.55 + spool * 0.17, 0.24, 0.1);
      coil.rotation.y = 0.3;
      printShelf.add(coil);
    }
    person(room.frame(4), -3.3, 1.25, Math.PI + 0.2, { random, pose: 'cup', shirt: SHIRTS[3], holding: hand => tube(hand, 0.05, 0.07, 0.1, mat(0x22c55e, { flatShading: true }), 0, -0.04, 0.03, 6) });
    const chest = node(room.frame(4), 2.9, 0, 0.36);
    block(chest, 1.1, 0.95, 0.6, mat(0xb91c1c, { metalness: 0.3, roughness: 0.4 }), 0, 0.08, 0);
    block(chest, 1.0, 0.6, 0.5, mat(0xb91c1c, { metalness: 0.3, roughness: 0.4 }), 0, 1.07, -0.04);
    for (let drawer = 0; drawer < 9; drawer += 1) {
      const y = drawer < 5 ? 0.18 + drawer * 0.17 : 1.12 + (drawer - 5) * 0.13;
      block(chest, 0.9, 0.012, 0.01, C.dark, 0, y + 0.07, drawer < 5 ? 0.301 : 0.211);
      block(chest, 0.4, 0.025, 0.03, C.steel, 0, y, drawer < 5 ? 0.31 : 0.22);
    }
    for (const side of [-1, 1]) for (const end of [-1, 1]) ball(chest, 0.04, C.black, side * 0.45, 0.04, end * 0.22, 6, 5);
    pegboard(room.decor(4), 1.95, 5.9, random);
    const press = node(room.frame(4), 4.85, 0, 0.4);
    block(press, 0.5, 0.06, 0.45, mat(0x1f2937), 0, 0, 0);
    rod(press, [0, 0.06, -0.12], [0, 1.65, -0.12], 0.045, C.steel, 10);
    block(press, 0.35, 0.03, 0.3, mat(0x1f2937), 0, 0.85, 0.02);
    block(press, 0.32, 0.32, 0.45, mat(0x0f766e), 0, 1.45, -0.02);
    rod(press, [0, 1.45, 0.08], [0, 1.25, 0.08], 0.03, C.steel, 8);
    for (const angle of [0, 2.1, 4.2]) rod(press, [0.17, 1.6, 0.0], [0.17 + Math.cos(angle) * 0.02, 1.6 + Math.sin(angle) * 0.2, Math.sin(angle) * 0.2], 0.01, C.steel, 4);
    fireExtinguisher(room.decor(4), -2.2, 0.03, 0);

    /* Electronics bench and parts storage on the upper-right wall */
    const solder = node(room.frame(3), -4.0, 0, 0.42);
    block(solder, 3.2, 0.86, 0.8, mat(0x4b5563), 0, 0, 0);
    block(solder, 3.26, 0.05, 0.84, mat(0x2563eb, { roughness: 0.6 }), 0, 0.86, 0);
    const scope = node(solder, -1.0, 0.91, -0.1);
    block(scope, 0.45, 0.3, 0.32, mat(0xe5e7eb), 0, 0, 0);
    plane(scope, 0.24, 0.18, screen(T.screens.terminal(), { emissiveIntensity: 0.9 }), -0.08, 0.16, 0.161);
    for (let knob = 0; knob < 3; knob += 1) ball(scope, 0.02, C.dark, 0.12, 0.08 + knob * 0.07, 0.165, 6, 4);
    const station = node(solder, -0.3, 0.91, -0.15);
    block(station, 0.22, 0.12, 0.18, mat(0x0f172a), 0, 0, 0);
    block(station, 0.1, 0.04, 0.01, glow(0xef4444, 1.2), 0, 0.05, 0.091);
    rod(station, [0.15, 0.02, 0], [0.25, 0.15, 0.1], 0.012, C.steel, 4);
    block(solder, 0.28, 0.015, 0.2, mat(0x15803d), 0.2, 0.91, 0.12);
    for (let chip = 0; chip < 5; chip += 1) block(solder, 0.03, 0.01, 0.04, C.black, 0.12 + chip * 0.04, 0.925, 0.1);
    const hands = node(solder, 0.25, 0.91, -0.05);
    block(hands, 0.14, 0.02, 0.1, C.dark, 0, 0, 0);
    for (const side of [-1, 1]) rod(hands, [0, 0.02, 0], [side * 0.12, 0.2, 0.08], 0.008, C.steel, 4);
    tube(hands, 0.06, 0.06, 0.01, glass(0xe0f2fe, 0.5), 0, 0.24, 0.05, 14).rotation.x = 1.2;
    block(solder, 0.1, 0.18, 0.04, mat(0xfacc15), 0.75, 0.91, 0.1);
    const extractor = node(solder, 0.65, 0.91, -0.2, -0.4);
    block(extractor, 0.24, 0.24, 0.12, C.dark, 0, 0, 0);
    tube(extractor, 0.09, 0.09, 0.005, mat(0x6b7280), 0, 0.12, 0.061, 14).rotation.x = Math.PI / 2;
    const drawers = node(solder, 1.15, 0.91, -0.18);
    block(drawers, 0.55, 0.45, 0.3, mat(0xd1d5db), 0, 0, 0);
    for (let row = 0; row < 5; row += 1) for (let column = 0; column < 4; column += 1) block(drawers, 0.11, 0.07, 0.01, glass(pick(random, [0xbfdbfe, 0xfde68a, 0xfecaca, 0xbbf7d0]), 0.85), -0.19 + column * 0.127, 0.03 + row * 0.085, 0.151);
    deskLamp(solder, -1.4, 0.91, -0.2, 0.7, 0x111827);
    laptop(solder, 1.35, 0.91, 0.2, -0.3, pick(random, pool));
    stool(solder, -0.1, 0.95, 0.72);
    person(solder, -0.1, 0.92, Math.PI, { random, pose: 'stool', shirt: SHIRTS[7], goggles: true, glasses: false, y: -0.06, holding: hand => rod(hand, [0, 0, 0], [0, -0.05, 0.18], 0.01, mat(0x1f2937), 4) });
    const binsDecor = room.decor(3);
    block(binsDecor, 2.6, 0.9, 0.18, mat(0x9ca3af), -4.0, 1.7, 0.09);
    for (let row = 0; row < 4; row += 1) for (let column = 0; column < 10; column += 1) block(binsDecor, 0.22, 0.18, 0.02, mat(pick(random, [0xef4444, 0x3b82f6, 0xfacc15, 0x22c55e, 0xf8fafc])), -5.15 + column * 0.255, 1.74 + row * 0.215, 0.185);
    const storage = node(room.frame(3), 4.0, 0, 0.32);
    for (const side of [-1, 1]) block(storage, 0.05, 2.2, 0.55, C.steel, side * 1.1, 0, 0);
    for (let shelf = 0; shelf < 4; shelf += 1) {
      const y = 0.08 + shelf * 0.55;
      block(storage, 2.2, 0.04, 0.55, mat(0x9ca3af), 0, y, 0);
      for (let bin = 0; bin < 4; bin += 1) {
        const color = pick(random, [0xef4444, 0x2563eb, 0xfacc15, 0x16a34a, 0x111827]);
        block(storage, 0.46, 0.32, 0.48, mat(color, { roughness: 0.6 }), -0.78 + bin * 0.52, y + 0.04, 0);
        block(storage, 0.2, 0.06, 0.005, C.paper, -0.78 + bin * 0.52, y + 0.2, 0.243);
      }
    }
    const shopClock = T.clock('SHOP', 0);
    wallClock(room.decor(3), 2.35, 2.75, 0, 0, shopClock, 0.42);

    /* Laser cutter and industrial arm by the window */
    const laser = node(room.frame(2), -2.4, 0, 0.6);
    block(laser, 1.7, 0.85, 1.0, mat(0x374151), 0, 0, 0);
    block(laser, 1.7, 0.12, 1.0, mat(0x1f2937), 0, 0.85, 0);
    block(laser, 1.3, 0.02, 0.7, glass(0xf87171, 0.45), 0, 0.97, 0.05);
    block(laser, 1.1, 0.01, 0.55, C.woodLight, 0, 0.86, 0.05);
    block(laser, 0.3, 0.2, 0.02, screen(T.screens.dashboard(), { emissiveIntensity: 0.8 }), 0.6, 0.55, 0.51);
    ball(laser, 0.05, mat(0xdc2626), 0.6, 0.3, 0.52, 8, 6);
    robotArm(room.frame(2), 2.6, 1.4, -0.6, tick);

    /* Assembly table with a test drone hovering above */
    const assembly = node(content, 3.9, 0, 6.3, 0.15);
    block(assembly, 2.6, 0.06, 1.3, mat(0xd6b98d), 0, 0.84, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) block(assembly, 0.07, 0.84, 0.07, C.dark, sx * 1.2, 0, sz * 0.55);
    block(assembly, 2.4, 0.04, 1.1, C.dark, 0, 0.25, 0);
    for (const [x, z, w, h, d] of [[-0.9, 0.2, 0.3, 0.06, 0.3], [-0.5, -0.3, 0.2, 0.04, 0.12], [0.8, 0.25, 0.25, 0.15, 0.18]]) block(assembly, w, h, d, mat(pick(random, [0x1f2937, 0x0f766e, 0x9ca3af])), x, 0.9, z);
    for (let prop = 0; prop < 4; prop += 1) block(assembly, 0.24, 0.01, 0.03, C.black, -0.2 + prop * 0.12, 0.9, -0.4, prop * 0.6);
    laptop(assembly, 0.3, 0.9, 0.2, Math.PI + 0.2, pick(random, pool), mat(0x1f2937));
    crate(assembly, 1.6, 0, 0.1, 0.4, 0.6, 0.45, 0.5);
    person(assembly, -0.4, 1.15, Math.PI, { random, pose: 'work', shirt: SHIRTS[4], goggles: true });
    person(assembly, 1.6, -1.2, -0.4, { random, pose: 'gesture', shirt: SHIRTS[6], holding: hand => block(hand, 0.18, 0.04, 0.12, C.dark, 0, 0, 0.05) });
    const hover = node(assembly);
    hover.userData.live = true;
    const drone = node(hover, 0.4, 2.1, -0.2);
    block(drone, 0.26, 0.08, 0.26, mat(0x1f2937), 0, 0, 0);
    block(drone, 0.06, 0.02, 0.02, glow(0x22c55e, 2), 0, 0.04, 0.13);
    const rotors = [];
    for (const angle of [0.785, 2.356, 3.927, 5.498]) {
      rod(drone, [0, 0.04, 0], [Math.sin(angle) * 0.3, 0.04, Math.cos(angle) * 0.3], 0.015, mat(0x374151), 4);
      const rotor = node(drone, Math.sin(angle) * 0.3, 0.07, Math.cos(angle) * 0.3);
      block(rotor, 0.26, 0.006, 0.03, mat(0x9ca3af, { transparent: true, opacity: 0.7 }), 0, 0, 0);
      rotors.push(rotor);
    }
    tick(time => {
      drone.position.y = 2.1 + Math.sin(time * 1.6) * 0.12;
      drone.rotation.y = Math.sin(time * 0.4) * 0.6;
      drone.rotation.z = Math.sin(time * 1.1) * 0.05;
      rotors.forEach(rotor => { rotor.rotation.y = time * 40; });
    });

    /* CNC router carving a panel */
    const cnc = node(content, 4.6, 0, -3.2, -0.52);
    block(cnc, 2.7, 0.75, 1.7, mat(0x374151), 0, 0, 0);
    block(cnc, 2.6, 0.06, 1.6, mat(0x9ca3af), 0, 0.75, 0);
    block(cnc, 2.2, 0.03, 1.3, C.woodLight, 0, 0.81, 0);
    for (let groove = 0; groove < 5; groove += 1) flat(cnc, 1.6 - groove * 0.25, 0.02, mat(0x8a6140), 0, 0.842, -0.45 + groove * 0.22);
    for (const side of [-1, 1]) block(cnc, 2.7, 0.08, 0.08, C.steel, 0, 0.81, side * 0.82);
    const cncLive = node(cnc);
    cncLive.userData.live = true;
    const bridge = node(cncLive, 0, 0, 0);
    for (const side of [-1, 1]) block(bridge, 0.12, 0.65, 0.12, mat(0xf59e0b), 0, 0.81, side * 0.82);
    block(bridge, 0.14, 0.14, 1.78, mat(0xf59e0b), 0, 1.4, 0);
    const spindle = node(bridge, 0, 0, 0);
    block(spindle, 0.2, 0.32, 0.18, mat(0x1f2937), 0.1, 1.1, 0);
    rod(spindle, [0.1, 1.1, 0], [0.1, 0.86, 0], 0.025, C.steel, 6);
    tick(time => {
      bridge.position.x = Math.sin(time * 0.35) * 0.95;
      spindle.position.z = Math.sin(time * 1.4) * 0.5;
    });
    block(cnc, 0.4, 0.3, 0.06, screen(T.screens.terminal(), { emissiveIntensity: 0.8 }), 1.15, 0.4, 0.87);
    person(content, 3.2, -1.6, 2.6, { random, pose: 'crossed', shirt: SHIRTS[2], goggles: true });

    /* Woodworking bench with vise and clamps */
    const wood = node(content, -4.2, 0, -7.0, 0);
    block(wood, 2.4, 0.12, 0.95, mat(0xc79a62), 0, 0.82, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) block(wood, 0.12, 0.82, 0.12, mat(0xa47648), sx * 1.05, 0, sz * 0.36);
    block(wood, 2.2, 0.06, 0.8, mat(0xa47648), 0, 0.2, 0);
    block(wood, 0.35, 0.18, 0.12, C.steel, -1.0, 0.76, 0.52);
    rod(wood, [-1.0, 0.85, 0.6], [-1.0, 0.85, 0.85], 0.02, C.steel, 6);
    for (const [x, length, turn] of [[-0.2, 1.1, 0.1], [0.5, 0.7, -0.3], [0.2, 0.5, 0.6]]) block(wood, length, 0.05, 0.14, mat(0xe2c79f), x, 0.94, 0.05, turn);
    for (const x of [-0.5, 0.15]) {
      block(wood, 0.04, 0.25, 0.04, mat(0xdc2626), x, 0.82, 0.25);
      rod(wood, [x, 1.07, 0.25], [x, 1.07, -0.05], 0.012, C.steel, 4);
    }
    block(wood, 0.28, 0.08, 0.08, C.woodDark, 0.85, 0.94, -0.25, 0.4);
    for (let index = 0; index < 18; index += 1) block(wood, 0.04, 0.005, 0.02, mat(0xe8cfa4), range(random, -1.4, 1.4), 0.003, range(random, -0.6, 1.0), random() * 3);
    person(wood, 0.2, 0.95, Math.PI, { random, pose: 'work', shirt: SHIRTS[1], apron: 0x78350f, goggles: true, glasses: false });

    /* Dress form and fabric rail */
    const textile = node(content, -6.0, 0, 6.6, 0.9);
    tube(textile, 0.22, 0.25, 0.04, C.dark, 0, 0, 0, 12);
    rod(textile, [0, 0, 0], [0, 1.0, 0], 0.025, C.steel, 6);
    const form = tube(textile, 0.2, 0.17, 0.62, mat(0xe7d3b8, { roughness: 1 }), 0, 1.0, 0, 14);
    form.scale.z = 0.7;
    tube(textile, 0.26, 0.2, 0.3, mat(0xdb2777, { roughness: 1 }), 0, 1.15, 0, 14).scale.z = 0.75;
    tube(textile, 0.05, 0.05, 0.12, C.woodLight, 0, 1.62, 0, 8);
    for (const side of [-1, 1]) rod(textile, [1.0 + side * 0.7, 0, 0.2], [1.0 + side * 0.7, 1.7, 0.2], 0.02, C.metal, 6);
    rod(textile, [0.3, 1.7, 0.2], [1.7, 1.7, 0.2], 0.02, C.metal, 6);
    for (let index = 0; index < 6; index += 1) {
      const cloth = block(textile, 0.18, 0.9, 0.05, mat(pick(random, [0x0ea5e9, 0xf472b6, 0xfacc15, 0x22c55e, 0x7c3aed, 0xf97316]), { roughness: 1 }), 0.45 + index * 0.21, 0.78, 0.2);
      cloth.rotation.y = 0.5;
    }

    /* Safety walkways from each doorway */
    for (const wall of room.walls.filter(entry => entry.hasDoor)) {
      for (const offset of [-1.55, 1.55]) {
        const walkway = node(content, 0, 0, 0, wall.side * Math.PI / 3);
        flat(walkway, 0.1, 6.6, mat(0xfacc15, { roughness: 0.7 }), offset, 0.012, 7.8);
      }
    }

    /* Material rack and odds and ends */
    const materials = node(room.frame(0), 3.4, 0, 0.3);
    for (let sheet = 0; sheet < 6; sheet += 1) {
      const panel = block(materials, 1.25, 2.1, 0.025, sheet % 3 === 2 ? glass(pick(random, [0xf472b6, 0x60a5fa, 0xfacc15]), 0.6) : mat(pick(random, [0xd6b98d, 0xc9a676, 0xe2c79f])), sheet * 0.05, 0, 0.1 + sheet * 0.05);
      panel.rotation.x = -0.12;
    }
    block(materials, 1.6, 0.12, 0.6, C.dark, 0.1, 0, 0.25);
    exosuit(content, -10.5, 0.1, Math.PI / 2);
    trashBin(content, 1.6, -4.0, 0x374151);
    crate(content, -6.5, 0, 3.6, 0.3, 0.6, 0.5, 0.6);
    crate(content, -6.45, 0.5, 3.62, 0.5, 0.45, 0.35, 0.45);
    plantPot(room.frame(1), -4.5, 0.45, 0.9, 'snake');
    cable(content, [[-0.6, 0.01, 0.4], [-2.0, 0.01, -1.5], [-3.6, 0.01, -4.8]], 0.02, C.black);

    let lastSecond = -1;
    tick(() => {
      const second = Math.floor(Date.now() / 1000);
      if (second !== lastSecond) shopClock.redraw();
      lastSecond = second;
    });
  },
};
