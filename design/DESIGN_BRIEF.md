# Claude Design Brief: Haley's Math Practice App

> **How to use this file:** paste everything below the horizontal rule into Claude Design,
> and **attach `Design system and checklist screens.zip`** (the routine-app handoff) in the
> same message. The brief is written to be read alongside that package — without it,
> section 0 has nothing to inherit from.

---

You are designing the visual system and key screens for a math practice app for Haley, age
10 — the same child the **Haley Routine & Minecoin App** was designed for. It runs
full-screen in portrait on a phone. This is a household app for one child; there are no
intellectual-property constraints, and it should be unapologetically Minecraft-themed.

Your job is **visual design and screen-level UX only**. Do not implement application logic,
persistence, real timers, or state machines. Behavior is built later in Claude Code using
your design as the visual source of truth. Screens may use plausible sample data.

## 0. Inherit — do not reinvent

The attached zip is the complete design handoff for the routine app. **Adopt its visual
language wholesale.** Read `design_handoff_haley_routine_app/README.md`,
`MOTION_AND_SOUND.md`, and `Haley Routine App.dc.html` first.

Carry over unchanged:

- Every colour token, the 3px bevel language, no border-radius anywhere
- **Jersey 25** for headings, numbers, buttons, chips; **Nunito Sans** for sentence text
- Inventory-slot framing, texture strips used only as thin trim, `image-rendering: pixelated`
- All motion rules (transform/opacity only, `steps()` for pixel art, nothing over 500ms,
  screen changes instant, nothing animates on a failure-adjacent state)
- All sound rules (sine only, peak gain under .22, **nothing negative ever sounds**)
- The parent-area doctrine: iron and neutral, plain factual voice, cancel is never a filled
  button, no exclamation marks
- The hard tone rules: **no red anywhere**, no creepers/TNT/damage hearts, positive-only
  streaks
- The `assets/` PNGs — reuse the avatars, textures, and any of the 39 icons that fit

## 1. What the app does

Three decks of practice:

1. **Multiplication** — a x b, both 2 through 12. 121 cards. A problem slab and a 10-digit
   keypad.
2. **Division** — p divided by b, quotients and divisors 2 through 12. 121 cards. Same
   interaction.
3. **Factors** — one number (4 to 144, always a product from the 2-12 table); she enters
   *all* its factor pairs. 53 cards.

Two review modes:

- **Full review** — the whole deck, in rounds of 40 (12 for factors).
- **Smart review** — only the cards the spaced-repetition algorithm says are due.

**A round is not finished until every card in it has been answered correctly.** Missed cards
come back later in the same round.

Answer time is recorded silently and feeds the algorithm. There is also an **opt-in
speed-run mode** where the timer becomes visible and speed is the point — design both
states.

## 2. New visual vocabulary you need to invent

This is the actual design work. Six things do not exist in the routine app:

1. **The emerald.** Math earns green emeralds; routines earn gold Minecoins. Different
   material, same universe, so the two piles are never confused — only the gold one redeems
   for real Minecoins.
   **Conflict to resolve deliberately:** the routine app already uses green two ways —
   `#57a636` for "Haley acted" and `#7fe237` for the XP bar. A third green needs to be
   unmistakably a *gem*: cut facets, a distinct hue, and a shape language that reads at
   16px. Do not simply recolour the coin.

2. **Mastery tiers as tool materials** — Wood, then Stone, Iron, Gold, Diamond. Every fact
   sits in one. Design the tier badge at chip size and at card size, and the promotion
   moment. Diamond means mastered.

3. **The problem slab** — the card face showing 7 x 8, or 96 divided by 8. This is the
   single most looked-at element in the app. Huge Jersey 25, readable at arm's length.
   Design its neutral, correct, and wrong states.

4. **The 10-digit keypad** — bevelled, in the routine app's button language. Digits 0-9, a
   clear/backspace, and a submit. Keys at least 70px tall (the routine app's PIN pad is the
   reference). Design the pressed state.

5. **Factor pair rows** — two entry boxes with a fixed x between them. She types both
   numbers and never the x. **Pairs are unordered:** entering 36 then 1 is the same answer
   as 1 then 36, and each pair is accepted once. Solved rows fill in and lock; the next
   empty row takes focus.
   **The hard constraint:** card length varies from 2 rows (the number 4) to 8 rows (the
   number 144). Both must fit on one portrait screen with the keypad visible — no scrolling
   to reach the keypad.

