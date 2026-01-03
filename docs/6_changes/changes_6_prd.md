## Primary Issue (Must Fix)

1. **Basketball slows to a crawl inside the basket volume**

   * The ball toss looks physically correct until the ball enters the basket bounds.
   * Once inside, the ball’s descent slows dramatically.
   * The ball rotates slowly while “floating” down.
   * It eventually reaches the bottom and comes to rest.

---

## Goal: Rapid Iteration Workflow

2. **Tight feedback loop**

   * We need fast iteration: make one change → reload → observe → repeat.

3. **Visible debug output in the UI**

   * Add a small, visible debug panel / text area in the UI.
   * Purpose: show key values and status so the user can copy/paste the readout back for diagnosis.

4. **Expose adjustable “dials”**

   * If there are parameters likely to affect this issue, expose them as simple controls (sliders/toggles/inputs) in the debug panel.
   * The user can adjust and report which settings change the behavior.

5. **Optional reference for debug UI**

   * The user can share a screenshot from a previous app that used a similar debug panel.

---

## Suspected Root Cause Areas (Hypotheses)

6. **Collision volume mismatch**

   * Possible misalignment between collision shapes and visible geometry.

7. **Ball collision shape**

   * Hypothesis: the ball’s collision bounds may be larger than the visual ball.

8. **Basket/crate collision shape**

   * Hypothesis: the crate/basket collision volume may be too “tight” or overly enclosed.
   * The collision mesh may not match the actual interior space.

9. **Alternative collision approach (fallback)**

   * If crate mesh collisions are problematic:

     * Do not use the crate model as the collision source.
     * Instead, create a simple collision setup: four walls + a floor that define the basket’s interior.
     * Place this collision geometry at the crate’s position.

10. **Collision visualization**

* If possible, provide a way to **visualize collision shapes/masks** to confirm alignment.

---

## Camera / Inspection Controls

11. **Zoom in/out support**

* Add zoom controls (e.g., via scroll up/down or another simple mechanism).
* Goal: allow closer inspection of impacts and collisions.
* Zoom does not need to be fast—just usable for debugging.
