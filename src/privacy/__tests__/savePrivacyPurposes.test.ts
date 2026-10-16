/**
 * Consent save races: delayed AsyncStorage, write failure (fail-closed),
 * and sequential / concurrent decision changes.
 */

/* eslint-disable import/first -- jest.mock factories must precede imports */

const mockStorage = new Map<string, string>()
const mockSetItemState: {
	impl: (key: string, value: string) => Promise<void>
} = {
	impl: async (key, value) => {
		mockStorage.set(key, value)
	},
}

jest.mock('@react-native-async-storage/async-storage', () => ({
	__esModule: true,
	default: {
		getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
		setItem: jest.fn(async (key: string, value: string) =>
			mockSetItemState.impl(key, value),
		),
		removeItem: jest.fn(async (key: string) => {
			mockStorage.delete(key)
		}),
	},
}))

jest.mock('yandex-mobile-ads', () => ({
	MobileAds: {
		setUserConsent: jest.fn(),
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

import {
	__forceAnalyticsActivatedForTests,
	__resetAnalyticsForTests,
	trackEvent,
} from '../../analytics/appMetrica'
import { __setAppStoreForTests } from '../../store/appStore'
import { __setStoreMonetizationForTests } from '../../store/monetization'
import { __resetOptionalSdkBootstrapForTests } from '../optionalSdkBootstrap'
import {
	__resetRuntimeConsentGateForTests,
	isRuntimeAdsAllowed,
	isRuntimeAnalyticsAllowed,
} from '../runtimeConsentGate'
import { resetSdkConsentBridgeForTests } from '../sdkConsentBridge'
import { readPersistedPrivacyConsent } from '../consentPersistence'
import {
	__resetConsentSaveEpochForTests,
	savePrivacyPurposes,
} from '../savePrivacyPurposes'

describe('savePrivacyPurposes races', () => {
	beforeEach(() => {
		mockStorage.clear()
		mockSetItemState.impl = async (key, value) => {
			mockStorage.set(key, value)
		}
		__resetConsentSaveEpochForTests()
		__resetOptionalSdkBootstrapForTests()
		__resetAnalyticsForTests()
		resetSdkConsentBridgeForTests()
		__setAppStoreForTests('googleplay')
		__setStoreMonetizationForTests(true)
		__resetRuntimeConsentGateForTests({
			ads: true,
			analytics: true,
		})
		__forceAnalyticsActivatedForTests()
	})

	afterEach(() => {
		__setAppStoreForTests(null)
		__setStoreMonetizationForTests(null)
		__resetRuntimeConsentGateForTests()
		__resetAnalyticsForTests()
	})

	it('closes gates synchronously before a delayed AsyncStorage write', async () => {
		let releaseWrite!: () => void
		const writeGate = new Promise<void>((resolve) => {
			releaseWrite = resolve
		})
		mockSetItemState.impl = async (key, value) => {
			await writeGate
			mockStorage.set(key, value)
		}

		const savePromise = savePrivacyPurposes({
			analytics: 'denied',
			ads: 'denied',
		})

		// Before AsyncStorage resolves — gates must already be closed.
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
		trackEvent('level_up')
		expect(isRuntimeAnalyticsAllowed()).toBe(false)

		releaseWrite()
		const result = await savePromise
		expect(result.status).toBe('applied')
		expect(isRuntimeAdsAllowed()).toBe(false)
	})

	it('fail-closed on write error does not restore prior grants', async () => {
		mockSetItemState.impl = async () => {
			throw new Error('async_storage_down')
		}

		const result = await savePrivacyPurposes({
			analytics: 'denied',
			ads: 'denied',
		})
		expect(result.status).toBe('failed')
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
	})

	it('does not open grants until persist of the current decision succeeds', async () => {
		__resetRuntimeConsentGateForTests({
			ads: false,
			analytics: false,
		})

		let releaseWrite!: () => void
		const writeGate = new Promise<void>((resolve) => {
			releaseWrite = resolve
		})
		mockSetItemState.impl = async (key, value) => {
			await writeGate
			mockStorage.set(key, value)
		}

		const savePromise = savePrivacyPurposes({
			analytics: 'granted',
			ads: 'granted',
		})

		// Re-grant must not open gates before write completes.
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(isRuntimeAnalyticsAllowed()).toBe(false)

		releaseWrite()
		const result = await savePromise
		expect(result.status).toBe('applied')
		expect(isRuntimeAdsAllowed()).toBe(true)
		expect(isRuntimeAnalyticsAllowed()).toBe(true)
	})

	it('stale delayed write does not reopen gates after a newer revoke', async () => {
		let releaseFirst!: () => void
		const firstGate = new Promise<void>((resolve) => {
			releaseFirst = resolve
		})
		let writeCount = 0
		mockSetItemState.impl = async (key, value) => {
			writeCount += 1
			if (writeCount === 1) {
				await firstGate
			}
			mockStorage.set(key, value)
		}

		const first = savePrivacyPurposes({
			analytics: 'granted',
			ads: 'granted',
		})
		// Start revoke while first grant write is still pending.
		const second = savePrivacyPurposes({
			analytics: 'denied',
			ads: 'denied',
		})

		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(isRuntimeAnalyticsAllowed()).toBe(false)

		releaseFirst()
		const [firstResult, secondResult] = await Promise.all([first, second])

		expect(firstResult.status).toBe('superseded')
		expect(secondResult.status).toBe('applied')
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
		// Final persisted decision (main and/or deny ledger) must be deny.
		const loaded = await readPersistedPrivacyConsent()
		expect(loaded.ads).toBe('denied')
		expect(loaded.analytics).toBe('denied')
	})

	it('keeps analytics and ads independent across sequential saves', async () => {
		await savePrivacyPurposes({
			analytics: 'granted',
			ads: 'denied',
		})
		expect(isRuntimeAnalyticsAllowed()).toBe(true)
		expect(isRuntimeAdsAllowed()).toBe(false)

		await savePrivacyPurposes({
			analytics: 'denied',
			ads: 'granted',
		})
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
		expect(isRuntimeAdsAllowed()).toBe(true)
	})
})
