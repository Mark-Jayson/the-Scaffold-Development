// First-run content for Scaffold Focus, placed around "today" so it always looks current.
import { moodOf } from '../app/sorter.js';
import { breakDown, energyOf } from './breakdown.js';

const pad = value => String(value).padStart(2, '0');
export const isoDate = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

// [day offset, time, title, minutes, tag, extras]
const TASKS = [
  [-1, '10:00', 'Draft onboarding copy', 60, 'Work', { done: true }],
  [-1, '15:30', 'Review the crafts sketch board flow', 45, 'Work', { done: true }],
  [-1, null, 'Pay the electricity bill', 15, 'Personal'],
  [-1, null, 'Reply to Jordan about the demo', 15, 'Work'],
  [0, '08:00', 'Morning walk', 20, 'Health'],
  [0, '09:30', 'Write release notes for v0.9', 45, 'Work', { top: true, steps: true }],
  [0, '11:00', 'Call Sam about the Q4 roadmap', 30, 'Work', { top: true }],
  [0, '12:30', 'Lunch with Maya', 60, 'Personal'],
  [0, '14:00', 'Prepare the demo deck', 60, 'Work', { top: true, steps: true }],
  [0, '16:30', 'Groceries: oat milk, berries, coffee', 30, 'Personal'],
  [0, '20:00', 'Read 10 pages', 20, 'Learning'],
  [0, null, 'Water the plants', 10, 'Personal'],
  [1, '09:00', 'Team standup', 15, 'Work'],
  [1, '13:00', 'Gym: easy session', 45, 'Health'],
  [1, '16:00', '1:1 with Jordan', 30, 'Work'],
  [2, '11:00', 'Ship the v0.9 release', 60, 'Work'],
  [2, null, 'Book flights for November', 20, 'Personal'],
  [null, null, 'Sort the photo backlog', 30, 'Personal'],
  [null, null, 'Learn the basics of Blender', 45, 'Learning'],
];
const IDEAS = [
  [3, 'What if Filo could suggest the best time for deep work based on my week?', true],
  [20, 'A focus garden that grows a little plant for every task I finish', true],
  [28, 'Voice notes that turn into calendar blocks automatically'],
  [50, 'Friday recap card to share with the team: wins, blockers, next week'],
  [98, 'Colour-code tasks by energy level, not just by category'],
];
const THOUGHTS = [
  [4, 'Felt really focused this morning. The walk helps.'],
  [22, "I think we're overcomplicating onboarding. Fewer steps, more delight."],
  [30, "Grateful for the team's patience during the launch crunch."],
  [52, 'Noticed I plan too many things on Mondays.'],
  [76, "A little anxious about the demo, but the deck is getting there."],
];

export function seed(now = new Date()) {
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const tasks = TASKS.map(([offset, time, title, duration, tag, extras = {}], index) => {
    const [h, m] = (time ?? '00:00').split(':').map(Number);
    const passed = offset === 0 && time !== null && h * 60 + m + duration <= minutesNow;
    return {
      id: `seed-${index}`,
      title,
      date: offset === null ? null : isoDate(addDays(now, offset)),
      time,
      duration,
      tag,
      energy: energyOf(title),
      top: Boolean(extras.top),
      steps: extras.steps ? breakDown(title) : [],
      done: extras.done ?? passed,
      doneAt: extras.done || passed ? now.getTime() - (offset === -1 ? 864e5 : 36e5) : null,
      createdAt: now.getTime() - 864e5 * 2,
    };
  });
  return {
    tasks,
    ideas: IDEAS.map(([hoursAgo, text, starred = false], index) => ({ id: `idea-${index}`, text, starred, createdAt: now.getTime() - hoursAgo * 36e5 })),
    thoughts: THOUGHTS.map(([hoursAgo, text], index) => ({ id: `thought-${index}`, text, mood: moodOf(text), createdAt: now.getTime() - hoursAgo * 36e5 })),
    showedUp: [isoDate(addDays(now, -6)), isoDate(addDays(now, -5)), isoDate(addDays(now, -3)), isoDate(addDays(now, -1))],
    sparks: 24,
    settings: { motion: true, sound: true, focusMinutes: 15, dayStart: '07:00', dayEnd: '22:00', textSize: 'normal' },
    energy: null,
    session: null,
  };
}
