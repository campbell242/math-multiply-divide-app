# Items to take back to Design

A running list of gaps and provisional decisions made during the build. Each entry says what
the build did in the meantime, so Design is ruling on a concrete thing rather than a blank.
Process the whole list at once — do not send these piecemeal.

## Open

### 19. MY LOOK screen, built from the routine app's 1n — needs a math-app artboard
Owner request: the routine app's avatar + theme customization, ported. **Build:** a ME screen
reached by tapping the avatar on Home; eleven avatar slots and the five world themes with the
1n swatches; selected slots take 1n's 4px-gold-plus-outline treatment; the A5 pick blip.
A theme repaints only the trim strip and section-label accents — the three semantic greens
never move. Three things for Design: (a) a math-app 2o artboard for this screen, (b) the
entry point — the tappable avatar is provisional until the HOME/PRACTICE/ME tab bar from the
v4 canvas is ruled on, and (c) which decorative surfaces beyond strip and labels each theme
may claim.

## New in the v4 canvas, not yet built

Design's round-one artboards carry work beyond the eighteen rulings. Tracked here so it is a
decision, not a drift:

- **A bottom tab bar (HOME / PRACTICE / ME)** on child screens, implying a ME tab — the 2n
  mastery screen from the original brief, never built. This is the largest piece.
- **Deck rows on 2c carry symbols (×, ÷, □×□), DUE chips, and per-deck tier bars** — "the
  same five materials as the fact grid, so the shape of her progress looks identical to her
  and to a parent."
- **The speed variant of deck select shows a per-deck BEST time.**
- **The fact grid gained a WEAKEST FACTS list and a cross-deck summary** ("Division is
  roughly two weeks behind multiplication") beyond the ruled detail panel.
- **The wrong-state copy spells the fact out in words** ("Seven eights are fifty-six"); the
  build shows the numeric fact and "You put N".

## Resolved — round one, 2026-08-29

Verdicts from Design: 11 confirmed, 6 ruled, 1 asset delivered. All rulings implemented and
verified in the browser the same day.

1. **CONFIRMED** — emerald formula `ceil(n/4) + clean·ceil(n/10)` stands; artboard sample
   numbers corrected to match. Late fix on 2l: the cleared screen never shows a first-try
   count (a count implies the round size); a clean round shows a ✔ tile instead. *Built.*
2. **CONFIRMED** — full-review header is `ROUND 1 OF 3`, round bar beneath.
3. **RULED** — the wrong-state continue is **filled slate**, not card-ground (card-ground
   matches the disabled CHECK and reads as nothing-to-do). No auto-advance after a miss, at
   any delay. *Built: slate `Next card ›`, tap required.*
4. **CONFIRMED** — 700ms advance on correct, CHECK skips. "Stacked cards" was descriptive.
5. **CONFIRMED** — AUTO CHECK lives on deck select; it changes how the keypad feels, so the
   person it affects reaches it. Iron pill, because it is a preference, not something she did.
6. **RULED** — a parent-off deck is **hidden, not greyed** (a greyed row asks her to resolve
   something she can't). Coming-soon decks take a recessed stone row with the reason in the
   chip. *Built: hidden; the not-in-speed-run row keeps the recessed treatment.*
7. **DELIVERED** — `assets/emerald.png` (16×16) and `assets/emerald-32.png` (32×32).
   Octagonal with a girdle so it cannot be mistaken for the coin. Display rule: only at
   16/32/48/64 — 16 and 48 from the small sprite, 32 and 64 from the large. *Built: all CSS
   gems retired for the sprites; sizes tokenised.*
8. **CONFIRMED** — no action on the session-complete gap.
9. **CONFIRMED** — streak ticks on session completion, including Stop-here after a cleared
   round.
10. **Mixed.** Confirmed: CHECK as box-advance, slate wrong pair that stays, sorted-slot
    landing, AUTO CHECK not applying to factors. **RULED** on three: tapping either box of
    the live row focuses it (a typo in the first number must not cost the pair); a duplicate
    **marks the solved row in `#a8e07f`** — an acknowledgement, deliberately not the FAST
    bright; per-pair Lightning is **the orb alone, no FAST chip** (a chip would flicker eight
    times on one card). *All three built.*
11. **RULED** — factors completion holds 700ms, not 900: extra waiting charges her most on
    the card that took longest. *Built.*
12. **CONFIRMED** — live-apply; 3c has Lock only, no Save, no Cancel.
13. **RULED** — the pencil and the native input are not in conflict: **✎ is the resting
    affordance; tapping it opens a native field framed in slate.** *Built for all seven
    editable values.*
14. **CONFIRMED** both invented rules — last-deck protection (now in 3c helper text) and the
    PARENTS chip bottom-right.
15. **RULED** — tapping a grid cell opens a **fixed detail panel below the grid**: fact,
    tier + due, median, seen, missed, last. A title on hover is not an interaction on a
    phone. *Built; "last" is derived as `due − interval(tier)`, no schema change.*
16. **CONFIRMED** all three speed-run decisions — tiers-safe especially. Dash stays fixed
    at 18.
17. **CONFIRMED** — promotion toast for Gold and Diamond only.
18. **CONFIRMED** — the award chain as built; state-final-before-playback is the part worth
    keeping.
