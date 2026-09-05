# Connect Cells — Product Specification (Phase 1)

Working title: **Connect Cells**. Final RuStore display name may change later;
architecture must not depend on the marketing string.

## Product principle

This is **not** a mini-game collection.

It is one high-quality endless puzzle mechanic inspired by the *general idea*
of connecting/merging equal cells — implemented as an original game without
copying any third-party title's name, art, assets, sounds, UI, copy, or visual
identity.

### Core value

- Extremely understandable rules
- Very short time-to-first-fun
- Endless single-run sessions
- Satisfaction from merges
- Especially satisfying **chain reactions**
- Desire to beat one's own high score

## Core loop

The player:

1. Sees the board.
2. Chooses a legal merge pair (two orthogonally adjacent equal cells).
3. Creates a valid connection / merge.
4. Equal cells combine into the next value.
5. Sequential **chain reactions** may fire when the new value touches equals.
6. Score increases.
7. A new low-value cell may spawn into an empty slot.
8. The run continues while at least one legal merge exists.

## Design principles

- Rules must be explainable in a few seconds.
- Outcomes of a chosen move must be predictable (no hidden randomness that
  alters an already-resolved move).
- Randomness (initial layout, spawns) is seeded and deterministic.
- Chain reaction is the central emotional beat.
- UI must not obscure the board.
- Future ads must not break the play rhythm (integration deferred).
- **Game engine is fully separated from UI** (pure TypeScript, no React Native
  imports inside `src/game`).

## V1.0 scope (future — not Phase 1)

In scope for a later v1.0:

- Endless main mode
- Score + best score
- Undo
- Auto-save / resume after restart
- Restart
- Game Over
- Short onboarding
- Local statistics
- Visual themes
- Sound + haptic
- Ads + AppMetrica
- RuStore release assets

Explicitly **out** of v1.0:

- Accounts, cloud sync, leaderboards
- Daily Challenge, PvP, social features
- Dozens of modes, achievements
- Server / backend

## Phase 1 deliverable

Foundation only: specs, pure engine, unit tests, minimal launch screen.
Playable polished UI and store polish belong to later phases.
