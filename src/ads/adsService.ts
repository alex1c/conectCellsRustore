/**
 * Yandex Mobile Ads bootstrap + fullscreen helpers.
 * All public functions catch errors so offline / missing native never crashes.
 *
 * Rewarded Undo uses a single-flight loader: at most one loadAd in flight,
 * one preloaded RewardedAd, and await ad.show() so Promise rejections settle.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- native SDK optional at runtime */

import { trackEvent } from '../analytics/appMetrica'
import { t } from '../localization/i18n'
import { resolveAdUnitId, type AdPlacementKey } from './placements'

let sdkReady = false
let initAttempted = false

/** User-facing copy when ads cannot complete (resolved at call time). */
function getAdsUnavailableReason (): string {
	return t('ads.unavailable')
}

/** Hard timeout only as last-resort protection if SDK never dismisses. */
const REWARDED_SHOW_HARD_TIMEOUT_MS = 60000

export type RewardedTelemetrySource = 'game' | 'game_over'

export async function initAds (): Promise<boolean> {
	if (sdkReady) {
		return true
	}
	if (initAttempted) {
		return sdkReady
	}
	initAttempted = true
	if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
		return false
	}
	try {
		const { MobileAds } = require('yandex-mobile-ads')
		await MobileAds.initialize()
		sdkReady = true
		return true
	} catch {
		sdkReady = false
		return false
	}
}

export function isAdsSdkReady (): boolean {
	return sdkReady
}

/**
 * Reset rewarded + SDK flags for Jest. Production callers must not use this.
 * When sdkReady is forced true, initAds short-circuits without native work.
 */
export function __resetAdsServiceForTests (options?: {
	sdkReady?: boolean
}): void {
	sdkReady = options?.sdkReady ?? false
	initAttempted = options?.sdkReady === true
	rewardedPreload = null
	rewardedLoadPromise = null
}

export type InterstitialResult = 'shown' | 'failed' | 'unavailable'

/**
 * Load + show a single interstitial. Never throws.
 */
export async function showInterstitial (
	placement: AdPlacementKey = 'gameOverInterstitial',
): Promise<InterstitialResult> {
	if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
		return 'unavailable'
	}
	const ready = await initAds()
	if (!ready) {
		return 'unavailable'
	}
	try {
		const { InterstitialAdLoader } = require('yandex-mobile-ads')
		const loader = await InterstitialAdLoader.create()
		if (!loader) {
			return 'failed'
		}
		// Hard cap load — Game Over must never spin forever offline / on bad fill.
		const ad = await Promise.race([
			loader.loadAd({
				adUnitId: resolveAdUnitId(placement),
			}),
			new Promise<null>((resolve) => {
				setTimeout(() => resolve(null), 10000)
			}),
		])
		if (!ad) {
			return 'failed'
		}
		await new Promise<void>((resolve) => {
			let settled = false
			const done = () => {
				if (settled) {
					return
				}
				settled = true
				resolve()
			}
			ad.onAdDismissed = done
			ad.onAdFailedToShow = done
			try {
				ad.show()
			} catch {
				done()
			}
			// Safety timeout — never block Game Over forever.
			setTimeout(done, 45000)
		})
		return 'shown'
	} catch {
		return 'failed'
	}
}

export type RewardedResult =
	| { status: 'rewarded' }
	| { status: 'failed'; reason: string }
	| { status: 'unavailable'; reason: string }
	| { status: 'dismissed_without_reward' }

/** Preloaded rewarded instance ready to show (consumed on show). */
let rewardedPreload: { ad: any; placement: AdPlacementKey } | null = null

/**
 * Single in-flight loadAd promise. Concurrent ensureRewardedLoaded callers
 * await this same promise — never start a second RewardedAdLoader/loadAd.
 */
let rewardedLoadPromise: Promise<any | null> | null = null

/** Short sanitized error code for telemetry (no dumps / PII). */
function sanitizeErrorType (error: unknown): string {
	if (error == null) {
		return 'unknown'
	}
	const raw =
		typeof error === 'string'
			? error
			: typeof (error as { code?: unknown }).code === 'string'
				? String((error as { code: string }).code)
				: typeof (error as { message?: unknown }).message === 'string'
					? String((error as { message: string }).message)
					: 'error'
	const cleaned = raw
		.replace(/[^a-zA-Z0-9_.:-]/g, '_')
		.replace(/_+/g, '_')
		.slice(0, 48)
	return cleaned.length > 0 ? cleaned : 'error'
}

function rewardedTelemetryBase (source: RewardedTelemetrySource) {
	return {
		placement: 'undo' as const,
		source,
	}
}

/**
 * Authoritative single-flight rewarded load.
 * - Valid preload → return it (do not load again).
 * - In-flight load → await/reuse the same promise.
 * - Otherwise → exactly one loader.loadAd, then store preload on success.
 */
