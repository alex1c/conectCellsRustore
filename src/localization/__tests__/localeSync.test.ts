/**
 * Device locale refresh on AppState → active (Android Settings language change).
 */

import type { AppStateStatus, NativeEventSubscription } from 'react-native'

import {
	__resetI18nForTests,
	getCurrentLocale,
	initI18n,
} from '../i18n'
import {
	subscribeDeviceLocaleRefresh,
	syncLocaleFromDevice,
	type LocaleAppStateLike,
} from '../localeSync'

const mockGetLocales = jest.fn(() => [{ languageCode: 'en', languageTag: 'en-US' }])

jest.mock('expo-localization', () => ({
	getLocales: () => mockGetLocales(),
}))

describe('syncLocaleFromDevice', () => {
	beforeEach(() => {
		__resetI18nForTests()
		mockGetLocales.mockReset()
		mockGetLocales.mockReturnValue([
			{ languageCode: 'en', languageTag: 'en-US' },
		])
		initI18n({ locale: 'en', forceLocale: true })
	})

	it('changes language when the device locale differs', () => {
		mockGetLocales.mockReturnValue([
			{ languageCode: 'ru', languageTag: 'ru-RU' },
		])
		expect(syncLocaleFromDevice()).toBe('ru')
		expect(getCurrentLocale()).toBe('ru')
	})

	it('no-ops when device locale already matches', () => {
		mockGetLocales.mockReturnValue([
			{ languageCode: 'en', languageTag: 'en-GB' },
		])
		expect(syncLocaleFromDevice()).toBe('en')
		expect(getCurrentLocale()).toBe('en')
	})

	it('falls back to English for unsupported device languages', () => {
		initI18n({ locale: 'de', forceLocale: true })
		mockGetLocales.mockReturnValue([
			{ languageCode: 'fr', languageTag: 'fr-FR' },
		])
		expect(syncLocaleFromDevice()).toBe('en')
		expect(getCurrentLocale()).toBe('en')
	})

	it('maps regional tags (es-MX → es)', () => {
		mockGetLocales.mockReturnValue([
			{ languageCode: 'es', languageTag: 'es-MX' },
		])
		expect(syncLocaleFromDevice()).toBe('es')
		expect(getCurrentLocale()).toBe('es')
	})
})

describe('subscribeDeviceLocaleRefresh', () => {
	beforeEach(() => {
		__resetI18nForTests()
		mockGetLocales.mockReset()
		mockGetLocales.mockReturnValue([
			{ languageCode: 'en', languageTag: 'en-US' },
		])
		initI18n({ locale: 'en', forceLocale: true })
	})

	it('refreshes locale on active and removes the listener once', () => {
		const listeners: ((state: AppStateStatus) => void)[] = []
		let removed = 0
		const appState: LocaleAppStateLike = {
			addEventListener: (_type, listener) => {
				listeners.push(listener)
				const sub: NativeEventSubscription = {
					remove: () => {
						removed += 1
					},
				}
				return sub
			},
		}

		const unsubscribe = subscribeDeviceLocaleRefresh(appState)
		expect(listeners).toHaveLength(1)

		mockGetLocales.mockReturnValue([
			{ languageCode: 'tr', languageTag: 'tr-TR' },
		])
		listeners[0]!('background')
		expect(getCurrentLocale()).toBe('en')

		listeners[0]!('active')
		expect(getCurrentLocale()).toBe('tr')

		unsubscribe()
		expect(removed).toBe(1)
		// Second unsubscribe must not double-remove.
		unsubscribe()
		expect(removed).toBe(1)
	})
})
