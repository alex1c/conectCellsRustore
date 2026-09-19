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
	TIMING_SPAWN_MS,
	TIMING_SPAWN_STAGGER_MS,
	TIMING_TERMINAL_CLEAR_MS,
	pathTotalMs,
} from './timings'

/** Expected presentation order for a successful turn. */
export const PLAYBACK_PHASE_ORDER = [
	'MOVE_PATH',
	'MERGE',
	'CASCADE',
	'TERMINAL',
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
		case 'TERMINAL_CLEAR':
			return 'TERMINAL'
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
 * Estimate critical (input-locking) wall-clock ms for one event.
 * Decorative score flash / level-up toast do not count toward lock.
 */
export function estimateEventDurationMs (event: GameEvent): number {
	switch (event.type) {
		case 'MOVE':
			return pathTotalMs(event.path.length)
		case 'MERGE': {
			const pop =
				event.groupSize >= 5
					? TIMING_MERGE_POP_LARGE_MS
					: TIMING_MERGE_POP_MS
			const cascadePad =
				event.cascadeLevel >= 2 ? TIMING_CASCADE_PAUSE_MS : 0
			return TIMING_MERGE_CONVERGE_MS + pop + cascadePad
		}
		case 'TERMINAL_CLEAR':
			return TIMING_TERMINAL_CLEAR_MS
		case 'SCORE_GAIN':
			// Non-blocking decorative flash — does not extend input lock.
			return 0
		case 'SPAWN': {
			const n = Math.max(1, event.cells.length)
			return TIMING_SPAWN_MS + (n - 1) * TIMING_SPAWN_STAGGER_MS
		}
		case 'LEVEL_UP':
			// Toast animates independently; unlock is not gated on it.
			return 0
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
		// SCORE may appear after merges; TERMINAL sits between merge and score.
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
