/**
 * Yandex Mobile Ads bootstrap + fullscreen helpers.
 * All public functions catch errors so offline / missing native never crashes.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- native SDK optional at runtime */

import { resolveAdUnitId, type AdPlacementKey } from './placements'

let sdkReady = false
let initAttempted = false

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

let rewardedPreload: { ad: any; placement: AdPlacementKey } | null = null
let rewardedLoading = false

/** Preload rewarded undo ad (best-effort). */
export async function preloadRewardedUndo (): Promise<void> {
	if (
		(typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ||
		rewardedLoading ||
		rewardedPreload
	) {
		return
	}
	rewardedLoading = true
	try {
		const ready = await initAds()
		if (!ready) {
			return
		}
		const { RewardedAdLoader } = require('yandex-mobile-ads')
		const loader = await RewardedAdLoader.create()
		if (!loader) {
			return
		}
		const ad = await loader.loadAd({
			adUnitId: resolveAdUnitId('rewardedUndo'),
		})
		if (ad) {
			rewardedPreload = { ad, placement: 'rewardedUndo' }
		}
	} catch {
		rewardedPreload = null
	} finally {
		rewardedLoading = false
	}
}

/**
 * Show rewarded undo. Resolves only after reward / fail / dismiss.
 * Caller must gate double-taps externally.
 */
export async function showRewardedUndo (): Promise<RewardedResult> {
	if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
		return { status: 'unavailable', reason: 'test_env' }
	}
	const ready = await initAds()
	if (!ready) {
		return {
			status: 'unavailable',
			reason: 'Реклама пока недоступна. Попробуйте позже.',
		}
	}

	let ad = rewardedPreload?.ad ?? null
	rewardedPreload = null

	try {
		if (!ad) {
			const { RewardedAdLoader } = require('yandex-mobile-ads')
			const loader = await RewardedAdLoader.create()
			if (!loader) {
				return {
					status: 'unavailable',
					reason: 'Реклама пока недоступна. Попробуйте позже.',
				}
			}
			ad = await loader.loadAd({
				adUnitId: resolveAdUnitId('rewardedUndo'),
			})
		}
		if (!ad) {
			return {
				status: 'failed',
				reason: 'Реклама пока недоступна. Попробуйте позже.',
			}
		}

		const result = await new Promise<RewardedResult>((resolve) => {
			let rewarded = false
			let settled = false
			const finish = (value: RewardedResult) => {
				if (settled) {
					return
				}
				settled = true
				resolve(value)
			}
			ad.onRewarded = () => {
				rewarded = true
			}
			ad.onAdDismissed = () => {
				finish(
					rewarded
						? { status: 'rewarded' }
						: { status: 'dismissed_without_reward' },
				)
			}
			ad.onAdFailedToShow = () => {
				finish({
					status: 'failed',
					reason: 'Реклама пока недоступна. Попробуйте позже.',
				})
			}
			try {
				ad.show()
			} catch {
				finish({
					status: 'failed',
					reason: 'Реклама пока недоступна. Попробуйте позже.',
				})
			}
			setTimeout(() => {
				finish({
					status: 'failed',
					reason: 'Реклама пока недоступна. Попробуйте позже.',
				})
			}, 60000)
		})

		// Preload the next one after this impression cycle.
		void preloadRewardedUndo()
		return result
	} catch {
		return {
			status: 'failed',
			reason: 'Реклама пока недоступна. Попробуйте позже.',
		}
	}
}
