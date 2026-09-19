/**
 * Standalone spawn-pressure comparison (phase26 vs observedPressure).
 * Run: npx tsx scripts/spawn-pressure-benchmark.ts
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
	type RulePresetId,
} from '../src/game'
import { createRng, nextIndex } from '../src/game/random'

type PolicyId = 'mergeSeeking'

interface RunMetrics {
	moves: number
	score: number
	merges: number
	cascades: number
	largestValue: number
	cellsSpawned: number
	avgOccupied: number
	peakOccupied: number
	mergeMoveRatio: number
	capped: boolean
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

function chooseMove (state: GameState, seed: number): Move | null {
	const moves = listSomeMoves(state)
	if (moves.length === 0) {
		return null
	}
	const rng = createRng((seed ^ (state.moveCount * 9973)) >>> 0)
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

function play (
	seed: number,
	presetId: RulePresetId,
	maxMoves = 120,
): RunMetrics {
	let state = createInitialGame(seed, presetId)
	let moves = 0
	let occupiedSum = 0
	let peakOccupied = countOccupied(state.board)
	let mergeMoves = 0

	while (!isGameOver(state) && moves < maxMoves) {
		const move = chooseMove(state, seed)
		if (!move) {
			break
		}
		const result = applyMove(state, move)
		if (!result.ok) {
			break
		}
		if (result.turn?.mergeOccurred) {
			mergeMoves += 1
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
		cellsSpawned: state.cellsSpawned,
		avgOccupied: moves > 0 ? occupiedSum / moves : countOccupied(state.board),
		peakOccupied,
		mergeMoveRatio: moves > 0 ? mergeMoves / moves : 0,
		capped: moves >= maxMoves && !isGameOver(state),
	}
}

function avg (values: number[]): number {
	return values.length === 0
		? 0
		: values.reduce((a, b) => a + b, 0) / values.length
}

function median (values: number[]): number {
	if (values.length === 0) {
		return 0
	}
	const sorted = values.slice().sort((a, b) => a - b)
	return sorted[Math.floor(sorted.length / 2)] ?? 0
}

function summarize (runs: RunMetrics[]) {
	return {
		n: runs.length,
		medianMoves: median(runs.map((r) => r.moves)),
		avgMoves: Number(avg(runs.map((r) => r.moves)).toFixed(1)),
		pctCapped: Number(
			((100 * runs.filter((r) => r.capped).length) / runs.length).toFixed(
				1,
			),
		),
		avgScore: Number(avg(runs.map((r) => r.score)).toFixed(1)),
		avgMerges: Number(avg(runs.map((r) => r.merges)).toFixed(2)),
		avgCascades: Number(avg(runs.map((r) => r.cascades)).toFixed(2)),
		mergeMovePct: Number(
			(100 * avg(runs.map((r) => r.mergeMoveRatio))).toFixed(1),
		),
		avgOccupied: Number(avg(runs.map((r) => r.avgOccupied)).toFixed(1)),
		peakOccupied: Number(avg(runs.map((r) => r.peakOccupied)).toFixed(1)),
		avgSpawned: Number(avg(runs.map((r) => r.cellsSpawned)).toFixed(1)),
		avgLargestValue: Number(
			avg(runs.map((r) => r.largestValue)).toFixed(2),
		),
	}
}

const seedCount = 100
const policy: PolicyId = 'mergeSeeking'
const presets: RulePresetId[] = ['phase26', 'observedPressure']
const summary: Record<string, unknown> = { policy, seedCount }

for (const preset of presets) {
	const runs: RunMetrics[] = []
	for (let i = 0; i < seedCount; i += 1) {
		runs.push(play(9000 + i, preset))
	}
	summary[preset] = summarize(runs)
}

console.log('[spawn-pressure-benchmark]', JSON.stringify(summary, null, 2))
