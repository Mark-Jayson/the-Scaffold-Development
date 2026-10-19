import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mat, screen, node, bake, rng } from './kit.js';
import { HEX_RADIUS, FLOOR_Y, platform, hexRoom, updateCutaway, bridge, ghostHex, pulseGhosts } from './room.js';
import { sign } from './textures.js';
import { crafts } from './crafts.js';
import tree from './habitats/tree.js';
import studios from './habitats/studios.js';
import startup from './habitats/startup.js';
import research from './habitats/research.js';
import maker from './habitats/maker.js';
import planning from './habitats/planning.js';

const sceneHost = document.querySelector('#scene');
const labelHost = document.querySelector('#labels');
const scene = new THREE.Scene();
const BACKDROP = 0x044794;
scene.background = new THREE.Color(BACKDROP);
scene.fog = new THREE.FogExp2(BACKDROP, 0.0015);

const HEX_STEP_X = (HEX_RADIUS + 0.32) * 1.5;
const HEX_STEP_Z = Math.sqrt(3) * (HEX_RADIUS + 0.32);
const hexAt = (column, row) => new THREE.Vector3(HEX_STEP_X * column, 0, HEX_STEP_Z * (row + column / 2));
// Looking square-on to a hex edge keeps all three back walls of every room in view.
const VIEW_ANGLE = Math.PI / 3;
const CAMERA_OFFSET = new THREE.Vector3(Math.sin(VIEW_ANGLE) * 154, 124, Math.cos(VIEW_ANGLE) * 154);
// Ground directions that read as screen-right and toward-the-viewer in the default view.
const SCREEN_RIGHT = new THREE.Vector3(Math.cos(VIEW_ANGLE), 0, -Math.sin(VIEW_ANGLE));
const SCREEN_NEAR = new THREE.Vector3(Math.sin(VIEW_ANGLE), 0, Math.cos(VIEW_ANGLE));
const CLUSTER = new THREE.Vector3(0, 0, HEX_STEP_Z / 2);
const onScreen = (right, near) => CLUSTER.clone().addScaledVector(SCREEN_RIGHT, right).addScaledVector(SCREEN_NEAR, near);
const CENTER = onScreen(0, -10).setY(FLOOR_Y);
const ENDEAVOR_SCALE = 0.55;
// The honeycomb sits a little right of centre; `slotAt` is where each of its cells lands.
const slotAt = (column, row) => hexAt(column, row).addScaledVector(SCREEN_RIGHT, 6);
const SUN = new THREE.Vector3(-65, 100, 75);

