// Scaffold Focus: the Scaffold app redesigned around research on attention and executive function.
// See docs/adhd-design-research.md for the principles each part of this file applies.
import { filoSvg, react, setMood, hearts } from '../app/filo.js';
import { sort, tagOf, moodOf } from '../app/sorter.js';
import { breakDown, energyOf } from './breakdown.js';
import { seed, isoDate, addDays } from './seed.js';

/* ---------- State (autosaved on every change) ---------- */
const STORAGE_KEY = 'scaffold.focus.v1';
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.tasks) return saved;
  } catch {
    // Unreadable or blocked storage: start fresh for this visit.
  }
  return seed();
}
const state = load();
const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Not persisted, but the session keeps working.
  }
};
let view = 'now', planDay = 0, inboxFilter = 'all';
const skipped = new Set();

/* ---------- Helpers ---------- */
const $ = selector => document.querySelector(selector);
const app = $('#app'), top = $('#top'), sheet = $('#sheet');
const uid = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const todayIso = () => isoDate(new Date());
const fromIso = value => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const dayDiff = (from, to) => Math.round((fromIso(to) - fromIso(from)) / 864e5);
const minutesOf = time => (time ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) : null);
const nowMinutes = () => new Date().getHours() * 60 + new Date().getMinutes();
const clock = minutes => new Date(2000, 0, 1, Math.floor(minutes / 60) % 24, ((minutes % 60) + 60) % 60).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const span = minutes => (minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${Math.max(1, Math.round(minutes))} min`);
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
const byTime = (a, b) => (minutesOf(a.time) ?? 9999) - (minutesOf(b.time) ?? 9999);
const tasksOn = iso => state.tasks.filter(task => task.date === iso).sort(byTime);
const carried = () => state.tasks.filter(task => task.date && !task.done && dayDiff(task.date, todayIso()) > 0);
const maybeLater = () => state.tasks.filter(task => !task.date && !task.done);
const dayLabel = offset => ['Yesterday', 'Today', 'Tomorrow'][offset + 1] ?? fromIso(isoDate(addDays(new Date(), offset))).toLocaleDateString([], { weekday: 'long' });
const greeting = () => {
  const hour = new Date().getHours();
  return hour < 5 ? 'Still up?' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};
const markShowedUp = () => {
  if (!state.showedUp.includes(todayIso())) state.showedUp.push(todayIso());
};

const ICONS = {
  now: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  plan: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16M8 14h5"/>',
  inbox: '<path d="M4 13l2.5-7h11L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 13h4.5l1 2h5l1-2H20"/>',
  filo: '<path d="M6 13a6 6 0 0 1 12 0v2a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M7.5 9.5 6 5l4 2.5M16.5 9.5 18 5l-4 2.5"/><circle cx="10" cy="13" r=".9" fill="currentColor"/><circle cx="14" cy="13" r=".9" fill="currentColor"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  later: '<path d="M12 6v6l4 2"/><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z"/>',
  steps: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  battery: '<rect x="3" y="7.5" width="16" height="9" rx="2"/><path d="M21 10.5v3M6 10.5v3"/>',
  smile: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 10h.01M15 10h.01"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>',
  cloud: '<path d="M7 17.5a4.5 4.5 0 0 1-.7-8.9A5.5 5.5 0 0 1 17 7.5a4 4 0 0 1 .5 8z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  park: '<path d="M5 20V5h7a4.5 4.5 0 0 1 0 9H5"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
const ENERGY = { low: ['Low', 'battery'], medium: ['Okay', 'smile'], high: ['High', 'bolt'] };
const ring = (fraction, size = 120, stroke = 10) => {
  const radius = (size - stroke) / 2, length = 2 * Math.PI * radius;
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke-width="${stroke}"/><circle class="ring-fill" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke-width="${stroke}" stroke-dasharray="${length}" stroke-dashoffset="${length * (1 - Math.max(0, Math.min(1, fraction)))}"/></svg>`;
};

/* ---------- Choosing "now": one task, chosen for the moment ---------- */
function pickNow() {
  const now = nowMinutes(), open = tasksOn(todayIso()).filter(task => !task.done && !skipped.has(task.id));
  const current = open.find(task => task.time && minutesOf(task.time) <= now && now < minutesOf(task.time) + task.duration);
  if (current) return { task: current, kind: 'now' };
  const upcoming = open.filter(task => task.time && minutesOf(task.time) > now);
  if (upcoming[0] && minutesOf(upcoming[0].time) - now <= 30) return { task: upcoming[0], kind: 'soon' };
  // Anything flexible today, plus things carried over from earlier days, can fill the gap.
  const flexible = [...open.filter(task => !task.time || minutesOf(task.time) + task.duration <= now), ...carried().filter(task => !skipped.has(task.id))];
  const score = task => (task.top ? 4 : 0) + (state.energy && task.energy === state.energy ? 3 : 0) + (state.energy === 'low' && task.energy === 'high' ? -3 : 0) - task.duration / 120 - (task.date !== todayIso() ? 0.5 : 0);
  const best = flexible.sort((a, b) => score(b) - score(a))[0];
  if (best) return { task: best, kind: state.energy && best.energy === state.energy ? 'energy' : best.top ? 'top' : best.date !== todayIso() ? 'carried' : 'pick' };
  if (upcoming[0]) return { task: upcoming[0], kind: 'next' };
  return null;
}
function filoLine(pick) {
  const today = tasksOn(todayIso()), done = today.filter(task => task.done).length;
  if (state.session) return 'I’m still holding your place. Want to pick it back up?';
  if (!pick) return done ? `${plural(done, 'thing')} done today. That counts. Rest is allowed.` : 'Nothing on today. Want to grab something from Maybe later?';
  if (pick.kind === 'soon') return 'Something starts soon. Wrap up gently, I’ll wait with you.';
  if (state.energy === 'low') return 'Low energy is fine. I picked something light.';
  if (done === 0) return 'Let’s just start. Two minutes is enough.';
  return `${plural(done, 'thing')} done already. One more?`;
}

