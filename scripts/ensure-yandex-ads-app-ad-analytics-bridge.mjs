/**
 * Idempotent patch: expose YandexAds.setAppAdAnalyticsReporting through the
 * existing React Native YandexMobileAds module (missing in yandex-mobile-ads@8.4.0).
 *
 * Docs (must be called BEFORE initialize):
 * - https://appmetrica.yandex.com/docs/en/common/ads-sdk-integration
 * - Yandex Ads migration guide lists setAppAdAnalyticsReporting on YandexAds
 *
 * Usage:
 *   node scripts/ensure-yandex-ads-app-ad-analytics-bridge.mjs
 * Exit 0 when patched or already present; exit 1 if vendor files missing.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const KT_PATH = path.join(
	root,
	'node_modules',
	'yandex-mobile-ads',
	'android',
	'src',
	'main',
	'java',
	'com',
	'yandexmobileads',
	'YandexMobileAdsModule.kt',
)

const JS_PATHS = [
	path.join(root, 'node_modules', 'yandex-mobile-ads', 'lib', 'commonjs', 'MobileAds.js'),
	path.join(root, 'node_modules', 'yandex-mobile-ads', 'lib', 'module', 'MobileAds.js'),
]

const KT_MARKER = 'fun setAppAdAnalyticsReporting'
const KT_METHOD = `
    @ReactMethod
    fun setAppAdAnalyticsReporting(reportingEnabled: Boolean) {
        YandexAds.setAppAdAnalyticsReporting(reportingEnabled)
    }
`

const JS_MARKER = 'setAppAdAnalyticsReporting'
/** Inserted immediately after setUserConsent(...) in MobileAds.js. */
const JS_METHOD = `
  setAppAdAnalyticsReporting(reportingEnabled) {
    try {
      (0, _util.isSupportedPlatform)();
      (0, _util.isBoolean)(reportingEnabled);
      _YandexMobileAdsModule.default.YandexMobileAds.setAppAdAnalyticsReporting(reportingEnabled);
    } catch {}
  }`

function fail (message) {
	console.error(`[ensure-yandex-ads-app-ad-analytics-bridge] ${message}`)
	process.exitCode = 1
}

function ok (message) {
	console.log(`[ensure-yandex-ads-app-ad-analytics-bridge] OK: ${message}`)
}

if (!fs.existsSync(KT_PATH)) {
	fail(`missing ${KT_PATH} — npm install yandex-mobile-ads first`)
	process.exit(process.exitCode ?? 1)
}

let kt = fs.readFileSync(KT_PATH, 'utf8')
if (kt.includes(KT_MARKER)) {
	ok('Kotlin bridge already present')
} else {
	if (!kt.includes('companion object')) {
		fail('unexpected YandexMobileAdsModule.kt shape — cannot patch')
	} else {
		kt = kt.replace(
			/(\n\s*companion object)/,
			`\n${KT_METHOD}$1`,
		)
		if (!kt.includes(KT_MARKER)) {
			fail('failed to insert Kotlin setAppAdAnalyticsReporting')
		} else {
			fs.writeFileSync(KT_PATH, kt, 'utf8')
			ok('patched YandexMobileAdsModule.kt')
		}
	}
}

for (const jsPath of JS_PATHS) {
	if (!fs.existsSync(jsPath)) {
		fail(`missing ${jsPath}`)
		continue
	}
	let js = fs.readFileSync(jsPath, 'utf8')
	if (js.includes(JS_MARKER)) {
		ok(`JS bridge already present (${path.basename(path.dirname(jsPath))})`)
		continue
	}
	// Insert immediately after the setUserConsent method body.
	const anchor = 'setUserConsent(userConsent) {'
	const idx = js.indexOf(anchor)
	if (idx < 0) {
		fail(`unexpected MobileAds.js shape: ${jsPath}`)
		continue
	}
	const endOfMethod = js.indexOf('\n  }', idx)
	if (endOfMethod < 0) {
		fail(`cannot find insertion point in ${jsPath}`)
		continue
	}
	const insertAt = endOfMethod + '\n  }'.length
	js = `${js.slice(0, insertAt)}\n${JS_METHOD}${js.slice(insertAt)}`
	fs.writeFileSync(jsPath, js, 'utf8')
	ok(`patched ${path.relative(root, jsPath)}`)
}

process.exit(process.exitCode ?? 0)
