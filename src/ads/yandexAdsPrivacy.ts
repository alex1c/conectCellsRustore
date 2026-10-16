/**
 * Yandex Mobile Ads ↔ AppMetrica privacy controls.
 *
 * Confirmed against mobileads-8.4.0.aar bytecode:
 * - APPMETRICA_ANALYTICS_ENABLED (manifest) gates AppMetricaLibraryAdapter.activate
 *   via yads.ag.a() (default TRUE when meta missing).
 * - YandexAds.setAppAdAnalyticsReporting(boolean) sets dm4.h (default TRUE) and
 *   gates automatic ad-event reporting in yads.ee (together with ag.a()).
 *   It does NOT by itself prevent anonymous LibraryAdapter.activate.
 * - Must be called BEFORE MobileAds.initialize() (Yandex Ads migration guide).
 *
 * The stock yandex-mobile-ads@8.4.0 RN bridge omits setAppAdAnalyticsReporting;
 * scripts/ensure-yandex-ads-app-ad-analytics-bridge.mjs patches it in.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- native SDK optional */

import { isStoreMonetizationEnabled } from '../store/monetization'

/**
 * Mirror analytics purpose into Ads→AppMetrica automatic ad-event reporting.
 * Safe no-op when the native bridge / method is missing or Play excludes Ads.
 */
export function applyYandexAppAdAnalyticsReporting (
	analyticsAllowed: boolean,
): void {
	if (!isStoreMonetizationEnabled()) {
		return
	}
	try {
		const { MobileAds } = require('yandex-mobile-ads')
		if (
			MobileAds &&
			typeof MobileAds.setAppAdAnalyticsReporting === 'function'
		) {
			MobileAds.setAppAdAnalyticsReporting(analyticsAllowed)
			return
		}
		// Fallback if only the Kotlin ReactMethod was patched.
		const { NativeModules } = require('react-native')
		const native = NativeModules?.YandexMobileAds
		if (native && typeof native.setAppAdAnalyticsReporting === 'function') {
			native.setAppAdAnalyticsReporting(analyticsAllowed)
		}
	} catch {
		// Missing native module — ads/privacy still gated at JS level.
	}
}
