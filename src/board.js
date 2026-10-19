// Sketch board for crafts: an SVG canvas on the #044794 dot grid with a tool rail (left)
// and a properties panel (right). Elements live in world units; one dot-grid cell is 28 units.
const NS = 'http://www.w3.org/2000/svg';
const GRID = 28;
const FONT = 'Montserrat, system-ui, sans-serif';
const BOARD_BG = '#044794';
const STROKES = ['#ffffff', '#7dd3fc', '#facc15', '#f472b6', '#4ade80', '#fb923c', '#a78bfa', '#0f172a'];
const FILLS = ['none', 'rgba(255,255,255,0.14)', '#7dd3fc', '#facc15', '#f472b6', '#4ade80', '#fb923c', '#ffffff'];
const NOTES = ['#fde68a', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#fed7aa', '#ddd6fe'];
const WIDTHS = [1, 2, 4, 8];
const SIZES = [['S', 16], ['M', 24], ['L', 36], ['XL', 56]];
const SHAPES = new Set(['rect', 'ellipse', 'diamond']);
const SUPPORTS = {
  stroke: new Set(['path', 'line', 'rect', 'ellipse', 'diamond', 'text']),
  fill: SHAPES,
  note: new Set(['note']),
  width: new Set(['path', 'line', 'rect', 'ellipse', 'diamond']),
  dash: new Set(['path', 'line', 'rect', 'ellipse', 'diamond']),
  size: new Set(['text', 'note']),
  opacity: new Set(['path', 'line', 'rect', 'ellipse', 'diamond', 'text', 'note', 'link', 'image']),
};
const TOOL_TYPES = { pen: 'path', marker: 'path', line: 'line', arrow: 'line', rect: 'rect', ellipse: 'ellipse', diamond: 'diamond', text: 'text', note: 'note', link: 'link', image: 'image' };

const ICONS = {
  select: '<path d="M6 3.5 18.5 12l-5.6 1.4-2.6 5.6z"/>',
  hand: '<path d="M8 12.5V6a1.5 1.5 0 0 1 3 0v5.5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7.5a6.5 6.5 0 0 1-6.5 6.5h-.6a6 6 0 0 1-4.9-2.6l-1.8-2.8a1.5 1.5 0 0 1 2.4-1.8L8 15"/>',
  pen: '<path d="M4 20l1.2-4.4L16 4.8a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.4 18.8z"/><path d="M14.5 6.5l3 3"/>',
  marker: '<path d="M9.5 14.5 17 7l3 3-7.5 7.5z"/><path d="M9.5 14.5 7 17l-.5 2.5h3l2-1.5"/><path d="M4 21h9"/>',
  eraser: '<path d="M20 20H9.5M4.6 14.4l8-8a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 18H8.2z"/><path d="M8.5 10.5l5 5"/>',
  line: '<path d="M5 19 19 5"/>',
  arrow: '<path d="M5 19 19 5M10 5h9v9"/>',
  rect: '<rect x="4" y="6" width="16" height="12" rx="2"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>',
  diamond: '<path d="M12 3.5 20.5 12 12 20.5 3.5 12z"/>',
  text: '<path d="M5 7V4.5h14V7M12 4.5v15M9 19.5h6"/>',
  note: '<path d="M5 4.5h14v9.5l-5.5 5.5H5z"/><path d="M13.5 19.5V14H19"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  image: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m20.5 16-5-5-8.5 8"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  minus: '<path d="M6 12h12"/>',
  plus: '<path d="M12 6v12M6 12h12"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  front: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M15 8V6a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2"/>',
  back: '<rect x="5" y="5" width="11" height="11" rx="2"/><path d="M19 9v9a1 1 0 0 1-1 1H9"/>',
  duplicate: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
  open: '<path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"/>',
  edit: '<path d="M4 20l1-4L16 5l3 3L8 19z"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  grid: '<circle cx="6" cy="6" r="1"/><circle cx="12" cy="6" r="1"/><circle cx="18" cy="6" r="1"/><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/><circle cx="6" cy="18" r="1"/><circle cx="12" cy="18" r="1"/><circle cx="18" cy="18" r="1"/>',
  panel: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M14.5 4.5v15"/>',
};
const TOOLS = [
  [['select', 'Select', 'V'], ['hand', 'Hand', 'H']],
  [['pen', 'Pen', 'P'], ['marker', 'Highlighter', 'M'], ['eraser', 'Eraser', 'E']],
  [['line', 'Line', 'L'], ['arrow', 'Arrow', 'A'], ['rect', 'Rectangle', 'R'], ['ellipse', 'Ellipse', 'O'], ['diamond', 'Diamond', 'D']],
  [['text', 'Text', 'T'], ['note', 'Sticky note', 'N'], ['link', 'Link', 'K'], ['image', 'Picture', 'I']],
];
const SHORTCUTS = Object.fromEntries(TOOLS.flat().map(([tool, , key]) => [key.toLowerCase(), tool]));

const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
const make = (tag, attrs = {}, parent) => {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) if (value !== null && value !== undefined) node.setAttribute(key, value);
  parent?.append(node);
  return node;
};
const html = (tag, className, markup = '') => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.innerHTML = markup;
  return node;
};
const clone = value => structuredClone(value);
const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = value => Math.round(value * 10) / 10;
const isTyping = target => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/* ---------- Text measurement and geometry ---------- */
const measure = document.createElement('canvas').getContext('2d');
const textWidth = (text, size, weight = 400) => {
  measure.font = `${weight} ${size}px ${FONT}`;
  return measure.measureText(text).width;
};
function wrap(text, size, maxWidth) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const attempt = line ? `${line} ${word}` : word;
      if (textWidth(attempt, size) <= maxWidth || !line) line = attempt;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}
const NOTE_PAD = 14;
const noteLines = el => wrap(el.text || '', el.size, el.w - NOTE_PAD * 2);
const noteHeight = el => Math.max(el.h, noteLines(el).length * el.size * 1.3 + NOTE_PAD * 2);
const linkWidth = el => clamp(Math.max(textWidth(el.label, 15, 500), textWidth(shortUrl(el.url), 11)) + 104, 190, 390);
const shortUrl = url => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

function box(el) {
  switch (el.type) {
    case 'path': {
      const xs = el.points.map(point => point[0]), ys = el.points.map(point => point[1]), pad = el.width / 2;
      return { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 };
    }
    case 'line': return { x: Math.min(el.x1, el.x2), y: Math.min(el.y1, el.y2), w: Math.abs(el.x2 - el.x1), h: Math.abs(el.y2 - el.y1) };
    case 'text': {
      const lines = (el.text || ' ').split('\n');
      return { x: el.x, y: el.y, w: Math.max(el.size * 0.6, ...lines.map(line => textWidth(line, el.size))), h: lines.length * el.size * 1.25 };
    }
    case 'note': return { x: el.x, y: el.y, w: el.w, h: noteHeight(el) };
    case 'link': return { x: el.x, y: el.y, w: linkWidth(el), h: 56 };
    default: return { x: el.x, y: el.y, w: el.w, h: el.h };
  }
}
const union = boxes => {
  if (!boxes.length) return null;
  const x = Math.min(...boxes.map(item => item.x)), y = Math.min(...boxes.map(item => item.y));
  return { x, y, w: Math.max(...boxes.map(item => item.x + item.w)) - x, h: Math.max(...boxes.map(item => item.y + item.h)) - y };
};
const overlaps = (a, b) => a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h;
const normalize = el => {
  if (el.w < 0) [el.x, el.w] = [el.x + el.w, -el.w];
  if (el.h < 0) [el.y, el.h] = [el.y + el.h, -el.h];
};

