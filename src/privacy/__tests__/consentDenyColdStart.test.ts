/**
 * Fail-closed deny persistence: ledger / wipe so cold start cannot revive
 * a stale AsyncStorage "granted" after a failed revoke write.
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
const mockRemoveItemState: {
	impl: (key: string) => Promise<void>
} = {
	impl: async (key) => {
		mockStorage.delete(key)
	},
}

jest.mock('@react-native-async-storage/async-storage', () => ({
	__esModule: true,
	default: {
		getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
		setItem: jest.fn(async (key: string, value: string) =>
			mockSetItemState.impl(key, value),
		),
		removeItem: jest.fn(async (key: string) =>
			mockRemoveItemState.impl(key),
		),
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

import { __resetAnalyticsForTests } from '../../analytics/appMetrica'
import { __setAppStoreForTests } from '../../store/appStore'
import { __setStoreMonetizationForTests } from '../../store/monetization'
import {
	clearPersistedPrivacyConsentForTests,
	readPersistedPrivacyConsent,
	STORAGE_KEY_PRIVACY_CONSENT,
	STORAGE_KEY_PRIVACY_DENY_LEDGER,
	writePersistedPrivacyConsent,
} from '../consentPersistence'
import { __resetOptionalSdkBootstrapForTests, bootstrapOptionalSdks } from '../optionalSdkBootstrap'
import {
	__resetRuntimeConsentGateForTests,
	isRuntimeAdsAllowed,
	isRuntimeAnalyticsAllowed,
} from '../runtimeConsentGate'
import { resetSdkConsentBridgeForTests } from '../sdkConsentBridge'
import {
	__resetConsentSaveEpochForTests,
	savePrivacyPurposes,
} from '../savePrivacyPurposes'

/** Simulate process restart: reset in-memory gates, re-read storage, bootstrap. */
async function coldStartBootstrap (): Promise<void> {
	__resetOptionalSdkBootstrapForTests()
	__resetRuntimeConsentGateForTests({ ads: false, analytics: false })
	const persisted = await readPersistedPrivacyConsent()
	await bootstrapOptionalSdks({
		analytics: persisted.analytics,
		ads: persisted.ads,
	})
}

