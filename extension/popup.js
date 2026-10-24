// Toolbar popup: shows the current tab, lets you pick an endeavor (and add a note, a pin or the highlighted text),
// then queues the capture for the WorkStation.
import { PLATFORMS, KINDS, platformOf, hostOf, ago } from './platforms.js';
import { endeavors, lastEndeavor, workstation, saveCapture, forget, savable } from './store.js';

const $ = selector => document.querySelector(selector);
const form = $('.capture');
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const list = await endeavors(), chosen = await lastEndeavor();
const accentOf = id => list.find(entry => entry.id === id)?.accent ?? '#ffffff';

// The page
const platform = PLATFORMS[platformOf(tab?.url ?? '')];
form.elements.title.value = tab?.title ?? '';
$('.where').textContent = `${platform.name} · ${KINDS[platform.kind].one} · ${hostOf(tab?.url ?? '') || 'this page'}`;
const badge = $('.symbol');
badge.style.setProperty('--platform', platform.color);
if (tab?.favIconUrl && /^https?:|^data:/.test(tab.favIconUrl)) {
  const image = document.createElement('img');
  image.src = tab.favIconUrl;
  image.alt = '';
  image.addEventListener('error', () => (badge.textContent = platform.mono));
  badge.append(image);
} else badge.textContent = platform.mono;
if (!savable(tab?.url)) {
  $('.save').disabled = true;
  $('.unsavable').hidden = false;
}

// Whatever is highlighted on the page comes along as a quote.
let quote = '';
try {
  const [{ result } = {}] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => String(getSelection()).trim().slice(0, 600) });
  quote = result ?? '';
} catch {
  // Chrome's own pages and the Web Store do not allow scripts; save without a quote.
}
if (quote) {
  $('.quote').textContent = quote;
  $('.quote').hidden = false;
}

// Endeavors, as the WorkStation last reported them
$('.endeavors').insertAdjacentHTML('beforeend', list.map(entry => `<label class="endeavor" style="--accent:${entry.accent}"><input type="radio" name="endeavor" value="${entry.id}"${entry.id === chosen ? ' checked' : ''} /><i></i><span>${escape(entry.name)}<small>${escape(entry.title ?? '')}</small></span></label>`).join(''));
function escape(text) {
  return String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

// Sync status and recent saves
async function renderStatus() {
  const { captures = [], history = [] } = await chrome.storage.local.get(['captures', 'history']);
  const sync = $('.sync');
  sync.textContent = captures.length ? `${captures.length} waiting to sync` : 'All synced';
  sync.classList.toggle('is-waiting', captures.length > 0);
  sync.title = captures.length ? 'Open the Scaffold WorkStation in a tab and they sync straight in.' : '';
  $('.recent-list').innerHTML = history.slice(0, 5).map(capture => `<li style="--accent:${accentOf(capture.endeavor)}"><i></i><span>${escape(capture.title)}</span><small>${ago(capture.savedAt)}</small></li>`).join('');
}
renderStatus();
chrome.storage.onChanged.addListener(renderStatus);

let saved;
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!savable(tab?.url)) return;
  const endeavor = form.elements.endeavor.value || chosen;
  saved = await saveCapture({ url: tab.url, title: form.elements.title.value, endeavor, note: form.elements.note.value.trim(), quote, pinned: form.elements.pinned.checked, favicon: tab.favIconUrl ?? '' });
  form.hidden = true;
  $('.done').hidden = false;
  $('.done-title').textContent = `Saved to ${list.find(entry => entry.id === endeavor)?.name ?? 'Scaffold'}`;
});
$('.undo').addEventListener('click', async () => {
  if (saved) await forget(saved.id);
  saved = null;
  form.hidden = false;
  $('.done').hidden = true;
});
$('.open').addEventListener('click', async () => {
  const base = await workstation(), url = `${base.replace(/#.*$/, '')}#endeavor-${saved?.endeavor ?? chosen}`;
  // Reuse an open WorkStation tab rather than stacking new ones.
  const [existing] = await chrome.tabs.query({ url: `${base.replace(/#.*$/, '')}*` });
  if (existing) {
    await chrome.tabs.update(existing.id, { url, active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
  } else await chrome.tabs.create({ url });
  window.close();
});
