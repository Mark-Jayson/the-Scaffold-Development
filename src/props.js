import * as THREE from 'three';
import { C, mat, glow, glass, screen, node, block, tube, ball, dome, blob, plane, flat, disc, ring, rod, cable, pick, range } from './kit.js';

/* ---------- People ---------- */
const SKIN = [0xf2cba8, 0xe3b08a, 0xc98d64, 0xa06a45, 0x744a2d, 0xf7d9c4, 0xd9a07a];
const HAIR = [0x2a1c13, 0x4b2f1d, 0x111214, 0x86592e, 0xd6b06c, 0x6e3a1c, 0x8f9196, 0xb5532c, 0x1c1410];
const PANTS = [0x2d3440, 0x3a4a6c, 0x5a4b3b, 0x1e2228, 0x6a6f78, 0x7a6a55, 0x46546e];
const SHOES = [0x1b1d22, 0xf1f1ee, 0x5a3b26, 0x2c3a55, 0x8a8f99];
const STYLES = ['short', 'short', 'long', 'bun', 'curly', 'ponytail', 'buzz', 'long', 'bob'];
const SITTING_LEGS = [[-1.52, 1.47], [-1.52, 1.47]];
const POSES = {
  stand: { hip: 1.01, legs: [[0, 0], [0, 0]], arms: [[0.04, -0.1], [0.04, -0.1]] },
  walk: { hip: 1, legs: [[-0.32, 0.22], [0.28, 0.12]], arms: [[0.3, -0.25], [-0.3, -0.3]] },
  sit: { hip: 0.55, legs: SITTING_LEGS, arms: [[-0.35, -0.75], [-0.35, -0.75]], lean: 0.02 },
  type: { hip: 0.55, legs: SITTING_LEGS, arms: [[-0.7, -0.88], [-0.7, -0.88]], lean: 0.12 },
  read: { hip: 0.55, legs: SITTING_LEGS, arms: [[-0.5, -1.3], [-0.5, -1.3]], lean: 0.05 },
  lounge: { hip: 0.5, legs: [[-1.25, 1.1], [-1.4, 1.3]], arms: [[-0.1, -0.55], [-0.2, -0.9]], lean: -0.28 },
  stool: { hip: 0.82, legs: [[-1.2, 1.55], [-0.95, 1.35]], arms: [[-0.65, -0.95], [-0.65, -0.95]], lean: 0.14 },
  point: { hip: 1.01, legs: [[0, 0], [0, 0]], arms: [[0.04, -0.1], [-2.3, -0.3]] },
  write: { hip: 1.01, legs: [[0, 0], [0, 0]], arms: [[-0.3, -0.9], [-1.85, -0.55]] },
  gesture: { hip: 1.01, legs: [[0.05, 0], [-0.05, 0]], arms: [[-1.2, -0.7], [-1.5, -0.45]], spread: 0.32 },
  phone: { hip: 1.01, legs: [[0, 0], [0, 0]], arms: [[0.04, -0.1], [-0.35, -2.55]], spread: 0.25 },
  cup: { hip: 1.01, legs: [[0, 0], [0, 0]], arms: [[0.04, -0.1], [-0.2, -1.35]] },
  work: { hip: 1.01, legs: [[0, 0], [0, 0]], arms: [[-0.55, -0.75], [-0.55, -0.75]], lean: 0.18 },
  crossed: { hip: 1.01, legs: [[0, 0], [0, 0]], arms: [[-0.25, -1.75], [-0.25, -1.75]], spread: -0.08 },
};

