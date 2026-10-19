// Turns a voice or text dump into separate tasks, ideas and thoughts.
// Speech transcripts rarely have punctuation, so besides sentence breaks we also split on
// spoken cue phrases ("what if…", "I need to…", "I feel…").

const CUES = ['and also', 'oh and', 'also', 'and then', 'another thing', 'i need to', 'i have to', 'i should', 'i must', 'remind me to', 'remember to', "don't forget", 'dont forget', 'what if', 'maybe we could', 'maybe i could', 'how about', 'i feel', "i'm feeling", 'im feeling', 'feeling', 'i think', 'i wonder', 'i realized', 'i realised', "i'm grateful", 'im grateful', 'today was', 'note to self'];
const GLUE = /^(?:and\s+also|oh\s+and|also|and\s+then|then|plus|another\s+thing(?:\s+is)?|and|so|okay|ok)\b[\s,:]*/i;
const TASK_LEAD = /^(?:(?:i\s+(?:need|have|got)\s+to|i\s+(?:should|must|gotta)|i'?ll|remind\s+me\s+to|remember\s+to|don'?t\s+forget(?:\s+to|\s+about)?|need\s+to|have\s+to|todo|to-do|task)\b[\s:]*)/i;
const IDEA_LEAD = /^(?:idea\b|what\s+if\b|maybe\s+(?:we|i)\s+(?:could|should)\b|how\s+about\b|we\s+could\b|imagine\b|wouldn'?t\s+it\s+be\b|it\s+would\s+be\s+(?:cool|nice|great|fun|neat)\b)/i;
const THOUGHT_LEAD = /^(?:i\s+(?:feel|felt|think|thought|wonder|realized|realised|noticed|love|miss|wish|am|was)\b|i'?m\s|feeling\b|today\s+was\b|honestly\b|grateful\b|thankful\b|note\s+to\s+self\b)/i;
const VERBS = new Set('call email text message send buy pick finish review schedule book fix write prepare submit pay meet clean update check follow plan order renew cancel ship deploy test draft finalize read study water walk run go visit return print sign file organize reply post publish record design sketch set start grab get take bring make cook wash do prep practice attend join share upload back drop renew confirm ask invite tidy refill charge pack'.split(' '));
const WHEN = /\b(today|tonight|tomorrow|tmrw|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this (?:morning|afternoon|evening)|\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}:\d{2}|at \d{1,2}|noon|deadline|due)\b/i;
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_ALIASES = { sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6 };
const PARTS = { morning: '09:00', afternoon: '14:00', evening: '18:00', night: '20:00', tonight: '20:00' };
const NUMBERS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, half: 0.5 };
const TAGS = [
  ['Health', /\b(gym|run|running|workout|yoga|doctor|dentist|walk|meds|stretch|swim|sleep|therapy|physio)\b/i],
  ['Work', /\b(meeting|email|client|deploy|review|report|presentation|supplier|standup|stand-up|sprint|roadmap|release|demo|invoice|deck|team|pr|design|launch|ship|spec)\b/i],
  ['Learning', /\b(read|study|course|learn|practice|book club|lesson|chapter|pages)\b/i],
  ['Personal', /\b(groceries|mom|dad|birthday|laundry|clean|cook|dinner|lunch|buy|plants|rent|bills|gift|friend|family|haircut|car)\b/i],
];
const escapeCue = cue => cue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['’]?");
const CUE_SPLIT = new RegExp(`\\s+(?=(?:${CUES.map(escapeCue).join('|')})\\b)`, 'gi');

const words = text => text.trim().split(/\s+/).filter(Boolean).length;
// A cue right after one of these words is part of the same sentence ("what if Filo could remind me to…").
const DANGLING = /\b(?:could|would|can|will|should|might|to|that|which|who|it|and|or|but|if|when|so|me|you|we)$/i;
const tidy = text => text.replace(/\s+/g, ' ').replace(/\s+([,.!?])/g, '$1').replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '').trim();
const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);

export function split(input) {
  const pieces = input
    .split(/\n+|(?<=[.!?])\s+|;\s*|\s+[•–—-]\s+/)
    .flatMap(part => part.split(CUE_SPLIT).reduce((joined, piece) => {
      if (joined.length && DANGLING.test(joined[joined.length - 1])) joined[joined.length - 1] += ` ${piece}`;
      else joined.push(piece);
      return joined;
    }, []))
    .map(part => tidy(part.replace(GLUE, '')))
    .filter(Boolean);
  // Fragments of one or two words belong to the piece before them.
  return pieces.reduce((merged, piece) => {
    if (merged.length && words(piece) < 3 && !TASK_LEAD.test(piece)) merged[merged.length - 1] += ` ${piece}`;
    else merged.push(piece);
    return merged;
  }, []);
}

