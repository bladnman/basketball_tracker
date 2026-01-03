## Scoreboard Background Integration

1. **Scoreboard background asset**

   * Use the provided asset: `scoreboard_BG1`.
   * This asset should serve as the visual background for the scoreboard area.

2. **Placement context**

   * The scoreboard should sit slightly behind the existing UI.
   * Exact placement does not need to match any screenshot precisely.

3. **Reference screenshots**

   * *Screenshot 2* (in the `6_5_changes` folder):

     * Shows the application with a pink rectangle labeled “somewhere in here is the scoreboard.”
     * This defines the general region where the scoreboard should live.
   * *Screenshot 1* (also in the `6_5_changes` folder):

     * A mocked-up concept of the scoreboard layout.
     * This mock is for structure only, not visual styling fidelity.

---

## Scoreboard Structure

4. **Top labels**

   * Left: “This Week”.
   * Right: “Streak”.

5. **Primary score areas**

   * Large numeric score areas (shown as yellow rectangles in the mock).

6. **Secondary label areas**

   * Areas below the main scores for labels such as “Goal” and “Best”.

---

## Typography Requirements

7. **Primary numbers font**

   * Use **Orbitron Black 900** for the large numeric values.
   * Numbers should feel very strong, bold, and dominant.

8. **Secondary text font**

   * “Goal” and “Best” should use a different font than the primary numbers.
   * Exact font choice is flexible, but it should clearly contrast with Orbitron.

---

## Color Intent

9. **Primary numbers color**

   * Large numbers that appear on gold backgrounds should be **black**.

10. **Secondary numbers color**


* The “Best” and “Goal” values should be rendered in the **gold color** used in the “This Week” / “Streak” labels.