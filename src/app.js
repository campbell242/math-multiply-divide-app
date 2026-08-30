// Controller: wires screens to the engine and the store. All practice logic
// lives in engine.js; all persistence in store.js. This file owns nothing
// but the seams between them and the DOM.

import {
  multiplicationDeck, divisionDeck, factorsDeck, matchPair,
  splitIntoRounds, shuffle,
  createRound, currentCard, answerCard, recordFirstAttempt, roundDone,
  tierAfterAnswer, dueAfter, roundStats,
} from "./engine.js";
import * as store from "./store.js";
import * as audio from "./audio.js";
import { initParent } from "./parent.js";
import { initTricks } from "./tricks.js";

const $ = (id) => document.getElementById(id);
const screens = ["home", "select", "card", "cleared", "complete", "pin", "parent", "grid", "me", "materials", "tricks", "trick"];

// Navigation decision 5a: there is no bar. Home is the only hub; every other
// child screen is a push that returns with ‹.
function show(name) {
  // Instant, per the motion rules: a child taps fast and transitions are a tax.
  for (const s of screens) $(`screen-${s}`).hidden = s !== name;
}

/* --- Decks --------------------------------------------------------------------

   Keyed by the settings.decks key, so the parent toggle and the picker speak
   the same language. "ops" cards have one numeric answer; "factors" cards
   want every factor pair.                                                    */
const DECKS = {
  mult:    { name: "Multiplication", cards: multiplicationDeck(), kind: "ops" },
  div:     { name: "Division",       cards: divisionDeck(),       kind: "ops" },
  factors: { name: "Factors",        cards: factorsDeck(),        kind: "factors" },
};

const TIER_LABELS = ["Wood", "Stone", "Iron", "Gold", "Diamond"];

/* --- Advancement toast: never blocks a tap, dismisses itself. -------------------- */
let toastTimer = null;
function showToast(title, sub) {
  $("toast-title").textContent = title;
  $("toast-sub").textContent = sub;
  $("toast").classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $("toast").classList.remove("is-show"); }, 3000);
}

// Only reaching Gold or Diamond earns the toast and the rising third --
// per-tier toasts would fire forty times a round and become wallpaper.
function maybeCelebratePromotion(card, oldTier, newTier, sound) {
  if (newTier > oldTier && newTier >= 3) {
    showToast(`${TIER_LABELS[newTier]}!`, `${card.text} is now a ${TIER_LABELS[newTier].toLowerCase()} fact`);
    audio.cuePromotion(sound);
  }
}

/* --- Boot ------------------------------------------------------------------- */
const { storageOk } = store.initStore();
document.documentElement.dataset.theme = store.get("profile").theme || "overworld";
document.addEventListener("pointerdown", audio.unlock, { once: true });

/* --- Home --------------------------------------------------------------------- */
function fmtClock(d = new Date()) {
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")}`;
}
setInterval(() => { $("clock").textContent = fmtClock(); }, 10_000);

function dueCount(deckKey, today = store.dayNumber()) {
  return DECKS[deckKey].cards.filter((c) => store.getCard(c.id).due <= today).length;
}

// A deck the parent has toggled off keeps its progress and stops appearing
// in smart review — so it also stops counting toward "cards ready".
function enabledDeckKeys() {
  const on = store.get("settings").decks;
  return Object.keys(DECKS).filter((k) => on[k]);
}

function renderHome() {
  const profile = store.get("profile");
  const streak = store.get("streak");
  $("clock").textContent = fmtClock();
  $("home-avatar").src = `assets/${profile.avatar}.png`;
  $("home-emeralds").innerHTML = `<span class="gem"></span> ${profile.emeralds}`;
  const alive = store.streakAlive();
  $("home-streak").hidden = !alive;
  if (alive) $("home-streak").textContent = `★ ${streak.count}`;
  const due = enabledDeckKeys().reduce((n, k) => n + dueCount(k), 0);
  // The DUE chip carries the count, so the note only speaks when there is
  // nothing due (or storage is broken) — never both at once.
  $("home-note").textContent = storageOk
    ? (due ? "" : "All caught up — nothing due right now.")
    : "Heads up: progress won't be saved on this browser.";
  $("prax-info").hidden = due === 0;
  if (due) {
    $("due-chip").textContent = `${due} DUE`;
    // Minutes from her own recent pace; 10s a card until there is enough
    // history to know better. Emeralds from the real round formula.
    const sessions = store.get("sessions");
    const cardsDone = sessions.reduce((a, x) => a + (x.cards || 0), 0);
    const secsSpent = sessions.reduce((a, x) => a + (x.seconds || 0), 0);
    const perCard = cardsDone >= 10 && secsSpent > 0 ? secsSpent / cardsDone : 10;
    const minutes = Math.max(1, Math.round((due * perCard) / 60));
    const sizes = splitIntoRounds(Array.from({ length: due }, () => 0), store.get("settings").roundSize)
      .map((r) => r.length);
    const lo = sizes.reduce((a, len) => a + Math.ceil(len / 4), 0);
    const hi = lo + sizes.reduce((a, len) => a + Math.ceil(len / 10), 0);
    $("prax-est").innerHTML =
      `About ${minutes} minute${minutes === 1 ? "" : "s"} · worth <b>${lo === hi ? lo : `${lo}–${hi}`} emeralds</b>`;
  }
  renderMaterialsCard();
  show("home");
}

