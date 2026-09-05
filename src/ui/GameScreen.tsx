/**
 * Main playable game screen for Phase 2.
 */

import { useMemo, useState } from 'react'
import {
	ActivityIndicator,
	LayoutChangeEvent,
	Pressable,
	SafeAreaView,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'

import { BoardView } from './components/BoardView'
import { DevPanel } from './components/DevPanel'
import { GameOverOverlay } from './components/GameOverOverlay'
import { RestartDialog } from './components/RestartDialog'
import { ScoreHeader } from './components/ScoreHeader'
import { useGameController } from './hooks/useGameController'

const HORIZONTAL_PAD = 20

export function GameScreen () {
	const game = useGameController()
	const [viewportWidth, setViewportWidth] = useState(360)

	const boardWidth = useMemo(() => {
		const usable = Math.max(280, viewportWidth - HORIZONTAL_PAD * 2)
		return Math.min(usable, 420)
	}, [viewportWidth])

	const handleLayout = (event: LayoutChangeEvent) => {
		setViewportWidth(event.nativeEvent.layout.width)
	}

	if (!game.ready) {
		return (
			<SafeAreaView style={styles.loading}>
				<ActivityIndicator size="large" color="#2563eb" />
				<Text style={styles.loadingText}>Загрузка…</Text>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView style={styles.safe} onLayout={handleLayout}>
			<StatusBar style="dark" />
			<View style={styles.container}>
				<Text style={styles.brand}>Connect Cells</Text>
				<ScoreHeader
					score={game.displayScore}
					best={game.bestScore}
					gainFlash={game.gainFlash}
				/>

				<View style={styles.boardWrap}>
					<BoardView
						board={game.displayBoard}
						selected={game.selected}
						legalTargets={game.legalTargets}
						pulseKey={game.pulseKey}
						spawnKey={game.spawnKey}
						shakeKey={game.shakeKey}
						inputLocked={game.inputLocked}
						onCellPress={game.handleCellPress}
						boardWidth={boardWidth}
					/>
				</View>

				<View style={styles.actions}>
					<Pressable
						style={[
							styles.button,
							!game.canUndoMove && styles.buttonDisabled,
						]}
						disabled={!game.canUndoMove}
						onPress={game.handleUndo}
					>
						<Text
							style={[
								styles.buttonText,
								!game.canUndoMove && styles.buttonTextDisabled,
							]}
						>
							Undo
						</Text>
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
						<Text style={styles.buttonText}>Restart</Text>
					</Pressable>
				</View>

				<Text style={styles.hint}>
					Нажмите клетку, затем соседнюю с тем же значением
				</Text>

				<DevPanel
					onLoadFixture={game.handleLoadFixture}
					lastMetrics={game.lastMetrics}
				/>
			</View>

			<GameOverOverlay
				visible={game.showGameOver}
				score={game.displayScore}
				best={game.bestScore}
				canUndo={game.canUndoMove}
				onNewGame={game.handleNewGameFromOver}
				onUndo={game.handleUndo}
			/>
			<RestartDialog
				visible={game.showRestartDialog}
				onCancel={game.cancelRestart}
				onConfirm={game.confirmRestart}
			/>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: '#f5f7fb',
	},
	loading: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#f5f7fb',
		gap: 12,
	},
	loadingText: {
		color: '#64748b',
		fontSize: 15,
	},
	container: {
		flex: 1,
		paddingHorizontal: HORIZONTAL_PAD,
		paddingTop: 12,
		paddingBottom: 16,
		alignItems: 'center',
	},
	brand: {
		alignSelf: 'stretch',
		fontSize: 26,
		fontWeight: '800',
		color: '#0f172a',
		marginBottom: 10,
		letterSpacing: 0.2,
	},
	boardWrap: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
	},
	actions: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 18,
		width: '100%',
		maxWidth: 420,
	},
	button: {
		flex: 1,
		backgroundColor: '#2563eb',
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
	},
	buttonSecondary: {
		backgroundColor: '#334155',
	},
	buttonDisabled: {
		opacity: 0.4,
	},
	buttonText: {
		color: '#ffffff',
		fontWeight: '700',
		fontSize: 16,
	},
	buttonTextDisabled: {
		color: '#e2e8f0',
	},
	hint: {
		marginTop: 12,
		fontSize: 13,
		color: '#64748b',
		textAlign: 'center',
	},
})