/* ---------- Header: clock and day left, always visible ---------- */
function renderTop() {
  const now = nowMinutes(), start = minutesOf(state.settings.dayStart), end = minutesOf(state.settings.dayEnd);
  const left = Math.max(0, end - now), fraction = Math.min(1, Math.max(0, (now - start) / (end - start)));
  top.innerHTML = `
    <img class="top-logo" src="/title.webp" alt="Scaffold" width="2000" height="494" />
    <div class="top-time">
      <span class="top-clock">${clock(now)}</span>
      <span class="day-left" title="Time left before your day ends at ${clock(end)}"><span class="day-left-bar"><span style="width:${Math.round(fraction * 100)}%"></span></span>${left ? `${span(left)} left today` : 'Day’s done'}</span>
    </div>`;
}

/* ---------- Now ---------- */
function nowCard(pick) {
  const { task, kind } = pick, now = nowMinutes();
  const start = minutesOf(task.time), firstStep = task.steps.find(step => !step.done);
  const label = { now: 'Now', soon: `Up next · in ${span(start - now)}`, energy: `Fits your energy`, top: 'From your top 3', pick: 'Picked for now', carried: 'From earlier · no rush', next: `Next · ${clock(start ?? 0)}` }[kind];
  const fraction = kind === 'now' ? (start + task.duration - now) / task.duration : kind === 'soon' ? (start - now) / 30 : task.duration / 60;
  const centre = kind === 'now' ? `<strong>${span(start + task.duration - now)}</strong><span>left</span>` : kind === 'soon' ? `<strong>${span(start - now)}</strong><span>to go</span>` : `<strong>${span(task.duration)}</strong><span>about</span>`;
  const doneSteps = task.steps.filter(step => step.done).length;
  return `
    <article class="now-card tag-${task.tag.toLowerCase()}" data-id="${task.id}">
      <p class="now-kicker">${esc(label)}</p>
      <div class="now-body">
        <div class="now-text">
          <h2 class="now-title">${esc(task.title)}</h2>
          <p class="now-meta"><span class="tag">${esc(task.tag)}</span>${task.date !== todayIso() ? 'Carried over, whenever suits' : task.time ? `${clock(start)} – ${clock(start + task.duration)}` : 'Any time today'}</p>
        </div>
        <div class="now-ring">${ring(fraction, 104, 9)}<span class="now-ring-label">${centre}</span></div>
      </div>
      ${firstStep ? `<button type="button" class="next-step" data-action="details"><span class="next-step-label">${task.steps.length > 1 ? `Step ${doneSteps + 1} of ${task.steps.length}` : 'First step'}</span>${esc(firstStep.text)}</button>`
        : `<button type="button" class="soft-button" data-action="breakdown">${icon('steps')} Break it into small steps</button>`}
      <button type="button" class="primary big" data-action="start" data-minutes="2">${icon('play')} Start with just 2 minutes</button>
      <div class="now-actions">
        <button type="button" class="ghost-button" data-action="start" data-minutes="${state.settings.focusMinutes}">${icon('now')} Focus ${state.settings.focusMinutes}m</button>
        <button type="button" class="ghost-button" data-action="done">${icon('check')} Done</button>
        <button type="button" class="ghost-button" data-action="not-now">${icon('later')} Not now</button>
      </div>
    </article>`;
}
function renderNow() {
  const pick = pickNow(), today = tasksOn(todayIso()), done = today.filter(task => task.done), carry = carried();
  const now = nowMinutes(), heads = today.find(task => !task.done && task.time && minutesOf(task.time) > now && minutesOf(task.time) - now <= 10 && task !== pick?.task);
  const then = today.filter(task => !task.done && task.time && minutesOf(task.time) > now && task !== pick?.task)[0];
  const session = state.session && state.tasks.find(task => task.id === state.session.taskId);
  const energyFresh = state.energy && Date.now() - (state.energyAt ?? 0) < 4 * 36e5;
  sheet.innerHTML = `
    <p class="greeting">${greeting()}. <span>One thing at a time.</span></p>
    ${heads ? `<p class="heads-up" role="status">${icon('now')} Heads up: <strong>${esc(heads.title)}</strong> starts in ${span(minutesOf(heads.time) - now)}. Start wrapping up.</p>` : ''}
    ${session ? `<section class="resume"><div><p class="resume-kicker">You were focusing on</p><p class="resume-title">${esc(session.title)}</p></div><button type="button" class="primary small" data-action="resume">${icon('play')} Resume</button></section>` : ''}
    ${energyFresh ? `<button type="button" class="energy-chip" data-action="energy-reset">${icon(ENERGY[state.energy][1])} Energy: ${ENERGY[state.energy][0]} · change</button>` : `
      <section class="energy" aria-label="How is your energy right now?">
        <p>Energy?</p>
        <div class="energy-options">${Object.entries(ENERGY).map(([key, [label, glyph]]) => `<button type="button" data-energy="${key}">${icon(glyph)}${label}</button>`).join('')}</div>
      </section>`}
    ${pick ? nowCard(pick) : `
      <section class="all-clear"><div class="all-clear-filo">${filoSvg('Filo celebrating')}</div><h2>All clear for now</h2><p>${done.length ? `You finished ${plural(done.length, 'thing')} today. Rest counts too.` : 'Nothing planned. Capture something, or pull one thing from Maybe later.'}</p>
      <button type="button" class="soft-button" data-view-go="plan">${icon('plan')} Open your plan</button></section>`}
    ${then ? `<p class="then">Then <strong>${clock(minutesOf(then.time))}</strong> · ${esc(then.title)}</p>` : ''}
    ${carry.length ? `
      <section class="carry">
        <p><strong>${plural(carry.length, 'thing')} from earlier</strong> · no stress: ${carry.slice(0, 2).map(task => esc(task.title)).join(', ')}${carry.length > 2 ? ` +${carry.length - 2}` : ''}</p>
        <div class="carry-actions"><button type="button" class="chip" data-carry="today">Do today</button><button type="button" class="chip" data-carry="tomorrow">Tomorrow</button><button type="button" class="chip" data-carry="later">Later</button></div>
      </section>` : ''}
    <section class="progress-row">
      <div class="progress-dots" aria-label="${done.length} of ${today.length} done today">${today.map(task => `<span class="${task.done ? 'is-done' : ''}"></span>`).join('')}</div>
      <p>${done.length ? `<strong>${done.length} done</strong> today 🎉` : 'Your first one is the hardest. You’ve got this.'}</p>
    </section>
    <section class="filo-row"><button type="button" class="filo-mini" data-action="poke" aria-label="Say hi to Filo">${filoSvg('Filo')}</button><p class="bubble">${esc(filoLine(pick))}</p></section>`;
  setMood(sheet, pick ? 'idle' : 'happy');
}

