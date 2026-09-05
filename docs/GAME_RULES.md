# Connect Cells — Game Rules (Phase 2.6)

## History

Phase 1–2.5 prototype used an incorrect square adjacent-merge model and was
superseded by this hex path-merge specification.

---

## Board geometry

| Rule | Value | Notes |
|------|-------|-------|
| Size | **6 × 8** (cols × rows) | Compact phone-friendly field |
| Topology | **Pointy-top hex**, odd-r offset coords | Six neighbors per cell |
| Cell | `null` (empty) or positive integer value | Values grow by ×4 on merge |

Coordinates: `row` 0..7, `col` 0..5. Origin top-left.

## Player movement

1. Select an **occupied** cell.
2. Choose an **empty** destination.
3. The piece may travel any length through **contiguous empty hexes** (BFS).
4. Occupied cells block the path (the origin is treated as empty while moving).
5. If no path exists → move rejected (“Путь закрыт”).

## Merge

After a successful move settles:

1. Find connected components of equal values (hex adjacency).
2. Any group with size **≥ 4** merges.
3. **Result value** = `value × 4`  
   Examples: `4×1 → 4`, `4×2 → 8`, `4×4 → 16`.
4. **Score gain** = `value × groupSize` (pre-merge value × number of cells).
5. Cleared cells become empty; the result is written to a deterministic anchor
   (prefer the move destination when it belonged to the group; otherwise the
   lexicographically smallest cell in the group).

Groups of 3 or fewer never merge.

## Cascade

Merges resolve repeatedly until no group ≥ 4 remains. Each successive merge in
the same turn increases `cascadeLevel` for events / haptics / metrics.

## Spawn

- Spawn happens **only if the turn produced no merge**.
- Spawn **does not** auto-resolve merges.
- Count (TUNABLE temporary weights): **1 → 25%, 2 → 50%, 3 → 25%**.
- Values (TUNABLE): **1 → 50%, 2 → 50%**.
- Placed into random empty cells via deterministic RNG.

## Initial fill

Fresh games place `INITIAL_CELL_COUNT` cells (default **12**, TUNABLE) with
values 1/2 using the same value weights. Remaining cells stay empty.

## Game Over

Game Over when **no legal movement** remains:

- No occupied cell can reach any empty destination through empty hexes.

Merge availability alone does **not** define Game Over. A full / blocked board
with zero reachable empties is Game Over.

## Undo / Restart

- One Undo snapshot before each successful move (board, score, RNG, rules, stats).
- Restart asks for confirmation; Best score is preserved.

## Determinism

Engine never uses `Math.random()` for rules. Same seed + move sequence ⇒ same
outcome. State is JSON-serializable (schema version **3**).
