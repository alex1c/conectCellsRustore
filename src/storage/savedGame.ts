/**
 * Versioned save-game payload helpers for hex state.
 */

import { SAVE_SCHEMA_VERSION } from '../game/rules'
import { tryParseGameState } from '../game/validate'
import type { GameState } from '../game/types'

export interface SavedGamePayload {
	version: number
	game: GameState
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
		return parseSavedGamePayload(JSON.parse(json) as unknown)
	} catch {
		return null
	}
}
