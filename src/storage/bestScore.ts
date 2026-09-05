/**
 * Best-score persistence helpers (pure parsing / compare logic).
 */

export const BEST_SCORE_DEFAULT = 0

/** Normalize a stored best score; invalid values become 0. */
export function parseBestScore (raw: unknown): number {
	if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
		return Math.floor(raw)
	}
	if (typeof raw === 'string') {
		const parsed = Number(raw)
		if (Number.isFinite(parsed) && parsed >= 0) {
			return Math.floor(parsed)
		}
	}
	return BEST_SCORE_DEFAULT
}

/** Return the higher of current best and a candidate score. */
export function resolveBestScore (currentBest: number, candidate: number): number {
	const safeCurrent = parseBestScore(currentBest)
	const safeCandidate = parseBestScore(candidate)
	return Math.max(safeCurrent, safeCandidate)
}
