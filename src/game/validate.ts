/**
 * Structural validation for persisted / fixture GameState payloads.
 * Keeps restore paths crash-safe without pulling in a schema library.
 */

import { BOARD_SIZE, MIN_CELL_VALUE } from './constants'
import { cloneGameState } from './gameState'
import type { Board, Cell, GameState, GameStateSnapshot, Position, RngState } from './types'

function isPlainObject (value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber (value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value)
}

function isPosition (value: unknown): value is Position {
	if (!isPlainObject(value)) {
		return false
	}
	return (
		Number.isInteger(value.row) &&
		Number.isInteger(value.col) &&
		(value.row as number) >= 0 &&
		(value.row as number) < BOARD_SIZE &&
		(value.col as number) >= 0 &&
		(value.col as number) < BOARD_SIZE
	)
}

function isCell (value: unknown): value is Cell {
	if (value === null) {
		return true
	}
	return Number.isInteger(value) && (value as number) >= MIN_CELL_VALUE
}

function isBoard (value: unknown): value is Board {
	if (!Array.isArray(value) || value.length !== BOARD_SIZE) {
		return false
	}
	for (const row of value) {
		if (!Array.isArray(row) || row.length !== BOARD_SIZE) {
			return false
		}
		for (const cell of row) {
			if (!isCell(cell)) {
				return false
			}
		}
	}
	return true
}

function isRngState (value: unknown): value is RngState {
	return isPlainObject(value) && isFiniteNumber(value.s)
}

function isSnapshot (value: unknown): value is GameStateSnapshot {
	if (!isPlainObject(value)) {
		return false
	}
	return (
		isBoard(value.board) &&
		isFiniteNumber(value.score) &&
		value.score >= 0 &&
		Number.isInteger(value.moveCount) &&
		(value.moveCount as number) >= 0 &&
		(value.status === 'playing' || value.status === 'game_over') &&
		isRngState(value.rng) &&
		isFiniteNumber(value.seed) &&
		Number.isInteger(value.largestValue) &&
		(value.largestValue as number) >= 0 &&
		Number.isInteger(value.largestChain) &&
		(value.largestChain as number) >= 0
	)
}

/** True when unknown JSON parses as a usable GameState. */
export function isValidGameState (value: unknown): value is GameState {
	if (!isPlainObject(value)) {
		return false
	}
	if (!isBoard(value.board)) {
		return false
	}
	if (!isFiniteNumber(value.score) || value.score < 0) {
		return false
	}
	if (!Number.isInteger(value.moveCount) || (value.moveCount as number) < 0) {
		return false
	}
	if (value.status !== 'playing' && value.status !== 'game_over') {
		return false
	}
	if (!isRngState(value.rng)) {
		return false
	}
	if (!isFiniteNumber(value.seed)) {
		return false
	}
	if (!Number.isInteger(value.largestValue) || (value.largestValue as number) < 0) {
		return false
	}
	if (!Number.isInteger(value.largestChain) || (value.largestChain as number) < 0) {
		return false
	}
	if (value.undoSnapshot !== null && !isSnapshot(value.undoSnapshot)) {
		return false
	}
	return true
}

/**
 * Parse and clone a GameState from unknown data.
 * Returns null when the payload is corrupt or incompatible.
 */
export function tryParseGameState (value: unknown): GameState | null {
	if (!isValidGameState(value)) {
		return null
	}
	return cloneGameState(value)
}

export { isPosition }
