# Data model

How the app persists what it knows. `docs/PRODUCT_SPEC.md` defines the behaviour; this file
defines the shape underneath it.

Three decisions frame everything below, settled before writing it:

- **`localStorage`, one device.** No backend, no accounts, no sync.
- **Backup is a file the parent downloads.** Export and import JSON from the parent area.
- **History is bounded.** Per-card aggregates plus the last 10 answer times, never a full log.

## Why localStorage

The whole dataset is about 40 KB (calculated below) against a ~5 MB budget, it is single-user
and single-device, and it never needs a query more complex than "give me every card." IndexedDB
would buy asynchronous writes and room to grow, and cost an async layer around every read for a
dataset that fits in 1% of the simpler store.

The real tradeoff is not size, it is durability — and IndexedDB would not have fixed that.
Both are script-writable storage a browser may evict. That is what the export exists for.

## Keys

Everything lives under a `mt.` prefix so it never collides with anything else on the origin.

| Key | Holds |
|---|---|
| `mt.schema` | Schema version, an integer. Read first, before anything else. |
| `mt.profile` | Child's name, avatar, theme, emerald balance. |
| `mt.settings` | Everything in the parent area. |
| `mt.cards` | The mastery record for all 295 cards. |
| `mt.streak` | Streak count, last practice day, excused days. |
| `mt.sessions` | A rolling log of the last 60 sessions. |
| `mt.corrupt.<key>.<day>` | Quarantine. See *Corrupt data* below. |

## Card identity

Every card has a stable string id. Ids are the join key between decks, the fact grid, and any
future backup, so they never change once shipped.

| Deck | Id form | Example | Count |
|---|---|---|---|
| Multiplication | `m:<a>x<b>` | `m:7x8` | 121 |
| Division | `d:<p>/<b>` | `d:56/8` | 121 |
| Factors | `f:<n>` | `f:36` | 53 |

**295 cards total.** `m:7x8` and `m:8x7` are separate ids on purpose — the spec keeps ordered
pairs distinct because recall of the two genuinely differs at this age.

## Days, not timestamps

Scheduling and streaks are day-granularity concepts, so they are stored as an **integer day
number in local time**, never as a timestamp.

```js
// Days since 1970-01-01 in the user's own timezone.
// Built from local Y/M/D so it cannot be shifted by DST or a UTC offset.
function dayNumber(d = new Date()) {
  return Math.floor(
    (d.getTime() - d.getTimezoneOffset() * 60000) / 86400000
  );
}
```

Storing an ISO timestamp instead would mean a card scheduled at 9pm comes due at 9pm the next
day rather than at the start of it, and a child practising at 11:55pm and again at 12:05am
would break her own streak by crossing midnight mid-session. Day numbers make both impossible.

A **session** is attributed to the day it started, so a session running through midnight counts
once, for the day it began.

## `mt.cards`

An object keyed by card id. Only cards she has actually seen are stored — an unseen card is
absent, not a record full of zeros, which keeps the file small early on.

```json
{
  "m:7x8": {
    "t": 3,
    "due": 20329,
    "n": 14,
    "ok": 11,
    "ms": [2140, 1890, 3400, 1760, 2010, 1650, 4200, 1580, 1720, 1490]
  }
}
```

| Field | Meaning |
|---|---|
| `t` | Tier: 0 Wood, 1 Stone, 2 Iron, 3 Gold, 4 Diamond |
| `due` | Day number when it next comes due in smart review |
| `n` | Total attempts |
| `ok` | Total correct |
| `ms` | Last 10 answer times in milliseconds, oldest first |

Short field names are deliberate: keys repeat 295 times in the serialised blob, and `"attempts"`
over `"n"` costs more than the values do.

`ms` is capped at 10 by shifting off the front. Average time is derived from it rather than
stored — a stored average and a stored list are two facts that can disagree, and the list is
the one that can be recomputed.

For factors cards, an "attempt" is the whole card and the time is the total to complete every
pair. Per-pair timing feeds the Lightning check but is not persisted.

### Tier transitions

Straight from the spec, restated here because this is where they get implemented:

```js
if (!correct)                     tier = Math.max(0, tier - 1);
else if (ms <= settings.promoteMs) tier = Math.min(4, tier + 1);
// correct but slow: tier unchanged
```

`due` is then recomputed from the new tier:

```js
const INTERVALS = [0, 1, 3, 7, 16];   // Wood, Stone, Iron, Gold, Diamond
card.due = dayNumber() + INTERVALS[card.t];
```

Tier 0 has interval 0, meaning still due today — which is what "same session" means in the
spec, and what makes the clearing rule work without a separate mechanism.

## `mt.settings`

