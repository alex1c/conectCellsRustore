/**
 * Hex game controller: selection, path moves, event playback, persistence.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import {
	ANIM_STEP_MS,
	BOARD_COLS,
	BOARD_ROWS,
	DEFAULT_RULE_PRESET,
	applyMove,
	canUndo,
	cloneBoard,
	countOccupied,
	createFreshSeed,
	createInitialGame,
	getCell,
	getLevelForScore,
	getLevelProgress,
	getReachableFrom,
	getRulesForPreset,
	isGameOver,
	loadFixture,
	samePosition,
	undo as engineUndo,
	type Board,
	type FixtureId,
	type GameEvent,
	type GameState,
	type Move,
	type Position,
	type RulePresetId,
	type TurnResolution,
} from '../../game'
import {
	loadBestLevel,
	loadBestScore,
	loadSavedGame,
	saveBestLevel,
	saveBestScore,
	saveGameState,
} from '../../storage/asyncStore'
import {
	hapticChain,
	hapticInvalid,
	hapticMerge,
	hapticSelection,
} from '../haptics'
import type { DevTurnTelemetry, RunMetrics } from '../components/DevPanel'

function posKey (position: Position): string {
	return `${position.row},${position.col}`
}

function delay (ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Apply the active DEV preset rules onto a fixture / custom state. */
function withPresetRules (
	state: GameState,
	presetId: RulePresetId,
): GameState {
	const rules = getRulesForPreset(presetId)
	rules.boardRows = state.board.length
	rules.boardCols = state.board[0]?.length ?? rules.boardCols
	return {
		...state,
		rules,
		undoSnapshot: null,
	}
}

export interface GameController {
	ready: boolean
	displayBoard: Board
	displayScore: number
	bestScore: number
	bestLevel: number
	level: number
	levelProgress: number
	gainFlash: number | null
	selected: Position | null
	pulseKey: string | null
	spawnKeys: string[]
	inputLocked: boolean
	showGameOver: boolean
	showRestartDialog: boolean
	canUndoMove: boolean
	pathBlockedFlash: boolean
	levelUpVisible: boolean
	levelUpLevel: number
	activePreset: RulePresetId
	lastMetrics: RunMetrics | null
	lastTurn: DevTurnTelemetry | null
	handleCellPress: (position: Position) => void
	handleUndo: () => void
	requestRestart: () => void
	cancelRestart: () => void
	confirmRestart: () => void
	handleLoadFixture: (id: FixtureId) => void
	handleNewSeed: () => void
	handleSelectPreset: (id: RulePresetId) => void
	handleNewGameFromOver: () => void
	dismissLevelUp: () => void
}