/* --- YOUR MATERIALS (5a): mastery lives on Home, where it can pull her into
   a round. Three bars, three diamond counts, one hint; the whole card taps
   through to the full Your materials screen.                               */
const TIER_KEYS = ["wood", "stone", "iron", "gold", "diamond"];
const DECK_SYMBOLS = { mult: "×", div: "÷", factors: "□×□" };

function tierCounts(deckKey) {
  const counts = [0, 0, 0, 0, 0];
  for (const c of DECKS[deckKey].cards) counts[store.getCard(c.id).t] += 1;
  return counts;
}

function tierBarHtml(counts) {
  return `<span class="mbar">${counts
    .map((n, i) => (n ? `<i class="mbar--${TIER_KEYS[i]}" style="flex-grow:${n}"></i>` : ""))
    .join("")}</span>`;
}

// The footer names whatever is closest to promoting: facts sitting one tier
// below, due today first. Positive-only — there is always a next material.
function closestPromotion(today = store.dayNumber()) {
  const cards = enabledDeckKeys().flatMap((k) => DECKS[k].cards);
  for (const dueOnly of [true, false]) {
    for (let t = 4; t >= 1; t--) {
      const n = cards.filter((c) => {
        const rec = store.getCard(c.id);
        return rec.t === t - 1 && (!dueOnly || rec.due <= today);
      }).length;
      if (n) {
        return {
          tier: t,
          text: `${n} fact${n === 1 ? " is" : "s are"} one round away from <b>${TIER_LABELS[t]}</b>`,
        };
      }
    }
  }
  return { tier: 4, text: "Every fact is <b>Diamond</b>." };
}

function renderMaterialsCard() {
  $("mcard-rows").innerHTML = Object.keys(DECKS).map((k) => {
    const counts = tierCounts(k);
    return `<div class="mrow">
      <span class="mrow__sym${k === "factors" ? " mrow__sym--sm" : ""}">${DECK_SYMBOLS[k]}</span>
      ${tierBarHtml(counts)}
      <b class="mrow__dia">${counts[4]}◆</b>
    </div>`;
  }).join("");
  const closest = closestPromotion();
  $("mcard-foot").innerHTML =
    `<span class="mbadge mbadge--${TIER_KEYS[closest.tier]}"></span>` +
    `<span class="mcard__hint">${closest.text}</span>` +
    `<span class="mcard__go">›</span>`;
}

/* --- Deck select ----------------------------------------------------------------- */
let mode = null;      // "smart" | "full"
let deckKey = "mult"; // last picked deck wins; mult is the default

function renderSelect() {
  const enabled = enabledDeckKeys();
  if (!enabled.includes(deckKey)) deckKey = enabled[0] ?? "mult";

  const due = dueCount(deckKey);
  $("smart-sub").textContent = due ? `${due} due` : "all caught up";
  $("mode-smart").disabled = due === 0;
  if (mode === "smart" && due === 0) mode = null;
  const speedAllowed = store.get("settings").speedRun;
  $("mode-speed").hidden = !speedAllowed;
  if (mode === "speed" && !speedAllowed) mode = null;
  // Factors timing is per pair, which is not a race; speed run is ops only.
  if (mode === "speed" && DECKS[deckKey].kind === "factors") deckKey = "mult";
  $("mode-smart").classList.toggle("is-on", mode === "smart");
  $("mode-full").classList.toggle("is-on", mode === "full");
  $("mode-speed").classList.toggle("is-on", mode === "speed");

  for (const key of Object.keys(DECKS)) {
    const btn = $(`deck-${key}`);
    const notInSpeed = mode === "speed" && DECKS[key].kind === "factors";
    btn.hidden = !enabled.includes(key); // off = hidden, not greyed (ruling 6)
    btn.disabled = notInSpeed;
    btn.classList.toggle("is-on", !notInSpeed && key === deckKey);
    btn.querySelector(".pick__sub").textContent =
      notInSpeed ? "NOT IN SPEED RUN"
      : `${dueCount(key)} of ${DECKS[key].cards.length} due`;
  }

  const auto = store.get("settings").autoSubmit;
  $("auto-toggle").textContent = `AUTO CHECK · ${auto ? "ON" : "OFF"}`;
  $("auto-toggle").classList.toggle("is-on", auto);
  $("start-session").disabled = mode === null;
  show("select");
}

