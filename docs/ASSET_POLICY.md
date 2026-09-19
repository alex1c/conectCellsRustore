# Asset policy — Гексоника

## Master icon

`assets/icon_gpt.png` is the approved master artwork.

Do **not** overwrite it destructively. Derived assets are generated from it:

| File | Role |
|------|------|
| `assets/icon.png` | Expo app icon |
| `assets/android-icon-foreground.png` | Adaptive foreground |
| `assets/android-icon-background.png` | Adaptive background |
| `assets/android-icon-monochrome.png` | Monochrome |
| `assets/favicon.png` | Web favicon |
| `assets/splash-icon.png` | Splash |
| `store-assets/icon-512.png` | Store listing |
| `store-assets/icon-1024.png` | Store listing |

Regenerate derived files with a local script if the master is updated — never edit the master in place for size variants.
