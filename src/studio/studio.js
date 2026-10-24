// Endeavor studio: everything one endeavor runs on (webpages, docs, designs, code, apps) in one place,
// fed by the Scaffold Capture Chrome extension. The 3D habitat stays in view in a strip along the bottom.
//
// Organised for attention, not completeness: the top answers "where was I?" (resume) and "what now?" (one next
// step), "Now" holds at most three pinned things, new captures are sorted one at a time, and the full library
// sits below with big logos so things are found by sight rather than by reading.
import './studio.css';
import { KINDS, KIND_ORDER, PLATFORMS, platformOf, hostOf, ago } from './platforms.js';
import { logo, kindIcon } from './logos.js';
import { seed, makeItem } from './seed.js';

const KEY = 'scaffold.studio.v1';
const NOW_LIMIT = 3;
const root = document.querySelector('#studio');
const ICONS = {
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  pin: '<path d="M9 4h6l-1 5 3 3H7l3-3zM12 12v8"/>',
  open: '<path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  chrome: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2"/><path d="M12 8.8h8M9.2 13.6 5.3 6.8M14.8 13.6l-4 6.9"/>',
  resume: '<path d="M8 5.5v13l10-6.5z"/>',
  flag: '<path d="M6 21V4M6 4h11l-2 4 2 4H6"/>',
  inbox: '<path d="M4 13l2.5-7h11L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 13h4.5l1 2h5l1-2H20"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  more: '<path d="M6 9l6 6 6-6"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
const esc = text => String(text ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const safeUrl = url => (/^https?:\/\//i.test(url) ? url : '#');
const logoOf = (item, size) => logo(item.platform, { size, favicon: item.favicon });

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
const listeners = new Set();
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked; the studio keeps working for this visit.
  }
  listeners.forEach(listener => listener());
};
let habitats = [], current = null, onClose = null, connected = false;
const view = { kind: 'all', platform: null, query: '', moreNow: false, moreRecent: false };
const studioOf = id => state.endeavors[id];
const metaOf = id => habitats.find(habitat => habitat.id === id);
const log = (id, text) => studioOf(id).activity.unshift({ id: `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, at: Date.now(), text });
const touched = item => Math.max(item.savedAt, item.openedAt ?? 0);

/* Shell */
root.innerHTML = `
  <div class="st-panel">
    <header class="st-head">
      <div class="st-title">
        <p class="st-kicker"><i></i><span class="st-habitat"></span> · Endeavor</p>
        <input class="st-name" aria-label="Endeavor name" />
        <label class="st-goal-row">${icon('flag')}<span class="sr-only">Goal</span><input class="st-goal" placeholder="What is this endeavor for?" /></label>
        <p class="st-stats"></p>
      </div>
      <div class="st-tools">
        <label class="st-search">${icon('search')}<input type="search" placeholder="Find anything here" aria-label="Search this endeavor" /></label>
        <button type="button" class="st-ext"></button>
        <button type="button" class="st-primary st-add">${icon('plus')}<span>Add link</span></button>
      </div>
    </header>
    <div class="st-focus">
      <section class="st-card st-resume" aria-label="Pick up where you left off"></section>
      <section class="st-card st-next" aria-labelledby="st-next-label">
        <h3 id="st-next-label">${icon('flag')}Next step</h3>
        <div class="st-next-row"><button type="button" class="st-tick" aria-label="Mark the next step done">${icon('check')}</button><textarea class="st-next-text" rows="2" placeholder="One small thing to do next" aria-label="Next step"></textarea></div>
        <p class="st-next-meta"></p>
      </section>
    </div>
    <div class="st-body">
      <div class="st-main">
        <section class="st-section st-now"></section>
        <section class="st-section st-library">
          <div class="st-section-head"><h3>Everything else</h3><div class="st-kinds" role="tablist" aria-label="Filter by kind"></div></div>
          <div class="st-dock" aria-label="Filter by app"></div>
          <ul class="st-tiles"></ul>
        </section>
      </div>
      <aside class="st-aside">
        <section class="st-card st-inbox"></section>
        <section class="st-card st-recent"></section>
      </aside>
    </div>
  </div>
  <div class="st-bar">
    <button type="button" class="st-close">${icon('close')}Close</button>
    <p class="st-place"><i></i><span><strong></strong><small></small></span></p>
  </div>
  <div class="st-modal" hidden>
    <div class="st-scrim" data-close></div>
    <form class="st-dialog" role="dialog" aria-modal="true" aria-labelledby="st-dialog-title" novalidate>
      <header><h3 id="st-dialog-title">Add a link</h3><button type="button" class="st-icon-button" data-close aria-label="Close">${icon('close')}</button></header>
      <label class="st-field"><span>Link</span><input name="url" type="url" required placeholder="https://" autocomplete="off" /></label>
      <p class="st-detect"></p>
      <label class="st-field"><span>Title (optional)</span><input name="title" autocomplete="off" /></label>
      <label class="st-field"><span>Why it matters (optional)</span><input name="note" autocomplete="off" /></label>
      <label class="st-check"><input type="checkbox" name="pinned" /> Put it in Now</label>
      <footer><button type="button" class="st-text-button" data-close>Cancel</button><button type="submit" class="st-primary">${icon('plus')}Add</button></footer>
    </form>
  </div>
  <div class="st-toast" role="status" hidden><span></span><button type="button">Undo</button></div>`;
const $ = selector => root.querySelector(selector);

/* Rendering */
const matches = item => {
  const query = view.query.trim().toLowerCase();
  return (!view.platform || item.platform === view.platform) && (!query || `${item.title} ${item.url} ${item.note} ${PLATFORMS[item.platform]?.name}`.toLowerCase().includes(query));
};
const moveOptions = item => `<select class="st-move" data-move="${item.id}" aria-label="Move “${esc(item.title)}” to another endeavor" title="Move to another endeavor"><option value="">Move to…</option>${habitats.filter(habitat => habitat.id !== current).map(habitat => `<option value="${habitat.id}">${esc(habitat.name)} · ${esc(studioOf(habitat.id).title)}</option>`).join('')}</select>`;
const where = item => `${PLATFORMS[item.platform]?.name ?? 'Webpage'}`;

function renderResume(items) {
  const last = [...items].filter(item => item.openedAt).sort((a, b) => b.openedAt - a.openedAt)[0] ?? [...items].sort((a, b) => touched(b) - touched(a))[0];
  $('.st-resume').innerHTML = last ? `
    <h3>${icon('clock')}Pick up where you left off</h3>
    <div class="st-resume-body">
      ${logoOf(last, 'xl')}
      <div class="st-resume-text"><strong>${esc(last.title)}</strong><span>${where(last)} · ${last.openedAt ? `opened ${ago(last.openedAt)}` : `saved ${ago(last.savedAt)}`}</span>${last.note ? `<em>${esc(last.note)}</em>` : ''}</div>
      <a class="st-primary st-resume-go" href="${esc(safeUrl(last.url))}" target="_blank" rel="noopener noreferrer" data-open="${last.id}">${icon('resume')}Resume</a>
    </div>` : `<h3>${icon('clock')}Pick up where you left off</h3><p class="st-empty">Open something from this endeavor and it shows up here next time.</p>`;
}
function renderNext(studio) {
  const next = studio.next;
  const text = $('.st-next-text'), tick = $('.st-tick');
  if (document.activeElement !== text) text.value = next.text;
  tick.classList.toggle('is-done', next.done);
  tick.setAttribute('aria-pressed', String(next.done));
  $('.st-next').classList.toggle('is-done', next.done);
  $('.st-next-meta').textContent = next.done ? 'Done. Nice work. Type the next small step when you are ready.' : next.text ? `Set ${ago(next.at)} · keep it small enough to start in 2 minutes` : 'Write one small, concrete step. It is the first thing you will see next time.';
}
function nowCard(item) {
  return `<li class="st-now-card" style="--platform:${PLATFORMS[item.platform].color}">
    <a href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer" data-open="${item.id}">
      ${logoOf(item, 'lg')}
      <strong>${esc(item.title)}</strong>
      <span class="st-sub">${where(item)} · ${esc(hostOf(item.url))}</span>
      ${item.note ? `<em>${esc(item.note)}</em>` : ''}
      <span class="st-when">${item.openedAt ? `Opened ${ago(item.openedAt)}` : `Saved ${ago(item.savedAt)}`}</span>
    </a>
    <button type="button" class="st-pin is-on" data-pin="${item.id}" aria-label="Take “${esc(item.title)}” out of Now" title="Take out of Now">${icon('pin')}</button>
  </li>`;
}
function tile(item) {
  return `<li class="st-tile">
    <a href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer" data-open="${item.id}">
      ${logoOf(item, 'lg')}
      <span class="st-tile-text"><strong>${esc(item.title)}</strong><span class="st-sub">${kindIcon(item.kind)}${KINDS[item.kind].one} · ${esc(hostOf(item.url))}</span>${item.note ? `<em>${esc(item.note)}</em>` : ''}</span>
      <span class="st-when">${ago(item.savedAt)}</span>
    </a>
    <div class="st-tile-actions">
      <button type="button" class="st-pin${item.pinned ? ' is-on' : ''}" data-pin="${item.id}" aria-pressed="${item.pinned}" aria-label="${item.pinned ? 'Take out of Now' : 'Put in Now'}: ${esc(item.title)}" title="${item.pinned ? 'Take out of Now' : 'Put in Now'}">${icon('pin')}</button>
      ${moveOptions(item)}
      <button type="button" class="st-icon-button" data-remove="${item.id}" aria-label="Remove ${esc(item.title)}" title="Remove">${icon('trash')}</button>
    </div>
  </li>`;
}
function renderNow(items) {
  const pinned = items.filter(item => item.pinned && !item.fresh && matches(item)).sort((a, b) => touched(b) - touched(a));
  const shown = view.moreNow ? pinned : pinned.slice(0, NOW_LIMIT), extra = pinned.length - NOW_LIMIT;
  $('.st-now').innerHTML = `
    <div class="st-section-head"><h3>Now</h3><p>${pinned.length > NOW_LIMIT ? `${pinned.length} pinned. Three at a time keeps it calm.` : 'Up to three things you are actively on'}</p></div>
    ${shown.length ? `<ul class="st-now-list">${shown.map(nowCard).join('')}</ul>` : '<p class="st-empty">Pin up to three things you are working on right now and they live here.</p>'}
    ${extra > 0 ? `<button type="button" class="st-link" data-more-now>${view.moreNow ? 'Show only the three most recent' : `Show ${extra} more pinned`}</button>` : ''}`;
}
function renderLibrary(items) {
  const rest = items.filter(item => !item.pinned && !item.fresh), visible = rest.filter(matches), byKind = {};
  visible.forEach(item => (byKind[item.kind] = (byKind[item.kind] ?? 0) + 1));
  if (view.kind !== 'all' && !byKind[view.kind]) view.kind = 'all';
  $('.st-kinds').innerHTML = [['all', 'All', visible.length], ...KIND_ORDER.filter(kind => byKind[kind]).map(kind => [kind, KINDS[kind].label, byKind[kind]])].map(([kind, label, count]) => `<button type="button" role="tab" class="st-kind${view.kind === kind ? ' is-on' : ''}" data-kind="${kind}" aria-selected="${view.kind === kind}">${kindIcon(kind)}${label}<b>${count}</b></button>`).join('');
  const counts = {};
  items.forEach(item => (counts[item.platform] = (counts[item.platform] ?? 0) + 1));
  $('.st-dock').innerHTML = `<span class="st-dock-label">Apps</span>` + Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([key, count]) => `<button type="button" class="st-app${view.platform === key ? ' is-on' : ''}" data-platform="${key}" aria-pressed="${view.platform === key}" title="${PLATFORMS[key].name} · ${count}">${logo(key, { size: 'sm' })}<span class="sr-only">${PLATFORMS[key].name}</span><b>${count}</b></button>`).join('') + (view.platform ? `<button type="button" class="st-link" data-platform="">Show all apps</button>` : '');
  const listed = visible.filter(item => view.kind === 'all' || item.kind === view.kind).sort((a, b) => b.savedAt - a.savedAt);
  $('.st-tiles').innerHTML = listed.length ? listed.map(tile).join('') : `<li class="st-empty">${view.query || view.platform ? 'Nothing matches. Try clearing the search or the app filter.' : 'Everything is either in Now or waiting in the inbox.'}</li>`;
}
function renderInbox(items) {
  const fresh = items.filter(item => item.fresh).sort((a, b) => a.savedAt - b.savedAt), item = fresh[0];
  $('.st-inbox').innerHTML = `
    <h3>${icon('inbox')}New from Chrome${fresh.length ? `<span class="st-count">${fresh.length}</span>` : ''}</h3>
    ${item ? `<p class="st-step">Sort one at a time · 1 of ${fresh.length}</p>
      <a class="st-capture" href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer" data-open="${item.id}">${logoOf(item, 'lg')}<span><strong>${esc(item.title)}</strong><span class="st-sub">${where(item)} · ${ago(item.savedAt)}</span>${item.quote ? `<q>${esc(item.quote)}</q>` : ''}${item.note ? `<em>${esc(item.note)}</em>` : ''}</span></a>
      <div class="st-sort">
        <button type="button" class="st-sort-button is-main" data-pin="${item.id}">${icon('pin')}Put in Now</button>
        <button type="button" class="st-sort-button" data-keep="${item.id}">${icon('check')}Keep</button>
        ${moveOptions(item)}
        <button type="button" class="st-icon-button" data-remove="${item.id}" aria-label="Remove ${esc(item.title)}" title="Remove">${icon('trash')}</button>
      </div>` : `<p class="st-clear">${icon('check')}All sorted. ${connected ? 'Save pages from Chrome and they land here.' : ''}</p>`}
    ${connected ? '' : `<details class="st-connect"${item ? '' : ' open'}><summary>${icon('chrome')}Connect the Chrome extension</summary><ol><li>Open <code>chrome://extensions</code> and turn on Developer mode.</li><li>Choose <b>Load unpacked</b> and pick the <code>extension</code> folder in this project.</li><li>Keep this tab open. Save any page with the Scaffold button or <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>.</li></ol></details>`}`;
}
function renderRecent(studio) {
  const entries = studio.activity.slice(0, view.moreRecent ? 15 : 4);
  $('.st-recent').innerHTML = `<h3>${icon('clock')}Recently</h3><ol class="st-feed">${entries.map(entry => `<li><span>${esc(entry.text)}</span><time>${ago(entry.at)}</time></li>`).join('')}</ol>${studio.activity.length > 4 ? `<button type="button" class="st-link" data-more-recent>${view.moreRecent ? 'Show less' : 'Show more'}</button>` : ''}`;
}
function render() {
  if (!current) return;
  const studio = studioOf(current), habitat = metaOf(current), items = studio.items;
  root.style.setProperty('--accent', habitat.accent);
  $('.st-habitat').textContent = habitat.name;
  if (document.activeElement !== $('.st-name')) $('.st-name').value = studio.title;
  if (document.activeElement !== $('.st-goal')) $('.st-goal').value = studio.goal;
  const fresh = items.filter(item => item.fresh).length, pinned = items.filter(item => item.pinned).length;
  $('.st-stats').innerHTML = `${items.length} things · ${pinned} in Now${fresh ? ` · <b>${fresh} new from Chrome</b>` : ''}`;
  const ext = $('.st-ext');
  ext.dataset.state = connected ? 'on' : 'off';
  ext.innerHTML = `${icon('chrome')}<span>${connected ? 'Chrome connected' : 'Connect Chrome'}</span>`;
  $('.st-place strong').textContent = habitat.name;
  $('.st-place small').textContent = habitat.caption ?? '';
  renderResume(items);
  renderNext(studio);
  renderNow(items);
  renderLibrary(items);
  renderInbox(items);
  renderRecent(studio);
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
    const item = find(pin.dataset.pin), pinning = !item.pinned || item.fresh;
    const crowded = pinning && studioOf(current).items.filter(entry => entry.pinned && !entry.fresh).length >= NOW_LIMIT;
    return update(() => {
      item.pinned = pinning;
      item.fresh = false;
      log(current, `${pinning ? 'Put' : 'Took'} “${item.title}” ${pinning ? 'in' : 'out of'} Now`);
    }, crowded ? `Now has more than three things. Take one out when you can.` : null);
  }
  if (keep) {
    const item = find(keep.dataset.keep);
    return update(() => (item.fresh = false), `Kept “${item.title}” in Everything else`);
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
    view.platform = platform.dataset.platform && view.platform !== platform.dataset.platform ? platform.dataset.platform : null;
    return render();
  }
  const kind = target.closest('[data-kind]');
  if (kind) {
    view.kind = kind.dataset.kind;
    return render();
  }
  if (target.closest('[data-more-now]')) {
    view.moreNow = !view.moreNow;
    return render();
  }
  if (target.closest('[data-more-recent]')) {
    view.moreRecent = !view.moreRecent;
    return render();
  }
  if (target.closest('.st-tick')) {
    const next = studioOf(current).next;
    return update(() => {
      next.done = !next.done;
      next.at = Date.now();
      if (next.done) log(current, `Did “${next.text}”`);
    });
  }
  if (target.closest('.st-add')) return openModal();
  if (target.closest('.st-ext') && !connected) {
    const details = $('.st-connect');
    if (details) {
      details.open = true;
      details.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  if (target.closest('.st-close')) return close();
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
for (const [selector, apply] of [
  ['.st-name', value => (studioOf(current).title = value || studioOf(current).title)],
  ['.st-goal', value => (studioOf(current).goal = value)],
  ['.st-next-text', value => Object.assign(studioOf(current).next, { text: value, done: false, at: Date.now() })],
]) {
  $(selector).addEventListener('change', event => {
    apply(event.target.value.trim());
    save();
    announce();
    render();
  });
}
$('.st-next-text').addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  event.target.blur();
});

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
  const url = form.elements.url.value.trim(), key = platformOf(url), platform = PLATFORMS[key];
  form.querySelector('.st-detect').innerHTML = /^https?:\/\/\S+\.\S+|^https?:\/\/localhost/.test(url) ? `${logo(key, { size: 'sm' })} ${platform.name} · goes under ${KINDS[platform.kind].label}` : '';
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
      const item = makeItem({ title: capture.title || hostOf(capture.url), url: capture.url, note: capture.note ?? '', quote: capture.quote ?? '', favicon: capture.favicon ?? '', pinned: Boolean(capture.pinned), fresh: !capture.pinned, source: 'chrome', savedAt: capture.savedAt ?? Date.now() });
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
  Object.assign(view, { kind: 'all', platform: null, query: '', moreNow: false, moreRecent: false });
  $('.st-search input').value = '';
  root.hidden = false;
  render();
  void root.offsetWidth;
  root.classList.add('is-open');
  $('.st-panel').scrollTop = 0;
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
  // The habitats that hold endeavors: [{ id, name, caption, accent }].
  register(list) {
    habitats = list;
    for (const habitat of list) {
      const studio = (state.endeavors[habitat.id] ??= { title: habitat.name, goal: '', items: [], activity: [] });
      studio.next ??= { text: '', done: false, at: Date.now() };
    }
    announce();
    post({ type: 'ping' });
  },
  open,
  close,
  isOpen: () => !root.hidden,
  current: () => current,
  // Height of the strip along the bottom that shows the habitat (the panel ends above it).
  stripHeight: () => innerHeight - $('.st-panel').getBoundingClientRect().bottom,
  escape() {
    if (root.hidden) return false;
    if (!modal.hidden) closeModal();
    else close();
    return true;
  },
  // What the collapsed habitat shows: counts, the apps in play and the latest thing that happened.
  summary(id) {
    const studio = studioOf(id);
    if (!studio) return null;
    const items = studio.items, counts = {};
    items.filter(item => item.pinned || item.fresh).forEach(item => (counts[item.platform] = (counts[item.platform] ?? 0) + 1));
    const latest = [...items].sort((a, b) => touched(b) - touched(a))[0];
    return {
      title: studio.title,
      next: studio.next && !studio.next.done ? studio.next.text : '',
      count: items.length,
      pinned: items.filter(item => item.pinned).length,
      fresh: items.filter(item => item.fresh).length,
      platforms: Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([key]) => key).slice(0, 4),
      latest: latest && { title: latest.title, platform: latest.platform, at: touched(latest), opened: (latest.openedAt ?? 0) > latest.savedAt },
      connected,
    };
  },
  onChange(listener) {
    listeners.add(listener);
  },
};
