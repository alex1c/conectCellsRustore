/**
 * Expo config — embeds build-time APP_STORE flavor into native extra.
 *
 * Selection (first match):
 *   APP_STORE | EXPO_PUBLIC_APP_STORE | default "rustore"
 *
 * Missing/empty → rustore (never silently googleplay).
 * Invalid values throw at config evaluation (blocks the build).
 *
 * Android app_name locales require a fresh expo prebuild (values-b+*).
 * Stale ./android skips AndroidConfig.Locales.withLocales — run
 * npm run prebuild:android && npm run verify:android-locales after
 * locale changes.
 */

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

/**
 * @param {{ config: import('expo/config').ExpoConfig }} param0
 * @returns {import('expo/config').ExpoConfig}
 */
module.exports = ({ config }) => {
	const appStore = resolveAppStore(
		process.env.APP_STORE ?? process.env.EXPO_PUBLIC_APP_STORE,
	)

	// Keep Metro / EXPO_PUBLIC_* inlining aligned with native extra.appStore.
	process.env.EXPO_PUBLIC_APP_STORE = appStore

	const plugins = [
		...(config.plugins || []),
		// Disable Yandex Ads ContentProvider auto-init + Ads→AppMetrica adapter
		// before JS consent gates. Must re-run via expo prebuild — ./android is
		// gitignored and a stale tree silently drops these <meta-data> flags.
		'./plugins/withYandexAdsManualInit',
	]

	return {
		...config,
		plugins,
		extra: {
			...(config.extra || {}),
			appStore,
		},
	}
}