$("go-practice").addEventListener("click", renderSelect);
$("select-back").addEventListener("click", renderHome);
$("mode-smart").addEventListener("click", () => { mode = "smart"; renderSelect(); });
$("mode-full").addEventListener("click", () => { mode = "full"; renderSelect(); });
$("mode-speed").addEventListener("click", () => { mode = "speed"; renderSelect(); });
for (const key of Object.keys(DECKS)) {
  $(`deck-${key}`).addEventListener("click", () => {
    deckKey = key;
    renderSelect(); // smart eligibility depends on the deck now picked
  });
}
$("auto-toggle").addEventListener("click", () => {
  const s = store.get("settings");
  s.autoSubmit = !s.autoSubmit;
  store.touch("settings");
  renderSelect();
});

/* --- Session state ------------------------------------------------------------------ */
const SPEED_RUN_CARDS = 18;
let session = null;
let runTimer = null;

function stopRunTimer() {
  clearInterval(runTimer);
  runTimer = null;
}

function startSession() {
  const today = store.dayNumber();
  const settings = store.get("settings");
  const deck = DECKS[deckKey];
  const pool = mode === "smart"
    ? deck.cards.filter((c) => store.getCard(c.id).due <= today)
    : deck.cards;
  const roundSize = deck.kind === "factors" ? settings.factorsRound : settings.roundSize;
  const rounds = mode === "speed"
    ? [shuffle(pool).slice(0, SPEED_RUN_CARDS)]
    : splitIntoRounds(shuffle(pool), roundSize);
  session = {
    mode, today, settings, deckKey,
    kind: deck.kind,
    rounds,
    roundIndex: 0,
    round: createRound(rounds[0]),
    banked: 0,          // emeralds earned, released only at session end
    firstTry: 0, fast: 0, promoted: 0, cardsCleared: 0,
    startedAt: Date.now(),
    runIndex: 0,        // pentatonic position; resets on a miss
  };
  $("card-deck").textContent = deck.name;
  nextCardScreen();
}
$("start-session").addEventListener("click", startSession);

/* Mid-round, ‹ asks once in stone before abandoning (5a §7): no back-chevron
   behaviour silently discards progress. Rounds already banked stay hers —
   leaving after a cleared round releases them the normal way. */
let leaveArmTimer = null;
function disarmLeave() {
  clearTimeout(leaveArmTimer);
  leaveArmTimer = null;
  $("card-back").classList.remove("back--armed");
  $("card-back").textContent = "‹";
}
$("card-back").addEventListener("click", () => {
  if (!session) return renderHome();
  if (!leaveArmTimer) {
    $("card-back").classList.add("back--armed");
    $("card-back").textContent = "LEAVE?";
    leaveArmTimer = setTimeout(disarmLeave, 3000);
    return;
  }
  disarmLeave();
  stopRunTimer();
  if (session.banked > 0) return finishSession();
  session = null;
  renderHome();
});

/* --- The card ------------------------------------------------------------------------- */
let entry = "";
let shownAt = 0;
let phase = "answer"; // "answer" | "correct-hold" | "wrong-hold" | "between"
let advanceTimer = null;
let fastChipTimer = null;

// Factors working state: which pairs are solved, the two entry boxes, and
// which box the keypad is filling.
let fs = null;

function expectedDigits(card) {
  return String(card.answer).length;
}

function renderMeta() {
  const r = session.round;
  $("card-meta").textContent =
    session.mode === "speed" ? `SPEED RUN ${Math.min(r.cleared + 1, r.total)} / ${r.total}` :
    session.mode === "smart" ? `SMART ${Math.min(r.cleared + 1, r.total)} / ${r.total}` :
    `ROUND ${session.roundIndex + 1} OF ${session.rounds.length}`;
}

