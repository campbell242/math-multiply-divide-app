// Tricks: the notebook, not the inventory. A zero-stakes reference library —
// no timer, no emeralds, no tracking, no sound. Built to TRICKS_WORK_ORDER.md
// and ELEVENS_RULING.md; the artboards live in design/tricks/.
//
// The page frame (header, explainer, stage, ledger, result slab, caption,
// chip strip, Again) is trick-agnostic. The STAGE is a slot: `array` carries
// ten of the twelve, `pairs` carries the fives, `digits` carries ×10 alone,
// and `flip` adds the one thing no other page needs — a two-line ledger
// whose lines land together.

const $ = (id) => document.getElementById(id);

/* Play once and hold: build 900ms staggered · hold 600 · transform 300 ·
   hold 900 · result 300 · hold indefinitely. No loop — a loop erases its own
   conclusion on a schedule she does not control. */
const MARKS3 = [30, 1550, 2750];
const MARKS4 = [30, 1550, 2750, 3650];
const MARKS5 = [30, 1550, 2750, 3650, 4550];

const tens = (k) => (k === 1 ? "1 ten" : `${k} tens`);

/* Every trick is a content entry against the locked frame. `stage.groups`
   are row batches and the phase each arrives at; `removeAt` marks the last
   row as taken away (absence, never slate). The ledger returns
   [text, litAtPhase] pairs; the result lands at the final mark. */
const TRICKS = [
  {
    f: 2, name: "Just double it", marks: MARKS3,
    explain: "Two of something is it, doubled — that's the whole trick.",
    stage: { type: "array", groups: [{ n: 1, at: 0 }, { n: 1, at: 1 }] },
    ledger: (n) => [[`start with ${n}`, 0], ["double it", 1], [`= ${2 * n}`, 2]],
  },
  {
    f: 3, name: "Double, then one more", marks: MARKS3,
    explain: "Three of something is double it, plus one more row.",
    stage: { type: "array", groups: [{ n: 2, at: 0 }, { n: 1, at: 1 }] },
    ledger: (n) => [[`2 × ${n} = ${2 * n}`, 0], [`and one more ${n}`, 1], [`= ${3 * n}`, 2]],
  },
  {
    f: 4, name: "Double the double", marks: MARKS4,
    explain: "Double it once, then double that.",
    stage: { type: "array", groups: [{ n: 1, at: 0 }, { n: 1, at: 1 }, { n: 2, at: 2 }] },
    ledger: (n) => [[`start with ${n}`, 0], [`double it — ${2 * n}`, 1], [`double again — ${4 * n}`, 2]],
  },
  {
    f: 5, name: "Fives make tens", marks: MARKS3,
    explain: "Two rows of five make a ten. Count the tens, then the spare.",
    stage: { type: "pairs" },
    ledger: (n) => {
      const pairs = Math.floor(n / 2);
      return [
        [`${n} fives`, 0],
        [n % 2 ? `${tens(pairs)} and a five` : tens(pairs), 1],
        [`= ${5 * n}`, 2],
      ];
    },
  },
  {
    f: 6, name: "Five rows and one more", marks: MARKS3,
    explain: "Six of something is five of it, plus one more row.",
    stage: { type: "array", groups: [{ n: 5, at: 0 }, { n: 1, at: 1 }] },
    ledger: (n) => [[`5 × ${n} = ${5 * n}`, 0], [`and one more ${n}`, 1], [`= ${6 * n}`, 2]],
  },
  {
    f: 7, name: "Five rows and two more", marks: MARKS3,
    explain: "Seven of something is five of it, plus two more rows.",
    stage: { type: "array", groups: [{ n: 5, at: 0 }, { n: 2, at: 1 }] },
    ledger: (n) => [[`5 × ${n} = ${5 * n}`, 0], [`and two more ${n}s`, 1], [`= ${7 * n}`, 2]],
  },
  {
    f: 8, name: "Double, double, double", marks: MARKS5,
    explain: "Eight is 2 × 2 × 2 — double it three times.",
    stage: { type: "array", groups: [{ n: 1, at: 0 }, { n: 1, at: 1 }, { n: 2, at: 2 }, { n: 4, at: 3 }] },
    ledger: (n) => [
      [`start with ${n}`, 0],
      [`double it — ${2 * n}`, 1],
      [`double again — ${4 * n}`, 2],
      [`double again — ${8 * n}`, 3],
    ],
  },
  {
    f: 9, name: "Take a row away", marks: MARKS3,
    explain: "Nine of something is ten of it, minus one row.",
    stage: { type: "array", groups: [{ n: 10, at: 0 }], removeAt: 1 },
    ledger: (n) => [[`10 × ${n} = ${10 * n}`, 0], [`take away ${n}`, 1], [`= ${9 * n}`, 2]],
  },
  {
    f: 10, name: "Slide in a zero", marks: MARKS3,
    explain: "Ten of something keeps your number. A zero slides onto the end.",
    stage: { type: "digits" },
    ledger: (n) => [[`start with ${n}`, 0], ["slide a zero on the end", 1], [`= ${10 * n}`, 2]],
  },
  {
    f: 11, name: "Ten rows and one more", marks: MARKS3,
    explain: "Eleven of something is ten of it, plus one more row.",
    stage: { type: "array", groups: [{ n: 10, at: 0 }, { n: 1, at: 1 }] },
    ledger: (n) => [[`10 × ${n} = ${10 * n}`, 0], [`and one more ${n}`, 1], [`= ${11 * n}`, 2]],
    // The wow is a caption, not the trick: present for 2–9, and its absence
    // at 10–12 says nothing because it draws the boundary in its own words
    // (ELEVENS_RULING.md).
    caption: (n) => (n <= 9 ? `Both digits are ${n}. That happens all the way up to nine.` : null),
  },
  {
    f: 12, name: "Ten rows and two more", marks: MARKS3,
    explain: "Twelve of something is ten of it, plus two more rows.",
    stage: { type: "array", groups: [{ n: 10, at: 0 }, { n: 2, at: 1 }] },
    ledger: (n) => [[`10 × ${n} = ${10 * n}`, 0], [`and two more ${n}s`, 1], [`= ${12 * n}`, 2]],
  },
];

