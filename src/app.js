// Controller: wires screens to the engine and the store. All practice logic
// lives in engine.js; all persistence in store.js. This file owns nothing
// but the seams between them and the DOM.

import {
  multiplicationDeck, divisionDeck, splitIntoRounds, shuffle,
  createRound, currentCard, answerCard, recordFirstAttempt, roundDone,
  tierAfterAnswer, dueAfter, roundStats,
} from "./engine.js";
import * as store from "./store.js";
import * as audio from "./audio.js";

const $ = (id) => document.getElementById(id);
const screens = ["home", "select", "card", "cleared", "complete"];

function show(name) {
  // Instant, per the motion rules: a child taps fast and transitions are a tax.
  for (const s of screens) $(`screen-${s}`).hidden = s !== name;
}

/* --- Decks --------------------------------------------------------------------

   Keyed by the settings.decks key, so the parent toggle and the picker speak
   the same language. Factors joins here when its interaction is built.      */
const DECKS = {
  mult: { name: "Multiplication", cards: multiplicationDeck() },
  div:  { name: "Division",       cards: divisionDeck() },
};

/* --- Boot ------------------------------------------------------------------- */
const { storageOk } = store.initStore();
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
  $("home-note").textContent = storageOk
    ? (due ? `${due} ${due === 1 ? "card is" : "cards are"} ready for you.` : "All caught up — nothing due right now.")
    : "Heads up: progress won't be saved on this browser.";
  show("home");
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
  $("mode-smart").classList.toggle("is-on", mode === "smart");
  $("mode-full").classList.toggle("is-on", mode === "full");

  for (const key of Object.keys(DECKS)) {
    const btn = $(`deck-${key}`);
    const on = enabled.includes(key);
    btn.disabled = !on;
    btn.classList.toggle("is-on", on && key === deckKey);
    btn.querySelector(".pick__sub").textContent = on
      ? `${dueCount(key)} of ${DECKS[key].cards.length} due`
      : "turned off";
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
for (const key of Object.keys(DECKS)) {
  $(`deck-${key}`).addEventListener("click", () => {
    deckKey = key;
    // Smart eligibility depends on the deck now picked, so re-derive.
    renderSelect();
  });
}
$("auto-toggle").addEventListener("click", () => {
  const s = store.get("settings");
  s.autoSubmit = !s.autoSubmit;
  store.touch("settings");
  renderSelect();
});

/* --- Session state ------------------------------------------------------------------ */
let session = null;

function startSession() {
  const today = store.dayNumber();
  const settings = store.get("settings");
  const deck = DECKS[deckKey];
  const pool = mode === "smart"
    ? deck.cards.filter((c) => store.getCard(c.id).due <= today)
    : deck.cards;
  const rounds = splitIntoRounds(shuffle(pool), settings.roundSize);
  session = {
    mode, today, settings, deckKey,
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
$("card-back").addEventListener("click", () => { session = null; renderHome(); });

/* --- The card ------------------------------------------------------------------------- */
let entry = "";
let shownAt = 0;
let phase = "answer"; // "answer" | "correct-hold" | "wrong-hold" | "between"
let advanceTimer = null;

function expectedDigits(card) {
  return String(card.answer).length;
}

function renderMeta() {
  const r = session.round;
  $("card-meta").textContent = session.mode === "smart"
    ? `SMART ${Math.min(r.cleared + 1, r.total)} / ${r.total}`
    : `ROUND ${session.roundIndex + 1} OF ${session.rounds.length}`;
}

function nextCardScreen() {
  const card = currentCard(session.round);
  entry = "";
  phase = "answer";
  clearTimeout(advanceTimer);
  $("slab").classList.remove("is-correct", "is-wrong");
  $("stars").classList.remove("is-burst");
  $("stars").hidden = true;
  $("fast-chip").hidden = true;
  $("reveal").hidden = true;
  $("problem").textContent = card.text;
  $("entry").innerHTML = "&nbsp;";
  $("check").textContent = "CHECK ›";
  $("check").classList.remove("is-next");
  renderMeta();
  show("card");
  shownAt = performance.now();
}

function renderEntry() {
  $("entry").textContent = entry || " ";
}

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
    const newTier = tierAfterAnswer(rec.t, correct, ms, s.promoteMs);
    if (newTier > rec.t) session.promoted++;
    store.recordAttempt(card.id, {
      correct, ms, newTier, due: dueAfter(newTier, session.today),
    });
  }

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
    $("reveal").textContent = `${card.text} = ${card.answer} — we'll come back to it.`;
    $("reveal").hidden = false;
    $("check").textContent = "NEXT ›";
    $("check").classList.add("is-next");
    answerCard(session.round, false);
  }
}

