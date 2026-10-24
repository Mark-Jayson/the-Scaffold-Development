// Filo: a round, cream-coloured puffball in a tiny yellow hard hat — Scaffold's little builder.
// Moods are CSS states on the root (`data-mood`); one-off reactions are short-lived classes.
let count = 0;

export function filoSvg(label = 'Filo') {
  const id = `filo-${(count += 1)}`;
  return `<svg class="filo" data-mood="idle" viewBox="0 0 140 140" role="img" aria-label="${label}">
  <defs>
    <radialGradient id="${id}-fur" cx="42%" cy="34%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".62" stop-color="#fff6ea"/><stop offset="1" stop-color="#f6dfc4"/></radialGradient>
    <linearGradient id="${id}-hat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde047"/><stop offset="1" stop-color="#f5b70b"/></linearGradient>
  </defs>
  <ellipse class="filo-shadow" cx="70" cy="128" rx="34" ry="6"/>
  <g class="filo-bob">
    <g class="filo-bulb"><circle cx="104" cy="22" r="13" fill="#fde68a" opacity=".35"/><path d="M104 12a8 8 0 0 0-4.8 14.4c.8.6 1.3 1.6 1.3 2.6h7c0-1 .5-2 1.3-2.6A8 8 0 0 0 104 12z" fill="#facc15"/><rect x="100.5" y="30" width="7" height="3.4" rx="1.4" fill="#a16207"/></g>
    <circle class="filo-tail" cx="110" cy="96" r="12" fill="url(#${id}-fur)" stroke="#efd5b6" stroke-width="1.5"/>
    <g class="filo-ear filo-ear-left"><path d="M34 52c-12-8-14-24-6-30 8-5 19 6 22 18z" fill="url(#${id}-fur)" stroke="#efd5b6" stroke-width="1.5"/><path d="M35 46c-6-5-8-13-4-16 4-2 10 4 12 10z" fill="#ffc6d3"/></g>
    <g class="filo-ear filo-ear-right"><path d="M106 52c12-8 14-24 6-30-8-5-19 6-22 18z" fill="url(#${id}-fur)" stroke="#efd5b6" stroke-width="1.5"/><path d="M105 46c6-5 8-13 4-16-4-2-10 4-12 10z" fill="#ffc6d3"/></g>
    <path class="filo-body" d="M70 36c30 0 44 22 44 48 0 26-18 40-44 40S26 110 26 84c0-26 14-48 44-48z" fill="url(#${id}-fur)" stroke="#efd5b6" stroke-width="1.5"/>
    <ellipse class="filo-arm" cx="30" cy="92" rx="7" ry="10" fill="#fbecd9" stroke="#efd5b6" stroke-width="1.2" transform="rotate(20 30 92)"/>
    <ellipse class="filo-arm filo-arm-right" cx="110" cy="92" rx="7" ry="10" fill="#fbecd9" stroke="#efd5b6" stroke-width="1.2" transform="rotate(-20 110 92)"/>
    <ellipse cx="54" cy="124" rx="10" ry="5" fill="#f3d9bb"/>
    <ellipse cx="86" cy="124" rx="10" ry="5" fill="#f3d9bb"/>
    <g class="filo-face">
      <g class="filo-eyes filo-eyes-open">
        <ellipse cx="54" cy="80" rx="7" ry="8.5" fill="#1e293b"/><ellipse cx="86" cy="80" rx="7" ry="8.5" fill="#1e293b"/>
        <circle cx="56.5" cy="76.5" r="2.6" fill="#fff"/><circle cx="88.5" cy="76.5" r="2.6" fill="#fff"/>
        <circle cx="52" cy="83.5" r="1.2" fill="#fff"/><circle cx="84" cy="83.5" r="1.2" fill="#fff"/>
      </g>
      <g class="filo-eyes filo-eyes-happy" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round"><path d="M47 82q7-9 14 0"/><path d="M79 82q7-9 14 0"/></g>
      <g class="filo-eyes filo-eyes-sleepy" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round"><path d="M47 80q7 5 14 0"/><path d="M79 80q7 5 14 0"/></g>
      <ellipse cx="44" cy="92" rx="7" ry="4" fill="#fda4af" opacity=".7"/><ellipse cx="96" cy="92" rx="7" ry="4" fill="#fda4af" opacity=".7"/>
      <path class="filo-mouth" d="M64 90q3 4 6 0q3 4 6 0" fill="none" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="filo-mouth-open" d="M64 90q6 9 12 0z" fill="#e11d48" stroke="#1e293b" stroke-width="2" stroke-linejoin="round"/>
    </g>
    <g class="filo-hat" transform="rotate(-9 70 44)">
      <path d="M38 46c0-20 14-30 32-30s32 10 32 30z" fill="url(#${id}-hat)" stroke="#d99a06" stroke-width="1.5"/>
      <rect x="64" y="16.5" width="12" height="29" rx="5" fill="#fef08a" opacity=".85"/>
      <rect x="30" y="43" width="80" height="9" rx="4.5" fill="#eab308" stroke="#d99a06" stroke-width="1.5"/>
      <path d="M46 34q4-10 14-13" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    </g>
    <g class="filo-waves" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M14 66q-6 10 0 20"/><path d="M6 60q-10 16 0 32"/><path d="M126 66q6 10 0 20"/><path d="M134 60q10 16 0 32"/></g>
    <g class="filo-zzz" fill="#fff" font-family="Montserrat, sans-serif" font-weight="700"><text x="104" y="34" font-size="14">z</text><text x="114" y="22" font-size="11">z</text></g>
  </g>
</svg>`;
}

const REACTIONS = ['is-bounce', 'is-wiggle', 'is-hop'];
export function react(root, kind = 'is-bounce') {
  for (const filo of root.querySelectorAll('.filo')) {
    REACTIONS.forEach(name => filo.classList.remove(name));
    void filo.getBoundingClientRect();
    filo.classList.add(kind);
    setTimeout(() => filo.classList.remove(kind), 900);
  }
}
export function setMood(root, mood) {
  root.querySelectorAll('.filo').forEach(filo => { filo.dataset.mood = mood; });
}
// Little hearts that float up from Filo when he's petted or fed.
export function hearts(host, symbol = '♥') {
  for (let index = 0; index < 5; index += 1) {
    const heart = document.createElement('span');
    heart.className = 'filo-heart';
    heart.textContent = symbol;
    heart.style.setProperty('--x', `${(Math.random() - 0.5) * 120}px`);
    heart.style.setProperty('--delay', `${index * 90}ms`);
    host.append(heart);
    setTimeout(() => heart.remove(), 1600);
  }
}
