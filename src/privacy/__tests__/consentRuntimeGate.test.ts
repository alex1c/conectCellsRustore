/**
 * Regression: ads + analytics consent gates inside services.
 * Covers deny-before-init, independent purposes, revoke mid-load,
 * no new ad requests after revoke, re-grant, persistence restore,
 * and privacy policy EN/RU link openers.
 */

import { Linking } from 'react-native'

import {
	__resetAdsServiceForTests,
	canServeAds,
	initAds,
	preloadRewardedUndo,
	showInterstitial,
	showRewardedUndo,
	syncAdsConsent,
} from '../../ads/adsService'
import {
	__forceAnalyticsActivatedForTests,
	__resetAnalyticsForTests,
	applyAnalyticsSendingEnabled,
	initAnalytics,
	isAnalyticsActivated,
	trackEvent,
} from '../../analytics/appMetrica'
import { openExternalUrl } from '../../ui/links/openExternalUrl'
import { __setAppStoreForTests } from '../../store/appStore'
import {
	__resetOptionalSdkBootstrapForTests,
	bootstrapOptionalSdks,
} from '../optionalSdkBootstrap'
import {
	PRIVACY_POLICY_URL,
	PRIVACY_POLICY_URL_RU,
	resolvePrivacyPolicyUrl,
} from '../privacyUrls'
import {
	__resetRuntimeConsentGateForTests,
	getAdsConsentGeneration,
	isRuntimeAdsAllowed,
	isRuntimeAnalyticsAllowed,
	setRuntimeAdsAllowed,
	setRuntimeAnalyticsAllowed,
} from '../runtimeConsentGate'
import { resetSdkConsentBridgeForTests } from '../sdkConsentBridge'

jest.mock('yandex-mobile-ads', () => ({
	MobileAds: {
		setUserConsent: jest.fn(),
		setAppAdAnalyticsReporting: jest.fn(),
		initialize: jest.fn(async () => undefined),
	},
	InterstitialAdLoader: {
		create: jest.fn(),
	},
	RewardedAdLoader: {
		create: jest.fn(),
	},
}))

const mockReportEvent = jest.fn()
const mockSetDataSendingEnabled = jest.fn()
const mockActivate = jest.fn()

jest.mock('@appmetrica/react-native-analytics', () => ({
	__esModule: true,
	default: {
		activate: (...args: unknown[]) => mockActivate(...args),
		reportEvent: (...args: unknown[]) => mockReportEvent(...args),
		setDataSendingEnabled: (...args: unknown[]) =>
			mockSetDataSendingEnabled(...args),
	},
}))

/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock access */
const { MobileAds, InterstitialAdLoader, RewardedAdLoader } =
	require('yandex-mobile-ads') as {
		MobileAds: {
			setUserConsent: jest.Mock
			setAppAdAnalyticsReporting: jest.Mock
			initialize: jest.Mock
		}
		InterstitialAdLoader: { create: jest.Mock }
		RewardedAdLoader: { create: jest.Mock }
	}
/* eslint-enable @typescript-eslint/no-require-imports */

function makeRewardedAd (): any {
	const ad: any = {
		show: jest.fn(async () => undefined),
	}
	Object.defineProperty(ad, 'onRewarded', { set () {} })
	Object.defineProperty(ad, 'onAdImpression', { set () {} })
	Object.defineProperty(ad, 'onAdDismissed', { set () {} })
	Object.defineProperty(ad, 'onAdFailedToShow', { set () {} })
	return ad
}

