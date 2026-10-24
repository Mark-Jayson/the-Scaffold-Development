import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mat, screen, node, bake, rng } from './kit.js';
import { HEX_RADIUS, FLOOR_Y, WALL_HEIGHT, platform, hexRoom, updateCutaway, bridge, ghostPath, ghostLanding, ROOM_END, HUB_END, enlarge, ghostHex, revealGhost, updateGhosts } from './room.js';
import { sign, canvasTexture } from './textures.js';
import { crafts } from './crafts.js';
import { planner } from './planner/planner.js';
import { blueprint } from './blueprint.js';
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

// Cells sit GAP apart so the walkways between them read as real paths.
const GAP = 10;
const HEX_STEP_Z = Math.sqrt(3) * (HEX_RADIUS + 0.32) + GAP;
const HEX_STEP_X = HEX_STEP_Z * Math.sqrt(3) / 2;
const hexAt = (column, row) => new THREE.Vector3(HEX_STEP_X * column, 0, HEX_STEP_Z * (row + column / 2));
// Looking square-on to a hex edge keeps all three back walls of every room in view.
const VIEW_ANGLE = Math.PI / 3;
const CAMERA_OFFSET = new THREE.Vector3(Math.sin(VIEW_ANGLE) * 154, 124, Math.cos(VIEW_ANGLE) * 154);
// Ground directions that read as screen-right and toward-the-viewer in the default view.
const SCREEN_RIGHT = new THREE.Vector3(Math.cos(VIEW_ANGLE), 0, -Math.sin(VIEW_ANGLE));
const SCREEN_NEAR = new THREE.Vector3(Math.sin(VIEW_ANGLE), 0, Math.cos(VIEW_ANGLE));
const SUN = new THREE.Vector3(-65, 100, 75);
// Furniture and people are drawn a little larger than life so interiors read from the overview.
const FURNISHING_SCALE = 1.15;

// Endeavors live outside the scene as blueprints pinned to a screen corner; `slot` is the empty cell each one left behind.
const habitats = [
  { ...tree, slot: hexAt(-1, 0), endeavor: 'top-right', seed: 101 },
  { ...studios, slot: hexAt(0, 0), seed: 202 },
  { ...startup, slot: hexAt(1, 0), seed: 303 },
  { ...research, slot: hexAt(-1, 1), seed: 404 },
  { ...maker, slot: hexAt(0, 1), endeavor: 'bottom-right', opensCrafts: true, seed: 505 },
  { ...planning, slot: hexAt(1, 1), endeavor: 'bottom-left', opensPlanner: true, seed: 606 },
];
const built = habitats.filter(habitat => !habitat.endeavor);
// The default view centres on the whole network of cells, nudged so the floor label stays in frame and Research clears the logo.
const CENTER = habitats.reduce((sum, habitat) => sum.add(habitat.slot), new THREE.Vector3()).divideScalar(habitats.length)
  .addScaledVector(SCREEN_NEAR, 2).addScaledVector(SCREEN_RIGHT, -2).setY(FLOOR_Y);

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

const seams = [['tree', 'studios'], ['studios', 'startup'], ['tree', 'research'], ['studios', 'maker'], ['startup', 'planning'], ['research', 'maker'], ['maker', 'planning']];
const byId = id => habitats.find(habitat => habitat.id === id);
// Doorways follow the original honeycomb so every interior still lines up; each one opens onto a walkway.
const sideToward = (from, to) => (Math.round(Math.atan2(to.x - from.x, to.z - from.z) / (Math.PI / 3)) + 6) % 6;
const doorsOf = id => seams.filter(pair => pair.includes(id)).map(([a, b]) => (a === id ? sideToward(byId(a).slot, byId(b).slot) : sideToward(byId(b).slot, byId(a).slot)));
const exitSign = screen(sign('EXIT ➜', '#0f7a3d', '#ffffff', 256, 80, 46), { emissiveIntensity: 0.9 });
const hexColor = color => `#${color.toString(16).padStart(6, '0')}`;

// "Endeavors" is painted on the floor of the most open empty cell, so it orbits and zooms with the scene.
const TITLE_CELL = 'planning';
const blueprints = [], ghostAreas = [];
for (const habitat of habitats.filter(entry => entry.endeavor)) {
  const ghost = ghostHex(scene, habitat.slot, { core: habitat.id !== TITLE_CELL });
  ghostLanding(scene, habitat.slot);
  // An invisible floor-level hex the pointer can find, so the placeholder shows itself on hover.
  const area = new THREE.Mesh(new THREE.CylinderGeometry(HEX_RADIUS + 0.3, HEX_RADIUS + 0.3, 0.4, 6), new THREE.MeshBasicMaterial());
  area.rotation.y = Math.PI / 6;
  area.position.copy(habitat.slot).setY(1.6);
  area.visible = false;
  area.userData.ghost = ghost;
  scene.add(area);
  ghostAreas.push(area);
  const onOpen = habitat.opensCrafts ? () => crafts.open() : habitat.opensPlanner ? () => planner.open() : undefined;
  blueprints.push(blueprint(habitat, { doors: doorsOf(habitat.id), cameraOffset: CAMERA_OFFSET, corner: habitat.endeavor, onOpen }));
}
document.querySelector('#endeavors').append(...blueprints);

