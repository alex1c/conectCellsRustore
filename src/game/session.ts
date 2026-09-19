/**
 * Session helpers for Home Continue / New Game (pure, testable).
 */

import type { GameState } from './types'

/** True when a loaded/persisted party should offer Continue. */
export function isActiveParty (game: GameState | null | undefined): boolean {
	if (!game) {
		return false
	}
	return game.status === 'playing' || game.status === 'game_over'
}
