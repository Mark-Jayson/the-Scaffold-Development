// Runs on localhost pages. Only on the Scaffold WorkStation (marked by <meta name="scaffold-workstation">)
// it hands waiting captures to the page, learns the page's endeavors, and forgets captures the page acknowledges.
(() => {
  if (!document.querySelector('meta[name="scaffold-workstation"]')) return;
  const post = message => window.postMessage({ source: 'scaffold-bridge', ...message }, location.origin);
  const hello = () => post({ type: 'hello', version: chrome.runtime.getManifest().version });
  async function deliver() {
    const { captures = [] } = await chrome.storage.local.get('captures');
    if (captures.length) post({ type: 'captures', items: captures });
  }

  window.addEventListener('message', async event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.source !== 'scaffold-page') return;
    const { type } = event.data;
    if (type === 'ping') {
      hello();
      deliver();
    } else if (type === 'endeavors' && Array.isArray(event.data.list)) {
      chrome.storage.local.set({ endeavors: event.data.list, workstation: location.origin + location.pathname });
    } else if (type === 'ack' && Array.isArray(event.data.ids)) {
      const { captures = [] } = await chrome.storage.local.get('captures');
      chrome.storage.local.set({ captures: captures.filter(capture => !event.data.ids.includes(capture.id)) });
    }
  });
  // New saves reach an open WorkStation tab straight away.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.captures?.newValue?.length > (changes.captures.oldValue?.length ?? 0)) deliver();
  });
  hello();
  deliver();
})();