export function person(parent, x, z, ry, options = {}) {
  const random = options.random ?? Math.random;
  const { pose = 'stand', shirt = 0x5b7bd5, pants = pick(random, PANTS), skin = pick(random, SKIN), hair = pick(random, HAIR), style = pick(random, STYLES), coat = false, sleeves = random() > 0.7 ? 'short' : 'long', glasses = random() > 0.72, headset = false, y = 0 } = options;
  const shape = POSES[pose];
  const root = node(parent, x, y, z, ry);
  root.userData.person = true;
  const skinM = mat(skin), shirtM = mat(shirt, { roughness: 0.92 }), pantsM = mat(pants, { roughness: 0.9 }), shoeM = mat(options.shoes ?? pick(random, SHOES), { roughness: 0.6 }), coatM = mat(0xf7f8fa, { roughness: 0.85 });
  const hips = node(root, 0, shape.hip, 0);
  block(hips, 0.4, 0.17, 0.24, pantsM, 0, -0.09, 0);
  const legs = [-1, 1].map((side, index) => {
    const hip = node(hips, side * 0.105, -0.02, 0);
    hip.rotation.set(shape.legs[index][0], 0, side * 0.025);
    rod(hip, [0, 0, 0], [0, -0.46, 0], 0.1, pantsM, 8, 0.082);
    const knee = node(hip, 0, -0.44, 0);
    knee.rotation.x = shape.legs[index][1];
    rod(knee, [0, 0, 0], [0, -0.45, 0], 0.08, pantsM, 8, 0.066);
    block(knee, 0.14, 0.1, 0.29, shoeM, 0, -0.55, 0.06);
    return hip;
  });
  const upper = node(hips, 0, 0.02, 0);
  upper.rotation.x = options.lean ?? shape.lean ?? 0;
  const torso = tube(upper, 0.235, 0.2, 0.56, coat ? coatM : shirtM, 0, -0.02, 0, 12);
  torso.scale.z = 0.62;
  if (coat) {
    const tail = tube(upper, 0.24, 0.29, shape.hip < 0.9 ? 0.3 : 0.62, coatM, 0, shape.hip < 0.9 ? -0.18 : -0.6, 0, 12);
    tail.scale.z = 0.7;
    block(upper, 0.012, 0.42, 0.01, mat(0xcfd6e0), 0, 0.06, 0.15);
    block(upper, 0.07, 0.05, 0.01, mat(0x3b82f6), 0.11, 0.38, 0.15);
  }
  if (options.apron) block(upper, 0.36, 0.72, 0.02, mat(options.apron), 0, -0.36, 0.14);
  if (options.lanyard) {
    rod(upper, [-0.1, 0.52, 0.12], [0, 0.22, 0.155], 0.008, mat(options.lanyard), 4);
    rod(upper, [0.1, 0.52, 0.12], [0, 0.22, 0.155], 0.008, mat(options.lanyard), 4);
    block(upper, 0.07, 0.1, 0.01, C.white, 0, 0.12, 0.155);
  }
  const arms = [-1, 1].map((side, index) => {
    const shoulder = node(upper, side * 0.265, 0.5, 0);
    shoulder.rotation.z = side * (shape.spread ?? 0.1);
    ball(shoulder, 0.082, coat ? coatM : shirtM, 0, 0, 0, 8, 6);
    const arm = node(shoulder);
    arm.rotation.x = shape.arms[index][0];
    rod(arm, [0, 0, 0], [0, -0.3, 0], 0.068, coat ? coatM : shirtM, 8, 0.06);
    const elbow = node(arm, 0, -0.29, 0);
    elbow.rotation.x = shape.arms[index][1];
    rod(elbow, [0, 0, 0], [0, -0.26, 0], 0.056, coat ? coatM : sleeves === 'short' ? skinM : shirtM, 8, 0.05);
    ball(elbow, 0.058, options.gloves ? mat(options.gloves) : skinM, 0, -0.3, 0, 8, 6);
    if (index === 1 && options.holding) options.holding(node(elbow, 0, -0.32, 0.02));
    return arm;
  });
  tube(upper, 0.06, 0.068, 0.15, skinM, 0, 0.53, 0, 8);
  const head = node(upper, 0, 0.8, 0);
  const skull = ball(head, 0.155, skinM, 0, 0, 0, 14, 11);
  skull.scale.set(1, 1.1, 1.02);
  for (const side of [-1, 1]) {
    ball(head, 0.021, C.black, side * 0.055, 0.02, 0.142, 6, 5);
    ball(head, 0.03, skinM, side * 0.152, 0, 0, 6, 5);
  }
  const hairM = mat(hair, { roughness: 0.95 });
  if (style !== 'bald') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(style === 'buzz' ? 0.16 : 0.168, 14, 8, 0, Math.PI * 2, 0, Math.PI * (style === 'buzz' ? 0.48 : 0.56)), hairM);
    cap.position.set(0, 0.012, -0.014);
    cap.rotation.x = -0.38;
    cap.scale.set(1.02, 1.12, 1.05);
    head.add(cap);
  }
  if (style === 'long') block(head, 0.3, 0.4, 0.1, hairM, 0, -0.34, -0.1);
  if (style === 'bob') block(head, 0.34, 0.24, 0.24, hairM, 0, -0.16, -0.06);
  if (style === 'bun') ball(head, 0.075, hairM, 0, 0.14, -0.14, 8, 6);
  if (style === 'ponytail') rod(head, [0, 0.06, -0.16], [0, -0.26, -0.22], 0.045, hairM, 6, 0.02);
  if (style === 'curly') blob(head, 0.2, hairM, 0, 0.06, -0.03, 1);
  if (glasses) {
    block(head, 0.25, 0.012, 0.012, C.black, 0, 0.04, 0.16);
    for (const side of [-1, 1]) block(head, 0.075, 0.05, 0.008, glass(0xbfe3ff, 0.4), side * 0.06, 0.015, 0.162);
  }
  if (options.goggles) block(head, 0.27, 0.07, 0.04, glass(0x9fe8ff, 0.55), 0, 0.01, 0.15);
  if (headset) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.016, 5, 16, Math.PI), C.black);
    band.position.y = 0.02;
    head.add(band);
    for (const side of [-1, 1]) ball(head, 0.045, C.black, side * 0.17, 0.0, 0, 8, 6);
  }
  if (options.cap) {
    dome(head, 0.172, mat(options.cap), 0, 0.03, 0, 12).scale.y = 0.7;
    block(head, 0.22, 0.015, 0.14, mat(options.cap), 0, 0.03, 0.17);
  }
  root.userData.rig = { legs, arms, hips };
  return root;
}

