/**
 * Consent policy — store gate, pending, purpose enables.
 */

import { __setAppStoreForTests } from '../../store/appStore'
import {
	canEnableAds,
	canEnableAnalytics,
	isConsentPending,
	resolveConsentRequirement,
} from '../consentPolicy'

describe('consentPolicy', () => {
	afterEach(() => {
		__setAppStoreForTests(null)
	})

	it('Google Play closed-testing: no optional SDKs, no consent UI', () => {
		const play = resolveConsentRequirement({ storeId: 'googleplay' })
		expect(play.requiresExplicitConsent).toBe(false)
		expect(play.optionalSdksAvailable).toBe(false)
		expect(play.reason).toBe('googleplay_no_optional_sdks')
		expect(
			resolveConsentRequirement({ storeId: 'rustore' })
				.requiresExplicitConsent,
		).toBe(false)
	})

	it('RuStore enables analytics and ads without decisions', () => {
		const req = resolveConsentRequirement({ storeId: 'rustore' })
		expect(req.optionalSdksAvailable).toBe(true)
		expect(canEnableAnalytics(null, req)).toBe(true)
		expect(canEnableAds(null, req)).toBe(true)
		expect(isConsentPending({ analytics: null, ads: null }, req)).toBe(
			false,
		)
	})

	it('Google Play is never pending and never enables optional SDKs', () => {
		const req = resolveConsentRequirement({ storeId: 'googleplay' })
		expect(isConsentPending({ analytics: null, ads: null }, req)).toBe(
			false,
		)
		expect(canEnableAnalytics('granted', req)).toBe(false)
		expect(canEnableAds('granted', req)).toBe(false)
	})

	it('ads personalization is not separable for Yandex stack', () => {
		expect(
			resolveConsentRequirement({ storeId: 'googleplay' })
				.adsPersonalizationSeparable,
		).toBe(false)
		expect(
			resolveConsentRequirement({ storeId: 'rustore' })
				.adsPersonalizationSeparable,
		).toBe(false)
	})
})