/* ---------- Plan: the day, with time made visible ---------- */
function block(task, now, isToday) {
  const start = minutesOf(task.time), end = start + task.duration, live = isToday && start <= now && now < end;
  const height = Math.round(Math.min(150, Math.max(58, task.duration * 1.25)));
  return `
    <li class="block tag-${task.tag.toLowerCase()}${task.done ? ' is-done' : ''}${live ? ' is-live' : ''}" style="--h:${height}px" data-id="${task.id}">
      <time>${clock(start)}</time>
      <div class="block-card">
        ${live ? `<span class="block-progress" style="width:${Math.round(((now - start) / task.duration) * 100)}%"></span>` : ''}
        <button type="button" class="check" role="checkbox" aria-checked="${task.done}" data-action="toggle" aria-label="${task.done ? 'Mark not done' : 'Mark done'}: ${esc(task.title)}">${icon('check')}</button>
        <button type="button" class="block-main" data-action="details"><span class="block-title">${esc(task.title)}</span><span class="block-meta">${span(task.duration)} · ${ENERGY[task.energy][0]} energy${task.steps.length ? ` · ${task.steps.filter(step => step.done).length}/${task.steps.length} steps` : ''}</span></button>
        <button type="button" class="star" data-action="top" aria-pressed="${task.top}" aria-label="${task.top ? 'Remove from' : 'Add to'} top 3">${icon('star')}</button>
      </div>
    </li>`;
}
function row(task) {
  return `<li class="row tag-${task.tag.toLowerCase()}${task.done ? ' is-done' : ''}" data-id="${task.id}">
    <button type="button" class="check" role="checkbox" aria-checked="${task.done}" data-action="toggle" aria-label="${task.done ? 'Mark not done' : 'Mark done'}: ${esc(task.title)}">${icon('check')}</button>
    <button type="button" class="block-main" data-action="details"><span class="block-title">${esc(task.title)}</span><span class="block-meta">${span(task.duration)} · ${ENERGY[task.energy][0]} energy</span></button>
    <button type="button" class="star" data-action="top" aria-pressed="${task.top}" aria-label="${task.top ? 'Remove from' : 'Add to'} top 3">${icon('star')}</button>
  </li>`;
}
function renderPlan() {
  const iso = isoDate(addDays(new Date(), planDay)), isToday = planDay === 0, now = nowMinutes();
  const tasks = tasksOn(iso), timed = tasks.filter(task => task.time), anytime = tasks.filter(task => !task.time), tops = tasks.filter(task => task.top);
  let cursor = minutesOf(state.settings.dayStart), nowShown = !isToday;
  const items = [];
  for (const task of timed) {
    const start = minutesOf(task.time);
    if (!nowShown && now < start) {
      if (now > cursor + 10) items.push(`<li class="gap" style="--h:${Math.min(70, Math.max(24, (now - cursor) * 0.5))}px"><span>${span(now - cursor)} free</span></li>`);
      items.push(`<li class="now-line"><span>Now · ${clock(now)}</span></li>`);
      cursor = Math.max(cursor, now);
      nowShown = true;
    }
    if (start - cursor >= 15) items.push(`<li class="gap" style="--h:${Math.min(70, Math.max(24, (start - cursor) * 0.5))}px"><span>${span(start - cursor)} free</span></li>`);
    if (!nowShown && start <= now && now < start + task.duration) nowShown = true;
    items.push(block(task, now, isToday));
    cursor = Math.max(cursor, start + task.duration);
  }
  if (!nowShown) items.push(`<li class="now-line"><span>Now · ${clock(now)}</span></li>`);
  const later = maybeLater();
  sheet.innerHTML = `
    <div class="segmented" role="tablist" aria-label="Day">${[-1, 0, 1].map(offset => `<button type="button" role="tab" aria-selected="${offset === planDay}" data-plan-day="${offset}">${dayLabel(offset)}</button>`).join('')}</div>
    <section class="top3">
      <h2 class="section-title">${icon('star')} Top 3 <span>${tops.length}/3</span></h2>
      ${tops.length ? `<ul class="rows">${tops.map(row).join('')}</ul>` : '<p class="hint">Tap the star on up to three things that matter most. The rest can wait.</p>'}
    </section>
    ${timed.length ? `<h2 class="section-title">${icon('now')} ${isToday ? 'Today' : dayLabel(planDay)}, by time</h2><ol class="timeline">${items.join('')}</ol>` : ''}
    ${anytime.length ? `<h2 class="section-title">${icon('steps')} Any time</h2><ul class="rows">${anytime.map(row).join('')}</ul>` : ''}
    ${!tasks.length ? `<section class="all-clear small"><div class="all-clear-filo">${filoSvg('Filo resting')}</div><p>Nothing here yet. Use the capture button to add something.</p></section>` : ''}
    ${later.length ? `<details class="later"><summary>${icon('later')} Maybe later <span>${later.length}</span></summary><ul class="rows">${later.map(task => `<li class="row tag-${task.tag.toLowerCase()}" data-id="${task.id}"><button type="button" class="block-main" data-action="details"><span class="block-title">${esc(task.title)}</span><span class="block-meta">${span(task.duration)} · no date, no pressure</span></button><button type="button" class="chip" data-action="today">Today</button></li>`).join('')}</ul></details>` : ''}`;
  setMood(sheet, 'idle');
}