/* ---------- Seating ---------- */
export function officeChair(parent, x, z, ry, color = 0x2f3440) {
  const group = node(parent, x, 0, z, ry), fabric = mat(color, { roughness: 0.92 });
  for (let spoke = 0; spoke < 5; spoke += 1) {
    const angle = spoke * Math.PI * 0.4;
    rod(group, [0, 0.08, 0], [Math.sin(angle) * 0.29, 0.06, Math.cos(angle) * 0.29], 0.022, C.plastic, 6);
    ball(group, 0.034, C.black, Math.sin(angle) * 0.29, 0.034, Math.cos(angle) * 0.29, 6, 5);
  }
  tube(group, 0.028, 0.034, 0.33, C.metal, 0, 0.08, 0, 8);
  block(group, 0.5, 0.08, 0.48, fabric, 0, 0.4, 0.01);
  rod(group, [0, 0.43, -0.2], [0, 0.66, -0.29], 0.024, C.plastic, 6);
  const back = block(group, 0.46, 0.56, 0.07, fabric, 0, 0.58, -0.3);
  back.rotation.x = -0.1;
  for (const side of [-1, 1]) {
    rod(group, [side * 0.26, 0.44, -0.05], [side * 0.26, 0.64, -0.05], 0.018, C.plastic, 6);
    block(group, 0.06, 0.03, 0.26, C.plastic, side * 0.26, 0.63, -0.02);
  }
  return group;
}
export function stool(parent, x, z, height = 0.78, color = 0x2f3440) {
  const group = node(parent, x, 0, z);
  tube(group, 0.2, 0.19, 0.06, mat(color), 0, height - 0.06, 0, 16);
  for (let leg = 0; leg < 4; leg += 1) {
    const angle = leg * Math.PI / 2 + Math.PI / 4;
    rod(group, [Math.sin(angle) * 0.12, height - 0.06, Math.cos(angle) * 0.12], [Math.sin(angle) * 0.2, 0, Math.cos(angle) * 0.2], 0.018, C.metal, 6);
  }
  ring(group, 0.16, 0.012, C.metal, 0, height * 0.32, 0, 16);
  return group;
}
export function sofa(parent, x, z, ry, color, width = 2.3, depth = 0.95) {
  const group = node(parent, x, 0, z, ry), fabric = mat(color, { roughness: 0.95 }), cushions = Math.round(width / 0.8);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) block(group, 0.06, 0.1, 0.06, C.woodDark, sx * (width / 2 - 0.1), 0, sz * (depth / 2 - 0.1));
  block(group, width, 0.24, depth, fabric, 0, 0.1, 0);
  for (let index = 0; index < cushions; index += 1) {
    const cushionWidth = (width - 0.42) / cushions;
    block(group, cushionWidth - 0.03, 0.15, depth - 0.3, fabric, -width / 2 + 0.21 + cushionWidth * (index + 0.5), 0.34, 0.08);
    const back = block(group, cushionWidth - 0.04, 0.42, 0.18, fabric, -width / 2 + 0.21 + cushionWidth * (index + 0.5), 0.36, -depth / 2 + 0.2);
    back.rotation.x = -0.14;
  }
  block(group, width, 0.5, 0.16, fabric, 0, 0.34, -depth / 2 + 0.08);
  for (const side of [-1, 1]) block(group, 0.2, 0.32, depth, fabric, side * (width / 2 - 0.1), 0.34, 0);
  return group;
}
export function beanbag(parent, x, z, color) {
  const bag = ball(parent, 0.5, mat(color, { roughness: 1 }), x, 0.26, z, 14, 10);
  bag.scale.set(1, 0.55, 1);
  return bag;
}

/* ---------- Tables and desks ---------- */
export function desk(parent, x, z, ry, width = 1.8, depth = 0.85, top = C.woodLight, legs = C.white, height = 0.84) {
  const group = node(parent, x, 0, z, ry);
  block(group, width, 0.05, depth, top, 0, height - 0.05, 0);
  for (const side of [-1, 1]) {
    block(group, 0.05, height - 0.05, 0.06, legs, side * (width / 2 - 0.08), 0, depth / 2 - 0.1);
    block(group, 0.05, height - 0.05, 0.06, legs, side * (width / 2 - 0.08), 0, -depth / 2 + 0.1);
    block(group, 0.05, 0.05, depth - 0.2, legs, side * (width / 2 - 0.08), height - 0.12, 0);
  }
  block(group, width - 0.2, 0.32, 0.02, legs, 0, height - 0.44, -depth / 2 + 0.12);
  return group;
}
export function table(parent, x, z, ry, width, depth, top = C.white, legs = C.steel, height = 0.84, round = false) {
  const group = node(parent, x, 0, z, ry);
  if (round) {
    const surface = tube(group, width / 2, width / 2, 0.05, top, 0, height - 0.05, 0, 36);
    surface.scale.z = depth / width;
    tube(group, 0.06, 0.08, height - 0.05, legs, 0, 0, 0, 10);
    tube(group, 0.36, 0.38, 0.04, legs, 0, 0, 0, 20);
  } else {
    block(group, width, 0.05, depth, top, 0, height - 0.05, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) block(group, 0.06, height - 0.05, 0.06, legs, sx * (width / 2 - 0.1), 0, sz * (depth / 2 - 0.1));
  }
  return group;
}

