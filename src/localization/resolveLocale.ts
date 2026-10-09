/**
 * Maps device language tags onto the five supported Hexonica locales.
 * Unsupported languages fall back to English (caller applies fallbackLng).
 */

export const SUPPORTED_LOCALES = ['en', 'ru', 'es', 'de', 'tr'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'en'

/**
 * Normalize BCP-47 / Expo languageCode (+ optional region) to AppLocale.
 * Examples: en-US → en, es-MX → es, de-AT → de, tr-TR → tr, ru-RU → ru.
 */
export function resolveAppLocale (
	languageTag: string | null | undefined,
): AppLocale {
	if (!languageTag || typeof languageTag !== 'string') {
		return DEFAULT_LOCALE
	}
	const normalized = languageTag.trim().replace(/_/g, '-').toLowerCase()
	if (!normalized) {
		return DEFAULT_LOCALE
	}
	const primary = normalized.split('-')[0] ?? ''
	if ((SUPPORTED_LOCALES as readonly string[]).includes(primary)) {
		return primary as AppLocale
	}
	return DEFAULT_LOCALE
}

/** True when the resolved locale is one of the five shipping languages. */
export function isSupportedLocale (value: string): value is AppLocale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}
