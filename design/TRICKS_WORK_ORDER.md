# Claude Code work order — Tricks review, and two small Home additions

Design canvas: `Tricks.dc.html`. Section 1 is the verdicts, section 2 the corrected
artboards (live — tap the chips), section 3 the answers to the 5a build report.
`tokens.css` is the contract. Nothing in it changes in this order.

---

## A. Tricks — the four things that must change before more pages are drawn

These are the ones that cost meaning elsewhere in the app if they ship as drafted.

### A1. The counting block is paper, not dirt

Replace the dirt fill everywhere in `design/tricks/`:

```
background: var(--bg-card);          /* #fffdf6, was #7a5233 */
border: 3px solid var(--border-btn); /* was 2px */
box-shadow: var(--bevel-small);
width: 22px; height: 22px; box-sizing: border-box;
```

Dirt `#7a5233` and Wood `#a9713c` are the same brown at arm's length, and the draft's
block is the tier badge's shape at nearly its size. A hundred and twenty of them reads as
*Wood tier* on the one screen where mastery is not being measured. The framing to hold on
to: **Tricks is the notebook, not the inventory** — its blocks are drawn, not mined. The
texture trim at the top of each page keeps the world without spending a material.

### A2. Removal is absence, not slate

In `Nines.dc.html`, the taken-away row currently uses `#dfe6ee` on `#8ba4bb` —
`--wrong-pale` on `--wrong-edge`, the send-back palette exactly. Replace with:

```
background: transparent;
border: 3px solid var(--divider);   /* #cfc8b2 — same width, so nothing reflows */
opacity: .35;
```

Slate means *not yet, we'll come back to it* on every other screen, and it is load-bearing
because it means only that. In ×9 the removed row is the method working. The cost of
conflating them is paid on the card screens, not here.

### A3. Green only where she acted

Three fixes, one principle — **celebration colour and celebration motion never appear
where she has not acted.**

- **Result line.** Drop `background:#eaf5df; color:#3d7a22` from the third ledger line.
  The result renders in the neutral problem slab instead: card ground, 3px ink, stone
  trim strip, Jersey at 38px, reading `9 × 7 = 63`.
- **Result motion.** `ansStyle` currently springs `scale(.4) → 1` on
  `cubic-bezier(.34,1.56,.64,1)` — that is `--ease-pop`, the correct-answer burst's curve.
  Replace with opacity + `translateY(6px → 0)` on `--ease-out`, 300ms.
- **Selected chip.** Keep green — choosing an n *is* her acting — but as deck select's
  chosen-mode treatment, not the correct-answer fill:
  `background: var(--bg-card); outline: 3px solid var(--correct); color: var(--correct-text);`
  and drop the bevel while selected. **Outline means she chose; fill means she was right.**

### A4. Play once and hold — no ambient loop

Replace the 4-phase cycle in all three pages. Phases advance once and stop at the result;
`Again ›` (stone bevel button, below the chip strip) replays; tapping a chip replays with
the new n. There is no wrap-around.

```
build 900ms (rows staggered ~90ms) · hold 600 · transform 300 · hold 900 · result 300 · hold
```

Marks from page start: `[30, 1550, 2750]` for two-transform tricks, `[30, 1550, 2750, 3650]`
for Fours. About 3s to a held result.

Two reasons the loop has to go. A loop erases its own conclusion on a schedule she does not
control — the frame it guarantees she will lose is the only one that matters. And
`Nines` phase 0 sets every row to `opacity:0` for 700ms, so **the stage goes blank once per
cycle**; a child glancing at the page at the wrong moment sees an empty card. A held result
also makes the page a real reference: she can glance at ×9 and read the answer with the
structure still under it.

Under `prefers-reduced-motion`, render the held result immediately with the ledger fully
lit. `Again ›` stays and does nothing visible — that is correct, not broken. Replace the
blanket `transition-duration: 0 !important` override with this deliberate path.

---

## B. Tricks — layout

### B1. Constant block size

**22px blocks, 3px gaps, every trick, every n.** Delete `Fours`' `n > 10 ? 18 : 22`.
Twelve columns is `12×22 + 11×3 = 297px` against 354px at an 18px gutter — 57px spare, so
nothing needs to shrink. If a block is one size on one card and another on the next, the
block stops being a unit and the array stops being comparable, which is the only thing an
array is for.

**Reflowing an arrangement is not resizing a unit and stays allowed.** Fives at n=12 is six
ten-frames, 379px tall in one column; above three frames it goes to two columns
(278px wide, 187px tall). The block never changes; the arrangement may.

### B2. Fours' side tags move to the ledger

The `width:30px` tags beside each group are what forced the shrink. Delete them — the
ledger already carries the running totals line by line. Any caption a trick needs goes
*under* the array, full width, so the array owns the whole column.

### B3. Chip strip

Six columns, rows of six then five, left-aligned, `min-height: var(--tap-comfy)`. Keep the
draft's **4px gaps** and drop the gutter to **12px**: `(390 − 24 − 5×4)/6 = 57.7px` per chip.
The draft's 16px gutter with the same gaps gives 56.3px — correct, but with a third of a
pixel of margin over `--tap-comfy`.

**The gutter is what buys the margin, not the gap.** Widening the gap to 6px at the same
12px gutter gives `(390 − 24 − 5×6)/6 = 56.0px`, which is *worse* than the draft — spending
on separation the pixels the chips needed. This is the only element allowed outside the
18px gutter; the reason is the touch minimum, which outranks the gutter.