export function classify(text) {
  const lower = text.toLowerCase().trim();
  const first = lower.replace(/^(?:please|pls)\s+/, '').match(/^[a-z']+/)?.[0];
  const score = { task: 0, idea: 0, thought: 0 };
  if (TASK_LEAD.test(lower)) score.task += 3;
  if (VERBS.has(first)) score.task += 2.5;
  if (WHEN.test(lower)) score.task += 2;
  if (/\b(appointment|deadline|due|asap|reminder)\b/.test(lower)) score.task += 1.5;
  if (IDEA_LEAD.test(lower)) score.idea += 3.5;
  if (/\b(idea|concept|feature|prototype|app that|tool that|could build|new way|brainstorm|pitch|side project|invent|redesign)\b/.test(lower)) score.idea += 2;
  if (lower.endsWith('?')) score.idea += 1;
  if (THOUGHT_LEAD.test(lower)) score.thought += 3;
  if (/\b(feel|feeling|felt|grateful|thankful|anxious|stressed|tired|happy|proud|calm|excited|worried|overwhelmed|sad|frustrated|motivated|lucky|realized|noticed|wonder|honestly)\b/.test(lower)) score.thought += 1.5;
  const [best, value] = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  if (value > 0) return best;
  return VERBS.has(first) ? 'task' : 'thought';
}

const toMinutes = (hours, minutes = 0, meridiem = '') => {
  let h = Number(hours) % 24;
  const m = meridiem.toLowerCase().replace(/\./g, '');
  if (m === 'pm' && h < 12) h += 12;
  if (m === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(Number(minutes)).padStart(2, '0')}`;
};

// Reads "tomorrow at 3pm for 45 minutes" style phrases and returns what's left as the title.
export function parseWhen(text, today = new Date()) {
  let offset = null, time = null, duration = null, rest = ` ${text} `;
  const take = (regex, handler) => {
    rest = rest.replace(regex, (...match) => {
      handler(...match);
      return ' ';
    });
  };
  take(/\b(?:the\s+)?day\s+after\s+tomorrow\b/i, () => { offset = 2; });
  take(/\b(?:by\s+|on\s+)?(?:tomorrow|tmrw|tmr)\b(?:\s+(morning|afternoon|evening|night))?/i, (_, part) => {
    offset = 1;
    if (part) time = PARTS[part.toLowerCase()];
  });
  take(/\b(?:by\s+|on\s+)?(today|tonight)\b/i, (_, word) => {
    offset = 0;
    if (word.toLowerCase() === 'tonight') time = PARTS.tonight;
  });
  take(/\bthis\s+(morning|afternoon|evening)\b/i, (_, part) => {
    offset = 0;
    time = PARTS[part.toLowerCase()];
  });
  take(/\bnext\s+week\b/i, () => { offset = 7; });
  take(/\bin\s+(\d+|a|an|one|two|three|four|five)\s+(days?|weeks?)\b/i, (_, amount, unit) => {
    const count = NUMBERS[amount.toLowerCase()] ?? Number(amount);
    offset = unit.toLowerCase().startsWith('week') ? count * 7 : count;
  });
  take(/\b(?:(by|on|this|next)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues?|wed|thu(?:rs?)?|fri|sat|sun)\b(?:\s+(morning|afternoon|evening|night))?/i, (_, lead, day, part) => {
    const target = DAYS.indexOf(day.toLowerCase()) >= 0 ? DAYS.indexOf(day.toLowerCase()) : DAY_ALIASES[day.toLowerCase()];
    let diff = (target - today.getDay() + 7) % 7;
    if (lead?.toLowerCase() === 'next' && diff === 0) diff = 7;
    offset = diff;
    if (part) time = PARTS[part.toLowerCase()];
  });
  take(/\b(?:at|@|around|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?=\W|$)/i, (_, h, m, meridiem) => { time = toMinutes(h, m ?? 0, meridiem); });
  take(/\b(?:at|@|around|by)?\s*(\d{1,2}):(\d{2})\b/i, (_, h, m) => { time = toMinutes(h, m); });
  take(/\b(?:at\s+)?(noon|midday|midnight)\b/i, (_, word) => { time = word.toLowerCase() === 'midnight' ? '23:59' : '12:00'; });
  take(/\b(?:at|around)\s+(\d{1,2})\b(?!\s*(?:min|hour|hr|%|percent))/i, (_, h) => {
    const hour = Number(h);
    time = toMinutes(hour, 0, hour >= 1 && hour <= 7 ? 'pm' : hour === 12 ? 'pm' : 'am');
  });
  take(/\bin\s+the\s+(morning|afternoon|evening)\b/i, (_, part) => { time ??= PARTS[part.toLowerCase()]; });
  take(/\bfor\s+(\d+(?:\.\d+)?|an?|one|two|three|half\s+an?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b/i, (_, amount, unit) => {
    const count = amount.toLowerCase().startsWith('half') ? 0.5 : NUMBERS[amount.toLowerCase()] ?? Number(amount);
    duration = Math.round(unit.toLowerCase().startsWith('h') ? count * 60 : count);
  });
  rest = tidy(rest.replace(/\s+(?:at|on|by|for|around|in)\s*$/i, ''));
  return { offset, time, duration, rest };
}

export const tagOf = text => TAGS.find(([, pattern]) => pattern.test(text))?.[0] ?? 'General';

export function moodOf(text) {
  const lower = text.toLowerCase();
  if (/\b(grateful|thankful|appreciate|lucky)\b/.test(lower)) return 'grateful';
  if (/\b(anxious|stressed|tired|worried|overwhelmed|sad|frustrated|nervous|behind|exhausted|stuck)\b/.test(lower)) return 'uneasy';
  if (/\b(proud|happy|great|good|calm|excited|love|focused|energized|fun|relieved|motivated|glad)\b/.test(lower)) return 'upbeat';
  return 'reflective';
}

const clean = text => capitalize(tidy(text.replace(TASK_LEAD, '').replace(/^(?:idea|note to self)\b[\s:,-]*/i, '')));

// Full pipeline: split a capture into items and give each one a type and, for tasks, a slot in the day.
export function sort(input, { today = new Date(), defaultOffset = 0 } = {}) {
  return split(input).map(piece => {
    const type = classify(piece);
    if (type !== 'task') return { type, text: clean(piece), ...(type === 'thought' ? { mood: moodOf(piece) } : {}) };
    const when = parseWhen(piece, today);
    const title = clean(when.rest) || clean(piece);
    return { type, text: title, offset: when.offset ?? defaultOffset, time: when.time, duration: when.duration ?? 30, tag: tagOf(piece) };
  });
}