/* ---------- Tech ---------- */
export function monitor(parent, x, y, z, ry, screenMaterial, width = 0.9, height = 0.52) {
  const group = node(parent, x, y, z, ry);
  block(group, 0.26, 0.015, 0.18, C.plastic, 0, 0, -0.04);
  block(group, 0.05, 0.3, 0.03, C.plastic, 0, 0.015, -0.08);
  block(group, width, height, 0.04, C.screenBack, 0, 0.16, -0.04);
  plane(group, width - 0.04, height - 0.04, screenMaterial, 0, 0.16 + height / 2, -0.019);
  return group;
}
export function laptop(parent, x, y, z, ry, screenMaterial, shell = C.metal, open = 0.28) {
  const group = node(parent, x, y, z, ry);
  block(group, 0.42, 0.018, 0.29, shell, 0, 0, 0);
  flat(group, 0.36, 0.13, C.black, 0, 0.0185, -0.035);
  flat(group, 0.12, 0.07, mat(0x9aa2ad), 0, 0.0185, 0.08);
  const lid = node(group, 0, 0.018, -0.14);
  lid.rotation.x = -open;
  block(lid, 0.42, 0.28, 0.012, shell, 0, 0, 0);
  plane(lid, 0.38, 0.24, screenMaterial, 0, 0.14, 0.0065);
  return group;
}
export function keyboard(parent, x, y, z, ry = 0) {
  const group = node(parent, x, y, z, ry);
  block(group, 0.44, 0.02, 0.14, C.plastic, 0, 0, 0);
  flat(group, 0.41, 0.11, mat(0x555b66), 0, 0.021, 0);
  const mouse = ball(group, 0.04, C.plastic, 0.32, 0.015, 0.02, 8, 6);
  mouse.scale.set(0.75, 0.45, 1.15);
  return group;
}
export function tv(parent, x, y, z, ry, screenMaterial, width = 2.2, height = 1.25) {
  const group = node(parent, x, y, z, ry);
  block(group, width, height, 0.06, C.black, 0, 0, 0.03);
  plane(group, width - 0.06, height - 0.06, screenMaterial, 0, height / 2, 0.061);
  block(group, 0.12, 0.012, 0.02, glow(0x4ade80, 1.2), width / 2 - 0.12, 0.03, 0.065);
  return group;
}
export function rack(parent, x, z, ry, frontMaterial, random, height = 2.6) {
  const group = node(parent, x, 0, z, ry);
  block(group, 1.0, height, 1.3, mat(0x1a1d23, { roughness: 0.5, metalness: 0.3 }), 0, 0, 0);
  const face = plane(group, 0.86, height - 0.2, frontMaterial, 0, height / 2, 0.652);
  const uv = face.geometry.attributes.uv, shift = Math.floor(random() * 16) / 16;
  for (let index = 0; index < uv.count; index += 1) uv.setY(index, uv.getY(index) * 0.8 + shift);
  block(group, 1.02, 0.08, 1.32, mat(0x2a2f38), 0, height, 0);
  block(group, 0.04, height - 0.3, 0.02, C.metal, 0.43, 0.15, 0.66);
  block(group, 0.3, 0.06, 0.02, glow(0x60a5fa, 1.3), -0.25, height - 0.12, 0.66);
  return group;
}

