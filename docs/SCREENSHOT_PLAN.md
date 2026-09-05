# Screenshot plan (future)

Store screenshots must **not** be captured from random live gameplay.

## Principles

- Later phases will add **deterministic screenshot fixtures** driven by the
  seeded game engine (fixed seed + fixed move script ⇒ fixed board).
- Fixture / demo entry points must **not** ship inside ordinary production UI
  navigation (dev-only or build-time tooling).
- Target roughly **6** RuStore store screenshots.
- One **master icon** artwork feeds both the embedded Android icon and the
  RuStore storefront image (see `docs/ASSET_POLICY.md`).

## Proposed shot list (placeholder)

1. Mid-run board with a clear merge opportunity
2. Chain reaction highlight / high score moment
3. Game Over
4. Undo / continue affordance
5. Theme variant A
6. Theme variant B or short tips

Exact compositions are deferred until UI exists.

## Folders

- `store-assets/` — master marketing / icon sources
- `screenshots/` — exported store PNG/WebP outputs
- `release-artifacts/` — local AAB/APK drops (gitignored binaries)
