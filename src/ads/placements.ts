/**
 * Yandex Mobile Ads placement IDs and demo overrides for __DEV__ safety.
 */

/**
 * Production Yandex blocks:
 * Home → -1, Settings → -2, How to Play / About → -3,
 * Game Over interstitial → -4, Undo rewarded → -5,
 * GameScreen bottom sticky → -6.
 */
export const AD_PLACEMENTS = {
	homeBanner: 'R-M-20075886-1',
	settingsBanner: 'R-M-20075886-2',
	/** Shared by How to Play and About (secondary informational screens). */
	howToPlayBanner: 'R-M-20075886-3',
	gameOverInterstitial: 'R-M-20075886-4',
	rewardedUndo: 'R-M-20075886-5',
	/** Normal gameplay GameScreen only — never tutorial. */
	gameBanner: 'R-M-20075886-6',
} as const

export type AdPlacementKey = keyof typeof AD_PLACEMENTS

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

/**
 * Resolve the ad unit for a placement.
 * Production builds always use real IDs.
 * DEV defaults to demo units unless EXPO_PUBLIC_ADS_MODE=production.
 */
export function resolveAdUnitId (placement: AdPlacementKey): string {
	const forceProd =
		typeof process !== 'undefined' &&
		process.env?.EXPO_PUBLIC_ADS_MODE === 'production'
	// Unit tests assert production placement IDs without native ads.
	if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
		return AD_PLACEMENTS[placement]
	}
	if (typeof __DEV__ !== 'undefined' && __DEV__ && !forceProd) {
		return DEMO_AD_UNITS[placement]
	}
	return AD_PLACEMENTS[placement]
}

/** Resolve as DEV would (demo units) — for tests only. */
export function resolveDemoAdUnitId (placement: AdPlacementKey): string {
	return DEMO_AD_UNITS[placement]
}

export const YANDEX_ADS_PACKAGE = 'yandex-mobile-ads'
