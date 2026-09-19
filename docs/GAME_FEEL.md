# Connect Cells — Game Feel (Phase 3)

Presentation layer only. **Engine remains the sole source of truth.**

## Animation sequence

Successful turn playback order:

1. `MOVE` — BFS path stepped hex→hex (traveler overlay; origin cleared)
2. `MERGE` — absorbed cells shrink, then anchor pops with new value
3. cascade `MERGE` steps — sequential with pause (no simultaneous merges)
4. `SCORE_GAIN` — header sync + optional flash
5. `SPAWN` — short scale/fade with light stagger
6. `LEVEL_UP` — brief toast
7. `GAME_OVER` — sound/haptic; overlay after input unlock

Interrupted playback (token bump / app background) snaps UI to the authoritative final `GameState`.

## Timing constants

Centralized in `src/ui/feel/timings.ts` (TUNABLE after real-device review):

| Constant | Role |
|----------|------|
| `pathTotalMs` / `pathStepMs` | BFS path budget (short/medium/long, **hard cap 300ms**) |
| `TIMING_SELECTION_MS` | selection wobble piece |
| `TIMING_MERGE_CONVERGE_MS` | shrink absorbed cells |
| `TIMING_MERGE_POP_MS` / `LARGE` | anchor pop |
| `TIMING_CASCADE_PAUSE_MS` | gap between cascade merges |
| `TIMING_SCORE_POPUP_MS` / `FLASH` | float `+N` / header flash wait |
| `TIMING_SPAWN_MS` / `STAGGER` | spawn appear |
| `TIMING_LEVEL_UP_MS` | level-up toast |
| `TIMING_BLOCKED_FLASH_MS` | «Путь закрыт» |
| `TIMING_CHAIN_TOAST_MS` | «Цепочка ×N» |

### Hotfix (cell scale)

`HexCellView` keeps per-position `Animated.Value`s. Merge shrink and spawn must
**snap back to canonical scale=1 / opacity=1** when the transient flag ends or
the animation is interrupted. Path traveler is a separate non-animated overlay.

## Haptic mapping

| Event | Feedback |
|-------|----------|
| select | selection |
| move | Soft (optional feel) |
| blocked | Warning notification |
| merge4 | Medium impact |
| merge5+ | Heavy impact |
| cascade2 | Medium |
| cascade3+ | Heavy |
| level up | Success |
| game over | Error (distinct, not aggressive) |

Honors Settings → Вибрация (default ON).

## Sound mapping

Original short WAV tones in `assets/sounds/` via `expo-audio`:

| Id | Use |
|----|-----|
| select | cell select |
| move | path travel start |
| merge / merge2 / merge3 | cascade pitch escalate |
| spawn | new cells |
| blocked | path closed |
| levelup | level toast |
| gameover | end of run |

Honors Settings → Звук (default ON). Soft-fails if native audio module is unavailable.

## Input lock

`inputLocked` is true for the whole successful turn playback. Undo / Restart / cell taps are blocked. Rapid taps cannot enqueue a second move.

## Balance

Phase 3 **does not** change spawn math, thresholds, or scoring.