/* ---------- Inbox: brain dump, already sorted ---------- */
const MOODS = { upbeat: 'Upbeat', reflective: 'Reflective', grateful: 'Grateful', uneasy: 'Uneasy' };
function renderInbox() {
  const ideas = state.ideas.map(item => ({ ...item, kind: 'idea' })), thoughts = state.thoughts.map(item => ({ ...item, kind: 'thought' }));
  const items = [...(inboxFilter !== 'thoughts' ? ideas : []), ...(inboxFilter !== 'ideas' ? thoughts : [])].sort((a, b) => b.createdAt - a.createdAt);
  sheet.innerHTML = `
    <p class="greeting">Your brain dump. <span>Nothing here needs doing right now.</span></p>
    <div class="segmented" role="tablist" aria-label="Show">${[['all', 'All'], ['ideas', `Ideas · ${ideas.length}`], ['thoughts', `Thoughts · ${thoughts.length}`]].map(([key, label]) => `<button type="button" role="tab" aria-selected="${inboxFilter === key}" data-inbox="${key}">${label}</button>`).join('')}</div>
    <ul class="inbox">${items.map(item => `
      <li class="note is-${item.kind}${item.kind === 'thought' ? ` mood-${item.mood}` : ''}" data-id="${item.id}" data-kind="${item.kind}">
        <div class="note-head">${item.kind === 'idea' ? `<span class="note-type">${icon('bulb')} Idea</span>` : `<span class="note-type">${icon('cloud')} ${MOODS[item.mood]}</span>`}<time>${new Date(item.createdAt).toLocaleDateString([], { weekday: 'short' })} ${new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div>
        <p>${esc(item.text)}</p>
        <div class="note-actions">${item.kind === 'idea' ? `<button type="button" class="star" data-action="star-idea" aria-pressed="${item.starred}" aria-label="Star idea">${icon('star')}</button><button type="button" class="ghost-button" data-action="idea-task">${icon('plus')} Make it a task</button>` : ''}<button type="button" class="ghost-button" data-action="remove-note" aria-label="Delete">${icon('trash')}</button></div>
      </li>`).join('') || '<li class="hint">Empty. Lovely and calm.</li>'}</ul>`;
}

/* ---------- Filo and settings ---------- */
function renderFilo() {
  const week = Array.from({ length: 7 }, (_, index) => isoDate(addDays(new Date(), index - 6)));
  const showed = week.filter(iso => state.showedUp.includes(iso)).length, settings = state.settings;
  sheet.innerHTML = `
    <section class="filo-stage"><div class="filo-big" data-hearts>${filoSvg('Filo')}</div>
      <p class="bubble is-centered">${esc(showed ? `You showed up ${plural(showed, 'day')} this week. Every one counts.` : 'Every day is a fresh start.')}</p></section>
    <section class="card">
      <h2 class="section-title">Days you showed up</h2>
      <div class="week-dots">${week.map(iso => `<span class="${state.showedUp.includes(iso) ? 'is-on' : ''}"><i></i>${fromIso(iso).toLocaleDateString([], { weekday: 'narrow' })}</span>`).join('')}</div>
      <p class="hint">No streaks here. Missing a day never resets anything.</p>
    </section>
    <section class="card sparks"><div><strong>${icon('sparkle')} ${state.sparks}</strong><span>sparks earned from steps and tasks</span></div>
      <div class="filo-actions"><button type="button" class="soft-button" data-action="pet">${icon('heart')} Pet Filo</button><button type="button" class="soft-button" data-action="snack">Snack · 5 ✨</button></div></section>
    <section class="card settings" aria-labelledby="settings-title">
      <h2 class="section-title" id="settings-title">Make it yours</h2>
      <label class="setting"><span>Calm motion<small>Turns off bouncing, confetti and moving extras</small></span><input type="checkbox" data-setting="calm" ${settings.motion ? '' : 'checked'} /></label>
      <label class="setting"><span>Gentle sounds<small>A soft chime when a timer ends</small></span><input type="checkbox" data-setting="sound" ${settings.sound ? 'checked' : ''} /></label>
      <label class="setting"><span>Larger text</span><input type="checkbox" data-setting="large" ${settings.textSize === 'large' ? 'checked' : ''} /></label>
      <div class="setting"><span>Focus length</span><div class="segmented small">${[10, 15, 25].map(minutes => `<button type="button" aria-selected="${settings.focusMinutes === minutes}" data-focus-length="${minutes}">${minutes}m</button>`).join('')}</div></div>
      <label class="setting"><span>My day ends at</span><input type="time" data-setting="dayEnd" value="${settings.dayEnd}" /></label>
    </section>
    <p class="footnote">Scaffold Focus follows research on attention and executive function. Every helper here is optional.</p>`;
  setMood(sheet, 'happy');
}

function render() {
  renderTop();
  ({ now: renderNow, plan: renderPlan, inbox: renderInbox, filo: renderFilo })[view]();
  for (const tab of document.querySelectorAll('.tab')) {
    const active = tab.dataset.view === view;
    tab.classList.toggle('is-active', active);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
}
function go(next) {
  view = next;
  render();
  sheet.scrollTop = 0;
}
function applySettings() {
  document.documentElement.dataset.motion = state.settings.motion ? 'on' : 'off';
  document.documentElement.dataset.text = state.settings.textSize;
}

/* ---------- Feedback: toast with undo, celebrations, chime ---------- */
let toastTimer, undoAction;
function toast(message, undo) {
  const element = $('#toast');
  element.querySelector('.toast-text').textContent = message;
  undoAction = undo;
  element.querySelector('.toast-undo').hidden = !undo;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.hidden = true; }, undo ? 5000 : 2600);
}
$('#toast .toast-undo').addEventListener('click', () => {
  undoAction?.();
  $('#toast').hidden = true;
  save();
  render();
});
const snapshot = () => JSON.stringify({ tasks: state.tasks, ideas: state.ideas, thoughts: state.thoughts, sparks: state.sparks });
const restore = saved => Object.assign(state, JSON.parse(saved));
function celebrate(big = false) {
  react(app, big ? 'is-hop' : 'is-bounce');
  setMood(app, 'happy');
  setTimeout(() => setMood(app, view === 'filo' ? 'happy' : 'idle'), 1600);
  if (!state.settings.motion || !big) return;
  const burst = document.createElement('div');
  burst.className = 'confetti';
  for (let index = 0; index < 26; index += 1) {
    const piece = document.createElement('i');
    piece.style.setProperty('--x', `${(Math.random() - 0.5) * 320}px`);
    piece.style.setProperty('--y', `${-120 - Math.random() * 220}px`);
    piece.style.setProperty('--r', `${Math.random() * 720}deg`);
    piece.style.background = ['#facc15', '#60a5fa', '#f472b6', '#4ade80', '#fb923c'][index % 5];
    burst.append(piece);
  }
  app.append(burst);
  setTimeout(() => burst.remove(), 1400);
}
function chime() {
  if (!state.settings.sound) return;
  try {
    const audio = new AudioContext();
    [523.25, 783.99].forEach((frequency, index) => {
      const tone = audio.createOscillator(), gain = audio.createGain();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, audio.currentTime + index * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + index * 0.22 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + index * 0.22 + 0.9);
      tone.connect(gain).connect(audio.destination);
      tone.start(audio.currentTime + index * 0.22);
      tone.stop(audio.currentTime + index * 0.22 + 1);
    });
  } catch {
    // Audio isn't available; the visual cue is enough.
  }
}

