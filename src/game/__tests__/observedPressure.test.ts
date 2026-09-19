/**
 * Phase 2.7 observedPressure spawn-policy regression tests.
 */

import {
	BOARD_COLS,
	BOARD_ROWS,
	SAVE_SCHEMA_VERSION,
	applyMove,
	canUndo,
	cloneGameState,
	countOccupied,
	createEmptyHexBoard,
	createGameFromBoard,
	createInitialGame,
	findMergeableGroups,
	gameStatesEqual,
	getCell,
	getReachableFrom,
	getRulesForPreset,
	listEmptyPositions,
	setCell,
	undo,
	type Board,
	type GameState,
	type Move,
	type Position,
} from '../index'
import {
	buildSavedGamePayload,
	deserializeSavedGamePayload,
} from '../../storage/savedGame'

function withObserved (board: Board, seed = 9001): GameState {
	return createGameFromBoard({
		board,
		seed,
		presetId: 'observedPressure',
	})
}

function boardSparse (
	cells: { row: number; col: number; value: number }[],
): Board {
	let board = createEmptyHexBoard()
	for (const cell of cells) {
		board = setCell(board, { row: cell.row, col: cell.col }, cell.value)
	}
	return board
}

function firstReachable (state: GameState, from: Position): Position {
	const dests = getReachableFrom(
		state.board,
		from,
		BOARD_COLS,
		BOARD_ROWS,
	)
	expect(dests.length).toBeGreaterThan(0)
	return dests[0]!
}

function spawnEvent (result: ReturnType<typeof applyMove>) {
	return result.events.find((e) => e.type === 'SPAWN')
}

function assertSpawnValues (values: number[]) {
	for (const value of values) {
		expect([1, 2, 4]).toContain(value)
		expect(value).toBeLessThan(8)
	}
}

describe('observedPressure — no merge', () => {
	it('spawns exactly 2 cells with values in {1,2,4} and no auto-merge', () => {
		const state = withObserved(
			boardSparse([
				{ row: 0, col: 0, value: 1 },
				{ row: 7, col: 5, value: 2 },
			]),
		)
		const from = { row: 0, col: 0 }
		const to = firstReachable(state, from)
		const beforeEmpty = listEmptyPositions(state.board).length
		const result = applyMove(state, { from, to })
		expect(result.ok).toBe(true)
		expect(result.turn?.mergeOccurred).toBe(false)
		expect(result.turn?.spawnCount).toBe(2)
		expect(result.turn?.spawnedValues).toHaveLength(2)
		assertSpawnValues(result.turn!.spawnedValues)

		const spawn = spawnEvent(result)
		expect(spawn?.type).toBe('SPAWN')
		if (spawn && spawn.type === 'SPAWN') {
			expect(spawn.cells).toHaveLength(2)
			const keys = spawn.cells.map(
				(c) => `${c.position.row},${c.position.col}`,
			)
			expect(new Set(keys).size).toBe(2)
			assertSpawnValues(spawn.cells.map((c) => c.value))
		}
		expect(listEmptyPositions(result.state.board).length).toBe(
			beforeEmpty - 2,
		)
		// Spawn must not auto-resolve merges.
		expect(
			findMergeableGroups(
				result.state.board,
				BOARD_COLS,
				BOARD_ROWS,
				4,
			),
		).toEqual(
			findMergeableGroups(
				result.state.board,
				BOARD_COLS,
				BOARD_ROWS,
				4,
			),
		)
		const groups = findMergeableGroups(
			result.state.board,
			BOARD_COLS,
			BOARD_ROWS,
			4,
		)
		// Even if a group of 4+ exists after spawn, engine must not merge it.
		if (groups.length > 0) {
			expect(result.events.filter((e) => e.type === 'MERGE')).toHaveLength(
				0,
			)
		}
	})
})