### B4. Ledger legibility

Lines go **20px → 22px**. Unlit lines go from `#d5d2c9` to **ink at `opacity: .26`** —
pale grey on parchment is close to invisible in daylight, and the ledger is the
second-most-looked-at object on the page.

---

## C. Tricks — entry, and the picker

### C1. Placement

**Deck select is the door.** A fourth row under the three decks: book icon, name, no DUE
chip and no tier bar, because Tricks is a place rather than a deck. She is already choosing
how to work when she is there.

**Round cleared is the second door, and it is targeted.** The screen already knows what she
missed, so it offers the trick for the table she missed most, as a quiet stone link:
`×9 came up twice. Want the trick? ›`. Only when one table accounts for two or more misses
in the round; otherwise the link is absent.

**Home is refused.** Home has one job. A Tricks row competes with the green button and
dilutes YOUR MATERIALS, whose whole argument is that mastery is the reason to practise —
which was the case for deleting the tab bar.

**The wrong-answer state is refused.** This is the tempting one: she is exactly then in
need of a trick. But the wrong state is *slate, silent and still*, and nothing appears on a
failure-adjacent state. An affordance on a missed card turns a miss into an event and hands
her an exit at the moment the design has spent four sections making unremarkable. C1's
Round-cleared link is the compensation: same need, sixty seconds later, at the breather,
aimed at the right table.

### C2. The picker

- No tab bar (5a). A push from deck select, returning with `‹`. Trick pages push from the
  picker and return to it.
- **The bottom edge carries nothing** — no bar, no chip, no parent key. It ends with the
  contract line instead: *Come here any time. Nothing here is counted, and nothing you look
  at changes your practice.*
- `No timer, no score — just shortcuts` moves **above the grid**, under the header. It is
  the page's promise and should be read before the tiles.
- Tile copy: sentence case, not all-caps — shouting reads as instruction rather than
  invitation. Tiles name the **action**, and the standing rule is that **no tile may ever
  say hard, tricky, tough, or "the difficult one"**; the tables she avoids are exactly the
  tiles she must be able to tap without flinching.
- **The Flip leaves the grid** — full width below it, with the two 3×2 arrays as its mark.
  It is not a table and should not sit in the table grid.

---

## D. Tricks — build the stage as a slot now, not at ×10

The page frame (header, explainer, stage, ledger, result slab, chip strip, `Again ›`) is
trick-agnostic and carries all twelve pages. **The array is not.** ×10 has no array
transform — sliding a zero onto `7` to make `70` is a digit operation, and seventy blocks
would bury the thing it teaches.

**The stage is a slot.** The page accepts any stage that plays in phases and reports which
ledger line is lit. Two stages are needed at the outset:

- **array** — nine of the twelve
- **digits** — ×10, and ×11's *say the digit twice*, which has the same shape (and is a
  reason to revisit the draft's *one more row* framing for ×11 when that page is drawn)

**The Flip needs one addition:** a **two-line simultaneous ledger** variant, `7 × 8 = 56`
and `8 × 7 = 56` lighting on the same frame. A sequential reveal would imply the second
derives from the first, which is the misconception the trick exists to remove.

---

## E. Tricks — non-negotiable

No red anywhere. Nothing punitive. No `border-radius`. Jersey 25 never below 13px (the
ten-frame tag is at the floor; nothing else goes there). Transform and opacity only. The
three greens do not drift: `--correct #57a636`, `--fast #7fe237`, `--emerald #12c46b`.

**Tricks adds no sound at all.** The app has four cues, every one of them for something she
did, and watching is not one of them.

---

## F. Home — two additions, and three withdrawals

From §8 of the build report. Three of the four gaps are mine, not yours:

- **Greeting and date row — withdrawn.** Canvas atmosphere; the clock is already there.
- **Mastered progress bar — withdrawn.** YOUR MATERIALS carries mastery now.
- **"Pick a deck instead" — withdrawn.** `PRACTICE ›` pushing deck select is cleaner than a
  green button with an escape link under it.

**Build these two, and only these two,** on the practice card:

1. A **DUE chip** on the card header — `18 DUE`, Jersey 13px, 2px `--emerald` border,
   `--emerald-soft` fill, `--emerald-dark` text.
2. A **minutes estimate** line under it — `About 4 minutes`, Nunito 14px `--text-muted`,
   with the emerald range if it is cheap to compute (`worth 5–7 emeralds`), omitted if not.

They answer *how long is this going to take* before she commits, which is the question that
decides whether a distractible ten-year-old taps the button on a bad day. A bounded, visible,
small number is the difference between a chore and an errand.

---

## G. Standing rules this round establishes

- **No artboard sentence is worth a schema change.** If copy needs data the model lacks, the
  copy changes. (From the Diamond-count footer.)
- **Where a canvas number and a token disagree by a step, the token wins by default.** Flag
  only when the artboard number was load-bearing.
- **Theme tokens carry colour; theme images are set per theme in the stylesheet.** A `url()`
  in a custom property resolves against the using stylesheet.
- **Correction to the record:** my factors-card argument for deleting the tab bar was wrong
  — the bar never mounted on card screens, so the deletion gains it nothing. 5a stands on
  its other reasons; that claim should come out rather than sit there being false.
