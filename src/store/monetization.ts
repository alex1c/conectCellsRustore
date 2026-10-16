/**
 * Store-level optional monetization (Yandex Ads + AppMetrica).
 *
 * Google Play closed-testing release ships WITHOUT those native SDKs.
 * RuStore keeps the existing ads / analytics stack.
 *
 * JS and native autolinking must both honor this flag — excluding
 * packages from Gradle alone is not enough if JS still require()s them.
 */

import { getAppStore, type AppStoreId } from './appStore'

/** Test-only override: null = derive from store id. */
let testMonetizationOverride: boolean | null = null

/**
 * True when this build may link and initialize Yandex Ads / AppMetrica.
 * False for Google Play (no optional SDKs in the APK/AAB).
 */
export function isStoreMonetizationEnabled (
	store: AppStoreId = getAppStore(),
): boolean {
	if (testMonetizationOverride !== null) {
		return testMonetizationOverride
	}
	return store === 'rustore'
}

/** Inverse helper for Play-only UX (free Undo, no banners, no consent gate). */
export function isStoreMonetizationDisabled (
	store: AppStoreId = getAppStore(),
): boolean {
	return !isStoreMonetizationEnabled(store)
}

/**
 * Test helper — force monetization on/off independent of store id.
 * Pass null to clear. Production code must never call this.
 */
export function __setStoreMonetizationForTests (
	enabled: boolean | null,
): void {
	testMonetizationOverride = enabled
}
