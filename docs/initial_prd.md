# 3D Habit Tracker (Crate + Ball) — PRD

## 1) Intent & thesis

Build a **web-based daily habit tracker** that feels like a **tiny, elegant game**: a horizontally scrolling 3D row of days where toggling a day “on” **tosses a basketball into a crate**. The experience should be **high-quality, playful, and satisfying**, prioritizing smooth motion, tasteful lighting, and clear feedback while keeping the underlying habit tracking model simple.

## 2) Non-negotiable product facts

* The UI is a **3D scene** rendered on the web (e.g., canvas-based), viewed from a consistent, readable perspective.
* Days are represented as **repeatable 3D “day tiles”** composed of:

  * a **crate** (the container)
  * an optional **basketball** (visible when active)
  * a **day label** (text rendered in-scene)
* Users scroll **left/right** through an effectively **endless** day sequence (via recycling/pooling or equivalent).
* Clicking/tapping a day tile **toggles** the day’s habit completion state:

  * Toggle **ON**: a ball is introduced and a satisfying “make” animation occurs (ball lands/settles in the crate).
  * Toggle **OFF**: the ball is removed with a satisfying “undo” animation (e.g., ball pops out / exits / vanishes gracefully).
* State persistence is minimal and durable: store **active dates** locally (e.g., localStorage).
* The environment is always navigable and legible: users can always identify the **current day**, **month boundaries**, and **week separations**.
* Visual quality matters: the experience should feel **polished**, not like a debug demo.

## 3) Target users & jobs-to-be-done

### Primary user

* A person tracking a simple daily habit who wants a **pleasant ritual** and quick “did I do it?” clarity.

### Jobs-to-be-done

* **Mark today as done** with a single action.
* **Unmark a day** quickly if toggled by mistake.
* **Scan recent history** by scrolling through days and noticing which are active.
* **Understand time structure** (weeks/months) at a glance without reading a lot.

## 4) Success outcomes (proposals)

* Users can toggle any visible day in **< 1 second** with immediate feedback.
* The scene remains smooth and responsive during normal use (scrolling + toggling).
* The tracker remains accurate across refreshes (local persistence works reliably).
* Users report the experience feels **“game-like,” “satisfying,” “polished.”**

## 5) Scope

### MVP (single habit)

* One habit only (single row experience).
* Horizontal scrolling 3D day row (recycled tiles).
* Day tiles with crate + day label.
* Toggle ON/OFF with satisfying ball behavior.
* Active/inactive visual states (lighting + ball presence).
* Week separators and month labels.
* Local persistence for active dates.

### Later

* Multiple habits via habit selection (still one row at a time; no multi-row/multi-row).
* Sound effects and haptics-like feedback (where available).
* Streak highlighting, weekly goals, achievements.
* Themes / palettes / different environments.
* Analytics/insights views.

## 6) Requirements (prioritized)

### P0 — Core interaction & clarity

1. **Endless horizontal scroll**

   * Users can scroll left/right continuously.
   * Day tiles recycle seamlessly (no obvious “teleporting”).

2. **Day tile identity & legibility**

   * Every tile clearly shows its **day number**.
   * The system indicates **today** distinctly.

3. **Toggle behavior (ON)**

   * Clicking a tile toggles it active.
   * A ball is introduced and **lands inside the crate** with a satisfying, physical-feeling motion.
   * The ball ends **resting in the crate** (stable final state).

4. **Toggle behavior (OFF)**

   * Clicking an active tile toggles it inactive.
   * The ball is removed via a pleasing **ejection** animation: the ball is tossed **upward and out** on an arc that clears the crate.
   * The crate returns to its inactive lighting state.

5. **Persistence**

   * Active dates persist across reload.
   * Storage format is simple (date-keyed state).

6. **Time structure cues (explicit)**

   * The system uses a **Monday-start week** convention.
   * **Week boundaries** are visibly indicated with a subtle but clear divider/marker.
   * Each week is labeled (e.g., **W01**, **W02**), positioned consistently.
   * Weeks that span months are **assigned to the month that contains the majority of that week’s days** (e.g., 4 days in January vs 3 in December → the week belongs to January).
   * **Month labels** appear at month transitions and include the **month + year** (e.g., *January 2026*).

### P1 — Visual polish & lighting

7. **Base lighting for readability**

   * Scene is always readable: users can see crates and labels in all states.

8. **Dynamic lighting for active state**

   * Active tiles receive additional highlight lighting (crate and/or ball).
   * Inactive tiles appear muted/dimmed but still readable.

9. **Elegant aesthetic**

   * Minimal, cohesive styling (not overly “game UI”).
   * Subtle depth cues (fog/gradient/background layers) so it feels like a room.

