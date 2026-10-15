/**
 * Starts optional AppMetrica / Yandex Ads after consent decisions.
 * Idempotent — safe on cold start, Settings revisit, and app foreground.
 *
 * Runtime gates are synced on every call (before the idempotent key) so
 * revoke immediately stops ads loads and analytics events even when the
 * bootstrap key would otherwise short-circuit init work.
 */

import { initAds } from '../ads/adsService'
import { initAnalytics, trackEvent } from '../analytics/appMetrica'
import { getAppStore } from '../store/appStore'
import { applyConsentGatesSync } from './applyConsentGates'
import {
	canEnableAds,
	canEnableAnalytics,
	resolveConsentRequirement,
} from './consentPolicy'
import type { PurposeDecision } from './consentPersistence'
import {
	isRuntimeAdsAllowed,
	isRuntimeAnalyticsAllowed,
} from './runtimeConsentGate'
import {
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

	// Sync JS/runtime gates first (open grants — caller already persisted).
	applyConsentGatesSync({
		analytics: input.analytics,
		ads: input.ads,
		openGrants: true,
	})

	const key = `${analyticsAllowed ? 'a1' : 'a0'}:${adsAllowed ? 'd1' : 'd0'}`
	if (lastBootstrapKey === key) {
		return
	}

	if (
		analyticsAllowed &&
		mayInitializeAnalytics(input.analytics, requirement.requiresExplicitConsent)
	) {
		await initAnalytics()
		// Re-check after await — revoke during activate must skip app_open.
		if (!appOpenSent && isRuntimeAnalyticsAllowed()) {
			trackEvent('app_open', { store: getAppStore() })
			appOpenSent = true
		}
	}

	if (
		adsAllowed &&
		mayInitializeAds(input.ads, requirement.requiresExplicitConsent)
	) {
		// Re-check after analytics await — revoke mid-bootstrap must skip init.
		if (isRuntimeAdsAllowed()) {
			await initAds()
		}
	}

	lastBootstrapKey = key
}

/** Test helper — clears bootstrap idempotency flags. */
export function __resetOptionalSdkBootstrapForTests (): void {
	lastBootstrapKey = null
	appOpenSent = false
}
