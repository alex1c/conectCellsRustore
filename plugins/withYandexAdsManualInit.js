/**
 * Disable Yandex Mobile Ads automatic ContentProvider initialization and
 * Ads→AppMetrica library-adapter analytics so neither starts before the JS
 * consent gate calls MobileAds.initialize() / AppMetrica.activate().
 *
 * Why this plugin must re-run on every Expo prebuild:
 * - ./android is gitignored (CNG). A stale tree keeps an old AndroidManifest
 *   without these <meta-data> entries even when app.config.js lists the plugin.
 * - Gradle assemble then packages YandexAdsInitializeProvider with defaults
 *   (auto-init ON) → AppMetrica events before Google Play consent.
 *
 * @see plugins/yandexAdsManualInitConstants.js
 * @see https://ads.yandex.com/helpcenter/en/dev/android/quick-start
 */

const {
	AndroidConfig,
	withAndroidManifest,
	withAppBuildGradle,
} = require('@expo/config-plugins')

const {
	META_AUTOMATIC_SDK_INITIALIZATION,
	META_APPMETRICA_ANALYTICS_ENABLED,
	REQUIRED_META_VALUE,
} = require('./yandexAdsManualInitConstants')
const { withDangerousMod } = require('@expo/config-plugins')
const path = require('path')
const { spawnSync } = require('child_process')

/**
 * Ensure yandex-mobile-ads RN bridge exposes setAppAdAnalyticsReporting
 * (missing in 8.4.0). Idempotent patch of node_modules sources used by Gradle.
 */
function ensureAppAdAnalyticsBridge (projectRoot) {
	const script = path.join(
		projectRoot,
		'scripts',
		'ensure-yandex-ads-app-ad-analytics-bridge.mjs',
	)
	const result = spawnSync(process.execPath, [script], {
		cwd: projectRoot,
		encoding: 'utf8',
	})
	if (result.stdout) {
		console.log(result.stdout.trimEnd())
	}
	if (result.status !== 0) {
		const detail = (result.stderr || result.stdout || '').trim()
		throw new Error(
			`ensure-yandex-ads-app-ad-analytics-bridge failed: ${detail}`,
		)
	}
}

/**
 * Upserts an <meta-data> entry under <application>.
 * @param {object} app
 * @param {string} name
 * @param {string} value
 */
function setApplicationMetaData (app, name, value) {
	if (!app['meta-data']) {
		app['meta-data'] = []
	}
	const existing = app['meta-data'].find(
		(item) => item.$?.['android:name'] === name,
	)
	if (existing) {
		existing.$['android:value'] = value
		// Win manifest merger conflicts if a dependency also declares the key.
		existing.$['tools:replace'] = 'android:value'
		return
	}
	app['meta-data'].push({
		$: {
			'android:name': name,
			'android:value': value,
			'tools:replace': 'android:value',
		},
	})
}

/**
 * Ensure the manifest root declares xmlns:tools for tools:replace.
 * @param {object} manifest
 */
function ensureToolsNamespace (manifest) {
	if (!manifest.manifest) {
		return
	}
	const attrs = manifest.manifest.$ || {}
	if (!attrs['xmlns:tools']) {
		attrs['xmlns:tools'] = 'http://schemas.android.com/tools'
		manifest.manifest.$ = attrs
	}
}

/**
 * Apply required Yandex manual-init meta-data to the main application node.
 * @param {object} manifestDoc Expo AndroidManifest mod result
 */
function applyYandexAdsManualInitMetadata (manifestDoc) {
	ensureToolsNamespace(manifestDoc)
	const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifestDoc)
	setApplicationMetaData(
		app,
		META_AUTOMATIC_SDK_INITIALIZATION,
		REQUIRED_META_VALUE,
	)
	setApplicationMetaData(
		app,
		META_APPMETRICA_ANALYTICS_ENABLED,
		REQUIRED_META_VALUE,
	)
	return manifestDoc
}

/** Gradle snippet: fail assemble if source manifest lacks required flags. */
const GRADLE_VERIFY_MARKER = '// hexonica:verify-yandex-ads-manual-init'

const GRADLE_VERIFY_BLOCK = `
${GRADLE_VERIFY_MARKER}
tasks.register("verifyYandexAdsManualInitManifest") {
	group = "verification"
	description = "Fail if Yandex Ads manual-init meta-data is missing from the app manifest"
	doLast {
		def manifestFile = file("src/main/AndroidManifest.xml")
		if (!manifestFile.exists()) {
			throw new GradleException("Missing \${manifestFile} — run expo prebuild")
		}
		def text = manifestFile.getText("UTF-8")
		def required = [
			'com.yandex.mobile.ads.AUTOMATIC_SDK_INITIALIZATION',
			'com.yandex.mobile.ads.APPMETRICA_ANALYTICS_ENABLED',
		]
		required.each { name ->
			def nameAttr = 'android:name="' + name + '"'
			if (!text.contains(nameAttr)) {
				throw new GradleException(
					"Yandex Ads manual-init meta-data missing: \${name}. " +
					"Re-run: npx expo prebuild --platform android --no-install " +
					"(plugin ./plugins/withYandexAdsManualInit)."
				)
			}
			def quoted = java.util.regex.Pattern.quote(name)
			def patternA = ~/android:name="\${quoted}"[^>]*android:value="false"/
			def patternB = ~/android:value="false"[^>]*android:name="\${quoted}"/
			if (!(text =~ patternA) && !(text =~ patternB)) {
				throw new GradleException(
					"Yandex Ads manual-init meta-data must be false: \${name}."
				)
			}
		}
		logger.lifecycle("verifyYandexAdsManualInitManifest: OK")
	}
}
afterEvaluate {
	tasks.matching { it.name == "preBuild" || it.name.endsWith("PreBuild") }.configureEach {
		dependsOn("verifyYandexAdsManualInitManifest")
	}
}
`

/**
 * @param {import('@expo/config-plugins').ExportedConfig} config
 */
module.exports = function withYandexAdsManualInit (config) {
	config = withDangerousMod(config, [
		'android',
		async (cfg) => {
			ensureAppAdAnalyticsBridge(cfg.modRequest.projectRoot)
			return cfg
		},
	])

	config = withAndroidManifest(config, (cfg) => {
		applyYandexAdsManualInitMetadata(cfg.modResults)
		return cfg
	})

	config = withAppBuildGradle(config, (cfg) => {
		if (!cfg.modResults.contents.includes(GRADLE_VERIFY_MARKER)) {
			cfg.modResults.contents =
				cfg.modResults.contents.trimEnd() + '\n' + GRADLE_VERIFY_BLOCK + '\n'
		}
		return cfg
	})

	return config
}

module.exports.applyYandexAdsManualInitMetadata = applyYandexAdsManualInitMetadata
module.exports.setApplicationMetaData = setApplicationMetaData