### P2 — Delight & variation

10. **Shot variation**

* The ball’s entry motion can vary slightly (small lateral variance, arc variance) while still reliably landing in the crate.

11. **Micro-feedback**

* Optional: tiny “settle” behavior when the ball lands (small bounce/roll).

10. **Shot variation**

* The ball’s entry motion can vary slightly (small lateral variance, arc variance) while still reliably landing in the crate.

11. **Micro-feedback**

* Optional: tiny “settle” behavior when the ball lands (small bounce/roll).

## 7) Constraints & assumptions

* **Web-first** experience; should feel best on desktop but remain usable on mobile.
* **Provided assets**: crate model(s) and ball model(s) will be available either via local `/assets` folder or via URLs supplied during implementation planning.
* The PRD does not require true net/soft-body simulation.
* The experience should remain stable and deterministic enough for a habit tracker (no chaotic physics outcomes).

## 8) Quality bars / NFRs

* **Responsiveness:** input feedback is immediate; no “dead clicks.”
* **Smoothness:** scrolling and animations feel smooth under normal device conditions.
* **Determinism:** toggling ON should reliably result in a ball resting in the crate.
* **Legibility:** day labels, “today,” week separators, and month labels remain readable.
* **Visual polish:** lighting and materials avoid harsh clipping, unreadable darkness, or blown-out highlights.
* **Simplicity:** the product remains a tracker first; the 3D is in service of clarity and delight.

## 9) Conceptual model

### Entities

* **Date**: canonical day identifier (e.g., YYYY-MM-DD)
* **DayState**: `{ date, isActive }`

### Persistence

* Store a set/list/map of active dates.

### View mapping

* A visible “window” of day tiles maps to a contiguous date range.
* Tiles are recycled as the window shifts.

## 10) Experience notes (implementation-agnostic guidance)

* The “ball lands in crate” interaction is central; optimize for **satisfaction over realism**.
* A subtle ambient scene (floor plane, background gradient/fog) will help the row feel grounded.
* Dynamic lighting should be layered: keep a steady base light for visibility, then add **active-state accent light**.
* Labels (day number, month markers, week separators) can be rendered using in-engine text; they should remain consistent and readable.

## 11) Asset preparation & normalization (agent-facing guidance)

The following guidance exists to ensure that provided 3D assets are usable, consistent, and predictable without requiring the product author to manually edit models.

* **Asset sourcing**

  * Crate and ball models will be provided as raw downloads (e.g., `.glb` / `.gltf`) placed in a local assets directory.
  * Assets may be inconsistently scaled, oriented, or centered.

* **Normalization expectations**
  The agent is expected to normalize assets programmatically or via preprocessing so they work together coherently:

  * **Orientation**: establish a consistent world orientation (one axis treated as “up”).
  * **Origin**: re-center models so their logical base/center aligns sensibly (e.g., crate sits on a plane; ball centers on its mass).
  * **Scale relationship**: size assets so the **ball fits comfortably inside the crate**, with visible clearance allowing for bounce/roll.
  * **Relative realism**: absolute real-world units are not required, but proportions must feel plausible and visually satisfying.

* **Authoritative relationship**

  * The crate is the reference object.
  * The ball should be scaled relative to the crate opening, not vice versa.

* **Immutability assumption**

  * Once normalized, the crate is treated as a static, immovable object in the scene.
  * The ball is treated as the only object expected to move dynamically.

This section intentionally defines *what correctness looks like* without prescribing a specific tool (e.g., Blender vs code-based transforms).

## 12) Agent usage & build-planning expectations

This PRD is designed to be handed directly to an automated or human build agent.

When given this PRD, the agent is expected to:

* Treat the document as **source of truth** for product intent and experience.
* Produce a **build plan** before implementation, including:

  * scene structure and rendering approach
  * interaction handling (scrolling, toggling)
  * motion/physics strategy (real or faked)
  * persistence strategy
  * asset normalization approach
* Make deliberate, justified decisions where the PRD allows flexibility.
* Favor **deterministic, polished outcomes** over maximal realism.

The agent should **not**:

* Redesign the product or interaction model.
* Introduce additional features or modes beyond what is specified.
* Require the author to manually edit 3D assets unless explicitly unavoidable.

## 13) Decisions captured

* **Week/month cues:** relatively explicit; Monday-start weeks; week dividers + week labels (W01…); month labels with month + year; weeks spanning months belong to the month containing the majority of that week’s days.
* **Toggle OFF:** eject the ball upward and out on an arc (not a reverse of the “make” path).
* **Camera vs world motion:** default to a **fixed camera** with the **day-row container moving** during scroll, so any background/environment elements can remain spatially consistent.
