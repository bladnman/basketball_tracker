## Overall Status

Good progress.

* Ball is larger than before.
* Light/highlight behavior now appears correct.
* Scrolling behavior feels correct.

The remaining items focus on realism, correctness, and readability.

---

## Ball Scale

1. **Ball still too small**

   * The ball has increased in size but remains small relative to the interior of a milk crate.
   * It should feel tighter and more substantial inside the basket.

---

## Ball Physics

2. **Motion feels animated, not physical**

   * Ball motion appears parabolic and scripted rather than driven by physics.
   * Velocity feels constant rather than accelerating downward and decelerating upward.

3. **Physics engine needed**

   * The ball should have real physical properties (e.g., gravity, mass).
   * Bounce behavior should emerge from physics, not animation curves.

4. **Bounce quality**

   * Ball does not yet bounce convincingly when dropped.

---

## Targeting / Correctness

5. **Incorrect basket targeting**

   * The ball does not always enter the basket that was clicked or selected.
   * The light indicates the correct basket, but the ball does not consistently follow it.

---

## Scrolling & Interaction

6. **Scrolling behavior**

   * Scrolling now feels correct.
   * No changes requested here.

---

## Temporal Grouping

7. **Week boundary issue**

   * There appears to be an error where Monday is visually attached to the end of the previous week.
   * Week separation logic or layout is incorrect.

---

## Labels & Readability

8. **Front-facing day labels hard to read**

   * Labels in front of the baskets are directionally correct.
   * Text is very difficult to read at the current size.

9. **Label scaling**

   * First adjustment should be increasing label size to improve legibility.
