# Times Table

A web-based multiplication and division practice app, built to be added to a
phone or tablet home screen.

## Layout

```
tokens.css               shared design language — the contract between surfaces
index.html               app shell
manifest.webmanifest     PWA manifest (home-screen install)
src/
  styles.css             app styles; imports tokens.css
  app.js                 app logic
design/
  *.dc.html              design artboards (see design/README.md)
assets/                  images, icons, sounds
```

## Running it

It is plain static HTML — no build step, no dependencies. Open `index.html`, or
serve the folder to test on a real phone on the same network:

```bash
python -m http.server 8000
```

## The one rule

`tokens.css` is the single source of truth for every color, size, radius,
duration, and touch target. The app imports it; the design artboards link to it.
Do not hardcode a hex value or a pixel size anywhere else — that is exactly how
the mockups and the shipped app stop resembling each other.

## Keeping design and code in sync

See [design/README.md](design/README.md). Short version: artboards are committed
source, edits made in the published canvas must be explicitly pulled back into
the repo, and nothing syncs on its own.

## Specs

- [design/DESIGN_BRIEF.md](design/DESIGN_BRIEF.md) — the prompt for Claude Design
- [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) — decks, mastery model, session rules
