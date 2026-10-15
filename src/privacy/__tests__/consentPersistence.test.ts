/**
 * Consent persistence — save, reload, corrupt / failed storage.
 */

/* eslint-disable import/first -- jest.mock factories must precede imports */

const mockStorage = new Map<string, string>()

jest.mock('@react-native-async-storage/async-storage', () => ({
	__esModule: true,
	default: {
		getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
		setItem: jest.fn(async (key: string, value: string) => {
			mockStorage.set(key, value)
		}),
		removeItem: jest.fn(async (key: string) => {
			mockStorage.delete(key)
		}),
		clear: jest.fn(async () => {
			mockStorage.clear()
		}),
	},
}))

import AsyncStorage from '@react-native-async-storage/async-storage'

import {
	clearPersistedPrivacyConsentForTests,
	mergeConsentWithDenyLedger,
	readPersistedPrivacyConsent,
	STORAGE_KEY_PRIVACY_CONSENT,
	STORAGE_KEY_PRIVACY_DENY_LEDGER,
	writePersistedPrivacyConsent,
} from '../consentPersistence'

describe('consentPersistence', () => {
	beforeEach(async () => {
		mockStorage.clear()
		await clearPersistedPrivacyConsentForTests()
		jest.restoreAllMocks()
		// Re-bind mock implementations after restoreAllMocks.
		;(AsyncStorage.getItem as jest.Mock).mockImplementation(
			async (key: string) => mockStorage.get(key) ?? null,
		)
		;(AsyncStorage.setItem as jest.Mock).mockImplementation(
			async (key: string, value: string) => {
				mockStorage.set(key, value)
			},
		)
		;(AsyncStorage.removeItem as jest.Mock).mockImplementation(
			async (key: string) => {
				mockStorage.delete(key)
			},
		)
	})

	it('persists and reloads both purposes (app restart)', async () => {
		await writePersistedPrivacyConsent({
			analytics: 'granted',
			ads: 'denied',
		})
		const loaded = await readPersistedPrivacyConsent()
		expect(loaded.analytics).toBe('granted')
		expect(loaded.ads).toBe('denied')
		expect(loaded.storageStatus).toBe('ok')
		expect(loaded.updatedAtIso).toBeTruthy()
	})

	it('treats missing key as undecided', async () => {
		const loaded = await readPersistedPrivacyConsent()
		expect(loaded.analytics).toBeNull()
		expect(loaded.ads).toBeNull()
		expect(loaded.storageStatus).toBe('ok')
	})

	it('marks corrupt payloads', async () => {
		mockStorage.set(STORAGE_KEY_PRIVACY_CONSENT, '{not-json')
		const loaded = await readPersistedPrivacyConsent()
		expect(loaded.storageStatus).toBe('corrupt')
		expect(loaded.analytics).toBeNull()
	})

	it('marks untrusted when storage read throws', async () => {
		;(AsyncStorage.getItem as jest.Mock).mockRejectedValue(
			new Error('disk'),
		)
		const loaded = await readPersistedPrivacyConsent()
		expect(loaded.storageStatus).toBe('untrusted')
	})

	it('propagates write failures (no silent success)', async () => {
		;(AsyncStorage.setItem as jest.Mock).mockRejectedValue(
			new Error('full'),
		)
		await expect(
			writePersistedPrivacyConsent({
				analytics: 'granted',
				ads: 'granted',
			}),
		).rejects.toThrow()
	})

	it('mergeConsentWithDenyLedger forces deny over stale grant', () => {
		const merged = mergeConsentWithDenyLedger(
			{
				analytics: 'granted',
				ads: 'granted',
				updatedAtIso: '2020-01-01T00:00:00.000Z',
				storageStatus: 'ok',
			},
			{
				analytics: 'denied',
				ads: 'denied',
				updatedAtIso: '2020-01-02T00:00:00.000Z',
			},
		)
		expect(merged.analytics).toBe('denied')
		expect(merged.ads).toBe('denied')
	})

	it('deny ledger overrides stale main granted on read', async () => {
		mockStorage.set(
			STORAGE_KEY_PRIVACY_CONSENT,
			JSON.stringify({
				analytics: 'granted',
				ads: 'granted',
				updatedAtIso: '2020-01-01T00:00:00.000Z',
			}),
		)
		mockStorage.set(
			STORAGE_KEY_PRIVACY_DENY_LEDGER,
			JSON.stringify({
				ads: 'denied',
				updatedAtIso: '2020-01-02T00:00:00.000Z',
			}),
		)
		const loaded = await readPersistedPrivacyConsent()
		expect(loaded.ads).toBe('denied')
		expect(loaded.analytics).toBe('granted')
	})
})
