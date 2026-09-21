# RuStore release checklist

Future submission checklist. Unknown fields stay blank — do not invent values.

| Item | Value / notes |
|------|----------------|
| Final app name | **Гексоника** / store: **Гексоника — числовая головоломка** |
| Package | `ru.forestmusic.connectcells` |
| versionName | `1.0.0` (`app.json`) |
| versionCode | `1` (`app.json` → Expo prebuild) |
| Support email | `rustore-alex1c@yandex.ru` |
| Privacy policy URL | _TBD_ |
| Icon | Master `assets/icon_gpt.png` → derived tracked assets (`docs/ASSET_POLICY.md`) |
| Screenshots | `store-assets/screenshots/01-hero.png` … `06-levels.png` |
| Short description | See `docs/rustore/STORE_LISTING.md` |
| Full description | See `docs/rustore/STORE_LISTING.md` |
| Tags | _TBD_ |
| Age rating | _TBD_ |
| Ads declaration | Yandex Ads units R-M-20075886-1…5 (banners / interstitial / rewarded) |
| AppMetrica | Production key configured (masked in reports) |
| Release AAB | Build in a later phase; binaries stay out of git |
| Signature verification | _TBD_ |

## Branding reproducibility

Android label and icons regenerate from tracked `app.json` + `assets/*` via Expo prebuild / `expo run:android`. Do not rely on manual edits under gitignored `android/`.
