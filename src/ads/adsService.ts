/**
 * Yandex Mobile Ads bootstrap + fullscreen helpers.
 * All public functions catch errors so offline / missing native never crashes.
 *
 * Consent: Google Play deny blocks init / load / show inside this module
 * (not only UI). RuStore leaves the runtime gate open. Revoke clears preloads
 * and bumps a generation so in-flight loadAd results are discarded.
 *
 * Rewarded Undo uses a single-flight loader: at most one loadAd in flight,
 * one preloaded RewardedAd, and await ad.show() so Promise rejections settle.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- native SDK optional at runtime */

import { trackEvent } from '../analytics/appMetrica'
import { t } from '../localization/i18n'
import {
	getAdsConsentGeneration,
	isRuntimeAdsAllowed,
} from '../privacy/runtimeConsentGate'
import { resolveAdUnitId, type AdPlacementKey } from './placements'

let sdkReady = false
let initAttempted = false
/** Single-flight native initialize — concurrent callers await the same promise. */
let initPromise: Promise<boolean> | null = null

/** User-facing copy when ads cannot complete (resolved at call time). */
function getAdsUnavailableReason (): string {
	return t('ads.unavailable')
}

/** Hard timeout only as last-resort protection if SDK never dismisses. */
const REWARDED_SHOW_HARD_TIMEOUT_MS = 60000

export type RewardedTelemetrySource = 'game' | 'game_over'

/**
 * Initialize Yandex Mobile Ads when the runtime ads gate allows it.
 * Re-checks consent after await so revoke mid-init does not enable serving.
 */
export async function initAds (): Promise<boolean> {
	if (!isRuntimeAdsAllowed()) {
		return false
	}
	if (sdkReady) {
		return isRuntimeAdsAllowed()
	}
	if (initPromise) {
		const ok = await initPromise
		return ok && isRuntimeAdsAllowed()
	}
	if (initAttempted) {
		return sdkReady && isRuntimeAdsAllowed()
	}

	initAttempted = true
	initPromise = (async (): Promise<boolean> => {
		if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
			return false
		}
		try {
			if (!isRuntimeAdsAllowed()) {
				return false
			}
			const { MobileAds } = require('yandex-mobile-ads')
			// Callers (privacy bootstrap) must apply setUserConsent before this.
			await MobileAds.initialize()
			sdkReady = true
			// Revoke during initialize() — SDK may be up, but do not serve.
			return isRuntimeAdsAllowed()
		} catch {
			sdkReady = false
			return false
		} finally {
			initPromise = null
		}
	})()

	return initPromise
}

/** True after native initialize succeeded (ignores consent). */
export function isAdsSdkReady (): boolean {
	return sdkReady
}

/**
 * True when the SDK is ready and ads purpose still allows serving.
 * BannerSlot and show paths use this so revoke hides creatives immediately.
 */
export function canServeAds (): boolean {
	return sdkReady && isRuntimeAdsAllowed()
}

export type InterstitialResult = 'shown' | 'failed' | 'unavailable'

/**
 * Load + show a single interstitial. Never throws.
 * Consent deny / revoke → unavailable (Game Over must continue).
 */
