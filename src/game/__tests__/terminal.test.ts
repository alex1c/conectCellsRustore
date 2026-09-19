/**
 * Terminal clear rule: sourceValue >= 128 scores then vanishes (no result cell).
 * sourceValue < 128 keeps persistent result (source × 4).
 */

import { getCell, setCell } from '../board'
import {
	BOARD_COLS,
	BOARD_ROWS,
	MERGE_RESULT_FACTOR,
	MERGE_THRESHOLD,
	TERMINAL_SOURCE_MIN,
	applyMove,
	canUndo,
	createGameFromBoard,
	createEmptyHexBoard,
	findPath,
	gameStatesEqual,
	isTerminalMerge,
	loadFixture,
	undo,
	type Move,
} from '../index'
import { resolveMergesAndCascades } from '../merge'
import {
	buildSavedGamePayload,
	deserializeSavedGamePayload,
	serializeSavedGamePayload,
} from '../../storage/savedGame'

function boardFromSparse (
	cells: { row: number; col: number; value: number }[],
) {
	let board = createEmptyHexBoard()
	for (const cell of cells) {
		board = setCell(board, { row: cell.row, col: cell.col }, cell.value)
	}
	return board
}

describe('terminal threshold helpers', () => {
	it('treats sourceValue >= 128 as terminal', () => {
		expect(TERMINAL_SOURCE_MIN).toBe(128)
		expect(isTerminalMerge(64)).toBe(false)
		expect(isTerminalMerge(128)).toBe(true)
		expect(isTerminalMerge(256)).toBe(true)
		expect(isTerminalMerge(512)).toBe(true)
	})
})

describe('persistent merge below terminal threshold', () => {
	it('4×64 → persistent 256 on the destination', () => {
		const state = createGameFromBoard({
			seed: 9100,
			board: boardFromSparse([
				{ row: 0, col: 0, value: 64 },
				{ row: 3, col: 2, value: 64 },
				{ row: 3, col: 3, value: 64 },
				{ row: 4, col: 2, value: 64 },
			]),
		})
		const from = { row: 0, col: 0 }
		const to = { row: 4, col: 3 }
		expect(findPath(state.board, from, to, BOARD_COLS, BOARD_ROWS).reachable)
			.toBe(true)
		const result = applyMove(state, { from, to })
		expect(result.ok).toBe(true)
		const merge = result.events.find((e) => e.type === 'MERGE')
		expect(merge && merge.type === 'MERGE' && merge.resultValue).toBe(256)
		expect(merge && merge.type === 'MERGE' && merge.scoreGain).toBe(256)
		expect(getCell(result.state.board, to)).toBe(256)
		expect(result.events.some((e) => e.type === 'TERMINAL_CLEAR')).toBe(false)
		expect(result.state.largestValue).toBeGreaterThanOrEqual(256)
	})
})

describe('terminal clear — 128 and 256', () => {
	it('4×128 → +512 score → destination EMPTY + TERMINAL_CLEAR', () => {
		const state = loadFixture('terminal128')
		const from = { row: 0, col: 0 }
		const to = { row: 4, col: 3 }
		expect(findPath(state.board, from, to, BOARD_COLS, BOARD_ROWS).reachable)
			.toBe(true)
		const beforeScore = state.score
		const result = applyMove(state, { from, to })
		expect(result.ok).toBe(true)

		const term = result.events.find((e) => e.type === 'TERMINAL_CLEAR')
		expect(term).toBeDefined()
		if (term && term.type === 'TERMINAL_CLEAR') {
			expect(term.sourceValue).toBe(128)
			expect(term.groupSize).toBe(4)
			expect(term.scoreGain).toBe(512)
			expect(term.position).toEqual(to)
		}
		expect(result.events.some((e) => e.type === 'MERGE')).toBe(false)
		expect(result.state.score - beforeScore).toBe(512)
		expect(getCell(result.state.board, to)).toBeNull()
		// No fictional 512 result — largestValue tracks source that existed.
		expect(result.state.largestValue).toBeGreaterThanOrEqual(128)
		expect(result.state.largestValue).toBeLessThan(512)
	})

	it('5×128 → +640 score → destination EMPTY', () => {
		const state = loadFixture('terminalLargeGroup')
		const from = { row: 0, col: 0 }
		const to = { row: 4, col: 3 }
		expect(findPath(state.board, from, to, BOARD_COLS, BOARD_ROWS).reachable)
			.toBe(true)
		const beforeScore = state.score
		const result = applyMove(state, { from, to })
		expect(result.ok).toBe(true)

		const term = result.events.find((e) => e.type === 'TERMINAL_CLEAR')
		expect(term && term.type === 'TERMINAL_CLEAR' && term.groupSize).toBe(5)
		expect(term && term.type === 'TERMINAL_CLEAR' && term.scoreGain).toBe(640)
		expect(result.state.score - beforeScore).toBe(640)
		expect(getCell(result.state.board, to)).toBeNull()
	})

	it('4×256 → +1024 score → destination EMPTY', () => {
		const state = loadFixture('terminal256')
		const from = { row: 0, col: 0 }
		const to = { row: 4, col: 3 }
		const beforeScore = state.score
		const result = applyMove(state, { from, to })
		expect(result.ok).toBe(true)

		const term = result.events.find((e) => e.type === 'TERMINAL_CLEAR')
		expect(term && term.type === 'TERMINAL_CLEAR' && term.sourceValue).toBe(256)
		expect(term && term.type === 'TERMINAL_CLEAR' && term.scoreGain).toBe(1024)
		expect(result.state.score - beforeScore).toBe(1024)
		expect(getCell(result.state.board, to)).toBeNull()
		expect(result.state.largestValue).toBeGreaterThanOrEqual(256)
		// Do not invent a persistent 1024 on the board / as board-derived largest.
		expect(getCell(result.state.board, to)).toBeNull()
	})

	it('5×256 → +1280 score → destination EMPTY', () => {
		const cascade = resolveMergesAndCascades(
			boardFromSparse([
				{ row: 2, col: 2, value: 256 },
				{ row: 3, col: 2, value: 256 },
				{ row: 3, col: 3, value: 256 },
				{ row: 4, col: 2, value: 256 },
				{ row: 4, col: 3, value: 256 },
			]),
			BOARD_COLS,
			BOARD_ROWS,
			MERGE_THRESHOLD,
			MERGE_RESULT_FACTOR,
			{ row: 4, col: 3 },
			0,
		)
		expect(cascade.scoreGain).toBe(1280)
		expect(cascade.events.some((e) => e.type === 'TERMINAL_CLEAR')).toBe(true)
		const term = cascade.events.find((e) => e.type === 'TERMINAL_CLEAR')
		expect(term && term.type === 'TERMINAL_CLEAR' && term.groupSize).toBe(5)
		expect(getCell(cascade.board, { row: 4, col: 3 })).toBeNull()
		expect(cascade.finalLargestValue).toBe(256)
	})
})

