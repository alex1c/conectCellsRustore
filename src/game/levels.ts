/**
 * Endless-run level progression (Phase 2.8).
 * Level 1 = approved base spawn gameplay (bonus chance 0%).
 * All thresholds / bonus rates are TUNABLE.
 */

/** Score required to *enter* each listed level (1-indexed via index+1). TUNABLE. */
export const LEVEL_SCORE_THRESHOLDS: readonly number[] = [
	0, // Level 1
	250, // Level 2
	600, // Level 3
	1200, // Level 4
	2200, // Level 5
]

/**
 * After Level 5, threshold deltas grow linearly:
 * Level 6 adds 1200, Level 7 adds 1400, Level 8 adds 1600, …
 * formula: delta(L) = 1000 + 200 * (L - 5) for L >= 6.
 * TUNABLE — keeps growth smooth without exponential spikes.
 */
export function getScoreThresholdForLevel (level: number): number {
	const safeLevel = Math.max(1, Math.floor(level))
	if (safeLevel <= LEVEL_SCORE_THRESHOLDS.length) {
		return LEVEL_SCORE_THRESHOLDS[safeLevel - 1]!
	}
	let score = LEVEL_SCORE_THRESHOLDS[LEVEL_SCORE_THRESHOLDS.length - 1]!
	for (let L = LEVEL_SCORE_THRESHOLDS.length + 1; L <= safeLevel; L += 1) {
		score += 1000 + 200 * (L - 5)
	}
	return score
}

/** Highest level whose entry threshold is <= score. */
export function getLevelForScore (score: number): number {
	const safeScore = Math.max(0, Math.floor(score))
	let level = 1
	// Unbounded table via formula; cap loop for pathological scores.
	while (getScoreThresholdForLevel(level + 1) <= safeScore) {
		level += 1
		if (level >= 100000) {
			break
		}
	}
	return level
}

/** Score needed to reach the next level after `level`. */
export function getNextLevelScore (level: number): number {
	return getScoreThresholdForLevel(Math.max(1, Math.floor(level)) + 1)
}

/** Progress within [currentLevelThreshold, nextLevelThreshold), clamped to [0, 1]. */
export function getLevelProgress (score: number): {
	level: number
	currentThreshold: number
	nextThreshold: number
	progress: number
} {
	const level = getLevelForScore(score)
	const currentThreshold = getScoreThresholdForLevel(level)
	const nextThreshold = getNextLevelScore(level)
	const span = Math.max(1, nextThreshold - currentThreshold)
	const progress = Math.min(
		1,
		Math.max(0, (score - currentThreshold) / span),
	)
	return { level, currentThreshold, nextThreshold, progress }
}

/**
 * Bonus spawn chance for the level active *before* a move.
 * Level 1: 0%; then +15% per level; hard cap 75%. TUNABLE.
 */
export const LEVEL_BONUS_SPAWN_CAP = 0.75
export const LEVEL_BONUS_SPAWN_STEP = 0.15

export function getBonusSpawnChance (level: number): number {
	const safeLevel = Math.max(1, Math.floor(level))
	if (safeLevel <= 1) {
		return 0
	}
	return Math.min(LEVEL_BONUS_SPAWN_CAP, LEVEL_BONUS_SPAWN_STEP * (safeLevel - 1))
}
