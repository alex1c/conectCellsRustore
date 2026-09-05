/**
 * Structural validation for persisted / fixture GameState payloads.
 */

import { cloneGameState } from './gameState'
import {
	MIN_CELL_VALUE,
	RULE_PRESET_IDS,
	type GameRules,
	type RulePresetId,
} from './rules'
import type {
	Board,
	Cell,
	GameState,
	GameStateSnapshot,
	Position,
	RngState,
} from './types'

function isPlainObject (value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber (value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value)
}

function isRulePresetId (value: unknown): value is RulePresetId {
	return typeof value === 'string' && (RULE_PRESET_IDS as string[]).includes(value)
}

function isRules (value: unknown): value is GameRules {
	if (!isPlainObject(value)) {
		return false
	}
	if (!Number.isInteger(value.boardSize) || (value.boardSize as number) < 2) {
		return false
	}
	if (!Number.isInteger(value.minCellValue) || (value.minCellValue as number) < 1) {
		return false
	}
	if (
		!Number.isInteger(value.maxInitialValue) ||
		(value.maxInitialValue as number) < (value.minCellValue as number)
	) {
		return false
	}
	if (
		!isFiniteNumber(value.spawnProbability) ||
		(value.spawnProbability as number) < 0 ||
		(value.spawnProbability as number) > 1
	) {
		return false
	}
	if (!isFiniteNumber(value.scoreBase) || (value.scoreBase as number) < 0) {
		return false
	}
	if (
		!isFiniteNumber(value.initialEmptyRatio) ||
		(value.initialEmptyRatio as number) < 0 ||
		(value.initialEmptyRatio as number) > 1
	) {
		return false
	}
	if (!Array.isArray(value.spawnWeights) || value.spawnWeights.length === 0) {
		return false
	}
	for (const entry of value.spawnWeights) {
		if (!isPlainObject(entry)) {
			return false
		}
		if (!Number.isInteger(entry.value) || (entry.value as number) < 1) {
			return false
		}
		if (!isFiniteNumber(entry.weight) || (entry.weight as number) <= 0) {
			return false
		}
	}
	return true
}

function isCell (value: unknown, minValue: number): value is Cell {
	if (value === null) {
		return true
	}
	return Number.isInteger(value) && (value as number) >= minValue
}

function isBoard (value: unknown, size: number, minValue: number): value is Board {
	if (!Array.isArray(value) || value.length !== size) {
		return false
	}
	for (const row of value) {
		if (!Array.isArray(row) || row.length !== size) {
			return false
		}
		for (const cell of row) {
			if (!isCell(cell, minValue)) {
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
	if (!isRulePresetId(value.rulesetId) || !isRules(value.rules)) {
		return false
	}
	const size = value.rules.boardSize
	const minValue = value.rules.minCellValue
	return (
		isBoard(value.board, size, minValue) &&
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
	if (!isRulePresetId(value.rulesetId) || !isRules(value.rules)) {
		return false
	}
	const size = value.rules.boardSize
	const minValue = value.rules.minCellValue ?? MIN_CELL_VALUE
	if (!isBoard(value.board, size, minValue)) {
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

export function isPosition (value: unknown, size: number): value is Position {
	if (!isPlainObject(value)) {
		return false
	}
	return (
		Number.isInteger(value.row) &&
		Number.isInteger(value.col) &&
		(value.row as number) >= 0 &&
		(value.row as number) < size &&
		(value.col as number) >= 0 &&
		(value.col as number) < size
	)
}
