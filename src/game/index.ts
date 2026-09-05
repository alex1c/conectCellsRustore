/**
 * Public game-engine surface.
 */

export {
	BOARD_SIZE,
	CHAIN_STEP_DELAY_MS,
	DEFAULT_RULE_PRESET,
	MAX_INITIAL_VALUE,
	MIN_CELL_VALUE,
	SAVE_SCHEMA_VERSION,
	SCORE_BASE,
	SPAWN_VALUE,
} from './constants'

export {
	RULE_PRESET_IDS,
	RULE_PRESETS,
	cloneRules,
	getRulesForPreset,
	rulesEqual,
	type GameRules,
	type RulePresetId,
	type SpawnWeight,
} from './rules'

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

export { createFreshSeed, createGameFromBoard } from './createGame'
export {
	FIXTURE_BUILDERS,
	FIXTURE_IDS,
	loadFixture,
	type FixtureId,
} from './fixtures'
export { isValidGameState, tryParseGameState } from './validate'
export { pickSpawnValue } from './spawn'

export {
	selectBoardSize,
	selectCellAt,
	selectHasLegalMoves,
	selectLargestChain,
	selectLargestValue,
	selectLegalMoves,
	selectMoveCount,
	selectRulesetId,
	selectScore,
	selectStatus,
} from './selectors'

export { isLegalMove, listLegalMoves } from './moves'
export { scoreForStep } from './scoring'
export { createRng, nextFloat, nextInt } from './random'
export { boardSizeOf, cloneBoard, getCell, samePosition } from './board'
