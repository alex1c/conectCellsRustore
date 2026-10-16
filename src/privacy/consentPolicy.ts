/**
 * First-party consent policy for optional AppMetrica + Yandex Mobile Ads.
 *
 * - RuStore: no in-app consent gate; optional SDKs allowed (existing release).
 * - Google Play (closed testing): optional SDKs are not shipped — no consent
 *   UI for ads/analytics, and canEnable* always false.
 * - Yandex-only stack on RuStore (no AdMob) → no Google-certified CMP.
 * - Ads personalization is not separable in the shipped Yandex SDK.
 */

import type { AppStoreId } from '../store/appStore'
import { isStoreMonetizationEnabled } from '../store/monetization'
import type { PurposeDecision } from './consentPersistence'

export type ConsentRequirement = {
	/** Show first-party purpose UI before optional SDKs. */
	requiresExplicitConsent: boolean
	reason: string
	/** Personalization cannot be toggled independently of ads for Yandex. */
	adsPersonalizationSeparable: boolean
	/** False when the store flavor excludes Ads/AppMetrica from the binary. */
	optionalSdksAvailable: boolean
}

/**
 * Resolve whether this build needs an explicit consent gate.
 */
export function resolveConsentRequirement (input: {
	storeId: AppStoreId
}): ConsentRequirement {
	if (!isStoreMonetizationEnabled(input.storeId)) {
		return {
			requiresExplicitConsent: false,
			reason: 'googleplay_no_optional_sdks',
			adsPersonalizationSeparable: false,
			optionalSdksAvailable: false,
		}
	}
	if (input.storeId === 'googleplay') {
		// Reserved if Play later re-enables optional SDKs with a gate.
		return {
			requiresExplicitConsent: true,
			reason: 'googleplay_first_party_gate',
			adsPersonalizationSeparable: false,
			optionalSdksAvailable: true,
		}
	}
	return {
		requiresExplicitConsent: false,
		reason: 'rustore_no_gate',
		adsPersonalizationSeparable: false,
		optionalSdksAvailable: true,
	}
}

/** True when a required prompt has not been answered for either purpose. */
export function isConsentPending (
	state: { analytics: PurposeDecision | null; ads: PurposeDecision | null },
	requirement: ConsentRequirement,
): boolean {
	if (!requirement.requiresExplicitConsent) {
		return false
	}
	return state.analytics === null || state.ads === null
}

export function canEnableAnalytics (
	analytics: PurposeDecision | null,
	requirement: ConsentRequirement,
): boolean {
	if (!requirement.optionalSdksAvailable) {
		return false
	}
	if (!requirement.requiresExplicitConsent) {
		return true
	}
	return analytics === 'granted'
}

export function canEnableAds (
	ads: PurposeDecision | null,
	requirement: ConsentRequirement,
): boolean {
	if (!requirement.optionalSdksAvailable) {
		return false
	}
	if (!requirement.requiresExplicitConsent) {
		return true
	}
	return ads === 'granted'
}
