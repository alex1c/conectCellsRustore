/**
 * Hex pathfinding through empty cells (BFS).
 * The moving piece's origin is treated as empty for reachability.
 */

import { getCell } from './board'
import { getHexNeighbors, positionKey, samePosition } from './hex'
import type { Board, Position } from './types'

export interface PathResult {
	reachable: boolean
	path: Position[]
}

/**
 * Find a shortest path from `from` to `to` stepping only on empty cells.
 * `from` must be occupied; `to` must be empty (or equal to from — rejected).
 */
export function findPath (
	board: Board,
	from: Position,
	to: Position,
	cols: number,
	rows: number,
): PathResult {
	if (samePosition(from, to)) {
		return { reachable: false, path: [] }
	}
	if (getCell(board, from) === null) {
		return { reachable: false, path: [] }
	}
	if (getCell(board, to) !== null) {
		return { reachable: false, path: [] }
	}

	const queue: Position[] = [from]
	const cameFrom = new Map<string, Position | null>()
	cameFrom.set(positionKey(from), null)

	const isWalkable = (position: Position): boolean => {
		if (samePosition(position, from)) {
			return true
		}
		return getCell(board, position) === null
	}

	while (queue.length > 0) {
		const current = queue.shift()
		if (!current) {
			break
		}
		if (samePosition(current, to)) {
			return { reachable: true, path: reconstructPath(cameFrom, to) }
		}
		for (const next of getHexNeighbors(current, cols, rows)) {
			const key = positionKey(next)
			if (cameFrom.has(key)) {
				continue
			}
			if (!isWalkable(next)) {
				continue
			}
			cameFrom.set(key, current)
			queue.push(next)
		}
	}

	return { reachable: false, path: [] }
}

function reconstructPath (
	cameFrom: Map<string, Position | null>,
	goal: Position,
): Position[] {
	const path: Position[] = []
	let current: Position | null = goal
	while (current) {
		path.push(current)
		const prev = cameFrom.get(positionKey(current))
		current = prev === undefined ? null : prev
	}
	path.reverse()
	return path
}

/** All empty cells reachable from an occupied origin. */
export function listReachableEmpty (
	board: Board,
	from: Position,
	cols: number,
	rows: number,
): Position[] {
	if (getCell(board, from) === null) {
		return []
	}
	const reachable: Position[] = []
	const queue: Position[] = [from]
	const visited = new Set<string>([positionKey(from)])

	while (queue.length > 0) {
		const current = queue.shift()
		if (!current) {
			break
		}
		for (const next of getHexNeighbors(current, cols, rows)) {
			const key = positionKey(next)
			if (visited.has(key)) {
				continue
			}
			if (getCell(board, next) !== null) {
				continue
			}
			visited.add(key)
			reachable.push(next)
			queue.push(next)
		}
	}
	return reachable
}
