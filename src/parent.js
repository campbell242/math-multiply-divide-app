// The parent area: PIN gate, settings, fact grid, backup. Iron and neutral,
// plain factual voice, and silent end to end — no cue in here ever makes a
// sound. Settings apply as they are edited; LOCK just closes the area.

import { factorsDeck, TIERS } from "./engine.js";
import * as store from "./store.js";

const $ = (id) => document.getElementById(id);
const TIER_LABELS = ["Wood", "Stone", "Iron", "Gold", "Diamond"];

let hooks = null; // { show, renderHome } from app.js

/* --- PIN gate ------------------------------------------------------------------ */
let pinEntry = "";

function renderPinDots() {
  $("pin-dots").innerHTML = [0, 1, 2, 3]
    .map((i) => `<i class="${i < pinEntry.length ? "is-filled" : ""}"></i>`)
    .join("");
}

function openPin() {
  pinEntry = "";
  renderPinDots();
  hooks.show("pin");
}

function pinKey(d) {
  if (pinEntry.length >= 4) return;
  pinEntry += d;
  renderPinDots();
  if (pinEntry.length < 4) return;
  if (pinEntry === store.get("settings").pin) {
    pinEntry = "";
    openParent();
  } else {
    // Wrong PIN just shakes the dots. No error text, no lockout messaging —
    // she is ten, not an attacker.
    const dots = $("pin-dots");
    dots.classList.remove("is-shake");
    requestAnimationFrame(() => dots.classList.add("is-shake"));
    pinEntry = "";
    setTimeout(renderPinDots, 260);
  }
}

/* --- Settings screen -------------------------------------------------------------- */
function fmtS(ms) {
  return (ms / 1000).toFixed(1);
}

function openParent() {
  const s = store.get("settings");
  const p = store.get("profile");

  $("p-name").value = p.name;
  for (const key of ["mult", "div", "factors"]) renderDeckToggle(key);
  $("p-round").value = s.roundSize;
  $("p-fround").value = s.factorsRound;
  $("p-promote").value = fmtS(s.promoteMs);
  $("p-lightning").value = fmtS(s.lightningMs);
  renderSwitch("p-speedrun", s.speedRun);
  renderSwitch("p-sound-all", s.sound.all);
  renderSwitch("p-sound-blips", s.sound.blips);
  $("p-balance").value = p.emeralds;
  $("p-pin").value = s.pin;
  renderBackupLine();
  renderExcuse();
  resetArmed = null;
  renderResets();
  $("p-import-status").textContent = "";
  pendingImport = null;
  hooks.show("parent");
}

function renderSwitch(id, on) {
  const el = $(id);
  el.textContent = on ? "ON" : "OFF";
  el.classList.toggle("is-on", on);
}

function renderDeckToggle(key) {
  renderSwitch(`p-deck-${key}`, store.get("settings").decks[key]);
}

function clampInt(v, lo, hi, fallback) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
}

