/**
 * Optional SDK bootstrap — init order, rejection, no duplicate activate,
 * store placements isolation unchanged for rewarded path.
 */

import { __resetAdsServiceForTests, initAds } from '../../ads/adsService'
import {
	GOOGLEPLAY_AD_PLACEMENTS,
	RUSTORE_AD_PLACEMENTS,
	getAdPlacements,
} from '../../ads/placements'
import {
	__resetAnalyticsForTests,
	initAnalytics,
	isAnalyticsActivated,
} from '../../analytics/appMetrica'
import { __setAppStoreForTests } from '../../store/appStore'
import { __setStoreMonetizationForTests } from '../../store/monetization'
import {
	__resetOptionalSdkBootstrapForTests,
	bootstrapOptionalSdks,
} from '../optionalSdkBootstrap'
import {
	applyYandexUserConsent,
	resetSdkConsentBridgeForTests,
} from '../sdkConsentBridge'
import {
	isRuntimeAdsAllowed,
	isRuntimeAnalyticsAllowed,
	__resetRuntimeConsentGateForTests,
} from '../runtimeConsentGate'

jest.mock('yandex-mobile-ads', () => ({
	MobileAds: {
		setUserConsent: jest.fn(),
		setAppAdAnalyticsReporting: jest.fn(),
		initialize: jest.fn(async () => undefined),
	},
}))

jest.mock('@appmetrica/react-native-analytics', () => ({
	__esModule: true,
	default: {
		activate: jest.fn(),
		reportEvent: jest.fn(),
		setDataSendingEnabled: jest.fn(),
	},
}))

/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock access */
const { MobileAds } = require('yandex-mobile-ads') as {
	MobileAds: {
		setUserConsent: jest.Mock
		initialize: jest.Mock
	}
}
/* eslint-enable @typescript-eslint/no-require-imports */

describe('optional SDK bootstrap', () => {
	beforeEach(() => {
		__resetOptionalSdkBootstrapForTests()
		__resetAnalyticsForTests()
		__resetAdsServiceForTests()
		resetSdkConsentBridgeForTests()
		__setAppStoreForTests(null)
		__setStoreMonetizationForTests(null)
		__resetRuntimeConsentGateForTests()
		MobileAds.setUserConsent.mockClear()
		MobileAds.initialize.mockClear()
		// Allow native paths in this suite (override test short-circuit carefully).
		// initAds / initAnalytics still no-op natives when NODE_ENV=test —
		// we assert consent bridge + placement isolation instead.
	})

	afterEach(() => {
		__setAppStoreForTests(null)
		__setStoreMonetizationForTests(null)
	})

	it('applies setUserConsent(true) for RuStore without a dialog gate', async () => {
		__setAppStoreForTests('rustore')
		await bootstrapOptionalSdks({ analytics: null, ads: null })
		expect(MobileAds.setUserConsent).toHaveBeenCalledWith(true)
	})

	it('Google Play (no optional SDKs) never touches Yandex MobileAds', async () => {
		__setAppStoreForTests('googleplay')
		__resetRuntimeConsentGateForTests({ ads: true, analytics: true })
		await bootstrapOptionalSdks({
			analytics: 'granted',
			ads: 'granted',
		})
		expect(MobileAds.setUserConsent).not.toHaveBeenCalled()
		expect(MobileAds.initialize).not.toHaveBeenCalled()
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
		expect(await initAds()).toBe(false)
	})

	it('gated Play-with-SDKs rejection does not call setUserConsent(true)', async () => {
		// Regression for the reserved googleplay_first_party_gate path.
		__setAppStoreForTests('googleplay')
		__setStoreMonetizationForTests(true)
		await bootstrapOptionalSdks({
			analytics: 'denied',
			ads: 'denied',
		})
		expect(MobileAds.setUserConsent).toHaveBeenCalledWith(false)
		expect(MobileAds.setUserConsent).not.toHaveBeenCalledWith(true)
	})

	it('gated Play-with-SDKs grant applies setUserConsent(true)', async () => {
		__setAppStoreForTests('googleplay')
		__setStoreMonetizationForTests(true)
		await bootstrapOptionalSdks({
			analytics: 'granted',
			ads: 'granted',
		})
		expect(MobileAds.setUserConsent).toHaveBeenCalledWith(true)
	})

	it('does not duplicate bootstrap work for the same decisions', async () => {
		__setAppStoreForTests('rustore')
		await bootstrapOptionalSdks({
			analytics: null,
			ads: null,
		})
		MobileAds.setUserConsent.mockClear()
		await bootstrapOptionalSdks({
			analytics: null,
			ads: null,
		})
		expect(MobileAds.setUserConsent).not.toHaveBeenCalled()
	})

	it('applyYandexUserConsent is idempotent on RuStore', () => {
		__setAppStoreForTests('rustore')
		applyYandexUserConsent('granted')
		applyYandexUserConsent('granted')
		expect(MobileAds.setUserConsent).toHaveBeenCalledTimes(1)
		applyYandexUserConsent('denied')
		expect(MobileAds.setUserConsent).toHaveBeenLastCalledWith(false)
	})

	it('keeps store placements isolated (rewarded Undo IDs)', () => {
		__setAppStoreForTests('rustore')
		expect(getAdPlacements().rewardedUndo).toBe(
			RUSTORE_AD_PLACEMENTS.rewardedUndo,
		)
		__setAppStoreForTests('googleplay')
		expect(getAdPlacements().rewardedUndo).toBe(
			GOOGLEPLAY_AD_PLACEMENTS.rewardedUndo,
		)
		expect(getAdPlacements().rewardedUndo).not.toBe(
			RUSTORE_AD_PLACEMENTS.rewardedUndo,
		)
	})

	it('initAds remains single-flight after success when monetization is on', async () => {
		__setAppStoreForTests('rustore')
		__resetAdsServiceForTests({ sdkReady: true })
		const first = await initAds()
		const second = await initAds()
		expect(first).toBe(true)
		expect(second).toBe(true)
	})

	it('analytics activate flag starts false until initAnalytics succeeds outside test sink', async () => {
		// In NODE_ENV=test initAnalytics disables the sink and never activates.
		await initAnalytics()
		expect(isAnalyticsActivated()).toBe(false)
	})
})
