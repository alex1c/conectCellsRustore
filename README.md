# Connect Cells

Endless hex path-merge puzzle for Android / RuStore.

Working title: **Connect Cells**. Package id: `ru.forestmusic.connectcells`.

## Phase 2.6

Correct core mechanic:

- Hex board **6×8** (pointy-top, odd-r)
- Move along empty paths (BFS)
- Merge connected groups **≥ 4** → `value × 4`
- Score = `value × groupSize`
- Cascade until stable
- Spawn 1–3 cells (values 1/2) **only** on non-merge turns
- Game Over = no legal movement

## Scripts

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run test:benchmark
npm start
# with existing native dev client:
npm run start:dev-client
```

## Docs

- `docs/PRODUCT_SPEC.md`
- `docs/GAME_RULES.md`
- `docs/SCREENSHOT_PLAN.md`
- `docs/ASSET_POLICY.md`
- `docs/rustore/README.md`
