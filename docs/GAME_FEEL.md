# Hexonica — Game Feel (Phase 4.2 polish)

Presentation layer only. **Engine remains the sole source of truth.**

## Visual tokens

Shared chrome in `src/ui/theme/colors.ts` (calmer default — not a dark theme):

| Token | Value | Use |
|-------|-------|-----|
| `COLOR_SURFACE` | `#d8e0eb` | Home / Game / Settings / How to Play backdrop |
| `COLOR_SURFACE_CARD` | `#eef2f7` | Cards / chrome buttons |
| `COLOR_BOARD_PLANE` | `rgba(198,210,226,0.72)` | Soft plane under hexes |
| `COLOR_TEXT` / `COLOR_TEXT_MUTED` | `#0f172a` / `#526277` | Primary / secondary text |
| Empty hex | fill `#d5dde8`, stroke `#9aabbf` | Clear destinations without glare |

Occupied cell palette in `cellVisuals.ts` is unchanged. Board geometry
(`boardWrap` flex-start, ScoreHeader gain slots) must stay stable during merge.

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