// The Flip is not a table: no chip strip, one canonical case, and both
// ledger lines land on the same frame — a sequential reveal would imply the
// second derives from the first.
const FLIP = {
  f: null, name: "The Flip", meta: "↻", marks: MARKS3, chips: false,
  explain: "Turn the block around. The answer doesn't change.",
  stage: { type: "flip" },
  ledger: () => [["7 × 8 = 56", 2], ["8 × 7 = 56", 2]],
  result: () => "7 × 8 = 8 × 7",
};

function resultText(cfg, n) {
  return cfg.result ? cfg.result(n) : `${cfg.f} × ${n} = ${cfg.f * n}`;
}

/* --- Stage builders: rows carry the phase they arrive at (data-at), their
   stagger slot (data-di), and whether they are taken away (data-gone). ----- */
function blockRow(cells, { at, di, added, goneAt }) {
  return `<div class="trow-a is-hidden${added ? " from-below" : ""}" data-at="${at}" data-di="${di}"${
    goneAt != null ? ` data-gone="${goneAt}"` : ""
  }>${`<i class="tblock"></i>`.repeat(cells)}</div>`;
}

function buildStage(cfg, n) {
  const s = cfg.stage;

  if (s.type === "array") {
    let di = 0;
    const rows = [];
    for (const g of s.groups)
      for (let i = 0; i < g.n; i++)
        rows.push({ at: g.at, di: g.at === 0 ? di++ : 0, added: g.at > 0, goneAt: null });
    if (s.removeAt != null) rows[rows.length - 1].goneAt = s.removeAt;
    return `<div class="tstage-col">${rows.map((r) => blockRow(n, r)).join("")}</div>`;
  }

  if (s.type === "pairs") {
    const pairCount = Math.floor(n / 2);
    const spare = n % 2;
    let di = 0;
    const frames = [];
    for (let g = 0; g < pairCount + spare; g++) {
      const isSpare = spare === 1 && g === pairCount;
      const rows = [];
      for (let r = 0; r < (isSpare ? 1 : 2); r++)
        rows.push(blockRow(5, { at: 0, di: di++, added: false, goneAt: null }));
      frames.push(`<div class="tframe">${rows.join("")}<b class="tframe__tag">${isSpare ? 5 : 10}</b></div>`);
    }
    // Reflowing the arrangement is allowed; resizing the block never is
    // (work order B1): above three ten-frames the stage goes two-column.
    return `<div class="tstage-pairs${frames.length > 3 ? " is-twocol" : ""}">${frames.join("")}</div>`;
  }

  if (s.type === "digits") {
    const digits = String(n)
      .split("")
      .map((ch, i) => `<span class="tdigit is-hidden" data-at="0" data-di="${i}">${ch}</span>`)
      .join("");
    return `<div class="tdigits">${digits}<span class="tdigit tdigit--zero is-hidden" data-at="1" data-di="0">0</span></div>`;
  }

  // flip: a fixed 7×8 array that rotates in place.
  const rows = [];
  for (let i = 0; i < 7; i++) rows.push(blockRow(8, { at: 0, di: i, added: false, goneAt: null }));
  return `<div class="tflip-wrap"><div class="tstage-col tflip-arr" data-rotator>${rows.join("")}</div></div>`;
}

