# Hexonica — Game Feel (Phase 4.2 polish)

Presentation layer only. **Engine remains the sole source of truth.**

## Visual tokens (1.0 dark theme only)

Hexonica 1.0 ships **one** appearance: a calm dark blue-gray theme.
There is no light theme, no selector, and no system theme sync.

Shared chrome in `src/ui/theme/colors.ts`:

| Token | Role |
|-------|------|
| `COLOR_APP_BACKGROUND` | Home / Game / Settings / How to Play backdrop |
| `COLOR_SURFACE` / `COLOR_SURFACE_ELEVATED` | Panels / cards / chrome |
| `COLOR_BOARD_BACKGROUND` | Soft plane under hexes |
| `COLOR_EMPTY_CELL` / `COLOR_EMPTY_CELL_BORDER` | Placeable empty hexes |
| `COLOR_TEXT_*` | Primary / secondary / muted copy |
| `COLOR_BUTTON_*` / progress / warning / score gain | Actions & feedback |

Occupied cell fills stay in `cellVisuals.ts` (vivid on dark). Board geometry
(`boardWrap` flex-start, ScoreHeader gain slots) must stay stable during merge.

Native `Alert` (e.g. ad-unavailable) follows the OS and is not custom-themed.

## Sound map (SFX only — no BGM)

Settings label: **Звуки** (never «Музыка»). Default ON. Persisted locally.

Central API: `src/ui/feel/sound.ts` (`playSelect`, `playMove`, `playBlocked`,
`playSpawn`, `playMerge(cascade, groupSize)`, `playTerminal`, `playLevelUp`,
`playGameOver`, `pauseGameplayAudio`). Fire-and-forget; never await on hot path.

| Cue | Asset | Notes |
|-----|-------|-------|
| select | `select.wav` | Quiet click |
| move | `move.wav` | One cue per move, not per hop |
| blocked | `blocked.wav` | Path closed |
| spawn | `spawn.wav` | One soft pop per turn spawn |
| merge4 | `merge.wav` | Cascade 1, group ≤4 |
| merge5+ / cascade2 | `merge2.wav` | Richer |
| cascade3+ | `merge3.wav` | Highest escalate |
| terminal | `terminal.wav` | Distinct ≥128 clear |
| level up | `levelup.wav` | Non-blocking toast |
| game over | `gameover.wav` | Before interstitial; paused for ads |

### Asset license

All files under `assets/sounds/` are original short tones generated for this
project (simple synthesized WAV). Safe to ship commercially. No third-party
game audio copied.

`pauseGameplayAudio()` runs on app background and before interstitial / rewarded.

## Haptic map

Settings label: **Вибрация**. Default ON. `src/ui/feel/haptics.ts`.

| Event | Feedback |
|-------|----------|
| select | `selectionAsync` (light; human may drop after OPPO feel check) |
| move | **none** (OPPO: movement already has strong visual feedback) |
| blocked | Warning notification |
| merge4 | Medium impact |
| merge5+ | Heavy impact |
| cascade2 | Medium |
| cascade3+ | Heavy |
| terminal | Success notification (single cue) |
| level up | Success |
| game over | Error (distinct, not aggressive) |

No haptic on spawn or score popup. Never await haptic before unlock.

## Input lock / performance

`inputLocked` covers successful turn playback. Path traveler uses native driver.
PERF_TELEMETRY defaults false. Sound/haptic must not regress movement
responsiveness or merge board stability (HEAD 361b690 / 78166cb).
