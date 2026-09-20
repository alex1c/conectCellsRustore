/**
 * Deterministic 6×8 tutorial boards — isolated from the live party.
 * Geometry matches production hex rules; no persistence / best / ads.
 */

import {
	createEmptyHexBoard,
	createGameFromBoard,
	setCell,
	type Board,
	type GameState,
	type Position,
} from '../../game'

function boardFromSparse (
	cells: { row: number; col: number; value: number }[],
): Board {
	let board = createEmptyHexBoard()
	for (const cell of cells) {
		board = setCell(board, { row: cell.row, col: cell.col }, cell.value)
	}
	return board
}

/** Step 1–2: select one `1`, move to a neighboring empty. */
export const TUTORIAL_SELECT_CELL: Position = { row: 3, col: 2 }
export const TUTORIAL_MOVE_DEST: Position = { row: 3, col: 3 }

export function buildSelectMoveBoard (): GameState {
	return createGameFromBoard({
		seed: 9101,
		score: 0,
		moveCount: 0,
		board: boardFromSparse([
			{ row: 3, col: 2, value: 1 },
			{ row: 0, col: 0, value: 2 },
			{ row: 0, col: 5, value: 2 },
			{ row: 7, col: 0, value: 1 },
			{ row: 7, col: 5, value: 1 },
		]),
	})
}

/**
 * Step merge: three connected `1`s + remote movable `1`.
 * Move (1,1) → (3,1) completes a group of 4 → result `4`.
 */
export const TUTORIAL_MERGE_FROM: Position = { row: 1, col: 1 }
export const TUTORIAL_MERGE_DEST: Position = { row: 3, col: 1 }
export const TUTORIAL_MERGE_GROUP: Position[] = [
	{ row: 3, col: 2 },
	{ row: 3, col: 3 },
	{ row: 4, col: 2 },
]

export function buildMergeSetupBoard (): GameState {
	return createGameFromBoard({
		seed: 9102,
		score: 0,
		moveCount: 0,
		board: boardFromSparse([
			{ row: 1, col: 1, value: 1 },
			{ row: 3, col: 2, value: 1 },
			{ row: 3, col: 3, value: 1 },
			{ row: 4, col: 2, value: 1 },
			{ row: 0, col: 5, value: 2 },
			{ row: 7, col: 5, value: 2 },
		]),
	})
}

/** Visual for large-group tip — five connected `1`s already on board. */
export function buildLargeGroupBoard (): GameState {
	return createGameFromBoard({
		seed: 9103,
		score: 0,
		board: boardFromSparse([
			{ row: 3, col: 2, value: 1 },
			{ row: 3, col: 3, value: 1 },
			{ row: 4, col: 2, value: 1 },
			{ row: 4, col: 3, value: 1 },
			{ row: 2, col: 2, value: 1 },
			{ row: 0, col: 5, value: 2 },
		]),
	})
}

/**
 * Spawn tip: isolated pieces so a short move does not merge.
 * Move (3,2)=1 → (3,3) empty triggers spawn (no merge).
 */
export const TUTORIAL_SPAWN_FROM: Position = { row: 3, col: 2 }
export const TUTORIAL_SPAWN_DEST: Position = { row: 3, col: 3 }

export function buildSpawnBoard (): GameState {
	return createGameFromBoard({
		seed: 9104,
		score: 0,
		moveCount: 0,
		board: boardFromSparse([
			{ row: 3, col: 2, value: 1 },
			{ row: 0, col: 0, value: 2 },
			{ row: 0, col: 5, value: 2 },
			{ row: 7, col: 0, value: 2 },
			{ row: 7, col: 5, value: 1 },
		]),
	})
}

/** Levels tip — decorative mid-field, no interaction required. */
export function buildLevelsBoard (): GameState {
	return createGameFromBoard({
		seed: 9105,
		score: 120,
		board: boardFromSparse([
			{ row: 2, col: 1, value: 1 },
			{ row: 2, col: 3, value: 2 },
			{ row: 3, col: 2, value: 4 },
			{ row: 4, col: 1, value: 1 },
			{ row: 4, col: 4, value: 2 },
			{ row: 5, col: 2, value: 1 },
			{ row: 6, col: 3, value: 2 },
		]),
	})
}