function nextCardScreen() {
  const card = currentCard(session.round);
  entry = "";
  phase = "answer";
  disarmLeave();
  clearTimeout(advanceTimer);
  clearTimeout(fastChipTimer);
  $("slab").classList.remove("is-correct", "is-wrong");
  $("slab").classList.toggle("slab--factors", session.kind === "factors");
  $("stars").classList.remove("is-burst");
  $("stars").hidden = true;
  $("fast-chip").hidden = true;
  $("reveal").hidden = true;
  $("problem").textContent = card.text;
  $("check").textContent = "CHECK ›";
  $("check").classList.remove("is-next");

  if (session.kind === "factors") {
    fs = {
      card,
      solved: new Map(), // pair index -> { fast }
      boxes: ["", ""],
      active: 0,
      wrongs: 0,
      wrongShown: false,
      dupIndex: -1,
      cardStart: performance.now(),
      pairStart: performance.now(),
    };
    $("entry").hidden = true;
    $("factors-rows").hidden = false;
    $("check").textContent = "ADD PAIR ›";
    renderFactorRows();
  } else {
    fs = null;
    $("entry").hidden = false;
    $("factors-rows").hidden = true;
    $("entry").innerHTML = "&nbsp;";
  }

  renderMeta();

  stopRunTimer();
  $("speedbar").hidden = session.mode !== "speed";
  if (session.mode === "speed") {
    const rec = store.getCard(card.id);
    $("run-best").textContent = rec.ms.length
      ? `BEST ${(Math.min(...rec.ms) / 1000).toFixed(1)}`
      : "BEST –";
    $("run-timer").textContent = "0.0 s";
    runTimer = setInterval(() => {
      if (phase === "answer")
        $("run-timer").textContent = `${((performance.now() - shownAt) / 1000).toFixed(1)} s`;
    }, 100);
  }

  show("card");
  shownAt = performance.now();
}

function renderEntry() {
  $("entry").textContent = entry || " ";
}

/* --- Ops cards (multiplication, division) ------------------------------------------------ */
function submit() {
  if (phase !== "answer" || entry === "") return;
  const card = currentCard(session.round);
  const ms = performance.now() - shownAt;
  const correct = Number(entry) === card.answer;
  const s = session.settings;

  // Tier and stats come from the FIRST attempt only; the retry that clears
  // the round never erases the miss.
  const first = !(card.id in session.round.results);
  recordFirstAttempt(session.round, card.id, correct, ms);
  if (first) {
    const rec = store.getCard(card.id);
    const oldTier = rec.t; // recordAttempt mutates the live record; read first
    if (session.mode === "speed") {
      // Tier and due stay put: a wrong answer against the clock must never
      // cost her scheduled progress, or she will avoid the mode.
      store.recordAttempt(card.id, { correct, ms, newTier: rec.t, due: rec.due });
    } else {
      const newTier = tierAfterAnswer(rec.t, correct, ms, s.promoteMs);
      if (newTier > rec.t) session.promoted++;
      store.recordAttempt(card.id, {
        correct, ms, newTier, due: dueAfter(newTier, session.today),
      });
      maybeCelebratePromotion(card, oldTier, newTier, s.sound.all);
    }
  }
  if (session.mode === "speed")
    $("run-timer").textContent = `${(ms / 1000).toFixed(1)} s`;

  if (correct) {
    const fast = ms <= s.lightningMs;
    phase = "correct-hold";
    $("slab").classList.add("is-correct");
    $("entry").textContent = `${entry} ✔`;
    $("fast-chip").hidden = !fast;
    $("stars").hidden = false;
    requestAnimationFrame(() => $("stars").classList.add("is-burst"));
    audio.cueCorrect(session.runIndex++, s.sound.all && s.sound.blips);
    answerCard(session.round, true);
    advanceTimer = setTimeout(advance, 700);
  } else {
    // Slate and still. No motion, no sound. The correct answer is simply
    // what is on screen when she looks.
    phase = "wrong-hold";
    session.runIndex = 0;
    $("slab").classList.add("is-wrong");
    $("problem").textContent = `${card.text} = ${card.answer}`;
    $("reveal").textContent = `You put ${entry} — we'll come back to it.`;
    $("reveal").hidden = false;
    $("check").textContent = "Next card ›";
    $("check").classList.add("is-next");
    answerCard(session.round, false);
  }
}

/* --- Factors cards --------------------------------------------------------------------------

   Rows are the card's pairs sorted ascending; solved pairs land in their
   sorted slot, and the entry boxes sit at the first unsolved slot. Pairs are
   unordered — (36, 1) fills the 1 x 36 row — and each is accepted once.    */
function renderFactorRows() {
  const rows = fs.card.pairs.map(([a, b], i) => {
    if (fs.solved.has(i)) {
      const fast = fs.solved.get(i).fast;
      const dup = i === fs.dupIndex ? " is-dup" : "";
      return `<li class="frow is-solved${dup}">${a} × ${b} ✔${fast ? ' <i class="orb"></i>' : ""}</li>`;
    }
    return null;
  });
  const entryAt = fs.card.pairs.findIndex((_, i) => !fs.solved.has(i));
  if (entryAt >= 0) {
    const box = (i) =>
      `<b class="fbox${fs.active === i ? " is-focus" : ""}" data-box="${i}">${fs.boxes[i] || "&nbsp;"}</b>`;
    rows[entryAt] =
      `<li class="frow is-entry${fs.wrongShown ? " is-wrong" : ""}">${box(0)} × ${box(1)}</li>`;
    for (let i = entryAt + 1; i < rows.length; i++)
      if (rows[i] === null) rows[i] = `<li class="frow is-todo">? × ?</li>`;
  }
  $("factors-rows").innerHTML = rows.join("");
}

