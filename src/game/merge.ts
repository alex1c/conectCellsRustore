/**
 * Merge resolution and cascade loops for hex groups.
 */

import { getCell, setCell } from './board'
import { comparePositions } from './hex'
import { findMergeableGroups, type CellGroup } from './groups'
import type { Board, GameEvent, Position } from './types'

export interface CascadeResult {
	board: Board
	events: GameEvent[]
	scoreGain: number
	merges: number
	cascades: number
	cellsCleared: number
	largestGroup: number
	largestCascade: number
	finalLargestValue: number
	hadMerge: boolean
}

function pickResultAt (
	group: CellGroup,
	preferred: Position | null,
): Position {
	if (preferred) {
		const hit = group.cells.find(
			(cell) => cell.row === preferred.row && cell.col === preferred.col,
		)
		if (hit) {
			return hit
		}
	}
	const sorted = group.cells.slice().sort(comparePositions)
	return sorted[0] ?? group.cells[0]!
}

/**
 * Resolve all mergeable groups in deterministic order until none remain.
 * Prefer placing the first merge result on `preferredAnchor` when it belongs
 * to that group (typically the move destination).
 */
export function resolveMergesAndCascades (
	board: Board,
	cols: number,
	rows: number,
	threshold: number,
	resultFactor: number,
	preferredAnchor: Position | null,
	startingLargestValue: number,
): CascadeResult {
	let nextBoard = board
	const events: GameEvent[] = []
	let scoreGain = 0
	let merges = 0
	let cellsCleared = 0
	let largestGroup = 0
	let cascadeLevel = 0
	let largestCascade = 0
	let largestValue = startingLargestValue
	let preferred = preferredAnchor

	for (;;) {
		const groups = findMergeableGroups(nextBoard, cols, rows, threshold)
		if (groups.length === 0) {
			break
		}

		// Process one group per step for clear cascade events (deterministic pick).
		groups.sort((a, b) => {
			const aAt = pickResultAt(a, null)
			const bAt = pickResultAt(b, null)
			return comparePositions(aAt, bAt)
		})
		const group = groups[0]
		if (!group) {
			break
		}

		cascadeLevel += 1
		largestCascade = Math.max(largestCascade, cascadeLevel)
		largestGroup = Math.max(largestGroup, group.cells.length)
		merges += 1

		const resultAt = pickResultAt(group, preferred)
		const resultValue = group.value * resultFactor
		const gain = group.value * group.cells.length
		scoreGain += gain
		largestValue = Math.max(largestValue, resultValue)

		const cleared: Position[] = []
		for (const cell of group.cells) {
			nextBoard = setCell(nextBoard, cell, null)
			cleared.push({ ...cell })
			cellsCleared += 1
		}
		nextBoard = setCell(nextBoard, resultAt, resultValue)
		// Result cell is occupied again — not cleared net-wise for spawn bookkeeping
		// but we counted clears of the whole group including resultAt then re-filled.
		cellsCleared -= 1

		events.push({
			type: 'MERGE',
			value: group.value,
			resultValue,
			groupSize: group.cells.length,
			cleared,
			resultAt: { ...resultAt },
			cascadeLevel,
			scoreGain: gain,
		})

		// Only the first merge prefers the move anchor.
		preferred = null
	}

	return {
		board: nextBoard,
		events,
		scoreGain,
		merges,
		cascades: cascadeLevel > 1 ? cascadeLevel - 1 : 0,
		cellsCleared,
		largestGroup,
		largestCascade,
		finalLargestValue: largestValue,
		hadMerge: merges > 0,
	}
}

export function peekWouldMerge (
	board: Board,
	from: Position,
	to: Position,
	cols: number,
	rows: number,
	threshold: number,
): boolean {
	const value = getCell(board, from)
	if (value === null) {
		return false
	}
	let trial = setCell(board, from, null)
	trial = setCell(trial, to, value)
	return findMergeableGroups(trial, cols, rows, threshold).length > 0
}
