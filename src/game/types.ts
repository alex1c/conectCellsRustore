/**
 * Shared game-engine types.
 * Serializable plain data only — no functions or class instances.
 */

/** Board cell: empty or a positive merge level. */
export type Cell = number | null

/** Zero-based board coordinate. */
export interface Position {
	row: number
	col: number
}

/** Rectangular board as row-major matrix. */
export type Board = Cell[][]

export type GameStatus = 'playing' | 'game_over'

/**
 * Deterministic PRNG state (Mulberry32).
 * Stored as an unsigned 32-bit value in the range 0 .. 2^32-1.
 */
export interface RngState {
	s: number
}

/**
 * Player intent: merge two orthogonally adjacent equal cells.
 * Result value is written to `to`; `from` becomes empty.
 */
export interface Move {
	from: Position
	to: Position
}

/**
 * Structured engine events for future animation / sound / haptics / analytics.
 * Not wired to any SDK in Phase 1.
 */
export type GameEvent =
	| {
			type: 'MOVE'
			from: Position
			to: Position
			value: number
	  }
	| {
			type: 'MERGE'
			position: Position
			fromValue: number
			toValue: number
			chainLevel: number
	  }
	| {
			type: 'CHAIN_STEP'
			position: Position
			/** Neighbor cell absorbed into the chain anchor. */
			absorbed: Position
			fromValue: number
			toValue: number
			chainLevel: number
	  }
	| {
			type: 'SCORE_GAIN'
			amount: number
			total: number
	  }
	| {
			type: 'SPAWN'
			position: Position
			value: number
	  }
	| {
			type: 'NEW_BEST_CANDIDATE'
			largestValue: number
	  }
	| {
			type: 'GAME_OVER'
	  }

/**
 * Snapshot stored for a single Undo.
 * Nested undo history is intentionally omitted.
 */
export interface GameStateSnapshot {
	board: Board
	score: number
	moveCount: number
	status: GameStatus
	rng: RngState
	seed: number
	largestValue: number
	largestChain: number
}

/** Full serializable run state. */
export interface GameState {
	board: Board
	score: number
	moveCount: number
	status: GameStatus
	rng: RngState
	seed: number
	largestValue: number
	largestChain: number
	/** Previous snapshot before last successful move; null if undo unavailable. */
	undoSnapshot: GameStateSnapshot | null
}

/** Result of attempting to apply a move. */
export interface ApplyMoveResult {
	ok: boolean
	state: GameState
	events: GameEvent[]
}
