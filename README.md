# Connect Cells

Endless merge puzzle for Android / RuStore.

Working title: **Connect Cells**. Package id: `ru.forestmusic.connectcells`.

## Phase 2

Playable prototype on a single game screen:

- Real 5×5 board with tap → tap merge interaction
- Score / Best (AsyncStorage)
- Undo (one free), Restart with confirm, Game Over overlay
- Event playback for merge / chain / spawn
- Auto-save / restore current run
- Dev-only fixtures + run metrics (`__DEV__`)

Engine remains pure TypeScript under `src/game` (no React Native imports).

## Scripts

```bash
npm install
npm run typecheck
npm run lint
npm test
npm start
```

## Engine API

- `createInitialGame(seed)` / `createFreshSeed()`
- `getLegalMoves(state)` / `applyMove(state, move)`
- `canUndo(state)` / `undo(state)`
- `loadFixture(id)` — development fixtures

Tunables live in `src/game/constants.ts`.

## Docs

- `docs/PRODUCT_SPEC.md`
- `docs/GAME_RULES.md`
- `docs/SCREENSHOT_PLAN.md`
- `docs/ASSET_POLICY.md`
- `docs/rustore/README.md`
