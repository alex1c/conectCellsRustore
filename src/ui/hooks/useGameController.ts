/**
 * Game screen controller: engine I/O, persistence, selection, event playback.
 * Engine remains the sole source of truth for rules; UI only renders results.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
	applyMove,
	canUndo,
	CHAIN_STEP_DELAY_MS,
	cloneBoard,
	DEFAULT_RULE_PRESET,
	createFreshSeed,
	createInitialGame,
	getCell,
	getLegalMoves,
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
} from '../../game'
import {
	loadBestScore,
	loadSavedGame,
	saveBestScore,
	saveGameState,
} from '../../storage/asyncStore'
import {
	hapticChain,
	hapticInvalid,
	hapticMerge,
	hapticSelection,
} from '../haptics'
import type { RunMetrics } from '../components/DevPanel'

function posKey (position: Position): string {
	return `${position.row},${position.col}`
}

function delay (ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

function legalTargetsFor (
	state: GameState,
	selected: Position,
): Position[] {
	return getLegalMoves(state)
		.filter((move) => samePosition(move.from, selected))
		.map((move) => move.to)
}

export interface GameController {
	ready: boolean
	displayBoard: Board
	displayScore: number
	bestScore: number
	gainFlash: number | null
	selected: Position | null
	legalTargets: Position[]
	pulseKey: string | null
	spawnKey: string | null
	shakeKey: string | null
	inputLocked: boolean
	showGameOver: boolean
	showRestartDialog: boolean
	canUndoMove: boolean
	activePreset: RulePresetId
	lastMetrics: RunMetrics | null
	handleCellPress: (position: Position) => void
	handleUndo: () => void
	requestRestart: () => void
	cancelRestart: () => void
	confirmRestart: () => void
	handleLoadFixture: (id: FixtureId) => void
	handleSelectPreset: (id: RulePresetId) => void
	handleNewGameFromOver: () => void
}

export function useGameController (): GameController {
	const [ready, setReady] = useState(false)
	const [game, setGame] = useState<GameState>(() =>
		createInitialGame(createFreshSeed(), DEFAULT_RULE_PRESET),
	)
	const [displayBoard, setDisplayBoard] = useState<Board>(() =>
		cloneBoard(game.board),
	)
	const [displayScore, setDisplayScore] = useState(0)
	const [bestScore, setBestScore] = useState(0)
	const [gainFlash, setGainFlash] = useState<number | null>(null)
	const [selected, setSelected] = useState<Position | null>(null)
	const [pulseKey, setPulseKey] = useState<string | null>(null)
	const [spawnKey, setSpawnKey] = useState<string | null>(null)
	const [shakeKey, setShakeKey] = useState<string | null>(null)
	const [inputLocked, setInputLocked] = useState(false)
	const [showRestartDialog, setShowRestartDialog] = useState(false)
	const [lastMetrics, setLastMetrics] = useState<RunMetrics | null>(null)
	const [startedAt, setStartedAt] = useState(() => Date.now())

	const gameRef = useRef(game)
	const animTokenRef = useRef(0)
	const metricsLoggedRef = useRef(false)

	useEffect(() => {
		gameRef.current = game
	}, [game])

	const syncDisplay = useCallback((state: GameState) => {
		setDisplayBoard(cloneBoard(state.board))
		setDisplayScore(state.score)
	}, [])

	const persist = useCallback(async (state: GameState, started: number) => {
		try {
			await saveGameState(state, started)
			const nextBest = await saveBestScore(state.score)
			setBestScore(nextBest)
		} catch {
			// Persistence failures must not crash gameplay.
		}
	}, [])

	const beginNewGame = useCallback(
		(next: GameState, options?: { persistClearMetrics?: boolean }) => {
			animTokenRef.current += 1
			metricsLoggedRef.current = false
			const now = Date.now()
			setStartedAt(now)
			setGame(next)
			syncDisplay(next)
			setSelected(null)
			setPulseKey(null)
			setSpawnKey(null)
			setShakeKey(null)
			setGainFlash(null)
			setInputLocked(false)
			setShowRestartDialog(false)
			if (options?.persistClearMetrics !== false) {
				void persist(next, now)
			}
		},
		[persist, syncDisplay],
	)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			const [saved, best] = await Promise.all([
				loadSavedGame(),
				loadBestScore(),
			])
			if (cancelled) {
				return
			}
			setBestScore(best)
			if (saved) {
				setStartedAt(saved.startedAt ?? Date.now())
				setGame(saved.game)
				syncDisplay(saved.game)
			} else {
				const fresh = createInitialGame(
					createFreshSeed(),
					DEFAULT_RULE_PRESET,
				)
				const now = Date.now()
				setStartedAt(now)
				setGame(fresh)
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
			const durationSec = Math.max(
				0,
				Math.round((Date.now() - started) / 1000),
			)
			const metrics: RunMetrics = {
				moves: state.moveCount,
				finalScore: state.score,
				largestValue: state.largestValue,
				largestChain: state.largestChain,
				durationSec,
			}
			setLastMetrics(metrics)
			if (__DEV__) {
				console.log('[ConnectCells] run metrics', metrics)
			}
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
					const row = board[event.from.row]
					if (row) {
						row[event.from.col] = null
					}
					setDisplayBoard(board)
					setPulseKey(posKey(event.to))
					await delay(CHAIN_STEP_DELAY_MS)
				} else if (event.type === 'MERGE') {
					board = cloneBoard(board)
					const row = board[event.position.row]
					if (row) {
						row[event.position.col] = event.toValue
					}
					setDisplayBoard(board)
					setPulseKey(posKey(event.position))
					void hapticMerge()
					await delay(CHAIN_STEP_DELAY_MS)
				} else if (event.type === 'CHAIN_STEP') {
					board = cloneBoard(board)
					const absorbedRow = board[event.absorbed.row]
					if (absorbedRow) {
						absorbedRow[event.absorbed.col] = null
					}
					const anchorRow = board[event.position.row]
					if (anchorRow) {
						anchorRow[event.position.col] = event.toValue
					}
					setDisplayBoard(board)
					setPulseKey(posKey(event.position))
					if (event.chainLevel >= 2) {
						void hapticChain()
					}
					await delay(CHAIN_STEP_DELAY_MS)
				} else if (event.type === 'SCORE_GAIN') {
					score = event.total
					setDisplayScore(score)
					setGainFlash(event.amount)
					await delay(120)
					if (animTokenRef.current === token) {
						setGainFlash(null)
					}
				} else if (event.type === 'SPAWN') {
					board = cloneBoard(board)
					const row = board[event.position.row]
					if (row) {
						row[event.position.col] = event.value
					}
					setDisplayBoard(board)
					setSpawnKey(posKey(event.position))
					await delay(CHAIN_STEP_DELAY_MS)
					if (animTokenRef.current === token) {
						setSpawnKey(null)
					}
				} else if (event.type === 'GAME_OVER') {
					// Overlay is driven by final state status after playback.
				}
			}

			if (animTokenRef.current !== token) {
				return
			}
			syncDisplay(finalState)
			setPulseKey(null)
			setSpawnKey(null)
			setInputLocked(false)
			if (isGameOver(finalState)) {
				logRunMetrics(finalState, startedAt)
			}
		},
		[logRunMetrics, startedAt, syncDisplay],
	)

	const commitMove = useCallback(
		async (move: Move) => {
			const current = gameRef.current
			const startBoard = cloneBoard(current.board)
			const startScore = current.score
			const result = applyMove(current, move)
			if (!result.ok) {
				void hapticInvalid()
				setShakeKey(posKey(move.from))
				await delay(120)
				setShakeKey(null)
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
			if (value === null) {
				setSelected(null)
				return
			}

			if (!selected) {
				const targets = legalTargetsFor(current, position)
				if (targets.length === 0) {
					void hapticInvalid()
					setShakeKey(posKey(position))
					setTimeout(() => setShakeKey(null), 140)
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

			const move: Move = { from: selected, to: position }
			const legal = getLegalMoves(current).some(
				(candidate) =>
					samePosition(candidate.from, move.from) &&
					samePosition(candidate.to, move.to),
			)
			if (legal) {
				void commitMove(move)
				return
			}

			// Retarget selection to the newly tapped cell when possible.
			const targets = legalTargetsFor(current, position)
			if (targets.length > 0) {
				void hapticSelection()
				setSelected(position)
				return
			}

			void hapticInvalid()
			setShakeKey(posKey(position))
			setTimeout(() => setShakeKey(null), 140)
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
		setSpawnKey(null)
		setGainFlash(null)
		setInputLocked(false)
		void persist(restored, startedAt)
	}, [inputLocked, persist, startedAt, syncDisplay])

	const confirmRestart = useCallback(() => {
		const next = createInitialGame(
			createFreshSeed(),
			gameRef.current.rulesetId,
		)
		beginNewGame(next)
	}, [beginNewGame])

	const handleSelectPreset = useCallback(
		(id: RulePresetId) => {
			if (!__DEV__) {
				return
			}
			const next = createInitialGame(createFreshSeed(), id)
			beginNewGame(next)
		},
		[beginNewGame],
	)

	const handleLoadFixture = useCallback(
		(id: FixtureId) => {
			if (!__DEV__) {
				return
			}
			const next = loadFixture(id)
			beginNewGame(next)
		},
		[beginNewGame],
	)

	const legalTargets = useMemo(() => {
		if (!selected || inputLocked) {
			return []
		}
		return legalTargetsFor(game, selected)
	}, [game, inputLocked, selected])

	const showGameOver = ready && isGameOver(game) && !inputLocked

	return {
		ready,
		displayBoard,
		displayScore,
		bestScore,
		gainFlash,
		selected,
		legalTargets,
		pulseKey,
		spawnKey,
		shakeKey,
		inputLocked,
		showGameOver,
		showRestartDialog,
		canUndoMove: canUndo(game) && !inputLocked,
		activePreset: game.rulesetId,
		lastMetrics,
		handleCellPress,
		handleUndo,
		requestRestart: () => {
			if (!inputLocked) {
				setShowRestartDialog(true)
			}
		},
		cancelRestart: () => setShowRestartDialog(false),
		confirmRestart,
		handleLoadFixture,
		handleSelectPreset,
		handleNewGameFromOver: confirmRestart,
	}
}