function submitPair() {
  const [a, b] = fs.boxes.map(Number);
  const idx = matchPair(fs.card, a, b);
  fs.boxes = ["", ""];
  fs.active = 0;

  if (idx >= 0 && !fs.solved.has(idx)) {
    const pairMs = performance.now() - fs.pairStart;
    fs.pairStart = performance.now();
    // Per-pair lightning is the orb on the row, never a chip — a chip would
    // flicker eight times on one card (ruling 10).
    const fast = pairMs <= session.settings.lightningMs;
    fs.solved.set(idx, { fast });
    fs.wrongShown = false;
    fs.dupIndex = -1;
    audio.cueCorrect(session.runIndex++, session.settings.sound.all && session.settings.sound.blips);
    renderFactorRows();
    if (fs.solved.size === fs.card.pairs.length) completeFactorCard();
  } else if (idx >= 0) {
    // Already found: mark the row she solved (ruling 10) — an
    // acknowledgement, not a miss. Clears on her next input.
    fs.wrongShown = false;
    fs.dupIndex = idx;
    renderFactorRows();
  } else {
    // Wrong pair: slate on the entry row, silent, and it stays until she
    // types again. No answer is revealed — finding them is the exercise.
    fs.wrongs++;
    session.runIndex = 0;
    fs.wrongShown = true;
    fs.dupIndex = -1;
    renderFactorRows();
  }
}

function completeFactorCard() {
  const s = session.settings;
  const totalMs = performance.now() - fs.cardStart;
  // The spec measures factors fluency per pair, not per card.
  const avgMs = totalMs / fs.card.pairs.length;
  const correct = fs.wrongs === 0;

  // avg drives session lightning stats; the persisted time is the total.
  recordFirstAttempt(session.round, fs.card.id, correct, avgMs);
  const rec = store.getCard(fs.card.id);
  const oldTier = rec.t; // recordAttempt mutates the live record; read first
  const newTier = tierAfterAnswer(rec.t, correct, avgMs, s.promoteMs);
  if (newTier > rec.t) session.promoted++;
  store.recordAttempt(fs.card.id, {
    correct, ms: totalMs, newTier, due: dueAfter(newTier, session.today),
  });
  maybeCelebratePromotion(fs.card, oldTier, newTier, s.sound.all);

  // A completed factors card never requeues: every pair was eventually
  // entered correctly, which is what "answered correctly" means here. A
  // wrong pair along the way already counted as the miss.
  answerCard(session.round, true);
  phase = "correct-hold";
  $("slab").classList.add("is-correct");
  if (correct) {
    $("stars").hidden = false;
    requestAnimationFrame(() => $("stars").classList.add("is-burst"));
  }
  clearTimeout(fastChipTimer);
  $("fast-chip").hidden = !(correct && avgMs <= s.lightningMs);
  advanceTimer = setTimeout(advance, 700);
}

function factorType(d) {
  if (fs.boxes[fs.active].length >= 3) return;
  fs.boxes[fs.active] += d;
  fs.wrongShown = false;
  fs.dupIndex = -1;
  renderFactorRows();
}

// Tapping either box of the live row focuses it — a typo in the first
// number must not cost the pair (ruling 10).
$("factors-rows").addEventListener("click", (e) => {
  const box = e.target.closest(".fbox");
  if (!box || phase !== "answer" || !fs) return;
  fs.active = Number(box.dataset.box);
  renderFactorRows();
});

function factorCheck() {
  if (fs.boxes[0] !== "" && fs.boxes[1] !== "") submitPair();
  else if (fs.active === 0 && fs.boxes[0] !== "") { fs.active = 1; renderFactorRows(); }
}

function factorBack() {
  if (fs.boxes[fs.active] === "" && fs.active === 1) fs.active = 0;
  else fs.boxes[fs.active] = fs.boxes[fs.active].slice(0, -1);
  fs.wrongShown = false;
  renderFactorRows();
}

/* --- Shared input routing --------------------------------------------------------------- */
function advance() {
  clearTimeout(advanceTimer);
  if (!session || phase === "between") return;
  if (roundDone(session.round)) return finishRound();
  nextCardScreen();
}

