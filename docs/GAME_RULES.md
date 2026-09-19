# Connect Cells — Game Rules (Phase 2.7)

## History

Phase 1–2.5 prototype used an incorrect square adjacent-merge model and was
superseded by the hex path-merge specification (Phase 2.6).

Phase 2.7 adds a **spawn-pressure candidate** derived from human observations of
the original Connect Cells game. It is a working hypothesis for playtest — **not**
a proven reconstruction of the original hidden formula.

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

Groups of 3 or fewer never merge. Score is unchanged in Phase 2.7.

## Cascade

Merges resolve repeatedly until no group ≥ 4 remains. Each successive merge in
the same turn increases `cascadeLevel` for events / haptics / metrics.

Spawn count (when using `observedPressure`) is decided from the **largest**
merged group size in the whole turn (see below).

## Turn order

```text
player move
→ merge / cascade settle
→ resolve spawn plan (rules + maxMergedGroupSize)
→ spawn (clamped to free cells)
→ NO auto-merge of spawned cells
→ check Game Over
```

---

## Spawn presets

Production / default preset remains **`phase26`** until human review.

DEV can switch between:

| Preset | Role |
|--------|------|
| `phase26` | Phase 2.6 comparison baseline |
| `observedPressure` | Candidate A for pressure playtest |

### Implemented candidate — `observedPressure`

Working hypothesis (not claimed as the original formula):

| Turn outcome | Spawn count |
|--------------|-------------|
| no merge | **+2** cells |
| max merged group size **= 4** | **+1** cell |
| max merged group size **≥ 5** | **+0** cells |

Cascade examples:

- groups `4 → 4` → max 4 → **+1**
- groups `4 → 5` → max 5 → **+0**
- groups `6 → 4` → max 6 → **+0**

Spawn values (TUNABLE weights, not original probabilities):

| Value | Weight |
|-------|--------|
| 1 | 40% |
| 2 | 40% |
| 4 | 20% |

Values **8+** never appear from random spawn — only from merges.

Free-cell clamp: if fewer empties than desired, spawn that many (or 0).

Spawn **never** auto-merges. Occasional original `0,0` (no merge, no spawn) is
**not** implemented — trigger unknown; `observedPressure` always spawns 2 on
no-merge turns.

### Comparison baseline — `phase26`

- Spawn **only if** the turn produced no merge.
- Count weights (TUNABLE): 1 → 25%, 2 → 50%, 3 → 25%.
- Values (TUNABLE): 1 → 50%, 2 → 50%.

---

## Direct observations from original

Recorded as `(spawnCount, mergeFlag)` where mergeFlag `0` = no merge, `1` = merge:

```text
2,0  0,0  0,1  2,0  0,1  2,0  0,1  0,1  0,1  2,0  0,1  1,1  0,1
2,0  1,1  1,1  2,0  1,1  1,1  1,1  2,0  1,1  2,0  1,1  1,1  2,0
```

Sample tallies:

- no merge + 2 spawn: 9
- no merge + 0 spawn: 1
- merge + 1 spawn: 9
- merge + 0 spawn: 7

Additional human notes:

- new blocks appear in batches of **1 or 2**;
- spawn values among low denominations **1, 2, 4**;
- high values come from merges;
- groups larger than 4 sometimes corresponded to no spawn;
- spawn sometimes absent in other situations too.

### Unknown (do not invent)

- exact cause of the single `0,0` observation;
- whether merge spawn 0 vs 1 is purely group-size based or uses other hidden state;
- exact spawn-value probabilities in the original;
- full original algorithm.

---

## Initial fill

Fresh games place `INITIAL_CELL_COUNT` cells (default **12**, TUNABLE).

- `phase26`: values 1/2.
- `observedPressure`: values 1/2/4 using the observed value weights.

## Game Over

Game Over when **no legal movement** remains after the turn’s spawn step.

Merge availability alone does **not** define Game Over.

## Undo / Restart

- One Undo snapshot before each successful move (board, score, RNG, rules, stats).
- Restart asks for confirmation; Best score is preserved.
- Preset id is stored on `GameState.rules` and persists with schema **v4**.

## Determinism

Engine never uses `Math.random()` for rules. Same seed + preset + move sequence ⇒
same spawn counts, values, and positions. Undo restores RNG exactly.
