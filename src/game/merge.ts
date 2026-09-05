/**
 * Primary merge and deterministic chain reaction resolution.
 */

import { getCell, setCell } from './board'
import { getOrthogonalNeighbors } from './neighbors'
import { scoreForStep } from './scoring'
import type { Board, GameEvent, Position } from './types'

export interface MergeChainResult {
	board: Board
	events: GameEvent[]
	scoreGain: number
	maxChainLevel: number
	finalValue: number
}

/**
 * Compare positions for deterministic neighbor picks (row, then col).
 */
function comparePositions (a: Position, b: Position): number {
	if (a.row !== b.row) {
		return a.row - b.row
	}
	return a.col - b.col
}

/**
 * Among neighbors of `anchor` with value === targetValue, pick the
 * lexicographically smallest position. Returns null if none.
 */
function pickChainNeighbor (
	board: Board,
	anchor: Position,
	targetValue: number,
): Position | null {
	const candidates = getOrthogonalNeighbors(anchor).filter((pos) => {
		return getCell(board, pos) === targetValue
	})
	if (candidates.length === 0) {
		return null
	}
	candidates.sort(comparePositions)
	return candidates[0] ?? null
}

/**
 * Apply primary merge at `to` after clearing `from`, then resolve chains.
 * Caller must already validate adjacency and equal values.
 */
export function applyMergeAndChain (
	board: Board,
	from: Position,
	to: Position,
	value: number,
): MergeChainResult {
	const events: GameEvent[] = []
	let scoreGain = 0
	let maxChainLevel = 1

	events.push({
		type: 'MOVE',
		from: { ...from },
		to: { ...to },
		value,
	})

	// Primary merge: clear source, write V+1 at target.
	let nextBoard = setCell(board, from, null)
	const primaryToValue = value + 1
	nextBoard = setCell(nextBoard, to, primaryToValue)

	events.push({
		type: 'MERGE',
		position: { ...to },
		fromValue: value,
		toValue: primaryToValue,
		chainLevel: 1,
	})
	scoreGain += scoreForStep(value, 1)

	let currentValue = primaryToValue
	let chainLevel = 1

	// One-at-a-time chain: absorb equal orthogonal neighbors deterministically.
	for (;;) {
		const neighbor = pickChainNeighbor(nextBoard, to, currentValue)
		if (!neighbor) {
			break
		}
		chainLevel += 1
		maxChainLevel = chainLevel
		const fromValue = currentValue
		const toValue = currentValue + 1
		nextBoard = setCell(nextBoard, neighbor, null)
		nextBoard = setCell(nextBoard, to, toValue)
		events.push({
			type: 'CHAIN_STEP',
			position: { ...to },
			absorbed: { ...neighbor },
			fromValue,
			toValue,
			chainLevel,
		})
		scoreGain += scoreForStep(fromValue, chainLevel)
		currentValue = toValue
	}

	return {
		board: nextBoard,
		events,
		scoreGain,
		maxChainLevel,
		finalValue: currentValue,
	}
}
