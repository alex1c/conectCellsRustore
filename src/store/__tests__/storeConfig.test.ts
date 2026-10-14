/**
 * Store-specific links — RuStore preserved, Google Play pending URLs safe.
 */

import { Linking } from 'react-native'

import { FOREST_MUSIC_RUSTORE_URL } from '../../ui/links/forestMusicRuStore'
import { __setAppStoreForTests } from '../appStore'
import {
	getStoreConfig,
	GOOGLE_PLAY_DEVELOPER_URL,
	GOOGLE_PLAY_LISTING_URL,
	GOOGLE_PLAY_RATE_URL,
	openOtherApps,
	openRateApp,
	openStoreListing,
} from '../storeConfig'

describe('storeConfig links', () => {
	afterEach(() => {
		__setAppStoreForTests(null)
		jest.restoreAllMocks()
		// RN Linking.openURL is a shared Jest mock — clear call history.
		jest.clearAllMocks()
	})

	it('preserves RuStore other-apps catalog URL', () => {
		__setAppStoreForTests('rustore')
		const cfg = getStoreConfig()
		expect(cfg.id).toBe('rustore')
		expect(cfg.otherAppsAvailable).toBe(true)
		expect(cfg.otherAppsUrl).toBe(FOREST_MUSIC_RUSTORE_URL)
		expect(cfg.contactEmail).toBe('rustore-alex1c@yandex.ru')
	})

	it('opens RuStore catalog via openOtherApps', async () => {
		__setAppStoreForTests('rustore')
		const openSpy = jest
			.spyOn(Linking, 'openURL')
			.mockResolvedValue(undefined as never)

		await openOtherApps()

		expect(openSpy).toHaveBeenCalledWith(FOREST_MUSIC_RUSTORE_URL)
	})

	it('hides Google Play other-apps when developer URL is pending', () => {
		__setAppStoreForTests('googleplay')
		const cfg = getStoreConfig()
		expect(cfg.id).toBe('googleplay')
		expect(GOOGLE_PLAY_DEVELOPER_URL).toBeNull()
		expect(GOOGLE_PLAY_LISTING_URL).toBeNull()
		expect(GOOGLE_PLAY_RATE_URL).toBeNull()
		expect(cfg.otherAppsUrl).toBeNull()
		expect(cfg.otherAppsAvailable).toBe(false)
		expect(cfg.listingUrl).toBeNull()
		expect(cfg.rateUrl).toBeNull()
	})

	it('openOtherApps / listing / rate are no-ops when Play URLs missing', async () => {
		__setAppStoreForTests('googleplay')
		expect(getStoreConfig().otherAppsUrl).toBeNull()
		expect(getStoreConfig().listingUrl).toBeNull()
		expect(getStoreConfig().rateUrl).toBeNull()
		const openSpy = jest
			.spyOn(Linking, 'openURL')
			.mockResolvedValue(undefined as never)
		openSpy.mockClear()

		await openOtherApps()
		await openStoreListing()
		await openRateApp()

		expect(openSpy).not.toHaveBeenCalled()
	})

	it('keeps support email and site shared across stores', () => {
		__setAppStoreForTests('googleplay')
		const play = getStoreConfig()
		__setAppStoreForTests('rustore')
		const rustore = getStoreConfig()
		expect(play.contactEmail).toBe(rustore.contactEmail)
		expect(play.siteUrl).toBe(rustore.siteUrl)
		expect(play.siteLabel).toBe(rustore.siteLabel)
	})
})
