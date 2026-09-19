/**
 * Post-turn spawn placement.
 * Spawn never auto-triggers merge resolution — turn ends after spawn.
 */

import { listEmptyPositions, setCell } from './board'
import { nextIndex } from './random'
import type { HexRules } from './rules'
import { pickWeighted } from './weighted'
import type { Board, GameEvent, Position, RngState } from './types'

export interface SpawnResult {
	board: Board
	rng: RngState
	events: GameEvent[]
	spawned: number
	spawnedValues: number[]
}

/**
 * Place up to `desiredCount` cells on empty hexes using rules.spawnValueWeights.
 * Free-cell edge cases: spawn min(desired, empties); 0 empties → 0 spawn.
 */
export function spawnCells (
	board: Board,
	rng: RngState,
	rules: HexRules,
	desiredCount: number,
): SpawnResult {
	const empties = listEmptyPositions(board)
	if (empties.length === 0 || desiredCount <= 0) {
		return { board, rng, events: [], spawned: 0, spawnedValues: [] }
	}

	const count = Math.min(desiredCount, empties.length)
	const remaining = empties.slice()
	const placed: { position: Position; value: number }[] = []
	const spawnedValues: number[] = []
	let nextBoard = board

	for (let i = 0; i < count; i += 1) {
		const index = nextIndex(rng, remaining.length)
		const position = remaining[index]
		if (!position) {
			break
		}
		remaining.splice(index, 1)
		const value = pickWeighted(rng, rules.spawnValueWeights)
		nextBoard = setCell(nextBoard, position, value)
		placed.push({ position: { ...position }, value })
		spawnedValues.push(value)
	}

	if (placed.length === 0) {
		return {
			board: nextBoard,
			rng,
			events: [],
			spawned: 0,
			spawnedValues: [],
		}
	}

	return {
		board: nextBoard,
		rng,
		spawned: placed.length,
		spawnedValues,
		events: [{ type: 'SPAWN', cells: placed }],
	}
}