/* ---------- Storage ---------- */
const BOOKS = [0xb5473a, 0x2f5d8a, 0xd9a441, 0x3f7d5a, 0x6b4a8a, 0xe7e2d3, 0x1f2937, 0xc2643a, 0x88a2b8, 0x8a2f3f];
export function bookshelf(parent, x, z, ry, width, height, random, frame = C.woodLight, depth = 0.38) {
  const group = node(parent, x, 0, z, ry), shelves = Math.max(2, Math.round(height / 0.42));
  for (const side of [-1, 1]) block(group, 0.04, height, depth, frame, side * (width / 2 - 0.02), 0, 0);
  block(group, width, 0.02, depth, frame, 0, height - 0.02, 0);
  block(group, width - 0.06, height, 0.02, frame, 0, 0, -depth / 2 + 0.01);
  for (let shelf = 0; shelf < shelves; shelf += 1) {
    const y = 0.04 + shelf * (height - 0.06) / shelves;
    block(group, width - 0.06, 0.03, depth - 0.02, frame, 0, y, 0);
    let cursor = -width / 2 + 0.06;
    while (cursor < width / 2 - 0.12) {
      const roll = random();
      if (roll > 0.92) {
        cursor += 0.08;
        plantPot(group, cursor + 0.07, 0, 0.45, 'bush', y + 0.03);
        cursor += 0.2;
      } else if (roll > 0.85) {
        for (let stack = 0; stack < 3; stack += 1) block(group, 0.24, 0.04, 0.2, mat(pick(random, BOOKS)), cursor + 0.13, y + 0.03 + stack * 0.04, 0, (random() - 0.5) * 0.2);
        cursor += 0.3;
      } else {
        const bookWidth = range(random, 0.035, 0.075), bookHeight = range(random, 0.22, 0.34);
        const book = block(group, bookWidth, bookHeight, range(random, 0.2, 0.28), mat(pick(random, BOOKS)), cursor + bookWidth / 2, y + 0.03, 0.02);
        if (random() > 0.94) book.rotation.z = 0.18;
        cursor += bookWidth + 0.004;
      }
    }
  }
  return group;
}
export function cabinet(parent, x, z, ry, width, height, depth, color = 0xd7dbe0, drawers = 3) {
  const group = node(parent, x, 0, z, ry), body = mat(color);
  block(group, width, height, depth, body, 0, 0, 0);
  for (let drawer = 0; drawer < drawers; drawer += 1) {
    const y = (drawer + 0.5) * height / drawers;
    block(group, width - 0.04, 0.012, 0.01, mat(0x9aa1ab), 0, (drawer + 1) * height / drawers - 0.006, depth / 2);
    block(group, width * 0.3, 0.03, 0.03, C.steel, 0, y, depth / 2 + 0.01);
  }
  return group;
}

/* ---------- Plants ---------- */
export function plantPot(parent, x, z, size = 1, kind = 'bush', y = 0, potMaterial = C.terracotta) {
  const group = node(parent, x, y, z);
  tube(group, 0.17 * size, 0.12 * size, 0.28 * size, potMaterial, 0, 0, 0, 12);
  disc(group, 0.155 * size, C.soil, 0, 0.27 * size, 0, 12);
  if (kind === 'bush') {
    for (const [dx, dy, dz, r] of [[0, 0.42, 0, 0.18], [0.1, 0.36, 0.06, 0.14], [-0.1, 0.36, -0.04, 0.14], [0.02, 0.36, -0.11, 0.13], [-0.04, 0.5, 0.06, 0.12]]) blob(group, r * size, C.leaf, dx * size, dy * size, dz * size, 0);
  } else if (kind === 'tall') {
    rod(group, [0, 0.25 * size, 0], [0.04 * size, 1.5 * size, 0.02 * size], 0.025 * size, C.woodDark, 5);
    for (let leaf = 0; leaf < 14; leaf += 1) {
      const angle = leaf * 2.4, height = 0.65 + leaf * 0.065;
      const blade = blob(group, 0.12 * size, leaf % 3 ? C.leaf : C.leafDark, Math.sin(angle) * 0.17 * size, height * size, Math.cos(angle) * 0.17 * size, 0);
      blade.scale.set(1.3, 0.35, 0.9);
      blade.rotation.set(0.4, angle, 0.3);
    }
  } else if (kind === 'snake') {
    for (let leaf = 0; leaf < 8; leaf += 1) {
      const angle = leaf * 0.8, blade = block(group, 0.06 * size, (0.5 + (leaf % 3) * 0.14) * size, 0.016 * size, leaf % 2 ? C.leafDark : mat(0x5f8f4a), Math.sin(angle) * 0.06 * size, 0.25 * size, Math.cos(angle) * 0.06 * size, angle);
      blade.rotation.z = (leaf % 2 ? 1 : -1) * 0.12;
    }
  } else if (kind === 'fern') {
    for (let leaf = 0; leaf < 9; leaf += 1) {
      const angle = leaf * 0.7;
      const frond = block(group, 0.05 * size, 0.02 * size, 0.42 * size, mat(0x5ea04c, { flatShading: true }), Math.sin(angle) * 0.16 * size, 0.38 * size, Math.cos(angle) * 0.16 * size, angle);
      frond.rotation.x = 0.5;
    }
  }
  return group;
}

