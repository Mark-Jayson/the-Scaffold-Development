// Platform logos (24×24) for the studio and the habitat cards. GitHub uses its own mark; the others are
// simplified, recognisable versions of each brand's mark in its colours. Monochrome marks use currentColor
// so they read on both the light studio and the dark WorkStation cards.
import { PLATFORMS } from './platforms.js';

const page = (color, fold, inner) => `<path fill="${color}" d="M14.5 2h-8A1.5 1.5 0 0 0 5 3.5v17A1.5 1.5 0 0 0 6.5 22h11a1.5 1.5 0 0 0 1.5-1.5v-14z"/><path fill="${fold}" d="M14.5 2v4.5H19z"/>${inner}`;
const LOGOS = {
  github: '<path fill="currentColor" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>',
  figma: '<g transform="translate(12 12) scale(1.3) translate(-12 -9.25)"><path fill="#F24E1E" d="M9.8 2.5H12V7H9.8a2.25 2.25 0 0 1 0-4.5z"/><path fill="#FF7262" d="M12 2.5h2.2a2.25 2.25 0 0 1 0 4.5H12z"/><path fill="#A259FF" d="M9.8 7H12v4.5H9.8a2.25 2.25 0 0 1 0-4.5z"/><circle fill="#1ABCFE" cx="14.2" cy="9.25" r="2.25"/><path fill="#0ACF83" d="M9.8 11.5H12v2.25a2.25 2.25 0 1 1-2.2-2.25z"/></g>',
  gdocs: page('#4285F4', '#A1C2FA', '<path fill="#fff" d="M8 11h8v1.3H8zm0 2.7h8V15H8zm0 2.7h5.5v1.3H8z"/>'),
  gsheets: page('#0F9D58', '#87CEAC', '<path fill="#fff" d="M7.8 10.5h8.4v7.3H7.8zm1.3 1.3v1.7h2.3v-1.7zm3.6 0v1.7h2.2v-1.7zm-3.6 3v1.7h2.3v-1.7zm3.6 0v1.7h2.2v-1.7z"/>'),
  gslides: page('#F4B400', '#F8D97F', '<path fill="#fff" d="M7.8 10.8h8.4v6.4H7.8zm1.3 1.3v3.8h5.8v-3.8z"/>'),
  gdrive: '<path fill="#0066DA" d="m3.6 17.2 1.8 3a1.6 1.6 0 0 0 1.4.8h10.4a1.6 1.6 0 0 0 1.4-.8l1.8-3z"/><path fill="#00AC47" d="M8.4 3.6 2.1 14.4a1.6 1.6 0 0 0 0 1.6l1.5 2.6L10 7.6z"/><path fill="#FFBA00" d="M15.6 3.6H8.4l6.3 11h6.6L21.9 16a1.6 1.6 0 0 0 0-1.6z"/><path fill="#EA4335" d="M8.4 3.6 10 7.6l1.9-3.4"/>',
  notion: '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="3.6" fill="#fff" stroke="#111" stroke-width="1.6"/><path fill="#111" d="M8 7.3h2.2l4 6.2V7.3H16v9.4h-2.1l-4.1-6.3v6.3H8z"/>',
  miro: '<rect x="2.5" y="2.5" width="19" height="19" rx="4.5" fill="#FFD02F"/><path fill="#050038" d="M14.6 6.5h-2l1.6 2.9-3.4-2.9h-2l1.6 3.4-3.6-3.4h-2l2.3 4.4-2.3 6.6h2l3.6-7.1-1.6 7.1h2l3.4-7.6-1.6 7.6h2l3.6-9.8-3.4.1z"/>',
  canva: '<circle cx="12" cy="12" r="10" fill="#00C4CC"/><path fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" d="M15.4 9.2A4 4 0 1 0 15.6 15"/>',
  gitlab: '<path fill="#E24329" d="m12 21.4 3.7-11.3H8.3z"/><path fill="#FC6D26" d="M12 21.4 8.3 10.1H3.1zm0 0 3.7-11.3h5.2z"/><path fill="#FCA326" d="m3.1 10.1-1.1 3.4a.8.8 0 0 0 .3.9l9.7 7zm17.8 0 1.1 3.4a.8.8 0 0 1-.3.9l-9.7 7z"/><path fill="#E24329" d="M3.1 10.1h5.2L6.1 3.3a.4.4 0 0 0-.7 0zm17.8 0h-5.2l2.2-6.8a.4.4 0 0 1 .7 0z"/>',
  vercel: '<path fill="currentColor" d="M12 3.5 22 20.5H2z"/>',
  linear: '<circle cx="12" cy="12" r="9.5" fill="#5E6AD2"/><path fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" d="M5.6 13.6l4.8 4.8M4.9 10.6l8.5 8.5M6 7.5l10.5 10.5M8.6 5.6l9.8 9.8"/>',
  jira: '<path fill="#2684FF" d="M21.3 11.3 12.7 2.7 12 2 2.7 11.3a1 1 0 0 0 0 1.4l6 6L12 22l9.3-9.3a1 1 0 0 0 0-1.4zM12 15l-3-3 3-3 3 3z"/>',
  slack: '<rect x="3.5" y="8.4" width="9.5" height="2.8" rx="1.4" fill="#36C5F0"/><rect x="13" y="3.5" width="2.8" height="9.5" rx="1.4" fill="#2EB67D"/><rect x="11" y="12.8" width="9.5" height="2.8" rx="1.4" fill="#ECB22E"/><rect x="8.2" y="11" width="2.8" height="9.5" rx="1.4" fill="#E01E5A"/>',
  claude: `<g stroke="#D97757" stroke-width="2.1" stroke-linecap="round">${Array.from({ length: 12 }, (_, index) => {
    const angle = (index * Math.PI) / 6, outer = index % 2 ? 7.2 : 9.4;
    return `<line x1="${(12 + Math.cos(angle) * 2.4).toFixed(2)}" y1="${(12 + Math.sin(angle) * 2.4).toFixed(2)}" x2="${(12 + Math.cos(angle) * outer).toFixed(2)}" y2="${(12 + Math.sin(angle) * outer).toFixed(2)}"/>`;
  }).join('')}</g>`,
  youtube: '<rect x="1.8" y="5.2" width="20.4" height="13.6" rx="4" fill="#FF0000"/><path fill="#fff" d="M10 8.9v6.2l5.4-3.1z"/>',
  loom: `<g fill="#625DF5">${Array.from({ length: 8 }, (_, index) => `<ellipse cx="12" cy="6.2" rx="1.9" ry="4" transform="rotate(${index * 45} 12 12)"/>`).join('')}</g><circle cx="12" cy="12" r="2.4" fill="#fff"/>`,
  arxiv: '<rect x="2.5" y="2.5" width="19" height="19" rx="4.5" fill="#B31B1B"/><path fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" d="M7.5 7.5l9 9M16.5 7.5 13 11m-2 2-3.5 3.5"/>',
  producthunt: '<circle cx="12" cy="12" r="10" fill="#DA552F"/><path fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" d="M10 17V7.6h3.2a2.8 2.8 0 0 1 0 5.6H10"/>',
  local: '<rect x="2.8" y="4" width="18.4" height="12.4" rx="2.2" fill="none" stroke="#1E9E68" stroke-width="1.8"/><path fill="none" stroke="#1E9E68" stroke-width="1.8" stroke-linecap="round" d="M8.5 20h7M12 16.4V20M8.2 8.7 6.6 10.2l1.6 1.6M15.8 8.7l1.6 1.5-1.6 1.6"/>',
  web: '<g fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/></g>',
};

