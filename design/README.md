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
