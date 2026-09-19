/**
 * Pure helpers for turn event playback ordering / delays (testable, no RN).
 * Engine remains authoritative; UI only schedules presentation.
 */

import type { GameEvent } from '../../game/types'
import {
	TIMING_CASCADE_PAUSE_MS,
	TIMING_MERGE_CONVERGE_MS,
	TIMING_MERGE_POP_LARGE_MS,
	TIMING_MERGE_POP_MS,
	TIMING_SCORE_POPUP_MS,
	TIMING_SPAWN_MS,
	TIMING_SPAWN_STAGGER_MS,
	pathStepMs,
} from './timings'

/** Expected presentation order for a successful turn. */
export const PLAYBACK_PHASE_ORDER = [
	'MOVE_PATH',
	'MERGE',
	'CASCADE',
	'SCORE',
	'SPAWN',
	'LEVEL_UP',
	'GAME_OVER',
] as const

export type PlaybackPhase = (typeof PLAYBACK_PHASE_ORDER)[number]

/** Map an engine event to a coarse playback phase label. */
export function phaseForEvent (event: GameEvent): PlaybackPhase {
	switch (event.type) {
		case 'MOVE':
			return 'MOVE_PATH'
		case 'MERGE':
			return event.cascadeLevel >= 2 ? 'CASCADE' : 'MERGE'
		case 'SCORE_GAIN':
			return 'SCORE'
		case 'SPAWN':
			return 'SPAWN'
		case 'LEVEL_UP':
			return 'LEVEL_UP'
		case 'GAME_OVER':
			return 'GAME_OVER'
		default:
			return 'MOVE_PATH'
	}
}

/**
 * Estimate wall-clock presentation ms for one event (excluding external toast).
 * Used by tests — actual UI may await slightly differently for UX polish.
 */
export function estimateEventDurationMs (event: GameEvent): number {
	switch (event.type) {
		case 'MOVE': {
			const hops = Math.max(1, event.path.length - 1)
			return hops * pathStepMs(event.path.length)
		}
		case 'MERGE': {
			const pop =
				event.groupSize >= 5
					? TIMING_MERGE_POP_LARGE_MS
					: TIMING_MERGE_POP_MS
			const cascadePad =
				event.cascadeLevel >= 2 ? TIMING_CASCADE_PAUSE_MS : 0
			return TIMING_MERGE_CONVERGE_MS + pop + cascadePad
		}
		case 'SCORE_GAIN':
			return Math.min(220, TIMING_SCORE_POPUP_MS / 2)
		case 'SPAWN': {
			const n = Math.max(1, event.cells.length)
			return TIMING_SPAWN_MS + (n - 1) * TIMING_SPAWN_STAGGER_MS
		}
		case 'LEVEL_UP':
			return 200
		case 'GAME_OVER':
			return 80
		default:
			return 0
	}
}

/** Verify event sequence is a valid turn playback order (non-decreasing phases). */
export function isValidPlaybackOrder (events: GameEvent[]): boolean {
	let lastIndex = -1
	for (const event of events) {
		const phase = phaseForEvent(event)
		const index = PLAYBACK_PHASE_ORDER.indexOf(phase)
		// MERGE and CASCADE may interleave with SCORE_GAIN after each merge.
		if (phase === 'SCORE') {
			continue
		}
		if (index < lastIndex) {
			return false
		}
		lastIndex = index
	}
	return true
}
