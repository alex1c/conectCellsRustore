/**
 * Main hex playable screen — Phase 4 production shell (no banners).
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	LayoutChangeEvent,
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { showRewardedUndo } from '../ads/adsService'
import { trackEvent } from '../analytics/appMetrica'
import { pauseGameplayAudio } from './feel/sound'
import { APP_DISPLAY_NAME } from '../branding'
import { ChainToast } from './components/ChainToast'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DevPanel } from './components/DevPanel'
import { GameOverOverlay } from './components/GameOverOverlay'
import { HexBoardView } from './components/HexBoardView'
import { LevelUpToast } from './components/LevelUpToast'
import { OnboardingModal } from './components/OnboardingModal'
import { RestartDialog } from './components/RestartDialog'
import { ScoreHeader } from './components/ScoreHeader'
import { UiErrorBoundary } from './components/UiErrorBoundary'
import { PERF_TELEMETRY } from './feel/perfFlags'
import {
	COLOR_APP_BACKGROUND,
	COLOR_BUTTON_PRIMARY_TEXT,
	COLOR_DIVIDER,
	COLOR_SURFACE_ELEVATED,
	COLOR_TEXT,
	COLOR_TEXT_MUTED,
	COLOR_TEXT_SECONDARY,
	COLOR_ACCENT,
	COLOR_ACCENT_SECONDARY,
	COLOR_WARNING,
} from './theme/colors'
import type { GameController } from './hooks/useGameController'

const H_PAD = 16
const ADS_UNAVAILABLE_MSG = 'Реклама пока недоступна. Попробуйте позже.'

export interface GameScreenProps {
	game: GameController
	onBackHome?: () => void
	onOpenSettings?: () => void
	onOpenHowToPlay?: () => void
}

export function GameScreen (props: GameScreenProps) {
	const { game, onBackHome, onOpenSettings } = props
	const insets = useSafeAreaInsets()
	const [viewportWidth, setViewportWidth] = useState(360)
	const [undoConfirmVisible, setUndoConfirmVisible] = useState(false)
	const [undoBusy, setUndoBusy] = useState(false)

	const boardWidth = useMemo(() => {
		const usable = Math.max(300, viewportWidth - H_PAD * 2)
		return Math.min(usable, 440)
	}, [viewportWidth])

	const handleLayout = (event: LayoutChangeEvent) => {
		setViewportWidth(event.nativeEvent.layout.width)
	}

	/**
	 * DEV/PERF only: detect board layout shifts during merge playback.
	 * Default OFF — never spam logcat during ordinary play.
	 */
	const lastBoardGeomRef = useRef<{
		y: number
		width: number
		height: number
	} | null>(null)
	const handleBoardLayout = useCallback((event: LayoutChangeEvent) => {
		if (!__DEV__ || !PERF_TELEMETRY) {
			return
		}
		const { y, width, height } = event.nativeEvent.layout
		const prev = lastBoardGeomRef.current
		lastBoardGeomRef.current = { y, width, height }
		if (
			prev &&
			(prev.y !== y || prev.width !== width || prev.height !== height)
		) {
			console.log(
				'[ConnectCells] board geometry changed ' +
					JSON.stringify({
						before: prev,
						after: { y, width, height },
					}),
			)
		}
	}, [])

	/** Shared rewarded undo path for in-game button and Game Over rescue. */
	const runRewardedUndo = useCallback(async () => {
		if (undoBusy || !game.canUndoMove) {
			return
		}
		setUndoBusy(true)
		setUndoConfirmVisible(false)
		trackEvent('undo_offer')
		trackEvent('undo_rewarded_started')
		try {
			// Stop SFX so rewarded ad audio is not mixed with gameplay.
			pauseGameplayAudio()
			const result = await showRewardedUndo()
			if (result.status === 'rewarded') {
				trackEvent('undo_rewarded_completed')
				game.applyUndo()
				game.dismissGameOver()
			} else if (
				result.status === 'failed' ||
				result.status === 'unavailable'
			) {
				trackEvent('undo_rewarded_failed', { reason: result.status })
				Alert.alert('Реклама', result.reason || ADS_UNAVAILABLE_MSG)
			} else {
				trackEvent('undo_rewarded_failed', {
					reason: 'dismissed_without_reward',
				})
			}
		} catch {
			trackEvent('undo_rewarded_failed', { reason: 'exception' })
			Alert.alert('Реклама', ADS_UNAVAILABLE_MSG)
		} finally {
			setUndoBusy(false)
		}
	}, [game, undoBusy])

	const handleUndoPress = useCallback(() => {
		if (!game.canUndoMove || undoBusy) {
			return
		}
		setUndoConfirmVisible(true)
	}, [game.canUndoMove, undoBusy])

	const handleSettingsPress = useCallback(() => {
		if (onOpenSettings) {
			onOpenSettings()
			return
		}
		game.openSettings()
	}, [game, onOpenSettings])

	if (!game.ready) {
		return (
			<View style={[styles.loading, { paddingTop: insets.top }]}>
				<ActivityIndicator size="large" color={COLOR_ACCENT} />
				<Text style={styles.loadingText}>Загрузка…</Text>
			</View>
		)
	}

	return (
		<View
			style={[
				styles.safe,
				{
					paddingTop: insets.top,
					paddingBottom: Math.max(insets.bottom, 8),
				},
			]}
			onLayout={handleLayout}
		>
			<StatusBar style="light" />
			<View style={styles.container}>
				<View style={styles.brandRow}>
					{onBackHome ? (
						<Pressable
							style={styles.homeBtn}
							onPress={onBackHome}
							accessibilityLabel="На главную"
						>
							<Text style={styles.homeBtnText}>←</Text>
						</Pressable>
					) : (
						<View style={styles.homeBtnSpacer} />
					)}
					<Text style={styles.brand}>{APP_DISPLAY_NAME}</Text>
					<Pressable
						style={styles.gear}
						onPress={handleSettingsPress}
						accessibilityLabel="Настройки"
					>
						<Text style={styles.gearText}>⚙</Text>
					</Pressable>
				</View>

				<ScoreHeader
					score={game.displayScore}
					best={game.bestScore}
					level={game.level}
					levelProgress={game.levelProgress}
					gainFlash={game.gainFlash}
				/>

				{game.pathBlockedFlash ? (
					<Text style={styles.blocked}>Путь закрыт</Text>
				) : (
					<Text style={styles.hint}>
						Выберите клетку, затем пустую цель по свободному пути
					</Text>
				)}

				{/*
				 * Board is pinned to the top of remaining space (not vertically
				 * recentered). Header/gain/DevPanel height changes must not
				 * visually shove the hex field — ScoreHeader geometry is stable.
				 */}
				<View style={styles.boardWrap} onLayout={handleBoardLayout}>
					<UiErrorBoundary label="HexBoard">
						<HexBoardView
							board={game.displayBoard}
							selected={game.selected}
							pulseKey={game.pulseKey}
							pulseStrong={game.pulseStrong}
							spawnKeys={game.spawnKeys}
							shrinkKeys={game.shrinkKeys}
							shakeKey={game.shakeKey}
							traveler={game.traveler}
							scorePopup={game.scorePopup}
							inputLocked={game.inputLocked}
							boardWidth={boardWidth}
							onCellPress={game.handleCellPress}
							onTravelerComplete={game.handleTravelerComplete}
						/>
					</UiErrorBoundary>
				</View>

				<View style={styles.actions}>
					<Pressable
						style={[
							styles.button,
							(!game.canUndoMove || undoBusy) && styles.buttonDisabled,
						]}
						disabled={!game.canUndoMove || undoBusy}
						onPress={handleUndoPress}
					>
						<Text style={styles.buttonText}>↶ Отменить ход 🎬</Text>
					</Pressable>
					<Pressable
						style={[
							styles.button,
							styles.buttonSecondary,
							game.inputLocked && styles.buttonDisabled,
						]}
						disabled={game.inputLocked}
						onPress={game.requestRestart}
					>
						<Text style={styles.buttonText}>Заново</Text>
					</Pressable>
				</View>

				{__DEV__ ? (
					<UiErrorBoundary label="DevPanel">
						<DevPanel
							activePreset={game.activePreset}
							onSelectPreset={game.handleSelectPreset}
							onLoadFixture={game.handleLoadFixture}
							onNewSeed={game.handleNewSeed}
							lastMetrics={game.lastMetrics}
							lastTurn={game.lastTurn}
						/>
					</UiErrorBoundary>
				) : null}
			</View>

			<GameOverOverlay
				visible={game.gameOverVisible}
				score={game.displayScore}
				best={game.bestScore}
				level={game.level}
				bestLevel={game.bestLevel}
				canUndo={game.canUndoMove}
				undoBusy={undoBusy}
				onNewGame={game.handleNewGameFromOver}
				onRewardedUndo={() => {
					void runRewardedUndo()
				}}
				onBackHome={onBackHome}
			/>
			<LevelUpToast
				visible={game.levelUpVisible}
				level={game.levelUpLevel}
				onHidden={game.dismissLevelUp}
			/>
			<ChainToast
				visible={game.chainVisible}
				cascadeLevel={game.chainLevel}
				onHidden={game.dismissChain}
			/>
			<RestartDialog
				visible={game.showRestartDialog}
				onCancel={game.cancelRestart}
				onConfirm={game.confirmRestart}
			/>
			<ConfirmDialog
				visible={undoConfirmVisible}
				title="Отменить ход?"
				body="Чтобы отменить ход, посмотрите короткую рекламу."
				confirmLabel="Смотреть"
				busy={undoBusy}
				onCancel={() => setUndoConfirmVisible(false)}
				onConfirm={() => {
					void runRewardedUndo()
				}}
			/>
			<OnboardingModal
				visible={game.showOnboarding}
				step={game.onboardingStep}
				onNext={game.onboardingNext}
				onSkip={game.onboardingSkip}
				onFinish={game.onboardingFinish}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: COLOR_APP_BACKGROUND,
	},
	loading: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLOR_APP_BACKGROUND,
		gap: 12,
	},
	loadingText: {
		color: COLOR_TEXT_MUTED,
	},
	container: {
		flex: 1,
		paddingHorizontal: H_PAD,
		paddingTop: 4,
	},
	brandRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 2,
	},
	brand: {
		flex: 1,
		fontSize: 24,
		fontWeight: '800',
		color: COLOR_TEXT,
		letterSpacing: -0.4,
		textAlign: 'center',
	},
	homeBtn: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: COLOR_SURFACE_ELEVATED,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: COLOR_DIVIDER,
	},
	homeBtnSpacer: {
		width: 40,
	},
	homeBtnText: {
		fontSize: 18,
		color: COLOR_TEXT_SECONDARY,
		fontWeight: '700',
	},
	gear: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: COLOR_SURFACE_ELEVATED,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: COLOR_DIVIDER,
	},
	gearText: {
		fontSize: 18,
		color: COLOR_TEXT_SECONDARY,
	},
	hint: {
		fontSize: 13,
		color: COLOR_TEXT_MUTED,
		marginBottom: 8,
		textAlign: 'center',
		// Fixed line box so blocked/hint swap cannot nudge the board.
		minHeight: 36,
		lineHeight: 18,
	},
	blocked: {
		fontSize: 13,
		color: COLOR_WARNING,
		fontWeight: '700',
		marginBottom: 8,
		textAlign: 'center',
		minHeight: 36,
		lineHeight: 18,
	},
	boardWrap: {
		flexGrow: 1,
		// Pin board top — do NOT justifyContent:'center' (reflows on sibling height).
		justifyContent: 'flex-start',
		alignItems: 'center',
		paddingTop: 4,
	},
	actions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 10,
	},
	button: {
		flex: 1,
		backgroundColor: COLOR_ACCENT,
		paddingVertical: 14,
		paddingHorizontal: 8,
		borderRadius: 12,
		alignItems: 'center',
	},
	buttonSecondary: {
		backgroundColor: COLOR_ACCENT_SECONDARY,
		flex: 0.55,
	},
	buttonDisabled: {
		opacity: 0.4,
	},
	buttonText: {
		color: COLOR_BUTTON_PRIMARY_TEXT,
		fontWeight: '700',
		fontSize: 14,
		textAlign: 'center',
	},
})
