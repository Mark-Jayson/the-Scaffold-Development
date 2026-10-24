// Which platform a link belongs to, and what kind of thing it is. The Chrome extension carries a copy of
// this table (extension/platforms.js) so captures arrive already labelled; keep the two in step.

export const KINDS = {
  doc: { label: 'Docs', one: 'Doc' },
  design: { label: 'Design', one: 'Design' },
  code: { label: 'Code', one: 'Code' },
  app: { label: 'Apps & tools', one: 'App' },
  web: { label: 'Webpages', one: 'Webpage' },
  media: { label: 'Media', one: 'Media' },
};
export const KIND_ORDER = ['doc', 'design', 'code', 'app', 'web', 'media'];

// [key, name, monogram, colour, kind, test(host, path)]
const TABLE = [
  ['gdocs', 'Google Docs', 'Do', '#4c8bf5', 'doc', (host, path) => host === 'docs.google.com' && path.startsWith('/document')],
  ['gsheets', 'Google Sheets', 'Sh', '#22a565', 'doc', (host, path) => host === 'docs.google.com' && path.startsWith('/spreadsheets')],
  ['gslides', 'Google Slides', 'Sl', '#f4b400', 'doc', (host, path) => host === 'docs.google.com' && path.startsWith('/presentation')],
  ['gdrive', 'Google Drive', 'Dr', '#3b8ff3', 'doc', host => host === 'drive.google.com'],
  ['notion', 'Notion', 'N', '#e9e9e7', 'doc', host => /(^|\.)notion\.(so|site)$/.test(host)],
  ['figma', 'Figma', 'Fi', '#a259ff', 'design', host => /(^|\.)figma\.com$/.test(host)],
  ['miro', 'Miro', 'Mi', '#ffd02f', 'design', host => /(^|\.)miro\.com$/.test(host)],
  ['canva', 'Canva', 'Ca', '#21c4cf', 'design', host => /(^|\.)canva\.com$/.test(host)],
  ['github', 'GitHub', 'GH', '#c9d1d9', 'code', host => /(^|\.)github\.com$/.test(host)],
  ['gitlab', 'GitLab', 'GL', '#fc6d26', 'code', host => /(^|\.)gitlab\.com$/.test(host)],
  ['vercel', 'Vercel', 'Ve', '#f5f5f5', 'app', host => /(^|\.)vercel\.(com|app)$/.test(host)],
  ['linear', 'Linear', 'Li', '#7c83ff', 'app', host => /(^|\.)linear\.app$/.test(host)],
  ['jira', 'Jira', 'Ji', '#4c9aff', 'app', host => /\.atlassian\.net$/.test(host)],
  ['slack', 'Slack', 'Sk', '#e01e5a', 'app', host => /(^|\.)slack\.com$/.test(host)],
  ['claude', 'Claude', 'Cl', '#d97757', 'app', host => /(^|\.)claude\.ai$/.test(host)],
  ['local', 'Local app', 'Lo', '#74e3ab', 'app', host => host === 'localhost' || host === '127.0.0.1' || /^192\.168\./.test(host)],
  ['youtube', 'YouTube', 'YT', '#ff4e45', 'media', host => /(^|\.)(youtube\.com|youtu\.be)$/.test(host)],
  ['loom', 'Loom', 'Lm', '#8f7cff', 'media', host => /(^|\.)loom\.com$/.test(host)],
  ['arxiv', 'arXiv', 'ar', '#ff7b72', 'web', host => /(^|\.)arxiv\.org$/.test(host)],
  ['producthunt', 'Product Hunt', 'PH', '#ff6154', 'web', host => /(^|\.)producthunt\.com$/.test(host)],
];
export const PLATFORMS = Object.fromEntries(TABLE.map(([key, name, mono, color, kind]) => [key, { name, mono, color, kind }]));
PLATFORMS.web = { name: 'Webpage', mono: 'W', color: '#8fd3ff', kind: 'web' };

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
export function platformOf(url) {
  let host = '', path = '';
  try {
    const parsed = new URL(url);
    host = parsed.hostname.replace(/^www\./, '');
    path = parsed.pathname;
  } catch {
    return 'web';
  }
  return TABLE.find(([, , , , , test]) => test(host, path))?.[0] ?? 'web';
}

// A small square symbol in the platform's colour; used on cards, in the dock and on the 3D badges.
export const symbol = (key, size = 'md') => {
  const platform = PLATFORMS[key] ?? PLATFORMS.web;
  return `<span class="st-symbol is-${size}" style="--platform:${platform.color}" title="${platform.name}" aria-hidden="true">${platform.mono}</span>`;
};

export function ago(time, now = Date.now()) {
  const minutes = Math.round((now - time) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}
