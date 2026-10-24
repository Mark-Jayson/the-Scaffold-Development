// Sample week for the Life Planner, placed around "today" so the demo always looks current.
import { classify } from './modes.js';

const pad = value => String(value).padStart(2, '0');
export const dayKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const shiftDay = (key, days) => {
  const [year, month, day] = key.split('-').map(Number);
  return dayKey(new Date(year, month - 1, day + days));
};

export const ASPECTS = [
  { id: 'work', name: 'Work', note: 'Scaffold', color: '#6f9bff' },
  { id: 'project', name: 'Side project', note: 'Podcast', color: '#b892ff' },
  { id: 'learning', name: 'Learning', note: 'Courses & exams', color: '#ffc857' },
  { id: 'health', name: 'Health', note: 'Body & mind', color: '#4fd1a5' },
  { id: 'people', name: 'Relationships', note: 'Friends & family', color: '#ff8fb1' },
  { id: 'home', name: 'Home', note: 'Errands & life admin', color: '#8fd3ff' },
];

// [day offset, aspect, start "HH:MM" (hours past 24 run into the night), minutes, title, done]
const TASKS = [
  [-2, 'learning', '10:00', 90, 'Figma auto-layout course', true],
  [-2, 'people', '18:30', 150, 'Board games night with friends', true],
  [-1, 'work', '09:00', 120, 'Write onboarding report', true],
  [-1, 'project', '15:00', 60, 'Pitch practice with mentor', true],
  [-1, 'home', '18:00', 30, 'Pay electricity bill', true],
  [0, 'work', '09:00', 90, 'Finalize the demo deck'],
  [0, 'work', '10:45', 30, 'Inbox and Slack catch-up'],
  [0, 'project', '11:30', 60, 'Brainstorm podcast episode ideas'],
  [0, 'people', '12:45', 60, 'Lunch with Maya'],
  [0, 'work', '14:30', 45, 'Investor demo presentation'],
  [0, 'work', '15:30', 75, 'Fix bugs found in the demo'],
  [0, 'health', '18:00', 45, 'Evening run'],
  [0, 'learning', '20:30', 60, 'Study for the AWS exam'],
  [1, 'work', '09:30', 15, 'Team stand-up'],
  [1, 'work', '10:00', 180, 'Build the checkout flow'],
  [1, 'project', '14:00', 90, 'Moodboard for the album cover'],
  [1, 'learning', '16:00', 60, 'AWS practice exam'],
  [1, 'work', '22:00', 240, 'Ship v1.0 release (all-nighter)'],
  [2, 'work', '09:30', 30, 'Client sync'],
  [2, 'health', '08:00', 60, 'Yoga class'],
  [2, 'home', '11:00', 45, 'Groceries and laundry'],
  [2, 'people', '19:00', 120, 'Movie night with friends'],
  [3, 'work', '09:00', 120, 'Design sprint: sketch onboarding concepts'],
  [3, 'project', '13:00', 60, 'Outline episode 4'],
  [3, 'work', '15:00', 60, 'Client review presentation'],
  [4, 'work', '10:00', 120, 'Refactor the planner timeline'],
  [4, 'health', '17:30', 60, 'Gym: strength session'],
  [4, 'people', '19:30', 90, 'Dinner with family'],
];

export function seed(now = new Date()) {
  const today = dayKey(now);
  const tasks = TASKS.map(([offset, aspect, time, duration, title, done = false], index) => {
    const [hours, minutes] = time.split(':').map(Number), start = hours * 60 + minutes;
    const label = classify({ title, aspect, start, duration });
    return { id: `seed-${index}`, title, aspect, day: shiftDay(today, offset), start, duration, mode: label.mode, allNighter: label.allNighter, source: 'ai', confidence: label.confidence, reason: label.reason, done };
  });
  return { version: 1, tasks, aspects: ASPECTS.map(aspect => ({ ...aspect })), prep: {}, energyPrep: true };
}
