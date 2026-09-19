/**
 * Deterministic hex fixtures for development / screenshot foundations.
 */

import { createEmptyHexBoard, createGameFromBoard } from './createGame'
import { setCell } from './board'
import type { Board, GameState } from './types'

function boardFromSparse (
	cells: { row: number; col: number; value: number }[],
): Board {
	let board = createEmptyHexBoard()
	for (const cell of cells) {
		board = setCell(board, { row: cell.row, col: cell.col }, cell.value)
	}
	return board
}

/** Balanced mid-game-looking field with open movement. */
export function fixtureBalancedBoard (): GameState {
	return createGameFromBoard({
		seed: 2001,
		score: 40,
		moveCount: 6,
		board: boardFromSparse([
			{ row: 1, col: 1, value: 1 },
			{ row: 1, col: 2, value: 2 },
			{ row: 2, col: 2, value: 1 },
			{ row: 2, col: 4, value: 2 },
			{ row: 3, col: 1, value: 1 },
			{ row: 3, col: 3, value: 2 },
			{ row: 4, col: 2, value: 1 },
			{ row: 4, col: 4, value: 2 },
			{ row: 5, col: 0, value: 1 },
			{ row: 5, col: 3, value: 2 },
			{ row: 6, col: 1, value: 1 },
			{ row: 6, col: 4, value: 2 },
		]),
	})
}

/** Selected piece can move into a neighboring empty hex. */
export function fixtureSimpleMove (): GameState {
	return createGameFromBoard({
		seed: 2002,
		board: boardFromSparse([
			{ row: 3, col: 2, value: 1 },
			{ row: 0, col: 0, value: 2 },
			{ row: 0, col: 5, value: 2 },
			{ row: 7, col: 0, value: 1 },
			{ row: 7, col: 5, value: 1 },
		]),
	})
}

/** Long clear corridor for pathfinding demos. */
export function fixtureLongPath (): GameState {
	return createGameFromBoard({
		seed: 2003,
		board: boardFromSparse([
			{ row: 0, col: 0, value: 1 },
			{ row: 7, col: 5, value: 2 },
			{ row: 3, col: 5, value: 2 },
		]),
	})
}

/** Destination blocked / no path around wall of cells. */
export function fixtureBlockedPath (): GameState {
	return createGameFromBoard({
		seed: 2004,
		board: boardFromSparse([
			{ row: 2, col: 1, value: 1 },
			{ row: 1, col: 2, value: 2 },
			{ row: 2, col: 2, value: 2 },
			{ row: 3, col: 2, value: 2 },
			{ row: 2, col: 3, value: 2 },
			{ row: 1, col: 3, value: 2 },
			{ row: 3, col: 3, value: 2 },
			{ row: 2, col: 4, value: 1 },
		]),
	})
}

/** Four 1s already connected — any setup move nearby or pre-merge ready. */
export function fixtureMerge4 (): GameState {
	return createGameFromBoard({
		seed: 2005,
		board: boardFromSparse([
			{ row: 3, col: 2, value: 1 },
			{ row: 3, col: 3, value: 1 },
			{ row: 4, col: 2, value: 1 },
			{ row: 2, col: 2, value: 1 },
			{ row: 0, col: 0, value: 2 },
			{ row: 7, col: 5, value: 2 },
		]),
	})
}

/** Five connected 1s. */
export function fixtureMerge5 (): GameState {
	return createGameFromBoard({
		seed: 2006,
		board: boardFromSparse([
			{ row: 3, col: 2, value: 1 },
			{ row: 3, col: 3, value: 1 },
			{ row: 4, col: 2, value: 1 },
			{ row: 4, col: 3, value: 1 },
			{ row: 2, col: 2, value: 1 },
			{ row: 0, col: 5, value: 2 },
		]),
	})
}

