# Working in this repo

A multiplication/division practice app for a child. Plain static web app —
no framework, no build step. Keep it that way unless asked.

## Non-negotiable

- **`tokens.css` is the only place colors, sizes, radii, durations, and touch
  targets are defined.** Everything else references `var(--…)`. If you need a
  value that does not exist, add it to `tokens.css` first.
- Design artboards in `design/` link to `../tokens.css` for the same reason.
- Nothing interactive goes below `--tap-min` (56px). The user is a child.
- Support light and dark. `tokens.css` handles both; do not define a color
  only inside a media query.

## Design ↔ code sync

Artboards are committed source in `design/`. Edits made in the published canvas
Artifact do **not** reach git by themselves — read the artifact URL and
overwrite the local `.dc.html` before publishing over it, or those edits are
lost. See `design/README.md`.

## Not currently available

`DesignSync` (the design-system project sync tool) requires `/design-login`,
which needs an interactive terminal. It does not work from the desktop app.