async function ensureRewardedLoaded (
	source: RewardedTelemetrySource,
): Promise<any | null> {
	if (rewardedPreload?.ad) {
		return rewardedPreload.ad
	}
	if (rewardedLoadPromise) {
		return rewardedLoadPromise
	}

	let loadPromise!: Promise<any | null>
	loadPromise = (async (): Promise<any | null> => {
		try {
			trackEvent(
				'rewarded_load_requested',
				rewardedTelemetryBase(source),
			)
			const { RewardedAdLoader } = require('yandex-mobile-ads')
			const loader = await RewardedAdLoader.create()
			if (!loader) {
				trackEvent('rewarded_load_failed', {
					...rewardedTelemetryBase(source),
					error_type: 'no_loader',
				})
				return null
			}
			const ad = await loader.loadAd({
				adUnitId: resolveAdUnitId('rewardedUndo'),
			})
			if (!ad) {
				trackEvent('rewarded_load_failed', {
					...rewardedTelemetryBase(source),
					error_type: 'empty_ad',
				})
				return null
			}
			rewardedPreload = { ad, placement: 'rewardedUndo' }
			trackEvent('rewarded_loaded', rewardedTelemetryBase(source))
			return ad
		} catch (error) {
			rewardedPreload = null
			trackEvent('rewarded_load_failed', {
				...rewardedTelemetryBase(source),
				error_type: sanitizeErrorType(error),
			})
			return null
		} finally {
			// Clear in-flight only if we are still the active load.
			if (rewardedLoadPromise === loadPromise) {
				rewardedLoadPromise = null
			}
		}
	})()

	rewardedLoadPromise = loadPromise
	return loadPromise
}

/** Take the preloaded ad so the next ensure starts a fresh load. */
function consumeRewardedPreload (ad: any): void {
	if (rewardedPreload?.ad === ad) {
		rewardedPreload = null
	}
}

/** Preload rewarded undo ad (best-effort, single-flight). */
export async function preloadRewardedUndo (
	source: RewardedTelemetrySource = 'game',
): Promise<void> {
	try {
		const ready = await initAds()
		if (!ready) {
			return
		}
		await ensureRewardedLoaded(source)
	} catch {
		// Best-effort preload — never throw into gameplay.
	}
}

/**
 * Show rewarded undo. Resolves only after reward / fail / dismiss.
 * Caller must gate double-taps externally (undoBusy).
 *
 * Undo is granted only after genuine onRewarded + closed/completed flow;
 * open / impression / dismiss alone never grant Undo.
 */
export async function showRewardedUndo (options?: {
	source?: RewardedTelemetrySource
}): Promise<RewardedResult> {
	const source = options?.source ?? 'game'
	const ready = await initAds()
	if (!ready) {
		return {
			status: 'unavailable',
			reason: getAdsUnavailableReason(),
		}
	}

	try {
		const ad = await ensureRewardedLoaded(source)
		if (!ad) {
			return {
				status: 'failed',
				reason: getAdsUnavailableReason(),
			}
		}
		// Consume before show so a failed/stale instance cannot be reused,
		// and the next preload starts a clean loadAd.
		consumeRewardedPreload(ad)

		const result = await presentRewardedAd(ad, source)

		// Next preload always goes through single-flight ensure.
		void preloadRewardedUndo(source)
		return result
	} catch (error) {
		rewardedPreload = null
		rewardedLoadPromise = null
		trackEvent('rewarded_show_failed', {
			...rewardedTelemetryBase(source),
			error_type: sanitizeErrorType(error),
		})
		return {
			status: 'failed',
			reason: getAdsUnavailableReason(),
		}
	}
}

/**
 * Wire SDK callbacks, await show() Promise, settle exactly once.
 */
function presentRewardedAd (
	ad: any,
	source: RewardedTelemetrySource,
): Promise<RewardedResult> {
	return new Promise<RewardedResult>((resolve) => {
		let rewarded = false
		let settled = false
		let hardTimeoutId: ReturnType<typeof setTimeout> | null = null
		const finish = (value: RewardedResult) => {
			if (settled) {
				return
			}
			settled = true
			if (hardTimeoutId != null) {
				clearTimeout(hardTimeoutId)
				hardTimeoutId = null
			}
			resolve(value)
		}

		ad.onRewarded = () => {
			rewarded = true
			trackEvent('rewarded_reward', rewardedTelemetryBase(source))
		}
		ad.onAdImpression = () => {
			trackEvent('rewarded_impression', rewardedTelemetryBase(source))
		}
		ad.onAdDismissed = () => {
			trackEvent('rewarded_closed', rewardedTelemetryBase(source))
			finish(
				rewarded
					? { status: 'rewarded' }
					: { status: 'dismissed_without_reward' },
			)
		}
		ad.onAdFailedToShow = (error?: unknown) => {
			trackEvent('rewarded_show_failed', {
				...rewardedTelemetryBase(source),
				error_type: sanitizeErrorType(error ?? 'failed_to_show'),
			})
			finish({
				status: 'failed',
				reason: getAdsUnavailableReason(),
			})
		}

		void (async () => {
			try {
				trackEvent(
					'rewarded_show_requested',
					rewardedTelemetryBase(source),
				)
				// show() returns Promise<void> — must await for async rejection.
				await ad.show()
			} catch (error) {
				trackEvent('rewarded_show_failed', {
					...rewardedTelemetryBase(source),
					error_type: sanitizeErrorType(error),
				})
				finish({
					status: 'failed',
					reason: getAdsUnavailableReason(),
				})
			}
		})()

		hardTimeoutId = setTimeout(() => {
			finish({
				status: 'failed',
				reason: getAdsUnavailableReason(),
			})
		}, REWARDED_SHOW_HARD_TIMEOUT_MS)
	})
}
