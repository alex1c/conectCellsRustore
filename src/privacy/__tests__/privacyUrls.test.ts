/**
 * Published Hexonica privacy policy URLs — no stale paths.
 */

import {
	PRIVACY_POLICY_CATALOG_URL,
	PRIVACY_POLICY_URL,
	PRIVACY_POLICY_URL_RU,
	resolvePrivacyPolicyUrl,
} from '../privacyUrls'

describe('privacyUrls', () => {
	it('uses published Hexonica EN as the primary policy URL', () => {
		expect(PRIVACY_POLICY_URL).toBe(
			'https://forest-music.ru/privacy/hexonica/',
		)
	})

	it('uses published Hexonica RU page', () => {
		expect(PRIVACY_POLICY_URL_RU).toBe(
			'https://forest-music.ru/privacy/hexonica/ru.html',
		)
	})

	it('keeps the audited-apps catalog URL', () => {
		expect(PRIVACY_POLICY_CATALOG_URL).toBe(
			'https://forest-music.ru/privacy/',
		)
	})

	it('resolves RU locale to the Russian page', () => {
		expect(resolvePrivacyPolicyUrl('ru')).toBe(PRIVACY_POLICY_URL_RU)
		expect(resolvePrivacyPolicyUrl('ru-RU')).toBe(PRIVACY_POLICY_URL_RU)
	})

	it('resolves non-RU locales to the English Hexonica page', () => {
		expect(resolvePrivacyPolicyUrl('en')).toBe(PRIVACY_POLICY_URL)
		expect(resolvePrivacyPolicyUrl('de')).toBe(PRIVACY_POLICY_URL)
		expect(resolvePrivacyPolicyUrl('es')).toBe(PRIVACY_POLICY_URL)
		expect(resolvePrivacyPolicyUrl('tr')).toBe(PRIVACY_POLICY_URL)
		expect(resolvePrivacyPolicyUrl(undefined)).toBe(PRIVACY_POLICY_URL)
	})

	it('does not retain retired draft paths', () => {
		expect(PRIVACY_POLICY_URL).not.toBe('https://forest-music.ru/privacy/')
		expect(PRIVACY_POLICY_URL_RU).not.toBe(
			'https://forest-music.ru/privacy/ru.html',
		)
		expect(PRIVACY_POLICY_URL).not.toContain('/privacy/ru.html')
	})
})
