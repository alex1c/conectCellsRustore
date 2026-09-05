/**
 * Lightweight hex autoplay benchmark (separate from the default Jest suite).
 *
 * Run: npx jest src/game/__tests__/hex.benchmark.test.ts --testTimeout=120000
 */

import {
	applyMove,
	BOARD_COLS,
	BOARD_ROWS,
	countOccupied,
	createInitialGame,
	getReachableFrom,
	isGameOver,
	listOccupiedPositions,
	peekWouldMerge,
	type GameState,
	type Move,
} from '../index'
import { createRng, nextIndex } from '../random'
import { getCell } from '../board'

type PolicyId = 'randomMove' | 'mergeSeeking' | 'mobilityAware'

interface RunMetrics {
	moves: number
	score: number
	merges: number
	cascades: number
	largestValue: number
	largestGroup: number
	largestCascade: number
	cellsSpawned: number
	cellsCleared: number
	avgOccupied: number
	peakOccupied: number
	turnsWithoutMerge: number
	mergeMoveRatio: number
}

function listSomeMoves (state: GameState, limit = 40): Move[] {
	const moves: Move[] = []
	for (const from of listOccupiedPositions(state.board)) {
		const dests = getReachableFrom(
			state.board,
			from,
			BOARD_COLS,
			BOARD_ROWS,
		)
		for (const to of dests) {
			moves.push({ from, to })
			if (moves.length >= limit) {
				return moves
			}
		}
	}
	return moves
}

function chooseMove (
	state: GameState,
	policy: PolicyId,
	seed: number,
): Move | null {
	const moves = listSomeMoves(state)
	if (moves.length === 0) {
		return null
	}
	const rng = createRng((seed ^ (state.moveCount * 9973)) >>> 0)

	if (policy === 'randomMove') {
		return moves[nextIndex(rng, moves.length)] ?? null
	}

	if (policy === 'mergeSeeking') {
		const merging = moves.filter((move) =>
			peekWouldMerge(
				state.board,
				move.from,
				move.to,
				BOARD_COLS,
				BOARD_ROWS,
				state.rules.mergeThreshold,
			),
		)
		const pool = merging.length > 0 ? merging : moves
		return pool[nextIndex(rng, pool.length)] ?? null
	}

	// mobilityAware: sample up to 6 candidates, maximize empties after move.
	const sampleCount = Math.min(6, moves.length)
	let best: Move | null = null
	let bestScore = -Infinity
	for (let i = 0; i < sampleCount; i += 1) {
		const move = moves[nextIndex(rng, moves.length)]
		if (!move) {
			continue
		}
		const result = applyMove(state, move)
		if (!result.ok) {
			continue
		}
		const empties =
			BOARD_COLS * BOARD_ROWS - countOccupied(result.state.board)
		const mergeBonus = result.events.some((e) => e.type === 'MERGE') ? 3 : 0
		const score = empties * 2 + mergeBonus + result.state.score * 0.01
		if (score > bestScore) {
			bestScore = score
			best = move
		}
	}
	return best ?? moves[0] ?? null
}

function play (
	seed: number,
	policy: PolicyId,
	maxMoves = 120,
): RunMetrics {
	let state = createInitialGame(seed)
	let moves = 0
	let occupiedSum = 0
	let peakOccupied = countOccupied(state.board)
	let turnsWithoutMerge = 0
	let mergeMoves = 0

	while (!isGameOver(state) && moves < maxMoves) {
		const move = chooseMove(state, policy, seed)
		if (!move) {
			break
		}
		const result = applyMove(state, move)
		if (!result.ok) {
			break
		}
		const hadMerge = result.events.some((e) => e.type === 'MERGE')
		if (hadMerge) {
			mergeMoves += 1
		} else {
			turnsWithoutMerge += 1
		}
		state = result.state
		moves += 1
		const occ = countOccupied(state.board)
		occupiedSum += occ
		peakOccupied = Math.max(peakOccupied, occ)
	}

	return {
		moves,
		score: state.score,
		merges: state.merges,
		cascades: state.cascades,
		largestValue: state.largestValue,
		largestGroup: state.largestGroup,
		largestCascade: state.largestCascade,
		cellsSpawned: state.cellsSpawned,
		cellsCleared: state.cellsCleared,
		avgOccupied: moves > 0 ? occupiedSum / moves : countOccupied(state.board),
		peakOccupied,
		turnsWithoutMerge,
		mergeMoveRatio: moves > 0 ? mergeMoves / moves : 0,
	}
}

function avg (values: number[]): number {
	if (values.length === 0) {
		return 0
	}
	return values.reduce((a, b) => a + b, 0) / values.length
}

function median (values: number[]): number {
	if (values.length === 0) {
		return 0
	}
	const sorted = values.slice().sort((a, b) => a - b)
	return sorted[Math.floor(sorted.length / 2)] ?? 0
}

describe('hex benchmark', () => {
	it('summarizes 80 seeds across three policies', () => {
		const seedCount = 80
		const policies: PolicyId[] = [
			'randomMove',
			'mergeSeeking',
			'mobilityAware',
		]
		const summary: Record<string, unknown> = {}

		for (const policy of policies) {
			const runs: RunMetrics[] = []
			for (let i = 0; i < seedCount; i += 1) {
				runs.push(play(8000 + i, policy))
			}
			summary[policy] = {
				n: seedCount,
				avgMoves: Number(avg(runs.map((r) => r.moves)).toFixed(1)),
				medianMoves: median(runs.map((r) => r.moves)),
				avgScore: Number(avg(runs.map((r) => r.score)).toFixed(1)),
				avgMerges: Number(avg(runs.map((r) => r.merges)).toFixed(2)),
				avgCascades: Number(avg(runs.map((r) => r.cascades)).toFixed(2)),
				avgLargestValue: Number(
					avg(runs.map((r) => r.largestValue)).toFixed(2),
				),
				avgLargestGroup: Number(
					avg(runs.map((r) => r.largestGroup)).toFixed(2),
				),
				avgOccupied: Number(avg(runs.map((r) => r.avgOccupied)).toFixed(1)),
				peakOccupied: Number(avg(runs.map((r) => r.peakOccupied)).toFixed(1)),
				mergeMoveRatio: Number(
					avg(runs.map((r) => r.mergeMoveRatio)).toFixed(3),
				),
			}
		}

		console.log('[hex-benchmark]', JSON.stringify(summary, null, 2))
		expect(summary.randomMove).toBeDefined()
		void getCell
	})
})