function typeDigit(d) {
  if (session.kind === "factors") return factorType(d);
  if (entry.length >= 3) return;
  entry += d;
  renderEntry();
  // Auto check: ops decks only — a factor's length is unknowable in advance,
  // so factors always use CHECK to move and submit.
  if (store.get("settings").autoSubmit &&
      entry.length === expectedDigits(currentCard(session.round))) {
    submit();
  }
}

$("keypad").addEventListener("click", (e) => {
  if ($("screen-card").hidden || !session) return; // same guard as its siblings
  if (leaveArmTimer) disarmLeave(); // typing again means she chose to stay
  const key = e.target.closest(".key");
  if (!key || phase !== "answer") return;
  if (key.dataset.act === "clear") {
    if (session.kind === "factors") { fs.boxes = ["", ""]; fs.active = 0; fs.wrongShown = false; renderFactorRows(); }
    else { entry = ""; renderEntry(); }
  } else if (key.dataset.act === "back") {
    if (session.kind === "factors") factorBack();
    else { entry = entry.slice(0, -1); renderEntry(); }
  } else typeDigit(key.dataset.d);
});

$("check").addEventListener("click", () => {
  if ($("screen-card").hidden || !session) return;
  if (phase === "answer") {
    if (session.kind === "factors") factorCheck();
    else submit();
  } else advance(); // correct-hold: skip the wait; wrong-hold: move on
});

// Desktop convenience — she'll use the keypad, you'll use a keyboard.
document.addEventListener("keydown", (e) => {
  if ($("screen-card").hidden || !session) return;
  if (phase !== "answer") { if (e.key === "Enter") advance(); return; }
  if (/^[0-9]$/.test(e.key)) typeDigit(e.key);
  else if (e.key === "Backspace") {
    if (session.kind === "factors") factorBack();
    else { entry = entry.slice(0, -1); renderEntry(); }
  } else if (e.key === "Enter") {
    if (session.kind === "factors") factorCheck();
    else submit();
  }
});

/* --- Round cleared --------------------------------------------------------------------- */

// The table she missed most this round, for the targeted Tricks link
// (TRICKS_WORK_ORDER C1): only when one table accounts for two or more
// misses. Ops decks only — a factors card has no single table. Round state
// only; nothing is stored.
function missedTable(round, kind) {
  if (kind === "factors") return null;
  const counts = {};
  for (const [id, r] of Object.entries(round.results)) {
    if (r.correct) continue;
    let a, b;
    if (id.startsWith("m:")) {
      [a, b] = id.slice(2).split("x").map(Number);
    } else {
      const [p, d] = id.slice(2).split("/").map(Number);
      b = d;
      a = p / d;
    }
    for (const f of new Set([a, b])) counts[f] = (counts[f] || 0) + 1;
  }
  let best = null;
  for (const [f, c] of Object.entries(counts)) {
    const table = Number(f);
    if (c >= 2 && (!best || c > best.count || (c === best.count && table > best.table)))
      best = { table, count: c };
  }
  return best;
}

function finishRound() {
  phase = "between"; // a stray tap must not re-bank the round
  stopRunTimer();
  const s = session.settings;
  const stats = roundStats(session.round, s.lightningMs);
  session.banked += stats.emeralds;
  session.firstTry += stats.firstTry;
  session.fast += stats.fast;
  session.cardsCleared += stats.total;
  store.flushNow();

  const last = session.roundIndex === session.rounds.length - 1;
  if (last) return finishSession();

  $("cleared-title").textContent = `Round ${session.roundIndex + 1} cleared`;
  $("cleared-stats").innerHTML = [
    ...(stats.clean ? [["clean round", "✔"]] : []),
    [`emeralds earned`, `${stats.emeralds}`],
    [`lightning-fast answers`, `${stats.fast}`],
  ].map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join("");
  const done = (session.roundIndex + 1) / session.rounds.length;
  $("round-fill").style.width = `${done * 100}%`;
  $("round-label").textContent = `ROUND ${session.roundIndex + 1} OF ${session.rounds.length}`;
  const miss = missedTable(session.round, session.kind);
  $("cleared-trick").hidden = !miss;
  if (miss) {
    $("cleared-trick").textContent =
      `×${miss.table} came up ${miss.count === 2 ? "twice" : `${miss.count} times`}. Want the trick? ›`;
    $("cleared-trick").dataset.table = miss.table;
  }
  audio.cueRoundCleared(s.sound.all);
  show("cleared");
}

$("next-round").addEventListener("click", () => {
  session.roundIndex++;
  session.round = createRound(session.rounds[session.roundIndex]);
  session.runIndex = 0;
  nextCardScreen();
});
$("stop-here").addEventListener("click", finishSession);

