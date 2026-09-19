/**
 * Centralized animation timing constants (Phase 3).
 * Tunable after real-device review — do not scatter magic ms in components.
 */

/** Gentle selection lift / wobble cycle piece. */
export const TIMING_SELECTION_MS = 100

/** Per-hex path step (short paths). */
export const TIMING_PATH_STEP_MS = 55

/** Cap for long BFS paths so turns stay snappy. */
export const TIMING_PATH_STEP_MIN_MS = 32

/** Paths longer than this use accelerated step timing. */
export const TIMING_PATH_ACCEL_AFTER = 6

/** Cleared cells shrink / converge toward merge anchor. */
export const TIMING_MERGE_CONVERGE_MS = 140

/** Anchor pop after merge result appears. */
export const TIMING_MERGE_POP_MS = 110

/** Extra pop emphasis for groupSize >= 5. */
export const TIMING_MERGE_POP_LARGE_MS = 140

/** Pause between cascade merge steps. */
export const TIMING_CASCADE_PAUSE_MS = 160

/** Score popup float duration. */
export const TIMING_SCORE_POPUP_MS = 420

/** Spawn scale-in duration. */
export const TIMING_SPAWN_MS = 150

/** Stagger between multiple spawn cells. */
export const TIMING_SPAWN_STAGGER_MS = 35

/** Level-up toast display window. */
export const TIMING_LEVEL_UP_MS = 1200

/** Path-blocked hint / shake flash. */
export const TIMING_BLOCKED_FLASH_MS = 420

/** Chain indicator toast. */
export const TIMING_CHAIN_TOAST_MS = 700

/**
 * Path step duration for a path of the given length (including origin).
 * Longer routes accelerate so playback stays under ~0.5s of travel.
 */
export function pathStepMs (pathLength: number): number {
	const hops = Math.max(1, pathLength - 1)
	if (hops <= TIMING_PATH_ACCEL_AFTER) {
		return TIMING_PATH_STEP_MS
	}
	const over = hops - TIMING_PATH_ACCEL_AFTER
	return Math.max(
		TIMING_PATH_STEP_MIN_MS,
		TIMING_PATH_STEP_MS - over * 4,
	)
}