/* --- The page ---------------------------------------------------------------- */
export function initTricks({ show, backToSelect, backToCleared }) {
  let cur = null; // { cfg, n, timers, origin }

  function applyPhase(ph) {
    const stage = $("trick-stage");
    stage.querySelectorAll(".trow-a, .tdigit").forEach((el) => {
      const at = Number(el.dataset.at);
      // The build stagger belongs to phase 0 only; every later transition
      // (removal, additions, the flip) fires undelayed.
      el.style.transitionDelay = ph === 0 && at === 0 ? `${Number(el.dataset.di) * 90}ms` : "0ms";
      el.classList.toggle("is-hidden", ph < at);
      if (el.dataset.gone != null) el.classList.toggle("is-gone", ph >= Number(el.dataset.gone));
    });
    stage.querySelectorAll(".tframe").forEach((el) => el.classList.toggle("is-framed", ph >= 1));
    const rotator = stage.querySelector("[data-rotator]");
    if (rotator) rotator.classList.toggle("is-rotated", ph >= 1);
    $("trick-ledger")
      .querySelectorAll("[data-at]")
      .forEach((el) => el.classList.toggle("is-lit", ph >= Number(el.dataset.at)));
    const done = ph >= cur.cfg.marks.length - 1;
    $("trick-slab").classList.toggle("is-shown", done);
    $("trick-caption").classList.toggle("is-shown", done);
  }

  // Everything that depends on n: the stage, the ledger, the result, the
  // caption, and which chip wears the chose-it outline.
  function buildDynamic() {
    const { cfg, n } = cur;
    $("trick-stage").innerHTML = buildStage(cfg, n);
    $("trick-stage").classList.toggle("tstage--center", cfg.stage.type === "digits" || cfg.stage.type === "flip");
    $("trick-ledger").innerHTML = cfg.ledger(n)
      .map(([text, at]) => `<div data-at="${at}">${text}</div>`)
      .join("");
    $("trick-result").textContent = resultText(cfg, n);
    const caption = cfg.caption ? cfg.caption(n) : null;
    $("trick-caption").hidden = !caption;
    if (caption) $("trick-caption").textContent = caption;
    $("trick-chips")
      .querySelectorAll(".tchip")
      .forEach((el) => el.classList.toggle("is-on", Number(el.dataset.v) === n));
  }

  function stopTimers() {
    if (cur) cur.timers.forEach(clearTimeout);
  }

  function play(n) {
    if (n != null && n !== cur.n) {
      cur.n = n;
      buildDynamic();
    }
    stopTimers();
    cur.timers = [];
    const last = cur.cfg.marks.length - 1;
    // The deliberate reduced-motion path (work order A4): the held result
    // renders immediately with the ledger fully lit; Again stays and does
    // nothing visible, which is correct rather than broken.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyPhase(last);
      return;
    }
    applyPhase(-1);
    cur.timers = cur.cfg.marks.map((ms, i) => setTimeout(() => applyPhase(i), ms));
  }

  function openTrick(cfg, origin) {
    stopTimers();
    cur = { cfg, n: 7, timers: [], origin };
    $("trick-title").textContent = cfg.name;
    $("trick-meta").textContent = cfg.meta ?? `× ${cfg.f}`;
    $("trick-explain").textContent = cfg.explain;
    const hasChips = cfg.chips !== false;
    $("trick-chips-label").hidden = !hasChips;
    $("trick-chips").hidden = !hasChips;
    $("trick-chips").innerHTML = hasChips
      ? Array.from({ length: 11 }, (u, k) => `<button class="tchip" data-v="${k + 2}">${k + 2}</button>`).join("")
      : "";
    buildDynamic();
    show("trick");
    play();
  }

  /* --- The picker -------------------------------------------------------------- */
  $("tricks-grid").innerHTML = TRICKS.map(
    (t) => `<button class="ttile" data-f="${t.f}">
       <span class="ttile__num">× ${t.f}</span>
       <span class="ttile__name">${t.name}</span>
     </button>`
  ).join("");

  function openPicker() {
    stopTimers();
    show("tricks");
  }

  $("tricks-grid").addEventListener("click", (e) => {
    const tile = e.target.closest(".ttile");
    if (tile) openTrick(TRICKS.find((t) => t.f === Number(tile.dataset.f)), "picker");
  });
  $("go-flip").addEventListener("click", () => openTrick(FLIP, "picker"));
  $("tricks-back").addEventListener("click", backToSelect);

  $("trick-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".tchip");
    if (chip) play(Number(chip.dataset.v));
  });
  $("trick-again").addEventListener("click", () => play());
  $("trick-back").addEventListener("click", () => {
    stopTimers();
    if (cur?.origin === "cleared") backToCleared();
    else openPicker();
  });

  return {
    openPicker,
    openTrickFor(table, origin) {
      const cfg = TRICKS.find((t) => t.f === table);
      if (cfg) openTrick(cfg, origin);
    },
  };
}
