/**
 * Deterministic autoplay policies and benchmark helpers for rule tuning.
 * Does not mutate input states; each applyMove returns a new state.
 */

import {
	applyMove,
	cloneGameState,
	createInitialGame,
	getLegalMoves,
	isGameOver,
	type GameState,
	type Move,
} from '../index'
import { createRng, nextIndex } from '../random'
import type { RulePresetId } from '../rules'

export type AutoplayPolicyId =
	| 'firstLegal'
	| 'randomLegal'
	| 'greedyScore'
	| 'mobility'

export const AUTOPLAY_POLICY_IDS: AutoplayPolicyId[] = [
	'firstLegal',
	'randomLegal',
	'greedyScore',
	'mobility',
]

export interface GameRunMetrics {
	moves: number
	finalScore: number
	largestValue: number
	largestChain: number
	chainMoves: number
	avgLegalChoices: number
}

export interface AggregateMetrics {
	n: number
	avgMoves: number
	medianMoves: number
	p10Moves: number
	p90Moves: number
	minMoves: number
	maxMoves: number
	avgScore: number
	avgLargestValue: number
	avgLargestChain: number
	avgChainMoves: number
	avgLegalChoices: number
	pctUnder10: number
	pctOver25: number
	pctOver50: number
}

function undirectedChoiceCount (legal: Move[]): number {
	return legal.length / 2
}

/**
 * Choose a move without mutating `state`.
 * randomLegal uses an independent RNG so game RNG is not polluted by policy.
 */
export function chooseMove (
	state: GameState,
	policy: AutoplayPolicyId,
	policySeed: number,
): Move | null {
	const legal = getLegalMoves(state)
	if (legal.length === 0) {
		return null
	}

	if (policy === 'firstLegal') {
		return legal[0] ?? null
	}

	if (policy === 'randomLegal') {
		const rng = createRng(
			(policySeed ^ (state.moveCount * 2654435761) ^ state.seed) >>> 0,
		)
		return legal[nextIndex(rng, legal.length)] ?? null
	}

	if (policy === 'greedyScore') {
		let best: Move | null = null
		let bestScore = -1
		let bestChain = -1
		for (const move of legal) {
			const result = applyMove(state, move)
			if (!result.ok) {
				continue
			}
			const gain = result.state.score - state.score
			const chain = result.events.reduce((max, event) => {
				if (event.type === 'MERGE' || event.type === 'CHAIN_STEP') {
					return Math.max(max, event.chainLevel)
				}
				return max
			}, 1)
			if (
				gain > bestScore ||
				(gain === bestScore && chain > bestChain)
			) {
				bestScore = gain
				bestChain = chain
				best = move
			}
		}
		return best
	}

	// mobility: maximize undirected legal moves after the move.
	let best: Move | null = null
	let bestMobility = -1
	let bestScore = -1
	for (const move of legal) {
		const result = applyMove(state, move)
		if (!result.ok) {
			continue
		}
		const mobility = undirectedChoiceCount(getLegalMoves(result.state))
		const gain = result.state.score - state.score
		if (
			mobility > bestMobility ||
			(mobility === bestMobility && gain > bestScore)
		) {
			bestMobility = mobility
			bestScore = gain
			best = move
		}
	}
	return best
}

/** Play one complete game; never mutates caller-owned state. */
export function playGame (
	seed: number,
	rulesetId: RulePresetId,
	policy: AutoplayPolicyId,
	maxMoves = 500,
): GameRunMetrics {
	let state = createInitialGame(seed, rulesetId)
	let moves = 0
	let chainMoves = 0
	let choiceSum = 0

	while (!isGameOver(state) && moves < maxMoves) {
		const legal = getLegalMoves(state)
		if (legal.length === 0) {
			break
		}
		choiceSum += undirectedChoiceCount(legal)
		const previous = cloneGameState(state)
		const move = chooseMove(state, policy, seed)
		if (!move) {
			break
		}
		const result = applyMove(state, move)
		// Policy evaluation and applyMove must not mutate the pre-move state.
		if (JSON.stringify(previous.board) !== JSON.stringify(state.board)) {
			throw new Error('playGame: state was mutated before apply')
		}
		if (!result.ok) {
			break
		}
		const chain = result.events.reduce((max, event) => {
			if (event.type === 'MERGE' || event.type === 'CHAIN_STEP') {
				return Math.max(max, event.chainLevel)
			}
			return max
		}, 1)
		if (chain >= 2) {
			chainMoves += 1
		}
		state = result.state
		moves += 1
	}

	return {
		moves,
		finalScore: state.score,
		largestValue: state.largestValue,
		largestChain: state.largestChain,
		chainMoves,
		avgLegalChoices: moves > 0 ? choiceSum / moves : 0,
	}
}

