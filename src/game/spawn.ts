/**
 * Deterministic spawn helpers driven by GameRules.
 */

import { listEmptyPositions, setCell } from './board'
import { nextFloat, nextIndex } from './random'
import type { GameRules } from './rules'
import type { Board, GameEvent, RngState } from './types'

export interface SpawnResult {
	board: Board
	events: GameEvent[]
	rng: RngState
	didSpawn: boolean
}

/** Pick a spawn value from weighted table using RNG. */
export function pickSpawnValue (rng: RngState, rules: GameRules): number {
	const weights = rules.spawnWeights
	if (weights.length === 0) {
		return rules.minCellValue
	}
	let total = 0
	for (const entry of weights) {
		total += entry.weight
	}
	if (total <= 0) {
		return weights[0]?.value ?? rules.minCellValue
	}
	let roll = nextFloat(rng) * total
	for (const entry of weights) {
		roll -= entry.weight
		if (roll < 0) {
			return entry.value
		}
	}
	return weights[weights.length - 1]?.value ?? rules.minCellValue
}

/**
 * Maybe spawn one cell after settle.
 * Always consumes one RNG float for the probability check when empties exist,
 * then additional RNG only if a spawn occurs.
 */
export function maybeSpawn (
	board: Board,
	rng: RngState,
	rules: GameRules,
): SpawnResult {
	const empties = listEmptyPositions(board)
	if (empties.length === 0) {
		return { board, events: [], rng, didSpawn: false }
	}

	// Skip the probability roll when spawn is guaranteed / impossible so
	// baseline (probability 1) keeps the Phase 2 RNG stream.
	if (rules.spawnProbability <= 0) {
		return { board, events: [], rng, didSpawn: false }
	}
	if (rules.spawnProbability < 1) {
		const roll = nextFloat(rng)
		if (roll >= rules.spawnProbability) {
			return { board, events: [], rng, didSpawn: false }
		}
	}

	const index = nextIndex(rng, empties.length)
	const spawnAt = empties[index]
	if (!spawnAt) {
		return { board, events: [], rng, didSpawn: false }
	}
	const value = pickSpawnValue(rng, rules)
	const nextBoard = setCell(board, spawnAt, value)
	return {
		board: nextBoard,
		rng,
		didSpawn: true,
		events: [
			{
				type: 'SPAWN',
				position: { ...spawnAt },
				value,
			},
		],
	}
}
