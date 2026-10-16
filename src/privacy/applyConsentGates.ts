/**
 * Synchronous runtime gate updates for ads + analytics purposes.
 *
 * Revoke closes gates immediately (before any AsyncStorage await).
 * Grant opens gates only when openGrants is true (after a successful persist).
 */

import { syncAdsConsent } from '../ads/adsService'
import { applyYandexAppAdAnalyticsReporting } from '../ads/yandexAdsPrivacy'
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

	// No explicit gate: either RuStore (SDKs on) or Play without optional SDKs.
	if (!requirement.requiresExplicitConsent) {
		if (!requirement.optionalSdksAvailable) {
			setRuntimeAnalyticsAllowed(false)
			applyAnalyticsSendingEnabled(false)
			setRuntimeAdsAllowed(false)
			syncAdsConsent(false)
			return
		}
		setRuntimeAnalyticsAllowed(true)
		applyAnalyticsSendingEnabled(true)
		applyYandexAppAdAnalyticsReporting(true)
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
		// Keep Ads serving, but stop Ads→AppMetrica auto reporting.
		applyYandexAppAdAnalyticsReporting(false)
	} else if (input.openGrants) {
		setRuntimeAnalyticsAllowed(true)
		applyAnalyticsSendingEnabled(true)
		applyYandexAppAdAnalyticsReporting(true)
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
