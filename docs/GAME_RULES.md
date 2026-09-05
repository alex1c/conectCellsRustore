# Connect Cells — Game Rules (Phase 1)

Original internal rules for our endless merge puzzle. Not a clone of any
existing commercial title. Prefer simplicity; mark uncertain knobs as
**TUNABLE**.

The engine implements one unambiguous behavior for every rule below.

---

## Board

| Rule | Value | Notes |
|------|-------|-------|
| Size | **5 × 5** | **TUNABLE** (4–6 are reasonable alternatives) |
| Coordinates | `row` 0..4, `col` 0..4 | Row-major; origin top-left |
| Cell | `null` (empty) or positive integer `value >= 1` | No zero, no negatives |

## Cell representation

- `value` is the merge level (1, 2, 3, …).
- There is no separate “color” or type field in Phase 1 — equality is by
  numeric value only.
- **TUNABLE:** later themes may map values to visuals; engine stays numeric.

## Neighborhood

- Orthogonally adjacent only: up / down / left / right.
- Diagonals are **not** neighbors.

## Initial layout

1. Create an empty 5×5 board.
2. Using the deterministic RNG from the run seed, fill **every** cell with an
   integer uniformly chosen from `1 .. MAX_INITIAL_VALUE`.
3. `MAX_INITIAL_VALUE = 3` (**TUNABLE**).
4. `score = 0`, `moveCount = 0`, `largestValue` = max on board,
   `largestChain = 0`, status `playing`.
5. If no legal move exists after generation, status becomes `game_over`
   immediately (rare on 5×5 with values 1–3).

## Legal move

A move is an ordered pair of positions `(from, to)` such that:

1. Both positions are in bounds.
2. Both cells are non-empty.
3. `from` and `to` are orthogonally adjacent.
4. `board[from] === board[to]` (same value).

UI sends this intent; the engine validates. Illegal moves leave state unchanged
and produce no events (or a rejected result — engine returns the same state
with an empty event list and a `ok: false` flag).

## Merge (primary)

On a legal move with shared value `V`:

1. Emit `MOVE`.
2. Clear `from` (`null`).
3. Set `to` to `V + 1`.
4. Emit `MERGE` with `chainLevel = 1`, `fromValue = V`, `toValue = V + 1`.
5. Add score for this step (see Scoring).

## Chain reaction

After the primary merge, while the cell at `to` is non-empty:

1. Collect all orthogonally adjacent neighbors whose value equals the
   **current** value at `to`.
2. If none — stop chaining.
3. If several — pick the neighbor with smallest `row`, then smallest `col`
   (deterministic).
4. Clear that neighbor; increment value at `to` by 1; emit `CHAIN_STEP`
   with increasing `chainLevel` (2, 3, …).
5. Add score for that step.
6. Repeat from step 1 with the new value.

The engine returns the **final** board plus the full ordered `events` list so
UI can animate later without re-deriving merge logic.

**TUNABLE:** whether multiple equal neighbors at one step should all merge in
one step vs one-at-a-time. Phase 1 uses **one-at-a-time** for clearer chains.

## Scoring

For a merge/chain step that replaces value `V` with `V + 1` at `chainLevel` L:

```
gain = SCORE_BASE * V * L
```

- `SCORE_BASE = 10` (**TUNABLE**)
- Score never decreases on a successful move.
- `largestValue` updates if the cell at `to` exceeds the previous max.
- `largestChain` updates if this move's max `chainLevel` is a new high for the run.

Emit a single `SCORE_GAIN` after the move's merge+chain finishes (total gain
for the move). Emit `NEW_BEST_CANDIDATE` when `largestValue` increases.

## Spawning

After merge + chain settle:

1. Collect empty cells.
2. If none — skip spawn.
3. Otherwise pick one empty cell uniformly via RNG; place `SPAWN_VALUE`.
4. `SPAWN_VALUE = 1` (**TUNABLE**).
5. Emit `SPAWN`.
6. Spawning does **not** immediately trigger extra merges; the player must
   choose the next pair. (**TUNABLE:** auto-resolve after spawn.)

## Game Over

After a successful move (and spawn), if `getLegalMoves(state)` is empty:

- Set `status = game_over`
- Emit `GAME_OVER`

Also possible right after initial generation if the board has no pairs.

## Restart

`restart(seed)` creates a fresh initial game from `seed` (may equal or differ
from the previous run). Clears undo snapshot.

## Undo

- Phase 1: **one** undo slot.
- Before applying a **successful** legal move, store a serializable snapshot of
  the full run state (board, score, moveCount, status, RNG state, largest*,
  seed) with `undoSnapshot: null` inside the snapshot (no nested undo history).
- `undo` restores that snapshot exactly, including RNG — no drift.
- After undo, undo is consumed (`undoSnapshot = null`) until the next successful
  move.
- Re-applying the same move after undo must yield the same resulting state.

## Deterministic RNG

- Engine never calls `Math.random()`.
- Mulberry32-style PRNG; state is a single 32-bit unsigned integer field,
  serialized with the game.
- Same `seed` + same move sequence ⇒ same boards, scores, and events.

## Serialization

`GameState` is JSON-safe: plain data only (no functions, class instances, or
React objects). Round-trip `JSON.stringify` / `JSON.parse` (+ validate) must
restore an equivalent state for resume/tests.

## Explicit non-goals (rules layer)

- No diagonal merges
- No multi-cell path drawing beyond adjacent pairs
- No timed moves
- No networked rules
