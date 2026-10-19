import { filoSvg, react, setMood, hearts } from './filo.js';
import { sort, tagOf, moodOf } from './sorter.js';
import { seed, isoDate, addDays } from './seed.js';

/* ---------- State ---------- */
const STORAGE_KEY = 'scaffold.app.v1';
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
let view = 'today', selected = isoDate(new Date()), ideaFilter = 'all', scrollWeek = true;

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
const clock = (minutes) => new Date(2000, 0, 1, Math.floor(minutes / 60) % 24, minutes % 60).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const formatTime = time => (time ? clock(minutesOf(time)) : 'Anytime');
const nowMinutes = () => new Date().getHours() * 60 + new Date().getMinutes();
const dayLabel = (iso, style = 'long') => {
  const diff = dayDiff(todayIso(), iso);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return fromIso(iso).toLocaleDateString([], style === 'long' ? { weekday: 'long', month: 'short', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' });
};
// Mid-sentence form: "today", "tomorrow", or "Friday, Oct 23".
const dayPhrase = iso => (Math.abs(dayDiff(todayIso(), iso)) <= 1 ? dayLabel(iso).toLowerCase() : dayLabel(iso));
const ago = timestamp => {
  const minutes = Math.round((Date.now() - timestamp) / 6e4);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  const days = Math.round(minutes / 1440);
  return days === 1 ? 'yesterday' : `${days} days ago`;
};
const greeting = () => {
  const hour = new Date().getHours();
  return hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};
const tasksOn = iso => state.tasks.filter(task => task.date === iso).sort((a, b) => (minutesOf(a.time) ?? -1) - (minutesOf(b.time) ?? -1));
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const ICONS = {
  today: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/><circle cx="12" cy="15" r="1.6" fill="currentColor"/>',
  ideas: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>',
  thoughts: '<path d="M7 17.5a4.5 4.5 0 0 1-.7-8.9A5.5 5.5 0 0 1 17 7.5a4 4 0 0 1 .5 8z"/><circle cx="6" cy="21" r="1.2"/><circle cx="9.5" cy="19.5" r="1.4"/>',
  filo: '<path d="M6 13a6 6 0 0 1 12 0v2a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M7.5 9.5 6 5l4 2.5M16.5 9.5 18 5l-4 2.5"/><circle cx="10" cy="13" r=".9" fill="currentColor"/><circle cx="14" cy="13" r=".9" fill="currentColor"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  snack: '<circle cx="12" cy="12" r="7.5"/><circle cx="9.5" cy="10" r="1"/><circle cx="14" cy="9.5" r="1"/><circle cx="13" cy="14" r="1"/><circle cx="9.5" cy="14.5" r="1"/>',
  chat: '<path d="M5 6h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3v-3H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

/* ---------- Filo's voice ---------- */
const LINES = ['I believe in you!', 'One brick at a time.', 'Hydration check! 💧', 'You build, I cheer.', 'Tiny steps still count.', 'I love a good plan.', 'Hard hat on. Let\'s go!'];
function filoLine() {
  const iso = selected, tasks = tasksOn(iso), open = tasks.filter(task => !task.done), hour = new Date().getHours();
  if (iso !== todayIso()) return dayDiff(todayIso(), iso) > 0 ? `Planning ahead for ${dayPhrase(iso)}? ${open.length ? `${plural(open.length, 'task')} lined up.` : 'Nothing there yet.'}` : 'Looking back? You did good work here.';
  if (hour >= 23 || hour < 5) return 'It’s late… let’s rest and build tomorrow. 💤';
  if (!tasks.length) return 'Nothing planned yet. Tell me what’s on your mind!';
  if (!open.length) return 'Day cleared! I’m so proud of you. 🎉';
  const late = open.filter(task => task.time && minutesOf(task.time) + task.duration < nowMinutes());
  if (late.length >= 2) return `${plural(late.length, 'task')} slipped by. Want to move them to tomorrow?`;
  const next = open.find(task => task.time && minutesOf(task.time) >= nowMinutes() - 15);
  if (next) return `Next up at ${formatTime(next.time)}: ${next.title}.`;
  return `${plural(open.length, 'task')} left today. I’ll keep you company!`;
}
function filoMood() {
  const hour = new Date().getHours(), tasks = tasksOn(todayIso());
  if (hour >= 23 || hour < 5) return 'sleepy';
  if (tasks.length && tasks.every(task => task.done)) return 'happy';
  return 'idle';
}

/* ---------- Views ---------- */
function renderTop() {
  if (view === 'today') {
    const days = [];
    for (let offset = -7; offset <= 13; offset += 1) days.push(isoDate(addDays(new Date(), offset)));
    const scrolled = top.querySelector('.week')?.scrollLeft;
    top.className = 'app-top is-today';
    top.innerHTML = `
      <div class="top-row"><img class="top-logo" src="/title.webp" alt="Scaffold" width="2000" height="494" />${selected !== todayIso() ? '<button type="button" class="pill-button" data-action="go-today">Back to today</button>' : ''}</div>
      <div class="hello">
        <div class="hello-text">
          <p class="hello-kicker">${selected === todayIso() ? greeting() : esc(Math.abs(dayDiff(todayIso(), selected)) === 1 ? dayLabel(selected) : dayDiff(todayIso(), selected) > 0 ? 'Coming up' : 'Looking back')}</p>
          <h1 class="hello-title">${esc(fromIso(selected).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }))}</h1>
          <p class="bubble" aria-live="polite">${esc(filoLine())}</p>
        </div>
        <button type="button" class="filo-perch" data-action="poke" aria-label="Say hi to Filo">${filoSvg('Filo, your Scaffold buddy')}</button>
      </div>
      <div class="week" role="tablist" aria-label="Choose a day">${days.map(iso => {
        const date = fromIso(iso), tasks = tasksOn(iso), done = tasks.length && tasks.every(task => task.done);
        return `<button type="button" role="tab" class="day${iso === selected ? ' is-selected' : ''}${iso === todayIso() ? ' is-today' : ''}" data-day="${iso}" aria-selected="${iso === selected}" aria-label="${esc(dayLabel(iso))}, ${plural(tasks.length, 'task')}">
          <span class="day-name">${date.toLocaleDateString([], { weekday: 'narrow' })}</span><span class="day-number">${date.getDate()}</span><span class="day-dot${tasks.length ? (done ? ' is-done' : ' is-open') : ''}"></span></button>`;
      }).join('')}</div>`;
    setMood(top, filoMood());
    if (scrollWeek) requestAnimationFrame(() => top.querySelector('.day.is-selected')?.scrollIntoView({ inline: 'center', block: 'nearest' }));
    else if (scrolled !== undefined) top.querySelector('.week').scrollLeft = scrolled;
    scrollWeek = false;
    return;
  }
  const titles = {
    ideas: ['Ideas', `${plural(state.ideas.length, 'spark')} · ${state.ideas.filter(idea => idea.starred).length} starred`],
    thoughts: ['Thoughts', 'A quiet place for what’s on your mind'],
    filo: ['Filo', 'Your little builder buddy'],
  };
  const [title, subtitle] = titles[view];
  top.className = `app-top is-compact is-${view}`;
  top.innerHTML = `<div class="top-row"><img class="top-logo" src="/title.webp" alt="Scaffold" width="2000" height="494" /></div><h1 class="page-title">${title}</h1><p class="page-subtitle">${esc(subtitle)}</p>`;
}

function renderToday() {
  const tasks = tasksOn(selected), done = tasks.filter(task => task.done).length, open = tasks.filter(task => !task.done);
  const isToday = selected === todayIso(), isPast = dayDiff(todayIso(), selected) < 0;
  const timed = tasks.filter(task => task.time), anytime = tasks.filter(task => !task.time);
  const next = isToday ? open.find(task => task.time && minutesOf(task.time) >= nowMinutes() - 15) : open.find(task => task.time);
  const ratio = tasks.length ? done / tasks.length : 0, circumference = 2 * Math.PI * 22;
  const task = item => `
    <article class="task${item.done ? ' is-done' : ''}" data-id="${item.id}">
      <button type="button" class="check" role="checkbox" aria-checked="${item.done}" data-action="toggle" aria-label="${item.done ? 'Mark not done' : 'Mark done'}: ${esc(item.title)}">${icon('check')}</button>
      <button type="button" class="task-main" data-action="edit">
        <span class="task-title">${esc(item.title)}</span>
        <span class="task-meta"><span class="tag tag-${item.tag.toLowerCase()}">${esc(item.tag)}</span>${item.time ? `${formatTime(item.time)} – ${clock(minutesOf(item.time) + item.duration)}` : `${item.duration} min`}</span>
      </button>
    </article>`;
  let nowPlaced = !isToday;
  const rows = timed.map(item => {
    let marker = '';
    if (!nowPlaced && minutesOf(item.time) > nowMinutes()) {
      nowPlaced = true;
      marker = `<li class="now" aria-label="Now"><span>Now · ${clock(nowMinutes())}</span></li>`;
    }
    return `${marker}<li class="slot${item.done ? ' is-done' : ''}"><time>${formatTime(item.time)}</time><span class="slot-rail"><span class="slot-dot"></span></span>${task(item)}</li>`;
  }).join('') + (nowPlaced ? '' : `<li class="now" aria-label="Now"><span>Now · ${clock(nowMinutes())}</span></li>`);
  sheet.innerHTML = `
    <section class="summary">
      <svg class="ring" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="22"/><circle class="ring-fill" cx="28" cy="28" r="22" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference * (1 - ratio)}"/></svg>
      <div class="summary-text">
        <p class="summary-count"><strong>${done}</strong> of ${tasks.length} done</p>
        <p class="summary-next">${next ? `Next: ${esc(next.title)} · ${formatTime(next.time)}` : tasks.length ? (open.length ? `${plural(open.length, 'task')} without a time` : 'Everything’s done here') : 'A blank page. Capture something below.'}</p>
        ${(isToday || isPast) && open.length ? `<button type="button" class="link-button" data-action="rollover">Move ${open.length} unfinished to ${isPast ? 'today' : 'tomorrow'} ${icon('arrow')}</button>` : ''}
      </div>
    </section>
    ${tasks.length ? '' : `<section class="empty"><div class="empty-filo">${filoSvg('Filo waiting')}</div><p>Nothing planned for ${esc(dayPhrase(selected))}.</p><button type="button" class="primary small" data-action="capture">${icon('mic')} Capture something</button></section>`}
    ${timed.length ? `<h2 class="section-title">Schedule</h2><ol class="timeline">${rows}</ol>` : ''}
    ${anytime.length ? `<h2 class="section-title">Anytime</h2><div class="anytime">${anytime.map(task).join('')}</div>` : ''}`;
  setMood(sheet, 'idle');
}

function renderIdeas() {
  const ideas = state.ideas.filter(idea => ideaFilter === 'all' || idea.starred).sort((a, b) => b.createdAt - a.createdAt);
  sheet.innerHTML = `
    <div class="chips" role="group" aria-label="Filter ideas">
      <button type="button" class="chip${ideaFilter === 'all' ? ' is-active' : ''}" data-filter="all">All</button>
      <button type="button" class="chip${ideaFilter === 'starred' ? ' is-active' : ''}" data-filter="starred">${icon('star')} Starred</button>
    </div>
    ${ideas.length ? `<div class="ideas">${ideas.map(idea => `
      <article class="idea${idea.starred ? ' is-starred' : ''}" data-id="${idea.id}">
        <div class="idea-head"><span class="idea-icon">${icon('ideas')}</span><span class="idea-time">${ago(idea.createdAt)}</span>
          <button type="button" class="icon-button star" data-action="star" aria-pressed="${idea.starred}" aria-label="${idea.starred ? 'Unstar' : 'Star'} idea">${icon('star')}</button></div>
        <p class="idea-text">${esc(idea.text)}</p>
        <div class="idea-foot">
          <button type="button" class="soft-button" data-action="schedule">${icon('calendar')} Make it a task</button>
          <button type="button" class="icon-button" data-action="delete-idea" aria-label="Delete idea">${icon('trash')}</button>
        </div>
      </article>`).join('')}</div>` : `<section class="empty"><div class="empty-filo">${filoSvg('Filo thinking')}</div><p>${ideaFilter === 'starred' ? 'No starred ideas yet. Tap the star on one you love.' : 'No ideas yet. Say “what if…” into the capture button.'}</p></section>`}`;
  setMood(sheet, 'thinking');
}

const MOODS = { upbeat: 'Upbeat', reflective: 'Reflective', grateful: 'Grateful', uneasy: 'Uneasy' };
function renderThoughts() {
  const groups = new Map();
  for (const thought of [...state.thoughts].sort((a, b) => b.createdAt - a.createdAt)) {
    const key = isoDate(new Date(thought.createdAt));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(thought);
  }
  sheet.innerHTML = groups.size ? [...groups].map(([iso, thoughts]) => `
    <h2 class="section-title">${esc(dayLabel(iso))}</h2>
    <div class="thoughts">${thoughts.map(thought => `
      <article class="thought mood-${thought.mood}" data-id="${thought.id}">
        <div class="thought-head"><span class="mood"><span class="mood-dot"></span>${MOODS[thought.mood]}</span><time>${new Date(thought.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
          <button type="button" class="icon-button" data-action="delete-thought" aria-label="Delete thought">${icon('close')}</button></div>
        <p>${esc(thought.text)}</p>
      </article>`).join('')}</div>`).join('') : `<section class="empty"><div class="empty-filo">${filoSvg('Filo listening')}</div><p>Nothing here yet. Try “I feel…” or “I think…” in the capture button.</p></section>`;
}

function renderFilo() {
  const today = tasksOn(todayIso()), doneToday = today.filter(task => task.done).length;
  const week = state.tasks.filter(task => task.done && dayDiff(task.date, todayIso()) >= 0 && dayDiff(task.date, todayIso()) < 7).length;
  const totalDone = state.tasks.filter(task => task.done).length, level = Math.floor(totalDone / 8) + 1, progress = (totalDone % 8) / 8;
  let streak = 0;
  for (let offset = 0; offset > -365; offset -= 1) {
    const iso = isoDate(addDays(new Date(), offset));
    if (state.tasks.some(task => task.date === iso && task.done)) streak += 1;
    else if (offset < 0) break;
  }
  sheet.innerHTML = `
    <section class="filo-stage">
      <div class="filo-big" data-hearts>${filoSvg('Filo')}</div>
      <p class="bubble is-centered" aria-live="polite">${esc(filoLine())}</p>
      <div class="level"><span>Builder level ${level}</span><span class="level-bar"><span style="width:${Math.round(progress * 100)}%"></span></span><span>${totalDone % 8}/8 to level ${level + 1}</span></div>
    </section>
    <section class="stats">
      <div class="stat"><strong>${doneToday}/${today.length}</strong><span>done today</span></div>
      <div class="stat"><strong>${week}</strong><span>done this week</span></div>
      <div class="stat"><strong>${streak}</strong><span>day streak</span></div>
      <div class="stat"><strong>${state.filo.snacks}</strong><span>snacks earned</span></div>
    </section>
    <section class="filo-actions">
      <button type="button" class="soft-button" data-action="pet">${icon('heart')} Pet Filo</button>
      <button type="button" class="soft-button" data-action="feed">${icon('snack')} Give a snack</button>
      <button type="button" class="soft-button" data-action="chat">${icon('chat')} Say hi</button>
    </section>
    <p class="filo-note">Filo earns a snack for every task you finish. He's a puffball builder who loves plans, hard hats and hearing your ideas.</p>`;
  setMood(sheet, filoMood());
}

function render() {
  renderTop();
  ({ today: renderToday, ideas: renderIdeas, thoughts: renderThoughts, filo: renderFilo })[view]();
  for (const tab of document.querySelectorAll('.tab')) {
    const active = tab.dataset.view === view;
    tab.classList.toggle('is-active', active);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
}
function go(next) {
  if (next === view) return;
  view = next;
  scrollWeek = next === 'today';
  render();
  sheet.scrollTop = 0;
}

/* ---------- Toast and Filo reactions ---------- */
let toastTimer;
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.hidden = false;
  element.classList.remove('is-out');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    element.classList.add('is-out');
    setTimeout(() => { element.hidden = true; }, 300);
  }, 2600);
}
function cheer(kind = 'is-bounce', mood) {
  if (mood) {
    setMood(app, mood);
    setTimeout(() => setMood(app, view === 'ideas' ? 'thinking' : filoMood()), 1800);
  }
  react(app, kind);
}

/* ---------- Task editor ---------- */
const editor = $('#editor'), form = editor.querySelector('form');
let editing = null;
// Pass an existing task to edit it, or a draft (no id) to schedule something new.
function openEditor(draft) {
  editing = { id: draft.id ?? null };
  form.elements.title.value = draft.title;
  form.elements.date.value = draft.date;
  form.elements.time.value = draft.time ?? '';
  form.elements.anytime.checked = !draft.time;
  form.elements.time.disabled = !draft.time;
  form.querySelectorAll('[name="duration"]').forEach(input => { input.checked = Number(input.value) === draft.duration; });
  if (![...form.querySelectorAll('[name="duration"]')].some(input => input.checked)) form.querySelector('[name="duration"][value="30"]').checked = true;
  form.querySelectorAll('[name="tag"]').forEach(input => { input.checked = input.value === draft.tag; });
  editor.querySelector('#editor-title').textContent = editing.id ? 'Edit task' : 'Schedule it';
  editor.querySelector('[data-action="delete-task"]').hidden = !editing.id;
  openModal(editor);
}
form.elements.anytime.addEventListener('change', () => {
  form.elements.time.disabled = form.elements.anytime.checked;
  if (!form.elements.anytime.checked && !form.elements.time.value) form.elements.time.value = '09:00';
});
form.addEventListener('submit', event => {
  event.preventDefault();
  const title = form.elements.title.value.trim();
  if (!title) return form.elements.title.focus();
  const fields = { title, date: form.elements.date.value || selected, time: form.elements.anytime.checked ? null : form.elements.time.value || null, duration: Number(form.querySelector('[name="duration"]:checked')?.value ?? 30), tag: form.querySelector('[name="tag"]:checked')?.value ?? tagOf(title) };
  if (editing.id) Object.assign(state.tasks.find(task => task.id === editing.id), fields);
  else state.tasks.push({ id: uid(), done: false, createdAt: Date.now(), ...fields });
  save();
  closeModal(editor);
  if (!editing.id) toast(`Scheduled for ${dayPhrase(fields.date)}${fields.time ? ` at ${formatTime(fields.time)}` : ''}`);
  render();
});
editor.querySelector('[data-action="delete-task"]').addEventListener('click', () => {
  state.tasks = state.tasks.filter(task => task.id !== editing.id);
  save();
  closeModal(editor);
  toast('Task deleted');
  render();
});

/* ---------- Capture: voice or text, sorted by Filo ---------- */
const capture = $('#capture'), input = $('#capture-text'), sorted = capture.querySelector('.sorted'), list = capture.querySelector('.sorted-list');
const micButton = capture.querySelector('.mic'), micStatus = capture.querySelector('.mic-status'), saveButton = capture.querySelector('.save-capture');
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const TYPES = ['task', 'idea', 'thought'];
capture.querySelector('.mic-filo').innerHTML = filoSvg('Filo');
let items = [], recognition = null, listening = false;

function describe(item) {
  if (item.type === 'task') return `${dayLabel(isoDate(addDays(new Date(), item.offset)))} · ${item.time ? formatTime(item.time) : 'Anytime'} · ${item.duration} min · ${item.tag}`;
  if (item.type === 'thought') return MOODS[item.mood];
  return 'Saved to Ideas';
}
function resort() {
  const offset = view === 'today' ? dayDiff(todayIso(), selected) : 0;
  items = input.value.trim() ? sort(input.value, { defaultOffset: offset }) : [];
  renderSorted();
}
function renderSorted() {
  sorted.hidden = !items.length;
  capture.querySelector('.examples').hidden = Boolean(items.length) || listening;
  capture.querySelector('.sorted-count').textContent = plural(items.length, 'item');
  list.innerHTML = items.map((item, index) => `
    <li class="sorted-item type-${item.type}">
      <button type="button" class="type-chip" data-index="${index}" aria-label="${item.type}, tap to change">${item.type}</button>
      <div class="sorted-text"><p>${esc(item.text)}</p><p class="sorted-meta">${esc(describe(item))}</p></div>
      <button type="button" class="icon-button" data-remove="${index}" aria-label="Remove">${icon('close')}</button>
    </li>`).join('');
  const counts = TYPES.map(type => [type, items.filter(item => item.type === type).length]).filter(([, count]) => count);
  saveButton.disabled = !items.length;
  saveButton.textContent = items.length ? `Save ${counts.map(([type, count]) => plural(count, type)).join(' · ')}` : 'Save';
}
list.addEventListener('click', event => {
  const chip = event.target.closest('[data-index]'), remove = event.target.closest('[data-remove]');
  if (chip) {
    const item = items[Number(chip.dataset.index)], next = TYPES[(TYPES.indexOf(item.type) + 1) % 3];
    items[Number(chip.dataset.index)] = next === 'task'
      ? { type: 'task', text: item.text, offset: view === 'today' ? dayDiff(todayIso(), selected) : 0, time: null, duration: 30, tag: tagOf(item.text) }
      : { type: next, text: item.text, ...(next === 'thought' ? { mood: moodOf(item.text) } : {}) };
    renderSorted();
  }
  if (remove) {
    items.splice(Number(remove.dataset.remove), 1);
    renderSorted();
  }
});
let typingTimer;
input.addEventListener('input', () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(resort, 250);
});
capture.querySelector('.examples').addEventListener('click', event => {
  const example = event.target.closest('[data-example]');
  if (!example) return;
  input.value = example.dataset.example;
  resort();
});

function stopListening() {
  recognition?.stop();
}
function setListening(on, message) {
  listening = on;
  capture.classList.toggle('is-listening', on);
  micButton.setAttribute('aria-pressed', String(on));
  micButton.setAttribute('aria-label', on ? 'Stop voice capture' : 'Start voice capture');
  micStatus.textContent = message ?? (on ? 'Listening… tap to stop' : 'Tap to talk');
  setMood(capture, on ? 'listening' : 'idle');
  renderSorted();
}
micButton.addEventListener('click', () => {
  if (listening) return stopListening();
  if (!Recognition) {
    micStatus.textContent = 'Voice isn’t available in this browser. Type instead.';
    input.focus();
    return;
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
  recognition.onerror = event => {
    const messages = { 'not-allowed': 'Microphone access is blocked. Allow it in your browser settings.', 'no-speech': 'Didn’t catch that. Try again?', 'network': 'Voice needs a connection. Type instead.' };
    setListening(false, messages[event.error] ?? 'Voice stopped. Type instead.');
  };
  recognition.onend = () => {
    if (listening) setListening(false);
  };
  try {
    recognition.start();
    setListening(true);
  } catch {
    setListening(false, 'Couldn’t start the microphone. Type instead.');
  }
});

function openCapture() {
  input.value = '';
  items = [];
  setListening(false);
  openModal(capture);
}
saveButton.addEventListener('click', () => {
  if (!items.length) return;
  const now = Date.now();
  for (const [index, item] of items.entries()) {
    if (item.type === 'task') state.tasks.push({ id: uid(), title: item.text, date: isoDate(addDays(new Date(), item.offset)), time: item.time, duration: item.duration, tag: item.tag, done: false, createdAt: now + index });
    if (item.type === 'idea') state.ideas.push({ id: uid(), text: item.text, starred: false, createdAt: now + index });
    if (item.type === 'thought') state.thoughts.push({ id: uid(), text: item.text, mood: item.mood, createdAt: now + index });
  }
  save();
  const counts = TYPES.map(type => [type, items.filter(item => item.type === type).length]).filter(([, count]) => count);
  stopListening();
  closeModal(capture);
  render();
  toast(`Filo filed ${counts.map(([type, count]) => plural(count, type)).join(', ')}`);
  cheer('is-hop', counts.some(([type]) => type === 'idea') ? 'thinking' : 'happy');
});

/* ---------- Modals ---------- */
let lastFocus;
function openModal(modal) {
  lastFocus = document.activeElement;
  modal.hidden = false;
  requestAnimationFrame(() => {
    modal.classList.add('is-open');
    (modal.querySelector('[autofocus]') ?? modal.querySelector('.modal-sheet')).focus({ preventScroll: true });
  });
}
function closeModal(modal) {
  if (modal === capture) stopListening();
  modal.classList.remove('is-open');
  setTimeout(() => { modal.hidden = true; }, 250);
  lastFocus?.focus?.({ preventScroll: true });
}
for (const modal of [capture, editor]) {
  modal.addEventListener('click', event => {
    if (event.target.matches('.modal-scrim') || event.target.closest('[data-action="close"]')) closeModal(modal);
  });
}
addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const open = [editor, capture].find(modal => !modal.hidden);
  if (open) closeModal(open);
});

/* ---------- Main interactions ---------- */
app.addEventListener('click', event => {
  const day = event.target.closest('[data-day]');
  if (day) {
    selected = day.dataset.day;
    render();
    return;
  }
  const tab = event.target.closest('.tab');
  if (tab) return go(tab.dataset.view);
  const filter = event.target.closest('[data-filter]');
  if (filter) {
    ideaFilter = filter.dataset.filter;
    return render();
  }
  const control = event.target.closest('[data-action]');
  if (!control || control.closest('.modal')) return;
  const id = control.closest('[data-id]')?.dataset.id;
  switch (control.dataset.action) {
    case 'capture': return openCapture();
    case 'go-today':
      selected = todayIso();
      scrollWeek = true;
      return render();
    case 'toggle': {
      const task = state.tasks.find(item => item.id === id);
      task.done = !task.done;
      state.filo.snacks = Math.max(0, state.filo.snacks + (task.done ? 1 : -1));
      save();
      render();
      if (task.done) {
        const allDone = tasksOn(task.date).every(item => item.done);
        cheer(allDone ? 'is-hop' : 'is-bounce', 'happy');
        if (allDone) toast('Day cleared! Filo is doing a happy dance.');
      }
      return;
    }
    case 'edit': return openEditor(state.tasks.find(item => item.id === id));
    case 'rollover': {
      const target = dayDiff(todayIso(), selected) < 0 ? todayIso() : isoDate(addDays(fromIso(selected), 1));
      const moved = tasksOn(selected).filter(task => !task.done);
      moved.forEach(task => { task.date = target; });
      save();
      render();
      return toast(`Moved ${plural(moved.length, 'task')} to ${dayPhrase(target)}`);
    }
    case 'star': {
      const idea = state.ideas.find(item => item.id === id);
      idea.starred = !idea.starred;
      save();
      return render();
    }
    case 'schedule': {
      const idea = state.ideas.find(item => item.id === id);
      return openEditor({ title: idea.text, date: todayIso(), time: null, duration: 30, tag: tagOf(idea.text) });
    }
    case 'delete-idea':
      state.ideas = state.ideas.filter(item => item.id !== id);
      save();
      render();
      return toast('Idea deleted');
    case 'delete-thought':
      state.thoughts = state.thoughts.filter(item => item.id !== id);
      save();
      render();
      return toast('Thought deleted');
    case 'poke':
      top.querySelector('.bubble').textContent = LINES[Math.floor(Math.random() * LINES.length)];
      return cheer('is-wiggle', 'happy');
    case 'pet':
      hearts(sheet.querySelector('[data-hearts]'));
      return cheer('is-wiggle', 'happy');
    case 'feed':
      if (!state.filo.snacks) return toast('Finish a task to earn Filo a snack');
      state.filo.snacks -= 1;
      state.filo.fed += 1;
      save();
      render();
      hearts(sheet.querySelector('[data-hearts]'), '🍪');
      return cheer('is-hop', 'happy');
    case 'chat':
      sheet.querySelector('.bubble').textContent = LINES[Math.floor(Math.random() * LINES.length)];
      return cheer('is-bounce');
  }
});
$('.capture-button').addEventListener('click', openCapture);

// Keep "Now", greetings and Filo's mood fresh while the app stays open.
setInterval(() => {
  if ([capture, editor].every(modal => modal.hidden)) render();
}, 60000);
render();
