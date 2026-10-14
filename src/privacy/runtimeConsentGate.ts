/**
 * In-process consent gate read by adsService + appMetrica.
 *
 * Bootstrap syncs this on every decision change so revoke takes effect
 * immediately (including mid-flight load/init races via generation checks).
 *
 * Defaults: RuStore allows optional SDKs; Google Play blocks until grant.
 */

import { getAppStore } from '../store/appStore'
import { resolveConsentRequirement } from './consentPolicy'

type ConsentListener = () => void

const listeners = new Set<ConsentListener>()

function defaultAllowed (): boolean {
	return !resolveConsentRequirement({
		storeId: getAppStore(),
	}).requiresExplicitConsent
}

let adsAllowed = defaultAllowed()
let analyticsAllowed = defaultAllowed()
/** Bumps on every ads gate write so async load/show can detect revoke. */
let adsGeneration = 0

function notifyListeners (): void {
	for (const listener of listeners) {
		try {
			listener()
		} catch {
			// Listeners must not break consent updates.
		}
	}
}

/** Subscribe to ads/analytics gate changes (BannerSlot remounts loads). */
export function subscribeRuntimeConsent (
	listener: ConsentListener,
): () => void {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
	}
}

export function isRuntimeAdsAllowed (): boolean {
	return adsAllowed
}

export function isRuntimeAnalyticsAllowed (): boolean {
	return analyticsAllowed
}

/** Monotonic counter — compare before/after awaits in ads load paths. */
export function getAdsConsentGeneration (): number {
	return adsGeneration
}

/**
 * Apply ads purpose to the runtime gate.
 * Revoke bumps generation so in-flight loadAd results are discarded.
 */
export function setRuntimeAdsAllowed (allowed: boolean): void {
	const changed = adsAllowed !== allowed
	adsAllowed = allowed
	if (!allowed) {
		adsGeneration += 1
	}
	if (changed) {
		notifyListeners()
	}
}

/** Apply analytics purpose to the runtime gate (JS trackEvent reads this). */
export function setRuntimeAnalyticsAllowed (allowed: boolean): void {
	const changed = analyticsAllowed !== allowed
	analyticsAllowed = allowed
	if (changed) {
		notifyListeners()
	}
}

/** Test helper — restores store-based defaults or explicit overrides. */
export function __resetRuntimeConsentGateForTests (options?: {
	ads?: boolean
	analytics?: boolean
}): void {
	adsAllowed =
		typeof options?.ads === 'boolean' ? options.ads : defaultAllowed()
	analyticsAllowed =
		typeof options?.analytics === 'boolean'
			? options.analytics
			: defaultAllowed()
	adsGeneration = 0
}