/* --- Session complete: the one place emeralds are released ------------------------------- */
function finishSession() {
  const s = session.settings;
  const banked = session.banked;
  const oldBalance = store.get("profile").emeralds;
  store.addEmeralds(banked);
  const streakCount = store.bumpStreak(session.today);
  store.logSession({
    day: session.today,
    deck: session.deckKey,
    mode: session.mode,
    cards: session.cardsCleared,
    firstTry: session.firstTry,
    fast: session.fast,
    emeralds: banked,
    promoted: session.promoted,
    seconds: Math.round((Date.now() - session.startedAt) / 1000),
  });
  store.flushNow();
  stopRunTimer();

  const name = store.get("profile").name || "";
  $("complete-note").textContent = name ? `Great job, ${name}!` : "Great job!";
  $("complete-stats").innerHTML = [
    [`cards cleared`, session.cardsCleared],
    [`lightning-fast`, session.fast],
    [`facts moved up a tier`, session.promoted],
    [`streak`, `★ ${streakCount}`],
  ].map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join("");
  session = null;
  show("complete");
  audio.cueAward(s.sound.all);
  playAward(banked, oldBalance);
}

/* --- The award chain (2m): +N rolls from 0, eight emeralds arc into the
   balance, the counter answers each landing, and the closing lines hold back
   until the last one lands. State is already final before any of this plays,
   so an interruption can cost only the show, never the emeralds.            */
function playAward(banked, oldBalance) {
  const balEl = $("complete-balance");
  const award = $("award-count");
  const finalBal = oldBalance + banked;
  const setBal = (v) => { balEl.innerHTML = `<span class="gem"></span> ${v}`; };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden;

  const note = $("complete-note");
  const stats = $("complete-stats");
  const finish = () => {
    award.textContent = `+${banked}`;
    setBal(finalBal);
    note.classList.remove("fade-wait");
    stats.classList.remove("fade-wait");
  };

  setBal(oldBalance);
  if (reduce) { finish(); return; }
  note.classList.add("fade-wait");
  stats.classList.add("fade-wait");

  // +N rolls from 0 over 500ms in stepped increments.
  award.textContent = "+0";
  let step = 0;
  const roll = setInterval(() => {
    step++;
    award.textContent = `+${Math.round((banked * step) / 10)}`;
    if (step >= 10) clearInterval(roll);
  }, 50);

  // Eight emeralds spawn at the big gem, staggered 60ms, and arc down into
  // the balance chip, shrinking as they go.
  const from = $("award-gem").getBoundingClientRect();
  const to = balEl.getBoundingClientRect();
  const per = Math.floor(banked / 8);
  let shown = oldBalance;
  let landed = 0;
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const g = document.createElement("i");
      g.className = "arc-gem";
      g.style.left = `${from.left + from.width / 2 - 8 + (i - 3.5) * 6}px`;
      g.style.top = `${from.top + from.height / 2 - 8}px`;
      document.body.appendChild(g);
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      setTimeout(() => { g.style.transform = `translate(${dx}px, ${dy}px) scale(0.38)`; }, 20);
      setTimeout(() => {
        g.remove();
        landed++;
        shown = landed === 8 ? finalBal : shown + per;
        setBal(shown);
        balEl.classList.remove("is-pulse");
        void balEl.offsetWidth;
        balEl.classList.add("is-pulse");
        if (landed === 8) setTimeout(finish, 200);
      }, 620);
    }, 350 + i * 60);
  }
}
$("go-home").addEventListener("click", renderHome);

/* --- Your materials (2n): pushed from Home's YOUR MATERIALS card ---------------

   Her side of the fact grid: the same five materials, aggregated. Counts,
   never percentages, and no accuracy figure anywhere — a fact she has not
   learnt yet is a wood block, not a miss.                                   */
const NUMBER_WORDS = {
  2: "twos", 3: "threes", 4: "fours", 5: "fives", 6: "sixes", 7: "sevens",
  8: "eights", 9: "nines", 10: "tens", 11: "elevens", 12: "twelves",
};

// The hint points at the table with the most wood facts — the seam worth
// mining next. Quiet when there is no clear signal.
function nextUpHint() {
  const wood = DECKS.mult.cards.filter((c) => store.getCard(c.id).t === 0);
  if (!wood.length) return null;
  const byFactor = {};
  for (const c of wood) {
    const [a, b] = c.id.slice(2).split("x").map(Number);
    for (const f of new Set([a, b])) byFactor[f] = (byFactor[f] || 0) + 1;
  }
  const [factor, n] = Object.entries(byFactor)
    .map(([f, count]) => [Number(f), count])
    .sort((x, y) => y[1] - x[1])[0];
  if (n < 3) return null;
  return {
    title: `Next up: the ${NUMBER_WORDS[factor]}`,
    sub: `${n} of your ${wood.length} wood fact${wood.length === 1 ? "" : "s"} ${n === 1 ? "is" : "are"} × ${factor}`,
  };
}

