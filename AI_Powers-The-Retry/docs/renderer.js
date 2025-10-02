const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.addEventListener("click", e => {
  if (!window.currentPower) return alert("Generate a power first!");

  const x = canvas.width / 2;
  const y = canvas.height / 2;

  const projectileFn = new Function("ctx","x","y", window.currentPower.projectile_js);
  const trailFn = new Function("ctx","x","y", window.currentPower.trail_js);
  const impactFn = new Function("ctx","x","y", window.currentPower.impact_js);

  // Draw projectile
  projectileFn(ctx, x, y);

  // Quick trail effect
  for (let i=0; i<5; i++) trailFn(ctx, x-i*5, y);

  // Fake impact after short delay
  setTimeout(() => {
    impactFn(ctx, x+100, y);
  }, 400);
});
