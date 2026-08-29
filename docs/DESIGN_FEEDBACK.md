# Items to take back to Design

A running list of gaps and provisional decisions made during the build. Each entry says what
the build did in the meantime, so Design is ruling on a concrete thing rather than a blank.
Process the whole list at once when v1 is done — do not send these piecemeal.

## Open

### 1. Emerald award formula is unspecified
The spec says "per round cleared, with a bonus for a clean round" but names no numbers.
**Build:** one emerald per four cards cleared, plus one per ten as the clean bonus —
`ceil(n/4) + clean·ceil(n/10)`. A clean round of 40 pays 14, which happens to be the number
on the round-cleared artboard. Confirm or supply the real formula, and say whether the
artboard's 14 was chosen or coincidental.

### 2. Full-review card header
The card artboards only show smart mode (`SMART 13 / 18`). Full review must not surface card
counts (the 41/40/40 rule), so its header needs a treatment that isn't a count.
**Build:** `ROUND 1 OF 3` in the meta position. Needs a designed equivalent — likely the
round bar belongs here too.

### 3. Wrong-state continue affordance
The Wrong artboard shows the slate slab and the answer, but no way onward. The build needs
one: auto-advancing would let the answer she needs to read vanish before she reads it.
**Build:** CHECK relabels to `NEXT ›` and takes the quiet card-ground treatment (no green —
continuing past a miss is not a celebration). Needs a designed state.

### 4. Correct-state advance timing
Motion spec: burst done by 380ms, "the next card is already tappable underneath" — which
implies stacked cards the build doesn't have.
**Build:** card auto-advances 700ms after a correct answer; tapping CHECK skips the wait.
Confirm the timing and whether the stacked-card idea matters.

### 5. AUTO CHECK toggle — new feature, needs design
New requirement from the owner: an option to submit automatically the moment the answer has
the expected number of digits, versus editing freely and pressing CHECK.
**Build:** an iron ON/OFF toggle on the deck-select screen (child-accessible, per the owner),
labelled `AUTO CHECK · ON/OFF` with a helper line. Design questions: is deck-select the right
home, and should it instead live in parent settings (3c)?

### 6. Deck-select screen has no artboard
`2c` was specced but the delivered canvas has no deck-select artboard (mode + deck pickers,
due counts). **Build:** bevel-card pickers with a name and a sub-line, selected state in
correct-green. Also needs: the treatment for a deck toggled OFF in parent settings (hidden
or disabled?) and for "coming soon" decks during the phased build.

### 7. Emerald sprite is missing from the asset pack
`assets/` has `coin.png` but no emerald. The balance chip, the award screen, and eventually
the arc animation all need one.
**Build:** a CSS-drawn pixel gem (square, bevelled highlights). Request: `emerald.png`
16×16, same hand-drawn pixel style as `coin.png`, plus a 32×32 if the award screen should
not upscale.

### 8. Session-complete screen vs artboard
`2m` shows the emerald award moment. The build has a static `+N`, stats, and the award
arpeggio — no arc animation yet (that lands with the motion pass). No action needed unless
the artboard changes; listed so the gap is known.

### 9. Streak increment timing
Spec says "daily streak" without pinning when it ticks. **Build:** on session completion —
including "Stop here" after at least one cleared round. Practising but quitting mid-round
does not extend the streak. Confirm.

## Resolved

*(nothing yet — move entries here as Design rules on them)*
