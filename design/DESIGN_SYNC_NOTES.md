repo: campbell242/math-multiply-divide-app
branch: main

## Last sync

date: 2026-08-29T21:06:00Z

### Updated in this project

- Processed all 18 items of `docs/DESIGN_FEEDBACK.md`: 11 confirmed, 6 ruled, 1 asset delivered. Verdicts are in chat; the artboards carry every ruling.
- Delivered the missing sprite: `assets/emerald.png` (16×16) and `assets/emerald-32.png` (32×32), five-colour palette, 1px outline, matching `coin.png`. All 23 CSS-drawn gems in the canvas retired in favour of the sprite; display sizes snapped to 16/32/48/64.
- New artboards: **2p** (deck select with speed run chosen, plus the unavailable / coming-soon / hidden deck-row states). Reworked: **2c** (HOW MUCH is now three cards; AUTO CHECK row added).
- Rulings needing code changes: wrong-state continue stays filled slate with no auto-advance; factors gains tap-to-focus on the live row and a duplicate marks the solved row (#a8e07f, not the FAST bright); per-pair Lightning is the orb alone, no FAST chip; factors completion holds 700ms not 900; fact-grid cells open a fixed detail panel on tap; the ✎ stays as the affordance and opens a native field.
- `tokens.css` read and adopted as the contract. **No token values changed.** Two additions the build will need: the emerald sprite paths, and the rule that pixel art displays only at integer multiples of 16.
- Artboard sample data corrected to the confirmed emerald formula (2a "5–7 emeralds", 2m "+5", balances 142 → 147 → 152). Three artboards showed an Iron promotion toast and now show Diamond, per item 17.
- Not yet read: `src/`, `CLAUDE.md`, `index.html`, `DATA_MODEL.md`, `.claude/`.

## Sync history

- 2026-08-29T19:14:51Z — re-read `docs/PRODUCT_SPEC.md` on `design-brief`; 3c gained the independent Lightning threshold and the clamp.
- 2026-08-29T18:46:30Z — read `design/DESIGN_BRIEF.md` and `docs/PRODUCT_SPEC.md` on `design-brief`; applied the three mismatch resolutions.
- 2026-08-29T18:40:39Z — read `docs/PRODUCT_SPEC.md` on `main` during a read/write capability probe.

## Screen map

| Project screen | Repo files |
|---|---|
| 1a Design system | tokens.css (contract); design/DESIGN_BRIEF.md §2–3; docs/PRODUCT_SPEC.md (tiers, currency, thresholds) |
| 2a–2b Home | docs/DESIGN_FEEDBACK.md #1 #14; docs/PRODUCT_SPEC.md (reinforcement) |
| 2c, 2p Deck select | docs/DESIGN_FEEDBACK.md #5 #6 #16; docs/PRODUCT_SPEC.md (session model) |
| 2d–2h Cards, speed run | docs/DESIGN_FEEDBACK.md #2 #3 #4 #16; docs/PRODUCT_SPEC.md (clearing rule, two thresholds) |
| 2o Correct, Lightning | docs/PRODUCT_SPEC.md (Lightning threshold) |
| 2i–2k Factors cards | docs/DESIGN_FEEDBACK.md #10 #11; docs/PRODUCT_SPEC.md (factor entry, deck shape, factors clearing rule) |
| 2l–2n Round cleared, session complete, ME | docs/DESIGN_FEEDBACK.md #1 #8 #9 #18 |
| 3a–3c Parent area | docs/DESIGN_FEEDBACK.md #12 #13 #14 #15; docs/PRODUCT_SPEC.md (parent area) |
| 4a–4b Motion and sound | docs/DESIGN_FEEDBACK.md #4 #11 #17 #18; tokens.css (motion block) |
