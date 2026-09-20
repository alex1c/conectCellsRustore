/**
 * Verify tutorial board destinations before wiring the UI.
 */

import {
	applyMove,
	getReachableFrom,
} from '../index'
import {
	TUTORIAL_MERGE_DEST,
	TUTORIAL_MERGE_FROM,
	TUTORIAL_MOVE_DEST,
	TUTORIAL_SELECT_CELL,
	TUTORIAL_SPAWN_DEST,
	TUTORIAL_SPAWN_FROM,
	buildMergeSetupBoard,
	buildSelectMoveBoard,
	buildSpawnBoard,
} from '../../ui/tutorial/tutorialBoards'

describe('tutorial board destinations', () => {
	it('allows select→move neighbor hop', () => {
		const state = buildSelectMoveBoard()
		const reach = getReachableFrom(
			state.board,
			TUTORIAL_SELECT_CELL,
			state.rules.boardCols,
			state.rules.boardRows,
		)
		expect(
			reach.some(
				(p) =>
					p.row === TUTORIAL_MOVE_DEST.row &&
					p.col === TUTORIAL_MOVE_DEST.col,
			),
		).toBe(true)
		const result = applyMove(state, {
			from: TUTORIAL_SELECT_CELL,
			to: TUTORIAL_MOVE_DEST,
		})
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.events.some((e) => e.type === 'MOVE')).toBe(true)
			expect(result.events.some((e) => e.type === 'MERGE')).toBe(false)
		}
	})

	it('merge setup completes 4×1 → 4', () => {
		const state = buildMergeSetupBoard()
		const reach = getReachableFrom(
			state.board,
			TUTORIAL_MERGE_FROM,
			state.rules.boardCols,
			state.rules.boardRows,
		)
		expect(
			reach.some(
				(p) =>
					p.row === TUTORIAL_MERGE_DEST.row &&
					p.col === TUTORIAL_MERGE_DEST.col,
			),
		).toBe(true)
		const result = applyMove(state, {
			from: TUTORIAL_MERGE_FROM,
			to: TUTORIAL_MERGE_DEST,
		})
		expect(result.ok).toBe(true)
		if (result.ok) {
			const merge = result.events.find((e) => e.type === 'MERGE')
			expect(merge).toBeTruthy()
			if (merge && merge.type === 'MERGE') {
				expect(merge.groupSize).toBe(4)
				expect(merge.resultValue).toBe(4)
			}
		}
	})

	it('spawn board move does not merge', () => {
		const state = buildSpawnBoard()
		const result = applyMove(state, {
			from: TUTORIAL_SPAWN_FROM,
			to: TUTORIAL_SPAWN_DEST,
		})
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.events.some((e) => e.type === 'MERGE')).toBe(false)
			expect(result.events.some((e) => e.type === 'SPAWN')).toBe(true)
		}
	})
})
