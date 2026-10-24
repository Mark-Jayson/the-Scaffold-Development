// Endeavor studio: everything one endeavor runs on (webpages, docs, designs, code, apps) in one place,
// fed by the Scaffold Capture Chrome extension. The 3D habitat stays visible, half tucked under the bottom edge.
import './studio.css';
import { KINDS, KIND_ORDER, PLATFORMS, platformOf, hostOf, symbol, ago } from './platforms.js';
import { seed, makeItem } from './seed.js';

const KEY = 'scaffold.studio.v1';
const root = document.querySelector('#studio');
const ICONS = {
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  pin: '<path d="M9 4h6l-1 5 3 3H7l3-3zM12 12v8"/>',
  open: '<path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chrome: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2"/><path d="M12 8.8h8M9.2 13.6 5.3 6.8M14.8 13.6l-4 6.9"/>',
  spark: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
const esc = text => String(text ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const safeUrl = url => (/^https?:\/\//i.test(url) ? url : '#');

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.version === 1 && saved.endeavors) return saved;
  } catch {
    // Unreadable or blocked storage: start from the sample studios.
  }
  return seed();
}
let state = restore();
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked; the studio keeps working for this visit.
  }
  listeners.forEach(listener => listener());
};
const listeners = new Set();
let habitats = [], current = null, onClose = null, connected = false;
const view = { kind: 'all', platform: null, query: '' };
const studioOf = id => state.endeavors[id];
const metaOf = id => habitats.find(habitat => habitat.id === id);
const log = (id, text) => studioOf(id).activity.unshift({ id: `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, at: Date.now(), text });

/* Shell */
root.innerHTML = `
  <div class="st-panel">
    <header class="st-head">
      <div class="st-title">
        <p class="st-kicker"><i></i><span class="st-habitat"></span> · Endeavor</p>
        <input class="st-name" aria-label="Endeavor name" />
        <input class="st-goal" aria-label="Goal" placeholder="What is this endeavor for?" />
      </div>
      <div class="st-tools">
        <label class="st-search">${icon('search')}<input type="search" placeholder="Search this endeavor" aria-label="Search this endeavor" /></label>
        <button type="button" class="st-ext"></button>
        <button type="button" class="st-primary st-add">${icon('plus')}<span>Add link</span></button>
      </div>
      <p class="st-stats"></p>
    </header>
    <nav class="st-dock" aria-label="Filter by platform"></nav>
    <div class="st-body">
      <div class="st-main">
        <section class="st-section st-pinned"><h3>Working set<small>Pinned · what you are on right now</small></h3><div class="st-cards"></div></section>
        <section class="st-section st-library"><div class="st-library-head"><h3>Library</h3><div class="st-kinds" role="tablist" aria-label="Filter by kind"></div></div><ul class="st-list"></ul></section>
      </div>
      <aside class="st-aside">
        <section class="st-section st-inbox"></section>
        <section class="st-section st-activity"><h3>What’s going on</h3><ol class="st-feed"></ol></section>
      </aside>
    </div>
  </div>
  <button type="button" class="st-collapse">${icon('down')}Collapse to the WorkStation</button>
  <div class="st-modal" hidden>
    <div class="st-scrim" data-close></div>
    <form class="st-dialog" role="dialog" aria-modal="true" aria-labelledby="st-dialog-title" novalidate>
      <header><h3 id="st-dialog-title">Add a link</h3><button type="button" class="st-icon-button" data-close aria-label="Close">${icon('close')}</button></header>
      <label class="st-field"><span>Link</span><input name="url" type="url" required placeholder="https://" autocomplete="off" /></label>
      <p class="st-detect"></p>
      <label class="st-field"><span>Title (optional)</span><input name="title" autocomplete="off" /></label>
      <label class="st-field"><span>Why it matters (optional)</span><input name="note" autocomplete="off" /></label>
      <label class="st-check"><input type="checkbox" name="pinned" /> Pin to the working set</label>
      <footer><button type="button" class="st-text-button" data-close>Cancel</button><button type="submit" class="st-primary">${icon('plus')}Add</button></footer>
    </form>
  </div>
  <div class="st-toast" role="status" hidden><span></span><button type="button">Undo</button></div>`;
const $ = selector => root.querySelector(selector);

/* Rendering */
function filtered(items) {
  const query = view.query.trim().toLowerCase();
  return items.filter(item => (!view.platform || item.platform === view.platform) && (!query || `${item.title} ${item.url} ${item.note}`.toLowerCase().includes(query)));
}
const moveOptions = item => `<select class="st-move" data-move="${item.id}" aria-label="Move to another endeavor"><option value="">Move to…</option>${habitats.filter(habitat => habitat.id !== current).map(habitat => `<option value="${habitat.id}">${esc(habitat.name)} · ${esc(studioOf(habitat.id).title)}</option>`).join('')}</select>`;
const meta = item => `${PLATFORMS[item.platform]?.name ?? 'Webpage'} · ${KINDS[item.kind].one}`;
function card(item) {
  return `<article class="st-card" style="--platform:${PLATFORMS[item.platform].color}">
    <a class="st-card-main" href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer" data-open="${item.id}">
      <span class="st-card-top">${symbol(item.platform, 'lg')}<span>${meta(item)}</span>${item.fresh ? '<em class="st-new">New</em>' : ''}</span>
      <strong>${esc(item.title)}</strong>
      <span class="st-host">${esc(hostOf(item.url))}</span>
      ${item.note ? `<span class="st-note">${esc(item.note)}</span>` : ''}
      <span class="st-time">${item.openedAt ? `Opened ${ago(item.openedAt)}` : `Saved ${ago(item.savedAt)}`}</span>
    </a>
    <button type="button" class="st-pin is-on" data-pin="${item.id}" aria-label="Unpin ${esc(item.title)}" title="Unpin">${icon('pin')}</button>
  </article>`;
}
function row(item) {
  return `<li class="st-row">
    <a class="st-row-main" href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer" data-open="${item.id}">
      ${symbol(item.platform)}
      <span class="st-row-text"><strong>${esc(item.title)}</strong><small>${esc(hostOf(item.url))}${item.note ? ` · ${esc(item.note)}` : ''}</small></span>
      <span class="st-row-kind">${KINDS[item.kind].one}</span>
      <span class="st-row-time">${ago(item.savedAt)}</span>
    </a>
    <button type="button" class="st-pin${item.pinned ? ' is-on' : ''}" data-pin="${item.id}" aria-pressed="${item.pinned}" aria-label="${item.pinned ? 'Unpin' : 'Pin'} ${esc(item.title)}" title="${item.pinned ? 'Unpin' : 'Pin to the working set'}">${icon('pin')}</button>
    ${moveOptions(item)}
    <button type="button" class="st-icon-button" data-remove="${item.id}" aria-label="Remove ${esc(item.title)}" title="Remove">${icon('trash')}</button>
  </li>`;
}
function render() {
  if (!current) return;
  const studio = studioOf(current), habitat = metaOf(current), items = studio.items;
  root.style.setProperty('--accent', habitat.accent);
  $('.st-habitat').textContent = habitat.name;
  if (document.activeElement !== $('.st-name')) $('.st-name').value = studio.title;
  if (document.activeElement !== $('.st-goal')) $('.st-goal').value = studio.goal;
  const fresh = items.filter(item => item.fresh), pinned = items.filter(item => item.pinned);
  const latest = Math.max(...items.map(item => Math.max(item.savedAt, item.openedAt ?? 0)), ...studio.activity.map(entry => entry.at));
  $('.st-stats').innerHTML = `<span>${items.length} things</span><span>${pinned.length} pinned</span>${fresh.length ? `<span class="is-new">${fresh.length} new from Chrome</span>` : ''}<span>Active ${ago(latest)}</span>`;
  const ext = $('.st-ext');
  ext.dataset.state = connected ? 'on' : 'off';
  ext.innerHTML = `${icon('chrome')}<span>${connected ? 'Chrome connected' : 'Connect Chrome'}</span>`;

  const counts = {};
  items.forEach(item => (counts[item.platform] = (counts[item.platform] ?? 0) + 1));
  $('.st-dock').innerHTML = `<button type="button" class="st-dock-item${view.platform ? '' : ' is-on'}" data-platform="">All<b>${items.length}</b></button>` + Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([key, count]) => `<button type="button" class="st-dock-item${view.platform === key ? ' is-on' : ''}" data-platform="${key}" aria-pressed="${view.platform === key}">${symbol(key, 'sm')}${PLATFORMS[key].name}<b>${count}</b></button>`).join('');

  const shown = filtered(items), working = shown.filter(item => item.pinned).sort((a, b) => (b.openedAt ?? b.savedAt) - (a.openedAt ?? a.savedAt));
  $('.st-cards').innerHTML = working.length ? working.map(card).join('') : '<p class="st-empty">Pin the things you are actively working on and they stay up here.</p>';

  const library = shown.filter(item => !item.fresh), byKind = {};
  library.forEach(item => (byKind[item.kind] = (byKind[item.kind] ?? 0) + 1));
  $('.st-kinds').innerHTML = [['all', 'All', library.length], ...KIND_ORDER.filter(kind => byKind[kind]).map(kind => [kind, KINDS[kind].label, byKind[kind]])].map(([kind, label, count]) => `<button type="button" role="tab" class="st-kind${view.kind === kind ? ' is-on' : ''}" data-kind="${kind}" aria-selected="${view.kind === kind}">${label}<b>${count}</b></button>`).join('');
  if (view.kind !== 'all' && !byKind[view.kind]) view.kind = 'all';
  const listed = library.filter(item => view.kind === 'all' || item.kind === view.kind).sort((a, b) => b.savedAt - a.savedAt);
  $('.st-list').innerHTML = listed.length ? listed.map(row).join('') : '<li class="st-empty">Nothing here yet.</li>';

  const inbox = filtered(fresh);
  $('.st-inbox').innerHTML = `<h3>From Chrome<small>${inbox.length ? `${inbox.length} to sort` : 'All sorted'}</small></h3>
    ${inbox.length ? `<ul class="st-inbox-list">${inbox.map(item => `<li class="st-capture">
      <a href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer" data-open="${item.id}">${symbol(item.platform)}<span><strong>${esc(item.title)}</strong><small>${meta(item)} · ${ago(item.savedAt)}</small>${item.quote ? `<q>${esc(item.quote)}</q>` : ''}</span></a>
      <div class="st-capture-actions"><button type="button" class="st-chip-button" data-keep="${item.id}">${icon('check')}Keep</button><button type="button" class="st-chip-button" data-pin="${item.id}">${icon('pin')}Pin</button>${moveOptions(item)}<button type="button" class="st-icon-button" data-remove="${item.id}" aria-label="Remove ${esc(item.title)}">${icon('trash')}</button></div>
    </li>`).join('')}</ul>` : `<p class="st-empty">${connected ? 'Use the Scaffold button in Chrome on any page, doc or app and it lands here.' : ''}</p>`}
    ${connected ? '' : `<div class="st-connect">${icon('chrome')}<div><strong>Connect the Chrome extension</strong><ol><li>Open <code>chrome://extensions</code> and turn on Developer mode.</li><li>Choose <b>Load unpacked</b> and pick the <code>extension</code> folder in this project.</li><li>Keep this tab open. Save any page with the Scaffold button or <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>.</li></ol></div></div>`}`;

  $('.st-feed').innerHTML = studio.activity.slice(0, 12).map(entry => `<li><span>${esc(entry.text)}</span><time>${ago(entry.at)}</time></li>`).join('');
}

/* Actions */
let toastTimer, undo;
function toast(text, snapshot) {
  undo = snapshot;
  const toastEl = $('.st-toast');
  toastEl.querySelector('span').textContent = text;
  toastEl.querySelector('button').hidden = !snapshot;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 8000);
}
$('.st-toast button').addEventListener('click', () => {
  if (!undo) return;
  state = JSON.parse(undo);
  $('.st-toast').hidden = true;
  save();
  render();
});
const find = id => studioOf(current).items.find(item => item.id === id);
function update(mutate, message, withUndo = false) {
  const before = withUndo ? JSON.stringify(state) : null;
  mutate();
  save();
  render();
  if (message) toast(message, before);
}
root.addEventListener('click', event => {
  const target = event.target;
  const open = target.closest('[data-open]');
  if (open) {
    // Let the link open first; re-rendering under the click could swallow the navigation.
    const item = find(open.dataset.open);
    if (item) setTimeout(() => update(() => {
      item.openedAt = Date.now();
      log(current, `Opened “${item.title}”`);
    }));
    return;
  }
  const pin = target.closest('[data-pin]'), keep = target.closest('[data-keep]'), remove = target.closest('[data-remove]');
  if (pin) {
    const item = find(pin.dataset.pin);
    return update(() => {
      item.pinned = !item.pinned || item.fresh;
      item.fresh = false;
      log(current, `${item.pinned ? 'Pinned' : 'Unpinned'} “${item.title}”`);
    });
  }
  if (keep) {
    const item = find(keep.dataset.keep);
    return update(() => (item.fresh = false), `Kept “${item.title}” in the library`);
  }
  if (remove) {
    const item = find(remove.dataset.remove);
    return update(() => {
      studioOf(current).items = studioOf(current).items.filter(entry => entry !== item);
      log(current, `Removed “${item.title}”`);
    }, `Removed “${item.title}”`, true);
  }
  const platform = target.closest('[data-platform]');
  if (platform) {
    view.platform = platform.dataset.platform || null;
    return render();
  }
  const kind = target.closest('[data-kind]');
  if (kind) {
    view.kind = kind.dataset.kind;
    return render();
  }
  if (target.closest('.st-add')) return openModal();
  if (target.closest('.st-ext') && !connected) return $('.st-connect')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (target.closest('.st-collapse')) return close();
  if (target.closest('[data-close]')) return closeModal();
});
root.addEventListener('change', event => {
  const move = event.target.closest('[data-move]');
  if (!move || !move.value) return;
  const item = find(move.dataset.move), to = move.value;
  update(() => {
    studioOf(current).items = studioOf(current).items.filter(entry => entry !== item);
    studioOf(to).items.push({ ...item, fresh: false });
    log(current, `Moved “${item.title}” to ${metaOf(to).name}`);
    log(to, `“${item.title}” moved in from ${metaOf(current).name}`);
  }, `Moved “${item.title}” to ${metaOf(to).name}`, true);
});
$('.st-search input').addEventListener('input', event => {
  view.query = event.target.value;
  render();
});
for (const [selector, field] of [['.st-name', 'title'], ['.st-goal', 'goal']]) {
  $(selector).addEventListener('change', event => {
    studioOf(current)[field] = event.target.value.trim() || studioOf(current)[field];
    save();
    announce();
    render();
  });
}

/* Add a link by hand */
const modal = $('.st-modal'), form = $('.st-dialog');
function openModal() {
  form.reset();
  form.querySelector('.st-detect').textContent = '';
  modal.hidden = false;
  form.elements.url.focus();
}
function closeModal() {
  modal.hidden = true;
}
form.elements.url.addEventListener('input', () => {
  const url = form.elements.url.value.trim(), platform = PLATFORMS[platformOf(url)];
  form.querySelector('.st-detect').innerHTML = /^https?:\/\/\S+\.\S+|^https?:\/\/localhost/.test(url) ? `${symbol(platformOf(url), 'sm')} ${platform.name} · goes under ${KINDS[platform.kind].label}` : '';
});
form.addEventListener('submit', event => {
  event.preventDefault();
  let url = form.elements.url.value.trim();
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  if (!hostOf(url)) return form.elements.url.focus();
  const title = form.elements.title.value.trim() || hostOf(url), pinned = form.elements.pinned.checked;
  update(() => {
    studioOf(current).items.push(makeItem({ title, url, note: form.elements.note.value.trim(), pinned }));
    log(current, `Added “${title}”`);
  }, `Added “${title}”`);
  closeModal();
});

/* Chrome extension bridge. The extension's content script (extension/bridge.js) talks to this page with
   window.postMessage: it says hello, hands over captures, and we acknowledge them so they are only delivered once. */
const post = message => window.postMessage({ source: 'scaffold-page', ...message }, location.origin);
const announce = () => post({ type: 'endeavors', list: habitats.map(habitat => ({ id: habitat.id, name: habitat.name, title: studioOf(habitat.id)?.title ?? habitat.name, accent: habitat.accent })) });
function ingest(captures) {
  const delivered = new Set(state.delivered), fresh = captures.filter(capture => capture?.id && capture.url && !delivered.has(capture.id));
  if (fresh.length) {
    for (const capture of fresh) {
      const to = state.endeavors[capture.endeavor] ? capture.endeavor : current ?? habitats[0]?.id;
      const item = makeItem({ title: capture.title || hostOf(capture.url), url: capture.url, note: capture.note ?? '', quote: capture.quote ?? '', pinned: Boolean(capture.pinned), fresh: !capture.pinned, source: 'chrome', savedAt: capture.savedAt ?? Date.now() });
      studioOf(to).items.push(item);
      log(to, `Saved “${item.title}” from Chrome`);
      state.delivered.push(capture.id);
    }
    state.delivered = state.delivered.slice(-500);
    save();
    render();
    if (current) toast(`${fresh.length} new from Chrome`);
  }
  post({ type: 'ack', ids: captures.map(capture => capture?.id).filter(Boolean) });
}
addEventListener('message', event => {
  if (event.source !== window || event.origin !== location.origin || event.data?.source !== 'scaffold-bridge') return;
  if (event.data.type === 'hello') {
    connected = true;
    announce();
    render();
    listeners.forEach(listener => listener());
  } else if (event.data.type === 'captures' && Array.isArray(event.data.items)) ingest(event.data.items);
});

function open(id, { onClose: closeHandler } = {}) {
  current = id;
  onClose = closeHandler;
  view.kind = 'all';
  view.platform = null;
  view.query = '';
  $('.st-search input').value = '';
  root.hidden = false;
  render();
  void root.offsetWidth;
  root.classList.add('is-open');
  root.querySelector('.st-panel').scrollTop = 0;
}
function close() {
  if (root.hidden) return;
  closeModal();
  root.classList.remove('is-open');
  root.hidden = true;
  current = null;
  const handler = onClose;
  onClose = null;
  handler?.();
}

export const studio = {
  // The habitats that hold endeavors: [{ id, name, accent }].
  register(list) {
    habitats = list;
    for (const habitat of list) state.endeavors[habitat.id] ??= { title: habitat.name, goal: '', items: [], activity: [] };
    announce();
    post({ type: 'ping' });
  },
  open,
  close,
  isOpen: () => !root.hidden,
  current: () => current,
  escape() {
    if (root.hidden) return false;
    if (!modal.hidden) closeModal();
    else close();
    return true;
  },
  // What the collapsed habitat shows: counts, the platforms in play and the latest thing that happened.
  summary(id) {
    const studio = studioOf(id);
    if (!studio) return null;
    const items = studio.items, counts = {};
    items.filter(item => item.pinned || item.fresh).forEach(item => (counts[item.platform] = (counts[item.platform] ?? 0) + 1));
    const latest = [...items].sort((a, b) => Math.max(b.savedAt, b.openedAt ?? 0) - Math.max(a.savedAt, a.openedAt ?? 0))[0];
    return {
      title: studio.title,
      count: items.length,
      pinned: items.filter(item => item.pinned).length,
      fresh: items.filter(item => item.fresh).length,
      platforms: Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([key]) => key).slice(0, 4),
      latest: latest && { title: latest.title, platform: latest.platform, at: Math.max(latest.savedAt, latest.openedAt ?? 0), opened: (latest.openedAt ?? 0) > latest.savedAt },
      connected,
    };
  },
  onChange(listener) {
    listeners.add(listener);
  },
};
