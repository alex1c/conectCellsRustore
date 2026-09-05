/**
 * Post-turn spawn — only when the move produced no merges.
 * Spawn never auto-triggers merge resolution.
 */

import { listEmptyPositions, setCell } from './board'
import { nextIndex } from './random'
import type { HexRules } from './rules'
import { pickWeighted, pickWeightedCount } from './weighted'
import type { Board, GameEvent, Position, RngState } from './types'

export interface SpawnResult {
	board: Board
	rng: RngState
	events: GameEvent[]
	spawned: number
}

export function spawnCells (
	board: Board,
	rng: RngState,
	rules: HexRules,
): SpawnResult {
	const empties = listEmptyPositions(board)
	if (empties.length === 0) {
		return { board, rng, events: [], spawned: 0 }
	}

	const desired = pickWeightedCount(rng, rules.spawnCountWeights)
	const count = Math.min(desired, empties.length)
	const remaining = empties.slice()
	const placed: { position: Position; value: number }[] = []
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
	}

	if (placed.length === 0) {
		return { board: nextBoard, rng, events: [], spawned: 0 }
	}

	return {
		board: nextBoard,
		rng,
		spawned: placed.length,
		events: [{ type: 'SPAWN', cells: placed }],
	}
}
