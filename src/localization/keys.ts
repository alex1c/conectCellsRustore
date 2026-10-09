/**
 * Stable translation key constants for contracts / non-JSX call sites.
 * Keys mirror en.json; keep in sync when adding strings.
 */

export const L10N = {
	brand: {
		name: 'brand.name',
		tagline: 'brand.tagline',
		storeTitle: 'brand.storeTitle',
	},
	common: {
		cancel: 'common.cancel',
		loading: 'common.loading',
		back: 'common.back',
		close: 'common.close',
		next: 'common.next',
		skip: 'common.skip',
		play: 'common.play',
	},
	settings: {
		sound: 'settings.sound',
		haptic: 'settings.haptic',
	},
	ads: {
		unavailable: 'ads.unavailable',
	},
	game: {
		undo: 'game.undo',
		restart: 'game.restart',
	},
} as const
