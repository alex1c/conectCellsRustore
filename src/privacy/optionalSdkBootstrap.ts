/**
 * Starts optional AppMetrica / Yandex Ads after consent decisions.
 * Idempotent — safe on cold start, Settings revisit, and app foreground.
 */

import { initAds } from '../ads/adsService'
import { initAnalytics, trackEvent } from '../analytics/appMetrica'
import { getAppStore } from '../store/appStore'
import {
	canEnableAds,
	canEnableAnalytics,
	resolveConsentRequirement,
} from './consentPolicy'
import type { PurposeDecision } from './consentPersistence'
import {
	applyYandexUserConsent,
	mayInitializeAds,
	mayInitializeAnalytics,
} from './sdkConsentBridge'

let lastBootstrapKey: string | null = null
let appOpenSent = false

export type OptionalSdkBootstrapInput = {
	analytics: PurposeDecision | null
	ads: PurposeDecision | null
}

/**
 * Apply consent signals and initialize allowed SDKs once per decision set.
 * Never throws — gameplay must continue offline / without native modules.
 */
export async function bootstrapOptionalSdks (
	input: OptionalSdkBootstrapInput,
): Promise<void> {
	const requirement = resolveConsentRequirement({
		storeId: getAppStore(),
	})
	const analyticsAllowed = canEnableAnalytics(
		input.analytics,
		requirement,
	)
	const adsAllowed = canEnableAds(input.ads, requirement)

	// RuStore has no gate — still pass setUserConsent(true) so Yandex gets a signal.
	if (!requirement.requiresExplicitConsent) {
		applyYandexUserConsent('granted')
	} else if (input.ads !== null) {
		applyYandexUserConsent(input.ads)
	}

	const key = `${analyticsAllowed ? 'a1' : 'a0'}:${adsAllowed ? 'd1' : 'd0'}`
	if (lastBootstrapKey === key) {
		return
	}

	if (
		analyticsAllowed &&
		mayInitializeAnalytics(input.analytics, requirement.requiresExplicitConsent)
	) {
		await initAnalytics()
		if (!appOpenSent) {
			trackEvent('app_open', { store: getAppStore() })
			appOpenSent = true
		}
	}

	if (
		adsAllowed &&
		mayInitializeAds(input.ads, requirement.requiresExplicitConsent)
	) {
		await initAds()
	}

	lastBootstrapKey = key
}

/** Test helper — clears bootstrap idempotency flags. */
export function __resetOptionalSdkBootstrapForTests (): void {
	lastBootstrapKey = null
	appOpenSent = false
}