const camera = new THREE.OrthographicCamera(-65, 65, 44, -44, 0.1, 1000);
camera.position.copy(CENTER).add(CAMERA_OFFSET);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
sceneHost.append(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(CENTER);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = true;
controls.minZoom = 0.58;
controls.maxZoom = 8;
controls.minPolarAngle = 0.4;
controls.maxPolarAngle = 1.25;

scene.add(new THREE.HemisphereLight(0xe9edff, 0x5e5952, 1.9));
const sunlight = new THREE.DirectionalLight(0xffe8c4, 3.1);
sunlight.position.copy(CENTER).add(SUN);
sunlight.target.position.copy(CENTER);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(4096, 4096);
Object.assign(sunlight.shadow.camera, { left: -82, right: 82, top: 82, bottom: -82, near: 20, far: 360 });
sunlight.shadow.bias = -0.0004;
sunlight.shadow.normalBias = 0.03;
scene.add(sunlight, sunlight.target);

// Endeavors float apart from the honeycomb at a smaller scale; `slot` is the cell each one left behind.
const habitats = [
  { ...tree, slot: slotAt(-1, 0), pos: onScreen(4, -71), endeavor: true, seed: 101 },
  { ...studios, slot: slotAt(0, 0), seed: 202 },
  { ...startup, slot: slotAt(1, 0), seed: 303 },
  { ...research, slot: slotAt(-1, 1), seed: 404 },
  { ...maker, slot: slotAt(0, 1), pos: onScreen(-47, 35), endeavor: true, opensCrafts: true, seed: 505 },
  { ...planning, slot: slotAt(1, 1), pos: onScreen(51, 40), endeavor: true, seed: 606 },
];
const seams = [['tree', 'studios'], ['studios', 'startup'], ['tree', 'research'], ['studios', 'maker'], ['startup', 'planning'], ['research', 'maker'], ['maker', 'planning']];
const byId = id => habitats.find(habitat => habitat.id === id);
// Doorways follow the original honeycomb so every interior still lines up; only cluster neighbours get bridges.
const sideToward = (from, to) => (Math.round(Math.atan2(to.x - from.x, to.z - from.z) / (Math.PI / 3)) + 6) % 6;
const doorsOf = id => seams.filter(pair => pair.includes(id)).map(([a, b]) => (a === id ? sideToward(byId(a).slot, byId(b).slot) : sideToward(byId(b).slot, byId(a).slot)));
const ENDEAVORS_ANCHOR = onScreen(0, 64);
const exitSign = screen(sign('EXIT ➜', '#0f7a3d', '#ffffff', 256, 80, 46), { emissiveIntensity: 0.9 });
const hexColor = color => `#${color.toString(16).padStart(6, '0')}`;

const sectors = [];
for (const habitat of habitats) {
  const sector = new THREE.Group(), scale = habitat.endeavor ? ENDEAVOR_SCALE : 1;
  sector.position.copy(habitat.pos ?? habitat.slot);
  sector.scale.setScalar(scale);
  const trim = mat(habitat.accent, { emissive: habitat.accent, emissiveIntensity: 0.35, roughness: 0.5 });
  const shell = habitat.endeavor ? undefined : habitat.accent;
  platform(sector, trim, shell);
  const content = node(sector, 0, FLOOR_Y, 0);
  const room = hexRoom(content, { trim, shell, doors: doorsOf(habitat.id), signMaterial: exitSign, ...habitat.room() });
  const ticks = [];
  habitat.build({ content, room, random: rng(habitat.seed), tick: callback => ticks.push(callback) });
  bake(content);
  room.bake();

  const hit = new THREE.Mesh(new THREE.CylinderGeometry(HEX_RADIUS, HEX_RADIUS, 9, 6), new THREE.MeshBasicMaterial());
  hit.rotation.y = Math.PI / 6;
  hit.position.y = 3;
  hit.visible = false;
  hit.userData.sector = sector;
  sector.add(hit);

  const label = document.createElement('button');
  label.type = 'button';
  label.className = habitat.endeavor ? 'endeavor-name' : 'habitat-label';
  label.style.setProperty('--accent', hexColor(habitat.accent));
  const title = document.createElement('strong');
  title.textContent = habitat.name;
  const detail = document.createElement('span');
  detail.textContent = habitat.caption;
  label.append(title, detail);
  label.addEventListener('click', () => focus(sector));
  label.addEventListener('pointerenter', () => setHover(sector));
  label.addEventListener('pointerleave', () => setHover(undefined));
  labelHost.append(label);

  sector.userData = { id: habitat.id, room, ticks, trim, label, hit, scale, opensCrafts: habitat.opensCrafts, labelHeight: (habitat.labelHeight ?? 14.5) * scale };
  scene.add(sector);
  sectors.push(sector);
  if (habitat.endeavor) ghostHex(scene, habitat.slot);
}
const sectorOf = id => sectors.find(sector => sector.userData.id === id);
seams.filter(pair => pair.every(id => !byId(id).endeavor)).forEach(([one, two]) => bridge(scene, sectorOf(one).position, sectorOf(two).position, byId(one).accent));

const endeavorsTitle = document.createElement('p');
endeavorsTitle.className = 'endeavors-title';
endeavorsTitle.textContent = 'Endeavors';
labelHost.append(endeavorsTitle);

// Unlit so the floor shows exactly the backdrop colour; a shadow-only layer on top keeps the honeycomb grounded.
// That layer has holes where the Endeavors' shadows would land, so they float without a drop shadow.
const groundShape = new THREE.CircleGeometry(220, 96);
const ground = new THREE.Mesh(groundShape, new THREE.MeshBasicMaterial({ color: BACKDROP, toneMapped: false, fog: false }));
const shadowCatcher = new THREE.Shape().absarc(0, 0, 220, 0, Math.PI * 2);
for (const habitat of habitats.filter(entry => entry.endeavor)) {
  const drop = habitat.pos.clone().addScaledVector(SUN, -(8 + 2.5) / SUN.y);
  shadowCatcher.holes.push(new THREE.Path().absarc(drop.x, -drop.z, 14, 0, Math.PI * 2, true));
}
const groundShadow = new THREE.Mesh(new THREE.ShapeGeometry(shadowCatcher, 48), new THREE.ShadowMaterial({ opacity: 0.32, fog: false }));
for (const [layer, height] of [[ground, -8], [groundShadow, -7.98]]) {
  layer.rotation.x = -Math.PI / 2;
  layer.position.y = height;
  scene.add(layer);
}
groundShadow.receiveShadow = true;

const starGeometry = new THREE.BufferGeometry();
const starPositions = [];
const random = rng(4201);
for (let index = 0; index < 1800; index += 1) {
  const randomA = random(), randomB = random();
  const theta = randomA * Math.PI * 2, phi = Math.acos(2 * randomB - 1), radius = 330 + ((randomA + randomB) % 1) * 110;
  starPositions.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xe3e7f4, size: 1.05, sizeAttenuation: false, transparent: true, opacity: 0.78 })));