/** Six connected 2s. */
export function fixtureMerge6 (): GameState {
	return createGameFromBoard({
		seed: 2007,
		board: boardFromSparse([
			{ row: 3, col: 2, value: 2 },
			{ row: 3, col: 3, value: 2 },
			{ row: 4, col: 2, value: 2 },
			{ row: 4, col: 3, value: 2 },
			{ row: 2, col: 2, value: 2 },
			{ row: 2, col: 3, value: 2 },
			{ row: 0, col: 0, value: 1 },
		]),
	})
}

/**
 * Three 1s clustered; moving a fourth 1 from afar completes merge → 4.
 * from (0,0)=1 path to (3,1) empty adjacent to the trio.
 */
export function fixtureMergeTo4 (): GameState {
	return createGameFromBoard({
		seed: 2008,
		board: boardFromSparse([
			{ row: 0, col: 0, value: 1 },
			{ row: 3, col: 2, value: 1 },
			{ row: 3, col: 3, value: 1 },
			{ row: 4, col: 2, value: 1 },
			{ row: 7, col: 5, value: 2 },
		]),
	})
}

/** Four 2s → result 8. */
export function fixtureMergeTo8 (): GameState {
	return createGameFromBoard({
		seed: 2009,
		board: boardFromSparse([
			{ row: 0, col: 5, value: 2 },
			{ row: 3, col: 2, value: 2 },
			{ row: 3, col: 3, value: 2 },
			{ row: 4, col: 2, value: 2 },
			{ row: 7, col: 0, value: 1 },
		]),
	})
}

/** Four 4s → result 16. */
export function fixtureMergeTo16 (): GameState {
	return createGameFromBoard({
		seed: 2010,
		board: boardFromSparse([
			{ row: 1, col: 0, value: 4 },
			{ row: 3, col: 2, value: 4 },
			{ row: 3, col: 3, value: 4 },
			{ row: 4, col: 2, value: 4 },
			{ row: 7, col: 5, value: 1 },
		]),
	})
}

/**
 * Four 128s → terminal clear (+512 score, destination EMPTY).
 * Move remote 128 from (0,0) into empty (4,3) adjacent to the trio.
 */
export function fixtureTerminal128 (): GameState {
	return createGameFromBoard({
		seed: 2020,
		board: boardFromSparse([
			{ row: 0, col: 0, value: 128 },
			{ row: 3, col: 2, value: 128 },
			{ row: 3, col: 3, value: 128 },
			{ row: 4, col: 2, value: 128 },
			{ row: 7, col: 5, value: 1 },
		]),
	})
}

/**
 * Four 256s → terminal clear (+1024 score, destination EMPTY).
 * Move remote 256 from (0,0) into empty (4,3) adjacent to the trio.
 */
export function fixtureTerminal256 (): GameState {
	return createGameFromBoard({
		seed: 2021,
		board: boardFromSparse([
			{ row: 0, col: 0, value: 256 },
			{ row: 3, col: 2, value: 256 },
			{ row: 3, col: 3, value: 256 },
			{ row: 4, col: 2, value: 256 },
			{ row: 7, col: 5, value: 1 },
		]),
	})
}

/**
 * Four clustered 128s + remote mover → group of 5 terminal clear (+640).
 * Move (0,0) into (4,3) to join the quartet.
 */
export function fixtureTerminalLargeGroup (): GameState {
	return createGameFromBoard({
		seed: 2022,
		board: boardFromSparse([
			{ row: 0, col: 0, value: 128 },
			{ row: 2, col: 2, value: 128 },
			{ row: 3, col: 2, value: 128 },
			{ row: 3, col: 3, value: 128 },
			{ row: 4, col: 2, value: 128 },
			{ row: 7, col: 5, value: 1 },
		]),
	})
}

/**
 * Cascade into terminal: four 32s → persistent 128, then with three 128s → clear.
 * Move remote 32 from (0,0) into (4,2) to complete the first merge.
 */
