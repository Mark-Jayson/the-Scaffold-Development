// Right-click menu, the Alt+Shift+S shortcut and the toolbar badge (how many saves are still waiting to sync).
import { saveCapture, lastEndeavor, endeavors, savable } from './store.js';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'save-page', title: 'Save page to Scaffold', contexts: ['page'] });
  chrome.contextMenus.create({ id: 'save-link', title: 'Save link to Scaffold', contexts: ['link'] });
  chrome.contextMenus.create({ id: 'save-selection', title: 'Save highlight to Scaffold', contexts: ['selection'] });
  updateBadge();
});

async function quickSave(tab, extra = {}) {
  const url = extra.url ?? tab?.url;
  if (!savable(url)) return;
  const id = await lastEndeavor(), endeavor = (await endeavors()).find(entry => entry.id === id);
  await saveCapture({ url, title: extra.title ?? tab.title, endeavor: id, quote: extra.quote ?? '', favicon: tab?.favIconUrl ?? '' });
  // A short confirmation on the toolbar icon, since there is no popup for quick saves.
  chrome.action.setBadgeText({ text: '✓', tabId: tab?.id });
  chrome.action.setTitle({ title: `Saved to ${endeavor?.name ?? 'Scaffold'}`, tabId: tab?.id });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '', tabId: tab?.id });
    chrome.action.setTitle({ title: 'Save to Scaffold', tabId: tab?.id });
  }, 1800);
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-link') quickSave(tab, { url: info.linkUrl, title: info.selectionText || info.linkUrl });
  else if (info.menuItemId === 'save-selection') quickSave(tab, { quote: info.selectionText });
  else quickSave(tab);
});
chrome.commands.onCommand.addListener(async command => {
  if (command !== 'save-page') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  quickSave(tab);
});

async function updateBadge() {
  const { captures = [] } = await chrome.storage.local.get('captures');
  chrome.action.setBadgeBackgroundColor({ color: '#044794' });
  chrome.action.setBadgeText({ text: captures.length ? String(captures.length) : '' });
}
chrome.storage.onChanged.addListener((changes, area) => area === 'local' && changes.captures && updateBadge());
chrome.runtime.onStartup.addListener(updateBadge);
