// Captures wait in chrome.storage.local until an open WorkStation tab picks them up through bridge.js.
import { platformOf, PLATFORMS } from './platforms.js';

// Used until a WorkStation tab has told us its real endeavors.
export const DEFAULT_ENDEAVORS = [
  { id: 'research', name: 'Research', title: 'Focus & sleep study', accent: '#e985b5' },
  { id: 'studios', name: 'Workplace', title: 'Northwind rebrand', accent: '#879dff' },
  { id: 'startup', name: 'Startup', title: 'Scaffold launch', accent: '#ef9b7e' },
];
export const DEFAULT_WORKSTATION = 'http://localhost:5173/';

export async function endeavors() {
  const { endeavors: list } = await chrome.storage.local.get('endeavors');
  return list?.length ? list : DEFAULT_ENDEAVORS;
}
export async function lastEndeavor() {
  const [{ lastEndeavor: id }, list] = await Promise.all([chrome.storage.local.get('lastEndeavor'), endeavors()]);
  return list.find(entry => entry.id === id)?.id ?? list[0].id;
}
export async function workstation() {
  const { workstation: url } = await chrome.storage.local.get('workstation');
  return url || DEFAULT_WORKSTATION;
}

// Pages Chrome cannot hand to a website (its own settings, extension pages, files) are not worth saving.
export const savable = url => /^https?:\/\//i.test(url ?? '');

export async function saveCapture({ url, title, endeavor, note = '', quote = '', pinned = false, favicon = '' }) {
  const platform = platformOf(url);
  const capture = { id: `cap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, url, title: title?.trim() || new URL(url).hostname, endeavor, note, quote, pinned, favicon, platform, kind: PLATFORMS[platform].kind, savedAt: Date.now() };
  const { captures = [], history = [] } = await chrome.storage.local.get(['captures', 'history']);
  await chrome.storage.local.set({ captures: [...captures, capture], history: [capture, ...history].slice(0, 20), lastEndeavor: endeavor });
  return capture;
}
export async function forget(id) {
  const { captures = [], history = [] } = await chrome.storage.local.get(['captures', 'history']);
  await chrome.storage.local.set({ captures: captures.filter(capture => capture.id !== id), history: history.filter(capture => capture.id !== id) });
}
