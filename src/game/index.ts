/**
 * Public game-engine surface.
 * UI and tests should import from here rather than deep paths when practical.
 */

export {
	BOARD_SIZE,
	MAX_INITIAL_VALUE,
	MIN_CELL_VALUE,
	SCORE_BASE,
	SPAWN_VALUE,
} from './constants'

export type {
	ApplyMoveResult,
	Board,
	Cell,
	GameEvent,
	GameState,
	GameStateSnapshot,
	GameStatus,
	Move,
	Position,
	RngState,
} from './types'

export {
	applyMove,
	canUndo,
	cloneGameState,
	createInitialGame,
	deserializeGame,
	gameStatesEqual,
	getLegalMoves,
	isGameOver,
	restart,
	serializeGame,
	undo,
} from './gameState'

export {
	selectBoardSize,
	selectCellAt,
	selectHasLegalMoves,
	selectLargestChain,
	selectLargestValue,
	selectLegalMoves,
	selectMoveCount,
	selectScore,
	selectStatus,
} from './selectors'

export { isLegalMove, listLegalMoves } from './moves'
export { scoreForStep } from './scoring'
export { createRng, nextFloat, nextInt } from './random'
