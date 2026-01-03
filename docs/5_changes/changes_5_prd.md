## Ball Motion — Spin / Slowdown (Critical)

1. **Ball still spins / slows dramatically on entry**

   * Balls continue spinning as they enter the baskets.
   * The slowdown effect is still strong (close to previous behavior).
   * Recent changes did not materially reduce this issue.

2. **Ball / basket scale consideration**

   * Ball appearing too small contributes to the wrong visual read (less like a basketball).
   * Consider slightly increasing basket size and/or ensuring the ball reads as appropriately sized for the crate.

---

## Collider Behavior (Catch Reliability)

3. **Collider removal on ball removal is good**

   * When a ball is removed, the colliders are taken off (this part is working).

4. **Colliders must be restored afterward**

   * After the ball is removed, colliders need to be re-added.
   * Otherwise, the next ball thrown in will not be caught.

---

## Labels / Alignment

5. **Month label alignment**

   * Month names need to be aligned over the first day of the month.
   * A screenshot illustrates the current misalignment.

---

## Environment / Floor (New Asset)

6. **New floor texture asset**

   * A new file is provided in assets: `floor/wood_floor_worn_div_4k.jpg`.
   * This should be used as the floor representation.

7. **Floor presentation**

   * Implement a clean, simple way for the floor texture to lay down as the visible floor surface.
   * Add tasteful lighting to support the floor.

8. **Ambient / dynamic lighting (subtle)**

   * Add a small amount of dynamic or ambient lighting in the environment.
   * Prefer lighting that changes the overall space feel without strongly affecting the baskets.