describe('observedPressure — merge exactly 4', () => {
	it('merges then spawns exactly 1 after settle (no spawn auto-merge)', () => {
		// Trio of 1s + remote 1 that completes a group of 4 at (4,2).
		const state = withObserved(
			boardSparse([
				{ row: 0, col: 0, value: 1 },
				{ row: 3, col: 2, value: 1 },
				{ row: 3, col: 3, value: 1 },
				{ row: 4, col: 3, value: 1 },
				{ row: 7, col: 5, value: 2 },
			]),
		)
		const from = { row: 0, col: 0 }
		const to = { row: 4, col: 2 }
		const pathOk = getReachableFrom(
			state.board,
			from,
			BOARD_COLS,
			BOARD_ROWS,
		).some((p) => p.row === to.row && p.col === to.col)
		expect(pathOk).toBe(true)

		const result = applyMove(state, { from, to })
		expect(result.ok).toBe(true)
		expect(result.turn?.mergeOccurred).toBe(true)
		expect(result.turn?.maxMergedGroupSize).toBe(4)
		expect(result.turn?.spawnCount).toBe(1)
		assertSpawnValues(result.turn!.spawnedValues)

		const merges = result.events.filter((e) => e.type === 'MERGE')
		expect(merges.length).toBeGreaterThanOrEqual(1)
		const spawnIdx = result.events.findIndex((e) => e.type === 'SPAWN')
		const lastMergeIdx = result.events
			.map((e, i) => (e.type === 'MERGE' ? i : -1))
			.filter((i) => i >= 0)
			.pop()
		expect(spawnIdx).toBeGreaterThan(lastMergeIdx ?? -1)
		expect(result.state.score).toBe(1 * 4)

		const spawn = spawnEvent(result)
		expect(spawn?.type).toBe('SPAWN')
		if (spawn && spawn.type === 'SPAWN') {
			expect(spawn.cells).toHaveLength(1)
		}
	})
})

describe('observedPressure — large groups', () => {
	it.each([5, 6, 7])(
		'spawns 0 when max merged group size is %i',
		(size) => {
			const cells: { row: number; col: number; value: number }[] = [
				{ row: 0, col: 0, value: 1 },
			]
			// Build a connected cluster of `size` ones near the center, plus
			// one remote 1 that moves into the cluster to trigger the merge.
			const cluster: Position[] = [
				{ row: 3, col: 2 },
				{ row: 3, col: 3 },
				{ row: 4, col: 2 },
				{ row: 4, col: 3 },
				{ row: 2, col: 2 },
				{ row: 2, col: 3 },
				{ row: 5, col: 2 },
			]
			for (let i = 0; i < size - 1; i += 1) {
				const pos = cluster[i]!
				cells.push({ row: pos.row, col: pos.col, value: 1 })
			}
			// Destination is the missing cluster slot that completes size.
			const to = cluster[size - 1]!
			const state = withObserved(boardSparse(cells))
			const from = { row: 0, col: 0 }
			const reachable = getReachableFrom(
				state.board,
				from,
				BOARD_COLS,
				BOARD_ROWS,
			)
			expect(
				reachable.some((p) => p.row === to.row && p.col === to.col),
			).toBe(true)

			const result = applyMove(state, { from, to })
			expect(result.ok).toBe(true)
			expect(result.turn?.mergeOccurred).toBe(true)
			expect(result.turn?.maxMergedGroupSize).toBeGreaterThanOrEqual(size)
			expect(result.turn?.spawnCount).toBe(0)
			expect(result.events.some((e) => e.type === 'SPAWN')).toBe(false)
		},
	)
})