describe('consent deny cold start fail-closed', () => {
	beforeEach(async () => {
		mockStorage.clear()
		mockSetItemState.impl = async (key, value) => {
			mockStorage.set(key, value)
		}
		mockRemoveItemState.impl = async (key) => {
			mockStorage.delete(key)
		}
		__resetConsentSaveEpochForTests()
		__resetOptionalSdkBootstrapForTests()
		__resetAnalyticsForTests()
		resetSdkConsentBridgeForTests()
		__setAppStoreForTests('googleplay')
		__setStoreMonetizationForTests(true)
		__resetRuntimeConsentGateForTests({ ads: false, analytics: false })
		await clearPersistedPrivacyConsentForTests()
	})

	afterEach(() => {
		__setAppStoreForTests(null)
		__setStoreMonetizationForTests(null)
		__resetRuntimeConsentGateForTests()
	})

	it('deny ledger overrides stale main granted on cold start (ads + analytics)', async () => {
		await writePersistedPrivacyConsent({
			analytics: 'granted',
			ads: 'granted',
		})

		// Main blob write fails; deny ledger still lands.
		mockSetItemState.impl = async (key, value) => {
			if (key === STORAGE_KEY_PRIVACY_CONSENT) {
				throw new Error('main_blob_full')
			}
			mockStorage.set(key, value)
		}

		const result = await savePrivacyPurposes({
			analytics: 'denied',
			ads: 'denied',
		})
		expect(result.status).toBe('failed')
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
		expect(mockStorage.has(STORAGE_KEY_PRIVACY_DENY_LEDGER)).toBe(true)
		// Stale main grant wiped after failed main write.
		expect(mockStorage.has(STORAGE_KEY_PRIVACY_CONSENT)).toBe(false)

		await coldStartBootstrap()
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(isRuntimeAnalyticsAllowed()).toBe(false)

		const loaded = await readPersistedPrivacyConsent()
		expect(loaded.analytics).toBe('denied')
		expect(loaded.ads).toBe('denied')
	})

	it('independent ads deny survives main-write failure without reviving ads', async () => {
		await writePersistedPrivacyConsent({
			analytics: 'granted',
			ads: 'granted',
		})
		mockSetItemState.impl = async (key, value) => {
			if (key === STORAGE_KEY_PRIVACY_CONSENT) {
				throw new Error('main_blob_full')
			}
			mockStorage.set(key, value)
		}

		await savePrivacyPurposes({
			analytics: 'granted',
			ads: 'denied',
		})

		await coldStartBootstrap()
		expect(isRuntimeAdsAllowed()).toBe(false)
		// Analytics was granted in the attempted save; main wipe removed the
		// blob, ledger only records ads deny → analytics undecided/null path
		// must not enable ads. Analytics may be null → Play gate keeps it off.
		expect(isRuntimeAdsAllowed()).toBe(false)
		const loaded = await readPersistedPrivacyConsent()
		expect(loaded.ads).toBe('denied')
	})

	it('independent analytics deny survives main-write failure', async () => {
		await writePersistedPrivacyConsent({
			analytics: 'granted',
			ads: 'granted',
		})
		mockSetItemState.impl = async (key, value) => {
			if (key === STORAGE_KEY_PRIVACY_CONSENT) {
				throw new Error('main_blob_full')
			}
			mockStorage.set(key, value)
		}

		await savePrivacyPurposes({
			analytics: 'denied',
			ads: 'granted',
		})

		await coldStartBootstrap()
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
		const loaded = await readPersistedPrivacyConsent()
		expect(loaded.analytics).toBe('denied')
	})

	it('when ledger write also fails, wiping main prevents cold-start auto-grant', async () => {
		await writePersistedPrivacyConsent({
			analytics: 'granted',
			ads: 'granted',
		})
		expect(mockStorage.has(STORAGE_KEY_PRIVACY_CONSENT)).toBe(true)

		mockSetItemState.impl = async () => {
			throw new Error('async_storage_down')
		}

		const result = await savePrivacyPurposes({
			analytics: 'denied',
			ads: 'denied',
		})
		expect(result.status).toBe('failed')
		expect(mockStorage.has(STORAGE_KEY_PRIVACY_CONSENT)).toBe(false)

		await coldStartBootstrap()
		// Undecided after wipe → Google Play must not enable optional SDKs.
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
	})

	it('repeated deny after failed persist eventually applies when storage recovers', async () => {
		await writePersistedPrivacyConsent({
			analytics: 'granted',
			ads: 'granted',
		})
		mockSetItemState.impl = async (key, value) => {
			if (key === STORAGE_KEY_PRIVACY_CONSENT) {
				throw new Error('main_blob_full')
			}
			mockStorage.set(key, value)
		}
		await savePrivacyPurposes({
			analytics: 'denied',
			ads: 'denied',
		})

		// Storage recovers — retry deny writes full state.
		mockSetItemState.impl = async (key, value) => {
			mockStorage.set(key, value)
		}
		const retry = await savePrivacyPurposes({
			analytics: 'denied',
			ads: 'denied',
		})
		expect(retry.status).toBe('applied')

		await coldStartBootstrap()
		expect(isRuntimeAdsAllowed()).toBe(false)
		expect(isRuntimeAnalyticsAllowed()).toBe(false)
	})

	it('re-grant after storage recovery opens gates only after successful persist', async () => {
		await writePersistedPrivacyConsent({
			analytics: 'denied',
			ads: 'denied',
		})
		__resetRuntimeConsentGateForTests({ ads: false, analytics: false })

		const granted = await savePrivacyPurposes({
			analytics: 'granted',
			ads: 'granted',
		})
		expect(granted.status).toBe('applied')
		expect(isRuntimeAdsAllowed()).toBe(true)
		expect(isRuntimeAnalyticsAllowed()).toBe(true)
		expect(mockStorage.has(STORAGE_KEY_PRIVACY_DENY_LEDGER)).toBe(false)

		await coldStartBootstrap()
		expect(isRuntimeAdsAllowed()).toBe(true)
		expect(isRuntimeAnalyticsAllowed()).toBe(true)
	})

	it('RuStore cold start still allows optional SDKs without a consent blob', async () => {
		__setAppStoreForTests('rustore')
		__resetRuntimeConsentGateForTests()
		await clearPersistedPrivacyConsentForTests()
		await coldStartBootstrap()
		expect(isRuntimeAdsAllowed()).toBe(true)
		expect(isRuntimeAnalyticsAllowed()).toBe(true)
	})
})
