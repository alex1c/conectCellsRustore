/**
 * Ads-only consent must not enable optional app analytics reporting/sending.
 *
 * Sequences covered (Google Play):
 * - denied/denied → denied/granted (Ads-only grant)
 * - granted/denied → denied/denied
 * - denied/granted → denied/denied (revoke ads)
 * - denied/granted → granted/granted (upgrade analytics)
 * - cold start with saved Ads-only
 * - revoke Analytics after previously granted Analytics
 *
 * Distinguishes:
 * - SDK activation (our initAnalytics / Ads LibraryAdapter — latter is native)
 * - event collection (trackEvent / ad reporting flag)
 * - data sending permission (setDataSendingEnabled)
 * Network delivery is out of scope for Jest (not asserted).
 */

import {
	__resetAdsServiceForTests,
	initAds,
} from '../../ads/adsService'
import {
	__forceAnalyticsActivatedForTests,
	__resetAnalyticsForTests,
	applyAnalyticsSendingEnabled,
	initAnalytics,
	isAnalyticsActivated,
	trackEvent,
} from '../../analytics/appMetrica'
import { __setAppStoreForTests } from '../../store/appStore'
import { __setStoreMonetizationForTests } from '../../store/monetization'
import { applyConsentGatesSync } from '../applyConsentGates'
import {
	__resetOptionalSdkBootstrapForTests,
	bootstrapOptionalSdks,
} from '../optionalSdkBootstrap'
import {
	__resetRuntimeConsentGateForTests,
	isRuntimeAdsAllowed,
	isRuntimeAnalyticsAllowed,
} from '../runtimeConsentGate'
import { resetSdkConsentBridgeForTests } from '../sdkConsentBridge'

