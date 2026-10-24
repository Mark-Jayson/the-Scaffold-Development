// Sample studios for the three built habitats. Times are relative to "now" so the demo always looks live.
// Links to real public pages work; the doc, design and dashboard links are placeholders.
import { platformOf, PLATFORMS } from './platforms.js';

const H = 36e5;
// [title, url, hours ago saved, extras]
const STUDIOS = {
  research: {
    title: 'Focus & sleep study',
    goal: 'Publish the pilot results by December',
    items: [
      ['Study protocol v4', 'https://docs.google.com/document/d/sample-study-protocol', 3, { pinned: true, opened: 0.5, note: 'Ethics asked for the consent wording change' }],
      ['Participant tracker', 'https://docs.google.com/spreadsheets/d/sample-participants', 20, { pinned: true, opened: 2 }],
      ['Body doubling and focus (arXiv)', 'https://arxiv.org/abs/2509.12153', 48, { pinned: true, note: 'Cite in the background section' }],
      ['W3C cognitive accessibility guidance', 'https://www.w3.org/TR/coga-usable/', 70],
      ['Analysis notebook', 'https://github.com/example/sleep-study-analysis', 30, { opened: 6 }],
      ['Lab notes', 'https://www.notion.so/sample-lab-notes', 90],
      ['Sleep hygiene explainer', 'https://www.youtube.com/watch?v=sample', 1.2, { fresh: true, source: 'chrome' }],
    ],
    activity: [[0.5, 'Edited “Study protocol v4”'], [1.2, 'Saved “Sleep hygiene explainer” from Chrome'], [6, 'Pushed 2 commits to the analysis notebook'], [20, '18 of 30 participants enrolled']],
  },
  studios: {
    title: 'Northwind rebrand',
    goal: 'Client sign-off on the new identity by Friday',
    items: [
      ['Rebrand · homepage v3', 'https://www.figma.com/design/sample-homepage', 2, { pinned: true, opened: 0.2, note: 'Hero needs the darker navy' }],
      ['Client brief', 'https://www.notion.so/sample-client-brief', 120, { pinned: true }],
      ['Pitch deck', 'https://docs.google.com/presentation/d/sample-pitch', 5, { pinned: true, opened: 1 }],
      ['Moodboard', 'https://miro.com/app/board/sample-moodboard', 50],
      ['#northwind-rebrand', 'https://app.slack.com/client/sample/northwind', 0.4, { opened: 0.4 }],
      ['Walkthrough for the client', 'https://www.loom.com/share/sample-walkthrough', 26],
      ['Brand fonts shortlist', 'https://fonts.google.com/?query=Montserrat', 0.8, { fresh: true, source: 'chrome' }],
      ['Competitor teardown', 'https://www.canva.com/design/sample-teardown', 1.5, { fresh: true, source: 'chrome' }],
    ],
    activity: [[0.2, 'Opened “Rebrand · homepage v3” in Figma'], [0.4, '3 new messages in #northwind-rebrand'], [0.8, 'Saved “Brand fonts shortlist” from Chrome'], [5, 'Pinned “Pitch deck”']],
  },
  startup: {
    title: 'Scaffold launch',
    goal: 'Ship v1.0 and land the first 50 users',
    items: [
      ['the-Scaffold-Development', 'https://github.com/Mark-Jayson/the-Scaffold-Development', 1, { pinned: true, opened: 0.1, note: 'Life Planner just merged' }],
      ['Scaffold WorkStation (local)', 'http://localhost:5173/', 0.1, { pinned: true, opened: 0.1 }],
      ['v1.0 launch milestone', 'https://linear.app/sample/project/v1-launch', 4, { pinned: true }],
      ['Scaffold Focus app UI', 'https://www.figma.com/design/sample-focus-app', 30],
      ['Launch plan', 'https://www.notion.so/sample-launch-plan', 60],
      ['Production deploy', 'https://vercel.com/sample/scaffold', 12],
      ['Waitlist', 'https://docs.google.com/spreadsheets/d/sample-waitlist', 8, { note: '37 sign-ups so far' }],
      ['Product Hunt launch checklist', 'https://www.producthunt.com/launch', 0.6, { fresh: true, source: 'chrome' }],
      ['Build with Claude', 'https://claude.ai/', 100],
    ],
    activity: [[0.1, 'Opened the local WorkStation'], [0.6, 'Saved “Product Hunt launch checklist” from Chrome'], [1, 'Merged “Add the Life Planner” on GitHub'], [12, 'Deployed to production']],
  },
};

let counter = 0;
export const makeItem = ({ title, url, savedAt = Date.now(), ...rest }) => {
  const platform = platformOf(url);
  return { id: `item-${Date.now().toString(36)}-${(counter += 1)}`, title, url, platform, kind: PLATFORMS[platform].kind, note: '', pinned: false, fresh: false, source: 'you', savedAt, openedAt: null, ...rest };
};

export function seed(now = Date.now()) {
  const endeavors = Object.fromEntries(Object.entries(STUDIOS).map(([id, studio]) => [id, {
    title: studio.title,
    goal: studio.goal,
    items: studio.items.map(([title, url, hours, extras = {}], index) => {
      const { opened, ...rest } = extras;
      return { ...makeItem({ title, url, savedAt: now - hours * H, source: 'sample', ...rest }), id: `${id}-${index}`, openedAt: opened == null ? null : now - opened * H };
    }),
    activity: studio.activity.map(([hours, text], index) => ({ id: `${id}-a${index}`, at: now - hours * H, text })),
  }]));
  return { version: 1, endeavors, delivered: [] };
}