export function fixtureCascadeTerminal (): GameState {
	return createGameFromBoard({
		seed: 2023,
		board: boardFromSparse([
			{ row: 0, col: 0, value: 32 },
			{ row: 3, col: 2, value: 32 },
			{ row: 3, col: 3, value: 32 },
			{ row: 4, col: 3, value: 32 },
			{ row: 4, col: 1, value: 128 },
			{ row: 5, col: 2, value: 128 },
			{ row: 5, col: 1, value: 128 },
			{ row: 7, col: 5, value: 2 },
		]),
	})
}

/**
 * Cascade2: move remote 1 into a trio of 1s adjacent to three 4s.
 * First merge → 4, which connects with existing 4s → second merge → 16.
 */
export function fixtureCascade2 (): GameState {
	return createGameFromBoard({
		seed: 2011,
		board: boardFromSparse([
			{ row: 0, col: 0, value: 1 },
			// Trio of 1s (need one more via move into (4,2))
			{ row: 3, col: 2, value: 1 },
			{ row: 3, col: 3, value: 1 },
			{ row: 4, col: 3, value: 1 },
			// Existing 4s touching (4,2) and/or the trio so the new 4 cascades.
			{ row: 4, col: 1, value: 4 },
			{ row: 5, col: 2, value: 4 },
			{ row: 5, col: 1, value: 4 },
			{ row: 7, col: 5, value: 2 },
		]),
	})
}

/** Cascade3 setup with stacked values ready for multi-step collapse. */
export function fixtureCascade3 (): GameState {
	return createGameFromBoard({
		seed: 2012,
		board: boardFromSparse([
			{ row: 0, col: 0, value: 1 },
			{ row: 4, col: 2, value: 1 },
			{ row: 4, col: 3, value: 1 },
			{ row: 5, col: 2, value: 1 },
			{ row: 3, col: 2, value: 4 },
			{ row: 3, col: 3, value: 4 },
			{ row: 2, col: 2, value: 4 },
			{ row: 1, col: 2, value: 16 },
			{ row: 1, col: 3, value: 16 },
			{ row: 0, col: 2, value: 16 },
			{ row: 7, col: 0, value: 2 },
		]),
	})
}

/** High values for layout / screenshot stress. */
export function fixtureHighValues (): GameState {
	return createGameFromBoard({
		seed: 2013,
		score: 5000,
		moveCount: 40,
		largestGroup: 6,
		largestCascade: 3,
		board: boardFromSparse([
			{ row: 1, col: 1, value: 16 },
			{ row: 2, col: 2, value: 8 },
			{ row: 3, col: 1, value: 32 },
			{ row: 3, col: 3, value: 8 },
			{ row: 4, col: 2, value: 16 },
			{ row: 5, col: 4, value: 4 },
			{ row: 6, col: 1, value: 2 },
			{ row: 6, col: 3, value: 4 },
		]),
	})
}

/** Dense near-lock field with little free space. */
export function fixtureNearGameOver (): GameState {
	let board = createEmptyHexBoard()
	for (let row = 0; row < 8; row += 1) {
		for (let col = 0; col < 6; col += 1) {
			// Checker of 1/2 leaves almost no same-value hex groups of 4,
			// but keeps a couple of empties for last moves.
			if ((row === 3 && col === 2) || (row === 4 && col === 3)) {
				continue
			}
			board = setCell(
				board,
				{ row, col },
				(row + col) % 2 === 0 ? 1 : 2,
			)
		}
	}
	return createGameFromBoard({
		seed: 2014,
		score: 800,
		moveCount: 30,
		board,
	})
}

/** Fully occupied / no movement possible. */
export function fixtureGameOver (): GameState {
	let board = createEmptyHexBoard()
	for (let row = 0; row < 8; row += 1) {
		for (let col = 0; col < 6; col += 1) {
			board = setCell(
				board,
				{ row, col },
				(row + col) % 2 === 0 ? 1 : 2,
			)
		}
	}
	return createGameFromBoard({
		seed: 2015,
		score: 1200,
		moveCount: 45,
		board,
	})
}