function advance() {
  clearTimeout(advanceTimer);
  if (!session || phase === "between") return;
  if (roundDone(session.round)) return finishRound();
  nextCardScreen();
}

function typeDigit(d) {
  if (entry.length >= 3) return;
  entry += d;
  renderEntry();
  // Auto check: hand the answer in the moment it is long enough. OFF means
  // CHECK is the deliberate extra step and she can edit freely first.
  if (store.get("settings").autoSubmit &&
      entry.length === expectedDigits(currentCard(session.round))) {
    submit();
  }
}

$("keypad").addEventListener("click", (e) => {
  const key = e.target.closest(".key");
  if (!key || phase !== "answer") return;
  if (key.dataset.act === "clear") { entry = ""; renderEntry(); }
  else if (key.dataset.act === "back") { entry = entry.slice(0, -1); renderEntry(); }
  else typeDigit(key.dataset.d);
});

$("check").addEventListener("click", () => {
  if ($("screen-card").hidden || !session) return;
  if (phase === "answer") submit();
  else advance(); // correct-hold: skip the wait; wrong-hold: move on
});

// Desktop convenience — she'll use the keypad, you'll use a keyboard.
document.addEventListener("keydown", (e) => {
  if ($("screen-card").hidden || !session) return;
  if (phase !== "answer") { if (e.key === "Enter") advance(); return; }
  if (/^[0-9]$/.test(e.key)) typeDigit(e.key);
  else if (e.key === "Backspace") { entry = entry.slice(0, -1); renderEntry(); }
  else if (e.key === "Enter") submit();
});

/* --- Round cleared --------------------------------------------------------------------- */
function finishRound() {
  phase = "between"; // a stray tap must not re-bank the round
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
    [`right first try`, `${stats.firstTry} / ${stats.total}`],
    [`emeralds earned`, `${stats.emeralds}${stats.clean ? " · clean round!" : ""}`],
    [`lightning-fast answers`, `${stats.fast}`],
  ].map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join("");
  const done = (session.roundIndex + 1) / session.rounds.length;
  $("round-fill").style.width = `${done * 100}%`;
  $("round-label").textContent = `ROUND ${session.roundIndex + 1} OF ${session.rounds.length}`;
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
  store.addEmeralds(session.banked);
  const streakCount = store.bumpStreak(session.today);
  store.logSession({
    day: session.today,
    deck: session.deckKey,
    mode: session.mode,
    cards: session.cardsCleared,
    firstTry: session.firstTry,
    fast: session.fast,
    emeralds: session.banked,
    promoted: session.promoted,
    seconds: Math.round((Date.now() - session.startedAt) / 1000),
  });
  store.flushNow();

  const name = store.get("profile").name || "";
  $("award-count").textContent = `+${session.banked}`;
  $("complete-note").textContent = name ? `Great job, ${name}!` : "Great job!";
  $("complete-stats").innerHTML = [
    [`cards cleared`, session.cardsCleared],
    [`lightning-fast`, session.fast],
    [`facts moved up a tier`, session.promoted],
    [`streak`, `★ ${streakCount}`],
  ].map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join("");
  audio.cueAward(s.sound.all);
  session = null;
  show("complete");
}
$("go-home").addEventListener("click", renderHome);

renderHome();
