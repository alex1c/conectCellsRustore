/**
 * Build-time APP_STORE selection — defaults, invalid values, no silent Play.
 */

import {
	__setAppStoreForTests,
	DEFAULT_APP_STORE,
	getAppStore,
	isGooglePlayStore,
	isRuStore,
	resolveAppStore,
} from '../appStore'

describe('resolveAppStore', () => {
	it('defaults missing/empty to rustore (never googleplay)', () => {
		expect(resolveAppStore(undefined)).toBe('rustore')
		expect(resolveAppStore(null)).toBe('rustore')
		expect(resolveAppStore('')).toBe('rustore')
		expect(resolveAppStore('   ')).toBe('rustore')
		expect(DEFAULT_APP_STORE).toBe('rustore')
	})

	it('accepts rustore and googleplay (case-insensitive)', () => {
		expect(resolveAppStore('rustore')).toBe('rustore')
		expect(resolveAppStore('RuStore')).toBe('rustore')
		expect(resolveAppStore('googleplay')).toBe('googleplay')
		expect(resolveAppStore('GooglePlay')).toBe('googleplay')
	})

	it('throws on unknown store values', () => {
		expect(() => resolveAppStore('play')).toThrow(/Invalid EXPO_PUBLIC_APP_STORE/)
		expect(() => resolveAppStore('appstore')).toThrow(/Invalid/)
		expect(() => resolveAppStore('RUSTORE_PROD')).toThrow(/Invalid/)
	})
})

describe('getAppStore', () => {
	const original = process.env.EXPO_PUBLIC_APP_STORE

	afterEach(() => {
		__setAppStoreForTests(null)
		if (original === undefined) {
			delete process.env.EXPO_PUBLIC_APP_STORE
		} else {
			process.env.EXPO_PUBLIC_APP_STORE = original
		}
	})

	it('reads EXPO_PUBLIC_APP_STORE when set', () => {
		process.env.EXPO_PUBLIC_APP_STORE = 'googleplay'
		expect(getAppStore()).toBe('googleplay')
		expect(isGooglePlayStore()).toBe(true)
		expect(isRuStore()).toBe(false)
	})

	it('defaults to rustore when env unset', () => {
		delete process.env.EXPO_PUBLIC_APP_STORE
		expect(getAppStore()).toBe('rustore')
		expect(isRuStore()).toBe(true)
		expect(isGooglePlayStore()).toBe(false)
	})

	it('test override wins over env', () => {
		process.env.EXPO_PUBLIC_APP_STORE = 'rustore'
		__setAppStoreForTests('googleplay')
		expect(getAppStore()).toBe('googleplay')
	})
})