/** A platform logo; web pages saved from Chrome show their own favicon when we have it. */
export function logo(key, { size = 'md', favicon } = {}) {
  const name = PLATFORMS[key]?.name ?? 'Webpage';
  if (key === 'web' && favicon && /^https:\/\//.test(favicon)) {
    return `<span class="st-logo is-${size}" title="${name}"><img src="${favicon.replace(/"/g, '&quot;')}" alt="" onerror="this.replaceWith(document.createRange().createContextualFragment(this.dataset.fallback))" data-fallback='<svg viewBox="0 0 24 24" aria-hidden="true">${LOGOS.web}</svg>' /></span>`;
  }
  return `<span class="st-logo is-${size}" title="${name}"><svg viewBox="0 0 24 24" aria-hidden="true">${LOGOS[key] ?? LOGOS.web}</svg></span>`;
}

// Small line symbols for each kind of thing, used on the filter chips and tiles.
const KIND_PATHS = {
  doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h6M9.5 15.5h6"/>',
  design: '<path d="M12 20a8 8 0 1 1 8-8c0 2.2-1.8 2.5-3 2.5h-1.5a1.5 1.5 0 0 0-1 2.6A1.7 1.7 0 0 1 12 20z"/><circle cx="8" cy="11" r="1"/><circle cx="11.5" cy="7.5" r="1"/><circle cx="15.8" cy="9" r="1"/>',
  code: '<path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13"/>',
  app: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  web: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5S9.7 5.9 12 3.5z"/>',
  media: '<rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="m10.5 9.3 4.5 2.7-4.5 2.7z"/>',
  all: '<path d="M4 6h16M4 12h16M4 18h16"/>',
};
export const kindIcon = kind => `<svg viewBox="0 0 24 24" aria-hidden="true">${KIND_PATHS[kind] ?? KIND_PATHS.all}</svg>`;
