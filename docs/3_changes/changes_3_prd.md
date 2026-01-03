## Overall Status

Strong progress.

* Physics engine is now in place.
* Ball motion feels physically driven rather than animated.

Remaining issues are mostly about **tuning, containment, and coordination between motion systems**.

---

## Ball Physics & Containment

1. **Overly bouncy behavior**

   * Balls are extremely bouncy.
   * While interesting, the bounce is currently excessive and causes problems.

2. **Crate walls not acting as solid boundaries**

   * Balls can pass through crate walls.
   * One screenshot shows the ball visually occluded by the crate.
   * The ball appears to bounce only off the floor, not the crate itself.

3. **Balls escaping crates**

   * Balls can bounce or roll out of the crates entirely.
   * Crate walls need to be solid so balls reliably stay contained.

4. **Possible contributing factors**

   * Toss force may be too strong.
   * Ball restitution may be too high.
   * Crate walls may not be collision objects.

---

## Labels & Dates

5. **Current labels are mostly working**

   * Day names and dates look generally good.

6. **Increase label scale**

   * Labels should be increased in size one more time.
   * It’s okay to push them slightly toward being playful or exaggerated.

7. **Stacked label layout**

   * Stack labels vertically:

     * Top line: day name (current size feels right).
     * Bottom line: day number.
   * The day number should be:

     * Much larger than the day name.
     * Bold and heavy (“fat”).
     * Easy to read at a glance.

8. **Depth placement**

   * Consider placing the number slightly closer to the camera than the day name.
   * Labels should remain centered and visually anchored.

---

## Scrolling vs Physics Interaction

9. **Balls remain static while scrolling**

   * When scrolling occurs while balls are mid-motion:

     * Crates move.
     * Labels move.
     * Balls stay still in world space.

10. **Resulting issue**

    * Scrolling causes crates and labels to move out from underneath moving balls.
    * This breaks the illusion of physical interaction.

11. **Possible mitigation**

    * This issue may be reduced once crates have solid sides.
    * Still noted as a coordination problem between scrolling and physics.
