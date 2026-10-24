# Moonbase Settlement Planner

A browser based isometric lunar settlement built with Three.js and Vite. A compact honeycomb of three habitats sits in the middle, with abstract hexagon outlines marking the empty cells. Three smaller, free-floating **Endeavors** (Tree, Idea Space and Life Planner) surround it. Every room is open-topped, furnished and populated so you can look straight in.

## Run locally

```sh
npm install
npm run dev
```

## Habitats

| Habitat | What's inside |
| --- | --- |
| Tree | Greenhouse walls around a central tree with translucent lime canopy, seating ring, koi pond, raised beds, hydroponic towers, butterflies and drifting pollen |
| Workplace | Open-plan desk pods, glass meeting room, kitchenette, phone booth, print station, lounge and lockers |
| Startup | Exposed brick, crowded hack tables full of laptops and monitors, whiteboard wall, rolling whiteboards, couch nap corner, ping-pong, arcade cabinet and the deal gong |
| Research | Raised-floor server hall with two rows of tall blinking racks behind a glass partition, plus a wet lab with fume hood, benches, microscopes, a liquid-handling robot and a quantum cryostat |
| Idea Space | Holo desk with a glowing square-grid top, hologram and holo board, plus craft and electronics benches, pegboards, 3D printers, CNC router, robot arm, drone and an exosuit gantry |
| Life Planner | Wall-sized calendar for the current month, live world clocks, kanban and roadmap boards, Gantt TV, planning table and a live launch countdown |

## Controls

- Drag to orbit and scroll to zoom. Walls facing the camera fold down automatically, so the rooms stay visible from any angle.
- Click a habitat, an Endeavor or its label to fly in, and press Esc or click empty space to return to the overview.
- Clicking the Idea Space also opens **Crafts**, a translucent home card listing your crafts with preview thumbnails. A few sample crafts are seeded on the first visit.

## Craft sketch board

Opening or creating a craft shows a #044794 dot-grid sketch board.

- **Tools (left):** Select `V`, Hand `H`, Pen `P`, Highlighter `M`, Eraser `E`, Line `L`, Arrow `A`, Rectangle `R`, Ellipse `O`, Diamond `D`, Text `T`, Sticky note `N`, Link `K` and Picture `I`.
- **Properties (right):** colour, fill, note colour, stroke width, solid or dashed lines, text size and opacity. These apply to the selection, or set the defaults for the next item. The panel also arranges items (front, back, duplicate, delete) and opens or edits links.
- **Board controls (right):** undo and redo, zoom, zoom to fit, snap to dots, PNG and SVG export, and clear.
- **Canvas:** scroll or Space-drag to pan, and pinch or ⌘-scroll to zoom. Double-click empty space to type and double-click text or notes to edit them. Corner handles resize items and Shift keeps proportions. Drop or paste pictures anywhere; pasting a URL makes a link card.
- **Shortcuts:** ⌘Z / ⇧⌘Z, ⌘D, ⌘A, ⌘C / ⌘V, Delete and the arrow keys. Esc steps back from editing, to selection, to the crafts list.
- **Storage:** the craft list sits in `localStorage`. Board contents and pictures are in IndexedDB, saved automatically per browser.

## Code layout

- `src/main.js` sets up the scene, layout, labels, interaction and animation loop.
- `src/room.js` builds the hex platform, floor, walls with doorways, wall fold-away and connecting bridges.
- `src/props.js` holds reusable people (posable rigs) and furniture.
- `src/textures.js` draws canvas textures for floors, screens, boards, signs and live clocks.
- `src/crafts.js` runs the Crafts home card, `src/board.js` the sketch board and `src/craft-store.js` the IndexedDB storage. The markup is in `index.html`.
- `src/kit.js` provides geometry and material helpers, plus `bake()`, which merges static meshes to keep draw calls low.
- `src/habitats/*.js` contains one builder per habitat.

Everything is procedural geometry and canvas textures, so no 3D assets need to be downloaded.

## Scaffold mobile app (`/app/`)

`npm run dev` also serves a phone-first web app at `http://localhost:5173/app/`. It is separate from the 3D moonbase and installs to the home screen (Share → Add to Home Screen on iPhone, Install app on Android).

- **Today:** a day-by-day schedule with a week strip, a timeline with a live "Now" line, progress, "next up", and a one-tap move of unfinished tasks to tomorrow. Tap a task to edit its day, time, duration and tag.
- **Capture button:** the raised centre button opens a sheet where you can talk (browser speech recognition) or type. Filo splits the dump into separate items, even unpunctuated speech, and labels each as a **task**, **idea** or **thought**. Tasks pick up "tomorrow at 3pm for 45 minutes", weekdays and a tag. Tap a label to change it before saving.
- **Ideas:** sparks with stars and "Make it a task". **Thoughts:** a journal grouped by day with an auto-detected mood.
- **Filo:** a cream puffball in a tiny yellow hard hat. He blinks and bobs, gets sleepy late at night, pops a lightbulb for ideas and perks his ears while you talk. He also cheers when you tick tasks off and earns a snack for each one. His tab shows his builder level, streaks, and buttons to pet and feed him.
- **Data:** the app starts with sample tasks, ideas and thoughts placed around today. Everything is saved in the browser's `localStorage`.

Code: `app/index.html`, `src/app/main.js` (views and interactions), `src/app/sorter.js` (splitting, classifying and date/time parsing), `src/app/filo.js`, `src/app/seed.js` and `src/app/app.css`. The manifest and icons are in `public/app/`, and `vite.config.js` builds both pages.

## Scaffold Focus (`/focus/`)

A second version of the mobile app, redesigned around research on ADHD, attention and executive function. The research, its sources, and how each principle maps to a feature are in [`docs/adhd-design-research.md`](docs/adhd-design-research.md). Open it at `http://localhost:5173/focus/`.

- **Now:** one task at a time, picked for the moment (a current or upcoming slot, your Top 3, your energy, or something carried over). It has a visual time ring, the first small step, a big **Start with just 2 minutes** button, and **Done** and **Not now**.
- **Focus mode:** shows only the current step, a Time-Timer-style shrinking wedge with a halfway cue, and Filo working alongside as a body double. **Park a thought** sends stray ideas to the Inbox without leaving. When time's up you choose: keep going, take a break, done, or come back later.
- **Plan:** a Top 3 cap, a timeline whose blocks are sized by duration with labelled free time, a "Now" line, and a "Maybe later" list with no dates.
- **Kind by default:** nothing is red or "overdue". Older tasks are **carried over** with one-tap Today, Tomorrow or Later. Every change can be undone. There are no streaks; it counts the "days you showed up" instead.
- **Make it yours:** settings for calm motion, sounds, larger text, focus length and when your day ends.

Code: `focus/index.html` and `src/focus/` (`main.js`, `breakdown.js` for the step suggestions, `seed.js`, `focus.css`). It reuses Filo and the capture sorter from `src/app/`.
