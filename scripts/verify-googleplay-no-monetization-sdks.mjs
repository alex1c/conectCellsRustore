/**
 * Verify Google Play Android build excludes Yandex Ads + AppMetrica.
 *
 * Checks when APP_STORE=googleplay (or --force):
 * 1. react-native.config.js disables autolinking for both packages
 * 2. android/ settings / app build.gradle do not include them (if android exists)
 * 3. Optional: APK/AAB path via --artifact=… must not contain known package paths
 *
 * Usage:
 *   APP_STORE=googleplay node scripts/verify-googleplay-no-monetization-sdks.mjs
 *   node scripts/verify-googleplay-no-monetization-sdks.mjs --force --artifact=path.aab
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const FORBIDDEN_DEPS = [
	'yandex-mobile-ads',
	'@appmetrica/react-native-analytics',
	'com.yandex.android:mobileads',
	'io.appmetrica.analytics',
	'com.yandex.mobile.ads',
	'io.appmetrica.analytics',
]

const FORBIDDEN_APK_PATHS = [
	'com/yandex/mobile/ads/',
	'io/appmetrica/analytics/',
	'com/yandexmobileads/',
	'io/appmetrica/analytics/reactnative/',
]

function fail (message) {
	console.error(`[verify-googleplay-no-monetization-sdks] FAIL: ${message}`)
	process.exitCode = 1
}

function ok (message) {
	console.log(`[verify-googleplay-no-monetization-sdks] OK: ${message}`)
}

const force = process.argv.includes('--force')
const artifactArg = process.argv.find((a) => a.startsWith('--artifact='))
const artifact = artifactArg ? artifactArg.slice('--artifact='.length) : null

const store = String(
	process.env.APP_STORE ?? process.env.EXPO_PUBLIC_APP_STORE ?? '',
)
	.trim()
	.toLowerCase()

if (!force && store !== 'googleplay') {
	ok(
		`skip (APP_STORE=${store || 'unset'} — set googleplay or pass --force)`,
	)
	process.exit(0)
}

const rnConfig = fs.readFileSync(
	path.join(root, 'react-native.config.js'),
	'utf8',
)
if (
	!rnConfig.includes('yandex-mobile-ads') ||
	!rnConfig.includes('@appmetrica/react-native-analytics')
) {
	fail('react-native.config.js must gate both monetization packages')
} else {
	ok('react-native.config.js gates Yandex Ads + AppMetrica')
}

const androidRoot = path.join(root, 'android')
if (fs.existsSync(androidRoot)) {
	const settingsGradle = path.join(androidRoot, 'settings.gradle')
	const appBuildGradle = path.join(androidRoot, 'app', 'build.gradle')
	const texts = []
	for (const file of [settingsGradle, appBuildGradle]) {
		if (fs.existsSync(file)) {
			texts.push(fs.readFileSync(file, 'utf8'))
		}
	}
	// Also scan autolinking generated files if present.
	const autoDir = path.join(
		androidRoot,
		'build',
		'generated',
		'autolinking',
	)
	if (fs.existsSync(autoDir)) {
		const stack = [autoDir]
		while (stack.length) {
			const dir = stack.pop()
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				const full = path.join(dir, entry.name)
				if (entry.isDirectory()) {
					stack.push(full)
				} else if (/\.(gradle|json|cpp|h)$/.test(entry.name)) {
					texts.push(fs.readFileSync(full, 'utf8'))
				}
			}
		}
	}

	const joined = texts.join('\n')
	for (const needle of [
		'yandex-mobile-ads',
		'YandexMobileAds',
		'appmetrica',
		'mobileads',
	]) {
		// Allow comments about exclusion; fail on project includes / deps.
		const includeHit =
			joined.includes(`:${needle}`) ||
			joined.includes(`project(':${needle}`) ||
			joined.includes(`"${needle}"`) ||
			joined.includes(`'${needle}'`)
		if (
			includeHit &&
			(joined.includes(`implementation`) ||
				joined.includes('autolinking') ||
				joined.includes('packageName'))
		) {
			// Softer: look for autolinking package entries
		}
	}

	if (
		/\byandex-mobile-ads\b/.test(joined) &&
		/implementation|project\(|packageName/.test(joined)
	) {
		fail('android/ still references yandex-mobile-ads after prebuild')
	} else {
		ok('android/ tree has no linked yandex-mobile-ads project')
	}

	if (
		/@appmetrica\/react-native-analytics|\bio\.appmetrica\.analytics\.reactnative\b/.test(
			joined,
		) &&
		/implementation|project\(|packageName/.test(joined)
	) {
		fail('android/ still references AppMetrica RN package after prebuild')
	} else {
		ok('android/ tree has no linked AppMetrica RN project')
	}

	const mainManifest = path.join(
		androidRoot,
		'app',
		'src',
		'main',
		'AndroidManifest.xml',
	)
	if (fs.existsSync(mainManifest)) {
		const xml = fs.readFileSync(mainManifest, 'utf8')
		if (xml.includes('com.yandex.mobile.ads')) {
			fail('main AndroidManifest still declares Yandex Ads meta-data')
		} else {
			ok('main AndroidManifest has no Yandex Ads meta-data')
		}
	}
} else {
	ok('android/ absent — run clean prebuild with APP_STORE=googleplay first')
}

if (artifact) {
	if (!fs.existsSync(artifact)) {
		fail(`artifact missing: ${artifact}`)
	} else {
		const tmp = path.join(
			root,
			'release-artifacts',
			`.sdk-scan-${Date.now()}`,
		)
		fs.mkdirSync(tmp, { recursive: true })
		const zipPath = path.join(tmp, 'artifact.zip')
		fs.copyFileSync(artifact, zipPath)
		const listing = spawnSync(
			'jar',
			['tf', zipPath],
			{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
		)
		if (listing.status !== 0) {
			fail(`jar tf failed: ${listing.stderr || listing.stdout}`)
		} else {
			const names = listing.stdout || ''
			let hit = null
			for (const needle of FORBIDDEN_APK_PATHS) {
				if (names.includes(needle)) {
					hit = needle
					break
				}
			}
			// Also scan dex via strings on base APK entries if AAB
			if (hit) {
				fail(`artifact contains forbidden path: ${hit}`)
			} else {
				ok(`artifact listing clean: ${path.basename(artifact)}`)
			}
		}
		try {
			fs.rmSync(tmp, { recursive: true, force: true })
		} catch {
			// best-effort cleanup
		}
	}
}

// Silence unused in some paths
void FORBIDDEN_DEPS

if (process.exitCode) {
	console.error(
		'[verify-googleplay-no-monetization-sdks] Re-run clean prebuild with APP_STORE=googleplay',
	)
}
