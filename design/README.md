# Design

Artboards live here as `.dc.html` files. They are **source code**, committed to
git like anything else in this repo — that is what keeps the design surface and
the app from drifting apart.

## The round trip

```
  design/*.dc.html  ──[ /design skill publishes ]──▶  Canvas Artifact
         ▲                                                   │
         │                                          you click-edit, hit Save
         │                                                   │
         └──────[ Claude reads the URL, overwrites ]─────────┘
                        then commits to git
```

1. **Author** — ask Claude to build or change an artboard. It writes the
   `.dc.html` file here and publishes the canvas as an Artifact.
2. **Refine** — open the Artifact and edit visually: click to select, adjust in
   the properties panel, edit text inline, undo/redo. Hit **Save** to publish a
   new version.
3. **Pull back** — tell Claude "pull the canvas back into the repo." It reads
   the published Artifact, overwrites the local `.dc.html`, and commits.

Step 3 is manual on purpose. There is no background daemon watching the
Artifact; nothing reaches git until someone asks. **If you edit in the canvas
and never pull back, the next publish from the repo overwrites your edits.**
Pull back before asking for further changes.

## Keep the artifact URL

Publishing to the same local file path redeploys to the same URL. Publishing
from a *new* path claims a *new* URL and orphans the old canvas. Record the
canvas URL below once it exists so future sessions update rather than fork:

- Canvas URL: _(not yet published)_

## Tokens

Artboards must pull their colors, type, and spacing from `../tokens.css` rather
than hardcoding hex values. That file is the contract between design and app —
if an artboard invents its own blue, the app will never match it.

## The brief

`DESIGN_BRIEF.md` is the prompt to paste into Claude Design, with the routine-app zip
attached alongside it. It defines the screens, the adapted colour doctrine, and the six
pieces of new visual vocabulary the math app needs. Behaviour lives in
[../docs/PRODUCT_SPEC.md](../docs/PRODUCT_SPEC.md).

## What Claude Design can and cannot do with this repo

Probed 2026-08-29. **Read-only, confirmed by testing rather than by asking.**

It has: `github_list_repos`, `github_get_tree`, `github_read_files`, `github_search_code`,
`github_copy_files`, `github_compare`. It has no tool that commits, branches, opens a pull
request, or comments. `github_copy_files` copies *from* the repo into its own project; it is
not a write path.

What this means:

- **Design reads the specs directly.** Point it at `design/DESIGN_BRIEF.md` and
  `docs/PRODUCT_SPEC.md` by path rather than pasting them. They stay current as we revise,
  which is how the three mismatches of 2026-08-29 got caught.
- **Getting artboards back is still manual.** Design exports the `.dc.html`; a human or
  Claude Code commits it. The round trip above is unchanged.

Known read limits: text only (binaries report size and must be copied), 20 paths per
`github_read_files` call, 300 tree entries by default, and `github_search_code` is bounded —
a low match count is not proof of absence.

## The canvas

`Haley Math App.dc.html` is the design deliverable, committed exactly as Design exported it.
It needs two things beside it to render: `support.js` (the canvas runtime, referenced as
`./support.js`) and `assets/`. Both live in this folder for that reason.

The same PNGs are also at the repository root in `assets/` — that copy is the production one
the app links to. The duplication is deliberate: one is a frozen design artifact, the other
is live app content, and they will diverge the moment the app needs a size or format the
mockup does not.

Verified on import (2026-08-29): 20 artboards, 24 images, zero broken references, no console
errors. No red-family colour anywhere across 68 distinct hexes. The 8-pair factors card
renders at 796px in a 844px viewport with the keypad at 74px keys — the hardest constraint in
the brief, and it holds without scrolling.

## Open design items

- **The Lightning flourish has no visual treatment.** The 3.0s fast-answer marker was added
  to the spec after this design pass. Design flagged it rather than inventing something, which
  is the right call — it needs to read as celebratory without competing with the correct-answer
  burst that fires on the same event.
