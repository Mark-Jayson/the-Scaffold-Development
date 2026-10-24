// Mode labelling for the Life Planner. This front end stands in for a model with transparent keyword and
// timing cues, and always says why it picked a label so the user can overrule it.

export const MODES = {
  grind: { label: 'Grind', hint: 'Heads-down, high effort', color: '#ff9b6a', cost: 1.5, icon: 'bolt' },
  ideation: { label: 'Ideation', hint: 'Open, creative thinking', color: '#c6a8ff', cost: 0.9, icon: 'bulb' },
  performance: { label: 'Performance', hint: 'Presenting, pitching, being on show', color: '#ffd166', cost: 1.7, icon: 'mic' },
  leisure: { label: 'Leisure', hint: 'Rest, play and movement that recharge you', color: '#74e3ab', cost: -0.5, icon: 'leaf' },
  routine: { label: 'Routine', hint: 'Light admin and errands', color: '#9fb6e3', cost: 0.5, icon: 'list' },
};
export const MODE_ORDER = ['grind', 'ideation', 'performance', 'leisure', 'routine'];

const CUES = {
  performance: /\b(present(ation|ing)?|demo|pitch(ing)?|keynote|talk|speech|interview|webinar|recital|perform(ance)?|showcase|defen[cs]e|panel|client review|on stage)\b/gi,
  ideation: /\b(brainstorm(ing)?|ideat\w*|ideas?|sketch\w*|concepts?|moodboard|explore|exploration|vision|outline|storyboard|whiteboard|design sprint|imagine|riff)\b/gi,
  grind: /\b(deadline|finish|finali[sz]e|polish|prepare|deck|slides|ship|build|implement|code|coding|debug|fix|bugs?|refactor|study|exam|cram|report|thesis|draft|crunch|migrat\w*|deploy|release|taxes|analysis|spreadsheet|grind|all-?nighter|overnight|course)\b/gi,
  leisure: /\b(movie|film|games?|gaming|hike|beach|nap|novel|dinner|lunch|brunch|party|concert|date|friends|family|yoga|massage|spa|music|guitar|painting|chill|relax|picnic|park|swim|run|gym|walk|workout)\b/gi,
  routine: /\b(email|inbox|slack|errands?|groceries|laundry|bills?|pay|book|schedule|admin|clean|tidy|commute|stand-?up|sync|1:1|catch-?up|meeting)\b/gi,
};
const LATE = 21 * 60;
// A grind block that runs well past midnight (or says so) counts as an all-nighter.
export const runsLate = ({ title = '', start, duration }) => start + duration >= 25 * 60 || (start >= 22 * 60 && duration >= 180) || /all-?nighter|overnight/i.test(title);

export const formatTime = minutes => {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440, hours = Math.floor(total / 60), mins = total % 60;
  return `${hours % 12 || 12}${mins ? `:${String(mins).padStart(2, '0')}` : ''} ${hours < 12 ? 'AM' : 'PM'}`;
};
export const formatSpan = minutes => (minutes < 60 ? `${minutes} min` : `${+(minutes / 60).toFixed(1)} h`);

/** Picks a mode from the title, the lane and the timing, with a confidence and the cues it used. */
export function classify({ title = '', aspect, start = 9 * 60, duration = 60 }) {
  const score = { grind: 0, ideation: 0, performance: 0, leisure: 0, routine: 1 }, cues = {};
  for (const [mode, pattern] of Object.entries(CUES)) {
    for (const match of title.matchAll(pattern)) {
      score[mode] += 3;
      (cues[mode] ??= new Set()).add(`“${match[0].toLowerCase()}”`);
    }
  }
  const timing = [];
  if (duration >= 150) {
    score.grind += 1.5;
    timing.push(`${formatSpan(duration)} block`);
  }
  if (start >= LATE && duration >= 90) {
    score.grind += 2;
    timing.push(`starts ${formatTime(start)}`);
  }
  if (aspect === 'people' || aspect === 'health') score.leisure += 1;
  if (aspect === 'learning') score.grind += 0.5;
  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]), [mode, top] = ranked[0], second = ranked[1][1];
  const allNighter = mode === 'grind' && runsLate({ title, start, duration });
  if (allNighter) timing.push('runs past midnight');
  const confidence = Math.max(52, Math.min(97, Math.round(100 * (0.5 + (0.5 * (top - second)) / (top + 1)))));
  const spotted = [...(cues[mode] ?? [])].slice(0, 2);
  const reason = [spotted.length ? `Spotted ${spotted.join(' and ')}` : mode === 'routine' ? 'No strong cues, so it reads as light routine' : '', ...(mode === 'grind' ? timing : [])].filter(Boolean).join(' · ');
  return { mode, allNighter, confidence, reason };
}

