/**
 * Centralized animation timing constants (Phase 3 hotfix).
 * Path movement uses total-duration budgets with a hard cap — not per-step × N.
 */

/** Gentle selection lift / wobble cycle piece. */
export const TIMING_SELECTION_MS = 80

/** Total movement budgets by hop count (path.length - 1). */
export const TIMING_PATH_TOTAL_SHORT_MS = 120
export const TIMING_PATH_TOTAL_MEDIUM_MS = 180
export const TIMING_PATH_TOTAL_LONG_MS = 250

/** Hard cap for entire BFS path playback. */
export const TIMING_PATH_TOTAL_CAP_MS = 300

/** Cleared cells shrink / converge toward merge anchor. */
export const TIMING_MERGE_CONVERGE_MS = 90

/** Anchor pop after merge result appears. */
export const TIMING_MERGE_POP_MS = 80

/** Extra pop emphasis for groupSize >= 5. */
export const TIMING_MERGE_POP_LARGE_MS = 100

/** Pause between cascade merge steps (keep readable). */
export const TIMING_CASCADE_PAUSE_MS = 120

/** Score popup float duration (UI overlay; playback awaits less). */
export const TIMING_SCORE_POPUP_MS = 320

/** Score flash wait during playback. */
export const TIMING_SCORE_FLASH_MS = 90

/** Spawn scale-in duration. */
export const TIMING_SPAWN_MS = 110

/** Stagger between multiple spawn cells. */
export const TIMING_SPAWN_STAGGER_MS = 22

/** Level-up toast display window. */
export const TIMING_LEVEL_UP_MS = 1200

/** Path-blocked hint / shake flash. */
export const TIMING_BLOCKED_FLASH_MS = 320

/** Chain indicator toast. */
export const TIMING_CHAIN_TOAST_MS = 600

/**
 * Total wall-clock ms to play the full BFS path (including origin).
 * Short 1–3 hops ≈ 100–140ms, medium 4–7 ≈ 160–210ms, long 8+ ≈ 220–280ms,
 * hard-capped at TIMING_PATH_TOTAL_CAP_MS.
 */
export function pathTotalMs (pathLength: number): number {
	const hops = Math.max(1, pathLength - 1)
	if (hops >= 12) {
		return TIMING_PATH_TOTAL_CAP_MS
	}
	let total: number
	if (hops <= 3) {
		total = TIMING_PATH_TOTAL_SHORT_MS + (hops - 1) * 10
	} else if (hops <= 7) {
		total = TIMING_PATH_TOTAL_MEDIUM_MS + (hops - 4) * 8
	} else {
		total = TIMING_PATH_TOTAL_LONG_MS + Math.min(30, (hops - 8) * 4)
	}
	return Math.min(TIMING_PATH_TOTAL_CAP_MS, total)
}

/**
 * Per-hop delay derived from the total budget so long paths stay visible
 * but never exceed the hard cap.
 */
export function pathStepMs (pathLength: number): number {
	const hops = Math.max(1, pathLength - 1)
	return Math.max(16, Math.round(pathTotalMs(pathLength) / hops))
}
