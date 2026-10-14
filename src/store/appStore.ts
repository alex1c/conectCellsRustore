/**
 * Build-time application store flavor.
 *
 * Selected via EXPO_PUBLIC_APP_STORE (Expo inlines EXPO_PUBLIC_* at bundle time).
 * - rustore — existing RuStore release pipeline (safe default when unset)
 * - googleplay — Google Play flavor
 *
 * Unknown values throw. Missing values never become googleplay.
 */

export const APP_STORE_IDS = ['rustore', 'googleplay'] as const

export type AppStoreId = (typeof APP_STORE_IDS)[number]

/** Safe default: preserve RuStore behavior; never invent a Play release. */
export const DEFAULT_APP_STORE: AppStoreId = 'rustore'

let testOverride: AppStoreId | null = null

/**
 * Parse a raw store id. Empty/missing → rustore. Invalid → throws.
 */
export function resolveAppStore (
	raw: string | null | undefined,
): AppStoreId {
	if (raw === null || raw === undefined) {
		return DEFAULT_APP_STORE
	}
	const value = String(raw).trim().toLowerCase()
	if (value === '') {
		return DEFAULT_APP_STORE
	}
	if ((APP_STORE_IDS as readonly string[]).includes(value)) {
		return value as AppStoreId
	}
	throw new Error(
		`Invalid EXPO_PUBLIC_APP_STORE="${raw}". Expected "rustore" or "googleplay".`,
	)
}

/**
 * Active store for this JS bundle / native build.
 * Order: test override → EXPO_PUBLIC_APP_STORE → Expo extra.appStore → rustore.
 * Tests may override via __setAppStoreForTests.
 */
export function getAppStore (): AppStoreId {
	if (testOverride !== null) {
		return testOverride
	}
	const fromEnv =
		typeof process !== 'undefined'
			? process.env?.EXPO_PUBLIC_APP_STORE
			: undefined
	if (
		fromEnv !== null &&
		fromEnv !== undefined &&
		String(fromEnv).trim() !== ''
	) {
		return resolveAppStore(fromEnv)
	}
	// Native release embeds store in expo.extra via app.config.js.
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports -- optional at bundle time
		const Constants = require('expo-constants').default as {
			expoConfig?: { extra?: { appStore?: string } }
		}
		const fromExtra = Constants.expoConfig?.extra?.appStore
		if (
			fromExtra !== null &&
			fromExtra !== undefined &&
			String(fromExtra).trim() !== ''
		) {
			return resolveAppStore(fromExtra)
		}
	} catch {
		// expo-constants unavailable (pure Node) — fall through.
	}
	return DEFAULT_APP_STORE
}

export function isGooglePlayStore (): boolean {
	return getAppStore() === 'googleplay'
}

export function isRuStore (): boolean {
	return getAppStore() === 'rustore'
}

/**
 * Test-only store override. Pass null to clear.
 * Production code must never call this.
 */
export function __setAppStoreForTests (store: AppStoreId | null): void {
	testOverride = store
}
