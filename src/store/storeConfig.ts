/**
 * Centralized store-specific links and catalog actions.
 * UI must not branch on process.env — use getStoreConfig() instead.
 */

import { openExternalUrl } from '../ui/links/openExternalUrl'
import {
	FOREST_MUSIC_CONTACT_EMAIL,
	FOREST_MUSIC_CONTACT_MAILTO,
	FOREST_MUSIC_RUSTORE_URL,
	FOREST_MUSIC_SITE_LABEL,
	FOREST_MUSIC_SITE_URL,
} from '../ui/links/forestMusicRuStore'
import { getAppStore, type AppStoreId } from './appStore'

/**
 * Google Play developer / listing URLs.
 * Left null until a real published page exists — do not invent unpublished URLs.
 */
export const GOOGLE_PLAY_DEVELOPER_URL: string | null = null
export const GOOGLE_PLAY_LISTING_URL: string | null = null
export const GOOGLE_PLAY_RATE_URL: string | null = null

export interface StoreConfig {
	id: AppStoreId
	/** Cross-promo "other apps" catalog, if available. */
	otherAppsUrl: string | null
	/** True when Settings should show the other-apps action. */
	otherAppsAvailable: boolean
	/** Public store listing for this app, if published. */
	listingUrl: string | null
	/** Rate / review deep link, if available. */
	rateUrl: string | null
	siteUrl: string
	siteLabel: string
	contactEmail: string
	contactMailto: string
}

const RUSTORE_CONFIG: StoreConfig = {
	id: 'rustore',
	otherAppsUrl: FOREST_MUSIC_RUSTORE_URL,
	otherAppsAvailable: true,
	listingUrl: null,
	rateUrl: null,
	siteUrl: FOREST_MUSIC_SITE_URL,
	siteLabel: FOREST_MUSIC_SITE_LABEL,
	contactEmail: FOREST_MUSIC_CONTACT_EMAIL,
	contactMailto: FOREST_MUSIC_CONTACT_MAILTO,
}

const GOOGLEPLAY_CONFIG: StoreConfig = {
	id: 'googleplay',
	otherAppsUrl: GOOGLE_PLAY_DEVELOPER_URL,
	otherAppsAvailable: GOOGLE_PLAY_DEVELOPER_URL !== null,
	listingUrl: GOOGLE_PLAY_LISTING_URL,
	rateUrl: GOOGLE_PLAY_RATE_URL,
	siteUrl: FOREST_MUSIC_SITE_URL,
	siteLabel: FOREST_MUSIC_SITE_LABEL,
	contactEmail: FOREST_MUSIC_CONTACT_EMAIL,
	contactMailto: FOREST_MUSIC_CONTACT_MAILTO,
}

/** Immutable store config for the active (or provided) flavor. */
export function getStoreConfig (store: AppStoreId = getAppStore()): StoreConfig {
	switch (store) {
		case 'googleplay':
			return GOOGLEPLAY_CONFIG
		case 'rustore':
		default:
			return RUSTORE_CONFIG
	}
}

/** Opens the store-specific other-apps catalog when a URL exists. */
export async function openOtherApps (): Promise<void> {
	const url = getStoreConfig().otherAppsUrl
	if (!url) {
		return
	}
	await openExternalUrl(url)
}

/** Opens the store listing when published; no-op when pending. */
export async function openStoreListing (): Promise<void> {
	const url = getStoreConfig().listingUrl
	if (!url) {
		return
	}
	await openExternalUrl(url)
}

/** Opens the rate/review link when available; no-op when pending. */
export async function openRateApp (): Promise<void> {
	const url = getStoreConfig().rateUrl
	if (!url) {
		return
	}
	await openExternalUrl(url)
}
