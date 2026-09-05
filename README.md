# Connect Cells

Endless merge puzzle for Android / RuStore.

Working title: **Connect Cells**. Package id: `ru.forestmusic.connectcells`.

## Phase 1

Foundation only:

- Expo SDK 57 + React Native + TypeScript (strict)
- Product and rules specs under `docs/`
- Pure TypeScript game engine in `src/game` (no React Native imports)
- Jest unit tests for the engine
- Minimal launch screen (`App.tsx`)

Playable UI, themes, sound, ads, and RuStore submission come later.

## Scripts

```bash
npm install
npm run typecheck
npm run lint
npm test
npm start
```

## Engine

Import from `src/game`:

- `createInitialGame(seed)`
- `getLegalMoves(state)`
- `applyMove(state, move)`
- `canUndo(state)` / `undo(state)`
- `restart(seed)`
- `isGameOver(state)`

Same seed + same move sequence ⇒ same outcome (deterministic RNG).

## Docs

- `docs/PRODUCT_SPEC.md`
- `docs/GAME_RULES.md`
- `docs/SCREENSHOT_PLAN.md`
- `docs/ASSET_POLICY.md`
- `docs/rustore/README.md`
