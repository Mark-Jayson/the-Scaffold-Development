// Life Planner: a day timeline with one lane per life aspect or project. Each task gets a mode label
// (grind, ideation, performance, leisure, routine), and the planner places energy prep around it and weighs
// the day's workload so heavy days get balanced before they happen.
import './planner.css';
import { MODES, MODE_ORDER, KIT, classify, runsLate, formatTime, formatSpan, icon } from './modes.js';
import { DAY_START, DAY_END, LEVELS, prepFor, loadOf, curveOf, briefFor, suggestionsFor } from './plan.js';
import { seed, dayKey, shiftDay } from './seed.js';

const KEY = 'scaffold.lifeplanner.v1';
const SNAP = 15, ROW = 58, CHIP_ROW = 30;
const LENGTHS = [15, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300, 360];
const PALETTE = ['#6f9bff', '#b892ff', '#ffc857', '#4fd1a5', '#ff8fb1', '#8fd3ff', '#ff9b6a', '#d4e157'];
const root = document.querySelector('#planner');

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.version === 1 && Array.isArray(saved.tasks)) return saved;
  } catch {
    // Unreadable or blocked storage: start from the sample week.
  }
  return seed();
}
let state = restore();
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked; the planner keeps working for this visit.
  }
};
const view = { day: null, windowStart: null, selected: null, chip: null, modal: null, scrolledFor: null };

