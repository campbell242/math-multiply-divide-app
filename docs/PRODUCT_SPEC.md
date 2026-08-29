# Product spec

The decisions behind the app, settled before design started. `design/DESIGN_BRIEF.md` is the
visual half of this; this file is the behavioural half, and it is what the implementation
should be built from.

The user is one ten-year-old. Every rule below bends toward her using this daily without
dreading it.

## Decisions

| Question | Decision |
|---|---|
| Factor entry | Two boxes with a fixed x between them; she types both numbers, never the x. **Pairs are unordered** — 1,36 and 36,1 are the same answer, each pair accepted once, in either order. |
| Full-review scope | One deck at a time, chunked into rounds of 40 for multiplication and division. |
| Timing | Silent by default; time recorded and fed to the algorithm. Opt-in speed-run mode shows a visible timer. |
| Currency | Emeralds. Distinct from the routine app's gold Minecoins; the two apps stay independent. |

## Decks

**Multiplication** — a x b, both 2 through 12. Ordered pairs kept distinct: 7x8 and 8x7 are
separate cards, because recall of the two genuinely differs at this age.
**121 cards**, rounds of 41 / 40 / 40.

**Division** — p / b = a, where p = a x b and both are 2 through 12.
**121 cards**, rounds of 41 / 40 / 40.

121 does not divide by 40, and the remainder is front-loaded so the longest round happens
while she is freshest. **The card count is never displayed to her** — the round screen reads
"Round 1 of 3" over a progress bar. She experiences rounds as thirds of a deck, so the
uneven split never surfaces, and no artboard needs to commit to a number.

**Factors** — the distinct products of the 2-12 table. **53 cards**, values 4 to 144, rounds
of 12.

Factors deck shape, computed from the deck definition:

| Pairs on the card | Cards | Example |
|---|---|---|
| 2 | 17 | 4 → 1x4, 2x2 |
| 3 | 12 | |
| 4 | 11 | 24 → 1x24, 2x12, 3x8, 4x6 |
| 5 | 4 | 36 → 1x36, 2x18, 3x12, 4x9, 6x6 |
| 6 | 7 | 72 → 1x72, 2x36, 3x24, 4x18, 6x12, 8x9 |
| 8 | 2 | 120 and 144 → 1x144, 2x72, 3x48, 4x36, 6x24, 8x18, 9x16, 12x12 |

192 pairs total, averaging 3.6 per card. Card length varies fourfold between the easiest and
hardest card, so the factors screen must hold 2 rows and 8 rows without a redesign. `1 x n`
counts as a pair.

## Mastery model

Leitner boxes themed as Minecraft tool materials, so progress is legible to a child.

| Tier | Interval until due again |
|---|---|
| Wood | same session |
| Stone | 1 day |
| Iron | 3 days |
| Gold | 7 days |
| Diamond | 16 days (mastered) |

Transitions, tuned to encourage rather than punish:

- **Correct and under the promotion threshold** → promote one tier.
- **Correct but slow** → hold. Knowing it slowly is not yet knowing it.
- **Wrong** → demote **one** tier, never all the way back to Wood.

### Two thresholds, two jobs

Design's artboards showed 3.0s where this spec said 5s. Both numbers are right; they answer
different questions, and conflating them is what caused the mismatch.

| Threshold | Default | Job |
|---|---|---|
| **Promotion** | 5.0s | Did she know it well enough to advance a tier? |
| **Lightning** | 3.0s | Was that *fast*? Earns the flourish, never affects tiering. |

Measured per pair rather than per card for factors. **Both are set independently in parent
settings**, so the bar for praise can be tuned without touching the bar for progress — the
two serve different purposes and a parent will want to move them at different times.

Lightning must be less than or equal to Promotion. If a parent sets it higher, clamp it to
Promotion rather than refusing the input: a Lightning bar above the promotion bar would mean
praising an answer too slow to advance, which is incoherent.

The promotion threshold has to be the forgiving one, because of how it interacts with
tiering: *correct but slow* holds the card at its current tier. Set promotion at 3s and a
child averaging 4s promotes nothing — every card stalls forever and the app quietly stops
feeling like progress. 5s advances her while 3s is still worth celebrating.

## Session model

Two modes:

1. **Full review** — every card in the chosen deck, in rounds.
2. **Smart review** — only the cards the algorithm says are due.

**The clearing rule, in both modes:** a round does not end until every card in it has been
answered correctly. Missed cards return to the back of the queue within the same round.

A missed-then-corrected card still counts as a miss for tier purposes. Clearing the round is
about finishing, not about erasing the record.

## Reinforcement

- **Emeralds** are *earned* per round cleared, with a bonus for a clean round, but they are
  *released* once, at session end. Design was right about this and the earlier spec was
  wrong. The round-cleared screen (2l) shows the round's earnings as a plain number so the
  effort is acknowledged immediately; the emerald arc into the balance plays only at 2m.
  Three award animations in one sitting would spend the moment the routine app deliberately
  keeps singular.
- **Daily streak** as a star chip, positive-only. A broken streak shows *nothing* — never a
  message about loss. Inherited from the routine app's tone rules.
- **Star burst and a rising sine cue** on each correct answer.
- **Tier promotion** fires an advancement toast.
- **Wrong answers are slate, silent, and still.** Never red, never a sound.

## Parent area

PIN-gated, in the routine app's iron/neutral language and plain factual voice.

- **Child's name** — a text field, set once. See below.
- Enable/disable decks; round size; **promotion threshold**; **Lightning threshold**;
  allow speed-run mode
- Sound toggles: one global, one separate for alarms, matching the routine app's pattern
- Excuse a day, to protect a streak
- Emerald balance adjust
- Reset a deck's mastery data
- **A 12x12 fact grid** coloured by mastery tier — the fastest way to see which facts are
  weak, and the single most useful screen in the parent area
- **Export and import a backup** — one JSON file. Progress lives in browser storage on one
  device, so a cleared cache or a new phone would otherwise erase months of it. See
  [DATA_MODEL.md](DATA_MODEL.md).

### The name is runtime config, never source

The child's name is stored on the device and read at render time. It is never hardcoded in a
template, and it never enters the repository.

```js
const profile = JSON.parse(localStorage.getItem("mt-profile") ?? "{}");
const name = profile.name ?? "friend";
```

Every greeting, toast, and session-complete line reads from that, with a neutral fallback so
the app is coherent before the field is filled in.

Three reasons, only one of which is about privacy:

- The repository is public. Runtime config keeps a real child's name out of a public git
  history and out of anything a search engine indexes.
- A second copy costs nothing. Another child means a different name typed into a different
  browser, not a fork.
- The spec stays readable as a spec rather than as a description of one particular child.

Design artboards may show a real name as sample data — the brief already tells Design to use
plausible sample data, and a mockup reading "friend" would teach the wrong thing about the
screen's tone.

## Storage

See [DATA_MODEL.md](DATA_MODEL.md) for how all of this persists: card ids, tier transitions in
code, the day-number scheme that keeps streaks and scheduling honest across midnight and DST,
and the failure modes worth handling on a real phone.
