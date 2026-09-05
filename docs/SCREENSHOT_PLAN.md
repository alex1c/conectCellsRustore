# Screenshot plan (hex)

Store screenshots must **not** be captured from random live gameplay.

## Principles

- Deterministic **hex fixtures** drive future screenshot boards.
- Fixture / demo entry points stay **dev-only**.
- Target ~6 RuStore screenshots.
- One master icon for app + storefront (`docs/ASSET_POLICY.md`).

## Proposed shot list

1. Beautiful balanced field (`balancedBoard`)
2. Selected cell / movement (`simpleMove` / `longPath`)
3. Merge group moment (`merge4` / `mergeTo4`)
4. Large cascade (`cascade2` / `cascade3`)
5. High score / high values (`highValues`)
6. Near game over pressure (`nearGameOver`)

## Folders

- `store-assets/` — master marketing / icon sources
- `screenshots/` — exported store outputs
- `release-artifacts/` — local AAB/APK drops (gitignored binaries)