/* Small helpers */
const esc = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const pad = value => String(value).padStart(2, '0');
const today = () => dayKey(new Date());
const nowMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const dateOf = key => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};
// "today", "tomorrow", a weekday for the coming week, otherwise a short date so past and future never read alike.
const nameOf = key => {
  const offset = Math.round((dateOf(key) - dateOf(today())) / 864e5);
  if (offset === 0) return 'today';
  if (offset === 1) return 'tomorrow';
  if (offset === -1) return 'yesterday';
  return dateOf(key).toLocaleDateString(undefined, offset > 1 && offset < 7 ? { weekday: 'long' } : { weekday: 'short', month: 'short', day: 'numeric' });
};
const capital = text => text.charAt(0).toUpperCase() + text.slice(1);
const longDate = key => dateOf(key).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const toInput = minutes => `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
// Times before 5 AM belong to the night of the chosen day, so an all-nighter stays on one row.
const fromInput = value => {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours < 5 ? hours + 24 : hours) * 60 + minutes;
};
const hourWidth = () => (matchMedia('(max-width: 760px)').matches ? 84 : 120);
const aspectOf = id => state.aspects.find(aspect => aspect.id === id) ?? state.aspects[0];
const taskOf = id => state.tasks.find(task => task.id === id);

/* Day model */
const tasksOn = day => state.tasks.filter(task => task.day === day);
const prepOn = (day, tasks = tasksOn(day)) => (state.energyPrep ? prepFor(tasks, state.prep) : []);
function loadOn(day, add, remove) {
  let tasks = tasksOn(day).filter(task => task !== remove);
  if (add) tasks = [...tasks, { ...add, day }];
  return loadOf(tasks, prepOn(day, tasks), state.prep);
}
const windowDays = () => Array.from({ length: 7 }, (_, index) => shiftDay(view.windowStart, index));
const planApi = () => ({ days: Array.from({ length: 14 }, (_, index) => shiftDay(view.windowStart, index)), today: today(), tasksOn, loadOn, label: nameOf });
// AI-labelled tasks are relabelled whenever they change; a label the user picked is kept.
function relabel(task) {
  if (task.source === 'ai') {
    const { mode, confidence, reason } = classify(task);
    Object.assign(task, { mode, confidence, reason });
  }
  task.allNighter = task.mode === 'grind' && runsLate(task);
}

/* Shell */
root.innerHTML = `
  <div class="lp-shell">
    <header class="lp-top">
      <button type="button" class="lp-back">${icon('back')}<span>WorkStation</span></button>
      <div class="lp-heading"><p class="lp-kicker">Endeavor</p><h2>Life Planner</h2></div>
      <div class="lp-range" role="group" aria-label="Choose week">
        <button type="button" class="lp-icon-button" data-range="-7" aria-label="Previous week">${icon('back')}</button>
        <button type="button" class="lp-text-button" data-range="today">Today</button>
        <button type="button" class="lp-icon-button" data-range="7" aria-label="Next week">${icon('next')}</button>
      </div>
      <label class="lp-toggle"><input type="checkbox" class="lp-prep-toggle" /><span class="lp-toggle-track" aria-hidden="true"></span><span>Energy prep</span></label>
      <button type="button" class="lp-primary lp-new">${icon('plus')}<span>Plan a task</span></button>
    </header>
    <nav class="lp-week" aria-label="Days of the week"></nav>
    <div class="lp-body">
      <section class="lp-board" aria-label="Day timeline">
        <div class="lp-scroll"><div class="lp-grid"></div></div>
        <div class="lp-legend"></div>
      </section>
      <aside class="lp-side" aria-label="Day plan"></aside>
    </div>
  </div>
  <div class="lp-modal" hidden>
    <div class="lp-scrim" data-close></div>
    <form class="lp-dialog" role="dialog" aria-modal="true" aria-labelledby="lp-dialog-title" novalidate></form>
  </div>
  <div class="lp-toast" role="status" hidden><span class="lp-toast-text"></span><button type="button" class="lp-toast-undo">Undo</button></div>`;
const $ = selector => root.querySelector(selector);
const weekEl = $('.lp-week'), grid = $('.lp-grid'), scroller = $('.lp-scroll'), side = $('.lp-side'), legend = $('.lp-legend');
const modal = $('.lp-modal'), dialog = $('.lp-dialog'), toastEl = $('.lp-toast');
legend.innerHTML = MODE_ORDER.map(mode => `<span class="lp-legend-item" style="--mode:${MODES[mode].color}" title="${MODES[mode].hint}">${icon(MODES[mode].icon)}${MODES[mode].label}</span>`).join('') + `<span class="lp-legend-note">${icon('ai')} Labels and energy prep are suggested by AI. Drag blocks to move them, or their right edge to resize.</span>`;

/* Week strip */
function renderWeek() {
  weekEl.innerHTML = windowDays().map(day => {
    const tasks = tasksOn(day), load = loadOn(day), modes = [...new Set(tasks.map(task => task.mode))];
    const date = dateOf(day);
    return `<button type="button" class="lp-day${day === view.day ? ' is-selected' : ''}${day === today() ? ' is-today' : ''}" data-day="${day}" aria-pressed="${day === view.day}">
      <span class="lp-day-name">${day === today() ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
      <span class="lp-day-date">${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
      <span class="lp-meter" data-level="${tasks.length ? load.level : 'free'}"><i style="width:${Math.min(100, load.ratio * 100)}%"></i></span>
      <span class="lp-day-foot"><span class="lp-day-level">${tasks.length ? `${LEVELS[load.level]} · ${Math.round(load.ratio * 100)}%` : 'Free'}</span><span class="lp-day-modes">${modes.map(mode => `<i style="--mode:${MODES[mode].color}" title="${MODES[mode].label}"></i>`).join('')}</span></span>
    </button>`;
  }).join('');
}

/* Timeline */
// Greedy rows so overlapping items in one lane stack instead of covering each other.
function stack(entries) {
  const ends = [];
  return entries.map(entry => {
    let row = ends.findIndex(end => end <= entry.from);
    if (row < 0) row = ends.push(0) - 1;
    ends[row] = entry.to;
    return { ...entry, row };
  });
}
function renderTimeline() {
  const hour = hourWidth(), perMin = hour / 60, x = minutes => (minutes - DAY_START) * perMin;
  const tasks = tasksOn(view.day), items = prepOn(view.day).filter(item => item.state !== 'skipped');
  grid.style.setProperty('--hour', `${hour}px`);
  grid.style.setProperty('--track', `${(DAY_END - DAY_START) * perMin}px`);
  const hours = [];
  for (let at = DAY_START; at < DAY_END; at += 60) hours.push(`<span style="left:${x(at)}px">${formatTime(at)}</span>`);
  const curve = curveOf(tasks).filter(slot => slot.value > 0).map(slot => `<i style="left:${x(slot.at)}px;width:${15 * perMin - 1}px;height:${Math.min(100, (slot.value / 2.6) * 100)}%;--mode:${MODES[slot.mode].color}"></i>`).join('');

  // Energy chips show their label whenever there is room before the next chip in the same row.
  const chips = stack(items.map(item => ({ item, from: x(item.start), to: x(item.start) + Math.max(30, item.minutes * perMin) + 2 })));
  const chipRows = Math.max(1, ...chips.map(chip => chip.row + 1));
  const chipHtml = chips.map((chip, index) => {
    const next = chips.slice(index + 1).find(other => other.row === chip.row);
    const kit = KIT[chip.item.kit], room = (next ? next.from : x(DAY_END)) - chip.from - 4;
    const width = Math.max(chip.to - chip.from - 2, Math.min(room, 40 + kit.label.length * 6.6));
    return `<button type="button" class="lp-chip${width >= 90 ? ' is-wide' : ''}${chip.item.during ? ' is-during' : ''}${chip.item.state === 'done' ? ' is-done' : ''}${chip.item.key === view.chip ? ' is-selected' : ''}" data-chip="${chip.item.key}" style="left:${chip.from}px;width:${width}px;top:${chip.row * CHIP_ROW + 5}px" title="${esc(kit.label)} · ${formatTime(chip.item.start)}">${icon(chip.item.state === 'done' ? 'check' : kit.icon)}<span>${esc(kit.label)}</span></button>`;
  }).join('');

  const lanes = state.aspects.map(aspect => {
    const laneTasks = tasksOn(view.day).filter(task => task.aspect === aspect.id).sort((a, b) => a.start - b.start);
    const blocks = stack(laneTasks.map(task => ({ task, from: task.start, to: task.start + task.duration })));
    const rows = Math.max(1, ...blocks.map(block => block.row + 1)), minutes = laneTasks.reduce((sum, task) => sum + task.duration, 0);
    const html = blocks.map(({ task, row }) => {
      const mode = MODES[task.mode], width = Math.max(18, task.duration * perMin - 3), label = task.allNighter ? 'All-nighter' : mode.label;
      return `<button type="button" class="lp-block${width < 60 ? ' is-narrow' : width < 150 ? ' is-compact' : ''}${task.done ? ' is-done' : ''}${task.id === view.selected ? ' is-selected' : ''}" data-task="${task.id}" style="left:${x(task.start)}px;width:${width}px;top:${row * ROW + 6}px;--mode:${mode.color}" aria-label="${esc(task.title)}, ${formatTime(task.start)} to ${formatTime(task.start + task.duration)}, ${label}${task.done ? ', done' : ''}">
        <span class="lp-block-icon">${icon(task.done ? 'check' : mode.icon)}</span>
        <span class="lp-block-text"><strong>${esc(task.title)}</strong><small>${formatTime(task.start)}–${formatTime(task.start + task.duration)} · ${label}</small></span>
        <span class="lp-block-grip" data-resize aria-hidden="true"></span>
      </button>`;
    }).join('');
    return `<div class="lp-lane-label" style="--aspect:${aspect.color};height:${rows * ROW + 8}px"><i></i><span><strong>${esc(aspect.name)}</strong><small>${laneTasks.length ? `${laneTasks.length} · ${formatSpan(minutes)}` : esc(aspect.note ?? '')}</small></span></div>
      <div class="lp-track" data-aspect="${aspect.id}" style="height:${rows * ROW + 8}px">${html}</div>`;
  }).join('');

  const now = nowMinutes(), showNow = view.day === today() && now >= DAY_START;
  grid.innerHTML = `
    <div class="lp-corner"><span>Lanes</span></div>
    <div class="lp-hours">${hours.join('')}${showNow ? `<span class="lp-now-tag" style="left:${x(now)}px">${formatTime(now)}</span>` : ''}</div>
    <div class="lp-lane-label is-load"><span><strong>Load</strong><small>effort through the day</small></span></div>
    <div class="lp-track lp-load-track">${curve}</div>
    <div class="lp-lane-label is-energy" style="height:${chipRows * CHIP_ROW + 10}px">${icon('ai')}<span><strong>Energy prep</strong><small>${state.energyPrep ? `${items.length} planned by AI` : 'Off'}</small></span></div>
    <div class="lp-track lp-energy-track" style="height:${chipRows * CHIP_ROW + 10}px">${state.energyPrep ? chipHtml : ''}</div>
    ${lanes}
    <button type="button" class="lp-lane-label lp-add-lane">${icon('plus')}<span><strong>Add a lane</strong><small>Aspect or project</small></span></button>
    <div class="lp-track is-empty"></div>
    ${showNow ? `<div class="lp-now" style="--x:${x(now)}px"></div>` : ''}`;

  if (view.scrolledFor !== view.day) {
    view.scrolledFor = view.day;
    const first = Math.min(...tasks.map(task => task.start), showNow ? now : Infinity);
    scroller.scrollLeft = Number.isFinite(first) ? Math.max(0, x(first) - hour) : x(8 * 60);
  }
}

/* Side panel */
const levelBadge = load => `<span class="lp-level" data-level="${load.level}">${LEVELS[load.level]}</span>`;
function contextOf(item) {
  const task = item.taskId && taskOf(item.taskId);
  if (!task) return item.kit === 'recover' ? 'Heavy-day recovery break' : 'Start of your day';
  return `${item.during ? 'During' : item.before ? 'Before' : 'After'} “${esc(task.title)}”`;
}
function prepRow(item) {
  const kit = KIT[item.kit];
  return `<li class="lp-prep-row is-${item.state}">
    <button type="button" class="lp-check" data-done="${item.key}" aria-pressed="${item.state === 'done'}" aria-label="Mark ${esc(kit.label)} done">${icon('check')}</button>
    <button type="button" class="lp-prep-main" data-chip="${item.key}">
      <span class="lp-prep-time">${formatTime(item.start)}</span>
      <span class="lp-prep-icon">${icon(kit.icon)}</span>
      <span class="lp-prep-text"><strong>${esc(kit.label)}</strong><small>${contextOf(item)}</small>${item.quote ? `<q>${esc(item.quote[0])}</q>` : ''}</span>
    </button>
    <button type="button" class="lp-skip" data-skip="${item.key}" aria-label="Skip ${esc(kit.label)}">${icon('close')}</button>
  </li>`;
}
function renderDay() {
  const tasks = tasksOn(view.day), all = prepOn(view.day), items = all.filter(item => item.state !== 'skipped');
  const load = loadOn(view.day), brief = briefFor(tasks, items, load), tips = suggestionsFor(view.day, planApi());
  const ratio = Math.min(1.25, load.ratio), segments = MODE_ORDER.filter(mode => load.byMode[mode] > 0);
  const total = segments.reduce((sum, mode) => sum + load.byMode[mode], 0);
  view.tips = tips;
  side.innerHTML = `
    <div class="lp-side-head"><div><p class="lp-kicker">${capital(nameOf(view.day))} · ${longDate(view.day)}</p><h3>${brief.type}</h3></div>${tasks.length ? levelBadge(load) : ''}</div>
    <section class="lp-card lp-load-card">
      <div class="lp-gauge" data-level="${load.level}" style="--ratio:${ratio / 1.25}">
        <svg viewBox="0 0 120 70" aria-hidden="true"><path class="lp-gauge-track" d="M10 62a50 50 0 0 1 100 0"/><path class="lp-gauge-fill" d="M10 62a50 50 0 0 1 100 0" pathLength="100" stroke-dasharray="${Math.max(0.5, (ratio / 1.25) * 100)} 100"/><line class="lp-gauge-cap" x1="${60 + 50 * Math.cos(Math.PI * (1 - 0.64))}" y1="${62 - 50 * Math.sin(Math.PI * (1 - 0.64))}" x2="${60 + 42 * Math.cos(Math.PI * (1 - 0.64))}" y2="${62 - 42 * Math.sin(Math.PI * (1 - 0.64))}"/></svg>
        <p><strong>${Math.round(load.ratio * 100)}%</strong><small>of ${view.day === today() ? 'today’s' : 'the day’s'} energy</small></p>
      </div>
      <ul class="lp-facts">
        <li><b>${formatSpan(Math.round(load.hours * 60))}</b> of effort</li>
        <li><b>${(load.byMode.leisure * 60) | 0} min</b> of leisure</li>
        <li><b>+${load.recharge.toFixed(1)}</b> back from prep</li>
      </ul>
      ${total ? `<div class="lp-modebar" role="img" aria-label="Time by mode">${segments.map(mode => `<i style="flex:${load.byMode[mode]};--mode:${MODES[mode].color}" title="${MODES[mode].label}: ${formatSpan(Math.round(load.byMode[mode] * 60))}"></i>`).join('')}</div>` : ''}
    </section>
    <section class="lp-card lp-brief"><h4>${icon('ai')}AI day brief</h4><p>${esc(brief.text)}</p></section>
    ${tips.length ? `<section class="lp-card lp-tips"><h4>Balance the day</h4>${tips.map((tip, index) => `<div class="lp-tip" data-tone="${tip.tone}"><p>${esc(tip.text)}</p><button type="button" class="lp-small-button" data-tip="${index}">${esc(tip.button)}</button></div>`).join('')}</section>` : ''}
    <section class="lp-card lp-prep-card">
      <h4>${icon('spark')}Energy plan<small>${state.energyPrep ? `${items.filter(item => item.state === 'done').length}/${items.length} done` : 'off'}</small></h4>
      ${state.energyPrep ? (items.length ? `<ol class="lp-prep-list">${items.map(prepRow).join('')}</ol>` : '<p class="lp-muted">Nothing to prepare for yet.</p>') : '<p class="lp-muted">Energy prep is off. Turn it on to have water, walks, breaks and a little motivation planned around your tasks.</p>'}
      ${all.length > items.length ? `<button type="button" class="lp-link" data-restore>Bring back ${all.length - items.length} skipped</button>` : ''}
    </section>
    <button type="button" class="lp-link lp-reset">Reset the sample week</button>`;
}
function renderTask(task) {
  const ai = classify(task), aspects = state.aspects.map(aspect => `<option value="${aspect.id}"${aspect.id === task.aspect ? ' selected' : ''}>${esc(aspect.name)}</option>`).join('');
  const days = [...new Set([...windowDays(), task.day])].sort().map(day => `<option value="${day}"${day === task.day ? ' selected' : ''}>${capital(nameOf(day))}, ${dateOf(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</option>`).join('');
  const lengths = [...new Set([...LENGTHS, task.duration])].sort((a, b) => a - b).map(minutes => `<option value="${minutes}"${minutes === task.duration ? ' selected' : ''}>${formatSpan(minutes)}</option>`).join('');
  const items = prepOn(task.day).filter(item => item.taskId === task.id);
  side.innerHTML = `
    <div class="lp-side-head"><button type="button" class="lp-text-button" data-overview>${icon('back')}Day overview</button></div>
    <section class="lp-card lp-task-card" style="--mode:${MODES[task.mode].color}">
      <label class="lp-field"><span>Task</span><input class="lp-input" data-field="title" value="${esc(task.title)}" autocomplete="off" /></label>
      <div class="lp-field-row">
        <label class="lp-field"><span>Lane</span><select data-field="aspect">${aspects}</select></label>
        <label class="lp-field"><span>Day</span><select data-field="day">${days}</select></label>
      </div>
      <div class="lp-field-row">
        <label class="lp-field"><span>Starts</span><input type="time" data-field="start" value="${toInput(task.start)}" step="900" /></label>
        <label class="lp-field"><span>Length</span><select data-field="duration">${lengths}</select></label>
      </div>
      <div class="lp-ai">
        <p class="lp-ai-head">${icon('ai')}${task.source === 'ai' ? `AI label · ${task.confidence}% sure` : 'You chose this label'}</p>
        <div class="lp-mode-picker">${MODE_ORDER.map(mode => `<button type="button" class="lp-mode-chip${mode === task.mode ? ' is-on' : ''}" data-mode="${mode}" style="--mode:${MODES[mode].color}" aria-pressed="${mode === task.mode}">${icon(MODES[mode].icon)}${mode === 'grind' && task.allNighter ? 'All-nighter' : MODES[mode].label}</button>`).join('')}</div>
        <p class="lp-ai-why">${task.source === 'ai' ? esc(task.reason || MODES[task.mode].hint) : `AI would pick ${MODES[ai.mode].label} (${ai.confidence}% sure). <button type="button" class="lp-link" data-relabel>Use the AI label</button>`}</p>
      </div>
      <div class="lp-task-prep">
        <h4>${icon('spark')}Prep for this</h4>
        ${state.energyPrep ? (items.length ? `<ol class="lp-prep-list">${items.map(prepRow).join('')}</ol>` : `<p class="lp-muted">${task.mode === 'routine' ? 'Routine tasks need no special prep.' : 'No free time around it for prep.'}</p>`) : '<p class="lp-muted">Energy prep is off.</p>'}
      </div>
      <div class="lp-task-actions">
        <button type="button" class="lp-small-button" data-toggle-done>${icon('check')}${task.done ? 'Mark not done' : 'Mark done'}</button>
        <button type="button" class="lp-small-button is-danger" data-delete>${icon('trash')}Delete</button>
      </div>
    </section>`;
}
function renderChip(item) {
  const kit = KIT[item.kit];
  side.innerHTML = `
    <div class="lp-side-head"><button type="button" class="lp-text-button" data-overview>${icon('back')}Day overview</button></div>
    <section class="lp-card lp-chip-card">
      <div class="lp-chip-hero">${icon(kit.icon)}</div>
      <p class="lp-kicker">${formatTime(item.start)}–${formatTime(item.start + item.minutes)} · ${kit.minutes} min</p>
      <h3>${esc(kit.label)}</h3>
      <p class="lp-muted">${contextOf(item)}</p>
      ${item.quote ? `<blockquote><p>${esc(item.quote[0])}</p><cite>${esc(item.quote[1])}</cite></blockquote>` : ''}
      <p>${esc(kit.why)}</p>
      <div class="lp-task-actions">
        <button type="button" class="lp-small-button" data-done="${item.key}">${icon('check')}${item.state === 'done' ? 'Not done' : 'Done'}</button>
        <button type="button" class="lp-small-button" data-skip="${item.key}">${icon('skip')}Skip it</button>
      </div>
    </section>`;
}
function renderSide() {
  const task = view.selected && taskOf(view.selected);
  const item = view.chip && prepOn(view.day).find(entry => entry.key === view.chip);
  if (task) renderTask(task);
  else if (item) renderChip(item);
  else {
    view.selected = view.chip = null;
    renderDay();
  }
  // A different panel (or day) starts at the top; re-renders of the same one keep their scroll.
  const panel = `${view.day}|${task?.id ?? item?.key ?? 'day'}`;
  if (panel !== view.panel) side.scrollTop = 0;
  view.panel = panel;
}
function render() {
  $('.lp-prep-toggle').checked = state.energyPrep;
  renderWeek();
  renderTimeline();
  renderSide();
}

/* Undo toast */
let toastTimer, undoSnapshot;
function toast(text, snapshot) {
  undoSnapshot = snapshot;
  toastEl.querySelector('.lp-toast-text').textContent = text;
  toastEl.querySelector('.lp-toast-undo').hidden = !snapshot;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 8000);
}
toastEl.querySelector('.lp-toast-undo').addEventListener('click', () => {
  if (!undoSnapshot) return;
  state = JSON.parse(undoSnapshot);
  save();
  toastEl.hidden = true;
  render();
});
const snapshot = () => JSON.stringify(state);

/* Actions */
function selectDay(day) {
  view.day = day;
  view.selected = view.chip = null;
  if (!windowDays().includes(day)) view.windowStart = shiftDay(day, -2);
  render();
}
function updateTask(task, changes, { quiet = false } = {}) {
  Object.assign(task, changes);
  relabel(task);
  save();
  if (changes.day && changes.day !== view.day && !quiet) toast(`Moved to ${nameOf(changes.day)}`);
  render();
}
function setPrep(key, value) {
  if (state.prep[key] === value) delete state.prep[key];
  else state.prep[key] = value;
  if (value === 'skipped' && view.chip === key) view.chip = null;
  save();
  render();
}
function applyTip(tip) {
  const before = snapshot(), { action } = tip, task = action.taskId && taskOf(action.taskId);
  if (action.type === 'move') {
    task.day = action.day;
    toast(`Moved “${task.title}” to ${nameOf(action.day)}`, before);
  } else if (action.type === 'shift' || action.type === 'shiftDay') {
    task.start = clamp(task.start + action.minutes, DAY_START, DAY_END - task.duration);
    relabel(task);
    toast(`“${task.title}” now starts at ${formatTime(task.start)}`, before);
  } else if (action.type === 'add') {
    const fresh = makeTask({ ...action.task, aspect: aspectOf(action.task.aspect).id, day: view.day });
    state.tasks.push(fresh);
    toast(`Added “${fresh.title}”`, before);
  }
  save();
  render();
}
let counter = 0;
function makeTask({ title, aspect, day, start, duration, mode }) {
  const label = classify({ title, aspect, start, duration });
  const chosen = mode && mode !== 'ai' ? mode : label.mode;
  return { id: `task-${Date.now().toString(36)}-${(counter += 1)}`, title, aspect, day, start, duration, mode: chosen, allNighter: chosen === 'grind' && runsLate({ title, start, duration }), source: mode && mode !== 'ai' ? 'you' : 'ai', confidence: label.confidence, reason: label.reason, done: false };
}

/* Modal: plan a task, or add a lane */
function openModal(kind, preset = {}) {
  view.modal = kind;
  modal.hidden = false;
  if (kind === 'lane') {
    dialog.innerHTML = `
      <header><h3 id="lp-dialog-title">Add a lane</h3><button type="button" class="lp-icon-button" data-close aria-label="Close">${icon('close')}</button></header>
      <label class="lp-field"><span>Life aspect or project</span><input name="name" required placeholder="e.g. Thesis, Band, Finances" autocomplete="off" /></label>
      <label class="lp-field"><span>Note (optional)</span><input name="note" placeholder="What goes in this lane?" autocomplete="off" /></label>
      <fieldset class="lp-swatches"><legend>Colour</legend>${PALETTE.map((color, index) => `<label style="--aspect:${color}"><input type="radio" name="color" value="${color}"${index === state.aspects.length % PALETTE.length ? ' checked' : ''} /><span></span></label>`).join('')}</fieldset>
      <footer><button type="button" class="lp-text-button" data-close>Cancel</button><button type="submit" class="lp-primary">Add lane</button></footer>`;
  } else {
    const day = preset.day ?? view.day, start = preset.start ?? Math.max(9 * 60, Math.ceil(nowMinutes() / 30) * 30);
    dialog.innerHTML = `
      <header><h3 id="lp-dialog-title">Plan a task</h3><button type="button" class="lp-icon-button" data-close aria-label="Close">${icon('close')}</button></header>
      <label class="lp-field"><span>What is it?</span><input name="title" required placeholder="e.g. Pitch the redesign to the client" autocomplete="off" /></label>
      <div class="lp-ai-preview" aria-live="polite"></div>
      <div class="lp-field-row">
        <label class="lp-field"><span>Lane</span><select name="aspect">${state.aspects.map(aspect => `<option value="${aspect.id}"${aspect.id === preset.aspect ? ' selected' : ''}>${esc(aspect.name)}</option>`).join('')}</select></label>
        <label class="lp-field"><span>Day</span><select name="day">${windowDays().map(key => `<option value="${key}"${key === day ? ' selected' : ''}>${capital(nameOf(key))} · ${LEVELS[loadOn(key).level]}</option>`).join('')}</select></label>
      </div>
      <div class="lp-field-row">
        <label class="lp-field"><span>Starts</span><input type="time" name="start" value="${toInput(clamp(start, DAY_START, DAY_END - 30))}" step="900" /></label>
        <label class="lp-field"><span>Length</span><select name="duration">${LENGTHS.map(minutes => `<option value="${minutes}"${minutes === 60 ? ' selected' : ''}>${formatSpan(minutes)}</option>`).join('')}</select></label>
      </div>
      <fieldset class="lp-mode-picker"><legend>Mode</legend>
        <label class="lp-mode-chip is-ai"><input type="radio" name="mode" value="ai" checked />${icon('ai')}Let AI decide</label>
        ${MODE_ORDER.map(mode => `<label class="lp-mode-chip" style="--mode:${MODES[mode].color}"><input type="radio" name="mode" value="${mode}" />${icon(MODES[mode].icon)}${MODES[mode].label}</label>`).join('')}
      </fieldset>
      <div class="lp-impact" aria-live="polite"></div>
      <footer><button type="button" class="lp-text-button" data-close>Cancel</button><button type="submit" class="lp-primary">${icon('plus')}Add to plan</button></footer>`;
    updatePreview();
  }
  requestAnimationFrame(() => dialog.querySelector('input')?.focus());
}
function closeModal() {
  modal.hidden = true;
  view.modal = null;
}
function draftFrom(form) {
  const data = new FormData(form);
  return { title: (data.get('title') ?? '').trim(), aspect: data.get('aspect'), day: data.get('day'), start: fromInput(data.get('start') || '09:00'), duration: Number(data.get('duration')), mode: data.get('mode') };
}
// Live AI label and the effect on the chosen day's load, with a lighter day offered when it tips over.
function updatePreview() {
  if (view.modal !== 'task') return;
  const draft = draftFrom(dialog), label = classify(draft), mode = draft.mode === 'ai' ? label.mode : draft.mode;
  const preview = dialog.querySelector('.lp-ai-preview'), impact = dialog.querySelector('.lp-impact');
  preview.innerHTML = draft.title
    ? `<span class="lp-mode-chip is-on" style="--mode:${MODES[label.mode].color}">${icon(MODES[label.mode].icon)}${label.allNighter ? 'All-nighter' : MODES[label.mode].label}</span><span>${icon('ai')}${label.confidence}% sure · ${esc(label.reason)}</span>`
    : `<span class="lp-muted">${icon('ai')}Start typing and AI will label it: grind, ideation, performance, leisure or routine.</span>`;
  const task = { ...draft, mode, allNighter: mode === 'grind' && runsLate(draft), id: 'draft' };
  const before = loadOn(draft.day), after = loadOn(draft.day, task);
  let html = `<p><strong>${capital(nameOf(draft.day))}</strong> goes from ${Math.round(before.ratio * 100)}% to <strong data-level="${after.level}">${Math.round(after.ratio * 100)}% · ${LEVELS[after.level]}</strong></p>`;
  if (after.ratio > 1) {
    const lighter = windowDays().filter(key => key >= today() && key !== draft.day).map(key => ({ key, ratio: loadOn(key, task).ratio })).sort((a, b) => a.ratio - b.ratio)[0];
    if (lighter && lighter.ratio <= 0.85) html += `<p class="lp-impact-tip">That overloads the day. ${capital(nameOf(lighter.key))} would sit at ${Math.round(lighter.ratio * 100)}%. <button type="button" class="lp-link" data-use-day="${lighter.key}">Plan it ${nameOf(lighter.key)}</button></p>`;
  }
  impact.innerHTML = html;
}
dialog.addEventListener('input', updatePreview);
dialog.addEventListener('change', updatePreview);
dialog.addEventListener('click', event => {
  if (event.target.closest('[data-close]')) return closeModal();
  const useDay = event.target.closest('[data-use-day]');
  if (useDay) {
    dialog.elements.day.value = useDay.dataset.useDay;
    updatePreview();
  }
});
modal.querySelector('.lp-scrim').addEventListener('click', closeModal);
dialog.addEventListener('submit', event => {
  event.preventDefault();
  if (view.modal === 'lane') {
    const data = new FormData(dialog), name = (data.get('name') ?? '').trim();
    if (!name) return dialog.elements.name.focus();
    state.aspects.push({ id: `lane-${Date.now().toString(36)}`, name, note: (data.get('note') ?? '').trim(), color: data.get('color') });
    save();
    closeModal();
    toast(`Added the ${name} lane`);
    return render();
  }
  const draft = draftFrom(dialog);
  if (!draft.title) return dialog.elements.title.focus();
  const task = makeTask(draft);
  state.tasks.push(task);
  save();
  closeModal();
  view.day = task.day;
  view.selected = task.id;
  view.scrolledFor = null;
  if (!windowDays().includes(task.day)) view.windowStart = shiftDay(task.day, -2);
  toast(`Planned “${task.title}” as ${task.allNighter ? 'an all-nighter' : MODES[task.mode].label.toLowerCase()}`);
  render();
});

/* Header and week */
$('.lp-back').addEventListener('click', () => close());
$('.lp-new').addEventListener('click', () => openModal('task'));
$('.lp-prep-toggle').addEventListener('change', event => {
  state.energyPrep = event.target.checked;
  save();
  render();
});
root.querySelector('.lp-range').addEventListener('click', event => {
  const button = event.target.closest('[data-range]');
  if (!button) return;
  if (button.dataset.range === 'today') {
    view.windowStart = shiftDay(today(), -2);
    selectDay(today());
  } else {
    view.windowStart = shiftDay(view.windowStart, Number(button.dataset.range));
    selectDay(shiftDay(view.day, Number(button.dataset.range)));
  }
});
weekEl.addEventListener('click', event => {
  const button = event.target.closest('[data-day]');
  if (button) selectDay(button.dataset.day);
});

/* Timeline: select, drag to move (also across lanes), drag the right edge to resize, click empty space to add */
let drag;
grid.addEventListener('pointerdown', event => {
  const block = event.target.closest('.lp-block');
  if (!block || event.button !== 0) return;
  const task = taskOf(block.dataset.task);
  drag = { task, block, resize: Boolean(event.target.closest('[data-resize]')), x: event.clientX, y: event.clientY, start: task.start, duration: task.duration, aspect: task.aspect, moved: false };
  addEventListener('pointermove', onDrag);
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', cancelDrag);
});
function laneAt(x, y) {
  return document.elementsFromPoint(x, y).find(element => element.matches?.('.lp-track[data-aspect]'));
}
function onDrag(event) {
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 5) return;
  drag.moved = true;
  drag.block.classList.add('is-dragging');
  const perMin = hourWidth() / 60, delta = Math.round(dx / perMin / SNAP) * SNAP, label = drag.block.querySelector('small');
  if (drag.resize) {
    drag.duration = clamp(drag.task.duration + delta, SNAP, DAY_END - drag.task.start);
    drag.block.style.width = `${drag.duration * perMin - 3}px`;
  } else {
    drag.start = clamp(drag.task.start + delta, DAY_START, DAY_END - drag.task.duration);
    drag.block.style.left = `${(drag.start - DAY_START) * perMin}px`;
    drag.block.style.transform = `translateY(${dy}px)`;
    const lane = laneAt(event.clientX, event.clientY);
    grid.querySelectorAll('.lp-track.is-target').forEach(track => track !== lane && track.classList.remove('is-target'));
    if (lane && lane.dataset.aspect !== drag.task.aspect) lane.classList.add('is-target');
    if (lane) drag.aspect = lane.dataset.aspect;
  }
  label.textContent = `${formatTime(drag.start)}–${formatTime(drag.start + drag.duration)}`;
}
function stopDrag() {
  removeEventListener('pointermove', onDrag);
  removeEventListener('pointerup', endDrag);
  removeEventListener('pointercancel', cancelDrag);
}
function endDrag() {
  stopDrag();
  const { task, moved } = drag;
  if (!moved) {
    view.selected = task.id;
    view.chip = null;
    drag = undefined;
    return render();
  }
  const before = snapshot();
  updateTask(task, { start: drag.start, duration: drag.duration, aspect: drag.aspect }, { quiet: true });
  toast(`“${task.title}” · ${formatTime(task.start)}–${formatTime(task.start + task.duration)}${task.source === 'ai' ? ` · ${task.allNighter ? 'All-nighter' : MODES[task.mode].label}` : ''}`, before);
  drag = undefined;
}
function cancelDrag() {
  stopDrag();
  drag = undefined;
  render();
}
// Pointer clicks on blocks are handled in pointerup (so a drag never selects); keyboard presses arrive here.
grid.addEventListener('click', event => {
  const block = event.target.closest('.lp-block');
  if (block) {
    if (event.detail === 0) {
      view.selected = block.dataset.task;
      view.chip = null;
      render();
    }
    return;
  }
  const chip = event.target.closest('[data-chip]');
  if (chip) {
    view.chip = chip.dataset.chip;
    view.selected = null;
    return render();
  }
  if (event.target.closest('.lp-add-lane')) return openModal('lane');
  const track = event.target.closest('.lp-track[data-aspect]');
  if (track && event.target === track) {
    const perMin = hourWidth() / 60, at = DAY_START + Math.floor((event.clientX - track.getBoundingClientRect().left) / perMin / 30) * 30;
    openModal('task', { aspect: track.dataset.aspect, start: at });
  }
});
grid.addEventListener('keydown', event => {
  const block = event.target.closest('.lp-block');
  if (!block) return;
  const task = taskOf(block.dataset.task), step = { ArrowLeft: -SNAP, ArrowRight: SNAP }[event.key];
  if (step) {
    event.preventDefault();
    if (event.shiftKey) updateTask(task, { duration: clamp(task.duration + step, SNAP, DAY_END - task.start) });
    else updateTask(task, { start: clamp(task.start + step, DAY_START, DAY_END - task.duration) });
    grid.querySelector(`[data-task="${task.id}"]`)?.focus();
  } else if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault();
    removeTask(task);
  }
});
function removeTask(task) {
  const before = snapshot();
  state.tasks = state.tasks.filter(entry => entry !== task);
  if (view.selected === task.id) view.selected = null;
  save();
  toast(`Deleted “${task.title}”`, before);
  render();
}

/* Side panel */
side.addEventListener('click', event => {
  const target = event.target;
  const done = target.closest('[data-done]'), skip = target.closest('[data-skip]'), chip = target.closest('[data-chip]');
  if (done) return setPrep(done.dataset.done, 'done');
  if (skip) return setPrep(skip.dataset.skip, 'skipped');
  if (chip) {
    view.chip = chip.dataset.chip;
    view.selected = null;
    return render();
  }
  if (target.closest('[data-overview]')) {
    view.selected = view.chip = null;
    return render();
  }
  const tip = target.closest('[data-tip]');
  if (tip) return applyTip(view.tips[Number(tip.dataset.tip)]);
  if (target.closest('[data-restore]')) {
    const prefixes = [`${view.day}:`, ...tasksOn(view.day).map(task => `${task.id}:`)];
    for (const [key, value] of Object.entries(state.prep)) if (value === 'skipped' && prefixes.some(prefix => key.startsWith(prefix))) delete state.prep[key];
    save();
    return render();
  }
  if (target.closest('.lp-reset')) {
    const before = snapshot();
    state = seed();
    save();
    view.selected = view.chip = view.scrolledFor = null;
    toast('Sample week restored', before);
    return selectDay(today());
  }
  const task = view.selected && taskOf(view.selected);
  if (!task) return;
  const mode = target.closest('[data-mode]');
  if (mode) {
    task.source = 'you';
    return updateTask(task, { mode: mode.dataset.mode });
  }
  if (target.closest('[data-relabel]')) {
    task.source = 'ai';
    return updateTask(task, {});
  }
  if (target.closest('[data-toggle-done]')) return updateTask(task, { done: !task.done });
  if (target.closest('[data-delete]')) removeTask(task);
});
side.addEventListener('input', event => {
  const field = event.target.dataset.field, task = view.selected && taskOf(view.selected);
  if (field !== 'title' || !task) return;
  task.title = event.target.value;
  const text = grid.querySelector(`[data-task="${task.id}"] strong`);
  if (text) text.textContent = task.title;
});
side.addEventListener('change', event => {
  const field = event.target.dataset.field, task = view.selected && taskOf(view.selected);
  if (!field || !task) return;
  const value = event.target.value;
  const changes = { title: { title: value.trim() || task.title }, aspect: { aspect: value }, day: { day: value }, start: { start: clamp(fromInput(value || '09:00'), DAY_START, DAY_END - task.duration) }, duration: { duration: Number(value) } }[field];
  if (field === 'day') view.day = value;
  updateTask(task, changes);
});

// Keep the "now" line honest while the planner is open.
let ticker;
function open() {
  if (!root.hidden) return;
  view.windowStart ??= shiftDay(today(), -2);
  view.day ??= today();
  view.scrolledFor = null;
  root.hidden = false;
  render();
  // Force a style flush so the fade-in runs even where animation frames are paused (background tabs).
  void root.offsetWidth;
  root.classList.add('is-open');
  ticker = setInterval(() => !drag && !view.modal && renderTimeline(), 60000);
  if (location.hash !== '#life-planner') history.replaceState(null, '', '#life-planner');
  $('.lp-back').focus({ preventScroll: true });
}
function close() {
  root.classList.remove('is-open');
  root.hidden = true;
  clearInterval(ticker);
  closeModal();
  if (location.hash === '#life-planner') history.replaceState(null, '', location.pathname + location.search);
}
addEventListener('resize', () => !root.hidden && renderTimeline());

export const planner = {
  open,
  // True while the planner covers the scene, so the 3D view can pause.
  covering: () => !root.hidden,
  // Steps back one layer (dialog → detail → planner); returns false when there was nothing to close.
  escape() {
    if (root.hidden) return false;
    if (view.modal) closeModal();
    else if (view.selected || view.chip) {
      view.selected = view.chip = null;
      render();
    } else close();
    return true;
  },
};
