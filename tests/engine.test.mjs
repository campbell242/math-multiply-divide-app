// Run: node tests/engine.test.mjs
// Plain asserts, no framework — the project has no dependencies and this
// keeps it that way.

import assert from "node:assert/strict";
import {
  multiplicationDeck, divisionDeck, roundSizes, splitIntoRounds,
  createRound, currentCard, answerCard, recordFirstAttempt, roundDone,
  tierAfterAnswer, dueAfter, roundEmeralds, roundStats,
  factorsDeck, factorPairs, matchPair,
} from "../src/engine.js";

// localStorage shim so store.js loads under node.
const backing = new Map();
globalThis.localStorage = {
  getItem: (k) => (backing.has(k) ? backing.get(k) : null),
  setItem: (k, v) => backing.set(k, String(v)),
  removeItem: (k) => backing.delete(k),
};

const store = await import("../src/store.js");

let n = 0;
function test(name, fn) { fn(); n++; console.log("ok -", name); }

/* --- decks --- */
test("multiplication deck is 121 distinct ordered pairs", () => {
  const deck = multiplicationDeck();
  assert.equal(deck.length, 121);
  assert.equal(new Set(deck.map((c) => c.id)).size, 121);
  const c = deck.find((x) => x.id === "m:7x8");
  assert.equal(c.answer, 56);
  assert.ok(deck.some((x) => x.id === "m:8x7"), "8x7 is a separate card");
});

test("division deck is 121 cards with quotient answers", () => {
  const deck = divisionDeck();
  assert.equal(deck.length, 121);
  const c = deck.find((x) => x.id === "d:56/8");
  assert.equal(c.answer, 7);
});

/* --- rounds --- */
test("121 at size 40 -> 41/40/40, front-loaded", () => {
  assert.deepEqual(roundSizes(121, 40), [41, 40, 40]);
});
test("53 at size 12 -> five rounds, none over 12", () => {
  assert.deepEqual(roundSizes(53, 12), [11, 11, 11, 10, 10]);
});
test("edge sizes", () => {
  assert.deepEqual(roundSizes(40, 40), [40]);
  assert.deepEqual(roundSizes(41, 40), [41]); // one over nominal is allowed
  assert.deepEqual(roundSizes(42, 40), [21, 21]);
  assert.deepEqual(roundSizes(1, 40), [1]);
  assert.deepEqual(roundSizes(0, 40), []);
});
test("splitIntoRounds keeps every card exactly once", () => {
  const deck = multiplicationDeck();
  const rounds = splitIntoRounds(deck, 40);
  const ids = rounds.flat().map((c) => c.id);
  assert.equal(ids.length, 121);
  assert.equal(new Set(ids).size, 121);
});

/* --- clearing rule --- */
test("missed card returns to the back and the round only ends clean", () => {
  const cards = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const r = createRound(cards);
  assert.equal(currentCard(r).id, "a");
  answerCard(r, false);                 // a missed -> back of queue
  recordFirstAttempt(r, "a", false, 4000);
  answerCard(r, true); recordFirstAttempt(r, "b", true, 2000);
  answerCard(r, true); recordFirstAttempt(r, "c", true, 6000);
  assert.equal(currentCard(r).id, "a"); // a came back
  assert.ok(!roundDone(r));
  answerCard(r, true);
  recordFirstAttempt(r, "a", true, 1500); // ignored: first attempt already recorded
  assert.ok(roundDone(r));
  assert.equal(r.results["a"].correct, false, "retry does not erase the miss");
});

