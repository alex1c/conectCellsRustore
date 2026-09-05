/**
 * Structural validation for hex GameState persistence.
 */

import { cloneGameState } from './gameState'
import { SAVE_SCHEMA_VERSION } from './rules'
import type { HexRules } from './rules'
import type { Board, Cell, GameState, GameStateSnapshot, RngState } from './types'

function isPlainObject (value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber (value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value)
}

function isWeightList (
	value: unknown,
	key: 'value' | 'count',
): boolean {
	if (!Array.isArray(value) || value.length === 0) {
		return false
	}
	for (const entry of value) {
		if (!isPlainObject(entry)) {
			return false
		}
		if (!isFiniteNumber(entry.weight) || entry.weight <= 0) {
			return false
		}
		if (!Number.isInteger(entry[key]) || (entry[key] as number) < 1) {
			return false
		}
	}
	return true
}

function isRules (value: unknown): value is HexRules {
	if (!isPlainObject(value)) {
		return false
	}
	return (
		Number.isInteger(value.boardCols) &&
		(value.boardCols as number) >= 2 &&
		Number.isInteger(value.boardRows) &&
		(value.boardRows as number) >= 2 &&
		Number.isInteger(value.mergeThreshold) &&
		(value.mergeThreshold as number) >= 2 &&
		Number.isInteger(value.mergeResultFactor) &&
		(value.mergeResultFactor as number) >= 2 &&
		Number.isInteger(value.initialCellCount) &&
		(value.initialCellCount as number) >= 0 &&
		isWeightList(value.spawnCountWeights, 'count') &&
		isWeightList(value.spawnValueWeights, 'value') &&
		isWeightList(value.initialValueWeights, 'value')
	)
}

function isCell (value: unknown): value is Cell {
	if (value === null) {
		return true
	}
	return Number.isInteger(value) && (value as number) >= 1
}

function isBoard (value: unknown, cols: number, rows: number): value is Board {
	if (!Array.isArray(value) || value.length !== rows) {
		return false
	}
	for (const row of value) {
		if (!Array.isArray(row) || row.length !== cols) {
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

function isRng (value: unknown): value is RngState {
	return isPlainObject(value) && isFiniteNumber(value.s)
}

function isSnapshot (value: unknown): value is GameStateSnapshot {
	if (!isPlainObject(value) || !isRules(value.rules)) {
		return false
	}
	const cols = value.rules.boardCols
	const rows = value.rules.boardRows
	return (
		isBoard(value.board, cols, rows) &&
		isFiniteNumber(value.score) &&
		value.score >= 0 &&
		Number.isInteger(value.moveCount) &&
		(value.moveCount as number) >= 0 &&
		(value.status === 'playing' || value.status === 'game_over') &&
		isRng(value.rng) &&
		isFiniteNumber(value.seed) &&
		Number.isInteger(value.largestValue) &&
		Number.isInteger(value.largestGroup) &&
		Number.isInteger(value.largestCascade) &&
		Number.isInteger(value.merges) &&
		Number.isInteger(value.cascades) &&
		Number.isInteger(value.cellsSpawned) &&
		Number.isInteger(value.cellsCleared)
	)
}

export function isValidGameState (value: unknown): value is GameState {
	if (!isPlainObject(value) || !isRules(value.rules)) {
		return false
	}
	const cols = value.rules.boardCols
	const rows = value.rules.boardRows
	if (!isBoard(value.board, cols, rows)) {
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
	if (!isRng(value.rng) || !isFiniteNumber(value.seed)) {
		return false
	}
	if (
		!Number.isInteger(value.largestValue) ||
		!Number.isInteger(value.largestGroup) ||
		!Number.isInteger(value.largestCascade) ||
		!Number.isInteger(value.merges) ||
		!Number.isInteger(value.cascades) ||
		!Number.isInteger(value.cellsSpawned) ||
		!Number.isInteger(value.cellsCleared)
	) {
		return false
	}
	if (value.undoSnapshot !== null && !isSnapshot(value.undoSnapshot)) {
		return false
	}
	return true
}

export function tryParseGameState (value: unknown): GameState | null {
	if (!isValidGameState(value)) {
		return null
	}
	return cloneGameState(value)
}

export { SAVE_SCHEMA_VERSION }
