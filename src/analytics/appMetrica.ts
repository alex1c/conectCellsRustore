/**
 * AppMetrica analytics adapter.
 * Production key is wired here; Jest / Node tests use a no-op sink.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- native SDK optional at runtime */

import { APP_VERSION } from '../branding'

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

function isTestEnv (): boolean {
	return (
		typeof process !== 'undefined' &&
		process.env.NODE_ENV === 'test'
	)
}

/** Disable native reporting (Jest / unit tests). */
export function disableAnalyticsForTests (): void {
	sinkDisabled = true
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
 * Failures never throw — offline / missing native module is fine.
 */
export async function initAnalytics (): Promise<void> {
	if (activated || sinkDisabled || isTestEnv()) {
		if (isTestEnv()) {
			sinkDisabled = true
		}
		return
	}
	try {
		const AppMetrica = require('@appmetrica/react-native-analytics').default
		AppMetrica.activate({
			apiKey: APPMETRICA_API_KEY,
			sessionTimeout: 120,
			logs: typeof __DEV__ !== 'undefined' && __DEV__,
			appVersion: APP_VERSION,
		})
		activated = true
	} catch {
		// Native module missing or activate failed — keep gameplay running.
		activated = false
	}
}

/** Report a custom event. Never throws. */
export function trackEvent (
	name: AnalyticsEventName,
	params?: AnalyticsParams,
): void {
	// Never touch the native module in Jest / Node unit tests.
	if (sinkDisabled || isTestEnv()) {
		return
	}
	const payload = scrub(params)
	try {
		if (!activated) {
			return
		}
		const AppMetrica = require('@appmetrica/react-native-analytics').default
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