/* --- tiers --- */
test("tier transitions match the spec", () => {
  assert.equal(tierAfterAnswer(2, true, 3000, 5000), 3);  // fast correct promotes
  assert.equal(tierAfterAnswer(2, true, 8000, 5000), 2);  // slow correct holds
  assert.equal(tierAfterAnswer(2, false, 1000, 5000), 1); // wrong demotes one
  assert.equal(tierAfterAnswer(0, false, 1000, 5000), 0); // never below wood
  assert.equal(tierAfterAnswer(4, true, 1000, 5000), 4);  // never above diamond
  assert.equal(tierAfterAnswer(3, true, 5000, 5000), 4);  // exactly at threshold promotes
});
test("a correct answer waits its tier's interval, wood included", () => {
  assert.equal(dueAfter(0, 100, true), 101); // wood no longer returns same-session
  assert.equal(dueAfter(1, 100, true), 101);
  assert.equal(dueAfter(2, 100, true), 103);
  assert.equal(dueAfter(3, 100, true), 107);
  assert.equal(dueAfter(4, 100, true), 116);
});
test("a miss comes back the same session at every tier", () => {
  for (let tier = 0; tier <= 4; tier++)
    assert.equal(dueAfter(tier, 100, false), 100, `tier ${tier} miss returns today`);
});
test("a wrong answer demotes one tier AND returns today", () => {
  // The two rules compose: demotion still caps at wood, and the card is due
  // now regardless of where it landed.
  const tier = tierAfterAnswer(4, false, 1000, 5000);
  assert.equal(tier, 3, "diamond demotes to gold");
  assert.equal(dueAfter(tier, 100, false), 100, "but returns this session, not in 7 days");
});

/* --- emeralds & stats --- */
test("clean round of 40 pays 14 (the design sample's number)", () => {
  assert.equal(roundEmeralds(40, true), 14);
  assert.equal(roundEmeralds(40, false), 10);
  assert.equal(roundEmeralds(12, true), 5);
});
test("roundStats counts fast and clean from first attempts only", () => {
  const r = createRound([{ id: "a" }, { id: "b" }]);
  answerCard(r, true); recordFirstAttempt(r, "a", true, 2000);
  answerCard(r, true); recordFirstAttempt(r, "b", true, 4000);
  const s = roundStats(r, 3000);
  assert.deepEqual(
    { total: s.total, firstTry: s.firstTry, fast: s.fast, clean: s.clean },
    { total: 2, firstTry: 2, fast: 1, clean: true },
  );
});

/* --- store --- */
test("store: init, attempts, ms cap, streak", () => {
  store.initStore();
  for (let i = 0; i < 13; i++)
    store.recordAttempt("m:7x8", { correct: true, ms: 2000 + i, newTier: 1, due: 5 });
  const c = store.getCard("m:7x8");
  assert.equal(c.n, 13);
  assert.equal(c.ms.length, 10, "ms capped at 10");
  assert.equal(c.ms[9], 2012, "newest kept");

  assert.equal(store.bumpStreak(100), 1);
  assert.equal(store.bumpStreak(100), 1, "same day does not double-count");
  assert.equal(store.bumpStreak(101), 2);
  assert.equal(store.bumpStreak(104), 1, "gap resets silently");
  store.get("streak").excused.push(105);
  store.bumpStreak(104 + 0); // no-op same day
  assert.equal(store.bumpStreak(106), 2, "excused day bridges the gap");
});

test("store: corrupt JSON is quarantined, not wiped", () => {
  backing.set("mt.cards", "{not json");
  store.initStore();
  assert.deepEqual(store.get("cards"), {});
  const quarantined = [...backing.keys()].find((k) => k.startsWith("mt.corrupt.cards."));
  assert.ok(quarantined, "corrupt blob preserved");
  assert.equal(backing.get(quarantined), "{not json");
});

test("store: defaults merge under stored settings (new fields appear)", () => {
  backing.set("mt.settings", JSON.stringify({ promoteMs: 4000 }));
  store.initStore();
  const s = store.get("settings");
  assert.equal(s.promoteMs, 4000, "stored value wins");
  assert.equal(s.autoSubmit, true, "new default present");
  assert.equal(s.lightningMs, 3000);
});

test("store: v1 data migrates autoSubmit on once, then remembers the choice", () => {
  backing.clear();
  backing.set("mt.schema", "1");
  backing.set("mt.settings", JSON.stringify({ autoSubmit: false }));
  store.initStore();
  assert.equal(store.get("settings").autoSubmit, true, "migration flips it on");
  assert.equal(backing.get("mt.schema"), "2", "schema stamped after migrating");
  assert.equal(JSON.parse(backing.get("mt.settings")).autoSubmit, true, "flip persisted");

  store.get("settings").autoSubmit = false; // the toggle turns it off...
  store.touch("settings");
  store.flushNow();
  store.initStore(); // ...and a reload keeps it off: no re-flip at schema 2
  assert.equal(store.get("settings").autoSubmit, false, "off survives reload");
});

