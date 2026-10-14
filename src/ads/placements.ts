/**
 * Yandex Mobile Ads placement IDs — store-aware, semantic mapping.
 *
 * Google Play block numbers are NOT aligned with RuStore suffixes.
 * Always map by placement key (homeBanner, rewardedUndo, …), never by -N.
 */

import { getAppStore, type AppStoreId } from '../store/appStore'

export type AdPlacementKey =
	| 'homeBanner'
	| 'settingsBanner'
	| 'howToPlayBanner'
	| 'gameOverInterstitial'
	| 'rewardedUndo'
	| 'gameBanner'

export type AdFormat = 'banner' | 'interstitial' | 'rewarded'

/** Semantic format for each placement — store-independent. */
export const AD_PLACEMENT_FORMATS: Record<AdPlacementKey, AdFormat> = {
	homeBanner: 'banner',
	settingsBanner: 'banner',
	howToPlayBanner: 'banner',
	gameBanner: 'banner',
	gameOverInterstitial: 'interstitial',
	rewardedUndo: 'rewarded',
}

/**
 * Production Yandex blocks for RuStore:
 * Home → -1, Settings → -2, How to Play / About → -3,
 * Game Over interstitial → -4, Undo rewarded → -5,
 * GameScreen bottom sticky → -6.
 */
export const RUSTORE_AD_PLACEMENTS: Record<AdPlacementKey, string> = {
	homeBanner: 'R-M-20075886-1',
	settingsBanner: 'R-M-20075886-2',
	/** Shared by How to Play and About (secondary informational screens). */
	howToPlayBanner: 'R-M-20075886-3',
	gameOverInterstitial: 'R-M-20075886-4',
	rewardedUndo: 'R-M-20075886-5',
	/** Normal gameplay GameScreen only — never tutorial. */
	gameBanner: 'R-M-20075886-6',
}

/**
 * Production Yandex blocks for Google Play (R-M-20208975).
 * Note different ordering vs RuStore: GameScreen=-4, interstitial=-5, rewarded=-6.
 */
export const GOOGLEPLAY_AD_PLACEMENTS: Record<AdPlacementKey, string> = {
	homeBanner: 'R-M-20208975-1',
	settingsBanner: 'R-M-20208975-2',
	howToPlayBanner: 'R-M-20208975-3',
	gameBanner: 'R-M-20208975-4',
	gameOverInterstitial: 'R-M-20208975-5',
	rewardedUndo: 'R-M-20208975-6',
}

/**
 * @deprecated Prefer getAdPlacements() / resolveAdUnitId().
 * Alias kept for RuStore-era contracts — always RuStore IDs.
 */
export const AD_PLACEMENTS = RUSTORE_AD_PLACEMENTS

/**
 * Official Yandex demo/test unit IDs — DEV only.
 * Exported for regression tests (production IDs must never equal these).
 */
export const DEMO_AD_UNITS: Record<AdPlacementKey, string> = {
	homeBanner: 'demo-banner-yandex',
	settingsBanner: 'demo-banner-yandex',
	howToPlayBanner: 'demo-banner-yandex',
	gameOverInterstitial: 'demo-interstitial-yandex',
	rewardedUndo: 'demo-rewarded-yandex',
	gameBanner: 'demo-banner-yandex',
}

/**
 * Stable reserved height (dp) for the GameScreen sticky banner dock.
 * Matches typical Yandex sticky phone height so load/no-fill never reflows
 * the hex board. Do not enlarge without human QA.
 */
export const GAME_BANNER_RESERVED_HEIGHT = 50

/** Production placement table for a store flavor. */
export function getAdPlacements (
	store: AppStoreId = getAppStore(),
): Record<AdPlacementKey, string> {
	switch (store) {
		case 'googleplay':
			return GOOGLEPLAY_AD_PLACEMENTS
		case 'rustore':
		default:
			return RUSTORE_AD_PLACEMENTS
	}
}

/**
 * Resolve the ad unit for a placement.
 * Production builds always use real store-specific IDs.
 * DEV defaults to demo units unless EXPO_PUBLIC_ADS_MODE=production.
 */
export function resolveAdUnitId (placement: AdPlacementKey): string {
	const forceProd =
		typeof process !== 'undefined' &&
		process.env?.EXPO_PUBLIC_ADS_MODE === 'production'
	// Unit tests assert production placement IDs without native ads.
	if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
		return getAdPlacements()[placement]
	}
	if (typeof __DEV__ !== 'undefined' && __DEV__ && !forceProd) {
		return DEMO_AD_UNITS[placement]
	}
	return getAdPlacements()[placement]
}

/** Resolve as DEV would (demo units) — for tests only. */
export function resolveDemoAdUnitId (placement: AdPlacementKey): string {
	return DEMO_AD_UNITS[placement]
}

export const YANDEX_ADS_PACKAGE = 'yandex-mobile-ads'