function percentile (sorted: number[], p: number): number {
	if (sorted.length === 0) {
		return 0
	}
	const idx = Math.min(
		sorted.length - 1,
		Math.max(0, Math.floor((p / 100) * (sorted.length - 1))),
	)
	return sorted[idx] ?? 0
}

export function aggregateMetrics (runs: GameRunMetrics[]): AggregateMetrics {
	const n = runs.length
	const moves = runs.map((r) => r.moves).sort((a, b) => a - b)
	const avg = (pick: (r: GameRunMetrics) => number) =>
		n === 0 ? 0 : runs.reduce((sum, r) => sum + pick(r), 0) / n

	return {
		n,
		avgMoves: avg((r) => r.moves),
		medianMoves: percentile(moves, 50),
		p10Moves: percentile(moves, 10),
		p90Moves: percentile(moves, 90),
		minMoves: moves[0] ?? 0,
		maxMoves: moves[moves.length - 1] ?? 0,
		avgScore: avg((r) => r.finalScore),
		avgLargestValue: avg((r) => r.largestValue),
		avgLargestChain: avg((r) => r.largestChain),
		avgChainMoves: avg((r) => r.chainMoves),
		avgLegalChoices: avg((r) => r.avgLegalChoices),
		pctUnder10: n === 0 ? 0 : (runs.filter((r) => r.moves < 10).length / n) * 100,
		pctOver25: n === 0 ? 0 : (runs.filter((r) => r.moves > 25).length / n) * 100,
		pctOver50: n === 0 ? 0 : (runs.filter((r) => r.moves > 50).length / n) * 100,
	}
}

export interface BenchmarkCell {
	preset: RulePresetId
	policy: AutoplayPolicyId
	metrics: AggregateMetrics
}

/**
 * Run a full preset × policy matrix.
 * Seeds are deterministic: baseSeed + i.
 */
export function runBenchmarkMatrix (options: {
	presets: RulePresetId[]
	policies: AutoplayPolicyId[]
	seedCount: number
	baseSeed?: number
	maxMoves?: number
}): BenchmarkCell[] {
	const baseSeed = options.baseSeed ?? 1000
	const cells: BenchmarkCell[] = []
	for (const preset of options.presets) {
		for (const policy of options.policies) {
			const runs: GameRunMetrics[] = []
			for (let i = 0; i < options.seedCount; i += 1) {
				runs.push(
					playGame(
						baseSeed + i,
						preset,
						policy,
						options.maxMoves ?? 500,
					),
				)
			}
			cells.push({
				preset,
				policy,
				metrics: aggregateMetrics(runs),
			})
		}
	}
	return cells
}

/** Format a compact row for console / report. */
export function formatMetricsRow (
	preset: string,
	policy: string,
	m: AggregateMetrics,
): string {
	return [
		preset.padEnd(14),
		policy.padEnd(12),
		`med=${m.medianMoves.toFixed(0)}`.padEnd(8),
		`avg=${m.avgMoves.toFixed(1)}`.padEnd(9),
		`<10=${m.pctUnder10.toFixed(0)}%`.padEnd(8),
		`>25=${m.pctOver25.toFixed(0)}%`.padEnd(8),
		`>50=${m.pctOver50.toFixed(0)}%`.padEnd(8),
		`chain=${m.avgLargestChain.toFixed(2)}`.padEnd(12),
		`cm=${m.avgChainMoves.toFixed(1)}`.padEnd(8),
		`score=${m.avgScore.toFixed(0)}`,
	].join(' ')
}
