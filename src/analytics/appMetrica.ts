/**
 * AppMetrica analytics adapter.
 * Production key is wired here; Jest / Node tests use a no-op sink.
 *
 * Google Play: activate only after analytics purpose is granted
 * (see privacy/optionalSdkBootstrap). RuStore activates without a gate.
 * locationTracking stays false — Hexonica does not need geodata.
 *
 * Consent revoke limitations (@appmetrica/react-native-analytics 4.2.0):
 * - The native SDK cannot be fully de-initialized after activate().
 * - We immediately stop JS trackEvent via the runtime analytics gate and
 *   call AppMetrica.setDataSendingEnabled(false) when activated.
 * - Native process-local state may remain until process death; no further
 *   custom events are reported while analytics purpose is denied.
 * - Re-grant calls setDataSendingEnabled(true); activate() is still once.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- native SDK optional at runtime */

import { APP_VERSION } from '../branding'
import {
	isRuntimeAnalyticsAllowed,
} from '../privacy/runtimeConsentGate'
import { getAppStore } from '../store/appStore'

/** Production AppMetrica API key (masked in reports). */
export const APPMETRICA_API_KEY = '96143264-a11a-44d0-875d-c960d4f8111e'

export type AnalyticsParams = Record<string, string | number | boolean | undefined>

/**
 * Analytics event names.
 *
 * Undo continuity (keep for historical comparison):
 * - undo_rewarded_started = user confirmed rewarded Undo attempt
 *   (NOT proof of impression / show).
 * - undo_rewarded_completed = reward successfully resulted in Undo.
 * - undo_rewarded_failed = attempt ended without Undo.
 *
 * Rewarded lifecycle (diagnostic, placement=undo):
 * - rewarded_load_requested → immediately before SDK loadAd
 * - rewarded_loaded → SDK returned usable RewardedAd
 * - rewarded_show_requested → immediately before ad.show()
 * - rewarded_impression → onAdImpression
 * - rewarded_reward → onRewarded
 * - rewarded_closed → onAdDismissed
 * - rewarded_load_failed → loadAd failed/rejected
 * - rewarded_show_failed → show Promise rejection OR onAdFailedToShow
 */
export type AnalyticsEventName =
	| 'app_open'
	| 'home_continue'
	| 'new_game'
	| 'game_start'
	| 'game_resume'
	| 'merge'
	| 'large_merge'
	| 'terminal_clear'
	| 'cascade'
	| 'level_up'
	| 'undo_offer'
	| 'undo_rewarded_started'
	| 'undo_rewarded_completed'
	| 'undo_rewarded_failed'
	| 'rewarded_load_requested'
	| 'rewarded_loaded'
	| 'rewarded_show_requested'
	| 'rewarded_impression'
	| 'rewarded_reward'
	| 'rewarded_closed'
	| 'rewarded_load_failed'
	| 'rewarded_show_failed'
	| 'game_over'
	| 'interstitial_shown'
	| 'interstitial_failed'
	| 'settings_open'
	| 'how_to_play_open'
	| 'tutorial_start'
	| 'tutorial_step'
	| 'tutorial_complete'
	| 'tutorial_skip'

let activated = false
let sinkDisabled = false
/** When true, Jest may exercise reportEvent against the mocked SDK. */
let testAllowReporting = false

function isTestEnv (): boolean {
	return (
		typeof process !== 'undefined' &&
		process.env.NODE_ENV === 'test'
	)
}

function getAppMetrica (): {
	activate: (config: Record<string, unknown>) => void
	reportEvent: (name: string, attrs?: Record<string, unknown>) => void
	setDataSendingEnabled: (enabled: boolean) => void
} {
	return require('@appmetrica/react-native-analytics').default
}

/** Disable native reporting (Jest / unit tests). */
export function disableAnalyticsForTests (): void {
	sinkDisabled = true
}

/** Test helper — clears activation flags. */
export function __resetAnalyticsForTests (): void {
	activated = false
	sinkDisabled = false
	testAllowReporting = false
}

