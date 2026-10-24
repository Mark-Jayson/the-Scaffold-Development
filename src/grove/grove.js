// The Tree: a living tree that grows from your finished Life Planner tasks, and the home of Filo.
// Every finished task adds leaves (more for heavier work), finished ideation tasks blossom, and a day where
// everything got done ripens into a fruit. Growth only ever counts what you did, never what you missed.
import './grove.css';
import { filoSvg, react, setMood, hearts } from '../app/filo.js';
import { plannerTasks, planner } from '../planner/planner.js';
import { MODES, formatTime } from '../planner/modes.js';
import { shiftDay } from '../planner/seed.js';

const root = document.querySelector('#grove');
const LEAVES = { grind: 3, performance: 3, ideation: 2, leisure: 2, routine: 1 };
// [name, leaves needed]
const STAGES = [['Seed', 0], ['Sprout', 3], ['Seedling', 8], ['Sapling', 15], ['Young tree', 25], ['Tree', 40], ['Grand tree', 60], ['Ancient tree', 90]];
const ICON = {
  back: '<path d="m15 5-7 7 7 7"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19 13 11"/>',
  flower: '<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5a3 3 0 1 1 0-6 3 3 0 1 1 0 6zM12 14.5a3 3 0 1 0 0 6 3 3 0 1 0 0-6zM9.5 12a3 3 0 1 0-6 0 3 3 0 1 0 6 0zM14.5 12a3 3 0 1 1 6 0 3 3 0 1 1-6 0z"/>',
  fruit: '<path d="M12 8c-4-2-8 1-7 6s4 7 7 6c3 1 6-1 7-6s-3-8-7-6z"/><path d="M12 8c0-2 1-3.5 3-4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;
const esc = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

/* Growth from the planner's tasks */
function growth() {
  const tasks = plannerTasks.all(), done = tasks.filter(task => task.done);
  const leaves = done.reduce((sum, task) => sum + (LEAVES[task.mode] ?? 1), 0);
  const days = {};
  tasks.forEach(task => ((days[task.day] ??= []).push(task)));
  const fruit = Object.values(days).filter(list => list.length >= 2 && list.every(task => task.done)).length;
  const blossoms = done.filter(task => task.mode === 'ideation').length;
  const showedUp = Object.values(days).filter(list => list.some(task => task.done)).length;
  let stage = 0;
  STAGES.forEach(([, need], index) => leaves >= need && (stage = index));
  const [, from] = STAGES[stage], to = STAGES[stage + 1]?.[1];
  return { leaves, fruit, blossoms, showedUp, stage, name: STAGES[stage][0], next: STAGES[stage + 1]?.[0], toNext: to == null ? 0 : to - leaves, progress: to == null ? 1 : (leaves - from) / (to - from), done };
}

/* The tree: one fixed, seeded skeleton that is revealed and scaled up as it grows */
const random = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(20261024);
const SKELETON = (() => {
  const branches = [], slots = [];
  const step = (x, y, angle, length, width, depth) => {
    const x2 = x + Math.sin(angle) * length, y2 = y - Math.cos(angle) * length;
    branches.push({ x, y, x2, y2, width, depth, bend: (random() - 0.5) * length * 0.25 });
    if (depth >= 1) slots.push({ x: x2, y: y2, depth });
    if (depth >= 5) return;
    const kids = depth === 0 ? 3 : random() < 0.35 ? 3 : 2, spread = depth === 0 ? 0.62 : 0.5 + random() * 0.2;
    for (let index = 0; index < kids; index += 1) {
      const turn = (index - (kids - 1) / 2) * spread + (random() - 0.5) * 0.25;
      step(x2, y2, angle * 0.6 + turn, length * (0.7 + random() * 0.12), width * 0.64, depth + 1);
    }
  };
  step(0, 0, 0, 150, 30, 0);
  // Leaves grow from the inside out: three per slot, in a stable order.
  const leaves = slots.sort((a, b) => a.depth - b.depth || random() - 0.5).flatMap(slot => Array.from({ length: 3 }, () => ({ x: slot.x + (random() - 0.5) * 46, y: slot.y + (random() - 0.5) * 38, r: 14 + random() * 10, depth: slot.depth, tone: Math.floor(random() * 4), turn: random() * 180 })));
  return { branches, leaves };
})();
const TONES = ['rgba(150,224,26,.78)', 'rgba(118,201,40,.8)', 'rgba(183,236,92,.74)', 'rgba(96,180,52,.82)'];

function treeSvg(state, previousLeaves) {
  const { stage, progress, leaves, blossoms, fruit } = state;
  const ground = `<ellipse cx="300" cy="500" rx="330" ry="70" fill="url(#gv-hill)"/><ellipse cx="300" cy="474" rx="120" ry="16" fill="rgba(20,60,10,.25)"/>`;
  if (stage === 0) {
    return `${ground}<g class="gv-seed"><ellipse cx="300" cy="466" rx="34" ry="12" fill="#6b4a2f"/><ellipse cx="300" cy="458" rx="11" ry="8" fill="#a8743f"/><path d="M300 452c0-10 4-16 10-18" fill="none" stroke="#7bc74a" stroke-width="3" stroke-linecap="round"/></g>`;
  }
  if (stage === 1) {
    const height = 40 + progress * 40;
    return `${ground}<g class="gv-sprout"><ellipse cx="300" cy="468" rx="30" ry="9" fill="#6b4a2f"/><path d="M300 466V${466 - height}" stroke="#5f9e3a" stroke-width="5" stroke-linecap="round"/><path d="M300 ${470 - height}c-26-4-38-20-34-34 18 0 32 12 34 34zM300 ${478 - height}c22-2 34-16 32-30-16 0-30 10-32 30z" fill="#8fd14f"/></g>`;
  }
  // From Seedling up: reveal deeper branches stage by stage and scale smoothly with progress to the next stage.
  const depth = Math.min(5, stage - 1), scale = Math.min(1, 0.34 + (stage - 2 + progress) * 0.12);
  const visible = SKELETON.branches.filter(branch => branch.depth <= depth);
  const slots = SKELETON.leaves.filter(leaf => leaf.depth <= depth);
  const count = Math.min(slots.length, 8 + leaves * 2);
  const branchPath = branch => `M${branch.x} ${branch.y}Q${(branch.x + branch.x2) / 2 + branch.bend} ${(branch.y + branch.y2) / 2} ${branch.x2} ${branch.y2}`;
  const wood = visible.map(branch => `<path d="${branchPath(branch)}" stroke="#7a5236" stroke-width="${Math.max(2, branch.width)}" stroke-linecap="round" fill="none"/>`).join('');
  // The group pops in (CSS scales it), the ellipse inside keeps its own tilt.
  const canopy = slots.slice(0, count).map((leaf, index) => `<g class="gv-leaf${index >= previousLeaves ? ' is-new' : ''}" style="--delay:${(index - previousLeaves) * 30}ms"><ellipse cx="${leaf.x.toFixed(1)}" cy="${leaf.y.toFixed(1)}" rx="${leaf.r.toFixed(1)}" ry="${(leaf.r * 0.72).toFixed(1)}" fill="${TONES[leaf.tone]}" transform="rotate(${leaf.turn.toFixed(0)} ${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)})"/></g>`).join('');
  const flowers = slots.slice(0, count).filter((_, index) => index % 5 === 2).slice(0, blossoms).map(leaf => `<g class="gv-flower" transform="translate(${leaf.x.toFixed(1)} ${(leaf.y - 6).toFixed(1)})">${[0, 72, 144, 216, 288].map(turn => `<ellipse cx="0" cy="-6" rx="4" ry="6" fill="#ffd6e7" transform="rotate(${turn})"/>`).join('')}<circle r="3.4" fill="#ffd166"/></g>`).join('');
  const fruits = slots.slice(0, count).filter((_, index) => index % 7 === 4).slice(0, fruit).map(leaf => `<g class="gv-fruit" transform="translate(${leaf.x.toFixed(1)} ${(leaf.y + 10).toFixed(1)})"><path d="M0 -12v6" stroke="#5f3d22" stroke-width="2"/><circle r="9" fill="#ff9b6a"/><circle cx="-3" cy="-3" r="2.5" fill="rgba(255,255,255,.55)"/></g>`).join('');
  // Filo's front door appears once the trunk is thick enough to live in.
  const door = stage >= 3 ? `<g class="gv-door"><path d="M-14 -2v-26a14 14 0 0 1 28 0v26z" fill="#4a2f1d" stroke="#3a2416" stroke-width="2"/><circle cx="7" cy="-14" r="2" fill="#ffd166"/><circle cx="0" cy="-34" r="4" fill="#ffd166" class="gv-lamp"/></g>` : '';
  return `${ground}<g class="gv-tree" transform="translate(300 470) scale(${scale.toFixed(3)})">${wood}${door}<g class="gv-canopy">${canopy}${flowers}${fruits}</g></g>`;
}

/* Rendering */
root.innerHTML = `
  <div class="gv-stage">
    <header class="gv-top">
      <button type="button" class="gv-back">${icon('back')}<span>WorkStation</span></button>
      <div><p class="gv-kicker">Endeavor</p><h2>Tree</h2></div>
    </header>
    <svg class="gv-scene" viewBox="0 0 600 560" role="img" aria-label="Your tree">
      <defs>
        <radialGradient id="gv-hill" cx="50%" cy="20%" r="80%"><stop offset="0" stop-color="#7cc24a"/><stop offset=".6" stop-color="#3f8a3a"/><stop offset="1" stop-color="#1f5a2c"/></radialGradient>
      </defs>
      <g class="gv-growth"></g>
    </svg>
    <div class="gv-filo">
      <p class="gv-bubble" aria-live="polite"></p>
      <button type="button" class="gv-filo-button" aria-label="Pet Filo">${filoSvg('Filo, at home by the tree')}</button>
    </div>
    <div class="gv-level"></div>
  </div>
  <aside class="gv-panel" aria-label="Tasks and progress">
    <section class="gv-card gv-today"></section>
    <section class="gv-card gv-week"></section>
    <section class="gv-card gv-garden"></section>
  </aside>`;
const $ = selector => root.querySelector(selector);
let shownLeaves = 0;

function say(text) {
  $('.gv-bubble').textContent = text;
}
function render({ celebrate = false } = {}) {
  const state = growth(), today = plannerTasks.today();
  const tasks = plannerTasks.all().filter(task => task.day === today).sort((a, b) => a.start - b.start);
  const left = tasks.filter(task => !task.done), next = left[0];
  const leafCount = state.stage >= 2 ? Math.min(SKELETON.leaves.filter(leaf => leaf.depth <= Math.min(5, state.stage - 1)).length, 8 + state.leaves * 2) : 0;
  $('.gv-growth').innerHTML = treeSvg(state, celebrate ? shownLeaves : leafCount);
  shownLeaves = leafCount;

  $('.gv-level').innerHTML = `<p><strong>${state.name}</strong>${state.next ? `<span>${state.toNext} more ${state.toNext === 1 ? 'leaf' : 'leaves'} to ${state.next}</span>` : '<span>Fully grown. Every task still adds leaves.</span>'}</p><div class="gv-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(state.progress * 100)}" aria-label="Growth to the next stage"><i style="width:${Math.round(state.progress * 100)}%"></i></div>`;

  const doneToday = tasks.length - left.length;
  $('.gv-today').innerHTML = `
    <div class="gv-card-head"><h3>${icon('sun')}Today</h3><span class="gv-pill">${doneToday} of ${tasks.length} done</span></div>
    ${tasks.length ? `<ul class="gv-tasks">${tasks.map(task => `<li class="${task.done ? 'is-done' : ''}${task === next ? ' is-next' : ''}" style="--mode:${MODES[task.mode].color}">
      <button type="button" class="gv-check" data-task="${task.id}" aria-pressed="${task.done}" aria-label="${task.done ? 'Mark not done' : 'Mark done'}: ${esc(task.title)}">${icon('check')}</button>
      <span class="gv-task-text"><strong>${esc(task.title)}</strong><small>${formatTime(task.start)} · ${task.allNighter ? 'All-nighter' : MODES[task.mode].label} · +${LEAVES[task.mode]} ${LEAVES[task.mode] === 1 ? 'leaf' : 'leaves'}</small></span>
      ${task === next ? '<em>Up next</em>' : ''}
    </li>`).join('')}</ul>` : '<p class="gv-muted">Nothing planned today. Rest grows trees too.</p>'}
    <button type="button" class="gv-link" data-planner>${icon('calendar')}Plan in the Life Planner</button>`;

  // This week, Monday-free: the seven days ending today, counted by what got done.
  const days = Array.from({ length: 7 }, (_, index) => shiftDay(today, index - 6));
  const counts = days.map(day => plannerTasks.all().filter(task => task.day === day && task.done));
  const most = Math.max(1, ...counts.map(list => list.length));
  $('.gv-week').innerHTML = `
    <div class="gv-card-head"><h3>${icon('leaf')}Last 7 days</h3><span class="gv-pill">${counts.flat().length} done</span></div>
    <div class="gv-bars">${days.map((day, index) => {
      const list = counts[index], label = day === today ? 'Today' : new Date(`${day}T12:00`).toLocaleDateString(undefined, { weekday: 'short' });
      return `<div class="gv-day${day === today ? ' is-today' : ''}"><div class="gv-column" title="${list.length} done">${list.map(task => `<i style="--mode:${MODES[task.mode].color};height:${100 / most}%"></i>`).join('')}</div><b>${list.length || ''}</b><span>${label}</span></div>`;
    }).join('')}</div>`;

  const mix = Object.keys(MODES).map(mode => [mode, state.done.filter(task => task.mode === mode).length]).filter(([, count]) => count);
  $('.gv-garden').innerHTML = `
    <div class="gv-card-head"><h3>${icon('flower')}Your garden</h3></div>
    <div class="gv-stats">
      <div><b>${state.leaves}</b><span>${icon('leaf')}Leaves grown</span></div>
      <div><b>${state.blossoms}</b><span>${icon('flower')}Ideas blossomed</span></div>
      <div><b>${state.fruit}</b><span>${icon('fruit')}Days fully done</span></div>
      <div><b>${state.showedUp}</b><span>${icon('sun')}Days you showed up</span></div>
    </div>
    ${mix.length ? `<div class="gv-mix" role="img" aria-label="Finished tasks by mode">${mix.map(([mode, count]) => `<i style="flex:${count};--mode:${MODES[mode].color}" title="${MODES[mode].label}: ${count}"></i>`).join('')}</div><p class="gv-legend">${mix.map(([mode, count]) => `<span style="--mode:${MODES[mode].color}">${MODES[mode].label} ${count}</span>`).join('')}</p>` : ''}
    <p class="gv-muted">No streaks here. Missing a day never shrinks the tree.</p>`;

  setMood(root, !tasks.length ? 'sleepy' : left.length ? 'idle' : 'happy');
  if (!celebrate) say(!tasks.length ? 'A quiet day. I will keep the tree company.' : !left.length ? 'Everything is done today. A fruit is ripening!' : next ? `Next up: ${next.title}. That one grows ${LEAVES[next.mode]} ${LEAVES[next.mode] === 1 ? 'leaf' : 'leaves'}.` : '');
}

root.addEventListener('click', event => {
  const check = event.target.closest('[data-task]');
  if (check) {
    const task = plannerTasks.all().find(entry => entry.id === check.dataset.task), before = growth();
    plannerTasks.setDone(task.id, !task.done);
    const after = growth();
    render({ celebrate: task.done });
    if (task.done) {
      react(root, after.stage > before.stage ? 'is-hop' : 'is-bounce');
      hearts($('.gv-filo'), '♥');
      const left = plannerTasks.all().filter(entry => entry.day === plannerTasks.today() && !entry.done).length;
      say(after.stage > before.stage ? `We grew into a ${after.name.toLowerCase()}!` : left ? `+${LEAVES[task.mode]} ${LEAVES[task.mode] === 1 ? 'leaf' : 'leaves'}! ${left} left today.` : 'That was the last one. A fruit is ripening!');
    }
    return;
  }
  if (event.target.closest('.gv-filo-button')) {
    react(root, 'is-wiggle');
    hearts($('.gv-filo'), '♥');
    return say(['Hi! The tree is looking good.', 'One small task at a time.', 'Want to water the tree? Tick something off.'][Math.floor(Math.random() * 3)]);
  }
  if (event.target.closest('[data-planner]')) {
    close();
    return planner.open();
  }
  if (event.target.closest('.gv-back')) close();
});

function open() {
  if (!root.hidden) return;
  root.hidden = false;
  render();
  void root.offsetWidth;
  root.classList.add('is-open');
  if (location.hash !== '#tree') history.replaceState(null, '', '#tree');
}
function close() {
  if (root.hidden) return;
  root.classList.remove('is-open');
  root.hidden = true;
  if (location.hash === '#tree') history.replaceState(null, '', location.pathname + location.search);
}

export const grove = {
  open,
  covering: () => !root.hidden,
  escape() {
    if (root.hidden) return false;
    close();
    return true;
  },
};