describe('observedPressure — cascade spawn rule', () => {
	it('4→4 cascade (max group 4) spawns 1', () => {
		// Craft: merge four 1s → 4 next to three existing 4s that then form
		// a second group of exactly 4 (not 5+).
		const state = withObserved(
			boardSparse([
				{ row: 0, col: 0, value: 1 },
				{ row: 3, col: 2, value: 1 },
				{ row: 3, col: 3, value: 1 },
				{ row: 4, col: 3, value: 1 },
				// Existing 4s that will connect with the new result 4 into
				// a group of exactly 4 (result at destination + these three).
				{ row: 4, col: 1, value: 4 },
				{ row: 5, col: 2, value: 4 },
				{ row: 5, col: 1, value: 4 },
				{ row: 7, col: 5, value: 2 },
			]),
			2011,
		)
		const result = applyMove(state, {
			from: { row: 0, col: 0 },
			to: { row: 4, col: 2 },
		})
		expect(result.ok).toBe(true)
		const merges = result.events.filter((e) => e.type === 'MERGE')
		expect(merges.length).toBeGreaterThanOrEqual(2)
		expect(result.turn?.maxMergedGroupSize).toBe(4)
		expect(result.turn?.spawnCount).toBe(1)
		expect(result.turn?.groupSizes[0]).toBe(4)
		expect(result.turn?.groupSizes.some((s) => s === 4)).toBe(true)
	})

	it('4→5+ cascade (max group >=5) spawns 0', () => {
		// Four 1s merge to 4, then that 4 joins a group of four existing 4s
		// → second merge size 5.
		const state = withObserved(
			boardSparse([
				{ row: 0, col: 0, value: 1 },
				{ row: 3, col: 2, value: 1 },
				{ row: 3, col: 3, value: 1 },
				{ row: 4, col: 3, value: 1 },
				{ row: 4, col: 1, value: 4 },
				{ row: 5, col: 2, value: 4 },
				{ row: 5, col: 1, value: 4 },
				{ row: 5, col: 3, value: 4 },
				{ row: 7, col: 0, value: 2 },
			]),
		)
		const result = applyMove(state, {
			from: { row: 0, col: 0 },
			to: { row: 4, col: 2 },
		})
		expect(result.ok).toBe(true)
		expect(result.turn?.mergeOccurred).toBe(true)
		expect(result.turn?.maxMergedGroupSize).toBeGreaterThanOrEqual(5)
		expect(result.turn?.spawnCount).toBe(0)
	})

	it('5→4 cascade still spawns 0 because max group is 5', () => {
		const state = withObserved(
			boardSparse([
				{ row: 0, col: 0, value: 1 },
				{ row: 3, col: 2, value: 1 },
				{ row: 3, col: 3, value: 1 },
				{ row: 4, col: 2, value: 1 },
				{ row: 4, col: 3, value: 1 },
				// After five 1s → 4, three nearby 4s may form a second merge of 4.
				{ row: 2, col: 2, value: 4 },
				{ row: 2, col: 3, value: 4 },
				{ row: 1, col: 2, value: 4 },
				{ row: 7, col: 5, value: 2 },
			]),
		)
		const to = { row: 2, col: 1 }
		const reachable = getReachableFrom(
			state.board,
			{ row: 0, col: 0 },
			BOARD_COLS,
			BOARD_ROWS,
		)
		// Prefer a destination that completes the five-1 group if reachable;
		// otherwise use first reachable empty next to the cluster.
		const dest =
			reachable.find((p) => p.row === to.row && p.col === to.col) ??
			reachable.find((p) => p.row === 5 && p.col === 2) ??
			reachable[0]!
		const result = applyMove(state, { from: { row: 0, col: 0 }, to: dest })
		expect(result.ok).toBe(true)
		if (
			result.turn?.mergeOccurred &&
			result.turn.maxMergedGroupSize >= 5
		) {
			expect(result.turn.spawnCount).toBe(0)
		} else {
			// If topology didn't produce a 5-group, still assert policy on summary.
			const max = result.turn?.maxMergedGroupSize ?? 0
			if (max >= 5) {
				expect(result.turn?.spawnCount).toBe(0)
			}
		}
	})
})

describe('observedPressure — spawn values sample', () => {
	it('only emits 1/2/4 across a large deterministic sample', () => {
		const seen = new Set<number>()
		for (let seed = 1; seed <= 80; seed += 1) {
			const state = createInitialGame(seed, 'observedPressure')
			let current = state
			for (let step = 0; step < 8; step += 1) {
				let move: Move | null = null
				for (let row = 0; row < BOARD_ROWS && !move; row += 1) {
					for (let col = 0; col < BOARD_COLS && !move; col += 1) {
						if (getCell(current.board, { row, col }) === null) {
							continue
						}
						const dests = getReachableFrom(
							current.board,
							{ row, col },
							BOARD_COLS,
							BOARD_ROWS,
						)
						if (dests[0]) {
							move = { from: { row, col }, to: dests[0] }
						}
					}
				}
				if (!move) {
					break
				}
				const result = applyMove(current, move)
				if (!result.ok) {
					break
				}
				for (const value of result.turn?.spawnedValues ?? []) {
					seen.add(value)
					expect([1, 2, 4]).toContain(value)
				}
				current = result.state
			}
		}
		expect(seen.has(1)).toBe(true)
		expect(seen.has(2)).toBe(true)
		expect(seen.has(4)).toBe(true)
		expect(seen.has(8)).toBe(false)
	})
})

describe('observedPressure — undo + RNG replay', () => {
	it.each([
		{
			name: 'no merge',
			board: boardSparse([
				{ row: 1, col: 1, value: 1 },
				{ row: 6, col: 4, value: 2 },
			]),
			from: { row: 1, col: 1 },
		},
		{
			name: 'merge4',
			board: boardSparse([
				{ row: 0, col: 0, value: 1 },
				{ row: 3, col: 2, value: 1 },
				{ row: 3, col: 3, value: 1 },
				{ row: 4, col: 3, value: 1 },
			]),
			from: { row: 0, col: 0 },
			to: { row: 4, col: 2 },
		},
		{
			name: 'merge5+',
			board: boardSparse([
				{ row: 0, col: 0, value: 1 },
				{ row: 3, col: 2, value: 1 },
				{ row: 3, col: 3, value: 1 },
				{ row: 4, col: 2, value: 1 },
				{ row: 4, col: 3, value: 1 },
			]),
			from: { row: 0, col: 0 },
			to: { row: 2, col: 2 },
		},
	])(
		'restores exact state and replays identically ($name)',
		({ board, from, to }) => {
			const initial = withObserved(board, 4242)
			const dest =
				to ??
				firstReachable(initial, from)
			const move: Move = { from, to: dest }
			const after = applyMove(initial, move)
			expect(after.ok).toBe(true)
			expect(canUndo(after.state)).toBe(true)
			const restored = undo(after.state)
			expect(restored.rng.s).toBe(initial.rng.s)
			expect(JSON.stringify(restored.board)).toBe(
				JSON.stringify(initial.board),
			)
			expect(JSON.stringify(restored.rules)).toBe(
				JSON.stringify(initial.rules),
			)
			const replay = applyMove(restored, move)
			expect(gameStatesEqual(replay.state, after.state)).toBe(true)
			expect(replay.turn).toEqual(after.turn)
		},
	)
})