describe('terminal cascade + spawn + undo', () => {
	it('cascade into terminal stops at empty anchor', () => {
		const state = loadFixture('cascadeTerminal')
		const from = { row: 0, col: 0 }
		const to = { row: 4, col: 2 }
		expect(findPath(state.board, from, to, BOARD_COLS, BOARD_ROWS).reachable)
			.toBe(true)
		const result = applyMove(state, { from, to })
		expect(result.ok).toBe(true)

		const merges = result.events.filter((e) => e.type === 'MERGE')
		const terminals = result.events.filter((e) => e.type === 'TERMINAL_CLEAR')
		expect(merges.length).toBeGreaterThanOrEqual(1)
		expect(terminals.length).toBeGreaterThanOrEqual(1)
		// First step should place 128; terminal then clears the 128-group.
		const firstMerge = merges[0]
		expect(
			firstMerge && firstMerge.type === 'MERGE' && firstMerge.resultValue,
		).toBe(128)
		const term = terminals[0]
		expect(term && term.type === 'TERMINAL_CLEAR' && term.sourceValue).toBe(128)
		expect(getCell(result.state.board, term!.position)).toBeNull()
	})

	it('terminal merge counts as merge for spawn pressure (group size)', () => {
		const state = loadFixture('terminal128')
		const result = applyMove(state, {
			from: { row: 0, col: 0 },
			to: { row: 4, col: 3 },
		})
		expect(result.ok).toBe(true)
		expect(result.turn?.mergeOccurred).toBe(true)
		expect(result.turn?.maxMergedGroupSize).toBe(4)
		// observedPressure: merge4 → base spawn 1 (may still spawn).
		expect(result.turn?.baseSpawnCount).toBeDefined()
	})

	it('Undo restores complete pre-turn state; replay is deterministic', () => {
		const state = loadFixture('terminal128')
		const move: Move = { from: { row: 0, col: 0 }, to: { row: 4, col: 3 } }
		const after = applyMove(state, move)
		expect(after.ok).toBe(true)
		expect(canUndo(after.state)).toBe(true)
		const restored = undo(after.state)
		expect(restored.score).toBe(state.score)
		expect(JSON.stringify(restored.board)).toBe(JSON.stringify(state.board))
		expect(restored.rng.s).toBe(state.rng.s)
		const replay = applyMove(restored, move)
		expect(gameStatesEqual(replay.state, after.state)).toBe(true)
	})

	it('persistence round-trip remains valid after terminal turn', () => {
		const state = loadFixture('terminal256')
		const after = applyMove(state, {
			from: { row: 0, col: 0 },
			to: { row: 4, col: 3 },
		})
		expect(after.ok).toBe(true)
		const json = serializeSavedGamePayload(
			buildSavedGamePayload(after.state, Date.now()),
		)
		const restored = deserializeSavedGamePayload(json)
		expect(restored).not.toBeNull()
		expect(restored && gameStatesEqual(restored.game, after.state)).toBe(true)
	})
})
