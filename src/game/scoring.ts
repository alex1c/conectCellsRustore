/**
 * Scoring helpers for merge and chain steps.
 */

/**
 * Points for replacing value V with V+1 at a given chain level L.
 * gain = scoreBase * V * L
 */
export function scoreForStep (
	fromValue: number,
	chainLevel: number,
	scoreBase: number,
): number {
	if (fromValue < 1 || chainLevel < 1) {
		return 0
	}
	return scoreBase * fromValue * chainLevel
}
