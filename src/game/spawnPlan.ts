/**
 * Engine-level spawn count planning from turn merge summary + rules.
 * UI must never decide spawn counts.
 */

import type { HexRules } from './rules'
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
	desiredCount: number
}

/**
 * Decide how many cells to attempt spawning after merge/cascade settle.
 * Does not place cells — spawnCells applies free-cell clamping.
 */
export function resolveSpawnPlan (
	summary: TurnMergeSummary,
	rules: HexRules,
	rng: RngState,
): SpawnPlan {
	if (rules.spawnPolicy === 'observedPressure') {
		if (!summary.mergeOccurred) {
			return { desiredCount: rules.observedNoMergeSpawn }
		}
		if (summary.maxMergedGroupSize >= 5) {
			return { desiredCount: rules.observedLargeMergeSpawn }
		}
		// Merge occurred and max group size is exactly in the "reward" band
		// (threshold..4). With threshold 4 this is merge-exactly-4 → +1.
		return { desiredCount: rules.observedMerge4Spawn }
	}

	// phase26: spawn only when the turn produced no merges.
	if (summary.mergeOccurred) {
		return { desiredCount: 0 }
	}
	return {
		desiredCount: pickWeightedCount(rng, rules.spawnCountWeights),
	}
}
