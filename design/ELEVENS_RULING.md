# Ruling — ×11, and what "say the digit twice" actually is

**Verdict: A, built properly. Not a hybrid.** The array framing, with the digit pattern
named as a payoff rather than left to be noticed. **Tile copy changes**, explainer, ledger
and stage assignment below. This supersedes `TRICKS_WORK_ORDER.md` §D, which put ×11 on the
digits stage.

---

## The reframe the question needs

The two candidates were posed as a trade: structure (A) versus magic (B/C). That trade is
not real, and seeing why decides the page.

**Digit-doubling is not a trick. It is the fingerprint of the array trick in the no-carry
case.**

```
11 × 7  =  10 × 7  +  7  =  70 + 7  =  77
                              ▲     ▲
                          7 tens   7 ones   →  "77"
```

Seventy-seven reads as a doubled digit *because* it is seven tens and seven ones, and the
ones column has nothing to carry. At n = 10, 11, 12 the ones column overflows and the
fingerprint disappears — not because a different rule takes over, but because the same rule
now carries. The pattern was never the mechanism; it was the mechanism's shadow, visible for
exactly as long as n stays a single digit.

So A does not *lose* the magic. A **contains** it, and can explain why it stops. The stated
cost of A — "the wow becomes something she has to notice" — is a page-design problem, not a
structural one, and the page has two slots that fix it: the result and the caption under it.

## Why B and C are refused

**B (chips 2–9)** would make the elevens page silent on 11 × 12, which is one of the two
hardest cards in the deck. The deck deals it; the page must answer it. A trick page that
opts out of the cases she misses most is worse than no page.

**C (two mechanisms)** is refused on the spread rule itself, not on the page count. Split
the digits and drop their sum in the middle — `1_2 → 1+2 → 132` — is a recipe. Nothing on
the stage shows *why* it works, and it only works carry-free by coincidence of the 10–12
range; teach it and she will try it on 11 × 13. The array derives 132 instead of reciting
it. **A recipe that the stage cannot show is not a trick, it is a party piece.**

## The ruling

### Framing — array, and ×11 is ×9's mirror

Eleven is the add-a-row sibling of nine's take-a-row. Placed next to each other, the two
pages teach one thing rather than two: **the hard end of the deck is solved from the tens.**
That is the most useful single idea a ten-year-old can carry out of this library, and it
covers ×9, ×11 and ×12 at once.

### Tile copy — **CHANGED**

| | |
|---|---|
| Was | `Say the digit twice` |
| **Now** | **`Ten rows and one more`** |

The old copy is false on three of eleven chips. **The picker artboard in
`design/Tricks.dc.html` is corrected in this pass** — no separate ticket.

This does put three tiles in the same voice: ×9 *Take a row away*, ×11 *Ten rows and one
more*, ×12 *Ten rows and two more*. That is the honest cost of the ruling, and on balance a
feature: the picker now shows at a glance that the three hardest tables share one method.
The delight is not on the tile. It is on the page, where it can be earned.

### Explainer line

> Eleven of something is ten of it, plus one more row.

Deliberately parallel to ×9's *Nine of something is ten of it, minus one row.*

### Ledger — three lines, uniform at every chip

Worked at n = 7:

```
10 × 7 = 70
and one more 7
= 77
```

Checked at the three chips that broke the old framing:

| n | line 1 | line 2 | line 3 |
|---|---|---|---|
| 10 | `10 × 10 = 100` | `and one more 10` | `= 110` |
| 11 | `10 × 11 = 110` | `and one more 11` | `= 121` |
| 12 | `10 × 12 = 120` | `and one more 12` | `= 132` |

True everywhere, same shape everywhere, and structurally identical to ×9's ledger. No
conditional lines, no second mechanism.

### Stage — array. §D is superseded.

The digits stage is still built, and still built now rather than at ×10 — but **×10 is its
only inhabitant.** That makes it cheaper to scope, not more expensive: one page, one
behaviour, no need to generalise across two.

Array phases follow the locked frame: ten rows build staggered, hold, an eleventh row drops
in, hold, result. The transform is the exact inverse of ×9's, which is worth building as
one parameterised stage rather than two.

**One measurement for the build.** Eleven rows at 22px with 3px gaps is **272px** tall — the
tallest array in the set, 25px above ×9's ten rows. Width at n=12 is unchanged at 297px. The
stage slot must accommodate 272px without the ledger moving; everything else in
`TRICKS_WORK_ORDER.md` §B stands.

### The payoff — where the wow goes

A single caption beneath the result slab. Nunito, `--text-muted`, not Jersey: it is prose
*about* the trick, not part of the working, per the blackboard test in verdict 4.

> **Both digits are 7. That happens all the way up to nine.**

Present for n = 2–9. **Absent for 10, 11 and 12**, and its absence says nothing — the same
rule as the Lightning count on Round cleared, which appears only when there is one and never
explains itself away.

The sentence does two jobs in nine words. It names the pattern, so the delight is celebrated
rather than left to be spotted. And *"all the way up to nine"* draws the boundary in advance,
so when she taps 11 and the line is gone, **the page has already told her why** — which is
precisely the failure mode that sank candidate B.

---

## Summary for the content entry

| Field | Value |
|---|---|
| Tile copy | `Ten rows and one more` *(changed)* |
| Header | `Ten rows and one more` |
| Explainer | `Eleven of something is ten of it, plus one more row.` |
| Stage | `array` — 10 rows, then one added *(supersedes §D)* |
| Ledger 1 | `10 × {n} = {10n}` |
| Ledger 2 | `and one more {n}` |
| Ledger 3 | `= {11n}` |
| Result slab | `11 × {n} = {11n}` — neutral, as all pages |
| Caption | `Both digits are {n}. That happens all the way up to nine.` — only when n ≤ 9 |
| Chips | 2–12, unrestricted |
| Worst-case stage height | 272px at 11 rows |
