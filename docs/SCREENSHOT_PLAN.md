# Screenshot plan (hex) — Phase 3

Store screenshots must **not** be captured from random live gameplay.

## Principles

- Deterministic **hex fixtures** drive future screenshot boards.
- Fixture / demo entry points stay **dev-only** (`__DEV__` DevPanel).
- Target ~6 RuStore screenshots at **1080×1920** later (not in Phase 3).
- One master icon for app + storefront (`docs/ASSET_POLICY.md`).

## Deterministic fixtures

| Fixture | Intent |
|---------|--------|
| `screenshotNormal` | Beautiful balanced field |
| `screenshotMove` | Open movement / selection space |
| `screenshotMerge` | Ready group of 4 |
| `screenshotCascade` | Strong chain setup |
| `screenshotHigh` | High values + score |
| `screenshotLevel` | Level 3/4 + progress |

Also available for drafting: `balancedBoard`, `merge4`, `cascade3`, `highValues`, `nearLevel3`.

## Folders

- `store-assets/` — master marketing / icon sources
- `screenshots/` — exported store outputs
- `release-artifacts/` — local AAB/APK drops (gitignored binaries)

## Phase 3 status

Fixtures prepared and visually loadable in DEV. **Final RuStore captures deferred.**