function wireSettings() {
  $("p-name").addEventListener("change", () => {
    store.get("profile").name = $("p-name").value.trim().slice(0, 24);
    store.touch("profile");
  });

  for (const key of ["mult", "div", "factors"]) {
    $(`p-deck-${key}`).addEventListener("click", () => {
      const decks = store.get("settings").decks;
      const turningOff = decks[key] && Object.values(decks).filter(Boolean).length === 1;
      if (turningOff) return; // the last deck stays on; an app with nothing to practice is broken
      decks[key] = !decks[key];
      store.touch("settings");
      renderDeckToggle(key);
    });
  }

  $("p-round").addEventListener("change", () => {
    const s = store.get("settings");
    s.roundSize = clampInt($("p-round").value, 10, 60, 40);
    $("p-round").value = s.roundSize;
    store.touch("settings");
  });
  $("p-fround").addEventListener("change", () => {
    const s = store.get("settings");
    s.factorsRound = clampInt($("p-fround").value, 6, 20, 12);
    $("p-fround").value = s.factorsRound;
    store.touch("settings");
  });

  // Lightning clamps to promotion rather than erroring: praising an answer
  // too slow to advance a tier is incoherent (docs/PRODUCT_SPEC.md).
  const applyThresholds = () => {
    const s = store.get("settings");
    const pro = Number($("p-promote").value);
    if (Number.isFinite(pro) && pro > 0) s.promoteMs = Math.round(Math.min(30, Math.max(1, pro)) * 1000);
    const li = Number($("p-lightning").value);
    if (Number.isFinite(li) && li > 0) s.lightningMs = Math.round(Math.min(30, Math.max(0.5, li)) * 1000);
    if (s.lightningMs > s.promoteMs) s.lightningMs = s.promoteMs;
    $("p-promote").value = fmtS(s.promoteMs);
    $("p-lightning").value = fmtS(s.lightningMs);
    store.touch("settings");
  };
  $("p-promote").addEventListener("change", applyThresholds);
  $("p-lightning").addEventListener("change", applyThresholds);

  $("p-speedrun").addEventListener("click", () => {
    const s = store.get("settings");
    s.speedRun = !s.speedRun;
    store.touch("settings");
    renderSwitch("p-speedrun", s.speedRun);
  });
  $("p-sound-all").addEventListener("click", () => {
    const s = store.get("settings");
    s.sound.all = !s.sound.all;
    store.touch("settings");
    renderSwitch("p-sound-all", s.sound.all);
  });
  $("p-sound-blips").addEventListener("click", () => {
    const s = store.get("settings");
    s.sound.blips = !s.sound.blips;
    store.touch("settings");
    renderSwitch("p-sound-blips", s.sound.blips);
  });

  $("p-balance").addEventListener("change", () => {
    const p = store.get("profile");
    p.emeralds = clampInt($("p-balance").value, 0, 999999, p.emeralds);
    $("p-balance").value = p.emeralds;
    store.touch("profile");
  });

  $("p-pin").addEventListener("change", () => {
    const s = store.get("settings");
    const v = $("p-pin").value.replace(/[^0-9]/g, "").slice(0, 4);
    if (v.length === 4) { s.pin = v; store.touch("settings"); }
    $("p-pin").value = s.pin;
  });
}

/* --- Excuse today -------------------------------------------------------------------- */
function renderExcuse() {
  const excused = store.get("streak").excused.includes(store.dayNumber());
  $("p-excuse").disabled = excused;
  $("p-excuse").textContent = excused
    ? `Today is excused · streak continues`
    : `Excuse today · streak continues`;
}

/* --- Deck reset (two-tap confirm; resetting erases tiers and cannot be undone) --------- */
const RESET_DECKS = { mult: ["m:", "Multiplication"], div: ["d:", "Division"], factors: ["f:", "Factors"] };
let resetArmed = null;
let resetTimer = null;

function renderResets() {
  for (const key of Object.keys(RESET_DECKS)) {
    const btn = $(`p-reset-${key}`);
    btn.textContent = resetArmed === key
      ? `Tap again to erase ${RESET_DECKS[key][1]} tiers`
      : `Reset ${RESET_DECKS[key][1]}`;
    btn.classList.toggle("is-armed", resetArmed === key);
  }
}

function wireResets() {
  for (const key of Object.keys(RESET_DECKS)) {
    $(`p-reset-${key}`).addEventListener("click", () => {
      if (resetArmed === key) {
        store.resetDeck(RESET_DECKS[key][0]);
        resetArmed = null;
      } else {
        resetArmed = key;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => { resetArmed = null; renderResets(); }, 4000);
      }
      renderResets();
    });
  }
}

/* --- Backup ------------------------------------------------------------------------------ */
function renderBackupLine() {
  const last = store.get("settings").lastBackupDay;
  if (last === null) {
    $("p-backup-line").textContent = "No backup has been made yet.";
    return;
  }
  const days = store.dayNumber() - last;
  $("p-backup-line").textContent =
    days === 0 ? "Backed up today." :
    days === 1 ? "Last backup: yesterday." :
    `Last backup: ${days} days ago.${days >= 30 ? " Worth making a fresh one." : ""}`;
}

let pendingImport = null;

