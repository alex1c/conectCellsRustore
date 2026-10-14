/**
 * Expo config — embeds build-time APP_STORE flavor into native extra.
 *
 * Selection (first match):
 *   APP_STORE | EXPO_PUBLIC_APP_STORE | default "rustore"
 *
 * Missing/empty → rustore (never silently googleplay).
 * Invalid values throw at config evaluation (blocks the build).
 */

const appJson = require('./app.json')

const APP_STORE_IDS = ['rustore', 'googleplay']

/**
 * Parse store id for Expo config. Keep in sync with src/store/appStore.ts.
 * @param {string | null | undefined} raw
 * @returns {'rustore' | 'googleplay'}
 */
function resolveAppStore (raw) {
	if (raw === null || raw === undefined) {
		return 'rustore'
	}
	const value = String(raw).trim().toLowerCase()
	if (value === '') {
		return 'rustore'
	}
	if (APP_STORE_IDS.includes(value)) {
		return /** @type {'rustore' | 'googleplay'} */ (value)
	}
	throw new Error(
		`Invalid APP_STORE / EXPO_PUBLIC_APP_STORE="${raw}". ` +
			'Expected "rustore" or "googleplay".',
	)
}

const appStore = resolveAppStore(
	process.env.APP_STORE ?? process.env.EXPO_PUBLIC_APP_STORE,
)

// Keep Metro / EXPO_PUBLIC_* inlining aligned with native extra.appStore.
process.env.EXPO_PUBLIC_APP_STORE = appStore

const plugins = [
	...(appJson.expo.plugins || []),
	// Disable Yandex Ads / AppMetrica auto-init before JS consent gates.
	'./plugins/withYandexAdsManualInit',
]

/** @type {import('expo/config').ExpoConfig} */
const expo = {
	...appJson.expo,
	plugins,
	extra: {
		...(appJson.expo.extra || {}),
		appStore,
	},
}

module.exports = { expo }
