/**
 * Hex game controller: selection, sequential event playback, feel, persistence.
 * Engine is the only source of truth — UI only presents events.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

import {
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
	loadHapticEnabled,
	loadOnboardingDone,
	loadSoundEnabled,
	saveHapticEnabled,
	saveOnboardingDone,
	saveSoundEnabled,
} from '../../storage/preferences'
import type { DevTurnTelemetry, RunMetrics } from '../components/DevPanel'
import type {
	BoardScorePopup,
	BoardTraveler,
} from '../components/HexBoardView'
import { ONBOARDING_STEP_COUNT } from '../components/OnboardingModal'
import {
	hapticBlocked,
	hapticCascade2,
	hapticCascade3,
	hapticGameOver,
	hapticLevelUp,
	hapticMerge4,
	hapticMergeLarge,
	hapticMove,
	hapticSelection,
	setHapticEnabled,
} from '../feel/haptics'
import { initSounds, playMergeSound, playSound, setSoundEnabled } from '../feel/sound'
import {
	TIMING_BLOCKED_FLASH_MS,
	TIMING_CASCADE_PAUSE_MS,
	TIMING_MERGE_CONVERGE_MS,
	TIMING_MERGE_POP_LARGE_MS,
	TIMING_MERGE_POP_MS,
	TIMING_SCORE_POPUP_MS,
	TIMING_SPAWN_MS,
	TIMING_SPAWN_STAGGER_MS,
	pathStepMs,
} from '../feel/timings'

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
	pulseStrong: boolean
	spawnKeys: string[]
	shrinkKeys: string[]
	shakeKey: string | null
	traveler: BoardTraveler | null
	scorePopup: BoardScorePopup | null
	chainVisible: boolean
	chainLevel: number
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
	soundEnabled: boolean
	hapticEnabled: boolean
	showSettings: boolean
	showOnboarding: boolean
	onboardingStep: number
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
	dismissChain: () => void
	openSettings: () => void
	closeSettings: () => void
	setSoundPref: (value: boolean) => void
	setHapticPref: (value: boolean) => void
	openHowToPlay: () => void
	onboardingNext: () => void
	onboardingSkip: () => void
	onboardingFinish: () => void
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
	const [pulseStrong, setPulseStrong] = useState(false)
	const [spawnKeys, setSpawnKeys] = useState<string[]>([])
	const [shrinkKeys, setShrinkKeys] = useState<string[]>([])
	const [shakeKey, setShakeKey] = useState<string | null>(null)
	const [traveler, setTraveler] = useState<BoardTraveler | null>(null)
	const [scorePopup, setScorePopup] = useState<BoardScorePopup | null>(null)
	const [chainVisible, setChainVisible] = useState(false)
	const [chainLevel, setChainLevel] = useState(1)
	const [inputLocked, setInputLocked] = useState(false)
	const [showRestartDialog, setShowRestartDialog] = useState(false)
	const [pathBlockedFlash, setPathBlockedFlash] = useState(false)
	const [levelUpVisible, setLevelUpVisible] = useState(false)
	const [levelUpLevel, setLevelUpLevel] = useState(1)
	const [lastMetrics, setLastMetrics] = useState<RunMetrics | null>(null)
	const [lastTurn, setLastTurn] = useState<DevTurnTelemetry | null>(null)
	const [startedAt, setStartedAt] = useState(() => Date.now())
	const [soundEnabled, setSoundEnabledState] = useState(true)
	const [hapticEnabled, setHapticEnabledState] = useState(true)
	const [showSettings, setShowSettings] = useState(false)
	const [showOnboarding, setShowOnboarding] = useState(false)
	const [onboardingStep, setOnboardingStep] = useState(0)

	const gameRef = useRef(game)
	const presetRef = useRef(activePreset)
	const animTokenRef = useRef(0)
	const metricsLoggedRef = useRef(false)
	const selectedRef = useRef<Position | null>(null)

	useEffect(() => {
		gameRef.current = game
	}, [game])

	useEffect(() => {
		presetRef.current = activePreset
	}, [activePreset])

	useEffect(() => {
		selectedRef.current = selected
	}, [selected])

	const syncDisplay = useCallback((state: GameState) => {
		setDisplayBoard(cloneBoard(state.board))
		setDisplayScore(state.score)
		setTraveler(null)
		setShrinkKeys([])
		setPulseKey(null)
		setPulseStrong(false)
		setSpawnKeys([])
		setScorePopup(null)
		setShakeKey(null)
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
			setGainFlash(null)
			setInputLocked(false)
			setShowRestartDialog(false)
			setPathBlockedFlash(false)
			setLastTurn(null)
			setLevelUpVisible(false)
			setChainVisible(false)
			void persist(next, now)
		},
		[persist, syncDisplay],
	)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			const [saved, best, bestLvl, sound, haptic, onboardingDone] =
				await Promise.all([
					loadSavedGame(),
					loadBestScore(),
					loadBestLevel(),
					loadSoundEnabled(),
					loadHapticEnabled(),
					loadOnboardingDone(),
				])
			if (cancelled) {
				return
			}
			setSoundEnabledState(sound)
			setSoundEnabled(sound)
			setHapticEnabledState(haptic)
			setHapticEnabled(haptic)
			void initSounds()
			setBestScore(best)
			setBestLevel(bestLvl)
			setShowOnboarding(!onboardingDone)
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

	// If the app backgrounds mid-playback, snap UI to authoritative engine state.
	useEffect(() => {
		const onChange = (status: AppStateStatus) => {
			if (status !== 'active' && inputLocked) {
				animTokenRef.current += 1
				syncDisplay(gameRef.current)
				setInputLocked(false)
				setTraveler(null)
				setShrinkKeys([])
				setSpawnKeys([])
				setScorePopup(null)
			}
		}
		const sub = AppState.addEventListener('change', onChange)
		return () => {
			sub.remove()
		}
	}, [inputLocked, syncDisplay])

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

	const flashBlocked = useCallback(async (at: Position | null) => {
		playSound('blocked')
		void hapticBlocked()
		setPathBlockedFlash(true)
		if (at) {
			setShakeKey(posKey(at))
		}
		await delay(TIMING_BLOCKED_FLASH_MS)
		setPathBlockedFlash(false)
		setShakeKey(null)
	}, [])

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
					playSound('move')
					void hapticMove()
					const path =
						event.path.length > 0
							? event.path
							: [event.from, event.to]
					const stepMs = pathStepMs(path.length)

					// Vacate origin so we never show a duplicate cell.
					board = cloneBoard(board)
					const fromRow = board[event.from.row]
					if (fromRow) {
						fromRow[event.from.col] = null
					}
					setDisplayBoard(board)

					for (let i = 1; i < path.length; i += 1) {
						if (animTokenRef.current !== token) {
							return
						}
						const pos = path[i]!
						setTraveler({ position: pos, value: event.value })
						await delay(stepMs)
					}

					board = cloneBoard(board)
					const toRow = board[event.to.row]
					if (toRow) {
						toRow[event.to.col] = event.value
					}
					setTraveler(null)
					setDisplayBoard(board)
					setPulseKey(posKey(event.to))
					await delay(40)
				} else if (event.type === 'MERGE') {
					const clearKeys = event.cleared.map(posKey)
					setShrinkKeys(clearKeys)
					await delay(TIMING_MERGE_CONVERGE_MS)
					if (animTokenRef.current !== token) {
						return
					}

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
					setShrinkKeys([])
					setDisplayBoard(board)
					setPulseStrong(event.groupSize >= 5 || event.cascadeLevel >= 2)
					setPulseKey(posKey(event.resultAt))

					playMergeSound(event.cascadeLevel)
					if (event.cascadeLevel >= 3) {
						void hapticCascade3()
						setChainLevel(event.cascadeLevel)
						setChainVisible(true)
					} else if (event.cascadeLevel >= 2) {
						void hapticCascade2()
					} else if (event.groupSize >= 5) {
						void hapticMergeLarge()
					} else {
						void hapticMerge4()
					}

					setScorePopup({
						amount: event.scoreGain,
						position: event.resultAt,
						key: `${posKey(event.resultAt)}-${event.cascadeLevel}-${event.scoreGain}`,
					})

					const popMs =
						event.groupSize >= 5
							? TIMING_MERGE_POP_LARGE_MS
							: TIMING_MERGE_POP_MS
					await delay(popMs)
					if (animTokenRef.current === token) {
						setScorePopup(null)
					}
					if (event.cascadeLevel >= 2) {
						await delay(TIMING_CASCADE_PAUSE_MS)
					}
				} else if (event.type === 'SCORE_GAIN') {
					score = event.total
					setDisplayScore(score)
					setGainFlash(event.amount)
					await delay(Math.min(180, TIMING_SCORE_POPUP_MS / 2))
					if (animTokenRef.current === token) {
						setGainFlash(null)
					}
				} else if (event.type === 'SPAWN') {
					playSound('spawn')
					board = cloneBoard(board)
					const keys: string[] = []
					for (let i = 0; i < event.cells.length; i += 1) {
						if (animTokenRef.current !== token) {
							return
						}
						const cell = event.cells[i]!
						const row = board[cell.position.row]
						if (row) {
							row[cell.position.col] = cell.value
						}
						keys.push(posKey(cell.position))
						setDisplayBoard(cloneBoard(board))
						setSpawnKeys([...keys])
						if (i < event.cells.length - 1) {
							await delay(TIMING_SPAWN_STAGGER_MS)
						}
					}
					await delay(TIMING_SPAWN_MS)
					if (animTokenRef.current === token) {
						setSpawnKeys([])
					}
				} else if (event.type === 'LEVEL_UP') {
					playSound('levelup')
					void hapticLevelUp()
					setLevelUpLevel(event.newLevel)
					setLevelUpVisible(true)
					await delay(200)
				} else if (event.type === 'GAME_OVER') {
					playSound('gameover')
					void hapticGameOver()
					await delay(80)
				}
			}

			if (animTokenRef.current !== token) {
				return
			}
			syncDisplay(finalState)
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
				await flashBlocked(selectedRef.current)
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
		[flashBlocked, persist, playEvents, startedAt],
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
					void flashBlocked(position)
					return
				}
				playSound('select')
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
					playSound('select')
					void hapticSelection()
					setSelected(position)
					return
				}
				void flashBlocked(selected)
				return
			}

			void commitMove({ from: selected, to: position })
		},
		[commitMove, flashBlocked, inputLocked, ready, selected],
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
		setGainFlash(null)
		setInputLocked(false)
		setLastTurn(null)
		setLevelUpVisible(false)
		setChainVisible(false)
		void persist(restored, startedAt)
	}, [inputLocked, persist, startedAt, syncDisplay])

	const confirmRestart = useCallback(() => {
		beginNewGame(
			createInitialGame(createFreshSeed(), presetRef.current),
		)
	}, [beginNewGame])

	const finishOnboarding = useCallback(async () => {
		setShowOnboarding(false)
		setOnboardingStep(0)
		try {
			await saveOnboardingDone(true)
		} catch {
			// ignore
		}
	}, [])

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
		pulseStrong,
		spawnKeys,
		shrinkKeys,
		shakeKey,
		traveler,
		scorePopup,
		chainVisible,
		chainLevel,
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
		soundEnabled,
		hapticEnabled,
		showSettings,
		showOnboarding,
		onboardingStep,
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
		dismissChain: () => setChainVisible(false),
		openSettings: () => setShowSettings(true),
		closeSettings: () => setShowSettings(false),
		setSoundPref: (value: boolean) => {
			setSoundEnabledState(value)
			setSoundEnabled(value)
			void saveSoundEnabled(value)
		},
		setHapticPref: (value: boolean) => {
			setHapticEnabledState(value)
			setHapticEnabled(value)
			void saveHapticEnabled(value)
		},
		openHowToPlay: () => {
			setShowSettings(false)
			setOnboardingStep(0)
			setShowOnboarding(true)
		},
		onboardingNext: () => {
			setOnboardingStep((s) =>
				Math.min(ONBOARDING_STEP_COUNT - 1, s + 1),
			)
		},
		onboardingSkip: () => {
			void finishOnboarding()
		},
		onboardingFinish: () => {
			void finishOnboarding()
		},
	}
}
