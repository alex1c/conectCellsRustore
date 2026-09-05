/**
 * Build GameState instances from explicit boards (fixtures / screenshot seeds).
 */

import { cloneBoard, findLargestValue } from './board'
import { hasLegalMoves } from './moves'
import { createRng } from './random'
import {
	cloneRules,
	DEFAULT_RULE_PRESET,
	getRulesForPreset,
	type RulePresetId,
} from './rules'
import type { Board, GameState } from './types'

export interface CustomGameOptions {
	board: Board
	seed?: number
	score?: number
	moveCount?: number
	largestChain?: number
	rngState?: number
	rulesetId?: RulePresetId
}

/**
 * Create a serializable GameState from a hand-crafted board.
 * Status is derived from whether legal moves exist.
 */
export function createGameFromBoard (options: CustomGameOptions): GameState {
	const seed = options.seed ?? 1
	const board = cloneBoard(options.board)
	const rulesetId = options.rulesetId ?? DEFAULT_RULE_PRESET
	const rules = getRulesForPreset(rulesetId)
	// Fixtures may use a board sized for the preset; keep rules.boardSize aligned.
	rules.boardSize = board.length
	const largestValue = findLargestValue(board)
	const status = hasLegalMoves(board) ? 'playing' : 'game_over'
	return {
		board,
		score: options.score ?? 0,
		moveCount: options.moveCount ?? 0,
		status,
		rng: createRng(options.rngState ?? seed),
		seed,
		largestValue,
		largestChain: options.largestChain ?? 0,
		rulesetId,
		rules: cloneRules(rules),
		undoSnapshot: null,
	}
}

/** Non-cryptographic seed for fresh player runs (outside engine RNG). */
export function createFreshSeed (): number {
	const timePart = Date.now() >>> 0
	const noise = Math.floor(Math.random() * 0xffffffff) >>> 0
	return (timePart ^ noise) >>> 0
}
