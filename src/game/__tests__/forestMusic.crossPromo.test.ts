/**
 * Safe external links + ForestMusic contact / RuStore helpers.
 */

import { Linking } from 'react-native'

import { openExternalUrl } from '../../ui/links/openExternalUrl'
import {
	FOREST_MUSIC_CONTACT_EMAIL,
	FOREST_MUSIC_CONTACT_MAILTO,
	FOREST_MUSIC_RUSTORE_URL,
	FOREST_MUSIC_SITE_URL,
	openForestMusicEmail,
	openForestMusicRuStore,
	openForestMusicSite,
} from '../../ui/links/forestMusicRuStore'

describe('openExternalUrl', () => {
	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('forwards the URL to Linking.openURL', async () => {
		const openSpy = jest
			.spyOn(Linking, 'openURL')
			.mockResolvedValue(undefined as never)

		await openExternalUrl('https://example.com')

		expect(openSpy).toHaveBeenCalledWith('https://example.com')
	})

	it('swallows open failures so callers cannot crash', async () => {
		jest
			.spyOn(Linking, 'openURL')
			.mockRejectedValue(new Error('no handler') as never)

		await expect(openExternalUrl('https://example.com')).resolves.toBeUndefined()
	})
})

describe('ForestMusic external links', () => {
	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('opens the RuStore developer catalog', async () => {
		const openSpy = jest
			.spyOn(Linking, 'openURL')
			.mockResolvedValue(undefined as never)

		await openForestMusicRuStore()

		expect(openSpy).toHaveBeenCalledWith(FOREST_MUSIC_RUSTORE_URL)
	})

	it('opens the ForestMusic website', async () => {
		const openSpy = jest
			.spyOn(Linking, 'openURL')
			.mockResolvedValue(undefined as never)

		await openForestMusicSite()

		expect(openSpy).toHaveBeenCalledWith(FOREST_MUSIC_SITE_URL)
		expect(FOREST_MUSIC_SITE_URL).toBe('https://forest-music.ru')
	})

	it('opens the developer contact mailto link', async () => {
		const openSpy = jest
			.spyOn(Linking, 'openURL')
			.mockResolvedValue(undefined as never)

		await openForestMusicEmail()

		expect(openSpy).toHaveBeenCalledWith(FOREST_MUSIC_CONTACT_MAILTO)
		expect(FOREST_MUSIC_CONTACT_EMAIL).toBe('rustore-alex1c@yandex.ru')
		expect(FOREST_MUSIC_CONTACT_MAILTO).toBe(
			'mailto:rustore-alex1c@yandex.ru',
		)
	})

	it('swallows RuStore open failures', async () => {
		jest
			.spyOn(Linking, 'openURL')
			.mockRejectedValue(new Error('no handler') as never)

		await expect(openForestMusicRuStore()).resolves.toBeUndefined()
		await expect(openForestMusicSite()).resolves.toBeUndefined()
		await expect(openForestMusicEmail()).resolves.toBeUndefined()
	})
})