function renderMaterials() {
  const p = store.get("profile");
  const streak = store.get("streak");
  $("materials-clock").textContent = fmtClock();
  $("materials-avatar").src = `assets/${p.avatar}.png`;
  $("materials-name").textContent = p.name || "friend";
  const mastered = Object.keys(DECKS).reduce((n, k) => n + tierCounts(k)[4], 0);
  $("materials-sub").textContent =
    `${store.streakAlive() ? `${streak.count} day streak · ` : ""}${mastered} fact${mastered === 1 ? "" : "s"} mastered`;
  $("materials-emeralds").textContent = p.emeralds;
  $("materials-decks").innerHTML = Object.keys(DECKS).map((k) => {
    const counts = tierCounts(k);
    return `<div class="tiercard">
      <div class="tiercard__head"><span>${DECKS[k].name}</span><b>${counts[4]} diamond</b></div>
      ${tierBarHtml(counts)}
      <div class="tiercard__counts">${counts
        .map((n, i) => `<span>${n} ${i === 4 ? "◆" : TIER_LABELS[i].toUpperCase()}</span>`)
        .join("")}</div>
    </div>`;
  }).join("");
  const hint = nextUpHint();
  $("materials-next").hidden = !hint;
  if (hint) {
    $("nextup-title").textContent = hint.title;
    $("nextup-sub").textContent = hint.sub;
  }
  show("materials");
}

$("home-materials").addEventListener("click", renderMaterials);
$("materials-back").addEventListener("click", renderHome);

/* --- My Look (board 5d): reached from the avatar's pencil badge ----------------

   Her screen, no PIN. A world repaints the trim strip and label accents
   only — the three semantic greens are meaning, not decoration, and never
   move.                                                                     */
const AVATARS = [
  ["av-stormy", "Stormy"], ["av-axolotl", "Axolotl"], ["av-bear", "Bear"],
  ["av-shadow", "Shadow"], ["av-cat", "Cat"], ["av-fox", "Fox"],
  ["av-panda", "Panda"], ["av-bee", "Bee"], ["av-steve", "Steve"],
  ["av-alex", "Alex"], ["av-creeper", "Creeper"],
];
const THEMES = [
  ["overworld", "Overworld"], ["nether", "Nether"], ["end", "End"],
  ["ocean", "Ocean"], ["cherry", "Cherry Grove"],
];

function renderMe() {
  const p = store.get("profile");
  $("me-clock").textContent = fmtClock();
  $("avatar-grid").innerHTML = AVATARS.map(([key, label]) =>
    `<button class="slot${key === p.avatar ? " is-picked" : ""}" data-av="${key}" aria-label="${label}">
       <img src="assets/${key}.png" alt=""></button>`).join("");
  $("theme-list").innerHTML = THEMES.map(([key, label]) => {
    const picked = key === (p.theme || "overworld");
    return `<button class="trow${picked ? " is-picked" : ""}" data-th="${key}">
       <span class="trow__tri"><i class="sw--${key}-1"></i><i class="sw--${key}-2"></i><i class="sw--${key}-3"></i></span>
       <span class="trow__name">${label}</span>
       ${picked ? '<span class="trow__wearing">WEARING</span>' : ""}
     </button>`;
  }).join("");
  show("me");
}

$("go-me").addEventListener("click", () => renderMe());
$("me-back").addEventListener("click", renderHome);

$("avatar-grid").addEventListener("click", (e) => {
  const slot = e.target.closest(".slot");
  if (!slot) return;
  const p = store.get("profile");
  p.avatar = slot.dataset.av;
  store.touch("profile");
  audio.cuePick(store.get("settings").sound.all);
  renderMe();
});

$("theme-list").addEventListener("click", (e) => {
  const row = e.target.closest(".trow");
  if (!row) return;
  const p = store.get("profile");
  p.theme = row.dataset.th;
  store.touch("profile");
  document.documentElement.dataset.theme = p.theme;
  audio.cuePick(store.get("settings").sound.all);
  renderMe();
});

/* --- Tricks (src/tricks.js): two doors, both ruled ------------------------------
   Deck select is the primary door; Round cleared offers the targeted link.
   Home is refused, and so is the wrong-answer state — nothing appears on a
   failure-adjacent state. */
const tricks = initTricks({
  show,
  backToSelect: renderSelect,
  backToCleared: () => show("cleared"),
});
$("go-tricks").addEventListener("click", tricks.openPicker);
$("cleared-trick").addEventListener("click", () => {
  tricks.openTrickFor(Number($("cleared-trick").dataset.table), "cleared");
});

initParent({ show, renderHome });
renderHome();
