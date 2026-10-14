/**
 * Store-aware Yandex placement IDs — semantic map, no suffix leakage.
 */

import {
	AD_PLACEMENT_FORMATS,
	AD_PLACEMENTS,
	DEMO_AD_UNITS,
	GAME_BANNER_RESERVED_HEIGHT,
	getAdPlacements,
	GOOGLEPLAY_AD_PLACEMENTS,
	resolveAdUnitId,
	RUSTORE_AD_PLACEMENTS,
	type AdPlacementKey,
} from '../placements'
import { __setAppStoreForTests } from '../../store/appStore'

const PLACEMENT_KEYS = Object.keys(RUSTORE_AD_PLACEMENTS) as AdPlacementKey[]

describe('store-aware ad placements', () => {
	afterEach(() => {
		__setAppStoreForTests(null)
	})

	it('preserves exact RuStore production IDs', () => {
		expect(RUSTORE_AD_PLACEMENTS).toEqual({
			homeBanner: 'R-M-20075886-1',
			settingsBanner: 'R-M-20075886-2',
			howToPlayBanner: 'R-M-20075886-3',
			gameOverInterstitial: 'R-M-20075886-4',
			rewardedUndo: 'R-M-20075886-5',
			gameBanner: 'R-M-20075886-6',
		})
		expect(AD_PLACEMENTS).toEqual(RUSTORE_AD_PLACEMENTS)
	})

	it('maps Google Play by semantic placement (not by -N suffix)', () => {
		expect(GOOGLEPLAY_AD_PLACEMENTS).toEqual({
			homeBanner: 'R-M-20208975-1',
			settingsBanner: 'R-M-20208975-2',
			howToPlayBanner: 'R-M-20208975-3',
			gameBanner: 'R-M-20208975-4',
			gameOverInterstitial: 'R-M-20208975-5',
			rewardedUndo: 'R-M-20208975-6',
		})
		// Suffixes diverge vs RuStore for game / interstitial / rewarded.
		expect(GOOGLEPLAY_AD_PLACEMENTS.gameBanner).toBe('R-M-20208975-4')
		expect(GOOGLEPLAY_AD_PLACEMENTS.gameOverInterstitial).toBe(
			'R-M-20208975-5',
		)
		expect(GOOGLEPLAY_AD_PLACEMENTS.rewardedUndo).toBe('R-M-20208975-6')
		expect(RUSTORE_AD_PLACEMENTS.gameBanner).toBe('R-M-20075886-6')
	})

	it('keeps ad formats strictly separated by placement', () => {
		expect(AD_PLACEMENT_FORMATS.homeBanner).toBe('banner')
		expect(AD_PLACEMENT_FORMATS.settingsBanner).toBe('banner')
		expect(AD_PLACEMENT_FORMATS.howToPlayBanner).toBe('banner')
		expect(AD_PLACEMENT_FORMATS.gameBanner).toBe('banner')
		expect(AD_PLACEMENT_FORMATS.gameOverInterstitial).toBe('interstitial')
		expect(AD_PLACEMENT_FORMATS.rewardedUndo).toBe('rewarded')
	})

	it('getAdPlacements returns RuStore IDs for rustore', () => {
		__setAppStoreForTests('rustore')
		expect(getAdPlacements()).toEqual(RUSTORE_AD_PLACEMENTS)
		for (const key of PLACEMENT_KEYS) {
			expect(resolveAdUnitId(key)).toBe(RUSTORE_AD_PLACEMENTS[key])
		}
	})

	it('getAdPlacements returns Google Play IDs for googleplay', () => {
		__setAppStoreForTests('googleplay')
		expect(getAdPlacements()).toEqual(GOOGLEPLAY_AD_PLACEMENTS)
		for (const key of PLACEMENT_KEYS) {
			expect(resolveAdUnitId(key)).toBe(GOOGLEPLAY_AD_PLACEMENTS[key])
		}
	})

	it('prevents cross-store placement leakage', () => {
		__setAppStoreForTests('googleplay')
		const play = getAdPlacements()
		for (const key of PLACEMENT_KEYS) {
			expect(play[key]).not.toBe(RUSTORE_AD_PLACEMENTS[key])
			expect(play[key]).not.toBe(DEMO_AD_UNITS[key])
			expect(play[key].startsWith('R-M-20208975-')).toBe(true)
		}
		__setAppStoreForTests('rustore')
		const rustore = getAdPlacements()
		for (const key of PLACEMENT_KEYS) {
			expect(rustore[key]).not.toBe(GOOGLEPLAY_AD_PLACEMENTS[key])
			expect(rustore[key].startsWith('R-M-20075886-')).toBe(true)
		}
	})

	it('keeps 50dp game banner dock unchanged', () => {
		expect(GAME_BANNER_RESERVED_HEIGHT).toBe(50)
	})
})
