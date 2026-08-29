// All synthesis, no files. Sine only, 20ms exponential attack, exponential
// decay, peak gain ≤ .22 — the routine app's voice, extended. Nothing
// negative ever sounds: wrong answers, broken streaks, and every screen
// change are silent by design, not omission.

let ctx = null;

export function unlock() {
  // Browsers gate AudioContext behind a user gesture; call from first tap.
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* stay silent */ }
  }
  if (ctx?.state === "suspended") ctx.resume();
}

function note(offset, freq, dur, peak) {
  if (!ctx) return;
  const t = ctx.currentTime + offset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// The pentatonic run: consecutive correct answers climb C6 D6 E6 G6 A6, then
// hold at A6 — so a round in progress *sounds* like it is finishing. The
// index resets when a wrong answer resets the run.
const RUN = [1046.5, 1174.66, 1318.51, 1567.98, 1760.0];

export function cueCorrect(runIndex, enabled) {
  if (!enabled) return;
  note(0, RUN[Math.min(runIndex, RUN.length - 1)], 0.12, 0.1);
}

export function cueRoundCleared(enabled) {
  if (!enabled) return;
  note(0, 783.99, 0.18, 0.14);   // G5
  note(0.16, 1046.5, 0.3, 0.14); // C6 — "that's the set"
}

// The award arpeggio, resolving on the octave so it feels finished.
export function cueAward(enabled) {
  if (!enabled) return;
  note(0, 523.25, 0.25, 0.16);   // C5
  note(0.12, 659.25, 0.25, 0.16); // E5
  note(0.24, 783.99, 0.45, 0.18); // G5
  note(0.36, 1046.5, 0.5, 0.18);  // C6
}

// Tier promotion: a rising third.
export function cuePromotion(enabled) {
  if (!enabled) return;
  note(0, 659.25, 0.2, 0.14);   // E5
  note(0.18, 987.77, 0.2, 0.14); // B5
}
