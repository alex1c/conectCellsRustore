# Screenshot plan — Hexonica RuStore

## Principles

- Deterministic **hex fixtures** drive store boards (`screenshot*` in `src/game/fixtures.ts`).
- Fixture / capture chrome is **DEV-only** (`ScreenshotCaptureBar`, `DevPanel`).
- Final PNGs: **1080×1920**, dark theme, no GameScreen banner.
- Capture helper: `scripts/capture-rustore-screenshots.py`

## Fixtures → files

| Fixture | File | Intent |
|---------|------|--------|
| `screenshotNormal` | `store-assets/screenshots/01-hero.png` | Mid-game beauty / Level 3 |
| `screenshotMove` | `store-assets/screenshots/02-movement.png` | Sparse board / movement |
| `screenshotMerge` | `store-assets/screenshots/03-merge.png` | Ready group of four 4s |
| `screenshotCascade` | `store-assets/screenshots/04-cascade.png` | 1s + 4s cascade setup |
| `screenshotHigh` | `store-assets/screenshots/05-high-values.png` | High values ≤256 |
| `screenshotLevel` | `store-assets/screenshots/06-levels.png` | Level 4 pressure |

Optional Home / onboarding shot: not included (gameplay dominates gallery).

## Capture notes

- OPPO 1080×2400 raw → crop status bar + exclude DEV/nav → pad to 1080×1920 with `#101826`.
- Do not click production ads during capture.
- Master icon: `assets/icon_gpt.png` (immutable).