export function useGameController (): GameController {
	const [ready, setReady] = useState(false)
	const [activePreset, setActivePreset] = useState<RulePresetId>(
		DEFAULT_RULE_PRESET,
	)
	const [game, setGame] = useState<GameState>(() =>
		createInitialGame(createFreshSeed(), DEFAULT_RULE_PRESET),
	)
	const [displayBoard, setDisplayBoard] = useState<Board>(() =>
		cloneBoard(game.board),
	)
	const [displayScore, setDisplayScore] = useState(0)
	const [bestScore, setBestScore] = useState(0)
	const [bestLevel, setBestLevel] = useState(1)
	const [gainFlash, setGainFlash] = useState<number | null>(null)
	const [selected, setSelected] = useState<Position | null>(null)
	const [pulseKey, setPulseKey] = useState<string | null>(null)
	const [spawnKeys, setSpawnKeys] = useState<string[]>([])
	const [inputLocked, setInputLocked] = useState(false)
	const [showRestartDialog, setShowRestartDialog] = useState(false)
	const [pathBlockedFlash, setPathBlockedFlash] = useState(false)
	const [levelUpVisible, setLevelUpVisible] = useState(false)
	const [levelUpLevel, setLevelUpLevel] = useState(1)
	const [lastMetrics, setLastMetrics] = useState<RunMetrics | null>(null)
	const [lastTurn, setLastTurn] = useState<DevTurnTelemetry | null>(null)
	const [startedAt, setStartedAt] = useState(() => Date.now())

	const gameRef = useRef(game)
	const presetRef = useRef(activePreset)
	const animTokenRef = useRef(0)
	const metricsLoggedRef = useRef(false)

	useEffect(() => {
		gameRef.current = game
	}, [game])

	useEffect(() => {
		presetRef.current = activePreset
	}, [activePreset])

	const syncDisplay = useCallback((state: GameState) => {
		setDisplayBoard(cloneBoard(state.board))
		setDisplayScore(state.score)
	}, [])

	const persist = useCallback(async (state: GameState, started: number) => {
		try {
			await saveGameState(state, started)
			const nextBest = await saveBestScore(state.score)
			setBestScore(nextBest)
			const level = getLevelForScore(state.score)
			const nextBestLevel = await saveBestLevel(level)
			setBestLevel(nextBestLevel)
		} catch {
			// Persistence must not crash gameplay.
		}
	}, [])

	const beginNewGame = useCallback(
		(next: GameState) => {
			animTokenRef.current += 1
			metricsLoggedRef.current = false
			const now = Date.now()
			setStartedAt(now)
			setGame(next)
			setActivePreset(next.rules.presetId)
			syncDisplay(next)
			setSelected(null)
			setPulseKey(null)
			setSpawnKeys([])
			setGainFlash(null)
			setInputLocked(false)
			setShowRestartDialog(false)
			setPathBlockedFlash(false)
			setLastTurn(null)
			setLevelUpVisible(false)
			void persist(next, now)
		},
		[persist, syncDisplay],
	)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			const [saved, best, bestLvl] = await Promise.all([
				loadSavedGame(),
				loadBestScore(),
				loadBestLevel(),
			])
			if (cancelled) {
				return
			}
			setBestScore(best)
			setBestLevel(bestLvl)
			if (saved) {
				setStartedAt(saved.startedAt ?? Date.now())
				setGame(saved.game)
				setActivePreset(saved.game.rules.presetId)
				syncDisplay(saved.game)
			} else {
				const fresh = createInitialGame(
					createFreshSeed(),
					DEFAULT_RULE_PRESET,
				)
				const now = Date.now()
				setStartedAt(now)
				setGame(fresh)
				setActivePreset(fresh.rules.presetId)
				syncDisplay(fresh)
				void persist(fresh, now)
			}
			setReady(true)
		})()
		return () => {
			cancelled = true
		}
	}, [persist, syncDisplay])

	const logRunMetrics = useCallback(
		(state: GameState, started: number) => {
			if (metricsLoggedRef.current) {
				return
			}
			metricsLoggedRef.current = true
			const metrics: RunMetrics = {
				moves: state.moveCount,
				finalScore: state.score,
				largestValue: state.largestValue,
				largestGroup: state.largestGroup,
				largestCascade: state.largestCascade,
				durationSec: Math.max(
					0,
					Math.round((Date.now() - started) / 1000),
				),
			}
			setLastMetrics(metrics)
			if (__DEV__) {
				console.log('[ConnectCells] hex run', metrics)
			}
		},
		[],
	)

	const recordTurnTelemetry = useCallback(
		(state: GameState, turn: TurnResolution) => {
			if (!__DEV__) {
				return
			}
			const capacity =
				state.rules.boardCols * state.rules.boardRows ||
				BOARD_COLS * BOARD_ROWS
			setLastTurn({
				turnNumber: state.moveCount,
				occupied: countOccupied(state.board),
				capacity,
				turn,
			})
		},
		[],
	)

	const playEvents = useCallback(
		async (
			startBoard: Board,
			startScore: number,
			events: GameEvent[],
			finalState: GameState,
			token: number,
			turn: TurnResolution | undefined,
		) => {
			let board = cloneBoard(startBoard)
			let score = startScore
			setDisplayBoard(board)
			setDisplayScore(score)

			for (const event of events) {
				if (animTokenRef.current !== token) {
					return
				}
				if (event.type === 'MOVE') {
					board = cloneBoard(board)
					const fromRow = board[event.from.row]
					if (fromRow) {
						fromRow[event.from.col] = null
					}
					const toRow = board[event.to.row]
					if (toRow) {
						toRow[event.to.col] = event.value
					}
					setDisplayBoard(board)
					setPulseKey(posKey(event.to))
					await delay(ANIM_STEP_MS)
				} else if (event.type === 'MERGE') {
					board = cloneBoard(board)
					for (const cleared of event.cleared) {
						const row = board[cleared.row]
						if (row) {
							row[cleared.col] = null
						}
					}
					const resultRow = board[event.resultAt.row]
					if (resultRow) {
						resultRow[event.resultAt.col] = event.resultValue
					}
					setDisplayBoard(board)
					setPulseKey(posKey(event.resultAt))
					if (event.cascadeLevel >= 2) {
						void hapticChain()
					} else {
						void hapticMerge()
					}
					await delay(ANIM_STEP_MS + 40)
				} else if (event.type === 'SCORE_GAIN') {
					score = event.total
					setDisplayScore(score)
					setGainFlash(event.amount)
					await delay(100)
					if (animTokenRef.current === token) {
						setGainFlash(null)
					}
				} else if (event.type === 'SPAWN') {
					board = cloneBoard(board)
					const keys: string[] = []
					for (const cell of event.cells) {
						const row = board[cell.position.row]
						if (row) {
							row[cell.position.col] = cell.value
						}
						keys.push(posKey(cell.position))
					}
					setDisplayBoard(board)
					setSpawnKeys(keys)
					await delay(ANIM_STEP_MS)
					if (animTokenRef.current === token) {
						setSpawnKeys([])
					}
				} else if (event.type === 'LEVEL_UP') {
					setLevelUpLevel(event.newLevel)
					setLevelUpVisible(true)
					await delay(200)
				}
			}

			if (animTokenRef.current !== token) {
				return
			}
			syncDisplay(finalState)
			setPulseKey(null)
			setSpawnKeys([])
			setInputLocked(false)
			if (turn) {
				recordTurnTelemetry(finalState, turn)
			}
			if (isGameOver(finalState)) {
				logRunMetrics(finalState, startedAt)
			}
		},
		[logRunMetrics, recordTurnTelemetry, startedAt, syncDisplay],
	)

	const commitMove = useCallback(
		async (move: Move) => {
			const current = gameRef.current
			const startBoard = cloneBoard(current.board)
			const startScore = current.score
			const result = applyMove(current, move)
			if (!result.ok) {
				void hapticInvalid()
				setPathBlockedFlash(true)
				await delay(160)
				setPathBlockedFlash(false)
				return
			}
			setSelected(null)
			setInputLocked(true)
			setGame(result.state)
			void persist(result.state, startedAt)
			const token = animTokenRef.current + 1
			animTokenRef.current = token
			await playEvents(
				startBoard,
				startScore,
				result.events,
				result.state,
				token,
				result.turn,
			)
		},
		[persist, playEvents, startedAt],
	)

	const handleCellPress = useCallback(
		(position: Position) => {
			if (inputLocked || !ready) {
				return
			}
			const current = gameRef.current
			if (isGameOver(current)) {
				return
			}

			const value = getCell(current.board, position)

			if (!selected) {
				if (value === null) {
					return
				}
				const reachable = getReachableFrom(
					current.board,
					position,
					current.rules.boardCols,
					current.rules.boardRows,
				)
				if (reachable.length === 0) {
					void hapticInvalid()
					setPathBlockedFlash(true)
					setTimeout(() => setPathBlockedFlash(false), 160)
					return
				}
				void hapticSelection()
				setSelected(position)
				return
			}

			if (samePosition(selected, position)) {
				setSelected(null)
				return
			}

			if (value !== null) {
				const reachable = getReachableFrom(
					current.board,
					position,
					current.rules.boardCols,
					current.rules.boardRows,
				)
				if (reachable.length > 0) {
					void hapticSelection()
					setSelected(position)
					return
				}
				void hapticInvalid()
				return
			}

			void commitMove({ from: selected, to: position })
		},
		[commitMove, inputLocked, ready, selected],
	)

	const handleUndo = useCallback(() => {
		if (inputLocked) {
			return
		}
		const current = gameRef.current
		if (!canUndo(current)) {
			return
		}
		animTokenRef.current += 1
		const restored = engineUndo(current)
		metricsLoggedRef.current = false
		setGame(restored)
		syncDisplay(restored)
		setSelected(null)
		setPulseKey(null)
		setSpawnKeys([])
		setGainFlash(null)
		setInputLocked(false)
		setLastTurn(null)
		setLevelUpVisible(false)
		void persist(restored, startedAt)
	}, [inputLocked, persist, startedAt, syncDisplay])

	const confirmRestart = useCallback(() => {
		beginNewGame(
			createInitialGame(createFreshSeed(), presetRef.current),
		)
	}, [beginNewGame])

	const levelInfo = getLevelProgress(displayScore)

	return {
		ready,
		displayBoard,
		displayScore,
		bestScore,
		bestLevel,
		level: levelInfo.level,
		levelProgress: levelInfo.progress,
		gainFlash,
		selected,
		pulseKey,
		spawnKeys,
		inputLocked,
		showGameOver: ready && isGameOver(game) && !inputLocked,
		showRestartDialog,
		canUndoMove: canUndo(game) && !inputLocked,
		pathBlockedFlash,
		levelUpVisible,
		levelUpLevel,
		activePreset,
		lastMetrics,
		lastTurn,
		handleCellPress,
		handleUndo,
		requestRestart: () => {
			if (!inputLocked) {
				setShowRestartDialog(true)
			}
		},
		cancelRestart: () => setShowRestartDialog(false),
		confirmRestart,
		handleLoadFixture: (id: FixtureId) => {
			if (__DEV__) {
				beginNewGame(withPresetRules(loadFixture(id), presetRef.current))
			}
		},
		handleNewSeed: () => {
			if (__DEV__) {
				beginNewGame(
					createInitialGame(createFreshSeed(), presetRef.current),
				)
			}
		},
		handleSelectPreset: (id: RulePresetId) => {
			if (__DEV__) {
				beginNewGame(createInitialGame(createFreshSeed(), id))
			}
		},
		handleNewGameFromOver: confirmRestart,
		dismissLevelUp: () => setLevelUpVisible(false),
	}
}
