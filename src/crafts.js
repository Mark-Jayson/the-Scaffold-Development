// Maker Space "Crafts" home: a translucent card listing crafts, plus a full-screen sketch board per craft.
import { createBoard } from './board.js';
import { loadDoc, saveDoc, loadThumb, saveThumb, forget } from './craft-store.js';

const STORAGE_KEY = 'moonbase.crafts';
const DAY = 864e5;
// First-visit examples so the gallery isn't empty; they can be deleted like any other craft.
const SAMPLES = [['Drone frame Mk II', 0.1], ['Arc reactor housing', 2], ['Exosuit gauntlet', 6], ['Holo desk wiring', 13], ['Rover wheel hub', 27]];

const overlay = document.querySelector('#crafts');
const card = overlay.querySelector('.crafts-card');
const grid = overlay.querySelector('.crafts-grid');
const empty = overlay.querySelector('.crafts-empty');
const count = overlay.querySelector('.crafts-count');
const search = overlay.querySelector('.crafts-search input');
const editor = document.querySelector('#craft-editor');
const title = editor.querySelector('.craft-title');
const status = editor.querySelector('.craft-status');
const thumbs = new Map();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    // Storage can be blocked (private mode); fall back to the samples for this visit.
  }
  const now = Date.now();
  return SAMPLES.map(([name, age], index) => ({ id: `sample-${index}`, name, createdAt: now - (age + 3) * DAY, updatedAt: now - age * DAY }));
}
let items = load();
const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Not persisted, but the session keeps working.
  }
};
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `craft-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
function edited(time) {
  const seconds = (time - Date.now()) / 1000;
  if (Math.abs(seconds) < 60) return 'just now';
  for (const [unit, size] of [['year', 31536e3], ['month', 2592e3], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

const TRASH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>';
function renderCard(craft) {
  const item = document.createElement('article');
  item.className = 'craft-card';
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'craft-open';
  const thumb = document.createElement('span');
  thumb.className = 'craft-thumb';
  thumb.setAttribute('aria-hidden', 'true');
  const mono = document.createElement('span');
  mono.className = 'craft-mono';
  mono.textContent = craft.name.trim().charAt(0).toUpperCase() || '·';
  thumb.append(mono);
  const showPreview = src => {
    if (!src) return;
    const preview = Object.assign(document.createElement('img'), { src, alt: '' });
    mono.replaceWith(preview);
  };
  if (thumbs.has(craft.id)) showPreview(thumbs.get(craft.id));
  else loadThumb(craft.id).then(src => {
    thumbs.set(craft.id, src ?? null);
    showPreview(src);
  }).catch(() => thumbs.set(craft.id, null));
  const name = document.createElement('span');
  name.className = 'craft-name';
  name.textContent = craft.name;
  const meta = document.createElement('span');
  meta.className = 'craft-meta';
  meta.textContent = `Edited ${edited(craft.updatedAt)}`;
  open.append(thumb, name, meta);
  open.addEventListener('click', () => openEditor(craft.id));

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'craft-delete';
  remove.setAttribute('aria-label', `Delete ${craft.name}`);
  remove.innerHTML = TRASH;
  // First click arms the button, second click deletes.
  remove.addEventListener('click', () => {
    if (!remove.classList.contains('is-armed')) {
      remove.classList.add('is-armed');
      remove.textContent = 'Delete?';
      return;
    }
    items = items.filter(entry => entry.id !== craft.id);
    thumbs.delete(craft.id);
    forget(craft.id).catch(() => {});
    save();
    renderList();
  });
  remove.addEventListener('blur', () => {
    remove.classList.remove('is-armed');
    remove.innerHTML = TRASH;
  });
  item.append(open, remove);
  return item;
}
function renderList() {
  const query = search.value.trim().toLowerCase();
  const visible = items.filter(craft => craft.name.toLowerCase().includes(query)).sort((a, b) => b.updatedAt - a.updatedAt);
  grid.replaceChildren(...visible.map(renderCard));
  count.textContent = `${items.length} ${items.length === 1 ? 'craft' : 'crafts'}`;
  empty.hidden = visible.length > 0;
  empty.textContent = items.length ? `No crafts match “${search.value.trim()}”.` : 'No crafts yet. Start one above.';
}

/* Craft sketch board */
let current, saveTimer;
const board = createBoard(editor.querySelector('.craft-board'), { onChange: changed });
async function persist() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  if (!current) return;
  try {
    await saveDoc(current.id, board.snapshot());
    status.textContent = 'All changes saved';
  } catch {
    status.textContent = 'Couldn’t save — storage is full or blocked';
  }
}
function changed() {
  if (!current) return;
  current.updatedAt = Date.now();
  save();
  status.textContent = 'Saving…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 500);
}
async function openEditor(id) {
  current = items.find(craft => craft.id === id);
  if (!current) return;
  title.value = current.name;
  status.textContent = 'All changes saved';
  editor.hidden = false;
  requestAnimationFrame(() => editor.classList.add('is-open'));
  const data = await loadDoc(id).catch(() => null);
  if (current?.id === id) board.load(data, current.name);
}
async function closeEditor() {
  const craft = current;
  board.unload();
  if (saveTimer) await persist();
  if (craft) {
    const preview = await board.thumbnail().catch(() => null);
    thumbs.set(craft.id, preview);
    saveThumb(craft.id, preview).catch(() => {});
  }
  editor.classList.remove('is-open');
  editor.hidden = true;
  current = undefined;
  renderList();
}
title.addEventListener('input', () => {
  if (!current) return;
  current.name = title.value.trim() || 'Untitled craft';
  board.rename(current.name);
  changed();
});
title.addEventListener('keydown', event => {
  if (event.key === 'Enter') title.blur();
});
editor.querySelector('.craft-back').addEventListener('click', closeEditor);
const panelToggle = editor.querySelector('.craft-panel-toggle');
panelToggle.addEventListener('click', () => panelToggle.setAttribute('aria-pressed', String(board.togglePanel())));
addEventListener('pagehide', () => {
  if (saveTimer) persist();
});

/* Crafts home */
let returnFocus;
function open() {
  if (!overlay.hidden) return;
  returnFocus = document.activeElement;
  search.value = '';
  renderList();
  overlay.hidden = false;
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    card.focus({ preventScroll: true });
  });
}
function close() {
  overlay.classList.remove('is-open');
  overlay.hidden = true;
  returnFocus?.focus?.({ preventScroll: true });
}
overlay.querySelector('.crafts-close').addEventListener('click', close);
overlay.addEventListener('pointerdown', event => {
  if (event.target === overlay) close();
});
search.addEventListener('input', renderList);
overlay.querySelector('.craft-new').addEventListener('click', () => {
  const now = Date.now(), craft = { id: makeId(), name: 'Untitled craft', createdAt: now, updatedAt: now };
  items.push(craft);
  save();
  renderList();
  openEditor(craft.id);
  title.focus();
  title.select();
});

export const crafts = {
  open,
  // True while the full-screen board covers the scene, so the 3D view can pause.
  covering: () => !editor.hidden,
  // Steps back one layer (canvas → list → scene); returns false when there was nothing to close.
  escape() {
    if (!editor.hidden) {
      if (!board.escape()) closeEditor();
      return true;
    }
    if (!overlay.hidden) {
      close();
      return true;
    }
    return false;
  },
};
