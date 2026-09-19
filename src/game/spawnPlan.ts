/**
 * Engine-level spawn count planning from turn merge summary + rules + level.
 * UI must never decide spawn counts.
 */

import { getBonusSpawnChance } from './levels'
import type { HexRules } from './rules'
import { nextFloat } from './random'
import { pickWeightedCount } from './weighted'
import type { RngState } from './types'

/** Merge outcome of a completed player turn (before spawn). */
export interface TurnMergeSummary {
	mergeOccurred: boolean
	mergeCount: number
	/** Largest group absorbed in this turn (across all cascade steps). */
	maxMergedGroupSize: number
	/** Cascade depth (1 = single merge step, 2+ = multi-step). */
	cascadeDepth: number
	scoreGain: number
	/** Group sizes in merge order, e.g. [4, 5] for telemetry. */
	groupSizes: number[]
}

export interface SpawnPlan {
	/** Cells from the Level-1 / base spawn policy. */
	baseCount: number
	/** 0 or 1 — level bonus cell (only when baseCount > 0). */
	bonusCount: number
	desiredCount: number
}

/**
 * Base spawn plan (Level 1 algorithm). Independent of progression level.
 */
export function resolveBaseSpawnPlan (
	summary: TurnMergeSummary,
	rules: HexRules,
	rng: RngState,
): { desiredCount: number } {
	if (rules.spawnPolicy === 'observedPressure') {
		if (!summary.mergeOccurred) {
			return { desiredCount: rules.observedNoMergeSpawn }
		}
		if (summary.maxMergedGroupSize >= 5) {
			return { desiredCount: rules.observedLargeMergeSpawn }
		}
		return { desiredCount: rules.observedMerge4Spawn }
	}

	if (summary.mergeOccurred) {
		return { desiredCount: 0 }
	}
	return {
		desiredCount: pickWeightedCount(rng, rules.spawnCountWeights),
	}
}

/**
 * Decide how many cells to attempt spawning after merge/cascade settle.
 * Level pressure may add one bonus cell when baseCount > 0.
 * Level is the level *before* the move (threshold timing).
 */
export function resolveSpawnPlan (
	summary: TurnMergeSummary,
	rules: HexRules,
	rng: RngState,
	levelBeforeMove: number,
): SpawnPlan {
	const base = resolveBaseSpawnPlan(summary, rules, rng)
	const baseCount = base.desiredCount
	let bonusCount = 0

	// Strong merges that fully suppress spawn stay clean at every level.
	if (baseCount > 0) {
		const chance = getBonusSpawnChance(levelBeforeMove)
		// Chance 0 must not consume RNG — keeps Level 1 bit-identical.
		if (chance > 0 && nextFloat(rng) < chance) {
			bonusCount = 1
		}
	}

	return {
		baseCount,
		bonusCount,
		desiredCount: baseCount + bonusCount,
	}
}
