/**
 * Phase 4.4 — interactive tutorial isolation + persistence helpers.
 */

/* eslint-disable import/first -- jest.mock factories must precede imports */

const mockStorage = new Map<string, string>()

jest.mock('@react-native-async-storage/async-storage', () => ({
	__esModule: true,
	default: {
		getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
		setItem: jest.fn(async (key: string, value: string) => {
			mockStorage.set(key, value)
		}),
		removeItem: jest.fn(async (key: string) => {
			mockStorage.delete(key)
		}),
		clear: jest.fn(async () => {
			mockStorage.clear()
		}),
	},
}))

import {
	SETTINGS_DEFAULTS,
	STORAGE_KEY_ONBOARDING_DONE,
	parseBoolSetting,
} from '../../storage/settings'
import {
	loadOnboardingDone,
	saveOnboardingDone,
} from '../../storage/preferences'
import {
	TUTORIAL_STEP_COUNT,
	TUTORIAL_STEPS,
	getTutorialStep,
} from '../../ui/tutorial/tutorialSteps'
import {
	TUTORIAL_MERGE_DEST,
	TUTORIAL_MERGE_FROM,
	TUTORIAL_MOVE_DEST,
	TUTORIAL_SELECT_CELL,
	buildMergeSetupBoard,
	buildSelectMoveBoard,
} from '../../ui/tutorial/tutorialBoards'
import { applyMove, samePosition } from '../index'

describe('Phase 4.4 onboarding persistence', () => {
	beforeEach(async () => {
		mockStorage.clear()
	})

	it('defaults to tutorial required (flag unset)', async () => {
		expect(SETTINGS_DEFAULTS.onboardingDone).toBe(false)
		expect(await loadOnboardingDone()).toBe(false)
		expect(parseBoolSetting(null, false)).toBe(false)
	})

	it('persists completion and skip the same way', async () => {
		await saveOnboardingDone(true)
		expect(mockStorage.get(STORAGE_KEY_ONBOARDING_DONE)).toBe('true')
		expect(await loadOnboardingDone()).toBe(true)
		await saveOnboardingDone(false)
		expect(await loadOnboardingDone()).toBe(false)
	})
})

describe('Phase 4.4 tutorial steps', () => {
	it('exposes a short interactive step list', () => {
		expect(TUTORIAL_STEP_COUNT).toBeGreaterThanOrEqual(7)
		expect(TUTORIAL_STEP_COUNT).toBeLessThanOrEqual(12)
		expect(TUTORIAL_STEPS[0]?.id).toBe('select')
		expect(TUTORIAL_STEPS[TUTORIAL_STEP_COUNT - 1]?.id).toBe('done')
		expect(getTutorialStep(0).title).toContain('Выберите')
		expect(getTutorialStep(3).id).toBe('merge')
	})

	it('keeps guided destinations distinct', () => {
		expect(
			samePosition(TUTORIAL_SELECT_CELL, TUTORIAL_MOVE_DEST),
		).toBe(false)
		expect(
			samePosition(TUTORIAL_MERGE_FROM, TUTORIAL_MERGE_DEST),
		).toBe(false)
	})
})

describe('Phase 4.4 tutorial isolation contracts', () => {
	it('merge tutorial uses real engine result without touching storage keys', async () => {
		mockStorage.set('connectcells.saved.v1', 'sentinel')
		mockStorage.set('connectcells.best.v1', '9999')
		const beforeKeys = [...mockStorage.keys()].sort()
		const state = buildMergeSetupBoard()
		const result = applyMove(state, {
			from: TUTORIAL_MERGE_FROM,
			to: TUTORIAL_MERGE_DEST,
		})
		expect(result.ok).toBe(true)
		if (result.ok) {
			const merge = result.events.find((e) => e.type === 'MERGE')
			expect(merge && merge.type === 'MERGE' && merge.resultValue).toBe(4)
		}
		// applyMove is pure — storage must be untouched.
		expect([...mockStorage.keys()].sort()).toEqual(beforeKeys)
		expect(mockStorage.get('connectcells.best.v1')).toBe('9999')
	})

	it('select/move boards stay separate from merge setup', () => {
		const a = buildSelectMoveBoard()
		const b = buildMergeSetupBoard()
		expect(JSON.stringify(a.board)).not.toBe(JSON.stringify(b.board))
	})
})