/* ---------- Task changes ---------- */
const find = id => state.tasks.find(task => task.id === id);
function complete(task, value = true) {
  const before = snapshot();
  task.done = value;
  task.doneAt = value ? Date.now() : null;
  if (value) {
    state.sparks += 3;
    markShowedUp();
  }
  save();
  render();
  if (value) {
    const left = tasksOn(todayIso()).filter(item => !item.done).length;
    celebrate(true);
    toast(left ? `Done! +3 sparks ✨` : 'Everything for today is done! 🎉', () => restore(before));
  }
}
function move(tasks, where, label) {
  const before = snapshot(), now = nowMinutes();
  for (const task of tasks) {
    if (where === 'today') Object.assign(task, { date: todayIso(), time: null });
    if (where === 'tomorrow') Object.assign(task, { date: isoDate(addDays(new Date(), 1)) });
    if (where === 'later') Object.assign(task, { date: null, time: null, top: false });
    if (where === 'hour') {
      const at = Math.min(23 * 60 + 55, Math.ceil((now + 60) / 5) * 5);
      Object.assign(task, { date: todayIso(), time: `${String(Math.floor(at / 60)).padStart(2, '0')}:${String(at % 60).padStart(2, '0')}` });
    }
    if (where === 'tonight') Object.assign(task, { date: todayIso(), time: '19:30' });
  }
  save();
  render();
  toast(label, () => restore(before));
}

/* ---------- Bottom sheets ---------- */
let lastFocus;
function openModal(modal) {
  lastFocus = document.activeElement;
  modal.hidden = false;
  requestAnimationFrame(() => {
    modal.classList.add('is-open');
    modal.querySelector('.modal-sheet').focus({ preventScroll: true });
  });
}
function closeModal(modal) {
  if (modal.id === 'capture') stopListening();
  modal.classList.remove('is-open');
  setTimeout(() => { modal.hidden = true; }, 220);
  lastFocus?.focus?.({ preventScroll: true });
  render();
}
for (const modal of document.querySelectorAll('.modal')) {
  modal.addEventListener('click', event => {
    if (event.target.matches('.modal-scrim') || event.target.closest('[data-close]')) closeModal(modal);
  });
}

// Task details edit in place and save as you go, so nothing is lost if the sheet is closed.
const details = $('#details');
let editing = null;
function openDetails(task) {
  editing = task;
  renderDetails();
  openModal(details);
}
function renderDetails() {
  const task = editing;
  details.querySelector('.details-body').innerHTML = `
    <label class="field">What is it?<input type="text" data-field="title" value="${esc(task.title)}" maxlength="120" /></label>
    <div class="field-row">
      <label class="field">Day<input type="date" data-field="date" value="${task.date ?? ''}" /></label>
      <label class="field">Time<input type="time" data-field="time" value="${task.time ?? ''}" step="300" /></label>
    </div>
    <p class="hint">Leave the time empty for “any time”. Clear the day for “maybe later”.</p>
    <div class="field">How long?<div class="segmented small">${[10, 15, 30, 45, 60, 90].map(minutes => `<button type="button" aria-selected="${task.duration === minutes}" data-duration="${minutes}">${span(minutes)}</button>`).join('')}</div></div>
    <div class="field">Energy it needs<div class="segmented small">${Object.entries(ENERGY).map(([key, [label]]) => `<button type="button" aria-selected="${task.energy === key}" data-task-energy="${key}">${label}</button>`).join('')}</div></div>
    <label class="setting"><span>${icon('star')} In my top 3</span><input type="checkbox" data-field="top" ${task.top ? 'checked' : ''} /></label>
    <div class="steps">
      <div class="steps-head"><h3>Small steps</h3><button type="button" class="ghost-button" data-action="auto-steps">${icon('steps')} ${task.steps.length ? 'Suggest again' : 'Break it down for me'}</button></div>
      <ul>${task.steps.map(step => `<li data-step="${step.id}"><button type="button" class="check small" role="checkbox" aria-checked="${step.done}" data-action="step">${icon('check')}</button><span>${esc(step.text)}</span><button type="button" class="icon-button" data-action="remove-step" aria-label="Remove step">${icon('close')}</button></li>`).join('')}</ul>
      <form class="add-step"><input type="text" placeholder="Add a step" aria-label="Add a step" maxlength="100" /><button type="submit" class="icon-button" aria-label="Add step">${icon('plus')}</button></form>
    </div>
    <div class="details-actions">
      <button type="button" class="ghost-button danger" data-action="delete-task">${icon('trash')} Delete</button>
      <button type="button" class="primary" data-close>Done</button>
    </div>`;
}
details.addEventListener('input', event => {
  const field = event.target.dataset.field;
  if (!field || !editing) return;
  if (field === 'top') editing.top = event.target.checked;
  else if (field === 'title') {
    editing.title = event.target.value.trim() || editing.title;
    editing.tag = tagOf(editing.title);
  } else editing[field] = event.target.value || null;
  save();
});
details.addEventListener('click', event => {
  const task = editing;
  const target = event.target.closest('[data-duration], [data-task-energy], [data-action]');
  if (!target || !task) return;
  if (target.dataset.duration) task.duration = Number(target.dataset.duration);
  else if (target.dataset.taskEnergy) task.energy = target.dataset.taskEnergy;
  else if (target.dataset.action === 'auto-steps') task.steps = breakDown(task.title);
  else if (target.dataset.action === 'step') {
    const step = task.steps.find(item => item.id === target.closest('[data-step]').dataset.step);
    step.done = !step.done;
    if (step.done) {
      state.sparks += 1;
      markShowedUp();
      react(details, 'is-bounce');
    }
  } else if (target.dataset.action === 'remove-step') task.steps = task.steps.filter(item => item.id !== target.closest('[data-step]').dataset.step);
  else if (target.dataset.action === 'delete-task') {
    const before = snapshot();
    state.tasks = state.tasks.filter(item => item !== task);
    save();
    closeModal(details);
    toast('Deleted', () => restore(before));
    return;
  } else return;
  save();
  renderDetails();
});
details.addEventListener('submit', event => {
  event.preventDefault();
  const input = event.target.querySelector('input');
  if (!input.value.trim() || !editing) return;
  editing.steps.push({ id: uid(), text: input.value.trim(), done: false });
  save();
  renderDetails();
  details.querySelector('.add-step input').focus();
});

