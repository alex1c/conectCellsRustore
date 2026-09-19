/**
 * Central hex gameplay rules (Phase 2.6 + 2.7 spawn-pressure candidates).
 * Spawn / initial fill knobs are TUNABLE — not a proven original formula.
 */

/** Persistence schema — bump when HexRules shape changes. */
export const SAVE_SCHEMA_VERSION = 4

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

/** Named gameplay presets available in DEV comparison. */
export type RulePresetId = 'phase26' | 'observedPressure'

/**
 * How post-turn spawn count is chosen.
 * phase26: weighted 1–3 only when the turn had no merge.
 * observedPressure: fixed counts from max merged group size.
 */
export type SpawnPolicyId = 'phase26' | 'observedPressure'

export const RULE_PRESET_IDS: readonly RulePresetId[] = [
	'phase26',
	'observedPressure',
]

/** Production / comparison baseline until human review picks a winner. */
export const DEFAULT_RULE_PRESET: RulePresetId = 'phase26'

/**
 * Phase 2.6 weighted spawn batch size after a non-merge turn.
 * TUNABLE temporary defaults.
 */
export const PHASE26_SPAWN_COUNT_WEIGHTS: readonly {
	count: number
	weight: number
}[] = [
	{ count: 1, weight: 25 },
	{ count: 2, weight: 50 },
	{ count: 3, weight: 25 },
]

/**
 * Phase 2.6 spawn / initial values (1 or 2 only).
 */
export const PHASE26_SPAWN_VALUE_WEIGHTS: readonly {
	value: number
	weight: number
}[] = [
	{ value: 1, weight: 50 },
	{ value: 2, weight: 50 },
]

/**
 * Observed-pressure candidate spawn values: 1 / 2 / 4.
 * TUNABLE — not claimed to match the original probabilities.
 */
export const OBSERVED_SPAWN_VALUE_WEIGHTS: readonly {
	value: number
	weight: number
}[] = [
	{ value: 1, weight: 40 },
	{ value: 2, weight: 40 },
	{ value: 4, weight: 20 },
]

/** Fixed spawn counts for the observedPressure policy. */
export const OBSERVED_NO_MERGE_SPAWN = 2
export const OBSERVED_MERGE4_SPAWN = 1
export const OBSERVED_LARGE_MERGE_SPAWN = 0

export interface HexRules {
	presetId: RulePresetId
	spawnPolicy: SpawnPolicyId
	boardCols: number
	boardRows: number
	mergeThreshold: number
	mergeResultFactor: number
	initialCellCount: number
	/** Used by phase26 policy when the turn had no merge. */
	spawnCountWeights: { count: number; weight: number }[]
	spawnValueWeights: { value: number; weight: number }[]
	initialValueWeights: { value: number; weight: number }[]
	/** observedPressure: spawn after a no-merge turn. */
	observedNoMergeSpawn: number
	/** observedPressure: spawn when max merged group size === 4. */
	observedMerge4Spawn: number
	/** observedPressure: spawn when max merged group size >= 5. */
	observedLargeMergeSpawn: number
}

function baseBoardRules (): Pick<
	HexRules,
	| 'boardCols'
	| 'boardRows'
	| 'mergeThreshold'
	| 'mergeResultFactor'
	| 'initialCellCount'
	| 'observedNoMergeSpawn'
	| 'observedMerge4Spawn'
	| 'observedLargeMergeSpawn'
> {
	return {
		boardCols: BOARD_COLS,
		boardRows: BOARD_ROWS,
		mergeThreshold: MERGE_THRESHOLD,
		mergeResultFactor: MERGE_RESULT_FACTOR,
		initialCellCount: INITIAL_CELL_COUNT,
		observedNoMergeSpawn: OBSERVED_NO_MERGE_SPAWN,
		observedMerge4Spawn: OBSERVED_MERGE4_SPAWN,
		observedLargeMergeSpawn: OBSERVED_LARGE_MERGE_SPAWN,
	}
}

/** Phase 2.6 comparison preset (default until human review). */
export function getPhase26Rules (): HexRules {
	return {
		...baseBoardRules(),
		presetId: 'phase26',
		spawnPolicy: 'phase26',
		spawnCountWeights: PHASE26_SPAWN_COUNT_WEIGHTS.map((e) => ({ ...e })),
		spawnValueWeights: PHASE26_SPAWN_VALUE_WEIGHTS.map((e) => ({ ...e })),
		initialValueWeights: PHASE26_SPAWN_VALUE_WEIGHTS.map((e) => ({ ...e })),
	}
}

/**
 * Candidate A from original-game observations (hypothesis, not proven formula).
 * no merge → +2; max group 4 → +1; max group >=5 → +0; values 1/2/4.
 */
export function getObservedPressureRules (): HexRules {
	return {
		...baseBoardRules(),
		presetId: 'observedPressure',
		spawnPolicy: 'observedPressure',
		// Count weights unused by observedPressure policy; kept for schema uniformity.
		spawnCountWeights: [
			{ count: OBSERVED_NO_MERGE_SPAWN, weight: 100 },
		],
		spawnValueWeights: OBSERVED_SPAWN_VALUE_WEIGHTS.map((e) => ({ ...e })),
		initialValueWeights: OBSERVED_SPAWN_VALUE_WEIGHTS.map((e) => ({ ...e })),
	}
}

export function getRulesForPreset (presetId: RulePresetId): HexRules {
	switch (presetId) {
		case 'observedPressure':
			return getObservedPressureRules()
		case 'phase26':
		default:
			return getPhase26Rules()
	}
}

/** Default rules = Phase 2.6 until human review chooses otherwise. */
export function getDefaultHexRules (): HexRules {
	return getRulesForPreset(DEFAULT_RULE_PRESET)
}

export function cloneHexRules (rules: HexRules): HexRules {
	return {
		...rules,
		spawnCountWeights: rules.spawnCountWeights.map((e) => ({ ...e })),
		spawnValueWeights: rules.spawnValueWeights.map((e) => ({ ...e })),
		initialValueWeights: rules.initialValueWeights.map((e) => ({ ...e })),
	}
}

/** Short label for DEV UI. */
export function presetDisplayName (presetId: RulePresetId): string {
	switch (presetId) {
		case 'observedPressure':
			return 'Observed'
		case 'phase26':
		default:
			return 'Phase 2.6'
	}
}

// Back-compat aliases used by older call sites / docs.
export const SPAWN_COUNT_WEIGHTS = PHASE26_SPAWN_COUNT_WEIGHTS
export const SPAWN_VALUE_WEIGHTS = PHASE26_SPAWN_VALUE_WEIGHTS
export const INITIAL_VALUE_WEIGHTS = PHASE26_SPAWN_VALUE_WEIGHTS
