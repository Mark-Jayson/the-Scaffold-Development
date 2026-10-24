// Day maths for the Life Planner: energy prep placement, workload, the day brief and balancing suggestions.
import { MODES, KIT, RULES, QUOTES, formatTime } from './modes.js';

export const DAY_START = 5 * 60;
export const DAY_END = 27 * 60;
// Energy points one person can spend well in a day; a performance or a late night eats into it fast.
export const CAPACITY = 8;
const SEARCH = 90;

const endOf = task => task.start + task.duration;
const capital = text => text.charAt(0).toUpperCase() + text.slice(1);
const overlaps = (start, minutes, item) => start < endOf(item) && start + minutes > item.start;
const pickQuote = (mode, seed) => {
  const list = QUOTES[mode] ?? QUOTES.grind;
  return list[[...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % list.length];
};

// The free start closest to `wanted` (within SEARCH minutes, in 5-minute steps) that keeps the item inside [from, to].
function settle(wanted, minutes, busy, from = DAY_START, to = DAY_END) {
  for (let offset = 0; offset <= SEARCH; offset += 5) {
    for (const start of offset ? [wanted - offset, wanted + offset] : [wanted]) {
      if (start >= Math.max(from, DAY_START) && start + minutes <= Math.min(to, DAY_END) && !busy.some(item => overlaps(start, minutes, item))) return start;
    }
  }
  return null;
}

/** Energy prep for one day: water, walks, scroll breaks, quotes and so on, placed around each task by its mode. */
export function prepFor(tasks, prep = {}) {
  const items = [], sorted = [...tasks].sort((a, b) => a.start - b.start), date = sorted[0]?.day;
  for (const task of sorted) {
    const rules = task.allNighter ? RULES.allNighter : RULES[task.mode] ?? [];
    // Prep steers clear of other tasks and of prep already placed, so two breaks never land on top of each other.
    const others = [...sorted.filter(other => other !== task), ...items.filter(item => !item.during).map(item => ({ start: item.start, duration: item.minutes }))];
    rules.forEach((rule, index) => {
      const kit = KIT[rule.kit], key = `${task.id}:${rule.kit}:${index}`;
      if (rule.every) {
        for (let at = task.start + rule.every - kit.minutes, round = 0; at + kit.minutes <= endOf(task) - 15; at += rule.every, round += 1) {
          items.push({ key: `${key}:${round}`, kit: rule.kit, start: at, minutes: kit.minutes, taskId: task.id, during: true });
        }
        return;
      }
      // Prep stays in the gap right next to its task: after the previous task ends, or before the next one starts.
      const before = rule.lead != null, wanted = before ? task.start - rule.lead : endOf(task) + rule.lag;
      const gapStart = Math.max(DAY_START, ...sorted.filter(other => endOf(other) <= task.start && other !== task).map(endOf));
      const gapEnd = Math.min(DAY_END, ...sorted.filter(other => other.start >= endOf(task) && other !== task).map(other => other.start));
      const start = before ? settle(wanted, kit.minutes, others, gapStart, task.start) : settle(wanted, kit.minutes, others, endOf(task), gapEnd);
      if (start == null) return;
      const item = { key, kit: rule.kit, start, minutes: kit.minutes, taskId: task.id, before };
      if (rule.kit === 'quote') item.quote = pickQuote(task.allNighter ? 'grind' : task.mode, task.id);
      items.push(item);
    });
  }
  if (sorted.length) {
    const first = sorted[0], start = settle(Math.max(7 * 60, first.start - 75), KIT.sunlight.minutes, sorted, DAY_START, first.start);
    if (start != null && !items.some(item => overlaps(start, KIT.sunlight.minutes, item))) items.push({ key: `${date}:sunlight`, kit: 'sunlight', start, minutes: KIT.sunlight.minutes });
  }
  // A heavy day also gets a real recovery break in the biggest afternoon gap.
  if (loadOf(tasks, items, prep).ratio >= 0.8) {
    const gap = gaps(sorted, 12 * 60, 19 * 60).filter(([from, to]) => to - from >= 40).sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
    if (gap) items.push({ key: `${date}:recover`, kit: 'recover', start: Math.round(((gap[0] + gap[1]) / 2 - 10) / 5) * 5, minutes: KIT.recover.minutes });
  }
  return items.map(item => ({ ...item, state: prep[item.key] ?? 'planned' })).sort((a, b) => a.start - b.start);
}

export function gaps(sorted, from, to) {
  const free = [];
  let cursor = from;
  for (const task of sorted) {
    if (task.start > cursor) free.push([cursor, Math.min(task.start, to)]);
    cursor = Math.max(cursor, endOf(task));
    if (cursor >= to) break;
  }
  if (cursor < to) free.push([cursor, to]);
  return free.filter(([start, end]) => end > start);
}

const effort = task => {
  let points = (task.duration / 60) * MODES[task.mode].cost;
  if (task.mode === 'performance') points += 1;
  if (task.allNighter) points *= 1.4;
  return points;
};

/** How much of the day's energy budget the plan uses, after what leisure and energy prep give back. */
export function loadOf(tasks, items = [], prep = {}) {
  const byMode = Object.fromEntries(Object.keys(MODES).map(mode => [mode, 0]));
  let spent = 0, rest = 0, hours = 0;
  for (const task of tasks) {
    const points = effort(task);
    if (points > 0) spent += points;
    else rest -= points;
    byMode[task.mode] += task.duration / 60;
    if (task.mode !== 'leisure') hours += task.duration / 60;
  }
  // Leisure and prep give energy back, but can never cancel more than half of what the day's work costs.
  const recharge = Math.min(1.5, items.filter(item => (prep[item.key] ?? item.state) !== 'skipped').reduce((sum, item) => sum + KIT[item.kit].recharge, 0));
  const points = spent - Math.min(rest + recharge, spent / 2);
  const ratio = points / CAPACITY;
  const level = ratio < 0.45 ? 'light' : ratio < 0.8 ? 'balanced' : ratio <= 1 ? 'heavy' : 'overloaded';
  return { points, ratio, level, byMode, hours, recharge };
}
export const LEVELS = { light: 'Light', balanced: 'Balanced', heavy: 'Heavy', overloaded: 'Overloaded' };

/** Effort per 15-minute slot, for the load strip across the top of the timeline. */
export function curveOf(tasks) {
  const slots = [];
  for (let at = DAY_START; at < DAY_END; at += 15) {
    const active = tasks.filter(task => overlaps(at, 15, task));
    const value = active.reduce((sum, task) => sum + Math.max(0, MODES[task.mode].cost) * (task.allNighter ? 1.4 : 1) + (task.mode === 'performance' ? 0.6 : 0), 0);
    const lead = active.sort((a, b) => MODES[b.mode].cost - MODES[a.mode].cost)[0];
    slots.push({ at, value, mode: lead?.mode });
  }
  return slots;
}

const DAY_TYPES = { grind: 'Grind day', ideation: 'Ideation day', performance: 'Performance day', leisure: 'Recharge day', routine: 'Easy day' };
const ADVICE = {
  light: 'Plenty of room left if something comes up.',
  balanced: 'A good, sustainable amount.',
  heavy: 'Keep the evening light and protect your sleep.',
  overloaded: 'That is more than you can do well, so see the suggestion below.',
};

/** A short, plain-language read of the day: its type, its peak and how it has been prepared. */
export function briefFor(tasks, items, load) {
  if (!tasks.length) return { type: 'Open day', text: 'Nothing planned yet. A clear day is a good day to recharge, or to plan something you have been putting off.' };
  const peak = [...tasks].sort((a, b) => effort(b) - effort(a))[0];
  const type = peak.allNighter ? 'Late-night push' : DAY_TYPES[peak.mode];
  const prepared = items.filter(item => item.taskId === peak.id && item.state !== 'skipped' && !item.during);
  const before = prepared.filter(item => item.before).map(item => KIT[item.kit].label.toLowerCase());
  const after = prepared.filter(item => item.before === false).map(item => KIT[item.kit].label.toLowerCase());
  const list = words => (words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : words[0]);
  const parts = [`Your peak is “${peak.title}” at ${formatTime(peak.start)}.`];
  if (before.length) parts.push(`Lined up before it: ${list(before)}.`);
  if (after.length) parts.push(`After: ${list(after)}.`);
  parts.push(`Load ${Math.round(load.ratio * 100)}%. ${ADVICE[load.level]}`);
  return { type, text: parts.join(' ') };
}

/** Concrete fixes for the selected day, each with an action the planner can apply in one tap. */
export function suggestionsFor(day, plan) {
  const tasks = plan.tasksOn(day), load = plan.loadOn(day), tips = [];
  const sorted = [...tasks].sort((a, b) => a.start - b.start);
  if (load.ratio > 1) {
    // One clear move: the smallest task that brings the day back within budget on its own, else the biggest one,
    // sent to the lightest coming day that can take it.
    const later = plan.days.filter(other => other > day && other >= plan.today);
    const options = sorted.filter(task => task.mode !== 'performance' && task.mode !== 'leisure' && !task.done).map(task => {
      const target = later.map(other => ({ day: other, ratio: plan.loadOn(other, task).ratio })).filter(entry => entry.ratio <= 0.85).sort((a, b) => a.ratio - b.ratio)[0];
      return target && { task, target, after: plan.loadOn(day, null, task).ratio };
    }).filter(Boolean);
    const pick = options.filter(option => option.after <= 1).sort((a, b) => effort(a.task) - effort(b.task))[0] ?? options.sort((a, b) => a.after - b.after)[0];
    if (pick) {
      const { task, target, after } = pick;
      tips.push({ id: `move:${task.id}`, tone: 'warn', text: `Move “${task.title}” to ${plan.label(target.day)}. ${capital(plan.label(day))} drops to ${Math.round(after * 100)}% and ${plan.label(target.day)} lands at ${Math.round(target.ratio * 100)}%.`, action: { type: 'move', taskId: task.id, day: target.day }, button: `Move to ${plan.label(target.day)}` });
    }
  }
  // Double-booked time: move the more flexible task to the nearest free slot that fits it.
  const fixed = task => task.mode === 'performance' || task.mode === 'leisure';
  const clashes = [];
  sorted.forEach((task, index) => sorted.slice(index + 1).forEach(other => other.start < endOf(task) && clashes.push([task, other])));
  for (const [first, second] of clashes.slice(0, 2)) {
    const task = fixed(second) && !fixed(first) ? first : second, other = task === first ? second : first;
    if (task.done) continue;
    const rest = sorted.filter(entry => entry !== task);
    const slot = gaps(rest, 7 * 60, 23 * 60).filter(([from, to]) => to - from >= task.duration).map(([from, to]) => Math.min(Math.max(task.start, from), to - task.duration)).sort((a, b) => Math.abs(a - task.start) - Math.abs(b - task.start))[0];
    if (slot == null) continue;
    tips.push({ id: `clash:${task.id}:${other.id}`, tone: 'warn', text: `“${task.title}” overlaps “${other.title}”. The nearest free slot that fits is ${formatTime(slot)}.`, action: { type: 'shift', taskId: task.id, minutes: slot - task.start }, button: `Move to ${formatTime(slot)}` });
  }
  for (let index = 1; index < sorted.length; index += 1) {
    const [previous, task] = [sorted[index - 1], sorted[index]];
    const gap = task.start - endOf(previous), heavy = mode => mode === 'grind' || mode === 'performance';
    if (heavy(previous.mode) && heavy(task.mode) && gap >= 0 && gap < 10 && !task.done) {
      tips.push({ id: `buffer:${task.id}`, tone: 'tip', text: `“${previous.title}” runs straight into “${task.title}”. A 15-minute buffer gives you room to reset.`, action: { type: 'shift', taskId: task.id, minutes: 15 - Math.max(0, gap) }, button: 'Add buffer' });
    }
  }
  if (load.ratio >= 0.8 && !tasks.some(task => task.mode === 'leisure')) {
    const gap = gaps(sorted, 17 * 60, 22 * 60).find(([from, to]) => to - from >= 30);
    if (gap) tips.push({ id: 'recharge', tone: 'tip', text: `Nothing on this ${LEVELS[load.level].toLowerCase()} day refills you. Add 30 minutes of something fun at ${formatTime(gap[0])}?`, action: { type: 'add', task: { title: 'Something fun, no screens', aspect: 'home', start: gap[0], duration: 30 } }, button: 'Add leisure' });
  }
  const late = tasks.find(task => task.allNighter);
  const next = plan.days[plan.days.indexOf(day) + 1];
  if (late && next) {
    const early = plan.tasksOn(next).filter(task => task.start < 11 * 60 && task.mode !== 'leisure').sort((a, b) => a.start - b.start)[0];
    if (early) tips.push({ id: `late:${late.id}`, tone: 'warn', text: `“${late.title}” runs late, and ${plan.label(next)} opens with “${early.title}” at ${formatTime(early.start)}. Push that to the afternoon?`, action: { type: 'shiftDay', taskId: early.id, day: next, minutes: Math.max(0, 13 * 60 - early.start) }, button: 'Push to 1 PM' });
  }
  return tips;
}
