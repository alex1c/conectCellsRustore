/**
 * Progression-aware autoplay benchmark (Phase 2.8).
 * Reports final levels, spawn/occupancy pressure by level, Game Over distribution.
 * Run: npm run test:benchmark:levels
 */

import {
	applyMove,
	BOARD_COLS,
	BOARD_ROWS,
	countOccupied,
	createInitialGame,
	getLevelForScore,
	getReachableFrom,
	isGameOver,
	listOccupiedPositions,
	peekWouldMerge,
	type GameState,
	type Move,
} from '../src/game'
import { createRng, nextIndex } from '../src/game/random'

interface LevelBucket {
	turns: number
	occupiedSum: number
	spawnSum: number
	mergeTurns: number
}

interface RunMetrics {
	moves: number
	score: number
	finalLevel: number
	gameOverLevel: number | null
	capped: boolean
	merges: number
	cellsSpawned: number
	avgOccupied: number
	byLevel: Record<number, LevelBucket>
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

function emptyBucket (): LevelBucket {
	return {
		turns: 0,
		occupiedSum: 0,
		spawnSum: 0,
		mergeTurns: 0,
	}
}

function play (seed: number, maxMoves = 200): RunMetrics {
	let state = createInitialGame(seed, 'observedPressure')
	let moves = 0
	let occupiedSum = 0
	const byLevel: Record<number, LevelBucket> = {}

	while (!isGameOver(state) && moves < maxMoves) {
		const move = chooseMove(state, seed)
		if (!move) {
			break
		}
		const levelBefore = getLevelForScore(state.score)
		const result = applyMove(state, move)
		if (!result.ok || !result.turn) {
			break
		}
		state = result.state
		moves += 1
		const occ = countOccupied(state.board)
		occupiedSum += occ

		const bucket = byLevel[levelBefore] ?? emptyBucket()
		bucket.turns += 1
		bucket.occupiedSum += occ
		bucket.spawnSum += result.turn.spawnCount
		if (result.turn.mergeOccurred) {
			bucket.mergeTurns += 1
		}
		byLevel[levelBefore] = bucket
	}

	const finalLevel = getLevelForScore(state.score)
	return {
		moves,
		score: state.score,
		finalLevel,
		gameOverLevel: isGameOver(state) ? finalLevel : null,
		capped: moves >= maxMoves && !isGameOver(state),
		merges: state.merges,
		cellsSpawned: state.cellsSpawned,
		avgOccupied:
			moves > 0 ? occupiedSum / moves : countOccupied(state.board),
		byLevel,
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

function summarizeLevelPressure (runs: RunMetrics[]) {
	const totals: Record<
		number,
		{ turns: number; occ: number; spawn: number; merges: number }
	> = {}
	for (const run of runs) {
		for (const [levelKey, bucket] of Object.entries(run.byLevel)) {
			const level = Number(levelKey)
			const acc = totals[level] ?? {
				turns: 0,
				occ: 0,
				spawn: 0,
				merges: 0,
			}
			acc.turns += bucket.turns
			acc.occ += bucket.occupiedSum
			acc.spawn += bucket.spawnSum
			acc.merges += bucket.mergeTurns
			totals[level] = acc
		}
	}
	const out: Record<string, unknown> = {}
	for (const level of Object.keys(totals)
		.map(Number)
		.sort((a, b) => a - b)) {
		const acc = totals[level]!
		out[`L${level}`] = {
			turns: acc.turns,
			avgOccupied: Number((acc.occ / Math.max(1, acc.turns)).toFixed(2)),
			avgSpawn: Number((acc.spawn / Math.max(1, acc.turns)).toFixed(3)),
			mergePct: Number(
				((100 * acc.merges) / Math.max(1, acc.turns)).toFixed(1),
			),
		}
	}
	return out
}

function gameOverDistribution (runs: RunMetrics[]) {
	const counts: Record<number, number> = {}
	let overs = 0
	for (const run of runs) {
		if (run.gameOverLevel === null) {
			continue
		}
		overs += 1
		counts[run.gameOverLevel] = (counts[run.gameOverLevel] ?? 0) + 1
	}
	const out: Record<string, number> = {}
	for (const level of Object.keys(counts)
		.map(Number)
		.sort((a, b) => a - b)) {
		out[`L${level}`] = counts[level]!
	}
	return { gameOvers: overs, byLevel: out }
}

const seedCount = 100
const runs: RunMetrics[] = []
for (let i = 0; i < seedCount; i += 1) {
	runs.push(play(11000 + i))
}

const finalLevels = runs.map((r) => r.finalLevel)
const summary = {
	policy: 'mergeSeeking',
	preset: 'observedPressure',
	seedCount,
	medianFinalLevel: median(finalLevels),
	avgFinalLevel: Number(avg(finalLevels).toFixed(2)),
	maxFinalLevel: Math.max(...finalLevels),
	medianMoves: median(runs.map((r) => r.moves)),
	avgMoves: Number(avg(runs.map((r) => r.moves)).toFixed(1)),
	avgScore: Number(avg(runs.map((r) => r.score)).toFixed(1)),
	avgSpawned: Number(avg(runs.map((r) => r.cellsSpawned)).toFixed(1)),
	avgOccupied: Number(avg(runs.map((r) => r.avgOccupied)).toFixed(2)),
	pctCapped: Number(
		((100 * runs.filter((r) => r.capped).length) / runs.length).toFixed(1),
	),
	gameOver: gameOverDistribution(runs),
	pressureByLevel: summarizeLevelPressure(runs),
}

console.log('[level-progression-benchmark]', JSON.stringify(summary, null, 2))
