/**
 * Verify Yandex Mobile Ads manual-init <meta-data> flags.
 *
 * Checks (in order):
 * 1. Plugin constants match SDK 8.4.0-confirmed names (always).
 * 2. android/app/src/main/AndroidManifest.xml when ./android exists.
 * 3. Any packaged/merged manifests under android/app/build when present.
 *
 * Exit 0 when ./android is absent (CNG not generated) after constant checks.
 * Exit 1 when ./android exists but required flags are missing/wrong — blocks QA.
 *
 * Usage:
 *   node scripts/verify-android-yandex-ads-manual-init.mjs
 *   node scripts/verify-android-yandex-ads-manual-init.mjs --require-android
 */

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const {
	META_AUTOMATIC_SDK_INITIALIZATION,
	META_APPMETRICA_ANALYTICS_ENABLED,
	REQUIRED_META_VALUE,
} = require('../plugins/yandexAdsManualInitConstants.js')

const requireAndroid = process.argv.includes('--require-android')

const REQUIRED_NAMES = [
	META_AUTOMATIC_SDK_INITIALIZATION,
	META_APPMETRICA_ANALYTICS_ENABLED,
]

/** Retired / incorrect key that must not be the only protection. */
const FORBIDDEN_WRONG_KEY =
	'com.yandex.mobile.ads.APPMETRICA_EASY_INTEGRATION_ENABLED'

function fail (message) {
	console.error(`[verify-android-yandex-ads-manual-init] FAIL: ${message}`)
	process.exitCode = 1
}

function ok (message) {
	console.log(`[verify-android-yandex-ads-manual-init] OK: ${message}`)
}

/**
 * @param {string} xml
 * @param {string} name
 */
function hasMetaDataFalse (xml, name) {
	const nameAttr = `android:name="${name}"`
	if (!xml.includes(nameAttr)) {
		return false
	}
	const escaped = name.replace(/\./g, '\\.')
	const patternA = new RegExp(
		`android:name="${escaped}"[^>]*android:value="${REQUIRED_META_VALUE}"`,
	)
	const patternB = new RegExp(
		`android:value="${REQUIRED_META_VALUE}"[^>]*android:name="${escaped}"`,
	)
	return patternA.test(xml) || patternB.test(xml)
}

/**
 * @param {string} filePath
 * @param {string} label
 */
function verifyManifestFile (filePath, label) {
	if (!fs.existsSync(filePath)) {
		fail(`${label}: missing ${filePath}`)
		return
	}
	const xml = fs.readFileSync(filePath, 'utf8')
	for (const name of REQUIRED_NAMES) {
		if (!hasMetaDataFalse(xml, name)) {
			fail(
				`${label}: missing or not value="${REQUIRED_META_VALUE}": ${name}`,
			)
		} else {
			ok(`${label}: ${name}=${REQUIRED_META_VALUE}`)
		}
	}
	if (
		xml.includes(FORBIDDEN_WRONG_KEY) &&
		!xml.includes(META_APPMETRICA_ANALYTICS_ENABLED)
	) {
		fail(
			`${label}: only obsolete ${FORBIDDEN_WRONG_KEY} present — use ${META_APPMETRICA_ANALYTICS_ENABLED}`,
		)
	}
}

// 1) Plugin source must encode the bytecode-confirmed keys.
const pluginPath = path.join(root, 'plugins', 'withYandexAdsManualInit.js')
const pluginSrc = fs.readFileSync(pluginPath, 'utf8')
if (!pluginSrc.includes('APPMETRICA_ANALYTICS_ENABLED')) {
	fail('plugin must reference APPMETRICA_ANALYTICS_ENABLED')
} else {
	ok('plugin references APPMETRICA_ANALYTICS_ENABLED')
}
if (pluginSrc.includes('APPMETRICA_EASY_INTEGRATION_ENABLED')) {
	fail('plugin must not use obsolete APPMETRICA_EASY_INTEGRATION_ENABLED')
} else {
	ok('plugin does not use obsolete EASY_INTEGRATION key')
}
if (!pluginSrc.includes('AUTOMATIC_SDK_INITIALIZATION')) {
	fail('plugin must reference AUTOMATIC_SDK_INITIALIZATION')
} else {
	ok('plugin references AUTOMATIC_SDK_INITIALIZATION')
}
if (!pluginSrc.includes('ensure-yandex-ads-app-ad-analytics-bridge')) {
	fail('plugin must run ensure-yandex-ads-app-ad-analytics-bridge on prebuild')
} else {
	ok('plugin runs setAppAdAnalyticsReporting bridge ensure')
}

// Bridge patch must be present in installed yandex-mobile-ads (postinstall / prebuild).
const ktBridge = path.join(
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
if (fs.existsSync(ktBridge)) {
	const kt = fs.readFileSync(ktBridge, 'utf8')
	if (!kt.includes('setAppAdAnalyticsReporting')) {
		fail(
			'YandexMobileAdsModule.kt missing setAppAdAnalyticsReporting — run: node scripts/ensure-yandex-ads-app-ad-analytics-bridge.mjs',
		)
	} else {
		ok('YandexMobileAdsModule.kt exposes setAppAdAnalyticsReporting')
	}
} else {
	ok('yandex-mobile-ads not installed — skip Kotlin bridge check')
}

const androidRoot = path.join(root, 'android')
const mainManifest = path.join(
	androidRoot,
	'app',
	'src',
	'main',
	'AndroidManifest.xml',
)

if (!fs.existsSync(androidRoot)) {
	if (requireAndroid) {
		fail('android/ absent — run: npm run prebuild:android')
	} else {
		ok('android/ absent — skip manifest checks (run expo prebuild first)')
	}
	process.exit(process.exitCode ?? 0)
}

verifyManifestFile(mainManifest, 'src/main')

// 3) Packaged / merged manifests (post-assemble) when build intermediates exist.
const searchRoots = [
	path.join(androidRoot, 'app', 'build', 'intermediates', 'packaged_manifests'),
	path.join(androidRoot, 'app', 'build', 'intermediates', 'merged_manifests'),
	path.join(androidRoot, 'app', 'build', 'intermediates', 'merged_manifest'),
]

let packagedCount = 0
for (const searchRoot of searchRoots) {
	if (!fs.existsSync(searchRoot)) {
		continue
	}
	const stack = [searchRoot]
	while (stack.length > 0) {
		const dir = stack.pop()
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name)
			if (entry.isDirectory()) {
				stack.push(full)
			} else if (entry.name === 'AndroidManifest.xml') {
				packagedCount += 1
				const rel = path.relative(androidRoot, full)
				verifyManifestFile(full, rel)
			}
		}
	}
}

if (packagedCount === 0) {
	ok(
		'no packaged/merged manifests yet — src/main checked; assemble to verify merge',
	)
} else {
	ok(`checked ${packagedCount} packaged/merged manifest(s)`)
}

if (process.exitCode) {
	console.error(
		'[verify-android-yandex-ads-manual-init] Re-run: npm run prebuild:android',
	)
}
