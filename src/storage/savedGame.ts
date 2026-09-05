/**
 * Versioned save-game payload helpers (pure, testable — no AsyncStorage).
 */

import { SAVE_SCHEMA_VERSION } from '../game/constants'
import { tryParseGameState } from '../game/validate'
import type { GameState } from '../game/types'

export interface SavedGamePayload {
	version: number
	game: GameState
	/** Epoch ms when the run started (for rough duration metrics). */
	startedAt?: number
}

export function buildSavedGamePayload (
	game: GameState,
	startedAt?: number,
): SavedGamePayload {
	return {
		version: SAVE_SCHEMA_VERSION,
		game,
		startedAt,
	}
}

/**
 * Parse a saved payload from unknown JSON.
 * Returns null for corrupt / unsupported data so callers can fall back safely.
 */
export function parseSavedGamePayload (raw: unknown): SavedGamePayload | null {
	if (!raw || typeof raw !== 'object') {
		return null
	}
	const record = raw as Record<string, unknown>
	if (record.version !== SAVE_SCHEMA_VERSION) {
		return null
	}
	const game = tryParseGameState(record.game)
	if (!game) {
		return null
	}
	const startedAt =
		typeof record.startedAt === 'number' && Number.isFinite(record.startedAt)
			? record.startedAt
			: undefined
	return { version: SAVE_SCHEMA_VERSION, game, startedAt }
}

export function serializeSavedGamePayload (payload: SavedGamePayload): string {
	return JSON.stringify(payload)
}

export function deserializeSavedGamePayload (
	json: string,
): SavedGamePayload | null {
	try {
		const parsed: unknown = JSON.parse(json)
		return parseSavedGamePayload(parsed)
	} catch {
		return null
	}
}
