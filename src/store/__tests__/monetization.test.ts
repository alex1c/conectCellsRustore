/**
 * Store monetization flag — Play excludes Ads/AppMetrica; RuStore keeps them.
 */

import { __setAppStoreForTests } from '../appStore'
import {
	isStoreMonetizationDisabled,
	isStoreMonetizationEnabled,
} from '../monetization'
import {
	canEnableAds,
	canEnableAnalytics,
	isConsentPending,
	resolveConsentRequirement,
} from '../../privacy/consentPolicy'

describe('store monetization', () => {
	afterEach(() => {
		__setAppStoreForTests(null)
	})

	it('enables monetization only for RuStore', () => {
		__setAppStoreForTests('rustore')
		expect(isStoreMonetizationEnabled()).toBe(true)
		expect(isStoreMonetizationDisabled()).toBe(false)

		__setAppStoreForTests('googleplay')
		expect(isStoreMonetizationEnabled()).toBe(false)
		expect(isStoreMonetizationDisabled()).toBe(true)
	})

	it('Google Play has no optional SDKs and no consent gate', () => {
		const req = resolveConsentRequirement({ storeId: 'googleplay' })
		expect(req.optionalSdksAvailable).toBe(false)
		expect(req.requiresExplicitConsent).toBe(false)
		expect(req.reason).toBe('googleplay_no_optional_sdks')
		expect(canEnableAnalytics(null, req)).toBe(false)
		expect(canEnableAds('granted', req)).toBe(false)
		expect(
			isConsentPending({ analytics: null, ads: null }, req),
		).toBe(false)
	})

	it('RuStore keeps ungated optional SDKs', () => {
		const req = resolveConsentRequirement({ storeId: 'rustore' })
		expect(req.optionalSdksAvailable).toBe(true)
		expect(req.requiresExplicitConsent).toBe(false)
		expect(canEnableAnalytics(null, req)).toBe(true)
		expect(canEnableAds(null, req)).toBe(true)
	})
})
