# Privacy policy — deployment (ForestMusic website)

**Do not publish from this game repository without owner approval.**

## Draft files (this repo)

| File | Language | Intended public path |
|------|----------|----------------------|
| `docs/privacy/index.html` | EN | `https://forest-music.ru/privacy/` |
| `docs/privacy/ru.html` | RU | `https://forest-music.ru/privacy/ru.html` |

In-app link: `https://forest-music.ru/privacy/` (`src/privacy/privacyUrls.ts`).

## Target repository

Website: **alex1c/ForestMusicLanding** (https://forest-music.ru).

Suggested copy:

1. Add `public/privacy/index.html` from `docs/privacy/index.html`.
2. Add `public/privacy/ru.html` from `docs/privacy/ru.html`.
3. Deploy the landing site as usual.
4. Verify both URLs return **HTTP 200** before marking the policy READY in Play Console.

## Status

Until the owner publishes and HTTP 200 is confirmed, the policy is **DRAFT / PENDING PUBLICATION**.
The game repo must not claim a live policy URL is ready.
