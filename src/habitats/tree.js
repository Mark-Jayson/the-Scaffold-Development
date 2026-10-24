import * as THREE from 'three';
import { C, mat, glow, screen, node, block, tube, ball, blob, plane, disc, rod, pick, range, bake } from '../kit.js';
import { INNER, sideNormal, sideAngle, tiled } from '../room.js';
import * as T from '../textures.js';
import { person, plantBed, plantPot } from '../props.js';

const SHIRTS = [0x7fb069, 0xe8d5a3, 0x6c8ebf, 0xd97b66, 0xf2f2ee, 0x8e7cc3, 0x4f9d8f];
const LIME = 0x96e01a;

function bench(parent, x, z, ry) {
  const group = node(parent, x, 0, z, ry), slat = mat(0xa8774e);
  for (const side of [-1, 1]) {
    block(group, 0.08, 0.46, 0.5, C.dark, side * 0.75, 0, 0);
    rod(group, [side * 0.75, 0.46, -0.22], [side * 0.75, 0.95, -0.32], 0.03, C.dark, 6);
  }
  for (let index = 0; index < 3; index += 1) block(group, 1.7, 0.04, 0.13, slat, 0, 0.46, -0.16 + index * 0.16);
  for (let index = 0; index < 2; index += 1) {
    const back = block(group, 1.7, 0.12, 0.035, slat, 0, 0.62 + index * 0.17, -0.27 - index * 0.025);
    back.rotation.x = -0.2;
  }
  return group;
}

function wateringCan(parent, color = 0x3f9b6a) {
  const body = mat(color, { metalness: 0.3, roughness: 0.5 });
  tube(parent, 0.1, 0.11, 0.2, body, 0, -0.22, 0.05, 12);
  rod(parent, [0, -0.12, 0.14], [0, 0.0, 0.34], 0.02, body, 6);
  rod(parent, [0, 0, -0.02], [0, -0.04, 0.1], 0.015, body, 6);
}

function hydroTower(parent, x, z, ry, random) {
  const group = node(parent, x, 0, z, ry), frame = mat(0xe6e8ec, { metalness: 0.4, roughness: 0.4 }), led = glow(0xd36bff, 1.8);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) block(group, 0.05, 2.4, 0.05, frame, sx * 0.62, 0, sz * 0.26);
  for (let shelf = 0; shelf < 4; shelf += 1) {
    const y = 0.2 + shelf * 0.56;
    block(group, 1.25, 0.06, 0.55, mat(0xf4f5f7), 0, y, 0);
    block(group, 1.1, 0.025, 0.06, led, 0, y + 0.5, 0);
    for (let pot = 0; pot < 5; pot += 1) {
      const leaf = blob(group, range(random, 0.08, 0.12), pick(random, [mat(0x8fd16a, { flatShading: true }), mat(0x6dbb4f, { flatShading: true }), mat(0xa9dd5b, { flatShading: true })]), -0.48 + pot * 0.24, y + 0.15, (random() - 0.5) * 0.18, 0);
      leaf.scale.y = 0.7;
    }
  }
  tube(group, 0.18, 0.18, 0.3, mat(0x3b82f6, { transparent: true, opacity: 0.6 }), 0.35, 0, 0.42, 12);
  return group;
}

