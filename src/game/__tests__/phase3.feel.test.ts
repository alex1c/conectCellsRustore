/**
 * Phase 3 polish / settings / playback regression tests (no RN renderer).
 */

import {
	DEFAULT_RULE_PRESET,
	applyMove,
	createInitialGame,
	loadFixture,
	type GameEvent,
} from '../index'
import {
	estimateEventDurationMs,
	isValidPlaybackOrder,
	phaseForEvent,
} from '../../ui/feel/eventPlayback'
import { pathStepMs } from '../../ui/feel/timings'
import {
	getHexCellVisual,
	hexValueFontSize,
} from '../../ui/theme/cellVisuals'
import {
	SETTINGS_DEFAULTS,
	parseBoolSetting,
} from '../../storage/settings'
import { ONBOARDING_STEP_COUNT } from '../../ui/components/OnboardingModal'

describe('Phase 3 settings helpers', () => {
	it('parses sound/haptic/onboarding flags with safe defaults', () => {
		expect(parseBoolSetting(null, true)).toBe(true)
		expect(parseBoolSetting('false', true)).toBe(false)
		expect(parseBoolSetting('true', false)).toBe(true)
		expect(parseBoolSetting('bogus', false)).toBe(false)
		expect(SETTINGS_DEFAULTS.soundEnabled).toBe(true)
		expect(SETTINGS_DEFAULTS.hapticEnabled).toBe(true)
		expect(SETTINGS_DEFAULTS.onboardingDone).toBe(false)
	})

	it('keeps onboarding to four steps', () => {
		expect(ONBOARDING_STEP_COUNT).toBe(4)
	})
})

describe('Phase 3 event playback helpers', () => {
	it('maps engine events to playback phases', () => {
		expect(phaseForEvent({ type: 'GAME_OVER' })).toBe('GAME_OVER')
		expect(
			phaseForEvent({
				type: 'MERGE',
				value: 1,
				resultValue: 4,
				groupSize: 4,
				cleared: [],
				resultAt: { row: 0, col: 0 },
				cascadeLevel: 1,
				scoreGain: 4,
			}),
		).toBe('MERGE')
		expect(
			phaseForEvent({
				type: 'MERGE',
				value: 1,
				resultValue: 4,
				groupSize: 4,
				cleared: [],
				resultAt: { row: 0, col: 0 },
				cascadeLevel: 2,
				scoreGain: 4,
			}),
		).toBe('CASCADE')
	})

	it('accepts a typical turn event order', () => {
		const events: GameEvent[] = [
			{
				type: 'MOVE',
				from: { row: 0, col: 0 },
				to: { row: 0, col: 1 },
				value: 1,
				path: [
					{ row: 0, col: 0 },
					{ row: 0, col: 1 },
				],
			},
			{
				type: 'MERGE',
				value: 1,
				resultValue: 4,
				groupSize: 4,
				cleared: [],
				resultAt: { row: 0, col: 1 },
				cascadeLevel: 1,
				scoreGain: 4,
			},
			{ type: 'SCORE_GAIN', amount: 4, total: 4 },
			{
				type: 'SPAWN',
				cells: [{ position: { row: 1, col: 1 }, value: 1 }],
			},
		]
		expect(isValidPlaybackOrder(events)).toBe(true)
		expect(estimateEventDurationMs(events[0]!)).toBeGreaterThan(0)
	})

	it('accelerates long path step timing', () => {
		expect(pathStepMs(3)).toBeGreaterThanOrEqual(pathStepMs(12))
	})
})

describe('Phase 3 visuals + screenshot fixtures', () => {
	it('maps high values to readable styles and font sizes', () => {
		for (const value of [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 4096, 16384]) {
			const visual = getHexCellVisual(value)
			expect(visual.fill.length).toBeGreaterThan(0)
			expect(hexValueFontSize(value, 48)).toBeLessThanOrEqual(48 * 0.4)
		}
		expect(getHexCellVisual(null).fill.length).toBeGreaterThan(0)
	})

	it('exposes valid screenshot fixtures', () => {
		const ids = [
			'screenshotNormal',
			'screenshotMove',
			'screenshotMerge',
			'screenshotCascade',
			'screenshotHigh',
			'screenshotLevel',
		] as const
		for (const id of ids) {
			const state = loadFixture(id)
			expect(state.board).toHaveLength(8)
			expect(state.board[0]).toHaveLength(6)
			expect(state.score).toBeGreaterThanOrEqual(0)
		}
		expect(loadFixture('screenshotLevel').score).toBeGreaterThanOrEqual(1200)
	})

	it('keeps Level 1 default ruleset frozen', () => {
		expect(DEFAULT_RULE_PRESET).toBe('observedPressure')
		const a = createInitialGame(42)
		const b = createInitialGame(42)
		expect(a.rules.spawnPolicy).toBe('observedPressure')
		expect(JSON.stringify(a.board)).toBe(JSON.stringify(b.board))
		const move = {
			from: { row: 0, col: 0 },
			to: { row: 0, col: 1 },
		}
		// Illegal/blocked moves must not mutate RNG when rejected.
		const before = a.rng.s
		const result = applyMove(a, move)
		if (!result.ok) {
			expect(a.rng.s).toBe(before)
		}
	})
})
