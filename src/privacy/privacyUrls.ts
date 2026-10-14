/**
 * Public privacy policy URLs (ForestMusic Privacy Policy Center on Timeweb).
 *
 * Published and browser-verified:
 * - EN: https://forest-music.ru/privacy/hexonica/
 * - RU: https://forest-music.ru/privacy/hexonica/ru.html
 * - Catalog: https://forest-music.ru/privacy/
 */

/** Primary in-app policy URL (English Hexonica page). */
export const PRIVACY_POLICY_URL = 'https://forest-music.ru/privacy/hexonica/'

/** Russian Hexonica policy page. */
export const PRIVACY_POLICY_URL_RU =
	'https://forest-music.ru/privacy/hexonica/ru.html'

/** Directory of audited ForestMusic app policies. */
export const PRIVACY_POLICY_CATALOG_URL = 'https://forest-music.ru/privacy/'

/** Support email for privacy / deletion requests (matches About). */
export const PRIVACY_CONTACT_EMAIL = 'rustore-alex1c@yandex.ru'

/**
 * Locale-aware policy URL.
 * Russian UI opens the RU page; all other app locales open the EN page.
 */
export function resolvePrivacyPolicyUrl (
	locale: string | null | undefined,
): string {
	const normalized = String(locale ?? '')
		.trim()
		.toLowerCase()
	if (normalized === 'ru' || normalized.startsWith('ru-')) {
		return PRIVACY_POLICY_URL_RU
	}
	return PRIVACY_POLICY_URL
}
