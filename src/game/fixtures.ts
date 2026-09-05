/**
 * Deterministic gameplay / screenshot fixtures.
 * Use only from development tools — not production navigation.
 */

import { createGameFromBoard } from './createGame'
import type { Board, Cell, GameState } from './types'

function fill (
	size: number,
	factory: (row: number, col: number) => Cell,
): Board {
	const board: Board = []
	for (let row = 0; row < size; row += 1) {
		const line: Cell[] = []
		for (let col = 0; col < size; col += 1) {
			line.push(factory(row, col))
		}
		board.push(line)
	}
	return board
}

/** Checker-ish balanced board with several merge options. */
export function fixtureBalancedBoard (): GameState {
	return createGameFromBoard({
		seed: 1001,
		score: 120,
		moveCount: 4,
		board: [
			[1, 1, 2, 3, 1],
			[2, 3, 1, 2, 3],
			[1, 2, 2, 1, 2],
			[3, 1, 3, 3, 1],
			[2, 3, 1, 2, 2],
		],
	})
}

/** Two equal cells ready for a one-step merge (no chain). */
export function fixtureSimpleMerge (): GameState {
	return createGameFromBoard({
		seed: 1002,
		board: [
			[1, 1, 3, 4, 5],
			[6, 7, 8, 9, 2],
			[2, 3, 4, 5, 6],
			[3, 4, 5, 6, 7],
			[4, 5, 6, 7, 8],
		],
	})
}

/** Merge of 1+1 next to a 2 → visible chain length 2. */
export function fixtureChain2 (): GameState {
	return createGameFromBoard({
		seed: 1003,
		board: [
			[1, 1, 2, 4, 5],
			[6, 7, 8, 9, 3],
			[2, 3, 4, 5, 6],
			[3, 4, 5, 6, 7],
			[4, 5, 6, 7, 8],
		],
	})
}

/** Longer chain: 1+1 → 2 → 3 → 4. */
export function fixtureChain3 (): GameState {
	return createGameFromBoard({
		seed: 1004,
		board: [
			[1, 1, 2, 3, 5],
			[6, 7, 8, 9, 4],
			[2, 4, 5, 6, 7],
			[3, 5, 6, 7, 8],
			[4, 6, 7, 8, 9],
		],
	})
}

/** High values for visual / layout stress. */
export function fixtureHighValues (): GameState {
	return createGameFromBoard({
		seed: 1005,
		score: 9000,
		moveCount: 40,
		largestChain: 5,
		board: [
			[8, 7, 6, 5, 4],
			[7, 8, 5, 6, 3],
			[6, 5, 9, 4, 2],
			[5, 6, 4, 8, 7],
			[4, 3, 2, 7, 8],
		],
	})
}

/** High score presentation board with open merges. */
export function fixtureHighScore (): GameState {
	return createGameFromBoard({
		seed: 1006,
		score: 12840,
		moveCount: 55,
		largestChain: 4,
		board: [
			[4, 4, 2, 3, 1],
			[2, 5, 5, 1, 3],
			[1, 3, 6, 2, 4],
			[3, 1, 2, 6, 5],
			[2, 4, 1, 3, 2],
		],
	})
}

/** Only one legal pair remains — next spawn may end the run. */
export function fixtureNearGameOver (): GameState {
	return createGameFromBoard({
		seed: 1007,
		score: 640,
		moveCount: 18,
		board: [
			[1, 2, 1, 2, 1],
			[2, 1, 2, 1, 2],
			[1, 2, 3, 3, 1],
			[2, 1, 2, 1, 2],
			[1, 2, 1, 2, 1],
		],
	})
}

/** No legal adjacent equals — immediate game over. */
export function fixtureGameOver (): GameState {
	return createGameFromBoard({
		seed: 1008,
		score: 2100,
		moveCount: 30,
		largestChain: 3,
		board: fill(5, (row, col) => ((row + col) % 2 === 0 ? 1 : 2)),
	})
}

/** Big chain setup for screenshot / animation demos. */
export function fixtureBigChain (): GameState {
	return createGameFromBoard({
		seed: 1009,
		score: 500,
		moveCount: 12,
		board: [
			[1, 1, 2, 3, 4],
			[5, 6, 7, 8, 5],
			[2, 3, 4, 5, 6],
			[3, 4, 5, 6, 7],
			[4, 5, 6, 7, 8],
		],
	})
}

export type FixtureId =
	| 'balancedBoard'
	| 'simpleMerge'
	| 'chain2'
	| 'chain3'
	| 'nearGameOver'
	| 'gameOver'
	| 'highValues'
	| 'highScore'
	| 'bigChain'

export const FIXTURE_BUILDERS: Record<FixtureId, () => GameState> = {
	balancedBoard: fixtureBalancedBoard,
	simpleMerge: fixtureSimpleMerge,
	chain2: fixtureChain2,
	chain3: fixtureChain3,
	nearGameOver: fixtureNearGameOver,
	gameOver: fixtureGameOver,
	highValues: fixtureHighValues,
	highScore: fixtureHighScore,
	bigChain: fixtureBigChain,
}

export function loadFixture (id: FixtureId): GameState {
	const builder = FIXTURE_BUILDERS[id]
	return builder()
}

export const FIXTURE_IDS = Object.keys(FIXTURE_BUILDERS) as FixtureId[]