describe('consent runtime gates', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		__resetOptionalSdkBootstrapForTests()
		__resetAnalyticsForTests()
		__resetAdsServiceForTests()
		resetSdkConsentBridgeForTests()
		__setAppStoreForTests('googleplay')
		__resetRuntimeConsentGateForTests({
			ads: false,
			analytics: false,
		})
		MobileAds.initialize.mockImplementation(async () => undefined)
		InterstitialAdLoader.create.mockResolvedValue({
			loadAd: jest.fn(async () => ({
				show: jest.fn(),
				onAdDismissed: null,
				onAdFailedToShow: null,
			})),
		})
		RewardedAdLoader.create.mockResolvedValue({
			loadAd: jest.fn(async () => makeRewardedAd()),
		})
	})

	afterEach(() => {
		__setAppStoreForTests(null)
		__resetRuntimeConsentGateForTests()
	})

	it('Google Play deny before first SDK run blocks ads init and analytics activate', async () => {
		await bootstrapOptionalSdks({
			analytics: 'denied',
			ads: 'denied',
		})
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
		expect(await initAds()).toBe(false)
		expect(MobileAds.initialize).not.toHaveBeenCalled()
		await initAnalytics()
		expect(isAnalyticsActivated()).toBe(false)
		expect(mockActivate).not.toHaveBeenCalled()
		trackEvent('app_open')
		expect(mockReportEvent).not.toHaveBeenCalled()
	})

	it('allows independent analytics vs ads decisions', async () => {
		await bootstrapOptionalSdks({
			analytics: 'granted',
			ads: 'denied',
		})
		expect(isRuntimeAnalyticsAllowed()).toBe(true)
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(await initAds()).toBe(false)

		__resetOptionalSdkBootstrapForTests()
		await bootstrapOptionalSdks({
			analytics: 'denied',
			ads: 'granted',
		})
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
		expect(isRuntimeAdsAllowed()).toBe(true)
		trackEvent('merge')
		expect(mockReportEvent).not.toHaveBeenCalled()
	})

	it('stops trackEvent immediately after analytics revoke', () => {
		__forceAnalyticsActivatedForTests()
		setRuntimeAnalyticsAllowed(true)
		trackEvent('level_up')
		expect(mockReportEvent).toHaveBeenCalledWith('level_up')
		mockReportEvent.mockClear()

		setRuntimeAnalyticsAllowed(false)
		applyAnalyticsSendingEnabled(false)
		trackEvent('level_up')
		expect(mockReportEvent).not.toHaveBeenCalled()
		expect(mockSetDataSendingEnabled).toHaveBeenCalledWith(false)

		// Deny-before-activate path: init must no-op while gate is false.
		__resetAnalyticsForTests()
		void initAnalytics()
		expect(mockActivate).not.toHaveBeenCalled()
	})

	it('revokes ads mid-load and discards the result (no preload / no show)', async () => {
		setRuntimeAdsAllowed(true)
		__resetAdsServiceForTests({ sdkReady: true })
		const generationBefore = getAdsConsentGeneration()

		let resolveLoad: (ad: any) => void = () => undefined
		const loadPromise = new Promise<any>((resolve) => {
			resolveLoad = resolve
		})
		RewardedAdLoader.create.mockResolvedValue({
			loadAd: jest.fn(() => loadPromise),
		})

		const preloadDone = preloadRewardedUndo('game')
		// Let ensureRewardedLoaded start loadAd before revoke.
		await Promise.resolve()
		await Promise.resolve()
		expect(RewardedAdLoader.create).toHaveBeenCalledTimes(1)

		setRuntimeAdsAllowed(false)
		syncAdsConsent(false)
		expect(getAdsConsentGeneration()).toBeGreaterThan(generationBefore)

		resolveLoad(makeRewardedAd())
		await preloadDone

		const result = await showRewardedUndo({ source: 'game' })
		expect(result.status).toBe('unavailable')
		// No second load after revoke.
		expect(RewardedAdLoader.create).toHaveBeenCalledTimes(1)
	})

	it('blocks interstitial show after ads revoke', async () => {
		setRuntimeAdsAllowed(true)
		__resetAdsServiceForTests({ sdkReady: true })
		setRuntimeAdsAllowed(false)
		syncAdsConsent(false)
		const result = await showInterstitial('gameOverInterstitial')
		expect(result).toBe('unavailable')
		expect(InterstitialAdLoader.create).not.toHaveBeenCalled()
	})

	it('does not start new rewarded loads after revoke', async () => {
		setRuntimeAdsAllowed(false)
		syncAdsConsent(false)
		__resetAdsServiceForTests({ sdkReady: true })
		await preloadRewardedUndo('game')
		expect(RewardedAdLoader.create).not.toHaveBeenCalled()
		expect(canServeAds()).toBe(false)
	})

	it('re-grant after revoke allows ads again', async () => {
		await bootstrapOptionalSdks({
			analytics: 'denied',
			ads: 'denied',
		})
		expect(isRuntimeAdsAllowed()).toBe(false)

		__resetOptionalSdkBootstrapForTests()
		await bootstrapOptionalSdks({
			analytics: 'denied',
			ads: 'granted',
		})
		expect(isRuntimeAdsAllowed()).toBe(true)
		expect(MobileAds.setUserConsent).toHaveBeenCalledWith(true)
	})

	it('restores decisions after simulated restart via bootstrap', async () => {
		await bootstrapOptionalSdks({
			analytics: 'granted',
			ads: 'granted',
		})
		expect(isRuntimeAdsAllowed()).toBe(true)
		expect(isRuntimeAnalyticsAllowed()).toBe(true)

		// Process restart simulation — clear bootstrap + gates, re-apply saved.
		__resetOptionalSdkBootstrapForTests()
		__resetRuntimeConsentGateForTests({ ads: false, analytics: false })
		expect(isRuntimeAdsAllowed()).toBe(false)

		await bootstrapOptionalSdks({
			analytics: 'granted',
			ads: 'granted',
		})
		expect(isRuntimeAdsAllowed()).toBe(true)
		expect(isRuntimeAnalyticsAllowed()).toBe(true)
	})

	it('RuStore defaults allow optional SDKs without explicit decisions', async () => {
		__setAppStoreForTests('rustore')
		__resetRuntimeConsentGateForTests()
		expect(isRuntimeAdsAllowed()).toBe(true)
		expect(isRuntimeAnalyticsAllowed()).toBe(true)
		await bootstrapOptionalSdks({ analytics: null, ads: null })
		expect(MobileAds.setUserConsent).toHaveBeenCalledWith(true)
	})

	it('opens EN and RU privacy policy URLs via openExternalUrl', async () => {
		const openSpy = jest
			.spyOn(Linking, 'openURL')
			.mockResolvedValue(undefined as never)

		expect(resolvePrivacyPolicyUrl('en')).toBe(PRIVACY_POLICY_URL)
		expect(resolvePrivacyPolicyUrl('ru')).toBe(PRIVACY_POLICY_URL_RU)

		await openExternalUrl(resolvePrivacyPolicyUrl('en'))
		await openExternalUrl(resolvePrivacyPolicyUrl('ru'))

		expect(openSpy).toHaveBeenCalledWith(PRIVACY_POLICY_URL)
		expect(openSpy).toHaveBeenCalledWith(PRIVACY_POLICY_URL_RU)

		openSpy.mockRejectedValueOnce(new Error('no browser'))
		await expect(
			openExternalUrl(PRIVACY_POLICY_URL),
		).resolves.toBeUndefined()
	})
})
