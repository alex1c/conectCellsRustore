/**
 * Centralized animation timing constants (terminal clear + rhythm hotfix).
 * Path movement uses total-duration budgets with a hard cap — not per-step × N.
 */

/** Gentle selection lift / wobble cycle piece. */
export const TIMING_SELECTION_MS = 80

/**
 * Total movement budgets by hop count (path.length - 1).
 * Targets: 1hop ~80ms, 3hops ~100ms, 6hops ~140ms, 10hops ~175ms, cap 200ms.
 */
export const TIMING_PATH_TOTAL_SHORT_MS = 80
export const TIMING_PATH_TOTAL_MEDIUM_MS = 125
export const TIMING_PATH_TOTAL_LONG_MS = 165

/** Hard cap for entire BFS path playback. */
export const TIMING_PATH_TOTAL_CAP_MS = 200

/** Cleared cells shrink / converge toward merge anchor. */
export const TIMING_MERGE_CONVERGE_MS = 75

/** Anchor pop after merge result appears. */
export const TIMING_MERGE_POP_MS = 70

/** Extra pop emphasis for groupSize >= 5. */
export const TIMING_MERGE_POP_LARGE_MS = 85

/** Brief celebratory beat after terminal group clears (no result cell). */
export const TIMING_TERMINAL_CLEAR_MS = 180

/** Pause between cascade merge steps (keep readable, not sluggish). */
export const TIMING_CASCADE_PAUSE_MS = 90

/** Score popup float duration (decorative; does not block input unlock). */
export const TIMING_SCORE_POPUP_MS = 320

/** Score flash visual (decorative; playback does not await). */
export const TIMING_SCORE_FLASH_MS = 90

/** Spawn scale-in duration. */
export const TIMING_SPAWN_MS = 90

/** Stagger between multiple spawn cells (near-simultaneous). */
export const TIMING_SPAWN_STAGGER_MS = 8

/** Level-up toast display window (non-blocking for input). */
export const TIMING_LEVEL_UP_MS = 1200

/** Path-blocked hint / shake flash. */
export const TIMING_BLOCKED_FLASH_MS = 320

/** Chain indicator toast. */
export const TIMING_CHAIN_TOAST_MS = 600

/**
 * Total wall-clock ms to play the full BFS path (including origin).
 * Smooth hop-scaled curve with hard cap at TIMING_PATH_TOTAL_CAP_MS.
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
	// Floor low enough that hops × step stays near the total budget hard cap.
	return Math.max(8, Math.round(pathTotalMs(pathLength) / hops))
}
