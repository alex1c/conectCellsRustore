/**
 * Legal hex moves: occupied → reachable empty via empty path.
 */

import { getCell, listOccupiedPositions } from './board'
import { inHexBounds } from './hex'
import { findPath, listReachableEmpty } from './pathfinding'
import type { Board, Move, Position } from './types'

export function isLegalMove (
	board: Board,
	move: Move,
	cols: number,
	rows: number,
): boolean {
	if (!inHexBounds(move.from, cols, rows) || !inHexBounds(move.to, cols, rows)) {
		return false
	}
	return findPath(board, move.from, move.to, cols, rows).reachable
}

/**
 * Enumerate legal moves. Can be large on open boards — callers should
 * sample when used inside autoplay rather than always materializing all.
 */
export function listLegalMoves (
	board: Board,
	cols: number,
	rows: number,
): Move[] {
	const moves: Move[] = []
	for (const from of listOccupiedPositions(board)) {
		const destinations = listReachableEmpty(board, from, cols, rows)
		for (const to of destinations) {
			moves.push({ from, to })
		}
	}
	return moves
}

export function hasLegalMoves (
	board: Board,
	cols: number,
	rows: number,
): boolean {
	for (const from of listOccupiedPositions(board)) {
		if (listReachableEmpty(board, from, cols, rows).length > 0) {
			return true
		}
	}
	return false
}

export function getReachableFrom (
	board: Board,
	from: Position,
	cols: number,
	rows: number,
): Position[] {
	if (getCell(board, from) === null) {
		return []
	}
	return listReachableEmpty(board, from, cols, rows)
}