/** No-merge turn setup: isolated pieces so a move won't form a group of 4. */
export function fixtureNoMergeSpawn (): GameState {
	return createGameFromBoard({
		seed: 2016,
		board: boardFromSparse([
			{ row: 0, col: 0, value: 1 },
			{ row: 0, col: 5, value: 2 },
			{ row: 7, col: 0, value: 2 },
			{ row: 7, col: 5, value: 1 },
			{ row: 3, col: 2, value: 1 },
		]),
	})
}

/** Near level-up / high-pressure boards for DEV progression checks. */
export function fixtureNearLevel2 (): GameState {
	return createGameFromBoard({
		seed: 3101,
		score: 240,
		moveCount: 12,
		board: boardFromSparse([
			{ row: 1, col: 1, value: 1 },
			{ row: 2, col: 2, value: 2 },
			{ row: 3, col: 1, value: 1 },
			{ row: 4, col: 3, value: 2 },
			{ row: 5, col: 2, value: 1 },
			{ row: 6, col: 4, value: 4 },
		]),
	})
}

export function fixtureNearLevel3 (): GameState {
	return createGameFromBoard({
		seed: 3102,
		score: 580,
		moveCount: 20,
		board: boardFromSparse([
			{ row: 1, col: 1, value: 2 },
			{ row: 2, col: 2, value: 4 },
			{ row: 3, col: 1, value: 1 },
			{ row: 3, col: 3, value: 2 },
			{ row: 4, col: 2, value: 1 },
			{ row: 5, col: 4, value: 4 },
			{ row: 6, col: 1, value: 2 },
		]),
	})
}

export function fixtureLevel5Pressure (): GameState {
	return createGameFromBoard({
		seed: 3103,
		score: 2200,
		moveCount: 40,
		board: boardFromSparse([
			{ row: 0, col: 0, value: 1 },
			{ row: 0, col: 5, value: 2 },
			{ row: 2, col: 2, value: 4 },
			{ row: 3, col: 1, value: 1 },
			{ row: 3, col: 3, value: 2 },
			{ row: 4, col: 2, value: 4 },
			{ row: 5, col: 0, value: 1 },
			{ row: 6, col: 4, value: 2 },
			{ row: 7, col: 2, value: 1 },
		]),
	})
}

export function fixtureHighLevelCap (): GameState {
	return createGameFromBoard({
		seed: 3104,
		score: 8000,
		moveCount: 80,
		board: boardFromSparse([
			{ row: 1, col: 1, value: 4 },
			{ row: 2, col: 2, value: 2 },
			{ row: 3, col: 1, value: 1 },
			{ row: 3, col: 3, value: 4 },
			{ row: 4, col: 2, value: 2 },
			{ row: 5, col: 4, value: 1 },
			{ row: 6, col: 1, value: 2 },
			{ row: 7, col: 5, value: 4 },
		]),
	})
}

/** RuStore-ready balanced beauty shot (dev-only). */
export function fixtureScreenshotNormal (): GameState {
	return createGameFromBoard({
		seed: 4201,
		score: 860,
		moveCount: 28,
		board: boardFromSparse([
			{ row: 0, col: 1, value: 1 },
			{ row: 0, col: 4, value: 2 },
			{ row: 1, col: 2, value: 4 },
			{ row: 2, col: 0, value: 1 },
			{ row: 2, col: 3, value: 2 },
			{ row: 3, col: 2, value: 8 },
			{ row: 3, col: 5, value: 1 },
			{ row: 4, col: 1, value: 2 },
			{ row: 4, col: 4, value: 4 },
			{ row: 5, col: 2, value: 1 },
			{ row: 6, col: 0, value: 2 },
			{ row: 6, col: 3, value: 16 },
			{ row: 7, col: 2, value: 1 },
			{ row: 7, col: 5, value: 4 },
		]),
	})
}

