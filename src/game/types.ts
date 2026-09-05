/**
 * Shared hex game-engine types — JSON-serializable plain data only.
 */

import type { HexRules } from './rules'

export type Cell = number | null

export interface Position {
	row: number
	col: number
}

/** Row-major board: board[row][col]. */
export type Board = Cell[][]

export type GameStatus = 'playing' | 'game_over'

export interface RngState {
	s: number
}

/** Player intent: move an occupied cell along empty hexes to an empty destination. */
export interface Move {
	from: Position
	to: Position
}

export type GameEvent =
	| {
			type: 'MOVE'
			from: Position
			to: Position
			value: number
			path: Position[]
	  }
	| {
			type: 'MERGE'
			value: number
			resultValue: number
			groupSize: number
			cleared: Position[]
			resultAt: Position
			cascadeLevel: number
			scoreGain: number
	  }
	| {
			type: 'SCORE_GAIN'
			amount: number
			total: number
	  }
	| {
			type: 'SPAWN'
			cells: { position: Position; value: number }[]
	  }
	| {
			type: 'GAME_OVER'
	  }

export interface GameStateSnapshot {
	board: Board
	score: number
	moveCount: number
	status: GameStatus
	rng: RngState
	seed: number
	largestValue: number
	largestGroup: number
	largestCascade: number
	merges: number
	cascades: number
	cellsSpawned: number
	cellsCleared: number
	rules: HexRules
}

export interface GameState {
	board: Board
	score: number
	moveCount: number
	status: GameStatus
	rng: RngState
	seed: number
	largestValue: number
	largestGroup: number
	largestCascade: number
	merges: number
	cascades: number
	cellsSpawned: number
	cellsCleared: number
	rules: HexRules
	undoSnapshot: GameStateSnapshot | null
}

export interface ApplyMoveResult {
	ok: boolean
	state: GameState
	events: GameEvent[]
	/** Present when ok=false because destination was unreachable. */
	reason?: 'illegal' | 'blocked' | 'game_over'
}