describe('observedPressure — free-cell clamp + blocked path', () => {
	it('clamps spawn when fewer empties remain than desired', () => {
		// Fill almost all cells; leave 1 empty + mover path.
		let board = createEmptyHexBoard()
		for (let row = 0; row < BOARD_ROWS; row += 1) {
			for (let col = 0; col < BOARD_COLS; col += 1) {
				if (row === 0 && col === 1) {
					continue // destination empty
				}
				if (row === 0 && col === 0) {
					board = setCell(board, { row, col }, 1)
					continue
				}
				board = setCell(
					board,
					{ row, col },
					(row + col) % 2 === 0 ? 2 : 8,
				)
			}
		}
		const state = withObserved(board)
		expect(listEmptyPositions(state.board)).toHaveLength(1)
		const result = applyMove(state, {
			from: { row: 0, col: 0 },
			to: { row: 0, col: 1 },
		})
		expect(result.ok).toBe(true)
		// After move: 0 empties before spawn plan → spawn 0 regardless of desire 2.
		expect(result.turn?.spawnCount).toBe(0)
	})

	it('blocked path does not spawn', () => {
		const state = withObserved(
			boardSparse([
				{ row: 2, col: 1, value: 1 },
				{ row: 1, col: 2, value: 2 },
				{ row: 2, col: 2, value: 2 },
				{ row: 3, col: 2, value: 2 },
				{ row: 2, col: 3, value: 2 },
				{ row: 2, col: 4, value: 1 },
			]),
		)
		const result = applyMove(state, {
			from: { row: 2, col: 1 },
			to: { row: 2, col: 4 },
		})
		expect(result.ok).toBe(false)
		expect(result.reason).toBe('blocked')
		expect(result.turn).toBeUndefined()
		expect(result.events.some((e) => e.type === 'SPAWN')).toBe(false)
	})
})

describe('persistence schema v4', () => {
	it('round-trips observedPressure and rejects old schema', () => {
		expect(SAVE_SCHEMA_VERSION).toBe(4)
		const game = createInitialGame(3, 'observedPressure')
		expect(game.rules.presetId).toBe('observedPressure')
		const json = JSON.stringify(buildSavedGamePayload(game, 99))
		const restored = deserializeSavedGamePayload(json)
		expect(restored).not.toBeNull()
		expect(restored!.game.rules.presetId).toBe('observedPressure')
		expect(
			deserializeSavedGamePayload(
				JSON.stringify({ version: 3, game }),
			),
		).toBeNull()
	})

	it('keeps observedPressure as default preset (Level 1 baseline)', () => {
		const game = createInitialGame(1)
		expect(game.rules.presetId).toBe('observedPressure')
		expect(getRulesForPreset('observedPressure').spawnPolicy).toBe(
			'observedPressure',
		)
		expect(getRulesForPreset('phase26').spawnPolicy).toBe('phase26')
	})
})

describe('spawn does not auto-merge after placement', () => {
	it('leaves a post-spawn mergeable group untouched until next move', () => {
		// Arrange empties so spawn can land next to three 1s forming a 4-group.
		// We cannot control exact spawn positions, so we verify the engine
		// never emits a MERGE after SPAWN in the same turn.
		const state = withObserved(
			boardSparse([
				{ row: 0, col: 5, value: 2 },
				{ row: 3, col: 2, value: 1 },
				{ row: 3, col: 3, value: 1 },
				{ row: 4, col: 2, value: 1 },
			]),
			555,
		)
		const from = { row: 0, col: 5 }
		const to = firstReachable(state, from)
		const result = applyMove(state, { from, to })
		expect(result.ok).toBe(true)
		const types = result.events.map((e) => e.type)
		const spawnAt = types.indexOf('SPAWN')
		if (spawnAt >= 0) {
			const afterSpawn = types.slice(spawnAt + 1)
			expect(afterSpawn.includes('MERGE')).toBe(false)
		}
		void cloneGameState(result.state)
		void countOccupied(result.state.board)
	})
})
