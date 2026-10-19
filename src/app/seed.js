// First-run content, laid out around whatever "today" is so the schedule always looks current.
import { moodOf } from './sorter.js';

const TASKS = [
  [-2, '09:30', 'Sprint planning', 60, 'Work'],
  [-2, '13:00', 'Dentist check-up', 45, 'Health'],
  [-2, '19:00', 'Call mom', 30, 'Personal'],
  [-1, '08:00', 'Yoga', 30, 'Health'],
  [-1, '10:00', 'Draft onboarding copy', 60, 'Work'],
  [-1, '15:30', 'Review the crafts sketch board flow', 45, 'Work'],
  [-1, '20:00', 'Read chapter 4 of Shape Up', 30, 'Learning'],
  [-1, null, 'Pay the electricity bill', 15, 'Personal', false],
  [0, '07:30', 'Morning run', 30, 'Health'],
  [0, '09:00', 'Review the sprint board', 30, 'Work'],
  [0, '10:30', 'Call Sam about the Q4 roadmap', 45, 'Work'],
  [0, '12:30', 'Lunch with Maya', 60, 'Personal'],
  [0, '14:00', 'Design review: crafts sketch board', 60, 'Work'],
  [0, '16:00', 'Write release notes for v0.9', 45, 'Work'],
  [0, '18:30', 'Groceries: oat milk, berries, coffee', 30, 'Personal'],
  [0, '21:00', 'Read 20 pages', 30, 'Learning'],
  [0, null, 'Water the plants', 15, 'Personal'],
  [1, '09:00', 'Team standup', 15, 'Work'],
  [1, '10:00', 'Prepare the demo deck', 90, 'Work'],
  [1, '13:00', 'Gym: leg day', 60, 'Health'],
  [1, '16:00', '1:1 with Jordan', 30, 'Work'],
  [1, '19:30', 'Dinner with Alex', 90, 'Personal'],
  [2, '08:30', 'Physio', 45, 'Health'],
  [2, '11:00', 'Ship the v0.9 release', 60, 'Work'],
  [2, '15:00', 'User interviews (3)', 90, 'Work'],
  [2, null, 'Book flights for November', 30, 'Personal'],
  [3, '09:30', 'Write retro notes', 30, 'Work'],
  [3, '14:00', 'Haircut', 45, 'Personal'],
  [3, '18:00', 'Pottery class', 90, 'Learning'],
  [4, '10:00', 'Investor update email', 45, 'Work'],
  [4, '17:00', 'Pick up dry cleaning', 15, 'Personal'],
  [5, '09:00', 'Long run', 60, 'Health'],
  [5, '11:00', 'Farmers market', 60, 'Personal'],
  [6, '15:00', 'Plan next week', 30, 'General'],
];
const IDEAS = [
  [3, 'What if Filo could suggest the best time for deep work based on my week?', true],
  [20, 'A focus garden that grows a little plant for every task I finish', true],
  [28, 'Voice notes that turn into calendar blocks automatically'],
  [50, 'Friday recap card to share with the team: wins, blockers, next week'],
  [74, 'Let crafts from the Maker Space be shared with a link'],
  [98, 'Colour-code tasks by energy level, not just by category'],
  [122, 'A tiny celebration when the whole day is cleared: confetti hard hats?'],
  [146, 'Idea compost: ideas older than a month resurface for a second look'],
];
const THOUGHTS = [
  [5, 'Felt really focused this morning. The early run helps.'],
  [22, "I think we're overcomplicating onboarding. Fewer steps, more delight."],
  [30, "Grateful for the team's patience during the launch crunch."],
  [52, 'Noticed I plan too many things on Mondays.'],
  [76, "A little anxious about Tuesday's demo, but the deck is in good shape."],
  [100, 'Today was calm. Slow days count too.'],
];

const pad = value => String(value).padStart(2, '0');
export const isoDate = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export function seed(now = new Date()) {
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const tasks = TASKS.map(([offset, time, title, duration, tag, doneOverride], index) => {
    const [h, m] = (time ?? '00:00').split(':').map(Number);
    // Past days are done, earlier today is done, the future is still open.
    const done = doneOverride ?? (offset < 0 || (offset === 0 && time !== null && h * 60 + m + duration <= minutesNow));
    return { id: `seed-task-${index}`, title, date: isoDate(addDays(now, offset)), time, duration, tag, done, createdAt: now.getTime() - 864e5 * 3 };
  });
  const ideas = IDEAS.map(([hoursAgo, text, starred = false], index) => ({ id: `seed-idea-${index}`, text, starred, createdAt: now.getTime() - hoursAgo * 36e5 }));
  const thoughts = THOUGHTS.map(([hoursAgo, text], index) => ({ id: `seed-thought-${index}`, text, mood: moodOf(text), createdAt: now.getTime() - hoursAgo * 36e5 }));
  return { tasks, ideas, thoughts, filo: { snacks: tasks.filter(task => task.done).length, fed: 0 } };
}