// "Not now": moving something is planning, not failing.
const notNow = $('#not-now');
let deferring = null;
function openNotNow(task) {
  deferring = task;
  notNow.querySelector('.not-now-title').textContent = task.title;
  notNow.querySelector('[data-defer="tonight"]').hidden = new Date().getHours() >= 19;
  openModal(notNow);
}
notNow.addEventListener('click', event => {
  const option = event.target.closest('[data-defer]');
  if (!option || !deferring) return;
  const where = option.dataset.defer;
  closeModal(notNow);
  if (where === 'other') {
    skipped.add(deferring.id);
    render();
    return toast('Okay, here’s something else.');
  }
  const labels = { hour: 'Moved to an hour from now', tonight: 'Moved to tonight', tomorrow: 'Moved to tomorrow', later: 'Parked in Maybe later' };
  move([deferring], where, labels[where]);
});

/* ---------- Capture: voice or text, sorted automatically ---------- */
const capture = $('#capture'), input = $('#capture-text'), list = capture.querySelector('.sorted-list'), saveButton = capture.querySelector('.save-capture');
const micButton = capture.querySelector('.mic'), micStatus = capture.querySelector('.mic-status');
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const TYPES = ['task', 'idea', 'thought'];
let items = [], recognition = null, listening = false;
capture.querySelector('.mic-filo').innerHTML = filoSvg('Filo');
const describe = item => (item.type === 'task'
  ? `${item.offset === 0 ? 'Today' : item.offset === 1 ? 'Tomorrow' : fromIso(isoDate(addDays(new Date(), item.offset))).toLocaleDateString([], { weekday: 'long' })}${item.time ? ` · ${clock(minutesOf(item.time))}` : ''} · ${span(item.duration)}`
  : item.type === 'idea' ? 'Goes to your inbox' : MOODS[item.mood]);
function paintSorted() {
  capture.querySelector('.sorted').hidden = !items.length;
  list.innerHTML = items.map((item, index) => `
    <li class="sorted-item type-${item.type}">
      <button type="button" class="type-chip" data-index="${index}" aria-label="${item.type}, tap to change">${item.type}</button>
      <div><p>${esc(item.text)}</p><p class="sorted-meta">${esc(describe(item))}</p></div>
      <button type="button" class="icon-button" data-remove="${index}" aria-label="Remove">${icon('close')}</button>
    </li>`).join('');
  saveButton.disabled = !items.length;
  saveButton.textContent = items.length ? `Save ${plural(items.length, 'thing')}` : 'Save';
}
function resort() {
  items = input.value.trim() ? sort(input.value) : [];
  paintSorted();
}
list.addEventListener('click', event => {
  const chip = event.target.closest('[data-index]'), remove = event.target.closest('[data-remove]');
  if (chip) {
    const index = Number(chip.dataset.index), item = items[index], next = TYPES[(TYPES.indexOf(item.type) + 1) % 3];
    items[index] = next === 'task' ? { type: 'task', text: item.text, offset: 0, time: null, duration: 30, tag: tagOf(item.text) } : { type: next, text: item.text, ...(next === 'thought' ? { mood: moodOf(item.text) } : {}) };
  }
  if (remove) items.splice(Number(remove.dataset.remove), 1);
  if (chip || remove) paintSorted();
});
let typingTimer;
input.addEventListener('input', () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(resort, 250);
});
function stopListening() {
  recognition?.stop();
}
function setListening(on, message) {
  listening = on;
  capture.classList.toggle('is-listening', on);
  micButton.setAttribute('aria-pressed', String(on));
  micButton.setAttribute('aria-label', on ? 'Stop listening' : 'Start talking');
  micStatus.textContent = message ?? (on ? 'Listening… tap to stop' : 'Tap and just talk');
  setMood(capture, on ? 'listening' : 'idle');
}
micButton.addEventListener('click', () => {
  if (listening) return stopListening();
  if (!Recognition) {
    micStatus.textContent = 'Voice isn’t available here. Typing works too.';
    return input.focus();
  }
  recognition = new Recognition();
  recognition.lang = navigator.language || 'en-US';
  recognition.interimResults = true;
  recognition.continuous = true;
  const before = input.value.trim() ? `${input.value.trim()} ` : '';
  recognition.onresult = event => {
    input.value = before + [...event.results].map(result => result[0].transcript).join(' ').replace(/\s+/g, ' ').trim();
    resort();
  };
  recognition.onerror = event => setListening(false, { 'not-allowed': 'Microphone is blocked. Typing works too.', 'no-speech': 'Didn’t catch that. Try again?' }[event.error] ?? 'Voice stopped. Typing works too.');
  recognition.onend = () => {
    if (listening) setListening(false);
  };
  try {
    recognition.start();
    setListening(true);
  } catch {
    setListening(false, 'Couldn’t start the mic. Typing works too.');
  }
});
function openCapture() {
  input.value = '';
  items = [];
  resort();
  setListening(false);
  openModal(capture);
}
saveButton.addEventListener('click', () => {
  const now = Date.now();
  for (const [index, item] of items.entries()) {
    if (item.type === 'task') state.tasks.push({ id: uid(), title: item.text, date: isoDate(addDays(new Date(), item.offset)), time: item.time, duration: item.duration, tag: item.tag, energy: energyOf(item.text), top: false, steps: [], done: false, doneAt: null, createdAt: now + index });
    if (item.type === 'idea') state.ideas.push({ id: uid(), text: item.text, starred: false, createdAt: now + index });
    if (item.type === 'thought') state.thoughts.push({ id: uid(), text: item.text, mood: item.mood, createdAt: now + index });
  }
  const count = items.length;
  save();
  closeModal(capture);
  toast(`Saved ${plural(count, 'thing')}. Your head can let go now.`);
  setMood(app, 'thinking');
  setTimeout(() => setMood(app, 'idle'), 1800);
});

