# Asset policy — Гексоника

## Master icon

`assets/icon_gpt.png` is the approved master artwork.

Do **not** overwrite it destructively. Derived assets are generated from it:

| File | Role |
|------|------|
| `assets/icon.png` | Expo app icon |
| `assets/android-icon-foreground.png` | Adaptive foreground (scaled into safe zone) |
| `assets/android-icon-background.png` | Adaptive background (`#101826`) |
| `assets/android-icon-monochrome.png` | Monochrome |
| `assets/favicon.png` | Web favicon |
| `assets/splash-icon.png` | Splash |
| `store-assets/icon-512.png` | Store listing |
| `store-assets/icon-1024.png` | Store listing |

Regenerate derived files with a local script if the master is updated — never edit the master in place for size variants.

### Android adaptive safe zone

OEM launchers (including OPPO) mask adaptive icons and can clip artwork near the
edges. The adaptive **foreground** must contain the **complete** master scaled
down with transparent padding so «Гексоника» stays inside the mask — never crop
the master to fix clipping.

Regenerate with:

```bash
python scripts/generate-adaptive-foreground.py --scale 0.65
```

Default `0.65` was verified on OPPO CPH2687RU so «Гексоника» stays inside the
rounded adaptive mask. Raise only if a specific OEM needs a larger mark; lower
further (e.g. `0.60`) if another mask still clips the title.
Store / Expo `icon.png` may keep the full master bleed where no adaptive mask applies.

## Native label / icon reproducibility

Tracked source of truth:

* `app.json` → `expo.name` = **Гексоника** (becomes Android `app_name` on Expo prebuild / `expo run:android`)
* `app.json` → `expo.icon` + `android.adaptiveIcon.*` + `splash.image`

The generated `android/` directory is gitignored. Production branding must **not** depend on manually editing gitignored `strings.xml`. After a clean native regeneration, the label and icons come from the tracked assets/config above.