export async function showInterstitial (
	placement: AdPlacementKey = 'gameOverInterstitial',
): Promise<InterstitialResult> {
	// Consent gate first — deny must win even in Jest.
	if (!isRuntimeAdsAllowed()) {
		return 'unavailable'
	}
	// Jest without a forced sdkReady stays offline; lifecycle suites set sdkReady.
	if (
		typeof process !== 'undefined' &&
		process.env.NODE_ENV === 'test' &&
		!sdkReady
	) {
		return 'unavailable'
	}
	const generation = getAdsConsentGeneration()
	const ready = await initAds()
	if (!ready || !isRuntimeAdsAllowed() || generation !== getAdsConsentGeneration()) {
		return 'unavailable'
	}
	try {
		const { InterstitialAdLoader } = require('yandex-mobile-ads')
		const loader = await InterstitialAdLoader.create()
		if (
			!loader ||
			!isRuntimeAdsAllowed() ||
			generation !== getAdsConsentGeneration()
		) {
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
		if (
			!ad ||
			!isRuntimeAdsAllowed() ||
			generation !== getAdsConsentGeneration()
		) {
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
				// Final gate immediately before show().
				if (
					!isRuntimeAdsAllowed() ||
					generation !== getAdsConsentGeneration()
				) {
					done()
					return
				}
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

/**
 * Sync ads purpose into this service. Revoke drops preloads so no stale show.
 * Called from optional SDK bootstrap on every decision change.
 */
export function syncAdsConsent (allowed: boolean): void {
	if (!allowed) {
		rewardedPreload = null
		// Abandon in-flight load result via generation bump in the gate;
		// clear the promise handle so a later grant starts a fresh load.
		rewardedLoadPromise = null
	}
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
	initPromise = null
	rewardedPreload = null
	rewardedLoadPromise = null
}

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
 * Revoke mid-load discards the result (no store / no show).
 */
async function ensureRewardedLoaded (
	source: RewardedTelemetrySource,
): Promise<any | null> {
	if (!isRuntimeAdsAllowed()) {
		rewardedPreload = null
		return null
	}
	if (rewardedPreload?.ad) {
		return rewardedPreload.ad
	}
	if (rewardedLoadPromise) {
		return rewardedLoadPromise
	}

	const generation = getAdsConsentGeneration()
	let loadPromise!: Promise<any | null>
	loadPromise = (async (): Promise<any | null> => {
		try {
			if (
				!isRuntimeAdsAllowed() ||
				generation !== getAdsConsentGeneration()
			) {
				return null
			}
			trackEvent(
				'rewarded_load_requested',
				rewardedTelemetryBase(source),
			)
			const { RewardedAdLoader } = require('yandex-mobile-ads')
			const loader = await RewardedAdLoader.create()
			if (
				!loader ||
				!isRuntimeAdsAllowed() ||
				generation !== getAdsConsentGeneration()
			) {
				trackEvent('rewarded_load_failed', {
					...rewardedTelemetryBase(source),
					error_type: 'no_loader_or_consent',
				})
				return null
			}
			const ad = await loader.loadAd({
				adUnitId: resolveAdUnitId('rewardedUndo'),
			})
			if (
				!ad ||
				!isRuntimeAdsAllowed() ||
				generation !== getAdsConsentGeneration()
			) {
				trackEvent('rewarded_load_failed', {
					...rewardedTelemetryBase(source),
					error_type: !ad ? 'empty_ad' : 'consent_revoked',
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
		if (!isRuntimeAdsAllowed()) {
			return
		}
		const ready = await initAds()
		if (!ready || !isRuntimeAdsAllowed()) {
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
 * Consent deny → unavailable (Undo offer UI stays usable without a show).
 */
export async function showRewardedUndo (options?: {
	source?: RewardedTelemetrySource
}): Promise<RewardedResult> {
	const source = options?.source ?? 'game'
	if (!isRuntimeAdsAllowed()) {
		return {
			status: 'unavailable',
			reason: getAdsUnavailableReason(),
		}
	}
	const generation = getAdsConsentGeneration()
	const ready = await initAds()
	if (!ready || !isRuntimeAdsAllowed() || generation !== getAdsConsentGeneration()) {
		return {
			status: 'unavailable',
			reason: getAdsUnavailableReason(),
		}
	}

	try {
		const ad = await ensureRewardedLoaded(source)
		if (
			!ad ||
			!isRuntimeAdsAllowed() ||
			generation !== getAdsConsentGeneration()
		) {
			return {
				status: 'failed',
				reason: getAdsUnavailableReason(),
			}
		}
		// Consume before show so a failed/stale instance cannot be reused,
		// and the next preload starts a clean loadAd.
		consumeRewardedPreload(ad)

		if (
			!isRuntimeAdsAllowed() ||
			generation !== getAdsConsentGeneration()
		) {
			return {
				status: 'unavailable',
				reason: getAdsUnavailableReason(),
			}
		}

		const result = await presentRewardedAd(ad, source, generation)

		// Consent revoke during/after show — never return rewarded.
		if (
			result.status === 'rewarded' &&
			(!isRuntimeAdsAllowed() ||
				generation !== getAdsConsentGeneration())
		) {
			return {
				status: 'unavailable',
				reason: getAdsUnavailableReason(),
			}
		}

		// Next preload always goes through single-flight ensure — only if still allowed.
		if (isRuntimeAdsAllowed()) {
			void preloadRewardedUndo(source)
		}
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
 * True when ads purpose is still the same epoch captured at show start.
 */
function isAdsConsentEpochCurrent (generation: number): boolean {
	return (
		isRuntimeAdsAllowed() &&
		generation === getAdsConsentGeneration()
	)
}

/**
 * GameScreen must re-check this immediately before applyUndo() so a revoke
 * during show cannot grant Undo even if status was rewarded.
 */
export function mayApplyRewardedUndo (generation: number): boolean {
	return isAdsConsentEpochCurrent(generation)
}

/** Snapshot ads consent epoch before starting a rewarded Undo attempt. */
export function captureAdsConsentGeneration (): number {
	return getAdsConsentGeneration()
}

/**
 * Wire SDK callbacks, await show() Promise, settle exactly once.
 * Captured generation must still match at reward/dismiss or reward is void.
 */
function presentRewardedAd (
	ad: any,
	source: RewardedTelemetrySource,
	generation: number,
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
			// Late / duplicate callbacks after settle or revoke never grant Undo.
			if (settled || !isAdsConsentEpochCurrent(generation)) {
				return
			}
			rewarded = true
			trackEvent('rewarded_reward', rewardedTelemetryBase(source))
		}
		ad.onAdImpression = () => {
			if (settled || !isAdsConsentEpochCurrent(generation)) {
				return
			}
			trackEvent('rewarded_impression', rewardedTelemetryBase(source))
		}
		ad.onAdDismissed = () => {
			if (settled) {
				return
			}
			trackEvent('rewarded_closed', rewardedTelemetryBase(source))
			if (!isAdsConsentEpochCurrent(generation)) {
				// Do not force-close native creative — just refuse the reward.
				finish({
					status: 'unavailable',
					reason: getAdsUnavailableReason(),
				})
				return
			}
			finish(
				rewarded
					? { status: 'rewarded' }
					: { status: 'dismissed_without_reward' },
			)
		}
		ad.onAdFailedToShow = (error?: unknown) => {
			if (settled) {
				return
			}
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
				if (!isAdsConsentEpochCurrent(generation)) {
					finish({
						status: 'unavailable',
						reason: getAdsUnavailableReason(),
					})
					return
				}
				trackEvent(
					'rewarded_show_requested',
					rewardedTelemetryBase(source),
				)
				// show() returns Promise<void> — must await for async rejection.
				await ad.show()
				// Revoke during show(): wait for dismiss/fail/timeout to settle.
				// Do not return rewarded if consent flipped (checked in callbacks).
				if (
					!settled &&
					!isAdsConsentEpochCurrent(generation)
				) {
					// Keep waiting for onAdDismissed / timeout so UI does not hang;
					// callbacks will finish with unavailable.
				}
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
			if (!isAdsConsentEpochCurrent(generation)) {
				finish({
					status: 'unavailable',
					reason: getAdsUnavailableReason(),
				})
				return
			}
			finish({
				status: 'failed',
				reason: getAdsUnavailableReason(),
			})
		}, REWARDED_SHOW_HARD_TIMEOUT_MS)
	})
}
