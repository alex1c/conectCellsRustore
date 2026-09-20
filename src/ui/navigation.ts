/**
 * App route model — lightweight shell navigation (no react-navigation).
 */

export type AppRoute =
	| 'home'
	| 'game'
	| 'settings'
	| 'howToPlay'
	| 'tutorial'
	| 'about'
	| 'boot'

export type GameEntryReason = 'continue' | 'new_game' | 'resume'
