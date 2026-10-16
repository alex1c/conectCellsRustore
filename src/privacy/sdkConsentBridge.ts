/**
 * Applies purpose consent to Yandex Mobile Ads (offline-safe, idempotent).
 * Does not initialize the ads SDK — callers gate MobileAds.initialize().
 */

/* eslint-disable @typescript-eslint/no-require-imports -- native SDK optional */

import { isStoreMonetizationEnabled } from '../store/monetization'
import type { PurposeDecision } from './consentPersistence'

let lastAppliedAdsConsent: boolean | null = null

/** Resets bridge state for unit tests. */
export function resetSdkConsentBridgeForTests (): void {
	lastAppliedAdsConsent = null
}

/**
 * Pushes the GDPR-style userConsent flag into Yandex Mobile Ads.
 * Call on every launch once ads purpose is known (Yandex docs).
 * No-op when the store flavor excludes the Ads SDK (Google Play).
 */
export function applyYandexUserConsent (ads: PurposeDecision | null): void {
	if (!isStoreMonetizationEnabled() || ads === null) {
		return
	}
	const enabled = ads === 'granted'
	if (lastAppliedAdsConsent === enabled) {
		return
	}
	try {
		const { MobileAds } = require('yandex-mobile-ads') as {
			MobileAds: { setUserConsent: (value: boolean) => void }
		}
		MobileAds.setUserConsent(enabled)
		lastAppliedAdsConsent = enabled
	} catch {
		// Native module missing in Jest / web / Play builds — ignore.
	}
}

export function mayInitializeAds (
	ads: PurposeDecision | null,
	requiresGate: boolean,
): boolean {
	if (!requiresGate) {
		return true
	}
	return ads === 'granted'
}

export function mayInitializeAnalytics (
	analytics: PurposeDecision | null,
	requiresGate: boolean,
): boolean {
	if (!requiresGate) {
		return true
	}
	return analytics === 'granted'
}