6. **The 12x12 fact grid** — a parent-area heat map of all 121 facts coloured by mastery
   tier. Dense, scannable, and it must survive being 12 columns wide on a phone.

## 3. Adapted colour doctrine

The routine app's rule was *green means Haley acted, gold means coins are moving*. Here:

| Colour | Means |
|---|---|
| Grass green `#57a636` | Correct — she got it right |
| Emerald (new gem green) | Currency |
| Coin gold `#f8c53a` | Streaks, and the Gold mastery tier |
| Diamond cyan (new) | The Diamond tier only — the rarest thing on screen |
| Calm slate `#6d89a3` | **Wrong / try again.** The routine app's send-back colour. |
| Iron / stone | The parent zone, entirely |

**A wrong answer is slate, silent, and still.** No red, no buzzer, no shake, no frown. This
is the most important rule in the brief. A ten-year-old who feels judged by a flashcard
stops using it.

## 4. Screens to design

### Section 1 — Foundations

- `1a` **Design system** — the new vocabulary from section 2 in every state, alongside the
  inherited tokens, so the two systems can be seen agreeing

### Section 2 — Child flow

- `2a` **Home** — clock, emerald balance, avatar, streak chip, today's practice surfaced
  with a clear next action
- `2b` **Home, nothing due** — the empty state
- `2c` **Mode and deck select** — full review vs smart review, then which of the three
  decks; each showing how many cards are due
- `2d` **Multiplication card** — neutral, awaiting input
- `2e` **Correct** — star burst, the celebratory beat
- `2f` **Wrong** — slate, still, showing the correct answer and moving on
- `2g` **Division card**
- `2h` **Speed-run variant** — the same card with the visible timer, so the difference from
  `2d` is legible
- `2i` **Factors card, empty** — use 36 (5 pairs)
- `2j` **Factors card, partly filled** — some rows locked, one active
- `2k` **Factors card, worst case** — 144 at 8 pairs, proving the layout holds
- `2l` **Round cleared** — the breather between rounds of 40; progress, emeralds earned, and
  a clear continue
- `2m` **Session complete** — emerald award, streak advanced, any tier promotions
- `2n` **Mastery / ME tab** — her progress across the three decks in tier language

### Section 3 — Parent area

- `3a` **Parent PIN** — inherit the routine app's iron-door pad exactly
- `3b` **Fact grid** — the 12x12 heat map, plus per-deck summary
- `3c` **Parent settings** — deck toggles, round size, fluency threshold, speed-run
  permission, sound switches, excuse a day, emerald adjust, reset a deck

### Section 4 — Motion and sound

- `4a` **Motion** — the correct-answer burst, the wrong-answer stillness, tier promotion,
  emerald award, keypad press
- `4b` **Sound** — a cue table in the routine app's format,
  `note(offset, freqHz, dur, peakGain)`, sine only, and an explicit list of what stays
  silent

## 5. Motion notes

Follow the inherited rules. Specifically:

- **Correct** — the slab presses in `steps(3)`; a green overlay fades in; stars pop and
  rise. Under 400ms total. She will see this several hundred times a week: make it feel good
  the first time and unobtrusive the two-hundredth.
- **Wrong** — nothing moves. The slab goes slate, the answer appears, and it passes.
  Stillness is the design.
- **Tier promotion** — the advancement toast, and the tier badge upgrading its material.
- **Emerald award** — model on the routine app's coin arc: emeralds fly *into* the balance
  so they read as becoming the number.
- **`prefers-reduced-motion`** — keep the fades, drop the transforms and the emerald arc.

## 6. Sound notes

Sine only, peak gain under .22, extending the routine app's cue vocabulary.

- **Correct** — one short blip, climbing a pentatonic run through a round the way the
  routine app's checklist does, so a round *sounds* like it is finishing
- **Round cleared** — a short resolving figure
- **Emerald award** — an arpeggio resolving on the octave, matching the coin award's shape
- **Tier promotion** — a rising third, milestone-only
- **Silent, always:** a wrong answer, a slow answer, a broken streak, every screen change,
  and the entire parent area

## 7. Deliverable

A cohesive design system and the screens above, ready to hand to Claude Code. Prioritize, in
order: (1) a distractible ten-year-old, (2) very fast everyday use — she will open this
daily and it must never feel like a chore, (3) positive reinforcement with no punitive
states, (4) minimal cognitive load, (5) a parent who wants to see weak facts in five
seconds.
