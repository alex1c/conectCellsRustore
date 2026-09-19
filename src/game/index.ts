/**
 * Public hex game-engine surface.
 */

export {
	ANIM_STEP_MS,
	BOARD_COLS,
	BOARD_ROWS,
	DEFAULT_RULE_PRESET,
	INITIAL_CELL_COUNT,
	MERGE_RESULT_FACTOR,
	MERGE_THRESHOLD,
	RULE_PRESET_IDS,
	SAVE_SCHEMA_VERSION,
	SPAWN_COUNT_WEIGHTS,
	SPAWN_VALUE_WEIGHTS,
	cloneHexRules,
	getDefaultHexRules,
	getObservedPressureRules,
	getPhase26Rules,
	getRulesForPreset,
	presetDisplayName,
	type HexRules,
	type RulePresetId,
	type SpawnPolicyId,
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
	TurnResolution,
} from './types'

export {
	applyMove,
	canUndo,
	cloneGameState,
	createInitialGame,
	deserializeGame,
	gameStatesEqual,
	isGameOver,
	restart,
	serializeGame,
	undo,
} from './gameState'

export {
	createEmptyHexBoard,
	createFreshSeed,
	createGameFromBoard,
} from './createGame'

export {
	FIXTURE_BUILDERS,
	FIXTURE_IDS,
	loadFixture,
	type FixtureId,
} from './fixtures'

export { isValidGameState, tryParseGameState } from './validate'
export {
	getReachableFrom,
	hasLegalMoves,
	isLegalMove,
	listLegalMoves,
} from './moves'
export { findPath, listReachableEmpty } from './pathfinding'
export { findConnectedGroups, findMergeableGroups } from './groups'
export { peekWouldMerge } from './merge'
export {
	resolveSpawnPlan,
	resolveBaseSpawnPlan,
	type SpawnPlan,
	type TurnMergeSummary,
} from './spawnPlan'
export { spawnCells } from './spawn'
export {
	LEVEL_BONUS_SPAWN_CAP,
	LEVEL_BONUS_SPAWN_STEP,
	LEVEL_SCORE_THRESHOLDS,
	getBonusSpawnChance,
	getLevelForScore,
	getLevelProgress,
	getNextLevelScore,
	getScoreThresholdForLevel,
} from './levels'
export { createRng, nextFloat, nextInt } from './random'
export {
	cloneBoard,
	countOccupied,
	getCell,
	listEmptyPositions,
	listOccupiedPositions,
	setCell,
} from './board'
export {
	getHexNeighbors,
	inHexBounds,
	positionKey,
	samePosition,
} from './hex'