/** Selected-cell / movement breathing room. */
export function fixtureScreenshotMove (): GameState {
	return createGameFromBoard({
		seed: 4202,
		score: 120,
		moveCount: 8,
		board: boardFromSparse([
			{ row: 2, col: 1, value: 2 },
			{ row: 3, col: 3, value: 1 },
			{ row: 5, col: 4, value: 4 },
			{ row: 6, col: 0, value: 1 },
			{ row: 7, col: 5, value: 2 },
		]),
	})
}

/** Ready-to-merge group composition. */
export function fixtureScreenshotMerge (): GameState {
	return createGameFromBoard({
		seed: 4203,
		score: 240,
		moveCount: 14,
		board: boardFromSparse([
			{ row: 2, col: 2, value: 1 },
			{ row: 3, col: 1, value: 1 },
			{ row: 3, col: 2, value: 1 },
			{ row: 4, col: 2, value: 1 },
			{ row: 1, col: 4, value: 2 },
			{ row: 5, col: 4, value: 4 },
			{ row: 6, col: 0, value: 2 },
		]),
	})
}

/** Strong cascade setup for store storytelling. */
export function fixtureScreenshotCascade (): GameState {
	return createGameFromBoard({
		seed: 4204,
		score: 980,
		moveCount: 30,
		board: boardFromSparse([
			{ row: 2, col: 1, value: 1 },
			{ row: 2, col: 2, value: 1 },
			{ row: 3, col: 1, value: 1 },
			{ row: 3, col: 2, value: 1 },
			{ row: 4, col: 2, value: 4 },
			{ row: 4, col: 3, value: 4 },
			{ row: 5, col: 2, value: 4 },
			{ row: 5, col: 3, value: 4 },
			{ row: 0, col: 5, value: 2 },
			{ row: 7, col: 0, value: 2 },
		]),
	})
}

/** High values + healthy score. */
export function fixtureScreenshotHigh (): GameState {
	return createGameFromBoard({
		seed: 4205,
		score: 6420,
		moveCount: 72,
		board: boardFromSparse([
			{ row: 1, col: 1, value: 16 },
			{ row: 2, col: 3, value: 64 },
			{ row: 3, col: 2, value: 256 },
			{ row: 4, col: 4, value: 1024 },
			{ row: 5, col: 1, value: 8 },
			{ row: 6, col: 3, value: 32 },
			{ row: 7, col: 5, value: 4 },
			{ row: 0, col: 0, value: 2 },
			{ row: 0, col: 4, value: 1 },
		]),
	})
}

/** Level 3/4 progress showcase. */
export function fixtureScreenshotLevel (): GameState {
	return createGameFromBoard({
		seed: 4206,
		score: 1450,
		moveCount: 36,
		board: boardFromSparse([
			{ row: 1, col: 1, value: 2 },
			{ row: 2, col: 2, value: 4 },
			{ row: 3, col: 0, value: 1 },
			{ row: 3, col: 3, value: 8 },
			{ row: 4, col: 2, value: 2 },
			{ row: 5, col: 4, value: 16 },
			{ row: 6, col: 1, value: 1 },
			{ row: 7, col: 3, value: 4 },
		]),
	})
}

/** Sparse board with long open corridors for animation stress / path timing. */
export function fixtureAnimationStress (): GameState {
	return createGameFromBoard({
		seed: 5101,
		score: 180,
		moveCount: 10,
		board: boardFromSparse([
			{ row: 0, col: 0, value: 1 },
			{ row: 0, col: 5, value: 2 },
			{ row: 3, col: 2, value: 1 },
			{ row: 3, col: 3, value: 1 },
			{ row: 3, col: 4, value: 1 },
			{ row: 4, col: 2, value: 1 },
			{ row: 7, col: 0, value: 4 },
			{ row: 7, col: 5, value: 2 },
			{ row: 5, col: 5, value: 8 },
			{ row: 1, col: 3, value: 32 },
		]),
	})
}

