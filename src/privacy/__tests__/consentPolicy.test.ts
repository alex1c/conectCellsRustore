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

	it('requires explicit consent only for Google Play', () => {
		expect(
			resolveConsentRequirement({ storeId: 'googleplay' })
				.requiresExplicitConsent,
		).toBe(true)
		expect(
			resolveConsentRequirement({ storeId: 'rustore' })
				.requiresExplicitConsent,
		).toBe(false)
	})

	it('RuStore enables analytics and ads without decisions', () => {
		const req = resolveConsentRequirement({ storeId: 'rustore' })
		expect(canEnableAnalytics(null, req)).toBe(true)
		expect(canEnableAds(null, req)).toBe(true)
		expect(isConsentPending({ analytics: null, ads: null }, req)).toBe(
			false,
		)
	})

	it('Google Play stays pending until both purposes decided', () => {
		const req = resolveConsentRequirement({ storeId: 'googleplay' })
		expect(isConsentPending({ analytics: null, ads: null }, req)).toBe(
			true,
		)
		expect(
			isConsentPending({ analytics: 'granted', ads: null }, req),
		).toBe(true)
		expect(
			isConsentPending(
				{ analytics: 'granted', ads: 'denied' },
				req,
			),
		).toBe(false)
	})

	it('Google Play rejection disables optional SDKs', () => {
		const req = resolveConsentRequirement({ storeId: 'googleplay' })
		expect(canEnableAnalytics('denied', req)).toBe(false)
		expect(canEnableAds('denied', req)).toBe(false)
		expect(canEnableAnalytics('granted', req)).toBe(true)
		expect(canEnableAds('granted', req)).toBe(true)
	})

	it('ads personalization is not separable for Yandex stack', () => {
		expect(
			resolveConsentRequirement({ storeId: 'googleplay' })
				.adsPersonalizationSeparable,
		).toBe(false)
	})
})