```json
{
  "decks":        { "mult": true, "div": true, "factors": false },
  "roundSize":    40,
  "factorsRound": 12,
  "promoteMs":    5000,
  "lightningMs":  3000,
  "speedRun":     true,
  "autoSubmit":   true,
  "sound":        { "all": true, "blips": true },
  "pin":          "0000",
  "lastBackupDay": 20295
}
```

`lightningMs` is clamped to `promoteMs` on write, per the spec — praising an answer too slow to
advance a tier is incoherent, and clamping is friendlier than rejecting the input.

**The PIN is not a security control.** It is stored in plain text because it keeps a ten-year-old
out of the settings screen and nothing more. It protects no secret and guards no money. Hashing
it would imply a threat model this app does not have; anyone with the device can read
`localStorage` regardless.

## `mt.streak`

```json
{ "count": 6, "lastDay": 20328, "excused": [20321] }
```

On the first session of a day: if `today - lastDay === 1`, or every intervening day is in
`excused`, the count increments. Otherwise it resets to 1. It never displays a broken streak —
the chip is simply absent, per the tone rules.

## `mt.sessions`

A rolling log, newest last, capped at 60 entries. This is what the parent area's recent-activity
view reads.

```json
[{ "day": 20328, "deck": "mult", "mode": "smart",
   "cards": 18, "firstTry": 15, "fast": 14,
   "emeralds": 14, "promoted": 2, "seconds": 227 }]
```

Sixty days is enough to see a trend and small enough to stay bounded. Older sessions are dropped,
not archived — the per-card aggregates already carry the long-term record.

## Size

Measured, not estimated — serialised at full worst case, every one of the 295 cards seen with a
full `ms` array and all 60 session slots used:

| Part | Serialised |
|---|---|
| `mt.cards`, 295 cards | 29.0 KB |
| `mt.sessions`, 60 entries | 7.0 KB |
| Settings, profile, streak | 286 bytes |
| **Total** | **36.2 KB** |

**0.71% of a ~5 MB `localStorage` budget**, and bounded: the card count is fixed at 295, `ms` is
capped at 10, sessions at 60. Nothing here grows without limit, so the number above is a
ceiling rather than a starting point.

## Writing

State lives in memory and is **flushed on a debounce, not on every answer.** A round of 40 cards
would otherwise mean 40+ synchronous serialisations of the whole card set, which is exactly the
jank a child notices as the keypad feeling slow.

Flush on: a 2-second debounce after any change, the end of every round, and `visibilitychange`
when the page becomes hidden.

Use `visibilitychange`, **not** `beforeunload` — mobile browsers routinely kill a backgrounded
tab without ever firing `beforeunload`, and losing a round to that would be indistinguishable
from a bug.

## Failure modes

Each of these is a real thing that happens on a real phone, not a hypothetical.

**Storage unavailable.** Private windows and locked-down browsers throw on access rather than
returning null. Every read and write is wrapped; on failure the app runs fully from memory for
the session and the parent area shows a plain line saying progress will not be saved. The app
never refuses to start over storage.

**Quota exceeded.** Prune `mt.sessions` to the last 10 and retry once. If it still fails, treat
it as storage unavailable. Never drop card data to make room — it is the only thing here that
cannot be regenerated.

**Corrupt JSON.** Never wipe. Move the unparseable string to `mt.corrupt.<key>.<day>`, start that
key fresh, and surface it in the parent area. A parent whose data is quarantined can still send
the file somewhere; a parent whose data was silently deleted has nothing.

## Backup

The parent area exports one file: `times-table-backup-YYYY-MM-DD.json`.

```json
{
  "format": "times-table-backup",
  "schema": 1,
  "exportedDay": 20329,
  "data": { "profile": {}, "settings": {}, "cards": {}, "streak": {}, "sessions": [] }
}
```

Import validates `format` and that `schema` is not newer than the running app, then **replaces**
state wholesale rather than merging. Merging two divergent histories would need conflict rules
this app has no reason to own, and a restore is nearly always "this device lost everything,"
not "reconcile two devices." The import screen says plainly that it replaces current progress,
and requires a second tap.

If `schema` is older, run the same migrations as an in-place upgrade.

The parent area shows days since last backup, and after 30 days adds a quiet line suggesting one.
It is a line, not a modal, and it never blocks practice — the parent voice explains the mechanic
and stops.

## Schema versioning

`mt.schema` holds an integer, currently **2**. On boot, read it before anything else and run each
migration in order to the current version. A missing `mt.schema` with no other `mt.*` keys is a
fresh install; a missing one *with* other keys is treated as version 1.

```js
const MIGRATIONS = {
  // shape: take the whole state at version N-1, mutate it to version N
  2: (state) => { state.settings.autoSubmit = true; }, // auto check became the default
};
```

Write migrations even when they feel unnecessary. The alternative is discovering on her phone
that a shipped change silently dropped her tiers.