function wireBackup() {
  $("p-export").addEventListener("click", () => {
    const dump = store.exportBackup();
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const blob = new Blob([JSON.stringify(dump)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `times-table-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    renderBackupLine();
  });

  $("p-import-file").addEventListener("change", async () => {
    const file = $("p-import-file").files[0];
    if (!file) return;
    try {
      pendingImport = JSON.parse(await file.text());
    } catch {
      pendingImport = null;
      $("p-import-status").textContent = "That file could not be read as a backup.";
      return;
    }
    // Two steps on purpose: import REPLACES current progress.
    $("p-import-status").textContent =
      `Restore "${file.name}"? This replaces all current progress. Press Restore again to confirm.`;
  });

  $("p-import").addEventListener("click", () => {
    if (!pendingImport) {
      $("p-import-file").click();
      return;
    }
    const res = store.importBackup(pendingImport);
    pendingImport = null;
    $("p-import-file").value = "";
    if (res.ok) {
      openParent(); // re-render every field from the restored state
      $("p-import-status").textContent = "Backup restored.";
    } else {
      $("p-import-status").textContent = res.error;
    }
  });
}

/* --- Fact grid ------------------------------------------------------------------------------

   The 12x12 heat map: every fact coloured by tier, unseen left as an empty
   slot. The fastest way to see which facts are weak.                          */
let gridDeck = "mult";

function tierCounts(prefix, total) {
  const cards = store.get("cards");
  const counts = [0, 0, 0, 0, 0];
  let seen = 0;
  for (const [id, c] of Object.entries(cards))
    if (id.startsWith(prefix)) { counts[c.t]++; seen++; }
  return { counts, unseen: total - seen };
}

function renderGrid() {
  for (const key of ["mult", "div", "factors"])
    $(`g-${key}`).classList.toggle("is-on", gridDeck === key);

  const cards = store.get("cards");
  const cell = (id, label, title) => {
    const rec = cards[id];
    const cls = rec ? `is-t${rec.t}` : "is-unseen";
    const full = rec ? `${title} · ${TIER_LABELS[rec.t]}` : `${title} · not seen yet`;
    return `<div class="gcell ${cls}" title="${full}">${label}</div>`;
  };

  let html = "";
  if (gridDeck === "factors") {
    html = `<div class="grid grid--factors">` +
      factorsDeck().map((c) => cell(c.id, c.n, `${c.n}`)).join("") + `</div>`;
  } else {
    const idOf = gridDeck === "mult"
      ? (a, b) => `m:${a}x${b}`
      : (a, b) => `d:${a * b}/${b}`;
    const sym = gridDeck === "mult" ? "×" : "÷";
    html = `<div class="grid grid--ops"><div class="gcell is-label"></div>`;
    for (let b = 2; b <= 12; b++) html += `<div class="gcell is-label">${b}</div>`;
    for (let a = 2; a <= 12; a++) {
      html += `<div class="gcell is-label">${a}</div>`;
      for (let b = 2; b <= 12; b++) {
        const title = gridDeck === "mult" ? `${a} ${sym} ${b}` : `${a * b} ${sym} ${b}`;
        html += cell(idOf(a, b), "", title);
      }
    }
    html += `</div>`;
  }
  $("grid-box").innerHTML = html;

  const total = gridDeck === "factors" ? 53 : 121;
  const prefix = { mult: "m:", div: "d:", factors: "f:" }[gridDeck];
  const { counts, unseen } = tierCounts(prefix, total);
  $("grid-summary").innerHTML =
    TIERS.map((t, i) => `<li><span class="gswatch is-t${i}"></span>${TIER_LABELS[i]}<b>${counts[i]}</b></li>`).join("") +
    `<li><span class="gswatch is-unseen"></span>Not seen<b>${unseen}</b></li>`;
}

/* --- Wiring ------------------------------------------------------------------------------- */
export function initParent(h) {
  hooks = h;

  $("go-parent").addEventListener("click", openPin);
  $("pin-back").addEventListener("click", hooks.renderHome);
  $("pin-pad").addEventListener("click", (e) => {
    const key = e.target.closest(".key");
    if (!key) return;
    if (key.dataset.act === "back") { pinEntry = pinEntry.slice(0, -1); renderPinDots(); }
    else pinKey(key.dataset.d);
  });

  $("p-lock").addEventListener("click", () => {
    store.flushNow();
    hooks.renderHome();
  });
  $("p-grid").addEventListener("click", () => { renderGrid(); hooks.show("grid"); });
  $("grid-back").addEventListener("click", openParent);
  for (const key of ["mult", "div", "factors"])
    $(`g-${key}`).addEventListener("click", () => { gridDeck = key; renderGrid(); });

  $("p-excuse").addEventListener("click", () => { store.excuseToday(); renderExcuse(); });

  wireSettings();
  wireResets();
  wireBackup();
}
