/**
 * Orthogonal neighborhood utilities.
 */

import { inBounds } from './board'
import type { Position } from './types'

const ORTHOGONAL_DELTAS: readonly (readonly [number, number])[] = [
	[-1, 0],
	[1, 0],
	[0, -1],
	[0, 1],
]

/** Four orthogonal neighbors that lie inside the board. */
export function getOrthogonalNeighbors (position: Position): Position[] {
	const result: Position[] = []
	for (const [dRow, dCol] of ORTHOGONAL_DELTAS) {
		const next: Position = {
			row: position.row + dRow,
			col: position.col + dCol,
		}
		if (inBounds(next)) {
			result.push(next)
		}
	}
	return result
}

/** True when two in-bounds positions share an orthogonal edge. */
export function areOrthogonalNeighbors (a: Position, b: Position): boolean {
	const rowDiff = Math.abs(a.row - b.row)
	const colDiff = Math.abs(a.col - b.col)
	return rowDiff + colDiff === 1
}