export type FixtureId =
	| 'balancedBoard'
	| 'simpleMove'
	| 'longPath'
	| 'blockedPath'
	| 'merge4'
	| 'merge5'
	| 'merge6'
	| 'mergeTo4'
	| 'mergeTo8'
	| 'mergeTo16'
	| 'terminal128'
	| 'terminal256'
	| 'terminalLargeGroup'
	| 'cascade2'
	| 'cascadeTerminal'
	| 'cascade3'
	| 'highValues'
	| 'nearGameOver'
	| 'gameOver'
	| 'noMergeSpawn'
	| 'nearLevel2'
	| 'nearLevel3'
	| 'level5Pressure'
	| 'highLevelCap'
	| 'screenshotNormal'
	| 'screenshotMove'
	| 'screenshotMerge'
	| 'screenshotCascade'
	| 'screenshotHigh'
	| 'screenshotLevel'
	| 'animationStress'

export const FIXTURE_BUILDERS: Record<FixtureId, () => GameState> = {
	balancedBoard: fixtureBalancedBoard,
	simpleMove: fixtureSimpleMove,
	longPath: fixtureLongPath,
	blockedPath: fixtureBlockedPath,
	merge4: fixtureMerge4,
	merge5: fixtureMerge5,
	merge6: fixtureMerge6,
	mergeTo4: fixtureMergeTo4,
	mergeTo8: fixtureMergeTo8,
	mergeTo16: fixtureMergeTo16,
	terminal128: fixtureTerminal128,
	terminal256: fixtureTerminal256,
	terminalLargeGroup: fixtureTerminalLargeGroup,
	cascade2: fixtureCascade2,
	cascadeTerminal: fixtureCascadeTerminal,
	cascade3: fixtureCascade3,
	highValues: fixtureHighValues,
	nearGameOver: fixtureNearGameOver,
	gameOver: fixtureGameOver,
	noMergeSpawn: fixtureNoMergeSpawn,
	nearLevel2: fixtureNearLevel2,
	nearLevel3: fixtureNearLevel3,
	level5Pressure: fixtureLevel5Pressure,
	highLevelCap: fixtureHighLevelCap,
	screenshotNormal: fixtureScreenshotNormal,
	screenshotMove: fixtureScreenshotMove,
	screenshotMerge: fixtureScreenshotMerge,
	screenshotCascade: fixtureScreenshotCascade,
	screenshotHigh: fixtureScreenshotHigh,
	screenshotLevel: fixtureScreenshotLevel,
	animationStress: fixtureAnimationStress,
}

export function loadFixture (id: FixtureId): GameState {
	const builder = FIXTURE_BUILDERS[id]
	if (!builder) {
		throw new Error(`Unknown fixture id: ${id}`)
	}
	return builder()
}

/**
 * Explicit ordered fixture ids for DevPanel.
 * Keep as a literal array (not Object.keys) so the export cannot be
 * undefined during barrel evaluation / partial module init.
 */
export const FIXTURE_IDS: FixtureId[] = [
	'balancedBoard',
	'simpleMove',
	'longPath',
	'blockedPath',
	'merge4',
	'merge5',
	'merge6',
	'mergeTo4',
	'mergeTo8',
	'mergeTo16',
	'terminal128',
	'terminal256',
	'terminalLargeGroup',
	'cascade2',
	'cascadeTerminal',
	'cascade3',
	'highValues',
	'nearGameOver',
	'gameOver',
	'noMergeSpawn',
	'nearLevel2',
	'nearLevel3',
	'level5Pressure',
	'highLevelCap',
	'screenshotNormal',
	'screenshotMove',
	'screenshotMerge',
	'screenshotCascade',
	'screenshotHigh',
	'screenshotLevel',
	'animationStress',
]
