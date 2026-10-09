/**
 * Phase 4 production shell contracts — branding, ads IDs, session, analytics.
 */

import {
	AD_PLACEMENTS,
	DEMO_AD_UNITS,
	GAME_BANNER_RESERVED_HEIGHT,
	resolveAdUnitId,
	resolveDemoAdUnitId,
	type AdPlacementKey,
} from '../../ads/placements'
import type { RewardedResult } from '../../ads/adsService'
import {
	disableAnalyticsForTests,
	trackEvent,
} from '../../analytics/appMetrica'
import {
	APP_DISPLAY_NAME,
	APP_DISPLAY_NAME_INTL,
	APP_DISPLAY_NAME_RU,
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
		expect(APP_DISPLAY_NAME_RU).toBe('Гексоника')
		expect(APP_DISPLAY_NAME_INTL).toBe('Hexonica')
		expect(APP_DISPLAY_NAME).toBe('Гексоника')
		expect(APP_STORE_TITLE).toBe('Гексоника — числовая головоломка')
		expect(APP_PUBLISHER).toBe('ForestMusic')
		expect(APP_VERSION).toBe('1.0.1')
	})

	it('keeps app.json as native regeneration source of truth for name/icons', () => {
		// Tracked config must drive Expo prebuild / run:android — not gitignored strings.xml.
		const appJson = require('../../../app.json') as {
			expo: {
				name: string
				locales?: Record<string, string>
				icon: string
				plugins: (string | [string, Record<string, unknown>])[]
				android: {
					versionCode: number
					blockedPermissions: string[]
					adaptiveIcon: {
						foregroundImage: string
						backgroundImage: string
						monochromeImage: string
					}
				}
			}
		}
		// Default launcher identity is international Hexonica; ru locale overrides.
		expect(appJson.expo.name).toBe(APP_DISPLAY_NAME_INTL)
		expect(appJson.expo.locales?.ru).toBe('./native-locales/ru.json')
		expect(appJson.expo.locales?.en).toBe('./native-locales/en.json')
		expect(appJson.expo.icon).toBe('./assets/icon.png')
		expect(appJson.expo.android.versionCode).toBe(2)
		// Puzzle SFX only — never ship mic / overlay / legacy storage claims.
		expect(appJson.expo.android.blockedPermissions).toEqual(
			expect.arrayContaining([
				'android.permission.RECORD_AUDIO',
				'android.permission.SYSTEM_ALERT_WINDOW',
				'android.permission.READ_EXTERNAL_STORAGE',
				'android.permission.WRITE_EXTERNAL_STORAGE',
			]),
		)
		const audioPlugin = appJson.expo.plugins.find(
			(entry) => Array.isArray(entry) && entry[0] === 'expo-audio',
		) as
			| [
					string,
					{
						recordAudioAndroid: boolean
						enableBackgroundPlayback: boolean
					},
			  ]
			| undefined
		expect(audioPlugin).toBeDefined()
		expect(audioPlugin![1].recordAudioAndroid).toBe(false)
		expect(audioPlugin![1].enableBackgroundPlayback).toBe(false)
		const splashPlugin = appJson.expo.plugins.find(
			(entry) =>
				Array.isArray(entry) && entry[0] === 'expo-splash-screen',
		) as [string, { backgroundColor: string; image: string }] | undefined
		expect(splashPlugin).toBeDefined()
		expect(splashPlugin![1].backgroundColor).toBe('#101826')
		expect(splashPlugin![1].image).toBe('./assets/splash-icon.png')
		expect(appJson.expo.android.adaptiveIcon.foregroundImage).toBe(
			'./assets/android-icon-foreground.png',
		)
		expect(appJson.expo.android.adaptiveIcon.backgroundImage).toBe(
			'./assets/android-icon-background.png',
		)
		expect(appJson.expo.android.adaptiveIcon.monochromeImage).toBe(
			'./assets/android-icon-monochrome.png',
		)
	})

	it('keeps AD_PLACEMENTS IDs exact for RuStore units', () => {
		expect(AD_PLACEMENTS.homeBanner).toBe('R-M-20075886-1')
		expect(AD_PLACEMENTS.settingsBanner).toBe('R-M-20075886-2')
		// How to Play + About share the secondary-info banner block.
		expect(AD_PLACEMENTS.howToPlayBanner).toBe('R-M-20075886-3')
		expect(AD_PLACEMENTS.gameOverInterstitial).toBe('R-M-20075886-4')
		expect(AD_PLACEMENTS.rewardedUndo).toBe('R-M-20075886-5')
		expect(AD_PLACEMENTS.gameBanner).toBe('R-M-20075886-6')
	})

	it('resolveAdUnitId returns production IDs in test env', () => {
		const keys = Object.keys(AD_PLACEMENTS) as AdPlacementKey[]
		for (const key of keys) {
			expect(resolveAdUnitId(key)).toBe(AD_PLACEMENTS[key])
		}
	})

	it('gameBanner production ID never resolves to a demo unit', () => {
		expect(resolveAdUnitId('gameBanner')).toBe('R-M-20075886-6')
		expect(resolveAdUnitId('gameBanner')).not.toBe(
			DEMO_AD_UNITS.gameBanner,
		)
		expect(resolveDemoAdUnitId('gameBanner')).toBe('demo-banner-yandex')
		expect(GAME_BANNER_RESERVED_HEIGHT).toBe(50)
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
