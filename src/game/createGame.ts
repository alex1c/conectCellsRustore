/**
 * Build custom hex GameState instances for fixtures / tests.
 */

import { cloneBoard, findLargestValue } from './board'
import { hasLegalMoves } from './moves'
import { createRng } from './random'
import { cloneHexRules, getDefaultHexRules } from './rules'
import type { Board, GameState } from './types'

export interface CustomGameOptions {
	board: Board
	seed?: number
	score?: number
	moveCount?: number
	largestGroup?: number
	largestCascade?: number
	merges?: number
	cascades?: number
	rngState?: number
}

export function createGameFromBoard (options: CustomGameOptions): GameState {
	const rules = getDefaultHexRules()
	const board = cloneBoard(options.board)
	rules.boardRows = board.length
	rules.boardCols = board[0]?.length ?? rules.boardCols
	const seed = options.seed ?? 1
	const status = hasLegalMoves(board, rules.boardCols, rules.boardRows)
		? 'playing'
		: 'game_over'
	return {
		board,
		score: options.score ?? 0,
		moveCount: options.moveCount ?? 0,
		status,
		rng: createRng(options.rngState ?? seed),
		seed,
		largestValue: findLargestValue(board),
		largestGroup: options.largestGroup ?? 0,
		largestCascade: options.largestCascade ?? 0,
		merges: options.merges ?? 0,
		cascades: options.cascades ?? 0,
		cellsSpawned: 0,
		cellsCleared: 0,
		rules: cloneHexRules(rules),
		undoSnapshot: null,
	}
}

export function createFreshSeed (): number {
	const timePart = Date.now() >>> 0
	const noise = Math.floor(Math.random() * 0xffffffff) >>> 0
	return (timePart ^ noise) >>> 0
}

export function createEmptyHexBoard (
	cols = getDefaultHexRules().boardCols,
	rows = getDefaultHexRules().boardRows,
): Board {
	const board: Board = []
	for (let row = 0; row < rows; row += 1) {
		const line: (number | null)[] = []
		for (let col = 0; col < cols; col += 1) {
			line.push(null)
		}
		board.push(line)
	}
	return board
}
