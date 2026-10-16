/**
 * Autolinking gate for store flavors.
 *
 * APP_STORE / EXPO_PUBLIC_APP_STORE=googleplay → do not link Yandex Mobile Ads
 * or AppMetrica into the native Android/iOS projects (packages stay in
 * package.json for RuStore builds).
 *
 * Must match src/store/monetization.ts (rustore = monetization on).
 */

const APP_STORE_IDS = ['rustore', 'googleplay']

/**
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

const excludeMonetizationNative = appStore === 'googleplay'

/** @type {import('@react-native-community/cli-types').Config} */
module.exports = {
	dependencies: excludeMonetizationNative
		? {
			'yandex-mobile-ads': {
				platforms: {
					android: null,
					ios: null,
				},
			},
			'@appmetrica/react-native-analytics': {
				platforms: {
					android: null,
					ios: null,
				},
			},
		}
		: {},
}
