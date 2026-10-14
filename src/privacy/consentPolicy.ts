/**
 * First-party consent policy for optional AppMetrica + Yandex Mobile Ads.
 *
 * Adapted from ForestMusic bloodPressureDiaryRuStore (Google Play adaptation),
 * stripped of medical / session-only restore rules.
 *
 * - RuStore: no in-app consent gate (preserve existing release behavior).
 * - Google Play: explicit analytics + ads choices before optional SDK init.
 * - Yandex-only stack (no AdMob) → no Google-certified CMP in this release.
 * - Ads personalization is not separable in the shipped Yandex SDK.
 */

import type { AppStoreId } from '../store/appStore'
import type { PurposeDecision } from './consentPersistence'

export type ConsentRequirement = {
	/** Show first-party purpose UI before optional SDKs. */
	requiresExplicitConsent: boolean
	reason: string
	/** Personalization cannot be toggled independently of ads for Yandex. */
	adsPersonalizationSeparable: boolean
}

/**
 * Resolve whether this build needs an explicit consent gate.
 */
export function resolveConsentRequirement (input: {
	storeId: AppStoreId
}): ConsentRequirement {
	if (input.storeId === 'googleplay') {
		return {
			requiresExplicitConsent: true,
			reason: 'googleplay_first_party_gate',
			adsPersonalizationSeparable: false,
		}
	}
	return {
		requiresExplicitConsent: false,
		reason: 'rustore_no_gate',
		adsPersonalizationSeparable: false,
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
	if (!requirement.requiresExplicitConsent) {
		return true
	}
	return analytics === 'granted'
}

export function canEnableAds (
	ads: PurposeDecision | null,
	requirement: ConsentRequirement,
): boolean {
	if (!requirement.requiresExplicitConsent) {
		return true
	}
	return ads === 'granted'
}
