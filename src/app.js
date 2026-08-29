// Scaffold. Proves the token pipeline and theme switching work end to end.
// The real practice engine (problem selection, spaced repetition, scoring)
// replaces this once the design artboards settle.

const THEME_KEY = "mt-theme";

function readStoredTheme() {
  // Private windows and locked-down browsers throw on access, not just return null.
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* Non-fatal: the toggle still works for this session. */
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

const stored = readStoredTheme();
if (stored) applyTheme(stored);

document.getElementById("theme-toggle").addEventListener("click", () => {
  const current =
    document.documentElement.getAttribute("data-theme") ??
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  storeTheme(next);
});

document.getElementById("roll").addEventListener("click", () => {
  const a = 2 + Math.floor(Math.random() * 11);
  const b = 2 + Math.floor(Math.random() * 11);
  document.getElementById("expression").textContent = `${a} × ${b}`;
});
