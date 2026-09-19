/**
 * Phase 4 production shell contracts — branding, ads IDs, session, analytics.
 */

import {
	AD_PLACEMENTS,
	resolveAdUnitId,
	type AdPlacementKey,
} from '../../ads/placements'
import type { RewardedResult } from '../../ads/adsService'
import {
	disableAnalyticsForTests,
	trackEvent,
} from '../../analytics/appMetrica'
import {
	APP_DISPLAY_NAME,
	APP_PUBLISHER,
	APP_STORE_TITLE,
	APP_VERSION,
} from '../../branding'
import { createFreshSeed, createInitialGame, isActiveParty } from '../index'

describe('phase4 production shell', () => {
	beforeAll(() => {
		disableAnalyticsForTests()
	})

	it('exposes Hexonica branding strings', () => {
		expect(APP_DISPLAY_NAME).toBe('Гексоника')
		expect(APP_STORE_TITLE).toBe('Гексоника — числовая головоломка')
		expect(APP_PUBLISHER).toBe('ForestMusic')
		expect(APP_VERSION).toBe('1.0.0')
	})

	it('keeps AD_PLACEMENTS IDs exact for RuStore units', () => {
		expect(AD_PLACEMENTS.homeBanner).toBe('R-M-20075886-1')
		expect(AD_PLACEMENTS.settingsBanner).toBe('R-M-20075886-2')
		expect(AD_PLACEMENTS.howToPlayBanner).toBe('R-M-20075886-3')
		expect(AD_PLACEMENTS.gameOverInterstitial).toBe('R-M-20075886-4')
		expect(AD_PLACEMENTS.rewardedUndo).toBe('R-M-20075886-5')
	})

	it('resolveAdUnitId returns production IDs in test env', () => {
		const keys = Object.keys(AD_PLACEMENTS) as AdPlacementKey[]
		for (const key of keys) {
			expect(resolveAdUnitId(key)).toBe(AD_PLACEMENTS[key])
		}
	})

	it('isActiveParty matches Continue eligibility', () => {
		expect(isActiveParty(null)).toBe(false)
		expect(isActiveParty(undefined)).toBe(false)
		const playing = createInitialGame(createFreshSeed())
		expect(playing.status).toBe('playing')
		expect(isActiveParty(playing)).toBe(true)
		const over = { ...playing, status: 'game_over' as const }
		expect(isActiveParty(over)).toBe(true)
	})

	it('trackEvent / disableAnalyticsForTests never throw', () => {
		expect(() => {
			disableAnalyticsForTests()
			trackEvent('app_open')
			trackEvent('merge', { groupSize: 4 })
			trackEvent('game_over', { score: 10, moves: 3 })
		}).not.toThrow()
	})

	it('documents RewardedResult status union', () => {
		const samples: RewardedResult[] = [
			{ status: 'rewarded' },
			{ status: 'failed', reason: 'x' },
			{ status: 'unavailable', reason: 'y' },
			{ status: 'dismissed_without_reward' },
		]
		expect(samples.map((s) => s.status)).toEqual([
			'rewarded',
			'failed',
			'unavailable',
			'dismissed_without_reward',
		])
	})
})
