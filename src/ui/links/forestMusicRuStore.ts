/**
 * ForestMusic developer contact / store links (About + Settings).
 * Opened externally via openExternalUrl — no WebView.
 */

import { openExternalUrl } from './openExternalUrl'

/** Official ForestMusic developer page on RuStore. */
export const FOREST_MUSIC_RUSTORE_URL =
	'https://www.rustore.ru/catalog/developer/pw0k858f'

/** Public ForestMusic website (display label without scheme). */
export const FOREST_MUSIC_SITE_LABEL = 'forest-music.ru'

/** Full https URL for the ForestMusic website. */
export const FOREST_MUSIC_SITE_URL = 'https://forest-music.ru'

/** Support / store contact email for ForestMusic. */
export const FOREST_MUSIC_CONTACT_EMAIL = 'rustore-alex1c@yandex.ru'

/** mailto: target for the contact email. */
export const FOREST_MUSIC_CONTACT_MAILTO =
	`mailto:${FOREST_MUSIC_CONTACT_EMAIL}`

/** Opens the ForestMusic RuStore catalog externally. */
export async function openForestMusicRuStore (): Promise<void> {
	await openExternalUrl(FOREST_MUSIC_RUSTORE_URL)
}

/** Opens the ForestMusic website in the system browser. */
export async function openForestMusicSite (): Promise<void> {
	await openExternalUrl(FOREST_MUSIC_SITE_URL)
}

/** Opens the device email client to contact the developer. */
export async function openForestMusicEmail (): Promise<void> {
	await openExternalUrl(FOREST_MUSIC_CONTACT_MAILTO)
}
