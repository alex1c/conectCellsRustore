/**
 * Main hex playable screen (Phase 2.6).
 */

import { useMemo, useState } from 'react'
import {
	ActivityIndicator,
	LayoutChangeEvent,
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'

import { HexBoardView } from './components/HexBoardView'
import { DevPanel } from './components/DevPanel'
import { GameOverOverlay } from './components/GameOverOverlay'
import { RestartDialog } from './components/RestartDialog'
import { ScoreHeader } from './components/ScoreHeader'
import { useGameController } from './hooks/useGameController'

const H_PAD = 16

export function GameScreen () {
	const game = useGameController()
	const [viewportWidth, setViewportWidth] = useState(360)

	const boardWidth = useMemo(() => {
		const usable = Math.max(300, viewportWidth - H_PAD * 2)
		return Math.min(usable, 440)
	}, [viewportWidth])

	const handleLayout = (event: LayoutChangeEvent) => {
		setViewportWidth(event.nativeEvent.layout.width)
	}

	if (!game.ready) {
		return (
			<SafeAreaView style={styles.loading} edges={['top', 'bottom']}>
				<ActivityIndicator size="large" color="#1d4ed8" />
				<Text style={styles.loadingText}>Загрузка…</Text>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView
			style={styles.safe}
			edges={['top', 'bottom']}
			onLayout={handleLayout}
		>
			<StatusBar style="dark" />
			<View style={styles.container}>
				<Text style={styles.brand}>Connect Cells</Text>
				<ScoreHeader
					score={game.displayScore}
					best={game.bestScore}
					gainFlash={game.gainFlash}
				/>

				{game.pathBlockedFlash ? (
					<Text style={styles.blocked}>Путь закрыт</Text>
				) : (
					<Text style={styles.hint}>
						Выберите клетку, затем пустую цель по свободному пути
					</Text>
				)}

				<View style={styles.boardWrap}>
					<HexBoardView
						board={game.displayBoard}
						selected={game.selected}
						pulseKey={game.pulseKey}
						spawnKeys={game.spawnKeys}
						inputLocked={game.inputLocked}
						boardWidth={boardWidth}
						onCellPress={game.handleCellPress}
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
						<Text style={styles.buttonText}>Undo</Text>
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

				<DevPanel
					onLoadFixture={game.handleLoadFixture}
					onNewSeed={game.handleNewSeed}
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
		backgroundColor: '#f3f6fb',
	},
	loading: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#f3f6fb',
		gap: 12,
	},
	loadingText: {
		color: '#64748b',
	},
	container: {
		flex: 1,
		paddingHorizontal: H_PAD,
		paddingTop: 4,
		paddingBottom: 8,
	},
	brand: {
		fontSize: 24,
		fontWeight: '800',
		color: '#0f172a',
		marginBottom: 4,
	},
	hint: {
		fontSize: 13,
		color: '#64748b',
		marginBottom: 8,
		textAlign: 'center',
	},
	blocked: {
		fontSize: 13,
		color: '#b45309',
		fontWeight: '700',
		marginBottom: 8,
		textAlign: 'center',
	},
	boardWrap: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	actions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 10,
	},
	button: {
		flex: 1,
		backgroundColor: '#1d4ed8',
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
		color: '#fff',
		fontWeight: '700',
		fontSize: 16,
	},
})
