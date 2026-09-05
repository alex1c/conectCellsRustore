/**
 * Central hex gameplay rules (Phase 2.6).
 * Spawn / initial fill knobs are TUNABLE — not final store balance.
 */

export const SAVE_SCHEMA_VERSION = 3

/** Columns × rows for the playable hex field. */
export const BOARD_COLS = 6
export const BOARD_ROWS = 8

/** Merge requires at least this many connected equal cells. */
export const MERGE_THRESHOLD = 4

/** Merged group becomes value * MERGE_RESULT_FACTOR. */
export const MERGE_RESULT_FACTOR = 4

/** Animation step delay (UI). */
export const ANIM_STEP_MS = 140

/**
 * How many cells to place on a fresh board.
 * TUNABLE — revisit after human playtest.
 */
export const INITIAL_CELL_COUNT = 12

/**
 * Weighted spawn batch size after a non-merge turn.
 * TUNABLE temporary defaults from Phase 2.6 spec.
 */
export const SPAWN_COUNT_WEIGHTS: readonly { count: number; weight: number }[] = [
	{ count: 1, weight: 25 },
	{ count: 2, weight: 50 },
	{ count: 3, weight: 25 },
]

/**
 * Weighted values for each spawned cell (1 or 2 only).
 * TUNABLE temporary defaults.
 */
export const SPAWN_VALUE_WEIGHTS: readonly { value: number; weight: number }[] = [
	{ value: 1, weight: 50 },
	{ value: 2, weight: 50 },
]

/** Initial fill uses the same value table as spawn (1/2). */
export const INITIAL_VALUE_WEIGHTS = SPAWN_VALUE_WEIGHTS

export interface HexRules {
	boardCols: number
	boardRows: number
	mergeThreshold: number
	mergeResultFactor: number
	initialCellCount: number
	spawnCountWeights: { count: number; weight: number }[]
	spawnValueWeights: { value: number; weight: number }[]
	initialValueWeights: { value: number; weight: number }[]
}

export function getDefaultHexRules (): HexRules {
	return {
		boardCols: BOARD_COLS,
		boardRows: BOARD_ROWS,
		mergeThreshold: MERGE_THRESHOLD,
		mergeResultFactor: MERGE_RESULT_FACTOR,
		initialCellCount: INITIAL_CELL_COUNT,
		spawnCountWeights: SPAWN_COUNT_WEIGHTS.map((e) => ({ ...e })),
		spawnValueWeights: SPAWN_VALUE_WEIGHTS.map((e) => ({ ...e })),
		initialValueWeights: INITIAL_VALUE_WEIGHTS.map((e) => ({ ...e })),
	}
}

export function cloneHexRules (rules: HexRules): HexRules {
	return {
		...rules,
		spawnCountWeights: rules.spawnCountWeights.map((e) => ({ ...e })),
		spawnValueWeights: rules.spawnValueWeights.map((e) => ({ ...e })),
		initialValueWeights: rules.initialValueWeights.map((e) => ({ ...e })),
	}
}