jest.mock('yandex-mobile-ads', () => ({
	MobileAds: {
		setUserConsent: jest.fn(),
		setAppAdAnalyticsReporting: jest.fn(),
		initialize: jest.fn(async () => undefined),
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
const { MobileAds } = require('yandex-mobile-ads') as {
	MobileAds: {
		setUserConsent: jest.Mock
		setAppAdAnalyticsReporting: jest.Mock
		initialize: jest.Mock
	}
}
/* eslint-enable @typescript-eslint/no-require-imports */

function resetAll (): void {
	jest.clearAllMocks()
	__resetOptionalSdkBootstrapForTests()
	__resetAnalyticsForTests()
	__resetAdsServiceForTests()
	resetSdkConsentBridgeForTests()
	__setAppStoreForTests('googleplay')
	// Historical Ads-only gate regressions (Play closed testing ships without SDKs).
	__setStoreMonetizationForTests(true)
	__resetRuntimeConsentGateForTests({
		ads: false,
		analytics: false,
	})
}

describe('Ads-only AppMetrica privacy gates', () => {
	beforeEach(() => {
		resetAll()
	})

	afterEach(() => {
		__setAppStoreForTests(null)
		__setStoreMonetizationForTests(null)
		__resetRuntimeConsentGateForTests()
	})

	it('denied/denied → denied/granted: reporting off, no our activate, sending suppressed', async () => {
		await bootstrapOptionalSdks({
			analytics: 'denied',
			ads: 'denied',
		})
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(MobileAds.setAppAdAnalyticsReporting).toHaveBeenCalledWith(false)

		__resetOptionalSdkBootstrapForTests()
		__resetAdsServiceForTests()
		MobileAds.setAppAdAnalyticsReporting.mockClear()
		mockSetDataSendingEnabled.mockClear()

		await bootstrapOptionalSdks({
			analytics: 'denied',
			ads: 'granted',
		})
		expect(isRuntimeAdsAllowed()).toBe(true)
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
		expect(MobileAds.setAppAdAnalyticsReporting).toHaveBeenCalledWith(false)
		// initAds runs in test env after reporting sync, then short-circuits.
		expect(await initAds()).toBe(false)
		await initAnalytics()
		expect(isAnalyticsActivated()).toBe(false)
		expect(mockActivate).not.toHaveBeenCalled()
		trackEvent('merge')
		expect(mockReportEvent).not.toHaveBeenCalled()
		// Deny path must call native setDataSendingEnabled even without our activate.
		expect(mockSetDataSendingEnabled).toHaveBeenCalledWith(false)
	})

	it('cold start with saved Ads-only: ad reporting false before any analytics activate', async () => {
		await bootstrapOptionalSdks({
			analytics: 'denied',
			ads: 'granted',
		})
		const reportingCalls = MobileAds.setAppAdAnalyticsReporting.mock.calls
		expect(reportingCalls.some((c) => c[0] === false)).toBe(true)
		expect(mockActivate).not.toHaveBeenCalled()
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
		expect(isRuntimeAdsAllowed()).toBe(true)
	})

	it('granted/denied → denied/denied: analytics revoke stops sending + ad reporting', async () => {
		await bootstrapOptionalSdks({
			analytics: 'granted',
			ads: 'denied',
		})
		expect(isRuntimeAnalyticsAllowed()).toBe(true)
		expect(MobileAds.setAppAdAnalyticsReporting).toHaveBeenCalledWith(true)

		__forceAnalyticsActivatedForTests()
		mockSetDataSendingEnabled.mockClear()
		MobileAds.setAppAdAnalyticsReporting.mockClear()

		applyConsentGatesSync({
			analytics: 'denied',
			ads: 'denied',
			openGrants: true,
		})
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(mockSetDataSendingEnabled).toHaveBeenCalledWith(false)
		expect(MobileAds.setAppAdAnalyticsReporting).toHaveBeenCalledWith(false)
		trackEvent('level_up')
		expect(mockReportEvent).not.toHaveBeenCalled()
	})

	it('denied/granted → denied/denied: ads revoke keeps analytics reporting off', async () => {
		await bootstrapOptionalSdks({
			analytics: 'denied',
			ads: 'granted',
		})
		MobileAds.setAppAdAnalyticsReporting.mockClear()

		__resetOptionalSdkBootstrapForTests()
		await bootstrapOptionalSdks({
			analytics: 'denied',
			ads: 'denied',
		})
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(MobileAds.setAppAdAnalyticsReporting).toHaveBeenCalledWith(false)
		expect(mockActivate).not.toHaveBeenCalled()
	})

	it('denied/granted → granted/granted: upgrades ad reporting + allows analytics path', async () => {
		await bootstrapOptionalSdks({
			analytics: 'denied',
			ads: 'granted',
		})
		expect(MobileAds.setAppAdAnalyticsReporting).toHaveBeenCalledWith(false)

		__resetOptionalSdkBootstrapForTests()
		MobileAds.setAppAdAnalyticsReporting.mockClear()

		await bootstrapOptionalSdks({
			analytics: 'granted',
			ads: 'granted',
		})
		expect(isRuntimeAnalyticsAllowed()).toBe(true)
		expect(isRuntimeAdsAllowed()).toBe(true)
		expect(MobileAds.setAppAdAnalyticsReporting).toHaveBeenCalledWith(true)
	})

	it('revoke Analytics after previously allowed: sending + ad reporting off, ads may stay', async () => {
		await bootstrapOptionalSdks({
			analytics: 'granted',
			ads: 'granted',
		})
		__forceAnalyticsActivatedForTests()
		mockSetDataSendingEnabled.mockClear()
		MobileAds.setAppAdAnalyticsReporting.mockClear()

		applyConsentGatesSync({
			analytics: 'denied',
			ads: 'granted',
			openGrants: true,
		})
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
		expect(isRuntimeAdsAllowed()).toBe(true)
		expect(mockSetDataSendingEnabled).toHaveBeenCalledWith(false)
		expect(MobileAds.setAppAdAnalyticsReporting).toHaveBeenCalledWith(false)
		trackEvent('game_over')
		expect(mockReportEvent).not.toHaveBeenCalled()
	})

	it('applyAnalyticsSendingEnabled(false) works without our JS activate', () => {
		// activated=false, testAllowReporting=false — disable must still call native.
		__resetAnalyticsForTests()
		expect(isAnalyticsActivated()).toBe(false)
		mockSetDataSendingEnabled.mockClear()
		applyAnalyticsSendingEnabled(false)
		expect(mockSetDataSendingEnabled).toHaveBeenCalledWith(false)
	})
})
