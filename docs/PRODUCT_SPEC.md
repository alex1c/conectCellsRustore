# Connect Cells — Product Specification

Working title: **Connect Cells**. Final RuStore display name may change later;
architecture must not depend on the marketing string.

## Product principle

This is **not** a mini-game collection.

It is one high-quality endless puzzle with a hex path-merge core loop —
inspired by the *general idea* of merging numbered cells, implemented as an
original game without copying third-party names, art, assets, sounds, UI, copy,
or visual identity.

### Core value

- Extremely understandable rules
- Short time-to-first-fun
- Endless single-run sessions
- Satisfaction from group merges
- Especially satisfying **cascades**
- Desire to beat one's own high score

## Core loop

```
select cell
→ choose empty destination
→ pathfinding across empty hexes
→ merge / cascade   OR   spawn pressure
→ plan the next move
```

1. Player sees the hex field.
2. Selects an occupied cell (wobble feedback).
3. Moves it along a free path to an empty hex.
4. Connected groups of **≥ 4** equal values merge (`value × 4`).
5. Cascades may continue automatically.
6. If no merge occurred, 1–3 new cells (values 1/2) spawn.
7. Score updates; the run continues while any piece can still move.

## Design principles

- Rules explainable in a few seconds.
- Outcomes of a chosen move are predictable (no hidden post-hoc randomness).
- Randomness (initial layout, spawns) is seeded and deterministic.
- Cascade is the central emotional beat.
- UI must not obscure the board.
- Future ads must not break play rhythm (deferred).
- **Game engine is fully separated from UI**.

## V1.0 scope (future)

Endless mode, score/best, Undo, auto-save, Restart, Game Over, short onboarding,
local stats, themes, sound/haptics, ads, AppMetrica, RuStore assets.

Out of v1.0: accounts, cloud, leaderboards, Daily Challenge, PvP, achievements,
server/backend.
