/**
 * Typed gameplay rules and named presets for Phase 2.5 tuning.
 * Production default remains baseline until human review picks a winner.
 */

export type RulePresetId =
	| 'baseline'
	| 'largerBoard'
	| 'sparseSpawn'
	| 'largerSparse'
	| 'weightedSpawn'
	| 'softStart'

/** Weight entry for deterministic weighted spawn values. */
export interface SpawnWeight {
	value: number
	weight: number
}

/**
 * Serializable rule knobs. Stored on GameState so restore/undo keep behavior.
 */
export interface GameRules {
	boardSize: number
	minCellValue: number
	maxInitialValue: number
	/** Probability in [0, 1] of spawning after a successful settle. */
	spawnProbability: number
	/** Non-empty weights; values must be >= minCellValue. */
	spawnWeights: SpawnWeight[]
	scoreBase: number
	/**
	 * Fraction of initial cells left empty (0 = fully filled).
	 * Applied per-cell via RNG during fill.
	 */
	initialEmptyRatio: number
}

/** UI timing knob (not part of core ruleset identity). */
export const CHAIN_STEP_DELAY_MS = 160

/** Persist schema version — v2 requires ruleset on GameState. */
export const SAVE_SCHEMA_VERSION = 2

/** Production / default preset until human review decides otherwise. */
export const DEFAULT_RULE_PRESET: RulePresetId = 'baseline'

const BASELINE_RULES: GameRules = {
	boardSize: 5,
	minCellValue: 1,
	maxInitialValue: 3,
	spawnProbability: 1,
	spawnWeights: [{ value: 1, weight: 1 }],
	scoreBase: 10,
	initialEmptyRatio: 0,
}

/** Named presets used by Dev switcher and benchmarks. */
export const RULE_PRESETS: Record<RulePresetId, GameRules> = {
	baseline: { ...BASELINE_RULES, spawnWeights: [{ value: 1, weight: 1 }] },
	largerBoard: {
		...BASELINE_RULES,
		boardSize: 6,
		spawnWeights: [{ value: 1, weight: 1 }],
	},
	sparseSpawn: {
		...BASELINE_RULES,
		spawnProbability: 0.65,
		spawnWeights: [{ value: 1, weight: 1 }],
	},
	largerSparse: {
		...BASELINE_RULES,
		boardSize: 6,
		spawnProbability: 0.65,
		spawnWeights: [{ value: 1, weight: 1 }],
	},
	weightedSpawn: {
		...BASELINE_RULES,
		spawnProbability: 1,
		spawnWeights: [
			{ value: 1, weight: 3 },
			{ value: 2, weight: 1 },
		],
	},
	/** Extra candidate: light empties + softer spawn pressure on 5×5. */
	softStart: {
		...BASELINE_RULES,
		spawnProbability: 0.7,
		initialEmptyRatio: 0.12,
		spawnWeights: [{ value: 1, weight: 1 }],
	},
}

export const RULE_PRESET_IDS = Object.keys(RULE_PRESETS) as RulePresetId[]

/** Resolve a preset id to a fresh rules object (cloned weights). */
export function getRulesForPreset (id: RulePresetId): GameRules {
	const source = RULE_PRESETS[id]
	return {
		...source,
		spawnWeights: source.spawnWeights.map((entry) => ({ ...entry })),
	}
}

/** Deep-clone rules for immutable state updates. */
export function cloneRules (rules: GameRules): GameRules {
	return {
		...rules,
		spawnWeights: rules.spawnWeights.map((entry) => ({ ...entry })),
	}
}

/** Structural equality for rules (used by tests / persistence checks). */
export function rulesEqual (a: GameRules, b: GameRules): boolean {
	return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Backward-compatible constant aliases for baseline knobs.
 * Prefer reading `state.rules` inside engine logic.
 */
export const BOARD_SIZE = BASELINE_RULES.boardSize
export const MAX_INITIAL_VALUE = BASELINE_RULES.maxInitialValue
export const MIN_CELL_VALUE = BASELINE_RULES.minCellValue
export const SPAWN_VALUE = 1
export const SCORE_BASE = BASELINE_RULES.scoreBase
