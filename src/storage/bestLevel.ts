/**
 * Highest-level-ever persistence helpers (lifetime progression stat).
 */

export const BEST_LEVEL_DEFAULT = 1

/** Normalize a stored best level; invalid values become 1. */
export function parseBestLevel (raw: unknown): number {
	if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 1) {
		return Math.floor(raw)
	}
	if (typeof raw === 'string') {
		const parsed = Number(raw)
		if (Number.isFinite(parsed) && parsed >= 1) {
			return Math.floor(parsed)
		}
	}
	return BEST_LEVEL_DEFAULT
}

/** Return the higher of current best level and a candidate level. */
export function resolveBestLevel (
	currentBest: number,
	candidate: number,
): number {
	const safeCurrent = parseBestLevel(currentBest)
	const safeCandidate = parseBestLevel(candidate)
	return Math.max(safeCurrent, safeCandidate)
}
