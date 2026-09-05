/**
 * Board helpers: create, clone, bounds, occupancy queries.
 */

import { BOARD_SIZE, MAX_INITIAL_VALUE, MIN_CELL_VALUE } from './constants'
import { nextInt } from './random'
import type { Board, Cell, Position, RngState } from './types'

/** Allocate an empty BOARD_SIZE × BOARD_SIZE board. */
export function createEmptyBoard (): Board {
	const board: Board = []
	for (let row = 0; row < BOARD_SIZE; row += 1) {
		const line: Cell[] = []
		for (let col = 0; col < BOARD_SIZE; col += 1) {
			line.push(null)
		}
		board.push(line)
	}
	return board
}

/** Deep-clone a board matrix (immutable engine updates). */
export function cloneBoard (board: Board): Board {
	return board.map((row) => row.slice())
}

/** True when coordinates lie inside the board. */
export function inBounds (position: Position): boolean {
	return (
		position.row >= 0 &&
		position.row < BOARD_SIZE &&
		position.col >= 0 &&
		position.col < BOARD_SIZE
	)
}

/** Read cell or throw if out of bounds. */
export function getCell (board: Board, position: Position): Cell {
	if (!inBounds(position)) {
		throw new Error(
			`getCell: out of bounds (${position.row}, ${position.col})`,
		)
	}
	const row = board[position.row]
	if (!row) {
		throw new Error(`getCell: missing row ${position.row}`)
	}
	return row[position.col] ?? null
}

/** Write cell; returns a new board (does not mutate input). */
export function setCell (
	board: Board,
	position: Position,
	value: Cell,
): Board {
	if (!inBounds(position)) {
		throw new Error(
			`setCell: out of bounds (${position.row}, ${position.col})`,
		)
	}
	const next = cloneBoard(board)
	const row = next[position.row]
	if (!row) {
		throw new Error(`setCell: missing row ${position.row}`)
	}
	row[position.col] = value
	return next
}

/** Fill every cell with values in [MIN_CELL_VALUE, MAX_INITIAL_VALUE]. */
export function fillInitialBoard (rng: RngState): Board {
	let board = createEmptyBoard()
	for (let row = 0; row < BOARD_SIZE; row += 1) {
		for (let col = 0; col < BOARD_SIZE; col += 1) {
			const value = nextInt(rng, MIN_CELL_VALUE, MAX_INITIAL_VALUE)
			board = setCell(board, { row, col }, value)
		}
	}
	return board
}

/** Collect all empty positions in deterministic row-major order. */
export function listEmptyPositions (board: Board): Position[] {
	const empties: Position[] = []
	for (let row = 0; row < BOARD_SIZE; row += 1) {
		for (let col = 0; col < BOARD_SIZE; col += 1) {
			if (getCell(board, { row, col }) === null) {
				empties.push({ row, col })
			}
		}
	}
	return empties
}

/** Maximum numeric value currently on the board (0 if all empty). */
export function findLargestValue (board: Board): number {
	let max = 0
	for (let row = 0; row < BOARD_SIZE; row += 1) {
		for (let col = 0; col < BOARD_SIZE; col += 1) {
			const cell = getCell(board, { row, col })
			if (cell !== null && cell > max) {
				max = cell
			}
		}
	}
	return max
}

/** Positions are the same coordinate. */
export function samePosition (a: Position, b: Position): boolean {
	return a.row === b.row && a.col === b.col
}
