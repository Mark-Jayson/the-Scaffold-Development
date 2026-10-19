// Craft documents (elements + pictures) and their gallery thumbnails live in IndexedDB,
// which has room for images; a Map stands in when IndexedDB is unavailable.
const DB_NAME = 'moonbase-crafts';
const STORES = ['docs', 'thumbs'];
const memory = Object.fromEntries(STORES.map(store => [store, new Map()]));
let opening;

function openDb() {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => STORES.forEach(store => request.result.createObjectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch(() => null);
  return opening;
}
async function run(store, mode, action) {
  const db = await openDb();
  if (!db) return action(memory[store]);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const request = action(transaction.objectStore(store));
    transaction.oncomplete = () => resolve(request?.result);
    transaction.onerror = () => reject(transaction.error);
  });
}

export const loadDoc = id => run('docs', 'readonly', store => store.get(id));
export const saveDoc = (id, doc) => run('docs', 'readwrite', store => store.set ? store.set(id, doc) : store.put(doc, id));
export const loadThumb = id => run('thumbs', 'readonly', store => store.get(id));
export const saveThumb = (id, src) => run('thumbs', 'readwrite', store => store.set ? store.set(id, src) : store.put(src, id));
export const forget = id => Promise.all(STORES.map(name => run(name, 'readwrite', store => store.delete(id))));