/* ---------- Small desk clutter ---------- */
export const mug = (parent, x, y, z, color = 0xf4f4f0) => {
  tube(parent, 0.045, 0.04, 0.1, mat(color), x, y, z, 10);
  disc(parent, 0.038, mat(0x3b2416), x, y + 0.09, z, 10);
  block(parent, 0.02, 0.06, 0.035, mat(color), x + 0.055, y + 0.02, z);
};
export const can = (parent, x, y, z, color, tipped = false) => {
  const body = tube(parent, 0.033, 0.033, 0.12, mat(color, { metalness: 0.5, roughness: 0.35 }), x, y, z, 10);
  if (tipped) {
    body.rotation.z = Math.PI / 2;
    body.position.y = y + 0.033;
  } else tube(parent, 0.028, 0.03, 0.006, C.metal, x, y + 0.12, z, 10);
};
export const bottle = (parent, x, y, z, color = 0x7dd3fc) => {
  tube(parent, 0.035, 0.035, 0.2, glass(color, 0.5), x, y, z, 10);
  tube(parent, 0.02, 0.02, 0.04, mat(0x1f2937), x, y + 0.2, z, 8);
};
export const papers = (parent, x, y, z, random, count = 3) => {
  for (let sheet = 0; sheet < count; sheet += 1) flat(parent, 0.21, 0.29, C.paper, x + (random() - 0.5) * 0.08, y + 0.002 + sheet * 0.002, z + (random() - 0.5) * 0.06, (random() - 0.5) * 0.6);
};
export const notebook = (parent, x, y, z, ry, color) => {
  block(parent, 0.2, 0.02, 0.27, mat(color), x, y, z, ry);
  block(parent, 0.19, 0.012, 0.26, C.paper, x + 0.004, y + 0.006, z, ry);
};
export const stickies = (parent, x, y, z, ry, random, count = 3) => {
  for (let note = 0; note < count; note += 1) plane(parent, 0.07, 0.07, mat(pick(random, [0xfde68a, 0xfbcfe8, 0xbfdbfe, 0xbbf7d0])), x + note * 0.08, y - (note % 2) * 0.05, z, ry);
};
export function deskLamp(parent, x, y, z, ry, color = 0x1f2937) {
  const group = node(parent, x, y, z, ry), body = mat(color);
  tube(group, 0.08, 0.09, 0.025, body, 0, 0, 0, 12);
  rod(group, [0, 0.02, 0], [0.05, 0.36, -0.06], 0.012, body, 6);
  rod(group, [0.05, 0.36, -0.06], [0.2, 0.42, 0.06], 0.012, body, 6);
  const head = tube(group, 0.035, 0.08, 0.1, body, 0.22, 0.34, 0.08, 12);
  head.rotation.x = 0.4;
  ball(group, 0.035, glow(0xfff1c1, 2), 0.23, 0.35, 0.09, 8, 6);
  return group;
}

