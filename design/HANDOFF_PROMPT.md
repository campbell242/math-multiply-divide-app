# Claude Code work order — navigation decision 5a, plus My Look

Design canvas: `Haley Math App.dc.html`, Section 5 (`#5a`, `#5d`, `#5e`) is the decision record.
Sections 1–4 are the full screen set and now carry the decision. `tokens.css` is the contract.

---

## 1. Delete the tab bar

Remove the `HOME / PRACTICE / ME` bottom bar entirely — component, styles, routes, and the
five screens that mount it (Home, Home-empty, Deck select, Deck select speed, My Look).
Nothing replaces it at the bottom of the viewport on any screen.

The reason, so the rest of the changes make sense: the three destinations were never peers.
PRACTICE is the app's one job and is already a full-width green button on Home; HOME is the
frame you return to; MY LOOK is a wardrobe visited monthly. The bar duplicated the primary
action at a third of the weight, gave a monthly errand the standing of a daily one, and was
the only dark surface in a light-only design — on three screens out of fourteen.

## 2. Home becomes the hub

Home is the only screen not reached by a push. Every other child screen gets a `‹` back
chevron top-left that returns to Home. Screen changes stay instant.

**Avatar gains a pencil badge.** 20×20, `--correct-text` (`#3d7a22`) fill, 2px `--border-btn`
outline, bottom-right of the 56px avatar slot, overhanging by 3px. Contains
`assets/icons/pencil.png` at 12px. The whole avatar slot is the tap target for My Look —
enlarge the hit area to 56px minimum, badge included.

**New `YOUR MATERIALS` card**, directly below the practice card on both Home states:

- Section label in `--theme-deep`, `--font-display` 15px, 16px above / 8px below.
- Card: `--bg-card`, 3px `--border-ink`, `--key-drop-sm`, 13px/14px padding.
- Three rows, one per deck: symbol (`×`, `÷`, `□×□`) in a fixed 34px column, a 12px
  five-segment tier bar (wood / stone / iron / gold / diamond, 2px gaps), and the diamond
  count right-aligned in a 30px column, `--tier-diamond-deep`.
- A footer row above a 2px `--bg-toast` divider: the tier badge of whatever is closest,
  one sentence, and a `›`. Copy pattern: `2 facts are one round away from **Iron**`.
  On the empty state it reads `3 new facts reached **Diamond** today`.
- The whole card is one tap target and pushes the mastery screen.

The card is present in **both** Home states, in the same place. The empty state is a
different message, not a different screen.

**Parent entrance.** The `PARENTS` chip stays bottom-right and gets upgraded now it is
alone on the bottom edge: `--iron` fill, 3px `--iron-dark` border, `--bevel-strong`-style
inset (`inset 0 3px 0 rgba(255,255,255,.2), inset 0 -4px 0 rgba(0,0,0,.28)`), 11px/14px
padding, `assets/icons/key.png` at 16px, label at `--font-display` 15px. Iron on parchment,
never green, and it appears on Home only.

## 3. The ME tab's content becomes a pushed screen

Route it as `Your materials`, reached only from Home's YOUR MATERIALS card, returning with
`‹`. Header row: `‹`, title `Your materials` at `--font-display` 24px, time right-aligned
in `--text-tertiary`. Below it the existing identity row — avatar at 52px, name, streak and
mastered line. **No pencil badge on this avatar**: here it is identity, not a control.

Everything below is unchanged from the built ME screen: the two currency frames, the three
per-deck tier breakdowns with counts, the `Next up` hint.

## 4. My Look

Now reached from the avatar's pencil badge, not a tab. See `#5d` for the artboard.

- Header: `‹`, `My look`, time.
- Section labels `YOUR FACE` and `YOUR WORLD` in `--theme-deep`.
- Eleven avatar slots, 4 across, `gap: 10px`, `aspect-ratio: 1` (≈81px at 390 wide), avatar
  image 52px. Unselected slots take the inventory slot treatment. **Selected takes 1n's rule
  unchanged: 4px `--tier-gold` border with a 3px `--border-btn` outline.**
- Five theme **rows**, not a second grid: a 3×26px swatch triplet in a 2px ink frame, the
  name at `--font-display` 20px, and `WEARING` in `--tier-gold-text` on the selected row.
  Selected takes the same gold-plus-outline rule. Swatch values come from `tokens.css`
  (`--th-*`); Overworld is `--correct` / `--th-dirt` / `--correct-text`.
- Footer note with a vertical strip sample: `A world changes the strip at the top and the
  little green words. Nothing else moves.`
- Pick blip A5, per 1n.

## 5. Theme scope — ruled

A theme may repaint exactly five surfaces:

1. the top trim strip
2. section-label text
3. the avatar slot's frame on Home and My Look
4. the 2b empty-state card's inner tint
5. a 2px rule under a screen title

The test governing anything proposed later: **a theme may only touch a surface that would
still be fully understood if it were deleted.**

Permanently denied: every button fill, the slab in any state, the keypad, the answer slot,
the round and XP bars, the five tier materials, the emerald, the FAST chip, slate in any
use, the entire parent zone, and any text colour that is not a section label. These carry
state; a theme that can recolour state is a theme that can lie.

## 6. One token change

**Section labels take `--theme-deep`, never `--theme-accent`.** Cherry `#e58bb4` and Nether
`#f2a23e` land near 2:1 on parchment and are unreadable as text; all five `--theme-deep`
values clear 4.5:1. `--theme-accent` is for non-text surfaces only. Update `tokens.css`
comments to say so.

No other token value changes.

Related note, not a change: in Overworld `--theme-accent` resolves to `--correct`. That is
fine because trim never appears adjacent to an answer state — and it is a second reason
section labels must use `--theme-deep`.

## 7. Screens that carry no navigation — unchanged, now consistent

- **A card mid-round**: only `‹`, which asks once in stone before abandoning the round.
  No back chevron behaviour that silently discards progress.
- **The parent zone**: its own `✕ close`, no child chrome, no key chip, PIN gate intact.

Because no screen carries a bar now, their bareness reads as the rule rather than as
something missing.

## 8. Constraints that still bind

No red anywhere. Wrong is slate, silent, still. No `border-radius`. Jersey 25 never below
13px. Sine-only sound under .22 peak gain. The parent zone stays iron and slate. The three
semantic greens do not drift: `--correct #57a636`, `--fast #7fe237`, `--emerald #12c46b`.
Touch targets ≥44px, ≥56px for anything she uses daily.

## 9. What to report back

- Anything in Section 5 that does not survive contact with the real layout at 390×844.
- Whether removing the bar leaves the factors card at six pairs with more room than it had
  — that was the tight case the decision was partly argued on.
