/**
 * AsyncStorage keys and thin I/O wrappers for Phase 2 persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

import type { GameState } from '../game/types'
import { parseBestScore, resolveBestScore } from './bestScore'
import { parseBestLevel, resolveBestLevel } from './bestLevel'
import {
	buildSavedGamePayload,
	deserializeSavedGamePayload,
	serializeSavedGamePayload,
	type SavedGamePayload,
} from './savedGame'

export const STORAGE_KEY_SAVED_GAME = 'connectcells.savedGame.v4'
export const STORAGE_KEY_BEST_SCORE = 'connectcells.bestScore.v1'
export const STORAGE_KEY_BEST_LEVEL = 'connectcells.bestLevel.v1'

export async function loadSavedGame (): Promise<SavedGamePayload | null> {
	try {
		const json = await AsyncStorage.getItem(STORAGE_KEY_SAVED_GAME)
		if (!json) {
			return null
		}
		return deserializeSavedGamePayload(json)
	} catch {
		return null
	}
}

export async function saveGameState (
	game: GameState,
	startedAt?: number,
): Promise<void> {
	const payload = buildSavedGamePayload(game, startedAt)
	await AsyncStorage.setItem(
		STORAGE_KEY_SAVED_GAME,
		serializeSavedGamePayload(payload),
	)
}

export async function clearSavedGame (): Promise<void> {
	await AsyncStorage.removeItem(STORAGE_KEY_SAVED_GAME)
}

export async function loadBestScore (): Promise<number> {
	try {
		const raw = await AsyncStorage.getItem(STORAGE_KEY_BEST_SCORE)
		return parseBestScore(raw)
	} catch {
		return 0
	}
}

export async function saveBestScore (score: number): Promise<number> {
	const current = await loadBestScore()
	const next = resolveBestScore(current, score)
	await AsyncStorage.setItem(STORAGE_KEY_BEST_SCORE, String(next))
	return next
}

export async function loadBestLevel (): Promise<number> {
	try {
		const raw = await AsyncStorage.getItem(STORAGE_KEY_BEST_LEVEL)
		return parseBestLevel(raw)
	} catch {
		return 1
	}
}

export async function saveBestLevel (level: number): Promise<number> {
	const current = await loadBestLevel()
	const next = resolveBestLevel(current, level)
	await AsyncStorage.setItem(STORAGE_KEY_BEST_LEVEL, String(next))
	return next
}
