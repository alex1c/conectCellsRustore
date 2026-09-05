/**
 * Scoring helpers for merge and chain steps.
 */

import { SCORE_BASE } from './constants'

/**
 * Points for replacing value V with V+1 at a given chain level L.
 * gain = SCORE_BASE * V * L
 */
export function scoreForStep (fromValue: number, chainLevel: number): number {
	if (fromValue < 1 || chainLevel < 1) {
		return 0
	}
	return SCORE_BASE * fromValue * chainLevel
}