/* ---------- Room furniture ---------- */
export function rug(parent, x, z, ry, width, depth, color, border) {
  flat(parent, width, depth, mat(border ?? color, { roughness: 1 }), x, 0.006, z, ry);
  if (border) flat(parent, width - 0.24, depth - 0.24, mat(color, { roughness: 1 }), x, 0.008, z, ry);
}
export function floorLamp(parent, x, z, shade = 0xf3ead8) {
  tube(parent, 0.17, 0.19, 0.03, C.dark, x, 0, z, 16);
  rod(parent, [x, 0.03, z], [x, 1.62, z], 0.016, C.dark, 6);
  tube(parent, 0.17, 0.25, 0.3, mat(shade, { emissive: 0xffd9a0, emissiveIntensity: 0.35, side: THREE.DoubleSide }), x, 1.5, z, 16);
}
export function whiteboardStand(parent, x, z, ry, boardMaterial, width = 1.9, height = 1.15) {
  const group = node(parent, x, 0, z, ry);
  for (const side of [-1, 1]) {
    rod(group, [side * (width / 2 + 0.04), 0.08, 0], [side * (width / 2 + 0.04), 2.0, 0], 0.03, C.metal, 6);
    block(group, 0.06, 0.04, 0.6, C.metal, side * (width / 2 + 0.04), 0.06, 0);
    for (const end of [-1, 1]) ball(group, 0.04, C.black, side * (width / 2 + 0.04), 0.04, end * 0.27, 6, 5);
  }
  block(group, width + 0.06, height + 0.06, 0.04, mat(0xc5cad3, { metalness: 0.3 }), 0, 0.8, 0);
  plane(group, width, height, boardMaterial, 0, 0.83 + height / 2, 0.021);
  plane(group, width, height, boardMaterial, 0, 0.83 + height / 2, -0.021, Math.PI);
  block(group, width * 0.5, 0.03, 0.08, mat(0xc5cad3), 0, 0.78, 0.04);
  for (const [dx, color] of [[-0.2, 0x2563eb], [-0.1, 0xdc2626], [0, 0x111827]]) rod(group, [dx, 0.82, 0.07], [dx + 0.09, 0.82, 0.07], 0.012, mat(color), 6);
  return group;
}
export function plantBed(parent, x, z, ry, width, depth, random, crop = 'greens') {
  const group = node(parent, x, 0, z, ry);
  block(group, width, 0.55, depth, C.woodDark, 0, 0, 0);
  block(group, width - 0.12, 0.04, depth - 0.12, C.soil, 0, 0.53, 0);
  const columns = Math.floor(width / 0.42), rows = Math.max(1, Math.floor(depth / 0.42));
  for (let column = 0; column < columns; column += 1) for (let row = 0; row < rows; row += 1) {
    const px = -width / 2 + (column + 0.5) * width / columns, pz = -depth / 2 + (row + 0.5) * depth / rows;
    if (crop === 'greens') blob(group, range(random, 0.12, 0.17), pick(random, [mat(0x7cc35a, { flatShading: true }), mat(0x5aa64a, { flatShading: true }), mat(0x9bd36a, { flatShading: true })]), px, 0.62, pz, 0).scale.y = 0.65;
    if (crop === 'tomato') {
      rod(group, [px, 0.55, pz], [px, 1.45, pz], 0.012, C.woodLight, 4);
      for (const h of [0.8, 1.05, 1.28]) blob(group, 0.13, C.leaf, px + (random() - 0.5) * 0.1, h, pz, 0);
      for (let fruit = 0; fruit < 3; fruit += 1) ball(group, 0.05, mat(random() > 0.3 ? 0xe0452f : 0xf59e0b, { roughness: 0.4 }), px + (random() - 0.5) * 0.2, range(random, 0.75, 1.25), pz + 0.1, 8, 6);
    }
    if (crop === 'flowers') {
      rod(group, [px, 0.55, pz], [px, 0.82, pz], 0.01, C.leaf, 4);
      ball(group, 0.07, mat(pick(random, [0xf472b6, 0xfacc15, 0xa78bfa, 0xfb923c, 0xffffff])), px, 0.85, pz, 8, 6);
    }
  }
  return group;
}
export function fireExtinguisher(parent, x, z, ry) {
  const group = node(parent, x, 0.6, z, ry);
  block(group, 0.18, 0.06, 0.03, C.steel, 0, 0.35, 0.015);
  tube(group, 0.075, 0.075, 0.48, C.red, 0, 0, 0.1, 12);
  dome(group, 0.075, C.red, 0, 0.48, 0.1, 10);
  block(group, 0.06, 0.08, 0.04, C.black, 0, 0.53, 0.1);
  cable(group, [[0.03, 0.57, 0.1], [0.12, 0.5, 0.14], [0.1, 0.2, 0.17]], 0.012, C.black);
}
export function waterCooler(parent, x, z, ry) {
  const group = node(parent, x, 0, z, ry);
  block(group, 0.36, 1.0, 0.36, C.white, 0, 0, 0);
  block(group, 0.2, 0.12, 0.04, C.dark, 0, 0.66, 0.18);
  tube(group, 0.15, 0.15, 0.42, glass(0x7cc4ff, 0.45), 0, 1.0, 0, 16);
  dome(group, 0.15, glass(0x7cc4ff, 0.45), 0, 1.42, 0, 12);
  for (const [dx, color] of [[-0.06, 0x3b82f6], [0.06, 0xef4444]]) block(group, 0.04, 0.05, 0.04, mat(color), dx, 0.76, 0.19);
  return group;
}
export function trashBin(parent, x, z, color = 0x4b5563) {
  tube(parent, 0.17, 0.14, 0.42, mat(color), x, 0, z, 14);
  ring(parent, 0.17, 0.012, C.dark, x, 0.42, z, 14);
}
export function coatRack(parent, x, z, colors) {
  tube(parent, 0.2, 0.22, 0.03, C.woodDark, x, 0, z, 14);
  rod(parent, [x, 0, z], [x, 1.9, z], 0.025, C.woodDark, 6);
  colors.forEach((color, index) => {
    const angle = index * 2.1;
    rod(parent, [x, 1.78, z], [x + Math.sin(angle) * 0.14, 1.86, z + Math.cos(angle) * 0.14], 0.012, C.woodDark, 5);
    const coat = block(parent, 0.3, 0.75, 0.12, mat(color, { roughness: 1 }), x + Math.sin(angle) * 0.14, 1.06, z + Math.cos(angle) * 0.14, angle);
    coat.rotation.x = 0.05;
  });
}
export function wallClock(parent, x, y, z, ry, texture, size = 0.6) {
  const group = node(parent, x, y, z, ry), height = size * 148 / 128;
  plane(group, size, height, screen(texture, { alphaTest: 0.5, emissiveIntensity: 0.25 }), 0, 0, 0.045);
  const back = tube(group, size / 2, size / 2, 0.04, C.dark, 0, height * (74 - 64) / 148 - 0.02, 0.02, 24);
  back.rotation.x = Math.PI / 2;
  return group;
}
export function vent(parent, x, y, z, ry, width = 0.8, height = 0.3) {
  const group = node(parent, x, y, z, ry);
  block(group, width, height, 0.03, mat(0xc4c8cf), 0, 0, 0.015);
  for (let slat = 0; slat < 5; slat += 1) block(group, width - 0.06, 0.02, 0.02, mat(0x8d939d), 0, 0.04 + slat * (height - 0.06) / 5, 0.035);
}
export function outlet(parent, x, y, z, ry) {
  block(parent, 0.1, 0.14, 0.015, C.white, x, y, z, ry);
}
export function crate(parent, x, y, z, ry, w, h, d, material = C.cardboard) {
  block(parent, w, h, d, material, x, y, z, ry);
  block(parent, w + 0.004, 0.01, 0.08, mat(0xd8c49a), x, y + h - 0.005, z, ry);
}