function translate(el, from, dx, dy) {
  if (el.type === 'path') el.points = from.points.map(([x, y]) => [round(x + dx), round(y + dy)]);
  else if (el.type === 'line') Object.assign(el, { x1: from.x1 + dx, y1: from.y1 + dy, x2: from.x2 + dx, y2: from.y2 + dy });
  else Object.assign(el, { x: from.x + dx, y: from.y + dy });
}
// Maps an element from its original box onto a new box (used by corner handles).
function reshape(el, from, before, after) {
  const sx = before.w ? after.w / before.w : 1, sy = before.h ? after.h / before.h : 1;
  const map = (x, y) => [round(after.x + (x - before.x) * sx), round(after.y + (y - before.y) * sy)];
  if (el.type === 'path') el.points = from.points.map(([x, y]) => map(x, y));
  else if (el.type === 'text') Object.assign(el, { x: after.x, y: after.y, size: clamp(round(from.size * sy), 8, 240) });
  else Object.assign(el, { x: after.x, y: after.y, w: Math.max(8, after.w), h: Math.max(8, after.h) });
}

function smooth(points) {
  if (points.length === 1) return `M${points[0][0]} ${points[0][1]}l0.01 0`;
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const [x, y] = points[index], [nx, ny] = points[index + 1];
    d += `Q${x} ${y} ${round((x + nx) / 2)} ${round((y + ny) / 2)}`;
  }
  const [lx, ly] = points.at(-1);
  return `${d}L${lx} ${ly}`;
}
function arrowHead(el) {
  const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1), size = Math.max(12, el.width * 4.5);
  const side = offset => `${round(el.x2 - size * Math.cos(angle + offset))},${round(el.y2 - size * Math.sin(angle + offset))}`;
  return `${el.x2},${el.y2} ${side(0.42)} ${side(-0.42)}`;
}
function normalizeUrl(value) {
  const raw = value.trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
const readFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});
// Large photos are scaled down so a board stays light enough to store and undo.
async function loadPicture(file) {
  const original = await readFile(file), image = new Image();
  image.src = original;
  await image.decode();
  const longest = Math.max(image.naturalWidth, image.naturalHeight), limit = 1800;
  if (file.type === 'image/svg+xml' || (longest <= limit && file.size < 1.5e6)) return { src: original, width: image.naturalWidth || 400, height: image.naturalHeight || 300 };
  const scale = Math.min(1, limit / longest), canvas = document.createElement('canvas');
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return { src: canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86), width: canvas.width, height: canvas.height };
}
const download = (blob, name) => {
  const anchor = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 2000);
};
const fileName = name => (name.trim() || 'craft').replace(/[\\/:*?"<>|]+/g, '-');

export function createBoard(host, { onChange = () => {} } = {}) {
  /* ---------- DOM ---------- */
  const stage = html('div', 'board-stage');
  const svgEl = make('svg', { class: 'board-svg' });
  const defs = make('defs', {}, svgEl);
  defs.innerHTML = '<filter id="board-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#00112e" flood-opacity="0.4"/></filter>';
  const world = make('g', { class: 'board-world' }, svgEl);
  const overlay = make('g', { class: 'board-overlay' }, svgEl);
  const editor = html('textarea', 'board-text-editor');
  editor.hidden = true;
  editor.setAttribute('aria-label', 'Edit text');
  editor.spellcheck = false;
  stage.append(svgEl, editor);

  const rail = html('nav', 'board-tools');
  rail.setAttribute('aria-label', 'Sketch tools');
  TOOLS.forEach((group, index) => {
    if (index) rail.append(html('span', 'board-tools-gap'));
    for (const [tool, label, key] of group) {
      const button = html('button', 'board-tool', icon(tool));
      Object.assign(button, { type: 'button', title: `${label} (${key})` });
      button.dataset.tool = tool;
      button.dataset.tip = `${label} · ${key}`;
      button.setAttribute('aria-label', label);
      rail.append(button);
    }
  });

  const swatches = (prop, values, label) => `<div class="board-swatches" role="group" aria-label="${label}">${values.map(value => `<button type="button" class="board-swatch${value === 'none' ? ' is-none' : ''}" data-prop="${prop}" data-value="${value}" style="--swatch:${value === 'none' ? 'transparent' : value}" aria-label="${value === 'none' ? 'No fill' : value}"></button>`).join('')}${prop === 'stroke' ? '<label class="board-swatch is-custom" aria-label="Custom colour"><input type="color" data-prop="stroke" value="#ffffff" /></label>' : ''}</div>`;
  const segments = (prop, options, label) => `<div class="board-segments" role="group" aria-label="${label}">${options.map(([text, value]) => `<button type="button" data-prop="${prop}" data-value="${value}">${text}</button>`).join('')}</div>`;
  const action = (name, label, iconName) => `<button type="button" class="board-action" data-action="${name}" title="${label}" aria-label="${label}">${icon(iconName)}</button>`;
  const panel = html('aside', 'board-panel', `
    <p class="board-panel-title">Properties</p>
    <section data-for="stroke"><h4>Colour</h4>${swatches('stroke', STROKES, 'Colour')}</section>
    <section data-for="fill"><h4>Fill</h4>${swatches('fill', FILLS, 'Fill')}</section>
    <section data-for="note"><h4>Note colour</h4>${swatches('note', NOTES, 'Note colour')}</section>
    <section data-for="width"><h4>Stroke width</h4>${segments('width', WIDTHS.map(width => [`<i style="height:${Math.min(width, 6)}px"></i>`, width]), 'Stroke width')}</section>
    <section data-for="dash"><h4>Line style</h4>${segments('dash', [['Solid', 'false'], ['Dashed', 'true']], 'Line style')}</section>
    <section data-for="size"><h4>Text size</h4>${segments('size', SIZES.map(([text, size]) => [text, size]), 'Text size')}</section>
    <section data-for="opacity"><h4>Opacity <output class="board-opacity-value">100%</output></h4><input type="range" min="10" max="100" step="5" value="100" data-prop="opacity" aria-label="Opacity" /></section>
    <section data-for="link"><h4>Link</h4><div class="board-row">${action('open-link', 'Open link', 'open')}${action('edit-link', 'Edit link', 'edit')}<span class="board-link-url"></span></div></section>
    <section data-for="selection"><h4>Arrange</h4><div class="board-row">${action('front', 'Bring to front', 'front')}${action('back', 'Send to back', 'back')}${action('duplicate', 'Duplicate (⌘D)', 'duplicate')}${action('delete', 'Delete (⌫)', 'trash')}</div></section>
    <section class="board-panel-canvas"><h4>Board</h4>
      <div class="board-row">${action('undo', 'Undo (⌘Z)', 'undo')}${action('redo', 'Redo (⇧⌘Z)', 'redo')}<span class="board-row-gap"></span>${action('zoom-out', 'Zoom out', 'minus')}<button type="button" class="board-zoom" data-action="zoom-reset" title="Reset to 100%">100%</button>${action('zoom-in', 'Zoom in', 'plus')}</div>
      <div class="board-row">${action('fit', 'Zoom to fit', 'fit')}<button type="button" class="board-toggle" data-action="snap" aria-pressed="false">${icon('grid')}Snap to dots</button></div>
      <div class="board-row"><button type="button" class="board-text-button" data-action="export-png">${icon('download')}PNG</button><button type="button" class="board-text-button" data-action="export-svg">${icon('download')}SVG</button><button type="button" class="board-text-button is-danger" data-action="clear">Clear</button></div>
    </section>`);
  panel.setAttribute('aria-label', 'Properties');

  const linkDialog = html('form', 'board-link-dialog', `
    <p class="board-link-heading">Add link</p>
    <label>URL<input name="url" type="text" inputmode="url" placeholder="example.com/spec" autocomplete="off" required /></label>
    <label>Label <span>(optional)</span><input name="label" type="text" placeholder="Shown on the board" autocomplete="off" /></label>
    <p class="board-link-error" hidden>Enter a valid web or email address.</p>
    <div class="board-link-actions"><button type="button" data-link="cancel">Cancel</button><button type="submit">Add link</button></div>`);
  linkDialog.hidden = true;
  const picker = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*', multiple: true, hidden: true });
  const hint = html('p', 'board-hint');
  host.append(stage, rail, panel, linkDialog, picker, hint);

  /* ---------- State ---------- */
  let doc = { elements: [], assets: {} }, view = { x: 0, y: 0, k: 1 }, tool = 'select', selection = new Set();
  let history = [], future = [], pending = null, drag = null, editing = null, linkTarget = null;
  let snap = false, spaceHeld = false, active = false, title = 'craft';
  const style = { stroke: '#ffffff', fill: 'none', note: NOTES[0], width: 2, dash: false, size: 24, opacity: 1 };
  const find = id => doc.elements.find(el => el.id === id);
  const selected = () => doc.elements.filter(el => selection.has(el.id));
  const rect = () => svgEl.getBoundingClientRect();
  const toWorld = event => {
    const bounds = rect();
    return { x: (event.clientX - bounds.left - view.x) / view.k, y: (event.clientY - bounds.top - view.y) / view.k };
  };
  const snapValue = value => (snap ? Math.round(value / GRID) * GRID : value);
  const snapPoint = point => ({ x: snapValue(point.x), y: snapValue(point.y) });

  /* ---------- History: snapshots are cheap because pictures live in `assets` ---------- */
  const begin = () => {
    pending ??= JSON.stringify(doc.elements);
  };
  const end = () => {
    if (pending === null) return;
    if (pending !== JSON.stringify(doc.elements)) {
      history.push(pending);
      if (history.length > 150) history.shift();
      future = [];
      onChange();
    }
    pending = null;
    syncPanel();
  };
  const restore = (from, to) => {
    if (!from.length) return;
    to.push(JSON.stringify(doc.elements));
    doc.elements = JSON.parse(from.pop());
    selection = new Set([...selection].filter(find));
    render();
    onChange();
  };
  const undo = () => restore(history, future);
  const redo = () => restore(future, history);

  /* ---------- Rendering ---------- */
  function draw(el) {
    const g = make('g', { 'data-id': el.id, class: `board-el board-${el.type}`, opacity: el.opacity ?? 1 });
    const stroke = { stroke: el.stroke, 'stroke-width': el.width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': el.dash ? `${el.width * 3} ${el.width * 2.6}` : null };
    switch (el.type) {
      case 'path': {
        const d = smooth(el.points);
        make('path', { d, fill: 'none', ...stroke }, g);
        make('path', { d, class: 'board-hit', 'stroke-width': Math.max(el.width, 14) }, g);
        break;
      }
      case 'line':
        make('line', { x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2, ...stroke }, g);
        if (el.arrow) make('polygon', { points: arrowHead(el), fill: el.stroke, stroke: el.stroke, 'stroke-width': 1, 'stroke-linejoin': 'round' }, g);
        make('line', { x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2, class: 'board-hit', 'stroke-width': Math.max(el.width, 14) }, g);
        break;
      case 'rect':
        make('rect', { x: el.x, y: el.y, width: el.w, height: el.h, rx: Math.min(10, el.w / 4, el.h / 4), fill: el.fill, ...stroke, 'pointer-events': 'all' }, g);
        break;
      case 'ellipse':
        make('ellipse', { cx: el.x + el.w / 2, cy: el.y + el.h / 2, rx: el.w / 2, ry: el.h / 2, fill: el.fill, ...stroke, 'pointer-events': 'all' }, g);
        break;
      case 'diamond':
        make('polygon', { points: `${el.x + el.w / 2},${el.y} ${el.x + el.w},${el.y + el.h / 2} ${el.x + el.w / 2},${el.y + el.h} ${el.x},${el.y + el.h / 2}`, fill: el.fill, ...stroke, 'pointer-events': 'all' }, g);
        break;
      case 'text': {
        const bounds = box(el);
        make('rect', { x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, class: 'board-hit-area' }, g);
        const text = make('text', { x: el.x, fill: el.stroke, 'font-size': el.size, 'font-family': FONT }, g);
        (el.text || '').split('\n').forEach((line, index) => {
          const span = make('tspan', { x: el.x, y: round(el.y + el.size * 0.95 + index * el.size * 1.25) }, text);
          span.textContent = line || ' ';
        });
        break;
      }
      case 'note': {
        make('rect', { x: el.x, y: el.y, width: el.w, height: noteHeight(el), rx: 6, fill: el.fill, filter: 'url(#board-shadow)' }, g);
        const text = make('text', { fill: '#1f2937', 'font-size': el.size, 'font-family': FONT }, g);
        noteLines(el).forEach((line, index) => {
          const span = make('tspan', { x: el.x + NOTE_PAD, y: round(el.y + NOTE_PAD + el.size * 0.95 + index * el.size * 1.3) }, text);
          span.textContent = line || ' ';
        });
        break;
      }
      case 'link': {
        const width = linkWidth(el);
        make('rect', { x: el.x, y: el.y, width, height: 56, rx: 14, fill: 'rgba(255,255,255,0.12)', stroke: 'rgba(255,255,255,0.55)', 'stroke-width': 1.2 }, g);
        const glyph = make('g', { transform: `translate(${el.x + 14} ${el.y + 16})`, fill: 'none', stroke: '#ffffff', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, g);
        glyph.innerHTML = ICONS.link;
        const label = make('text', { x: el.x + 48, y: el.y + 25, fill: '#ffffff', 'font-size': 15, 'font-weight': 500, 'font-family': FONT }, g);
        label.textContent = el.label;
        const address = make('text', { x: el.x + 48, y: el.y + 43, fill: 'rgba(255,255,255,0.7)', 'font-size': 11, 'font-family': FONT }, g);
        let shown = shortUrl(el.url);
        while (shown.length > 8 && textWidth(shown, 11) > width - 104) shown = `${shown.slice(0, -2)}…`;
        address.textContent = shown;
        const open = make('g', { 'data-action': 'open-link', class: 'board-open-link', transform: `translate(${el.x + width - 38} ${el.y + 14})` }, g);
        make('rect', { width: 28, height: 28, rx: 8, fill: 'rgba(255,255,255,0.14)' }, open);
        const arrow = make('g', { transform: 'translate(4 4) scale(0.84)', fill: 'none', stroke: '#ffffff', 'stroke-width': 2, 'stroke-linecap': 'round' }, open);
        arrow.innerHTML = ICONS.open;
        break;
      }
      case 'image':
        make('image', { href: doc.assets[el.asset], x: el.x, y: el.y, width: el.w, height: el.h, preserveAspectRatio: 'none' }, g);
        make('rect', { x: el.x, y: el.y, width: el.w, height: el.h, fill: 'none', stroke: 'rgba(255,255,255,0.25)', 'stroke-width': 1 }, g);
        break;
    }
    if (editing?.id === el.id) g.setAttribute('visibility', 'hidden');
    return g;
  }
  const nodes = new Map();
  function render() {
    world.replaceChildren();
    nodes.clear();
    for (const el of doc.elements) {
      const node = draw(el);
      nodes.set(el.id, node);
      world.append(node);
    }
    renderOverlay();
    syncPanel();
  }
  function redraw(el) {
    const node = draw(el), previous = nodes.get(el.id);
    if (previous) previous.replaceWith(node);
    else world.append(node);
    nodes.set(el.id, node);
  }
  function renderOverlay() {
    overlay.replaceChildren();
    const line = 1.5 / view.k, size = 10 / view.k;
    if (drag?.mode === 'marquee') {
      const { from, to } = drag;
      make('rect', { x: Math.min(from.x, to.x), y: Math.min(from.y, to.y), width: Math.abs(to.x - from.x), height: Math.abs(to.y - from.y), class: 'board-marquee', 'stroke-width': line }, overlay);
    }
    const items = selected();
    if (!items.length || editing) return;
    const pad = 6 / view.k;
    for (const el of items) {
      const bounds = box(el);
      make('rect', { x: bounds.x - pad, y: bounds.y - pad, width: bounds.w + pad * 2, height: bounds.h + pad * 2, class: 'board-selection', 'stroke-width': line, 'stroke-dasharray': `${4 / view.k} ${3 / view.k}` }, overlay);
    }
    if (items.length !== 1 || tool !== 'select') return;
    const el = items[0];
    if (el.type === 'line') {
      for (const [handle, x, y] of [['p1', el.x1, el.y1], ['p2', el.x2, el.y2]]) make('circle', { cx: x, cy: y, r: size / 1.6, class: 'board-handle', 'data-handle': handle, 'stroke-width': line }, overlay);
    } else if (el.type !== 'link') {
      const bounds = box(el);
      for (const [handle, x, y] of [['nw', bounds.x, bounds.y], ['ne', bounds.x + bounds.w, bounds.y], ['sw', bounds.x, bounds.y + bounds.h], ['se', bounds.x + bounds.w, bounds.y + bounds.h]]) {
        make('rect', { x: x - size / 2, y: y - size / 2, width: size, height: size, rx: 2 / view.k, class: `board-handle is-${handle}`, 'data-handle': handle, 'stroke-width': line }, overlay);
      }
    }
  }
  function applyView() {
    const transform = `translate(${view.x} ${view.y}) scale(${view.k})`;
    world.setAttribute('transform', transform);
    overlay.setAttribute('transform', transform);
    let cell = GRID * view.k;
    while (cell < 12) cell *= 2;
    host.style.setProperty('--grid', `${cell}px`);
    host.style.setProperty('--grid-x', `${view.x - cell / 2}px`);
    host.style.setProperty('--grid-y', `${view.y - cell / 2}px`);
    panel.querySelector('.board-zoom').textContent = `${Math.round(view.k * 100)}%`;
    renderOverlay();
    if (editing) placeEditor();
  }
  function zoomAt(factor, sx, sy) {
    const k = clamp(view.k * factor, 0.1, 6), wx = (sx - view.x) / view.k, wy = (sy - view.y) / view.k;
    view = { k, x: sx - wx * k, y: sy - wy * k };
    applyView();
  }
  const zoomCenter = factor => {
    const bounds = rect();
    zoomAt(factor, bounds.width / 2, bounds.height / 2);
  };
  // Usable area excludes the floating bars so fitted content isn't hidden behind them.
  const usable = () => {
    const bounds = rect(), right = panel.classList.contains('is-hidden') ? 24 : 290;
    return { x: 96, y: 96, w: Math.max(200, bounds.width - 96 - right), h: Math.max(200, bounds.height - 120) };
  };
  function fit() {
    const content = union(doc.elements.map(box)), area = usable();
    if (!content) {
      view = { k: 1, x: area.x + area.w / 2, y: area.y + area.h / 2 };
    } else {
      const k = clamp(Math.min(area.w / (content.w + 120), area.h / (content.h + 120)), 0.1, 1.5);
      view = { k, x: area.x + area.w / 2 - (content.x + content.w / 2) * k, y: area.y + area.h / 2 - (content.y + content.h / 2) * k };
    }
    applyView();
  }

  /* ---------- Panel ---------- */
  function syncPanel() {
    const items = selected(), kinds = new Set(items.length ? items.map(el => el.type) : [TOOL_TYPES[tool]].filter(Boolean));
    const source = items[0] ?? style;
    for (const section of panel.querySelectorAll('section[data-for]')) {
      const key = section.dataset.for;
      let visible;
      if (key === 'selection') visible = items.length > 0;
      else if (key === 'link') visible = items.length === 1 && items[0].type === 'link';
      else visible = [...kinds].some(kind => SUPPORTS[key].has(kind));
      section.hidden = !visible;
    }
    const current = { stroke: source.stroke ?? style.stroke, fill: source.fill ?? style.fill, note: source.type === 'note' ? source.fill : style.note, width: source.width ?? style.width, dash: String(source.dash ?? style.dash), size: source.size ?? style.size };
    for (const button of panel.querySelectorAll('[data-prop][data-value]')) button.classList.toggle('is-active', String(current[button.dataset.prop]) === button.dataset.value);
    const opacity = Math.round((source.opacity ?? style.opacity) * 100);
    panel.querySelector('input[data-prop="opacity"]').value = opacity;
    panel.querySelector('.board-opacity-value').textContent = `${opacity}%`;
    if (/^#[\da-f]{6}$/i.test(current.stroke)) panel.querySelector('input[type="color"]').value = current.stroke;
    if (items.length === 1 && items[0].type === 'link') panel.querySelector('.board-link-url').textContent = shortUrl(items[0].url);
    panel.querySelector('[data-action="undo"]').disabled = !history.length;
    panel.querySelector('[data-action="redo"]').disabled = !future.length;
    panel.querySelector('[data-action="snap"]').setAttribute('aria-pressed', String(snap));
    panel.querySelector('[data-action="clear"]').disabled = !doc.elements.length;
    for (const button of rail.querySelectorAll('[data-tool]')) button.classList.toggle('is-active', button.dataset.tool === tool);
  }
  function setProp(prop, raw, commit = true) {
    const value = prop === 'width' || prop === 'size' ? Number(raw) : prop === 'dash' ? raw === 'true' : prop === 'opacity' ? Number(raw) / 100 : raw;
    style[prop] = value;
    const items = selected();
    if (items.length) {
      begin();
      for (const el of items) {
        if (prop === 'note' && el.type === 'note') el.fill = value;
        else if (prop === 'opacity' || (SUPPORTS[prop]?.has(el.type) && prop !== 'note')) el[prop] = value;
      }
      render();
      if (commit) end();
    }
    syncPanel();
  }
  panel.addEventListener('click', event => {
    const option = event.target.closest('button[data-prop]');
    if (option) return setProp(option.dataset.prop, option.dataset.value);
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const items = selected();
    switch (button.dataset.action) {
      case 'undo': return undo();
      case 'redo': return redo();
      case 'zoom-in': return zoomCenter(1.2);
      case 'zoom-out': return zoomCenter(1 / 1.2);
      case 'zoom-reset': return zoomCenter(1 / view.k);
      case 'fit': return fit();
      case 'snap':
        snap = !snap;
        return syncPanel();
      case 'front':
      case 'back':
        begin();
        doc.elements = button.dataset.action === 'front' ? [...doc.elements.filter(el => !selection.has(el.id)), ...items] : [...items, ...doc.elements.filter(el => !selection.has(el.id))];
        render();
        return end();
      case 'duplicate': return duplicate();
      case 'delete': return removeSelection();
      case 'open-link': return items[0] && window.open(items[0].url, '_blank', 'noopener,noreferrer');
      case 'edit-link': return items[0] && openLinkDialog(null, items[0]);
      case 'export-png': return exportPng();
      case 'export-svg': return download(new Blob([serialize(exportBounds())], { type: 'image/svg+xml' }), `${fileName(title)}.svg`);
      case 'clear':
        if (!window.confirm('Clear everything on this board? You can undo this.')) return;
        begin();
        doc.elements = [];
        selection.clear();
        render();
        return end();
    }
  });
  panel.addEventListener('input', event => {
    const prop = event.target.dataset.prop;
    if (prop && event.target.matches('input')) {
      begin();
      setProp(prop, event.target.type === 'color' ? event.target.value : event.target.value, false);
    }
  });
  panel.addEventListener('change', event => {
    if (event.target.dataset.prop) end();
  });
  rail.addEventListener('click', event => {
    const button = event.target.closest('[data-tool]');
    if (button) setTool(button.dataset.tool);
  });

  const HINTS = {
    select: 'Click to select · drag to move · double-click text to edit',
    hand: 'Drag to pan · scroll also pans, pinch or ⌘-scroll zooms',
    pen: 'Draw freely', marker: 'Highlight over anything', eraser: 'Click or drag across items to erase',
    line: 'Drag to draw a line · Shift snaps to 45°', arrow: 'Drag to draw an arrow · Shift snaps to 45°',
    rect: 'Drag to draw · Shift for a square', ellipse: 'Drag to draw · Shift for a circle', diamond: 'Drag to draw · Shift keeps it even',
    text: 'Click to type', note: 'Click to drop a sticky note', link: 'Click where the link should go', image: 'Pick a picture, or drop and paste images anywhere',
  };
  // `quiet` is for automatic switches back to Select after placing something.
  function setTool(next, quiet = false) {
    if (editing && !quiet) commitText();
    tool = next;
    host.dataset.tool = next;
    if (next !== 'select') selection.clear();
    hint.textContent = HINTS[next];
    clearTimeout(setTool.timer);
    hint.classList.toggle('is-faded', quiet);
    if (!quiet) setTool.timer = setTimeout(() => hint.classList.add('is-faded'), 2600);
    renderOverlay();
    syncPanel();
    if (next === 'image') {
      pictureAt = null;
      picker.click();
    }
  }

  /* ---------- Element helpers ---------- */
  function add(fields) {
    const el = { id: uid(), opacity: style.opacity, ...fields };
    doc.elements.push(el);
    redraw(el);
    return el;
  }
  function removeSelection() {
    if (!selection.size) return;
    begin();
    doc.elements = doc.elements.filter(el => !selection.has(el.id));
    selection.clear();
    render();
    end();
  }
  function paste(elements, assets = {}, offset = GRID) {
    begin();
    Object.assign(doc.assets, assets);
    const copies = elements.map(el => {
      const copy = { ...clone(el), id: uid() };
      translate(copy, clone(copy), offset, offset);
      return copy;
    });
    doc.elements.push(...copies);
    selection = new Set(copies.map(el => el.id));
    if (tool !== 'select') setTool('select', true);
    render();
    end();
  }
  const duplicate = () => {
    if (selection.size) paste(selected());
  };
  const assetsOf = elements => Object.fromEntries(elements.filter(el => el.type === 'image').map(el => [el.asset, doc.assets[el.asset]]));

  /* ---------- Text editing ---------- */
  function placeEditor() {
    const el = find(editing.id);
    if (!el) return;
    const k = view.k, note = el.type === 'note';
    Object.assign(editor.style, {
      left: `${el.x * k + view.x}px`,
      top: `${el.y * k + view.y}px`,
      fontSize: `${el.size * k}px`,
      lineHeight: note ? '1.3' : '1.25',
      color: note ? '#1f2937' : el.stroke,
      background: note ? el.fill : 'transparent',
      padding: note ? `${NOTE_PAD * k}px` : '0',
      width: note ? `${el.w * k}px` : `${Math.max(box({ ...el, text: editor.value || ' ' }).w + el.size, el.size * 4) * k}px`,
      minHeight: note ? `${el.h * k}px` : '0',
      borderRadius: note ? `${6 * k}px` : '0',
    });
    editor.style.height = 'auto';
    editor.style.height = `${editor.scrollHeight}px`;
  }
  function editText(el, isNew = false) {
    begin();
    editing = { id: el.id, isNew };
    editor.value = el.text;
    editor.hidden = false;
    editor.classList.toggle('is-note', el.type === 'note');
    nodes.get(el.id)?.setAttribute('visibility', 'hidden');
    placeEditor();
    renderOverlay();
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(editor.value.length, editor.value.length);
    });
  }
  function commitText() {
    if (!editing) return;
    const el = find(editing.id);
    editing = null;
    editor.hidden = true;
    if (el) {
      el.text = editor.value.replace(/\s+$/, '');
      if (!el.text.trim() && el.type === 'text') {
        doc.elements = doc.elements.filter(item => item !== el);
        selection.delete(el.id);
      }
    }
    render();
    end();
  }
  editor.addEventListener('input', () => {
    const el = find(editing?.id);
    if (!el) return;
    el.text = editor.value;
    placeEditor();
  });
  editor.addEventListener('keydown', event => {
    if (event.key === 'Escape' || (event.key === 'Enter' && (event.metaKey || event.ctrlKey))) {
      event.preventDefault();
      commitText();
    }
    event.stopPropagation();
  });
  editor.addEventListener('blur', () => commitText());

  /* ---------- Links ---------- */
  function openLinkDialog(at, existing) {
    linkTarget = existing ? { id: existing.id } : { at };
    linkDialog.elements.url.value = existing?.url ?? '';
    linkDialog.elements.label.value = existing?.label ?? '';
    linkDialog.querySelector('.board-link-heading').textContent = existing ? 'Edit link' : 'Add link';
    linkDialog.querySelector('[type="submit"]').textContent = existing ? 'Save' : 'Add link';
    linkDialog.querySelector('.board-link-error').hidden = true;
    const anchor = existing ? { x: existing.x, y: existing.y + 64 } : at;
    const bounds = rect();
    linkDialog.style.left = `${clamp(anchor.x * view.k + view.x, 90, bounds.width - 330)}px`;
    linkDialog.style.top = `${clamp(anchor.y * view.k + view.y, 90, bounds.height - 260)}px`;
    linkDialog.hidden = false;
    requestAnimationFrame(() => linkDialog.elements.url.focus());
  }
  const closeLinkDialog = () => {
    linkDialog.hidden = true;
    linkTarget = null;
  };
  linkDialog.addEventListener('submit', event => {
    event.preventDefault();
    const url = normalizeUrl(linkDialog.elements.url.value);
    if (!url) {
      linkDialog.querySelector('.board-link-error').hidden = false;
      return;
    }
    const label = linkDialog.elements.label.value.trim() || new URL(url).hostname.replace(/^www\./, '') || url;
    begin();
    if (linkTarget?.id) Object.assign(find(linkTarget.id), { url, label });
    else {
      const el = add({ type: 'link', x: snapValue(linkTarget.at.x), y: snapValue(linkTarget.at.y), url, label });
      selection = new Set([el.id]);
      setTool('select', true);
    }
    closeLinkDialog();
    render();
    end();
  });
  linkDialog.addEventListener('click', event => {
    if (event.target.closest('[data-link="cancel"]')) closeLinkDialog();
  });
  linkDialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeLinkDialog();
    event.stopPropagation();
  });

  /* ---------- Pictures ---------- */
  let pictureAt = null;
  async function insertPictures(files, at) {
    const pictures = [...files].filter(file => file.type.startsWith('image/'));
    if (!pictures.length) return;
    const area = usable(), center = at ?? { x: (area.x + area.w / 2 - view.x) / view.k, y: (area.y + area.h / 2 - view.y) / view.k };
    begin();
    const created = [];
    for (const [index, file] of pictures.entries()) {
      try {
        const { src, width, height } = await loadPicture(file), scale = Math.min(1, 420 / Math.max(width, height)), asset = uid();
        doc.assets[asset] = src;
        created.push(add({ type: 'image', asset, x: round(center.x - (width * scale) / 2 + index * GRID), y: round(center.y - (height * scale) / 2 + index * GRID), w: round(width * scale), h: round(height * scale) }).id);
      } catch {
        // Unreadable files are skipped.
      }
    }
    selection = new Set(created);
    setTool('select', true);
    render();
    end();
  }
  picker.addEventListener('change', () => {
    insertPictures(picker.files, pictureAt);
    picker.value = '';
    if (tool === 'image') setTool('select');
  });
  stage.addEventListener('dragover', event => {
    if (event.dataTransfer?.types.includes('Files')) {
      event.preventDefault();
      host.classList.add('is-dropping');
    }
  });
  stage.addEventListener('dragleave', () => host.classList.remove('is-dropping'));
  stage.addEventListener('drop', event => {
    event.preventDefault();
    host.classList.remove('is-dropping');
    insertPictures(event.dataTransfer.files, toWorld(event));
  });

  /* ---------- Pointer interaction ---------- */
  function eraseAt(event) {
    const id = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-id]')?.dataset.id;
    if (!id) return;
    doc.elements = doc.elements.filter(el => el.id !== id);
    selection.delete(id);
    nodes.get(id)?.remove();
    nodes.delete(id);
  }
  svgEl.addEventListener('pointerdown', event => {
    if (editing) commitText();
    if (!linkDialog.hidden) closeLinkDialog();
    const point = toWorld(event);
    try {
      svgEl.setPointerCapture(event.pointerId);
    } catch {
      // A pointer that is already gone can't be captured; the gesture still works without it.
    }
    if (event.button === 1 || tool === 'hand' || spaceHeld) {
      drag = { mode: 'pan', from: [event.clientX, event.clientY], view: { ...view } };
      host.classList.add('is-panning');
      return;
    }
    if (event.button !== 0) return;
    const target = event.target;
    if (tool === 'select') {
      const opener = target.closest('[data-action="open-link"]');
      if (opener) {
        const el = find(opener.closest('[data-id]').dataset.id);
        if (el) window.open(el.url, '_blank', 'noopener,noreferrer');
        return;
      }
      const handle = target.closest('[data-handle]');
      if (handle) {
        const el = selected()[0];
        begin();
        drag = { mode: 'resize', handle: handle.dataset.handle, id: el.id, original: clone(el), before: box(el) };
        return;
      }
      const id = target.closest('[data-id]')?.dataset.id;
      if (id) {
        if (event.shiftKey) {
          if (selection.has(id)) selection.delete(id);
          else selection.add(id);
        } else if (!selection.has(id)) selection = new Set([id]);
        const el = find(id);
        if ((event.metaKey || event.ctrlKey) && el?.type === 'link') window.open(el.url, '_blank', 'noopener,noreferrer');
        begin();
        drag = { mode: 'move', from: point, originals: new Map(selected().map(item => [item.id, clone(item)])) };
        renderOverlay();
        syncPanel();
        return;
      }
      if (!event.shiftKey) selection.clear();
      drag = { mode: 'marquee', from: point, to: point };
      renderOverlay();
      syncPanel();
      return;
    }
    if (tool === 'pen' || tool === 'marker') {
      begin();
      const marker = tool === 'marker';
      const el = add({ type: 'path', points: [[round(point.x), round(point.y)]], stroke: marker && style.stroke === '#ffffff' ? '#facc15' : style.stroke, width: marker ? Math.max(14, style.width * 5) : style.width, dash: false, opacity: marker ? 0.4 : style.opacity });
      drag = { mode: 'draw', id: el.id };
      return;
    }
    if (tool === 'eraser') {
      begin();
      drag = { mode: 'erase' };
      eraseAt(event);
      return;
    }
    if (['line', 'arrow', 'rect', 'ellipse', 'diamond'].includes(tool)) {
      begin();
      const start = snapPoint(point);
      const fields = tool === 'line' || tool === 'arrow'
        ? { type: 'line', x1: start.x, y1: start.y, x2: start.x, y2: start.y, arrow: tool === 'arrow' }
        : { type: tool, x: start.x, y: start.y, w: 0, h: 0, fill: style.fill };
      const el = add({ ...fields, stroke: style.stroke, width: style.width, dash: style.dash });
      drag = { mode: 'create', id: el.id, from: start, screen: [event.clientX, event.clientY] };
      return;
    }
    if (tool === 'text' || tool === 'note') {
      begin();
      const el = tool === 'text'
        ? add({ type: 'text', x: round(point.x), y: round(point.y - style.size * 0.6), text: '', stroke: style.stroke, size: style.size })
        : add({ type: 'note', x: snapValue(round(point.x - 100)), y: snapValue(round(point.y - 60)), w: 200, h: 140, text: '', fill: style.note, size: 18 });
      selection = new Set([el.id]);
      setTool('select', true);
      editText(el, true);
      return;
    }
    if (tool === 'link') return openLinkDialog(point);
    if (tool === 'image') {
      pictureAt = point;
      picker.click();
    }
  });
  svgEl.addEventListener('pointermove', event => {
    if (!drag) return;
    const point = toWorld(event);
    switch (drag.mode) {
      case 'pan':
        view = { ...drag.view, x: drag.view.x + event.clientX - drag.from[0], y: drag.view.y + event.clientY - drag.from[1] };
        applyView();
        break;
      case 'draw': {
        const el = find(drag.id), last = el.points.at(-1);
        if (Math.hypot(point.x - last[0], point.y - last[1]) * view.k < 1.5) return;
        el.points.push([round(point.x), round(point.y)]);
        redraw(el);
        break;
      }
      case 'erase':
        eraseAt(event);
        break;
      case 'create': {
        const el = find(drag.id), from = drag.from;
        let to = snapPoint(point);
        if (el.type === 'line') {
          if (event.shiftKey) {
            const angle = Math.round(Math.atan2(to.y - from.y, to.x - from.x) / (Math.PI / 4)) * (Math.PI / 4), length = Math.hypot(to.x - from.x, to.y - from.y);
            to = { x: round(from.x + Math.cos(angle) * length), y: round(from.y + Math.sin(angle) * length) };
          }
          Object.assign(el, { x2: to.x, y2: to.y });
        } else {
          let w = to.x - from.x, h = to.y - from.y;
          if (event.shiftKey) {
            const side = Math.max(Math.abs(w), Math.abs(h));
            w = Math.sign(w || 1) * side;
            h = Math.sign(h || 1) * side;
          }
          Object.assign(el, { x: from.x, y: from.y, w, h });
          normalize(el);
        }
        redraw(el);
        break;
      }
      case 'move': {
        const dx = snapValue(point.x - drag.from.x), dy = snapValue(point.y - drag.from.y);
        for (const [id, original] of drag.originals) {
          const el = find(id);
          if (!el) continue;
          translate(el, original, dx, dy);
          redraw(el);
        }
        renderOverlay();
        break;
      }
      case 'resize': {
        const el = find(drag.id), before = drag.before;
        if (el.type === 'line') {
          const to = snapPoint(point);
          Object.assign(el, drag.handle === 'p1' ? { x1: to.x, y1: to.y } : { x2: to.x, y2: to.y });
        } else {
          const to = snapPoint(point);
          let left = before.x, top = before.y, right = before.x + before.w, bottom = before.y + before.h;
          if (drag.handle.includes('w')) left = to.x;
          if (drag.handle.includes('e')) right = to.x;
          if (drag.handle.includes('n')) top = to.y;
          if (drag.handle.includes('s')) bottom = to.y;
          let after = { x: Math.min(left, right), y: Math.min(top, bottom), w: Math.max(8, Math.abs(right - left)), h: Math.max(8, Math.abs(bottom - top)) };
          // Pictures and text keep their proportions unless Shift is held.
          if ((el.type === 'image' || el.type === 'text') !== event.shiftKey) {
            const ratio = before.w / before.h;
            if (after.w / after.h > ratio) after.w = after.h * ratio;
            else after.h = after.w / ratio;
            if (drag.handle.includes('w')) after.x = right - after.w;
            if (drag.handle.includes('n')) after.y = bottom - after.h;
          }
          if (el.type === 'note') after = { ...after, h: Math.max(60, after.h) };
          reshape(el, drag.original, before, after);
        }
        redraw(el);
        renderOverlay();
        break;
      }
      case 'marquee':
        drag.to = point;
        renderOverlay();
        break;
    }
  });
  const finish = event => {
    if (!drag) return;
    const current = drag;
    drag = null;
    host.classList.remove('is-panning');
    if (current.mode === 'create') {
      const el = find(current.id);
      const tiny = Math.hypot(event.clientX - current.screen[0], event.clientY - current.screen[1]) < 4;
      if (tiny && el.type === 'line') Object.assign(el, { x2: el.x1 + 160, y2: el.y1 });
      if (tiny && el.type !== 'line') Object.assign(el, { x: el.x - 80, y: el.y - 50, w: 160, h: 100 });
      selection = new Set([el.id]);
      setTool('select', true);
    }
    if (current.mode === 'marquee') {
      const area = { x: Math.min(current.from.x, current.to.x), y: Math.min(current.from.y, current.to.y), w: Math.abs(current.to.x - current.from.x), h: Math.abs(current.to.y - current.from.y) };
      if (area.w * view.k > 3 || area.h * view.k > 3) for (const el of doc.elements) if (overlaps(area, box(el))) selection.add(el.id);
    }
    if (current.mode !== 'pan') {
      render();
      end();
    }
  };
  svgEl.addEventListener('pointerup', finish);
  svgEl.addEventListener('pointercancel', finish);
  svgEl.addEventListener('dblclick', event => {
    if (tool !== 'select') return;
    const el = find(event.target.closest('[data-id]')?.dataset.id);
    if (el?.type === 'text' || el?.type === 'note') editText(el);
    else if (el?.type === 'link') openLinkDialog(null, el);
    else if (!el) {
      begin();
      const point = toWorld(event), text = add({ type: 'text', x: round(point.x), y: round(point.y - style.size * 0.6), text: '', stroke: style.stroke, size: style.size });
      selection = new Set([text.id]);
      editText(text, true);
    }
  });
  svgEl.addEventListener('wheel', event => {
    event.preventDefault();
    const bounds = rect();
    if (event.ctrlKey || event.metaKey) zoomAt(Math.exp(-event.deltaY * 0.012), event.clientX - bounds.left, event.clientY - bounds.top);
    else {
      view = { ...view, x: view.x - event.deltaX, y: view.y - event.deltaY };
      applyView();
    }
  }, { passive: false });

  /* ---------- Keyboard and clipboard ---------- */
  window.addEventListener('keydown', event => {
    if (!active || isTyping(event.target) || !linkDialog.hidden) return;
    const key = event.key.toLowerCase(), mod = event.metaKey || event.ctrlKey;
    if (mod && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    } else if (mod && key === 'y') {
      event.preventDefault();
      redo();
    } else if (mod && key === 'a') {
      event.preventDefault();
      setTool('select');
      selection = new Set(doc.elements.map(el => el.id));
      renderOverlay();
      syncPanel();
    } else if (mod && key === 'd') {
      event.preventDefault();
      duplicate();
    } else if (key === 'delete' || key === 'backspace') {
      event.preventDefault();
      removeSelection();
    } else if (key.startsWith('arrow') && selection.size) {
      event.preventDefault();
      const step = snap ? GRID : event.shiftKey ? 10 : 1, dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0, dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
      begin();
      for (const el of selected()) translate(el, clone(el), dx, dy);
      render();
      end();
    } else if (key === ' ') {
      event.preventDefault();
      spaceHeld = true;
      host.classList.add('is-space');
    } else if (!mod && (key === '=' || key === '+')) zoomCenter(1.2);
    else if (!mod && key === '-') zoomCenter(1 / 1.2);
    else if (!mod && key === '0') zoomCenter(1 / view.k);
    else if (!mod && event.shiftKey && key === '!') fit();
    else if (!mod && !event.altKey && SHORTCUTS[key]) setTool(SHORTCUTS[key]);
  });
  window.addEventListener('keyup', event => {
    if (event.key === ' ') {
      spaceHeld = false;
      host.classList.remove('is-space');
    }
  });
  const PREFIX = 'moonbase-board:';
  const copySelection = event => {
    if (!active || isTyping(event.target) || !selection.size) return;
    const items = selected();
    event.clipboardData.setData('text/plain', PREFIX + JSON.stringify({ elements: items, assets: assetsOf(items) }));
    event.preventDefault();
    return true;
  };
  window.addEventListener('copy', copySelection);
  window.addEventListener('cut', event => {
    if (copySelection(event)) removeSelection();
  });
  window.addEventListener('paste', event => {
    if (!active || isTyping(event.target)) return;
    const files = [...(event.clipboardData?.files ?? [])];
    if (files.length) {
      event.preventDefault();
      insertPictures(files);
      return;
    }
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (!text) return;
    event.preventDefault();
    if (text.startsWith(PREFIX)) {
      try {
        const data = JSON.parse(text.slice(PREFIX.length));
        paste(data.elements, data.assets);
      } catch {
        // Not a board payload after all.
      }
      return;
    }
    const area = usable(), center = { x: (area.x + area.w / 2 - view.x) / view.k, y: (area.y + area.h / 2 - view.y) / view.k };
    const url = /^\S+$/.test(text.trim()) && /^(https?:\/\/|www\.)/i.test(text.trim()) ? normalizeUrl(text) : null;
    begin();
    const el = url
      ? add({ type: 'link', x: round(center.x - 120), y: round(center.y - 28), url, label: new URL(url).hostname.replace(/^www\./, '') })
      : add({ type: 'text', x: round(center.x - 100), y: round(center.y), text: text.slice(0, 4000), stroke: style.stroke, size: style.size });
    selection = new Set([el.id]);
    setTool('select', true);
    render();
    end();
  });

  /* ---------- Export ---------- */
  function exportBounds() {
    const content = union(doc.elements.map(box));
    if (content) return { x: content.x - 48, y: content.y - 48, w: content.w + 96, h: content.h + 96 };
    const area = usable();
    return { x: (area.x - view.x) / view.k, y: (area.y - view.y) / view.k, w: area.w / view.k, h: area.h / view.k };
  }
  function serialize(bounds, size = bounds) {
    const body = [...world.children].map(node => {
      const copy = node.cloneNode(true);
      copy.removeAttribute('visibility');
      copy.querySelectorAll('.board-hit, .board-hit-area, [data-action]').forEach(part => part.remove());
      return copy.outerHTML;
    }).join('');
    return `<svg xmlns="${NS}" width="${Math.round(size.w)}" height="${Math.round(size.h)}" viewBox="${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}">
<defs>${defs.innerHTML}<pattern id="board-dots" x="${-GRID / 2}" y="${-GRID / 2}" width="${GRID}" height="${GRID}" patternUnits="userSpaceOnUse"><circle cx="${GRID / 2}" cy="${GRID / 2}" r="1.3" fill="rgba(255,255,255,0.26)"/></pattern></defs>
<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}" fill="${BOARD_BG}"/><rect x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}" fill="url(#board-dots)"/>${body}</svg>`;
  }
  async function rasterize(bounds, width, height, type = 'image/png', quality) {
    const image = new Image(), url = URL.createObjectURL(new Blob([serialize(bounds, { w: width, h: height })], { type: 'image/svg+xml' }));
    image.src = url;
    await image.decode();
    const canvas = Object.assign(document.createElement('canvas'), { width, height });
    canvas.getContext('2d').drawImage(image, 0, 0, width, height);
    URL.revokeObjectURL(url);
    return new Promise(resolve => canvas.toBlob(resolve, type, quality));
  }
  async function exportPng() {
    const bounds = exportBounds(), scale = Math.min(2, Math.sqrt(16e6 / (bounds.w * bounds.h)));
    const blob = await rasterize(bounds, Math.round(bounds.w * scale), Math.round(bounds.h * scale));
    if (blob) download(blob, `${fileName(title)}.png`);
  }

  /* ---------- Public API ---------- */
  return {
    load(data, name) {
      doc = { elements: clone(data?.elements ?? []), assets: { ...(data?.assets ?? {}) } };
      history = [];
      future = [];
      pending = null;
      selection.clear();
      title = name;
      active = true;
      closeLinkDialog();
      editor.hidden = true;
      editing = null;
      setTool('select');
      render();
      if (data?.view) {
        view = { ...data.view };
        applyView();
      } else fit();
      document.fonts?.ready.then(() => active && render());
    },
    rename(name) {
      title = name;
    },
    // Unreferenced pictures are dropped when saving so deleted images don't linger.
    snapshot() {
      const used = new Set(doc.elements.filter(el => el.type === 'image').map(el => el.asset));
      return { elements: clone(doc.elements), assets: Object.fromEntries(Object.entries(doc.assets).filter(([key]) => used.has(key))), view: { ...view } };
    },
    async thumbnail() {
      if (!doc.elements.length) return null;
      const content = exportBounds(), ratio = 4 / 3;
      const w = Math.max(content.w, content.h * ratio), h = w / ratio;
      const blob = await rasterize({ x: content.x + content.w / 2 - w / 2, y: content.y + content.h / 2 - h / 2, w, h }, 400, 300, 'image/jpeg', 0.82).catch(() => null);
      return blob ? readFile(blob) : null;
    },
    unload() {
      if (editing) commitText();
      active = false;
      closeLinkDialog();
    },
    togglePanel() {
      panel.classList.toggle('is-hidden');
      return !panel.classList.contains('is-hidden');
    },
    // Esc peels back one layer: text editing, link dialog, selection, then the tool.
    escape() {
      if (editing) {
        commitText();
        return true;
      }
      if (!linkDialog.hidden) {
        closeLinkDialog();
        return true;
      }
      if (selection.size) {
        selection.clear();
        renderOverlay();
        syncPanel();
        return true;
      }
      if (tool !== 'select') {
        setTool('select');
        return true;
      }
      return false;
    },
  };
}
