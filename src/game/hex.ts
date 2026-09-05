/**
 * Hex topology helpers using odd-r offset coordinates (pointy-top).
 * Neighbor deltas follow https://www.redblobgames.com/grids/hexagons/#neighbors-offset
 * Storage: board[row][col] with row in [0, rows), col in [0, cols).
 */

import type { Position } from './types'

/** odd-r directions as [dCol, dRow] for even rows / odd rows. */
const ODD_R_DIRECTIONS: readonly (readonly (readonly [number, number])[])[] = [
	// even rows
	[
		[+1, 0],
		[0, -1],
		[-1, -1],
		[-1, 0],
		[-1, +1],
		[0, +1],
	],
	// odd rows
	[
		[+1, 0],
		[+1, -1],
		[0, -1],
		[-1, 0],
		[0, +1],
		[+1, +1],
	],
]

export function inHexBounds (
	position: Position,
	cols: number,
	rows: number,
): boolean {
	return (
		position.row >= 0 &&
		position.row < rows &&
		position.col >= 0 &&
		position.col < cols
	)
}

/** Six hex neighbors that lie inside the board. */
export function getHexNeighbors (
	position: Position,
	cols: number,
	rows: number,
): Position[] {
	const parity = position.row & 1
	const dirs = ODD_R_DIRECTIONS[parity] ?? ODD_R_DIRECTIONS[0]!
	const result: Position[] = []
	for (const [dCol, dRow] of dirs) {
		const next: Position = {
			row: position.row + dRow,
			col: position.col + dCol,
		}
		if (inHexBounds(next, cols, rows)) {
			result.push(next)
		}
	}
	return result
}

export function samePosition (a: Position, b: Position): boolean {
	return a.row === b.row && a.col === b.col
}

export function positionKey (position: Position): string {
	return `${position.row},${position.col}`
}

/** Deterministic ordering: row, then col. */
export function comparePositions (a: Position, b: Position): number {
	if (a.row !== b.row) {
		return a.row - b.row
	}
	return a.col - b.col
}
