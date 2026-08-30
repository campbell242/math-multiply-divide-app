repo: campbell242/math-multiply-divide-app
branch: main

## Last sync

date: 2026-08-29T23:20:00Z

### Updated in this project

- **Navigation decided: 5a — the tab bar is deleted.** The canvas now carries the decision throughout, not just as a proposal.
- Removed all five `HOME / PRACTICE / ME` bars (2a, 2b, 2c, 2p, 2n). Home is the hub; every other child screen returns with `‹`.
- Home (2a and 2b): avatar gained the pencil badge that opens My Look; a `YOUR MATERIALS` card now carries the three per-deck tier bars, diamond counts and the tier hint, and pushes to 2n; the `PARENTS` chip upgraded to a full iron key chip, alone on the bottom edge.
- 2n retitled `Your materials` — a pushed screen with a back chevron rather than a tab. Its avatar carries no pencil badge (identity here, not a control).
- Section 5 relabelled as the decision record: 5a ADOPTED, 5b and 5c kept as "not taken", 5e rewritten as why-5a-won plus the item 19/20 rulings.
- Wrote `HANDOFF_PROMPT.md` — the work order for Claude Code covering all of the above, the theme scope ruling, and the one token change.
- Copied in `assets/icons/key.png`.

### Token changes the code must follow

- **One change, unchanged from the last sync.** Section labels take `--theme-deep`, never `--theme-accent`: Cherry `#e58bb4` and Nether `#f2a23e` fall near 2:1 on parchment; all five `--theme-deep` values clear 4.5:1. `--theme-accent` is for non-text surfaces only. No other token value changed.

## Sync history

- 2026-08-29T22:52:00Z — read DESIGN_FEEDBACK/PRODUCT_SPEC/tokens on `main`; delivered three navigation directions, the My Look artboard, and the item 19/20 rulings.
- 2026-08-29T21:06:00Z — round-one feedback batch: all 18 items ruled, emerald sprites delivered, 2p added, 2c reworked.
- 2026-08-29T19:14:51Z — independent Lightning threshold and clamp added to 3c.
- 2026-08-29T18:46:30Z — read `DESIGN_BRIEF.md` + `PRODUCT_SPEC.md` on `design-brief`; applied the three mismatch resolutions.
- 2026-08-29T18:40:39Z — capability probe on `main`; confirmed read-only GitHub access.

## Screen map

| Project screen | Repo files |
|---|---|
| 5a–5e Navigation decision, My Look, rulings | docs/DESIGN_FEEDBACK.md #19 #20; docs/PRODUCT_SPEC.md ("My look"); tokens.css (theme block) |
| 1a Design system | tokens.css (contract); design/DESIGN_BRIEF.md §2–3 |
| 2a–2b Home | docs/DESIGN_FEEDBACK.md #1 #14 #20 |
| 2c, 2p Deck select | docs/DESIGN_FEEDBACK.md #5 #6 #16 |
| 2d–2h Cards, speed run | docs/DESIGN_FEEDBACK.md #2 #3 #4 #16; docs/PRODUCT_SPEC.md (thresholds, clearing rule) |
| 2o Correct, Lightning | docs/PRODUCT_SPEC.md (Lightning threshold) |
| 2i–2k Factors cards | docs/DESIGN_FEEDBACK.md #10 #11; docs/PRODUCT_SPEC.md (factors clearing rule) |
| 2l–2m Round cleared, session complete | docs/DESIGN_FEEDBACK.md #1 #8 #9 #18 |
| 2n Your materials (was ME) | docs/DESIGN_FEEDBACK.md #20 |
| 3a–3c Parent area | docs/DESIGN_FEEDBACK.md #12 #13 #14 #15 |
| 4a–4b Motion and sound | docs/DESIGN_FEEDBACK.md #4 #11 #17 #18; tokens.css (motion block) |