/* --- factors --- */
test("factors deck matches the computed spec table exactly", () => {
  const deck = factorsDeck();
  assert.equal(deck.length, 53);
  assert.equal(deck.reduce((s, c) => s + c.pairs.length, 0), 192);
  const dist = {};
  for (const c of deck) dist[c.pairs.length] = (dist[c.pairs.length] ?? 0) + 1;
  assert.deepEqual(dist, { 2: 17, 3: 12, 4: 11, 5: 4, 6: 7, 8: 2 });
  assert.equal(deck[0].n, 4);
  assert.equal(deck.at(-1).n, 144);
});
test("factor pairs include 1 x n and the square-root pair once", () => {
  assert.deepEqual(factorPairs(36), [[1, 36], [2, 18], [3, 12], [4, 9], [6, 6]]);
  assert.deepEqual(factorPairs(144),
    [[1, 144], [2, 72], [3, 48], [4, 36], [6, 24], [8, 18], [9, 16], [12, 12]]);
});
test("matchPair is unordered and rejects non-factors", () => {
  const card = factorsDeck().find((c) => c.n === 36);
  assert.equal(matchPair(card, 1, 36), 0);
  assert.equal(matchPair(card, 36, 1), 0, "either order is the same answer");
  assert.equal(matchPair(card, 9, 4), 3);
  assert.equal(matchPair(card, 6, 6), 4);
  assert.equal(matchPair(card, 5, 7), -1);
});

/* --- backup --- */
test("backup round-trips wholesale and stamps lastBackupDay", () => {
  backing.clear();
  store.initStore();
  store.recordAttempt("m:7x8", { correct: true, ms: 2000, newTier: 2, due: 103 });
  store.addEmeralds(50);
  store.bumpStreak(200);
  const dump = store.exportBackup();
  assert.equal(dump.format, "times-table-backup");
  assert.equal(dump.data.profile.emeralds, 50);
  assert.ok(dump.data.settings.lastBackupDay !== null);

  backing.clear();
  store.initStore(); // fresh device
  assert.equal(store.get("profile").emeralds, 0);
  const res = store.importBackup(JSON.parse(JSON.stringify(dump)));
  assert.equal(res.ok, true);
  assert.equal(store.get("profile").emeralds, 50);
  assert.equal(store.getCard("m:7x8").t, 2);
  assert.equal(store.get("streak").count, 1);
});
test("import runs migrations on an older backup", () => {
  const res = store.importBackup({
    format: "times-table-backup",
    schema: 1,
    data: { settings: { autoSubmit: false } },
  });
  assert.equal(res.ok, true);
  assert.equal(store.get("settings").autoSubmit, true, "v1 backup migrated on import");
});
test("import rejects wrong format and newer schema, touching nothing", () => {
  const before = store.get("profile").emeralds;
  assert.equal(store.importBackup({ hello: 1 }).ok, false);
  assert.equal(store.importBackup({ format: "times-table-backup", schema: 999, data: {} }).ok, false);
  assert.equal(store.get("profile").emeralds, before, "failed import must not alter state");
});
test("resetDeck erases only that deck's records", () => {
  store.recordAttempt("m:2x2", { correct: true, ms: 1000, newTier: 1, due: 5 });
  store.recordAttempt("d:4/2", { correct: true, ms: 1000, newTier: 3, due: 9 });
  store.resetDeck("m:");
  assert.equal(store.getCard("m:2x2").n, 0, "mult record gone");
  assert.equal(store.getCard("d:4/2").t, 3, "division record untouched");
});
test("excused today bridges tomorrow's gap", () => {
  backing.clear();
  store.initStore();
  store.bumpStreak(300);
  store.excuseToday(301);        // parent excuses the skipped day
  assert.equal(store.bumpStreak(302), 2, "excused day does not break the streak");
});

console.log(`\n${n} tests passed`);