export default {
  id: 'tree',
  name: 'Tree',
  accent: 0xa6e04a,
  labelHeight: 18.5,
  room: () => ({ floor: tiled(T.grass(), 3.2), wall: mat(0xf2f2ec), glassSides: [0, 1, 2, 3, 4, 5], glassFrom: 0.9, mullion: mat(0xf8f8f4, { metalness: 0.2 }) }),
  build({ content, room, random, tick }) {
    const bark = mat(0x6e4b33, { flatShading: true, roughness: 0.95 }), stone = mat(0x9b968b, { flatShading: true });
    const deckTexture = T.planks([170, 120, 78]);
    deckTexture.wrapS = deckTexture.wrapT = THREE.RepeatWrapping;
    deckTexture.repeat.set(3, 3);
    const deck = mat(0xffffff, { map: deckTexture, roughness: 0.8 });
    const doors = room.walls.filter(wall => wall.hasDoor).map(wall => wall.side);

    /* Central planter with seating ring */
    tube(content, 6.05, 6.1, 0.12, deck, 0, 0, 0, 48);
    tube(content, 4.05, 4.15, 0.42, stone, 0, 0.12, 0, 22);
    tube(content, 4.22, 4.22, 0.06, mat(0xb98a5a), 0, 0.54, 0, 48);
    disc(content, 3.85, mat(0x4f8a35, { roughness: 1 }), 0, 0.605, 0, 40);
    for (let index = 0; index < 22; index += 1) {
      const angle = random() * Math.PI * 2, radius = range(random, 1.4, 3.5);
      const tuft = blob(content, range(random, 0.18, 0.34), pick(random, [mat(0x5f9e3d, { flatShading: true }), mat(0x77b84a, { flatShading: true }), mat(0x4b8a33, { flatShading: true })]), Math.sin(angle) * radius, 0.62, Math.cos(angle) * radius, 0);
      tuft.scale.y = 0.55;
    }
    for (let index = 0; index < 7; index += 1) {
      const angle = random() * Math.PI * 2, radius = range(random, 2.2, 3.4);
      tube(content, 0.02, 0.025, 0.12, C.white, Math.sin(angle) * radius, 0.6, Math.cos(angle) * radius, 6);
      ball(content, 0.07, mat(0xd9583b), Math.sin(angle) * radius, 0.74, Math.cos(angle) * radius, 8, 5).scale.y = 0.5;
    }
    const plaque = plane(content, 0.7, 0.24, screen(T.sign('FICUS LUNARIS · EST. 2031', '#3b2a1c', '#f3e3c3', 512, 96, 30), { emissiveIntensity: 0.15 }), Math.sin(0.25) * 4.17, 0.33, Math.cos(0.25) * 4.17, 0.25);
    plaque.translateZ(0.02);

    /* Trunk, roots and branches */
    for (let index = 0; index < 11; index += 1) {
      const angle = index * Math.PI * 2 / 11 + range(random, -0.2, 0.2), reach = range(random, 1.3, 2.1), bend = range(random, -0.35, 0.35);
      const knee = [Math.sin(angle) * reach, 0.66, Math.cos(angle) * reach];
      rod(content, [Math.sin(angle) * 0.55, range(random, 1.0, 1.35), Math.cos(angle) * 0.55], knee, range(random, 0.2, 0.28), bark, 6, 0.1);
      rod(content, knee, [Math.sin(angle + bend) * (reach + 0.9), 0.6, Math.cos(angle + bend) * (reach + 0.9)], 0.1, bark, 5, 0.03);
    }
    rod(content, [0, 0.58, 0], [0.05, 1.6, 0.03], 1.2, bark, 10, 0.86);
    rod(content, [0, 0.55, 0], [0.15, 3.2, 0.1], 0.9, bark, 10, 0.64);
    ball(content, 0.64, bark, 0.15, 3.2, 0.1, 10, 8);
    rod(content, [0.15, 3.2, 0.1], [-0.05, 5.6, 0.2], 0.64, bark, 10, 0.48);
    ball(content, 0.48, bark, -0.05, 5.6, 0.2, 10, 8);
    const branches = [
      [[0, 4.4, 0], [3.4, 7.1, 0.9], 0.36], [[0, 4.9, 0], [-2.9, 7.5, 1.8], 0.34], [[0, 5.3, 0], [-1.1, 8.0, -3.1], 0.32],
      [[0, 5.1, 0], [1.9, 7.7, -2.7], 0.3], [[-0.05, 5.6, 0.2], [0.2, 9.1, 0.4], 0.44], [[0, 4.2, 0], [-3.5, 6.3, -0.9], 0.3], [[0, 5.0, 0], [0.9, 7.2, 3.3], 0.3],
    ];
    const tips = [];
    for (const [from, to, radius] of branches) {
      rod(content, from, to, radius, bark, 7, radius * 0.4);
      const direction = new THREE.Vector3(to[0] - from[0], 0, to[2] - from[2]).normalize();
      for (const turn of [-0.6, 0.6]) {
        const twig = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), turn);
        const end = [to[0] + twig.x * 1.3, to[1] + 0.9, to[2] + twig.z * 1.3];
        rod(content, to, end, radius * 0.4, bark, 5, 0.04);
        tips.push(end);
      }
      tips.push(to);
    }

    /* Translucent lime canopy (sways gently) */
    const canopy = node(content);
    canopy.userData.live = true;
    const leafA = mat(LIME, { transparent: true, opacity: 0.5, emissive: 0x4f9a00, emissiveIntensity: 0.45, flatShading: true, depthWrite: false, roughness: 0.6 });
    const leafB = mat(0x7fd400, { transparent: true, opacity: 0.38, emissive: 0x3f8a00, emissiveIntensity: 0.4, flatShading: true, depthWrite: false, roughness: 0.6 });
    const fleck = mat(0xa8f020, { transparent: true, opacity: 0.85, emissive: 0x5aa800, emissiveIntensity: 0.5, flatShading: true, depthWrite: false, side: THREE.DoubleSide });
    const clumps = [[0.2, 10.4, 0.4, 2.7]];
    for (const tip of tips) clumps.push([tip[0] + range(random, -0.4, 0.4), tip[1] + range(random, 0.2, 0.9), tip[2] + range(random, -0.4, 0.4), range(random, 1.5, 2.2)]);
    for (const [x, y, z, radius] of clumps) {
      blob(canopy, radius, leafA, x, y, z, 1);
      for (let index = 0; index < 2; index += 1) blob(canopy, radius * range(random, 0.55, 0.8), leafB, x + range(random, -1, 1), y + range(random, -0.4, 0.7), z + range(random, -1, 1), 1);
      for (let index = 0; index < 9; index += 1) {
        const direction = new THREE.Vector3(random() - 0.5, random() * 0.9 - 0.2, random() - 0.5).normalize();
        const leaf = new THREE.Mesh(new THREE.TetrahedronGeometry(range(random, 0.1, 0.16)), fleck);
        leaf.position.set(x + direction.x * radius * 0.98, y + direction.y * radius * 0.98, z + direction.z * radius * 0.98);
        leaf.rotation.set(random() * 3, random() * 3, random() * 3);
        canopy.add(leaf);
      }
    }
    const lanternLight = glow(0xffd27a, 2.2);
    for (const [x, y, z] of [[2.2, 6.3, 0.6], [-2.0, 6.6, 1.2], [-0.7, 6.9, -2.1], [1.3, 6.7, -1.9], [-2.4, 5.6, -0.6], [0.6, 6.4, 2.4]]) {
      rod(content, [x, y + 0.75, z], [x, y + 0.12, z], 0.006, C.dark, 3);
      ball(content, 0.12, lanternLight, x, y, z, 10, 8);
      tube(content, 0.06, 0.06, 0.04, C.dark, x, y + 0.11, z, 8);
    }
    bake(canopy);
    const glowLight = new THREE.PointLight(0xb8ff4a, 34, 15, 2);
    glowLight.position.set(0, 6.2, 0);
    content.add(glowLight);
    tick(time => {
      canopy.rotation.z = Math.sin(time * 0.55) * 0.011;
      canopy.rotation.x = Math.cos(time * 0.43) * 0.008;
    });

    /* Pollen motes drifting up through the canopy */
    const moteCount = 70, motes = new Float32Array(moteCount * 3);
    for (let index = 0; index < moteCount; index += 1) {
      const angle = random() * Math.PI * 2, radius = Math.sqrt(random()) * 5.5;
      motes.set([Math.sin(angle) * radius, range(random, 1, 11.5), Math.cos(angle) * radius], index * 3);
    }
    const moteGeometry = new THREE.BufferGeometry();
    moteGeometry.setAttribute('position', new THREE.BufferAttribute(motes, 3));
    content.add(new THREE.Points(moteGeometry, new THREE.PointsMaterial({ color: 0xe6ff9a, size: 2.6, sizeAttenuation: false, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })));
    tick((time, delta) => {
      for (let index = 0; index < moteCount; index += 1) {
        let y = motes[index * 3 + 1] + delta * 0.35;
        if (y > 11.5) y = 1;
        motes[index * 3 + 1] = y;
        motes[index * 3] += Math.sin(time * 0.8 + index) * delta * 0.12;
      }
      moteGeometry.attributes.position.needsUpdate = true;
    });

    /* Boardwalks from every doorway to the deck */
    for (const side of doors) {
      const [nx, nz] = sideNormal(side);
      for (let distance = 6.2; distance < INNER + 0.3; distance += 0.33) {
        const shade = range(random, -0.06, 0.06);
        block(content, 1.95, 0.08, 0.27, mat(new THREE.Color(0.62 + shade, 0.44 + shade, 0.29 + shade).getHex()), nx * distance, 0.0, nz * distance, sideAngle(side));
      }
      for (const edge of [-1, 1]) {
        const tx = Math.cos(sideAngle(side)), tz = -Math.sin(sideAngle(side));
        for (const distance of [7, 9.6]) {
          const x = nx * distance + tx * edge * 1.25, z = nz * distance + tz * edge * 1.25;
          rod(content, [x, 0, z], [x, 0.75, z], 0.035, C.dark, 6);
          ball(content, 0.09, glow(0xfff0c4, 1.6), x, 0.8, z, 8, 6);
        }
      }
    }
    for (const angle of [1.75, 2.9, 4.1, 5.2]) {
      const x = Math.sin(angle) * 5.85, z = Math.cos(angle) * 5.85;
      rod(content, [x, 0.12, z], [x, 1.3, z], 0.04, C.dark, 6);
      ball(content, 0.14, glow(0xfff0c4, 1.8), x, 1.4, z, 10, 8);
    }

    /* Pond with lily pads and koi */
    const pond = node(content, -6.9, 0, 4.4);
    disc(pond, 2.1, mat(0x2a4a3a), 0, 0.012, 0, 32);
    disc(pond, 1.95, mat(0x3b8fb5, { transparent: true, opacity: 0.72, roughness: 0.08, metalness: 0.2, emissive: 0x0d3550, emissiveIntensity: 0.4 }), 0, 0.09, 0, 32);
    for (const [x, z, color] of [[0.4, 0.3, 0xf08a24], [-0.6, -0.5, 0xf4f1e8], [0.2, -0.8, 0xe8562c]]) {
      const koi = ball(pond, 0.12, mat(color), x, 0.05, z, 8, 6);
      koi.scale.set(0.5, 0.4, 1.4);
      koi.rotation.y = random() * 3;
    }
    for (let index = 0; index < 6; index += 1) {
      const angle = random() * Math.PI * 2, radius = range(random, 0.4, 1.6);
      disc(pond, range(random, 0.16, 0.26), mat(0x3f8f3a), Math.sin(angle) * radius, 0.1, Math.cos(angle) * radius, 10);
      if (index % 3 === 0) ball(pond, 0.07, mat(0xf9a8d4), Math.sin(angle) * radius, 0.15, Math.cos(angle) * radius, 8, 5);
    }
    for (let index = 0; index < 18; index += 1) {
      const angle = index / 18 * Math.PI * 2, size = range(random, 0.22, 0.38);
      blob(pond, size, pick(random, [stone, mat(0x8a857a, { flatShading: true }), mat(0xa9a397, { flatShading: true })]), Math.sin(angle) * 2.05, size * 0.3, Math.cos(angle) * 2.05, 0).scale.y = 0.55;
    }
    for (let index = 0; index < 7; index += 1) {
      const x = -1.7 + random() * 0.6, z = 0.7 + index * 0.13;
      rod(pond, [x, 0, z], [x + range(random, -0.1, 0.1), range(random, 0.8, 1.2), z], 0.012, mat(0x5a8f3a), 4);
      if (index % 2) tube(pond, 0.03, 0.03, 0.16, mat(0x6b4226), x, range(random, 0.7, 0.9), z, 6);
    }
    bench(content, -4.0, 8.4, -2.45);
    person(content, -4.0, 8.4, -2.45, { random, pose: 'read', shirt: 0xd97b66, y: -0.07, holding: hand => block(hand, 0.22, 0.02, 0.16, mat(0x2f5d8a), 0, 0, 0.06) });

    /* Raised beds, hydroponics and potting bench along the back */
    plantBed(room.frame(3), -3, 0.7, 0, 4.2, 1.0, random, 'greens');
    plantBed(room.frame(3), 3, 0.7, 0, 4.2, 1.0, random, 'tomato');
    person(room.frame(3), 2.4, 1.75, Math.PI, { random, pose: 'cup', shirt: 0x7fb069, cap: 0xe8d5a3, apron: 0x6b8f4e, holding: hand => wateringCan(hand) });
    const reel = node(room.decor(3), 0, 1.0, 0);
    block(reel, 0.5, 0.5, 0.06, C.steel, 0, 0, 0.03);
    const hose = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 6, 18), mat(0x2e8b57));
    hose.position.set(0, 0.25, 0.14);
    reel.add(hose);
    hydroTower(room.frame(4), -3.4, 0.35, 0, random);
    hydroTower(room.frame(4), 3.4, 0.35, 0, random);
    const potting = node(room.frame(4), 0, 0, 0.45);
    block(potting, 2.0, 0.05, 0.75, mat(0xa8774e), 0, 0.86, 0);
    for (const sx of [-1, 1]) block(potting, 0.06, 0.86, 0.65, mat(0x8a6140), sx * 0.92, 0, 0);
    block(potting, 1.84, 0.04, 0.6, mat(0x8a6140), 0, 0.25, 0);
    for (const x of [-0.7, -0.45, -0.2]) plantPot(potting, x, -0.1, 0.5, 'bush', 0.91);
    plantPot(potting, 0.15, -0.15, 0.65, 'fern', 0.91);
    block(potting, 0.4, 0.3, 0.25, mat(0x6b4b2e), 0.62, 0.91, -0.1, 0.2);
    block(potting, 0.5, 0.36, 0.3, mat(0x7b5636), -0.3, 0.29, 0, 0.1);
    const can = node(potting, 0.55, 1.13, 0.2, -0.6);
    wateringCan(can, 0xe0a33a);
    for (const x of [-0.15, 0.05]) block(potting, 0.08, 0.02, 0.17, mat(0x84cc16), x, 0.91, 0.24, 0.3);

    /* Flower bed, tools and wheelbarrow by the pond */
    plantBed(room.frame(5), 3.1, 0.6, 0, 3.6, 0.9, random, 'flowers');
    for (const [x, lean] of [[-1.8, 0.16], [-2.2, -0.12]]) {
      rod(room.frame(5), [x, 0, 0.35], [x + lean, 1.55, 0.06], 0.025, C.woodLight, 6);
    }
    block(room.frame(5), 0.28, 0.06, 0.04, C.steel, -1.8, 0, 0.38);
    const barrow = node(room.frame(5), -4.0, 0, 1.2, 0.5);
    block(barrow, 0.62, 0.32, 0.9, mat(0x2f855a, { metalness: 0.4 }), 0, 0.3, 0);
    block(barrow, 0.5, 0.06, 0.78, C.soil, 0, 0.58, 0);
    ball(barrow, 0.16, C.rubber, 0, 0.16, 0.55, 10, 8).scale.x = 0.4;
    for (const sx of [-1, 1]) rod(barrow, [sx * 0.22, 0.4, -0.3], [sx * 0.3, 0.55, -0.95], 0.025, C.woodLight, 6);

    /* People enjoying the tree */
    for (const [angle, pose, shirt, holding] of [[0.95, 'read', 0xe8d5a3, hand => block(hand, 0.2, 0.025, 0.15, mat(0xb5473a), 0, 0, 0.05)], [1.65, 'type', 0x6c8ebf], [-0.35, 'sit', 0xf2f2ee], [-0.85, 'sit', 0x8e7cc3]]) {
      const seated = person(content, Math.sin(angle) * 4.05, Math.cos(angle) * 4.05, angle, { random, pose, shirt, y: 0.12, holding });
      if (pose === 'type') block(content, 0.38, 0.02, 0.27, C.metal, Math.sin(angle) * 4.55, 0.7, Math.cos(angle) * 4.55, angle);
      if (angle < 0) seated.rotation.y += angle > -0.5 ? -0.5 : 0.45;
    }

    const walker = person(content, 0, 5.25, Math.PI / 2, { random, pose: 'stand', shirt: 0x4f9d8f, y: 0.12 });
    walker.userData.live = true;
    const rig = walker.userData.rig;
    tick(time => {
      const angle = time * 0.11 + 2.2, stride = Math.sin(time * 5.2);
      walker.position.set(Math.sin(angle) * 5.25, 0.12, Math.cos(angle) * 5.25);
      walker.rotation.y = angle + Math.PI / 2;
      rig.legs[0].rotation.x = stride * 0.42;
      rig.legs[1].rotation.x = -stride * 0.42;
      rig.arms[0].rotation.x = -stride * 0.32;
      rig.arms[1].rotation.x = stride * 0.32;
      rig.hips.position.y = 1.0 + Math.abs(Math.cos(time * 5.2)) * 0.03;
    });

    /* Butterflies */
    for (const [color, cx, cz, radius, speed] of [[0xf59e0b, 4.5, -7.5, 1.6, 0.7], [0x60a5fa, -5.5, -5, 1.4, 0.9], [0xf472b6, -2, 6.2, 1.8, 0.6], [0xfde047, 1.5, -1.5, 3.2, 0.5]]) {
      const butterfly = node(content);
      butterfly.userData.live = true;
      const wings = [-1, 1].map(side => {
        const hinge = node(butterfly);
        const panel = plane(hinge, 0.16, 0.13, mat(color, { side: THREE.DoubleSide, emissive: color, emissiveIntensity: 0.25 }), side * 0.08, 0, 0);
        panel.rotation.x = -Math.PI / 2;
        return hinge;
      });
      rod(butterfly, [0, 0, -0.06], [0, 0, 0.06], 0.012, C.black, 4);
      tick(time => {
        const t = time * speed + cx;
        butterfly.position.set(cx + Math.sin(t) * radius, 1.3 + Math.sin(t * 2.3) * 0.5 + (radius > 3 ? 3 : 0), cz + Math.cos(t * 1.3) * radius * 0.7);
        butterfly.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t * 1.3) * 0.9);
        const flap = Math.sin(time * 22 + cx) * 0.9;
        wings[0].rotation.z = flap;
        wings[1].rotation.z = -flap;
      });
    }

    /* Grass detail: tufts, wildflowers and sprinklers */
    const clear = (x, z) => {
      const radius = Math.hypot(x, z);
      if (radius < 6.5 || Math.hypot(x + 6.9, z - 4.4) < 2.6 || Math.hypot(x + 4, z - 8.4) < 1.3) return false;
      for (let side = 0; side < 6; side += 1) {
        const [nx, nz] = sideNormal(side), along = x * nx + z * nz, across = Math.abs(-x * nz + z * nx);
        if (along > INNER - 1.9) return false;
        if (doors.includes(side) && along > 0 && across < 1.6) return false;
      }
      return true;
    };
    for (let placed = 0, attempts = 0; placed < 150 && attempts < 2000; attempts += 1) {
      const x = range(random, -12, 12), z = range(random, -11, 11);
      if (!clear(x, z)) continue;
      placed += 1;
      if (placed % 4 === 0) ball(content, 0.05, mat(pick(random, [0xfef08a, 0xf9a8d4, 0xffffff, 0xc4b5fd])), x, 0.12, z, 6, 4);
      else rod(content, [x, 0, z], [x + range(random, -0.05, 0.05), range(random, 0.15, 0.28), z], 0.04, pick(random, [mat(0x5ea53c), mat(0x77b84a), mat(0x4b8a33)]), 4, 0.004);
    }
    for (const [x, z] of [[7.5, -4], [-8.8, -1.2], [5, 7.6], [-1.8, -8]]) {
      tube(content, 0.05, 0.06, 0.08, C.dark, x, 0, z, 8);
      tube(content, 0.015, 0.015, 0.06, C.steel, x, 0.08, z, 6);
    }
    for (let index = 0; index < 10; index += 1) {
      const x = range(random, -11, 11), z = range(random, -10, 10);
      if (clear(x, z)) blob(content, range(random, 0.18, 0.35), pick(random, [stone, mat(0x8a857a, { flatShading: true })]), x, 0.05, z, 0).scale.y = 0.55;
    }
  },
};
