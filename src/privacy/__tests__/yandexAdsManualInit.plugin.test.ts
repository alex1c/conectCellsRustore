/**
 * Regression: Yandex manual-init metadata names must match SDK 8.4.0 bytecode
 * and the Expo config plugin must upsert them onto the application node.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- plugin is CJS */

const {
	META_AUTOMATIC_SDK_INITIALIZATION,
	META_APPMETRICA_ANALYTICS_ENABLED,
	REQUIRED_META_VALUE,
} = require('../../../plugins/yandexAdsManualInitConstants.js') as {
	META_AUTOMATIC_SDK_INITIALIZATION: string
	META_APPMETRICA_ANALYTICS_ENABLED: string
	REQUIRED_META_VALUE: string
}

const {
	applyYandexAdsManualInitMetadata,
	setApplicationMetaData,
} = require('../../../plugins/withYandexAdsManualInit.js') as {
	applyYandexAdsManualInitMetadata: (doc: any) => any
	setApplicationMetaData: (
		app: { 'meta-data'?: { $: Record<string, string> }[] },
		name: string,
		value: string,
	) => void
}

describe('yandexAdsManualInitConstants', () => {
	it('uses AUTOMATIC_SDK_INITIALIZATION from Yandex docs / SDK 8.4.0', () => {
		expect(META_AUTOMATIC_SDK_INITIALIZATION).toBe(
			'com.yandex.mobile.ads.AUTOMATIC_SDK_INITIALIZATION',
		)
	})

	it('uses APPMETRICA_ANALYTICS_ENABLED from SDK 8.4.0 (not EASY_INTEGRATION)', () => {
		expect(META_APPMETRICA_ANALYTICS_ENABLED).toBe(
			'com.yandex.mobile.ads.APPMETRICA_ANALYTICS_ENABLED',
		)
		expect(META_APPMETRICA_ANALYTICS_ENABLED).not.toContain(
			'EASY_INTEGRATION',
		)
	})

	it('requires false values', () => {
		expect(REQUIRED_META_VALUE).toBe('false')
	})
})

describe('applyYandexAdsManualInitMetadata', () => {
	it('inserts both meta-data entries under application', () => {
		const doc: any = {
			manifest: {
				$: {
					'xmlns:android': 'http://schemas.android.com/apk/res/android',
				},
				application: [
					{
						$: { 'android:name': '.MainApplication' },
						'meta-data': [
							{
								$: {
									'android:name': 'expo.modules.updates.ENABLED',
									'android:value': 'false',
								},
							},
						],
					},
				],
			},
		}

		applyYandexAdsManualInitMetadata(doc)

		const app = doc.manifest.application[0]
		const names = app['meta-data'].map(
			(m: { $: Record<string, string> }) => m.$['android:name'],
		)
		expect(names).toContain(META_AUTOMATIC_SDK_INITIALIZATION)
		expect(names).toContain(META_APPMETRICA_ANALYTICS_ENABLED)
		expect(doc.manifest.$['xmlns:tools']).toBe(
			'http://schemas.android.com/tools',
		)

		for (const name of [
			META_AUTOMATIC_SDK_INITIALIZATION,
			META_APPMETRICA_ANALYTICS_ENABLED,
		]) {
			const entry = app['meta-data'].find(
				(m: { $: Record<string, string> }) =>
					m.$['android:name'] === name,
			)
			expect(entry.$['android:value']).toBe('false')
			expect(entry.$['tools:replace']).toBe('android:value')
		}
	})

	it('upserts existing automatic-init meta-data to false', () => {
		const app: {
			'meta-data': { $: Record<string, string> }[]
		} = {
			'meta-data': [
				{
					$: {
						'android:name': META_AUTOMATIC_SDK_INITIALIZATION,
						'android:value': 'true',
					},
				},
			],
		}
		setApplicationMetaData(
			app,
			META_AUTOMATIC_SDK_INITIALIZATION,
			REQUIRED_META_VALUE,
		)
		expect(app['meta-data']).toHaveLength(1)
		const only = app['meta-data'][0]
		expect(only).toBeDefined()
		expect(only!.$['android:value']).toBe('false')
	})
})
