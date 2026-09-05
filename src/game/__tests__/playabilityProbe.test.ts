/**
 * Lightweight playability probe used during Phase 2 review.
 * Runs deterministic seed sweeps through the pure engine (no UI).
 */

import {
	applyMove,
	createInitialGame,
	getLegalMoves,
	isGameOver,
} from '../index'

function playSeed (seed: number) {
	let state = createInitialGame(seed)
	const startLegal = getLegalMoves(state).length
	let moves = 0
	let chainMoves = 0
	let choiceSum = 0

	while (!isGameOver(state) && moves < 500) {
		const legal = getLegalMoves(state)
		if (legal.length === 0) {
			break
		}
		// Count undirected pairs roughly (legal list has both orientations).
		const undirected = legal.length / 2
		choiceSum += undirected
		const move = legal[moves % legal.length]
		if (!move) {
			break
		}
		const result = applyMove(state, move)
		if (!result.ok) {
			break
		}
		const maxChain = result.events.reduce((max, event) => {
			if (event.type === 'MERGE' || event.type === 'CHAIN_STEP') {
				return Math.max(max, event.chainLevel)
			}
			return max
		}, 1)
		if (maxChain >= 2) {
			chainMoves += 1
		}
		state = result.state
		moves += 1
	}

	return {
		seed,
		moves,
		score: state.score,
		largest: state.largestValue,
		largestChain: state.largestChain,
		chainMoves,
		startLegal,
		avgChoices: moves > 0 ? choiceSum / moves : 0,
	}
}

describe('playability probe (informational)', () => {
	it('summarizes 40 seeded autoplay runs', () => {
		const samples: ReturnType<typeof playSeed>[] = []
		for (let i = 1; i <= 40; i += 1) {
			samples.push(playSeed(i * 97))
		}
		const avg = (pick: (s: ReturnType<typeof playSeed>) => number) =>
			samples.reduce((sum, sample) => sum + pick(sample), 0) / samples.length

		const summary = {
			n: samples.length,
			avgMoves: Number(avg((s) => s.moves).toFixed(1)),
			avgScore: Number(avg((s) => s.score).toFixed(1)),
			avgLargest: Number(avg((s) => s.largest).toFixed(2)),
			avgLargestChain: Number(avg((s) => s.largestChain).toFixed(2)),
			avgChainMoves: Number(avg((s) => s.chainMoves).toFixed(2)),
			avgStartLegalPairs: Number(avg((s) => s.startLegal / 2).toFixed(1)),
			avgChoicesPerTurn: Number(avg((s) => s.avgChoices).toFixed(2)),
			minMoves: Math.min(...samples.map((s) => s.moves)),
			maxMoves: Math.max(...samples.map((s) => s.moves)),
			shortGamesUnder8: samples.filter((s) => s.moves < 8).length,
			noChainGames: samples.filter((s) => s.chainMoves === 0).length,
		}

		// Soft expectations: engine stays stable; numbers are for the report.
		expect(summary.n).toBe(40)
		expect(summary.minMoves).toBeGreaterThanOrEqual(0)
		console.log('[playability]', JSON.stringify(summary))
	})
})
