/**
 * Orthogonal neighborhood utilities.
 */

import { boardSizeOf, inBounds } from './board'
import type { Board, Position } from './types'

const ORTHOGONAL_DELTAS: readonly (readonly [number, number])[] = [
	[-1, 0],
	[1, 0],
	[0, -1],
	[0, 1],
]

/** Four orthogonal neighbors that lie inside the given board. */
export function getOrthogonalNeighbors (
	position: Position,
	board: Board,
): Position[] {
	const size = boardSizeOf(board)
	const result: Position[] = []
	for (const [dRow, dCol] of ORTHOGONAL_DELTAS) {
		const next: Position = {
			row: position.row + dRow,
			col: position.col + dCol,
		}
		if (inBounds(next, size)) {
			result.push(next)
		}
	}
	return result
}

/** True when two positions share an orthogonal edge. */
export function areOrthogonalNeighbors (a: Position, b: Position): boolean {
	const rowDiff = Math.abs(a.row - b.row)
	const colDiff = Math.abs(a.col - b.col)
	return rowDiff + colDiff === 1
}