/* Energy kit: the small things the planner drops around a task to help you arrive ready and recover after. */
export const KIT = {
  water: { label: 'Drink water', icon: 'water', minutes: 5, recharge: 0.1, why: 'Even mild dehydration dulls focus and mood.' },
  walk: { label: 'Walk outside', icon: 'walk', minutes: 15, recharge: 0.5, why: 'A short walk resets attention and lifts energy.' },
  ideaWalk: { label: 'Thinking walk', icon: 'walk', minutes: 15, recharge: 0.4, why: 'Walking before a brainstorm tends to loosen up the flow of ideas.' },
  scroll: { label: 'Scroll break', icon: 'phone', minutes: 10, recharge: 0.2, why: 'A timed, guilt-free reward. Set a timer so it stays a break.' },
  inspo: { label: 'Inspiration scroll', icon: 'phone', minutes: 10, recharge: 0.1, why: 'Fill your head with references right before you make things.' },
  quote: { label: 'Motivation', icon: 'quote', minutes: 2, recharge: 0.1, why: 'A line to carry in with you.' },
  breathe: { label: 'Box breathing', icon: 'breath', minutes: 4, recharge: 0.2, why: 'Breathe in 4, hold 4, out 4, hold 4. Slow breathing settles nerves.' },
  snack: { label: 'Light snack', icon: 'snack', minutes: 10, recharge: 0.2, why: 'Steady fuel without a heavy-meal slump.' },
  stretch: { label: 'Stretch + refill', icon: 'stretch', minutes: 10, recharge: 0.3, why: 'Breaking long sessions about once an hour keeps focus from fading.' },
  rehearse: { label: 'Rehearse out loud', icon: 'mic', minutes: 20, recharge: 0, why: 'Saying it out loud once beats rereading the slides five times.' },
  winddown: { label: 'Wind down, screens off', icon: 'moon', minutes: 20, recharge: 0.4, why: 'Protects the sleep you still get after a late push.' },
  nap: { label: 'Power nap', icon: 'moon', minutes: 20, recharge: 0.6, why: 'A short nap before a late session banks some alertness.' },
  focus: { label: 'Do not disturb + playlist', icon: 'bell', minutes: 3, recharge: 0, why: 'Remove the pings before you go deep.' },
  capture: { label: 'Capture ideas', icon: 'pen', minutes: 5, recharge: 0, why: 'Write the best three down before they evaporate.' },
  celebrate: { label: 'Celebrate the win', icon: 'spark', minutes: 5, recharge: 0.3, why: 'Close the loop: note one thing that went well.' },
  present: { label: 'Phone away, be here', icon: 'leaf', minutes: 2, recharge: 0, why: 'Leisure recharges more when you are not half-working.' },
  sunlight: { label: 'Water + daylight', icon: 'sun', minutes: 10, recharge: 0.3, why: 'Morning light and a glass of water help you wake up properly.' },
  recover: { label: 'Recovery walk', icon: 'walk', minutes: 20, recharge: 0.6, why: 'Heavy day: a real break here keeps the evening from crashing.' },
};

// Where each kit item lands: `lead` minutes before the task starts, `lag` minutes after it ends, or `every` N minutes during it.
export const RULES = {
  grind: [{ kit: 'water', lead: 12 }, { kit: 'focus', lead: 4 }, { kit: 'stretch', every: 60 }, { kit: 'walk', lag: 5 }, { kit: 'scroll', lag: 22 }],
  allNighter: [{ kit: 'nap', lead: 55 }, { kit: 'snack', lead: 25 }, { kit: 'water', lead: 10 }, { kit: 'quote', lead: 3 }, { kit: 'stretch', every: 60 }, { kit: 'winddown', lag: 5 }],
  ideation: [{ kit: 'ideaWalk', lead: 30 }, { kit: 'inspo', lead: 12 }, { kit: 'capture', lag: 2 }],
  performance: [{ kit: 'rehearse', lead: 60 }, { kit: 'snack', lead: 32 }, { kit: 'water', lead: 15 }, { kit: 'breathe', lead: 8 }, { kit: 'quote', lead: 3 }, { kit: 'walk', lag: 5 }, { kit: 'celebrate', lag: 22 }],
  leisure: [{ kit: 'present', lead: 3 }],
  routine: [],
};

export const QUOTES = {
  performance: [
    ['Well done is better than well said.', 'Benjamin Franklin'],
    ['Fortune favours the bold.', 'Latin proverb'],
    ['You have rehearsed this. Your voice knows the way.', 'Life Planner'],
  ],
  grind: [
    ['The best way out is always through.', 'Robert Frost'],
    ['Do what you can, with what you have, where you are.', 'Theodore Roosevelt'],
    ['Slow is smooth, and smooth is fast.', 'Old saying'],
  ],
  ideation: [['Imagination is more important than knowledge.', 'Albert Einstein']],
  leisure: [['Rest is not idleness.', 'John Lubbock']],
};

const PATHS = {
  bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19 13 11"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  water: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="m10 21 2.5-6.5L15 17v4M8 12l3-4.5 3 2 3 1.5M12.5 14.5 11 7.5"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  quote: '<path d="M10 7H6v5h4v-5zm0 5c0 3-1.5 4.5-4 5M18 7h-4v5h4V7zm0 5c0 3-1.5 4.5-4 5"/>',
  breath: '<path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h8"/>',
  snack: '<path d="M12 7c-4-3-8 0-7 5s4 9 7 7c3 2 6-2 7-7s-3-8-7-5zM12 7c0-2 1-3.5 3-4"/>',
  stretch: '<circle cx="12" cy="4.5" r="1.8"/><path d="M4 8l8 2 8-2M12 10v5l-3 6M12 15l3 6"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4"/><path d="M4 4l16 16"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
  ai: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  next: '<path d="m9 5 7 7-7 7"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
  skip: '<path d="M5 12h11M12 7l5 5-5 5M19 6v12"/>',
};
export const icon = (name, label) => `<svg viewBox="0 0 24 24" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${PATHS[name] ?? ''}</svg>`;
