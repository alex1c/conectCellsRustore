/**
 * Legal-move enumeration and move validation.
 */

import { boardSizeOf, getCell, inBounds, samePosition } from './board'
import { areOrthogonalNeighbors } from './neighbors'
import type { Board, Move, Position } from './types'

/** True when `move` is a legal merge pair on `board`. */
export function isLegalMove (board: Board, move: Move): boolean {
	const size = boardSizeOf(board)
	const { from, to } = move
	if (!inBounds(from, size) || !inBounds(to, size)) {
		return false
	}
	if (samePosition(from, to)) {
		return false
	}
	if (!areOrthogonalNeighbors(from, to)) {
		return false
	}
	const fromValue = getCell(board, from)
	const toValue = getCell(board, to)
	if (fromValue === null || toValue === null) {
		return false
	}
	return fromValue === toValue
}

/**
 * Enumerate every legal ordered pair (from, to).
 * Both orientations are listed when A↔B share a value so UI can highlight either.
 */
export function listLegalMoves (board: Board): Move[] {
	const size = boardSizeOf(board)
	const moves: Move[] = []
	for (let row = 0; row < size; row += 1) {
		for (let col = 0; col < size; col += 1) {
			const from: Position = { row, col }
			const fromValue = getCell(board, from)
			if (fromValue === null) {
				continue
			}
			const candidates: Position[] = [
				{ row, col: col + 1 },
				{ row: row + 1, col },
			]
			for (const to of candidates) {
				if (!inBounds(to, size)) {
					continue
				}
				const toValue = getCell(board, to)
				if (toValue !== null && toValue === fromValue) {
					moves.push({ from, to })
					moves.push({ from: to, to: from })
				}
			}
		}
	}
	return moves
}

export function hasLegalMoves (board: Board): boolean {
	return listLegalMoves(board).length > 0
}
