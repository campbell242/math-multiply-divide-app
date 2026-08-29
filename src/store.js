// Persistence, per docs/DATA_MODEL.md. State lives in memory and flushes on
// a debounce and on visibilitychange — never synchronously per answer, and
// never via beforeunload (mobile browsers kill backgrounded tabs without
// firing it).

const PREFIX = "mt.";
export const SCHEMA_VERSION = 1;
const FLUSH_MS = 2000;

// Days since 1970-01-01 in the user's own timezone. Built from the local
// offset so midnight and DST behave (verified across a spring-forward night).
export function dayNumber(d = new Date()) {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}

const DEFAULTS = {
  profile: { name: "", avatar: "av-stormy", emeralds: 0 },
  settings: {
    decks: { mult: true, div: true, factors: true },
    roundSize: 40,
    factorsRound: 12,
    promoteMs: 5000,
    lightningMs: 3000,
    speedRun: true,
    autoSubmit: false, // submit on expected digit count; OFF means CHECK is the extra step
    sound: { all: true, blips: true },
    pin: "0000",
    lastBackupDay: null,
  },
  cards: {},
  streak: { count: 0, lastDay: null, excused: [] },
  sessions: [],
};

// Private windows and locked-down browsers throw on ACCESS, not just on
// write. If storage is gone, the app runs from memory for the session and
// never refuses to start.
function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

const memory = {};
let dirty = new Set();
let flushTimer = null;
let storageOk = true;

function loadKey(name) {
  const raw = safeGet(PREFIX + name);
  if (raw === null) return structuredClone(DEFAULTS[name]);
  try {
    // Defaults underneath, stored values on top, so a newly added setting
    // exists even in data written before it did.
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && !Array.isArray(parsed) && parsed !== null)
      return { ...structuredClone(DEFAULTS[name]), ...parsed };
    return parsed;
  } catch {
    // Never wipe. Quarantine the unparseable string where a parent can still
    // recover it, and start this one key fresh.
    safeSet(`${PREFIX}corrupt.${name}.${dayNumber()}`, raw);
    return structuredClone(DEFAULTS[name]);
  }
}

export function initStore() {
  storageOk = safeSet(PREFIX + "probe", "1");
  const schema = Number(safeGet(PREFIX + "schema") ?? SCHEMA_VERSION);
  // MIGRATIONS run here, in order, when schema < SCHEMA_VERSION. None yet.
  for (const name of Object.keys(DEFAULTS)) memory[name] = loadKey(name);
  safeSet(PREFIX + "schema", String(SCHEMA_VERSION));
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushNow();
    });
  }
  return { storageOk, schema };
}

export function get(name) {
  return memory[name];
}

export function touch(name) {
  dirty.add(name);
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flushNow, FLUSH_MS);
}

export function flushNow() {
  clearTimeout(flushTimer);
  for (const name of dirty) {
    const ok = safeSet(PREFIX + name, JSON.stringify(memory[name]));
    if (!ok) {
      // Quota: prune the regenerable thing and retry once. Card data is the
      // one thing here that cannot be regenerated — never drop it for room.
      memory.sessions = memory.sessions.slice(-10);
      safeSet(PREFIX + "sessions", JSON.stringify(memory.sessions));
      if (!safeSet(PREFIX + name, JSON.stringify(memory[name]))) storageOk = false;
    }
  }
  dirty = new Set();
}

export function storageAvailable() {
  return storageOk;
}

/* --- Card records ----------------------------------------------------------- */

export function getCard(id) {
  // Unseen cards are absent, not zero-filled — new cards enter at wood, due now.
  return get("cards")[id] ?? { t: 0, due: 0, n: 0, ok: 0, ms: [] };
}

export function putCard(id, record) {
  get("cards")[id] = record;
  touch("cards");
}

export function recordAttempt(id, { correct, ms, newTier, due }) {
  const c = getCard(id);
  c.t = newTier;
  c.due = due;
  c.n += 1;
  if (correct) c.ok += 1;
  c.ms.push(Math.round(ms));
  if (c.ms.length > 10) c.ms.shift();
  putCard(id, c);
}

/* --- Streak ------------------------------------------------------------------

   Positive-only. On the first practice of a day: consecutive (or fully
   excused) days extend, anything else restarts at 1 — silently. A broken
   streak is never announced; the chip is simply absent.                     */
export function bumpStreak(today = dayNumber()) {
  const s = get("streak");
  if (s.lastDay === today) return s.count;
  if (s.lastDay !== null) {
    let ok = true;
    for (let d = s.lastDay + 1; d < today; d++)
      if (!s.excused.includes(d)) { ok = false; break; }
    s.count = ok ? s.count + 1 : 1;
  } else {
    s.count = 1;
  }
  s.lastDay = today;
  s.excused = s.excused.filter((d) => d >= today - 40);
  touch("streak");
  return s.count;
}

export function streakAlive(today = dayNumber()) {
  const s = get("streak");
  return s.count > 0 && s.lastDay !== null && today - s.lastDay <= 1;
}

/* --- Sessions (rolling, capped at 60) ---------------------------------------- */
export function logSession(entry) {
  const sessions = get("sessions");
  sessions.push(entry);
  if (sessions.length > 60) sessions.splice(0, sessions.length - 60);
  touch("sessions");
}

export function addEmeralds(n) {
  get("profile").emeralds += n;
  touch("profile");
}