/* ---------- Focus mode: one step, a visual timer and Filo working beside you ---------- */
const focus = $('#focus'), focusRing = focus.querySelector('.focus-ring');
focus.querySelector('.focus-filo').innerHTML = filoSvg('Filo working with you');
let ticker = null;
function startFocus(task, minutes) {
  state.session = { taskId: task.id, mode: 'focus', total: minutes * 60000, endsAt: Date.now() + minutes * 60000, paused: null };
  markShowedUp();
  save();
  showFocus();
}
function showFocus() {
  focus.hidden = false;
  focus.classList.remove('is-ended');
  requestAnimationFrame(() => focus.classList.add('is-open'));
  renderFocus();
  clearInterval(ticker);
  ticker = setInterval(tick, 500);
  tick();
}
function renderFocus() {
  const session = state.session, task = find(session.taskId);
  if (!task) return hideFocus(true);
  const step = task.steps.find(item => !item.done), index = task.steps.indexOf(step);
  focus.querySelector('.focus-task').textContent = task.title;
  focus.querySelector('.focus-step').innerHTML = session.mode === 'break'
    ? '<p class="focus-step-label">Break</p><p class="focus-step-text">Water, stretch, look out of a window.</p>'
    : step ? `<p class="focus-step-label">Step ${index + 1} of ${task.steps.length}</p><p class="focus-step-text">${esc(step.text)}</p><button type="button" class="focus-step-done" data-focus="step">${icon('check')} Step done</button>`
      : `<p class="focus-step-label">Just this</p><p class="focus-step-text">${esc(task.title)}</p><button type="button" class="focus-step-done" data-focus="breakdown">${icon('steps')} Break it into steps</button>`;
  focus.querySelector('.focus-caption').textContent = session.mode === 'break' ? 'Filo is stretching too' : 'Filo is building with you';
  focus.classList.toggle('is-break', session.mode === 'break');
}
function remaining() {
  const session = state.session;
  return session.paused ?? Math.max(0, session.endsAt - Date.now());
}
function tick() {
  const session = state.session;
  if (!session) return;
  const left = remaining(), fraction = left / session.total;
  const length = 2 * Math.PI * 112;
  focusRing.querySelector('.ring-fill').setAttribute('stroke-dashoffset', String(length * (1 - fraction)));
  focusRing.querySelector('.wedge').setAttribute('d', wedge(fraction));
  const minutes = Math.ceil(left / 60000);
  focus.querySelector('.focus-time strong').textContent = left > 60000 ? `${minutes}` : `${Math.ceil(left / 1000)}`;
  focus.querySelector('.focus-time span').textContent = left > 60000 ? `min left` : 'sec left';
  focus.querySelector('.focus-time').setAttribute('aria-label', `${minutes} minutes left`);
  focus.classList.toggle('is-half', fraction <= 0.5 && fraction > 0);
  focus.querySelector('.pause').innerHTML = session.paused !== null ? `${icon('play')} Resume` : `${icon('pause')} Pause`;
  if (left <= 0 && !focus.classList.contains('is-ended')) {
    focus.classList.add('is-ended');
    focus.querySelector('.focus-end-title').textContent = session.mode === 'break' ? 'Break’s over' : session.total <= 2 * 60000 ? 'You started! That was the hard part.' : 'Time! Nice focus.';
    focus.querySelector('[data-focus="break"]').hidden = session.mode === 'break';
    focus.querySelector('[data-focus="more"]').textContent = session.mode === 'break' ? 'Back to it · 10 min' : 'Keep going · +10 min';
    chime();
    react(focus, 'is-hop');
    setMood(focus, 'happy');
  }
}
// Time-Timer style wedge: the coloured slice shrinks as time runs out.
function wedge(fraction) {
  if (fraction >= 0.999) return 'M120 120m-100 0a100 100 0 1 0 200 0a100 100 0 1 0-200 0';
  if (fraction <= 0) return '';
  const angle = fraction * Math.PI * 2, x = 120 + 100 * Math.sin(angle), y = 120 - 100 * Math.cos(angle);
  return `M120 120L120 20A100 100 0 ${fraction > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}Z`;
}
function hideFocus(clear = false) {
  clearInterval(ticker);
  focus.classList.remove('is-open', 'is-ended');
  setTimeout(() => { focus.hidden = true; }, 220);
  if (clear) state.session = null;
  save();
  render();
}
focus.addEventListener('click', event => {
  const control = event.target.closest('[data-focus]');
  if (!control || !state.session) return;
  const session = state.session, task = find(session.taskId);
  switch (control.dataset.focus) {
    case 'pause':
      if (session.paused !== null) {
        session.endsAt = Date.now() + session.paused;
        session.paused = null;
      } else session.paused = Math.max(0, session.endsAt - Date.now());
      save();
      return tick();
    case 'step': {
      const step = task.steps.find(item => !item.done);
      step.done = true;
      state.sparks += 1;
      markShowedUp();
      save();
      react(focus, 'is-bounce');
      if (task.steps.every(item => item.done)) {
        complete(task);
        return hideFocus(true);
      }
      return renderFocus();
    }
    case 'breakdown':
      task.steps = breakDown(task.title);
      save();
      return renderFocus();
    case 'more':
      Object.assign(session, { mode: 'focus', total: 10 * 60000, endsAt: Date.now() + 10 * 60000, paused: null });
      save();
      focus.classList.remove('is-ended');
      setMood(focus, 'idle');
      renderFocus();
      return tick();
    case 'break':
      Object.assign(session, { mode: 'break', total: 5 * 60000, endsAt: Date.now() + 5 * 60000, paused: null });
      save();
      focus.classList.remove('is-ended');
      renderFocus();
      return tick();
    case 'finish':
      hideFocus(true);
      return complete(task);
    case 'stop':
      hideFocus(true);
      return toast('Okay. It’ll be here when you’re ready.');
    case 'minimise':
      return hideFocus(false);
    case 'park': {
      const field = focus.querySelector('.park input');
      focus.querySelector('.park').hidden = false;
      return field.focus();
    }
  }
});
focus.querySelector('.park').addEventListener('submit', event => {
  event.preventDefault();
  const field = event.target.querySelector('input'), text = field.value.trim();
  if (!text) return;
  const now = Date.now();
  for (const [index, item] of sort(text).entries()) {
    if (item.type === 'task') state.tasks.push({ id: uid(), title: item.text, date: isoDate(addDays(new Date(), item.offset)), time: item.time, duration: item.duration, tag: item.tag, energy: energyOf(item.text), top: false, steps: [], done: false, doneAt: null, createdAt: now + index });
    else if (item.type === 'idea') state.ideas.push({ id: uid(), text: item.text, starred: false, createdAt: now + index });
    else state.thoughts.push({ id: uid(), text: item.text, mood: item.mood, createdAt: now + index });
  }
  save();
  field.value = '';
  event.target.hidden = true;
  const note = focus.querySelector('.park-note');
  note.hidden = false;
  setTimeout(() => { note.hidden = true; }, 2200);
});

