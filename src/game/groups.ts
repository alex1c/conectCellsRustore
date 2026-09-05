/**
 * Connected same-value groups on the hex board.
 */

import { getCell, listOccupiedPositions } from './board'
import { comparePositions, getHexNeighbors, positionKey } from './hex'
import type { Board, Position } from './types'

export interface CellGroup {
	value: number
	cells: Position[]
}

/** Flood-fill all maximal connected equal-value groups. */
export function findConnectedGroups (
	board: Board,
	cols: number,
	rows: number,
): CellGroup[] {
	const visited = new Set<string>()
	const groups: CellGroup[] = []

	for (const start of listOccupiedPositions(board)) {
		const key = positionKey(start)
		if (visited.has(key)) {
			continue
		}
		const value = getCell(board, start)
		if (value === null) {
			continue
		}
		const cells: Position[] = []
		const queue: Position[] = [start]
		visited.add(key)

		while (queue.length > 0) {
			const current = queue.shift()
			if (!current) {
				break
			}
			cells.push(current)
			for (const next of getHexNeighbors(current, cols, rows)) {
				const nextKey = positionKey(next)
				if (visited.has(nextKey)) {
					continue
				}
				if (getCell(board, next) !== value) {
					continue
				}
				visited.add(nextKey)
				queue.push(next)
			}
		}

		cells.sort(comparePositions)
		groups.push({ value, cells })
	}

	return groups
}

/** Groups that meet or exceed the merge threshold. */
export function findMergeableGroups (
	board: Board,
	cols: number,
	rows: number,
	threshold: number,
): CellGroup[] {
	return findConnectedGroups(board, cols, rows).filter(
		(group) => group.cells.length >= threshold,
	)
}
