// Pure practice logic: decks, rounds, tiers, scoring. No DOM, no storage —
// everything here runs identically in the browser and under node's test file.

export const TIERS = ["wood", "stone", "iron", "gold", "diamond"];

// Days until a card at this tier comes due again once she has answered it
// CORRECTLY. A miss ignores this table entirely — see dueAfter. Wood and
// Stone share an interval of 1: the tiers still differ as progress (how far
// from Iron she is), they just no longer differ in when the card returns.
export const TIER_INTERVALS = [1, 1, 3, 7, 16];

/* --- Decks ---------------------------------------------------------------- */

// Ordered pairs kept distinct on purpose: recall of 7x8 and 8x7 genuinely
// differs at this age (docs/PRODUCT_SPEC.md).
export function multiplicationDeck() {
  const cards = [];
  for (let a = 2; a <= 12; a++)
    for (let b = 2; b <= 12; b++)
      cards.push({ id: `m:${a}x${b}`, text: `${a} × ${b}`, answer: a * b });
  return cards;
}

export function divisionDeck() {
  const cards = [];
  for (let a = 2; a <= 12; a++)
    for (let b = 2; b <= 12; b++)
      cards.push({ id: `d:${a * b}/${b}`, text: `${a * b} ÷ ${b}`, answer: a });
  return cards;
}

/* --- Rounds ---------------------------------------------------------------

   The spec pins two concrete outcomes: 121 cards at round size 40 make three
   rounds of 41/40/40, and 53 factors cards at size 12 make five rounds. The
   rule that yields both: a round may exceed the nominal size by at most one,
   so numRounds = ceil(n / (size + 1)), cards spread evenly, remainder
   front-loaded — the longest round lands while she is freshest.           */
export function roundSizes(n, roundSize) {
  if (n <= 0) return [];
  const rounds = Math.max(1, Math.ceil(n / (roundSize + 1)));
  const base = Math.floor(n / rounds);
  const rem = n % rounds;
  return Array.from({ length: rounds }, (_, i) => base + (i < rem ? 1 : 0));
}

export function splitIntoRounds(cards, roundSize) {
  const sizes = roundSizes(cards.length, roundSize);
  const out = [];
  let at = 0;
  for (const size of sizes) out.push(cards.slice(at, (at += size)));
  return out;
}

// Fisher-Yates. Math.random is fine here; nothing about card order needs to
// be reproducible.
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* --- The clearing rule -----------------------------------------------------

   A round is not finished until every card in it has been answered
   correctly. A missed card goes to the back of the queue; only the FIRST
   attempt counts for tier and stats — the retry clears the round, it does
   not erase the miss.                                                      */
export function createRound(cards) {
  return {
    queue: [...cards],
    total: cards.length,
    cleared: 0,
    results: {}, // id -> { correct, ms } from the first attempt only
  };
}

export function currentCard(round) {
  return round.queue[0] ?? null;
}

export function answerCard(round, correct) {
  const card = round.queue.shift();
  if (correct) round.cleared++;
  else round.queue.push(card);
  return card;
}

export function recordFirstAttempt(round, id, correct, ms) {
  if (!(id in round.results)) round.results[id] = { correct, ms };
}

export function roundDone(round) {
  return round.queue.length === 0;
}

/* --- Tiers ----------------------------------------------------------------- */

// First attempt only. Correct-but-slow holds: knowing it slowly is not yet
// knowing it. Wrong demotes one tier, never all the way back to wood.
export function tierAfterAnswer(tier, correct, ms, promoteMs) {
  if (!correct) return Math.max(0, tier - 1);
  if (ms <= promoteMs) return Math.min(4, tier + 1);
  return tier;
}

// A miss comes back the same session at EVERY tier — the interval table only
// applies to a card she got right. This used to be implicit in Wood's
// interval of 0, which meant a correct-but-slow Wood card was also stuck
// returning the same day; correctness now decides it, not tier.
export function dueAfter(tier, today, correct = true) {
  return correct ? today + TIER_INTERVALS[tier] : today;
}

/* --- Emeralds ---------------------------------------------------------------

   PROVISIONAL FORMULA — the spec says "per round cleared, with a bonus for a
   clean round" but names no numbers. One per four cards cleared, plus one
   per ten as the clean bonus: a clean round of 40 pays 10 + 4 = 14, which is
   the number the design's round-cleared artboard happens to show. Logged in
   docs/DESIGN_FEEDBACK.md for confirmation.                                */
export function roundEmeralds(cardCount, clean) {
  return Math.ceil(cardCount / 4) + (clean ? Math.ceil(cardCount / 10) : 0);
}

/* --- Round stats (what the cleared screen shows) ---------------------------- */
export function roundStats(round, lightningMs) {
  const attempts = Object.values(round.results);
  const firstTry = attempts.filter((r) => r.correct).length;
  const fast = attempts.filter((r) => r.correct && r.ms <= lightningMs).length;
  const clean = firstTry === round.total;
  return {
    total: round.total,
    firstTry,
    fast,
    clean,
    emeralds: roundEmeralds(round.total, clean),
  };
}

/* --- Factors -----------------------------------------------------------------

   One number, all its factor pairs. Pairs are unordered and include 1 x n
   (the spec's own example counts it). Stored sorted ascending by the smaller
   factor, which is also the display order.                                  */
export function factorPairs(n) {
  const pairs = [];
  for (let d = 1; d * d <= n; d++)
    if (n % d === 0) pairs.push([d, n / d]);
  return pairs;
}

export function factorsDeck() {
  const products = new Set();
  for (let a = 2; a <= 12; a++)
    for (let b = 2; b <= 12; b++) products.add(a * b);
  return [...products].sort((x, y) => x - y).map((n) => ({
    id: `f:${n}`,
    text: String(n),
    n,
    pairs: factorPairs(n),
  }));
}

// Unordered match: (36, 1) and (1, 36) are the same answer. Returns the
// pair's index in the card's sorted list, or -1 for a wrong pair.
export function matchPair(card, a, b) {
  const lo = Math.min(a, b), hi = Math.max(a, b);
  return card.pairs.findIndex(([x, y]) => x === lo && y === hi);
}