/* ---------- Main interactions ---------- */
app.addEventListener('click', event => {
  if (event.target.closest('.modal, .focus')) return;
  const tab = event.target.closest('.tab');
  if (tab) return go(tab.dataset.view);
  const goTo = event.target.closest('[data-view-go]');
  if (goTo) return go(goTo.dataset.viewGo);
  const energy = event.target.closest('[data-energy]');
  if (energy) {
    state.energy = energy.dataset.energy;
    state.energyAt = Date.now();
    skipped.clear();
    save();
    render();
    return react(sheet, 'is-bounce');
  }
  const day = event.target.closest('[data-plan-day]');
  if (day) {
    planDay = Number(day.dataset.planDay);
    return render();
  }
  const filter = event.target.closest('[data-inbox]');
  if (filter) {
    inboxFilter = filter.dataset.inbox;
    return render();
  }
  const length = event.target.closest('[data-focus-length]');
  if (length) {
    state.settings.focusMinutes = Number(length.dataset.focusLength);
    save();
    return render();
  }
  const carry = event.target.closest('[data-carry]');
  if (carry) {
    const where = carry.dataset.carry, tasks = carried();
    return move(tasks, where, `${plural(tasks.length, 'thing')} ${where === 'today' ? 'added to today' : where === 'tomorrow' ? 'moved to tomorrow' : 'parked in Maybe later'}`);
  }
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const id = control.closest('[data-id]')?.dataset.id, task = id && find(id);
  switch (control.dataset.action) {
    case 'start': return startFocus(task, Number(control.dataset.minutes));
    case 'resume': return showFocus();
    case 'done': return complete(task);
    case 'toggle': return complete(task, !task.done);
    case 'not-now': return openNotNow(task);
    case 'details': return openDetails(task);
    case 'breakdown':
      task.steps = breakDown(task.title);
      save();
      render();
      return toast(`Broken into ${plural(task.steps.length, 'small step')}`);
    case 'top': {
      const tops = tasksOn(task.date).filter(item => item.top && item !== task);
      if (!task.top && tops.length >= 3) return toast('Top 3 is full. Unstar one first, so today stays doable.');
      task.top = !task.top;
      save();
      return render();
    }
    case 'today':
      return move([task], 'today', 'Added to today');
    case 'energy-reset':
      state.energy = null;
      save();
      return render();
    case 'star-idea': {
      const idea = state.ideas.find(item => item.id === id);
      idea.starred = !idea.starred;
      save();
      return render();
    }
    case 'idea-task': {
      const idea = state.ideas.find(item => item.id === id), fresh = { id: uid(), title: idea.text, date: todayIso(), time: null, duration: 30, tag: tagOf(idea.text), energy: energyOf(idea.text), top: false, steps: breakDown(idea.text), done: false, doneAt: null, createdAt: Date.now() };
      state.tasks.push(fresh);
      save();
      return openDetails(fresh);
    }
    case 'remove-note': {
      const before = snapshot(), kind = control.closest('[data-kind]').dataset.kind;
      state[kind === 'idea' ? 'ideas' : 'thoughts'] = state[kind === 'idea' ? 'ideas' : 'thoughts'].filter(item => item.id !== id);
      save();
      render();
      return toast('Deleted', () => restore(before));
    }
    case 'poke':
      return celebrate(false);
    case 'pet':
      hearts(sheet.querySelector('[data-hearts]'));
      return celebrate(false);
    case 'snack':
      if (state.sparks < 5) return toast('Filo needs 5 sparks for a snack. Tick off a step to earn some.');
      state.sparks -= 5;
      save();
      render();
      hearts(sheet.querySelector('[data-hearts]'), '🍪');
      return celebrate(false);
  }
});
app.addEventListener('change', event => {
  const setting = event.target.dataset.setting;
  if (!setting) return;
  if (setting === 'calm') state.settings.motion = !event.target.checked;
  if (setting === 'sound') state.settings.sound = event.target.checked;
  if (setting === 'large') state.settings.textSize = event.target.checked ? 'large' : 'normal';
  if (setting === 'dayEnd' && event.target.value) state.settings.dayEnd = event.target.value;
  save();
  applySettings();
  render();
});
$('.capture-button').addEventListener('click', openCapture);
addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const open = [...document.querySelectorAll('.modal')].find(modal => !modal.hidden);
  if (open) closeModal(open);
  else if (!focus.hidden) hideFocus(false);
});

// Keep the clock, "now" and time-left honest while the app stays open.
setInterval(() => {
  if ([...document.querySelectorAll('.modal')].every(modal => modal.hidden) && focus.hidden) render();
  else renderTop();
}, 30000);
applySettings();
render();
