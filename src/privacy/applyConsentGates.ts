/**
 * Synchronous runtime gate updates for ads + analytics purposes.
 *
 * Revoke closes gates immediately (before any AsyncStorage await).
 * Grant opens gates only when openGrants is true (after a successful persist).
 */

import { syncAdsConsent } from '../ads/adsService'
import { applyAnalyticsSendingEnabled } from '../analytics/appMetrica'
import { getAppStore } from '../store/appStore'
import {
	canEnableAds,
	canEnableAnalytics,
	resolveConsentRequirement,
} from './consentPolicy'
import type { PurposeDecision } from './consentPersistence'
import {
	setRuntimeAdsAllowed,
	setRuntimeAnalyticsAllowed,
} from './runtimeConsentGate'
import { applyYandexUserConsent } from './sdkConsentBridge'

export type ApplyConsentGatesInput = {
	analytics: PurposeDecision | null
	ads: PurposeDecision | null
	/**
	 * When false, only closes denied purposes. Does not open grants
	 * (used before AsyncStorage succeeds on a re-grant).
	 */
	openGrants: boolean
}

/**
 * Apply purpose decisions to in-process gates + Yandex userConsent flag.
 * Safe to call from UI before await; never throws.
 */
export function applyConsentGatesSync (input: ApplyConsentGatesInput): void {
	const requirement = resolveConsentRequirement({
		storeId: getAppStore(),
	})

	// RuStore: no gate — keep optional SDKs allowed.
	if (!requirement.requiresExplicitConsent) {
		setRuntimeAnalyticsAllowed(true)
		applyAnalyticsSendingEnabled(true)
		setRuntimeAdsAllowed(true)
		syncAdsConsent(true)
		applyYandexUserConsent('granted')
		return
	}

	const analyticsWanted = canEnableAnalytics(
		input.analytics,
		requirement,
	)
	const adsWanted = canEnableAds(input.ads, requirement)

	if (!analyticsWanted) {
		setRuntimeAnalyticsAllowed(false)
		applyAnalyticsSendingEnabled(false)
	} else if (input.openGrants) {
		setRuntimeAnalyticsAllowed(true)
		applyAnalyticsSendingEnabled(true)
	}

	if (!adsWanted) {
		setRuntimeAdsAllowed(false)
		syncAdsConsent(false)
		if (input.ads !== null) {
			applyYandexUserConsent('denied')
		}
	} else if (input.openGrants) {
		setRuntimeAdsAllowed(true)
		syncAdsConsent(true)
		applyYandexUserConsent('granted')
	}
}
