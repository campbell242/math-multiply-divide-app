// Scaffold. Exercises the token layer so a styling regression is visible on
// the deployed page. The real practice engine replaces this once the data
// model in docs/DATA_MODEL.md is built.

const problem = document.getElementById("problem");
const keypad = document.getElementById("keypad");

document.getElementById("roll").addEventListener("click", () => {
  const a = 2 + Math.floor(Math.random() * 11);
  const b = 2 + Math.floor(Math.random() * 11);
  problem.textContent = `${a} × ${b}`;
});

// Event delegation: one listener rather than twelve, and it keeps working if
// the keypad is re-rendered.
keypad.addEventListener("click", (e) => {
  const key = e.target.closest(".key");
  if (key) console.log("key:", key.textContent.trim());
});