/* ---------- Workstations ---------- */
// Desk centred on the origin with the user on the +z side, facing the screens at -z.
export function workstation(parent, x, z, ry, options) {
  const { random, screens: pool, monitors = 1, useLaptop = false, chair = 0x2f3440, top = C.woodLight, legs = C.white, width = 1.6, depth = 0.8, pose = 'type', shirt, occupied = true, mess = 0.5, personOptions = {} } = options;
  const group = node(parent, x, 0, z, ry), y = 0.84;
  desk(group, 0, 0, 0, width, depth, top, legs);
  if (useLaptop) laptop(group, 0, y, 0.05, 0, pick(random, pool));
  else {
    if (monitors === 2) for (const side of [-1, 1]) monitor(group, side * 0.46, y, -0.18, -side * 0.22, pick(random, pool), 0.84, 0.5);
    else monitor(group, 0, y, -0.2, 0, pick(random, pool));
    keyboard(group, 0, y, 0.2);
  }
  if (random() < mess + 0.3) mug(group, 0.62, y, 0.12, pick(random, [0xf4f4f0, 0x2f5d8a, 0xd2413a, 0xf2c94c, 0x1f2937]));
  if (random() < mess) notebook(group, -0.55, y, 0.1, range(random, -0.3, 0.3), pick(random, [0x1f2937, 0xb5473a, 0x2f5d8a, 0xd9a441]));
  if (random() < mess) papers(group, -0.5, y + 0.02, -0.2, random, 2);
  if (random() < 0.45) plantPot(group, width / 2 - 0.15, -0.26, 0.42, pick(random, ['bush', 'snake']), y);
  if (random() < 0.3) bottle(group, -0.7, y, -0.25);
  if (random() < 0.3) deskLamp(group, -width / 2 + 0.18, y, -0.25, 0.6);
  if (random() < 0.35) stickies(group, -0.38, y + 0.62, -0.17, 0, random, 2);
  if (random() < 0.3) {
    const headphones = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 5, 14, Math.PI), C.black);
    headphones.position.set(0.45, y + 0.02, -0.02);
    headphones.rotation.x = -Math.PI / 2;
    group.add(headphones);
  }
  if (random() < 0.5) block(group, 0.2, 0.45, 0.45, C.plastic, -width / 2 + 0.25, 0, -0.1);
  const seat = node(group, 0, 0, depth / 2 + 0.42, Math.PI);
  officeChair(seat, 0, 0, occupied ? 0 : range(random, -0.6, 0.6), chair);
  if (occupied) person(seat, 0, 0, 0, { random, pose, shirt, ...personOptions });
  else if (random() < 0.6) {
    const jacket = block(seat, 0.48, 0.45, 0.08, mat(pick(random, [0x374151, 0x7c2d12, 0x1e3a8a, 0x3f3f46]), { roughness: 1 }), 0, 0.68, -0.36);
    jacket.rotation.x = -0.1;
  }
  if (random() < 0.4) {
    const bag = block(group, 0.32, 0.4, 0.18, mat(pick(random, [0x1f2937, 0x7c3aed, 0x0f766e, 0x9a3412]), { roughness: 1 }), 0.62, 0, depth / 2 + 0.2, 0.3);
    bag.rotation.x = -0.15;
  }
  return group;
}
// Desks back to back in `columns` pairs with a felt divider; `seats` marks which chairs are occupied.
export function deskPod(parent, x, z, ry, options, seats = [], shirts = [], columns = 2) {
  const group = node(parent, x, 0, z, ry), width = options.width ?? 1.6, span = width * columns;
  for (let column = 0; column < columns; column += 1) for (const [row, dz, turn] of [[0, 0.42, 0], [1, -0.42, Math.PI]]) {
    const index = row * columns + column;
    workstation(group, -span / 2 + width * (column + 0.5), dz, turn, { ...options, occupied: seats[index] ?? true, shirt: shirts[index] ?? options.shirt });
  }
  block(group, span, 0.42, 0.04, mat(options.divider ?? 0x5b7a6b, { roughness: 1 }), 0, 0.84, 0);
  block(group, span, 0.02, 0.06, C.metal, 0, 1.26, 0);
  block(group, 0.3, 0.02, 0.3, mat(0x6b7280), span / 2 - 0.3, 0, 0);
  return group;
}

// Floor-to-head glass partition between two [x, z] points, with a frosted privacy band.
export function partition(parent, from, to, height = 2.6, { frost = true, frame = C.metal } = {}) {
  const dx = to[0] - from[0], dz = to[1] - from[1], length = Math.hypot(dx, dz);
  const group = node(parent, (from[0] + to[0]) / 2, 0, (from[1] + to[1]) / 2, Math.atan2(-dz, dx));
  block(group, length, 0.06, 0.08, frame, 0, 0, 0);
  block(group, length, 0.08, 0.1, frame, 0, height - 0.08, 0);
  block(group, length, height - 0.14, 0.03, glass(0xdff3ff, 0.16), 0, 0.06, 0);
  if (frost) block(group, length, 0.2, 0.034, mat(0xffffff, { transparent: true, opacity: 0.5, depthWrite: false }), 0, 1.25, 0);
  const count = Math.max(1, Math.round(length / 1.4));
  for (let index = 0; index <= count; index += 1) block(group, 0.05, height, 0.08, frame, -length / 2 + index * length / count, 0, 0);
  return group;
}
