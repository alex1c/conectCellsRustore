/**
 * Yandex Mobile Ads 8.4.0 application <meta-data> keys for manual init.
 *
 * Confirmed against:
 * - Official docs: AUTOMATIC_SDK_INITIALIZATION
 *   https://ads.yandex.com/helpcenter/en/dev/android/quick-start
 * - mobileads-8.4.0.aar classes.jar (yads/s23.class):
 *   prefix "com.yandex.mobile.ads." + AUTOMATIC_SDK_INITIALIZATION
 *   prefix "com.yandex.mobile.ads." + APPMETRICA_ANALYTICS_ENABLED
 *
 * Note: APPMETRICA_EASY_INTEGRATION_ENABLED is NOT present in SDK 8.4.0
 * bytecode and must not be used.
 */

const META_PREFIX = 'com.yandex.mobile.ads.'

/** Disable YandexAdsInitializeProvider auto-init on process start. */
const META_AUTOMATIC_SDK_INITIALIZATION =
	`${META_PREFIX}AUTOMATIC_SDK_INITIALIZATION`

/**
 * Disable Ads SDK AppMetrica library-adapter analytics bootstrapping.
 * Distinct from the standalone @appmetrica/react-native-analytics activate().
 *
 * Bytecode (mobileads-8.4.0 yads.ag.a): reads this Boolean from ApplicationInfo
 * metaData; when null defaults to TRUE (activate + reportEvent allowed).
 * When false, yads.be skips AppMetricaLibraryAdapter.activate and yads.ee/ce
 * skip ad-event reporting. Does NOT replace setAppAdAnalyticsReporting(false)
 * or AppMetrica.setDataSendingEnabled(false) — those are runtime defenses.
 */
const META_APPMETRICA_ANALYTICS_ENABLED =
	`${META_PREFIX}APPMETRICA_ANALYTICS_ENABLED`

/** Required android:value for both keys (manual / gated init). */
const REQUIRED_META_VALUE = 'false'

/** ContentProvider that performs automatic SDK initialization. */
const YANDEX_ADS_INITIALIZE_PROVIDER =
	'com.yandex.mobile.ads.core.initializer.YandexAdsInitializeProvider'

module.exports = {
	META_PREFIX,
	META_AUTOMATIC_SDK_INITIALIZATION,
	META_APPMETRICA_ANALYTICS_ENABLED,
	REQUIRED_META_VALUE,
	YANDEX_ADS_INITIALIZE_PROVIDER,
}
