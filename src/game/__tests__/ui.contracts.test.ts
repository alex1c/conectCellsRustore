/**
 * Regression guards for hex UI contracts (no RN renderer required).
 */

import * as GameSurface from '../index'
import {
	FIXTURE_BUILDERS,
	FIXTURE_IDS,
	loadFixture,
	type FixtureId,
} from '../fixtures'
import { getHexCellVisual } from '../../ui/theme/cellVisuals'

describe('hex UI contracts (runtime white-screen regressions)', () => {
	it('exposes a concrete FIXTURE_IDS array for DevPanel mapping', () => {
		expect(Array.isArray(FIXTURE_IDS)).toBe(true)
		expect(FIXTURE_IDS.length).toBeGreaterThan(0)
		for (const id of FIXTURE_IDS) {
			expect(typeof id).toBe('string')
			expect(FIXTURE_BUILDERS[id]).toEqual(expect.any(Function))
			const state = loadFixture(id)
			expect(state.board.length).toBe(8)
			expect(state.board[0]?.length).toBe(6)
		}
	})

	it('does not expose removed square rule preset ids', () => {
		const surface = GameSurface as Record<string, unknown>
		expect(surface.RULE_PRESET_IDS).toBeUndefined()
		expect(surface.DEFAULT_RULE_PRESET).toBeUndefined()
		expect(surface.getRulePreset).toBeUndefined()
	})

	it('maps every current hex cell value to a visual style', () => {
		const values: (number | null)[] = [
			null,
			1,
			2,
			4,
			8,
			16,
			32,
			64,
			128,
			256,
			512,
		]
		for (const value of values) {
			const visual = getHexCellVisual(value)
			expect(visual.fill).toEqual(expect.any(String))
			expect(visual.text).toEqual(expect.any(String))
			expect(visual.stroke).toEqual(expect.any(String))
			expect(visual.fill.length).toBeGreaterThan(0)
		}
	})

	it('keeps fixture id union aligned with FIXTURE_IDS literal', () => {
		const builderKeys = Object.keys(FIXTURE_BUILDERS).sort()
		const ids = [...FIXTURE_IDS].sort()
		expect(ids).toEqual(builderKeys)
		const sample: FixtureId = 'balancedBoard'
		expect(loadFixture(sample).score).toBeGreaterThanOrEqual(0)
	})
})