/**
 * Test helper — marks analytics as activated without native activate().
 * Used to exercise setDataSendingEnabled + trackEvent revoke paths.
 */
export function __forceAnalyticsActivatedForTests (): void {
	activated = true
	sinkDisabled = false
	testAllowReporting = true
}

/**
 * Push analytics purpose into the native SDK when already activated.
 * Always safe to call — JS trackEvent already reads the runtime gate.
 */
export function applyAnalyticsSendingEnabled (enabled: boolean): void {
	if (!activated || sinkDisabled) {
		return
	}
	if (isTestEnv() && !testAllowReporting) {
		return
	}
	try {
		getAppMetrica().setDataSendingEnabled(enabled)
	} catch {
		// Native bridge missing — JS gate still blocks reportEvent.
	}
}

function scrub (params?: AnalyticsParams): Record<string, string | number | boolean> {
	const out: Record<string, string | number | boolean> = {}
	if (!params) {
		return out
	}
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined) {
			continue
		}
		// Never send board payloads or free-form PII.
		if (key === 'board' || key === 'email' || key === 'userId') {
			continue
		}
		out[key] = value
	}
	return out
}

/**
 * Activate AppMetrica once. Safe to call multiple times.
 * Callers must gate on analytics consent for Google Play.
 * Failures never throw — offline / missing native module is fine.
 */
export async function initAnalytics (): Promise<void> {
	if (activated || sinkDisabled || isTestEnv()) {
		if (isTestEnv()) {
			sinkDisabled = true
		}
		return
	}
	// Google Play deny / pending — never activate until purpose granted.
	if (!isRuntimeAnalyticsAllowed()) {
		return
	}
	try {
		const AppMetrica = getAppMetrica()
		AppMetrica.activate({
			apiKey: APPMETRICA_API_KEY,
			sessionTimeout: 120,
			logs: typeof __DEV__ !== 'undefined' && __DEV__,
			appVersion: APP_VERSION,
			// Hexonica does not use geodata — keep location off.
			locationTracking: false,
			// Adv ID tracking only after analytics purpose granted (this path).
			trackAdvIdentifiersEnabled: true,
			statisticsSending: true,
		})
		activated = true
		// Align native sending with the current gate (handles revoke races).
		try {
			AppMetrica.setDataSendingEnabled(isRuntimeAnalyticsAllowed())
		} catch {
			// Optional on older bridges — JS gate remains authoritative.
		}
		// Same AppMetrica app for both stores — tag sessions with build flavor.
		// No PII; store id is a build constant (rustore | googleplay).
		if (isRuntimeAnalyticsAllowed()) {
			try {
				AppMetrica.reportEvent('app_store_flavor', {
					store: getAppStore(),
				})
			} catch {
				// Flavor tag is best-effort.
			}
		}
	} catch {
		// Native module missing or activate failed — keep gameplay running.
		activated = false
	}
}

/** Report a custom event. Never throws. Stops immediately on analytics revoke. */
export function trackEvent (
	name: AnalyticsEventName,
	params?: AnalyticsParams,
): void {
	// Never touch the native module in Jest unless a consent test opts in.
	if (sinkDisabled || (isTestEnv() && !testAllowReporting)) {
		return
	}
	// Runtime gate — revoke must stop events even if SDK stays activated.
	if (!isRuntimeAnalyticsAllowed()) {
		return
	}
	const payload = scrub(params)
	try {
		if (!activated) {
			return
		}
		const AppMetrica = getAppMetrica()
		if (Object.keys(payload).length > 0) {
			AppMetrica.reportEvent(name, payload)
		} else {
			AppMetrica.reportEvent(name)
		}
	} catch {
		// Swallow analytics errors.
	}
}

/** Masked key for QA reports (first 8 + last 5 → …8111e). */
export function maskedAppMetricaKey (): string {
	const key = APPMETRICA_API_KEY
	if (key.length < 16) {
		return '****'
	}
	return `${key.slice(0, 8)}…${key.slice(-5)}`
}

/** True after a successful activate in this process. */
export function isAnalyticsActivated (): boolean {
	return activated
}
