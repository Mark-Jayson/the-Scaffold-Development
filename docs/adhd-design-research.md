# Designing Scaffold Focus for ADHD: research brief

This brief collects what is known about designing for people with ADHD and turns it into the principles behind **Scaffold Focus** (`/focus/`), the redesigned mobile app.

## How strong is the evidence?

- **Strongest:** timing differences. A 55-study meta-analysis found people with ADHD have more trouble discriminating and estimating durations, especially very short ones ([meta-analysis](https://www.em-consulte.com/article/1527936/meta-analysis-altered-perceptual-timing-abilities-)). The adult evidence is thinner and mixed, and a 2023 review calls it "very scarce" ([adult review](https://pmc.ncbi.nlm.nih.gov/articles/PMC9962130/)).
- **Solid evidence:** a preference for smaller, sooner rewards. In a general-population study of about 1,000 children, inattention symptoms were linked to choosing smaller immediate rewards over larger delayed ones ([JAACAP 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC2788754/)).
- **Early but promising:** body doubling. In a small study (12 participants), people finished tasks faster and rated their focus higher with a human or AI body double than alone ([You Are Not Alone, 2025](https://arxiv.org/abs/2509.12153)).
- **Standards guidance:** the W3C COGA note is a supplement to WCAG, not a requirement. It gives 8 objectives with concrete patterns such as *Help users focus*, *Limit interruptions*, *Provide reminders*, *Avoid data loss*, *Let users go back* and *Support simplification* ([W3C COGA](https://www.w3.org/TR/coga-usable/)).
- **Practitioner and vendor advice:** single-task views, micro-steps, visual timers and shame-free copy are widely recommended, but there are no controlled trials of these features in apps. Sources include [Tiimo](https://www.tiimoapp.com/resource-hub/task-initiation-adhd) (a commercial planner), [UMN ADHD skills](https://effectiveu.umn.edu/academics/adhd-executive-functioning/adhd-skills-getting-started), [Design Monks](https://www.designmonks.co/blog/ui-ux-and-adhd) and a [critique of streaks](https://dev.to/nucleusos/adhd-support-app-no-streaks-why-gamification-hurts-more-than-it-helps-1ae0). Treat these as heuristics to test, not proven effects.
- **Research ethics:** a CHI 2022 review found most ADHD technology tries to suppress traits rather than support people, and rarely involves people with ADHD as co-designers ([Spiel et al., CHI 2022](https://dare.uva.nl/id/b5158a6b-ee52-48a7-b4be-772d430bad4a)). That is why Scaffold Focus is framed as support, not correction, and every aid is optional.

## Principles and how the app applies them

| # | Principle | Why | In Scaffold Focus |
| --- | --- | --- | --- |
| 1 | **One thing at a time** | COGA *Avoid too much content* and *Make short critical paths*; long lists overwhelm | The home screen is **Now**: one task, one primary button and a peek at what's next. The full day lives in **Plan**. |
| 2 | **Make time visible** | Timing differences (meta-analysis); external time cues | A shrinking visual timer, a "time left today" bar, timeline blocks sized by duration with labelled free time, and "next in 12 min" heads-ups before transitions |
| 3 | **Make starting tiny** | Starting is often the bottleneck (UMN, Tiimo) | A **Just 2 minutes** start, automatic **Break it down** steps, and focus mode showing only the current step |
| 4 | **Reward now, never shame** | Preference for immediate rewards; streaks trigger shame | Instant feedback on every step, a confetti burst and a happy Filo on finishing, and sparks. A **days you showed up** count instead of a streak. Nothing is ever red or "overdue"; past tasks are **carried over** with one-tap options. |
| 5 | **Don't rely on memory** | COGA objective 6, *Provide reminders*, *Avoid data loss* | Capture anywhere, auto-sorting, **Park a thought** without leaving focus, a "you were working on…" resume card, autosave, and Undo on every change |
| 6 | **Limit interruptions and choices** | COGA objective 5; fewer options are quicker to choose from | A **Top 3** cap with everything else in "Maybe later", no badges or red counters, a calm palette and one primary action per screen |
| 7 | **Body doubling** | Small-study evidence that a companion improves pace and focus | Filo works alongside you in focus mode ("Filo is building with you") |
| 8 | **Plan by energy, not just time** | Energy and interest vary through the day (UMN) | An energy check-in (Low / Okay / High) picks a task that fits |
| 9 | **Protect hyperfocus, but offer breaks** | Apps disagree, so let people choose | When the timer ends you choose **Keep going +10**, **Take a break** or **I'm done**. Nothing forces a stop. |
| 10 | **Personal and calm** | COGA objective 8, *Support simplification*; needs vary widely | Settings for reduced motion, sound, text size, default focus length and when the day ends. It's framed as a focus app for everyone, not labelled "ADHD". |
| 11 | **Plain, kind language** | COGA objective 3, *Use clear words* and *Keep text succinct* | Short verb labels and literal wording, e.g. "Not now", "Carry over", "Missed it? Move it" |

## Next steps worth doing

- Test with people who have ADHD, as co-designers and not only as testers.
- Measure **time-to-first-action**, how often people overrun their time, and whether they come back after a missed day, not just engagement.
- Check whether the end-of-timer choices help people switch tasks or mostly extend hyperfocus.
