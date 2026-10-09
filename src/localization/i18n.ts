/**
 * Hexonica offline i18n bootstrap (i18next + expo-localization).
 * Detects device locale once at init; English is the deterministic fallback.
 * Manual language override can later call i18n.changeLanguage without redesign.
 */

/* eslint-disable import/no-named-as-default-member -- default i18next singleton API */

import * as Localization from 'expo-localization'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import ru from './locales/ru.json'
import tr from './locales/tr.json'
import {
	DEFAULT_LOCALE,
	resolveAppLocale,
	type AppLocale,
} from './resolveLocale'

export const localizationResources = {
	en: { translation: en },
	ru: { translation: ru },
	es: { translation: es },
	de: { translation: de },
	tr: { translation: tr },
} as const

/** Flat English dictionary — used for typed key checks in tests. */
export type TranslationDictionary = typeof en

let initialized = false

/**
 * Prefer Expo languageCode; fall back to languageTag / locale string.
 * Safe when Localization APIs are mocked or unavailable (Jest).
 */
export function detectDeviceLocale (): AppLocale {
	try {
		const locales = Localization.getLocales?.() ?? []
		const primary = locales[0]
		if (primary?.languageCode) {
			return resolveAppLocale(primary.languageCode)
		}
		if (primary?.languageTag) {
			return resolveAppLocale(primary.languageTag)
		}
	} catch {
		// Jest / incomplete native mocks
	}
	return DEFAULT_LOCALE
}

/**
 * Initialize i18next once. Idempotent — safe to call from App and tests.
 */
export function initI18n (options?: {
	locale?: AppLocale
	/** When true, skip device detection and use provided/default locale. */
	forceLocale?: boolean
}): typeof i18next {
	const locale =
		options?.forceLocale && options.locale
			? options.locale
			: options?.locale ?? detectDeviceLocale()

	if (initialized) {
		if (i18next.language !== locale) {
			void i18next.changeLanguage(locale)
		}
		return i18next
	}

	void i18next.use(initReactI18next).init({
		compatibilityJSON: 'v4',
		resources: localizationResources,
		lng: locale,
		fallbackLng: DEFAULT_LOCALE,
		supportedLngs: ['en', 'ru', 'es', 'de', 'tr'],
		nonExplicitSupportedLngs: true,
		defaultNS: 'translation',
		interpolation: {
			escapeValue: false,
			// Missing params render as empty rather than raw "{{key}}".
			skipOnVariables: false,
		},
		returnNull: false,
		returnEmptyString: false,
		parseMissingKeyHandler: (key: string) => {
			if (__DEV__) {
				console.warn(`[i18n] missing key: ${key}`)
			}
			return ''
		},
		react: {
			useSuspense: false,
		},
	})

	initialized = true
	return i18next
}

/** Sync translate helper for non-React modules (ads alerts, etc.). */
export function t (
	key: string,
	options?: Record<string, unknown>,
): string {
	if (!initialized) {
		initI18n()
	}
	const value = i18next.t(key, options as never)
	if (typeof value !== 'string') {
		return ''
	}
	return value
}

export function getCurrentLocale (): AppLocale {
	if (!initialized) {
		initI18n()
	}
	return resolveAppLocale(i18next.language)
}

/**
 * Test-only: reset init flag so suites can re-init with a forced locale.
 * Production code must never call this.
 */
export function __resetI18nForTests (): void {
	initialized = false
	if (i18next.isInitialized) {
		// i18next has no public destroy; clear language for next init path.
		void i18next.changeLanguage(DEFAULT_LOCALE)
	}
}

export { i18next as i18n }
export default i18next
