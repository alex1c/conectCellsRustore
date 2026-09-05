/**
 * Board allocation and cell accessors for the hex field.
 */

import { nextIndex } from './random'
import type { HexRules } from './rules'
import { pickWeighted } from './weighted'
import type { Board, Cell, Position, RngState } from './types'
import { inHexBounds } from './hex'

export function createEmptyBoard (cols: number, rows: number): Board {
	const board: Board = []
	for (let row = 0; row < rows; row += 1) {
		const line: Cell[] = []
		for (let col = 0; col < cols; col += 1) {
			line.push(null)
		}
		board.push(line)
	}
	return board
}

export function cloneBoard (board: Board): Board {
	return board.map((row) => row.slice())
}

export function getCell (board: Board, position: Position): Cell {
	const row = board[position.row]
	if (!row) {
		throw new Error(`getCell: missing row ${position.row}`)
	}
	return row[position.col] ?? null
}

export function setCell (
	board: Board,
	position: Position,
	value: Cell,
): Board {
	const next = cloneBoard(board)
	const row = next[position.row]
	if (!row) {
		throw new Error(`setCell: missing row ${position.row}`)
	}
	row[position.col] = value
	return next
}

export function listPositions (cols: number, rows: number): Position[] {
	const positions: Position[] = []
	for (let row = 0; row < rows; row += 1) {
		for (let col = 0; col < cols; col += 1) {
			positions.push({ row, col })
		}
	}
	return positions
}

export function listEmptyPositions (board: Board): Position[] {
	const empties: Position[] = []
	for (let row = 0; row < board.length; row += 1) {
		const line = board[row]
		if (!line) {
			continue
		}
		for (let col = 0; col < line.length; col += 1) {
			if (line[col] === null) {
				empties.push({ row, col })
			}
		}
	}
	return empties
}

export function listOccupiedPositions (board: Board): Position[] {
	const occupied: Position[] = []
	for (let row = 0; row < board.length; row += 1) {
		const line = board[row]
		if (!line) {
			continue
		}
		for (let col = 0; col < line.length; col += 1) {
			if (line[col] !== null) {
				occupied.push({ row, col })
			}
		}
	}
	return occupied
}

export function countOccupied (board: Board): number {
	return listOccupiedPositions(board).length
}

export function findLargestValue (board: Board): number {
	let max = 0
	for (const position of listOccupiedPositions(board)) {
		const value = getCell(board, position)
		if (value !== null && value > max) {
			max = value
		}
	}
	return max
}

/** Place `count` weighted cells on an empty board using RNG. */
export function fillInitialBoard (rng: RngState, rules: HexRules): Board {
	let board = createEmptyBoard(rules.boardCols, rules.boardRows)
	const empties = listEmptyPositions(board)
	const placeCount = Math.min(rules.initialCellCount, empties.length)
	const remaining = empties.slice()

	for (let i = 0; i < placeCount; i += 1) {
		const index = nextIndex(rng, remaining.length)
		const position = remaining[index]
		if (!position) {
			break
		}
		remaining.splice(index, 1)
		const value = pickWeighted(rng, rules.initialValueWeights)
		board = setCell(board, position, value)
	}
	return board
}

export function isValidBoardShape (
	board: Board,
	cols: number,
	rows: number,
): boolean {
	if (board.length !== rows) {
		return false
	}
	for (const row of board) {
		if (!Array.isArray(row) || row.length !== cols) {
			return false
		}
	}
	return true
}

export function assertInBounds (
	position: Position,
	cols: number,
	rows: number,
): void {
	if (!inHexBounds(position, cols, rows)) {
		throw new Error(`out of bounds (${position.row}, ${position.col})`)
	}
}
