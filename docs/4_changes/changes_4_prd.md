## Labels / Dates Visibility

1. **Day labels are too far from the camera**

   * Day name + number labels appear under the crate and are hard to see.
   * Move the label group closer toward the camera so day names are readable.

2. **Number weight / boldness**

   * The day numbers may not be bold enough.
   * Increase font weight so the numbers read clearly.

3. **Spacing between day name and number**

   * The gap between the day name and the number feels too large.
   * Reduce the vertical spacing slightly (bring them closer together).

---

## Ball Behavior — Slow-Motion / Collision Problem (High Priority)

4. **Slow-motion floating inside the basket**

   * After a ball enters a basket correctly, it transitions into a strange slow-motion state.
   * Symptoms:

     * Ball appears to float downward very slowly.
     * Ball rotates while descending.
     * Motion feels like repeated micro-collisions or collision “stuttering.”

5. **Likely collision/volume issue**

   * Behavior suggests the ball is stuck interacting with collision geometry (e.g., bouncing between surfaces repeatedly).
   * If there is intentional damping/slowdown code, it may be interacting badly with collisions.

6. **Prevents clean removal / ejection**

   * When the basket is toggled off (ball removed), the ball cannot cleanly “jump out.”
   * Instead, it re-enters the float/rotate slow-motion pattern, then drops to the bottom, then disappears.