const titleTexture = canvasTexture(1024, 200, (ctx, width, height) => {
  ctx.font = '300 100px Montserrat, system-ui, sans-serif';
  ctx.letterSpacing = '0.12em';
  ctx.font = `300 ${Math.floor(100 * (width * 0.94) / ctx.measureText('Endeavors').width)}px Montserrat, system-ui, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Endeavors', width / 2, height / 2);
});
document.fonts?.load('300 100px Montserrat').then(() => titleTexture.redraw());
const endeavorsTitle = new THREE.Mesh(new THREE.PlaneGeometry(25, 25 * 200 / 1024), new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true, depthWrite: false, toneMapped: false, fog: false }));
// Lies flat and runs along the default view's screen-right, so it reads left to right before any orbiting.
// It sits just in front of the landing, clear of the walkways arriving from behind.
endeavorsTitle.rotation.set(-Math.PI / 2, VIEW_ANGLE, 0, 'YXZ');
endeavorsTitle.position.copy(byId(TITLE_CELL).slot).addScaledVector(SCREEN_NEAR, 4.6).setY(1.62);
scene.add(endeavorsTitle);

const sectors = [];
for (const habitat of built) {
  const sector = new THREE.Group();
  sector.position.copy(habitat.slot);
  const trim = mat(habitat.accent, { emissive: habitat.accent, emissiveIntensity: 0.35, roughness: 0.5 });
  platform(sector, trim, habitat.accent);
  const content = node(sector, 0, FLOOR_Y, 0);
  const room = hexRoom(content, { trim, shell: habitat.accent, doors: doorsOf(habitat.id), signMaterial: exitSign, ...habitat.room() });
  const ticks = [], walls = room.walls.flatMap(wall => [wall.frame, wall.decor]);
  const fixtures = new Set([...content.children, ...walls.flatMap(group => group.children)]);
  habitat.build({ content, room, random: rng(habitat.seed), tick: callback => ticks.push(callback) });
  const added = group => group.children.filter(child => !fixtures.has(child));
  enlarge(content, [...added(content), ...room.walls.flatMap(wall => added(wall.frame))], FURNISHING_SCALE);
  enlarge(content, room.walls.flatMap(wall => added(wall.decor)), FURNISHING_SCALE, { ceiling: WALL_HEIGHT - 0.05 });
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
  label.className = 'habitat-label';
  label.style.setProperty('--accent', hexColor(habitat.accent));
  const title = document.createElement('strong');
  title.textContent = habitat.name;
  label.append(title);
  if (habitat.caption) {
    const detail = document.createElement('span');
    detail.textContent = habitat.caption;
    label.append(detail);
  }
  label.addEventListener('click', () => focus(sector));
  label.addEventListener('pointerenter', () => setHover(sector));
  label.addEventListener('pointerleave', () => setHover(undefined));
  labelHost.append(label);

  sector.userData = { id: habitat.id, room, ticks, trim, label, hit, labelHeight: habitat.labelHeight ?? 14.5 };
  scene.add(sector);
  sectors.push(sector);
}
// Built habitats get solid walkways between them; anything touching an empty Endeavor cell is drawn as a blueprint path to its landing.
for (const pair of seams) {
  const [one, two] = pair.map(byId), ends = [one, two].map(habitat => (habitat.endeavor ? HUB_END : ROOM_END));
  if (one.endeavor || two.endeavor) ghostPath(scene, one.slot, two.slot, ends);
  else bridge(scene, one.slot, two.slot, one.accent, ends);
}

// Unlit so the floor shows exactly the backdrop colour; a shadow-only layer on top keeps the honeycomb grounded.
const ground = new THREE.Mesh(new THREE.CircleGeometry(220, 96), new THREE.MeshBasicMaterial({ color: BACKDROP, toneMapped: false, fog: false }));
const groundShadow = new THREE.Mesh(new THREE.CircleGeometry(220, 96), new THREE.ShadowMaterial({ opacity: 0.32, fog: false }));
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
  blueprints.forEach(item => item.classList.toggle('is-dimmed', Boolean(sector)));
  flyTo(sector ? sector.position.clone().setY(FLOOR_Y) : CENTER, sector ? 2.3 : 1);
}
function revealOnly(ghost) {
  ghostAreas.forEach(area => revealGhost(area.userData.ghost, area.userData.ghost === ghost));
}
renderer.domElement.addEventListener('pointermove', event => {
  const sector = pick(event);
  setHover(sector);
  // A habitat in front wins; otherwise any placeholder under the pointer fades in.
  revealOnly(sector ? undefined : raycaster.intersectObjects(ghostAreas, false)[0]?.object.userData.ghost);
});
renderer.domElement.addEventListener('pointerleave', () => {
  setHover(undefined);
  revealOnly(undefined);
});
renderer.domElement.addEventListener('pointerdown', event => {
  pressedAt = [event.clientX, event.clientY];
  dragging = true;
});
renderer.domElement.addEventListener('pointerup', event => {
  dragging = false;
  if (!pressedAt || Math.hypot(event.clientX - pressedAt[0], event.clientY - pressedAt[1]) > 5) return;
  const sector = pick(event);
  focus(sector !== focused ? sector : undefined);
});
addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!crafts.escape() && !planner.escape()) focus(undefined);
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
}

function resize() {
  // Close enough to see into the rooms, while the three habitats still fit across narrow screens.
  const width = sceneHost.clientWidth, height = sceneHost.clientHeight, aspect = width / height, frustum = Math.max(80, 92 / aspect);
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
  if (crafts.covering() || planner.covering()) return;
  view.subVectors(camera.position, controls.target).setY(0).normalize();
  for (const sector of sectors) {
    updateCutaway(sector.userData.room, view, delta);
    sector.userData.ticks.forEach(callback => callback(time, delta));
  }
  earth.rotation.y = time * 0.025;
  updateGhosts(time, delta);
  placeLabels();
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
// A shared link straight to the Life Planner (handy for demos) opens it over the scene.
if (location.hash === '#life-planner') planner.open();