const earth = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 24), mat(0x477abd, { flatShading: true }));
earth.position.set(-88, 44, -82);
scene.add(earth);
const earthGlow = new THREE.PointLight(0x7da8ff, 1.4, 48);
earthGlow.position.copy(earth.position);
scene.add(earthGlow);

/* Hover, focus and labels */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const hitTargets = sectors.map(sector => sector.userData.hit);
let hovered, focused, flight, pressedAt, dragging = false;
function setHover(sector) {
  if (hovered === sector) return;
  if (hovered) {
    hovered.userData.trim.emissiveIntensity = 0.35;
    hovered.userData.label.classList.remove('is-hovered');
  }
  hovered = sector;
  if (hovered) {
    hovered.userData.trim.emissiveIntensity = 1.2;
    hovered.userData.label.classList.add('is-hovered');
  }
  renderer.domElement.style.cursor = hovered ? 'pointer' : '';
}
function pick(event) {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(hitTargets, false)[0]?.object.userData.sector;
}
// Time-based so a throttled background tab still lands where it should.
function flyTo(target, zoom) {
  flight = { from: controls.target.clone(), to: target.clone(), zoomFrom: camera.zoom, zoomTo: zoom, start: performance.now() };
}
function focus(sector) {
  focused = sector;
  sectors.forEach(item => item.userData.label.classList.toggle('is-dimmed', Boolean(sector) && item !== sector));
  endeavorsTitle.classList.toggle('is-dimmed', Boolean(sector));
  if (sector) flyTo(sector.position.clone().setY(FLOOR_Y * sector.userData.scale), 2.3 / sector.userData.scale);
  else flyTo(CENTER, 1);
  if (sector?.userData.opensCrafts) crafts.open();
}
renderer.domElement.addEventListener('pointermove', event => setHover(pick(event)));
renderer.domElement.addEventListener('pointerdown', event => {
  pressedAt = [event.clientX, event.clientY];
  dragging = true;
});
renderer.domElement.addEventListener('pointerup', event => {
  dragging = false;
  if (!pressedAt || Math.hypot(event.clientX - pressedAt[0], event.clientY - pressedAt[1]) > 5) return;
  const sector = pick(event);
  focus(sector && (sector !== focused || sector.userData.opensCrafts) ? sector : undefined);
});
addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!crafts.escape()) focus(undefined);
});
controls.addEventListener('start', () => {
  if (dragging) flight = undefined;
});

const anchor = new THREE.Vector3();
function placeLabels() {
  const width = sceneHost.clientWidth, height = sceneHost.clientHeight;
  for (const sector of sectors) {
    anchor.copy(sector.position);
    anchor.y += sector.userData.labelHeight;
    anchor.project(camera);
    sector.userData.label.style.transform = `translate(${((anchor.x + 1) / 2) * width}px, ${((1 - anchor.y) / 2) * height}px) translate(-50%, -100%)`;
  }
  anchor.copy(ENDEAVORS_ANCHOR).project(camera);
  endeavorsTitle.style.transform = `translate(${((anchor.x + 1) / 2) * width}px, ${((1 - anchor.y) / 2) * height}px) translate(-50%, -50%)`;
}

function resize() {
  // Tall enough for the honeycomb plus the three Endeavors, and wide enough on narrow screens.
  const width = sceneHost.clientWidth, height = sceneHost.clientHeight, aspect = width / height, frustum = Math.max(104, 152 / aspect);
  camera.left = -frustum * aspect / 2;
  camera.right = frustum * aspect / 2;
  camera.top = frustum / 2;
  camera.bottom = -frustum / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
new ResizeObserver(resize).observe(sceneHost);
resize();

const clock = new THREE.Clock();
const view = new THREE.Vector3();
const shift = new THREE.Vector3();
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function animate() {
  const delta = Math.min(clock.getDelta(), 0.1), time = clock.elapsedTime;
  if (flight) {
    const progress = Math.min(1, (performance.now() - flight.start) / 1100), eased = ease(progress);
    shift.lerpVectors(flight.from, flight.to, eased).sub(controls.target);
    controls.target.add(shift);
    camera.position.add(shift);
    camera.zoom = THREE.MathUtils.lerp(flight.zoomFrom, flight.zoomTo, eased);
    camera.updateProjectionMatrix();
    if (progress === 1) flight = undefined;
  }
  controls.update();
  requestAnimationFrame(animate);
  // The craft board covers the whole screen, so the scene rests while it's open.
  if (crafts.covering()) return;
  view.subVectors(camera.position, controls.target).setY(0).normalize();
  for (const sector of sectors) {
    updateCutaway(sector.userData.room, view, delta);
    sector.userData.ticks.forEach(callback => callback(time, delta));
  }
  earth.rotation.y = time * 0.025;
  pulseGhosts(time);
  placeLabels();
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
