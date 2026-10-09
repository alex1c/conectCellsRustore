/**
 * Verify Android launcher app_name locales after Expo prebuild.
 *
 * Expo writes values-b+{lang}/strings.xml from app.json `locales` via
 * AndroidConfig.Locales.withLocales. A stale ./android tree (prebuild skipped)
 * leaves only values/strings.xml and every application-label-* falls back to
 * the default — which is how Phase 1C saw Гексоника for all languages.
 *
 * Usage:
 *   node scripts/verify-android-launcher-locales.mjs
 * Exit 0 when ./android is absent (CNG not generated yet) or resources match.
 * Exit 1 when ./android exists but locale resources are missing/wrong.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const resRoot = path.join(root, 'android', 'app', 'src', 'main', 'res')

/** Expected launcher labels after prebuild. */
const EXPECTED = {
	default: 'Hexonica',
	en: 'Hexonica',
	es: 'Hexonica',
	de: 'Hexonica',
	tr: 'Hexonica',
	ru: 'Гексоника',
}

function readAppName (stringsPath) {
	const raw = fs.readFileSync(stringsPath, 'utf8')
	const match = raw.match(/name="app_name"[^>]*>([^<]*)</)
	if (!match) {
		return null
	}
	// Expo Locales plugin wraps values in extra quotes in values-b+* files.
	return match[1].replace(/^"+|"+$/g, '').trim()
}

function fail (message) {
	console.error(`[verify-android-launcher-locales] ${message}`)
	process.exitCode = 1
}

if (!fs.existsSync(resRoot)) {
	console.log(
		'[verify-android-launcher-locales] android/res absent — skip (run expo prebuild first)',
	)
	process.exit(0)
}

const defaultPath = path.join(resRoot, 'values', 'strings.xml')
if (!fs.existsSync(defaultPath)) {
	fail(`missing ${defaultPath}`)
} else {
	const name = readAppName(defaultPath)
	if (name !== EXPECTED.default) {
		fail(`values/strings.xml app_name="${name}" expected "${EXPECTED.default}"`)
	} else {
		console.log(`OK default app_name=${name}`)
	}
}

for (const [lang, expected] of Object.entries(EXPECTED)) {
	if (lang === 'default') {
		continue
	}
	const folder = `values-b+${lang}`
	const filePath = path.join(resRoot, folder, 'strings.xml')
	if (!fs.existsSync(filePath)) {
		fail(
			`missing ${folder}/strings.xml — re-run: npx expo prebuild --platform android`,
		)
		continue
	}
	const name = readAppName(filePath)
	if (name !== expected) {
		fail(`${folder} app_name="${name}" expected "${expected}"`)
	} else {
		console.log(`OK ${folder} app_name=${name}`)
	}
}

if (!process.exitCode) {
	console.log('[verify-android-launcher-locales] PASS')
}
