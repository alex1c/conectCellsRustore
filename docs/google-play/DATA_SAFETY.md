# Google Play Data Safety — Hexonica worksheet

**Package:** `ru.forestmusic.connectcells`  
**Prepared:** 2026-10-14 (PHASE 2B)  
**SDK versions (declared):** `yandex-mobile-ads@8.4.0`, `@appmetrica/react-native-analytics@4.2.0`  
**Privacy policy URL (target):** https://forest-music.ru/privacy/  
**Publication status:** Draft until website owner publishes (HTTP 200) — see `docs/privacy/DEPLOY.md`

**Principle:** Declare off-device collection/sharing by the app and embedded SDKs after the user allows optional purposes on the Google Play build. Local game saves that never leave the device under developer/SDK control are **not** marked as collected gameplay content.

Adapted from ForestMusic `bloodPressureDiaryRuStore` Data Safety matrix — **medical / health categories removed**.

---

## Top-level Console answers

| Console question | Recommended value | Basis |
|------------------|-------------------|--------|
| Does your app collect or share any of the required user data types? | **Yes** | Optional AppMetrica + Yandex Mobile Ads after consent (Play) |
| Is all collected user data encrypted in transit? | **Yes** | Vendor guides: Ads HTTPS/TLS; AppMetrica encryption in transit |
| Do you provide a way for users to request that their data is deleted? | **Yes** | Email `rustore-alex1c@yandex.ru` (see scope) |
| Account deletion | **Not applicable** | No accounts |
| Independent security review? | **No** | Unless obtained later |
| Contains ads? | **Yes** | Yandex Mobile Ads |
| Advertising ID used? | **Yes** | Ads SDK AD_ID path; AppMetrica adv ID when analytics on |

### Deletion-request scope

| Data | How deletion works | Developer guarantee |
|------|--------------------|---------------------|
| Local saves / settings | Clear app data or uninstall | Full local control |
| SDK technical data (IDs, diagnostics, events) | Email request; developer responds + Yandex channels | Request path exists; cannot independently wipe Yandex backends |

---

## Category matrix

Assume optional purposes may be granted (truthful worst-case for international listing). SDK rows below are **Optional**.

| Google Play category | Collected | Shared | Optional | Purpose(s) | Evidence / source |
|----------------------|-----------|--------|----------|------------|-------------------|
| App interactions | Yes (if analytics) | Yes → AppMetrica | Yes | Analytics | Custom events in `src/analytics/appMetrica.ts` |
| Crash logs | Yes (if analytics) | Yes → AppMetrica | Yes | Analytics | AppMetrica Data Safety default |
| Diagnostics | Yes (if analytics) | Yes → AppMetrica | Yes | Analytics | AppMetrica Data Safety default |
| Other app performance data | Yes (if analytics) | Yes → AppMetrica | Yes | Analytics | AppMetrica Data Safety default |
| Device or other IDs | Yes (if ads and/or analytics) | Yes → Yandex | Yes | Advertising; Analytics | Ads + AppMetrica vendor tables |
| Advertising ID | Yes (if ads; also possible via AppMetrica) | Yes | Yes | Advertising; Analytics | AD_ID / advIdentifiersTracking |
| Approximate location | **No** | No | — | — | AppMetrica `locationTracking: false`; no Ads locationConsent; vendor tables = No without location enable |
| Precise location | **No** | No | — | — | Not used |
| Personal info (name, email, phone, user IDs) | **No** | No | — | — | No accounts; scrub blocks email/userId |
| Photos / videos / audio / files / contacts / calendar | **No** | No | — | — | Not used |
| Financial / payment | **No** | No | — | — | No IAP |
| Health / fitness | **No** | No | — | — | Puzzle game only |

### Local-only vs SDK

| Data | Where | Declare as collected? |
|------|-------|------------------------|
| Game saves, scores, settings | Device AsyncStorage | **No** (not transmitted by developer) |
| Privacy purpose choices | Device AsyncStorage | **No** (local preference) |
| AppMetrica events | Vendor after consent | **Yes** |
| Ads / analytics technical IDs | Yandex after consent | **Yes** |

---

## Ephemeral processing

Do **not** mark SDK categories as “ephemeral” unless vendor docs explicitly support that claim for the data type. Default: not ephemeral.

---

## Remaining factual questions (do not guess)

1. **IP → Approximate location:** Google’s general note vs Yandex published Data Safety tables (Approximate location = No without location consent/tracking). Ask Yandex support if challenged before wide production.
2. Exact native AppMetrica Android SDK version resolved under RN wrapper `4.2.0` vs docs labeled for 5.0.0+.
3. Yandex Ads cabinet / AppMetrica cabinet toggles not visible in this repo.
4. Google Play Yandex app is still in **test** status pending listing URL — do not claim production monetization is live.

---

## Console fill order (owner)

1. Publish privacy HTML → confirm HTTP 200.
2. Paste privacy URL into Play Console App content.
3. Fill Data Safety from this worksheet.
4. Ads declaration: Yes + Advertising ID Yes.
5. Proceed to closed testing when AAB is ready (not part of PHASE 2B).
