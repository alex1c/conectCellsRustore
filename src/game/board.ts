/**
 * Board helpers: create, clone, bounds, occupancy queries.
 * Board size is taken from the board matrix or an explicit size argument.
 */

import { nextFloat, nextInt } from './random'
import type { GameRules } from './rules'
import type { Board, Cell, Position, RngState } from './types'

/** Side length of a square board. */
export function boardSizeOf (board: Board): number {
	return board.length
}

/** Allocate an empty size × size board. */
export function createEmptyBoard (size: number): Board {
	const board: Board = []
	for (let row = 0; row < size; row += 1) {
		const line: Cell[] = []
		for (let col = 0; col < size; col += 1) {
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

/** True when coordinates lie inside a square board of the given size. */
export function inBounds (position: Position, size: number): boolean {
	return (
		position.row >= 0 &&
		position.row < size &&
		position.col >= 0 &&
		position.col < size
	)
}

/** Read cell or throw if out of bounds. */
export function getCell (board: Board, position: Position): Cell {
	const size = boardSizeOf(board)
	if (!inBounds(position, size)) {
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
	const size = boardSizeOf(board)
	if (!inBounds(position, size)) {
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

/**
 * Fill the board using rules + RNG.
 * Cells may be left empty when initialEmptyRatio > 0.
 */
export function fillInitialBoard (rng: RngState, rules: GameRules): Board {
	let board = createEmptyBoard(rules.boardSize)
	for (let row = 0; row < rules.boardSize; row += 1) {
		for (let col = 0; col < rules.boardSize; col += 1) {
			const leaveEmpty =
				rules.initialEmptyRatio > 0 &&
				nextFloat(rng) < rules.initialEmptyRatio
			if (leaveEmpty) {
				continue
			}
			const value = nextInt(rng, rules.minCellValue, rules.maxInitialValue)
			board = setCell(board, { row, col }, value)
		}
	}
	return board
}

/** Collect all empty positions in deterministic row-major order. */
export function listEmptyPositions (board: Board): Position[] {
	const size = boardSizeOf(board)
	const empties: Position[] = []
	for (let row = 0; row < size; row += 1) {
		for (let col = 0; col < size; col += 1) {
			if (getCell(board, { row, col }) === null) {
				empties.push({ row, col })
			}
		}
	}
	return empties
}

/** Maximum numeric value currently on the board (0 if all empty). */
export function findLargestValue (board: Board): number {
	const size = boardSizeOf(board)
	let max = 0
	for (let row = 0; row < size; row += 1) {
		for (let col = 0; col < size; col += 1) {
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
