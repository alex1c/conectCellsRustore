/**
 * Read-only selectors over game state for UI / tests.
 */

import { boardSizeOf, getCell } from './board'
import { hasLegalMoves, listLegalMoves } from './moves'
import type { GameState, Move, Position } from './types'

export function selectScore (state: GameState): number {
	return state.score
}

export function selectStatus (state: GameState): GameState['status'] {
	return state.status
}

export function selectMoveCount (state: GameState): number {
	return state.moveCount
}

export function selectLargestValue (state: GameState): number {
	return state.largestValue
}

export function selectLargestChain (state: GameState): number {
	return state.largestChain
}

export function selectLegalMoves (state: GameState): Move[] {
	return listLegalMoves(state.board)
}

export function selectHasLegalMoves (state: GameState): boolean {
	return hasLegalMoves(state.board)
}

export function selectCellAt (state: GameState, position: Position) {
	return getCell(state.board, position)
}

export function selectBoardSize (state: GameState): number {
	return state.rules.boardSize
}

export function selectRulesetId (state: GameState): GameState['rulesetId'] {
	return state.rulesetId
}

export function isGameOver (state: GameState): boolean {
	return state.status === 'game_over'
}

export function canUndo (state: GameState): boolean {
	return state.undoSnapshot !== null
}

export function selectBoardMatrixSize (state: GameState): number {
	return boardSizeOf(state.board)
}
