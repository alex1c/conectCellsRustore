import { StatusBar } from 'expo-status-bar'
import { useMemo, useState } from 'react'
import {
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native'

import {
	applyMove,
	createInitialGame,
	getLegalMoves,
	type GameState,
} from './src/game'

const DEMO_SEED = 42

/**
 * Phase 1 launch screen only.
 * Confirms the app boots and that the pure engine can run a demo move
 * without a polished board UI.
 */
export default function App () {
	const [state, setState] = useState<GameState>(() =>
		createInitialGame(DEMO_SEED),
	)
	const [lastNote, setLastNote] = useState('Engine ready')

	const legalCount = useMemo(
		() => getLegalMoves(state).length,
		[state],
	)

	const handleDemoMove = () => {
		const moves = getLegalMoves(state)
		const move = moves[0]
		if (!move) {
			setLastNote('No legal moves')
			return
		}
		const result = applyMove(state, move)
		if (!result.ok) {
			setLastNote('Move rejected')
			return
		}
		setState(result.state)
		const mergeEvents = result.events.filter(
			(event) => event.type === 'MERGE' || event.type === 'CHAIN_STEP',
		).length
		setLastNote(
			`Move OK · events ${result.events.length} · merges/chains ${mergeEvents} · score ${result.state.score}`,
		)
	}

	const handleRestart = () => {
		setState(createInitialGame(DEMO_SEED))
		setLastNote('Restarted seed 42')
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Connect Cells</Text>
			<Text style={styles.phase}>Phase 1</Text>

			<View style={styles.boardPlaceholder} accessibilityLabel="Board placeholder">
				<Text style={styles.placeholderLabel}>Board placeholder</Text>
				<Text style={styles.meta}>
					score {state.score} · moves {state.moveCount} · legal {legalCount}
				</Text>
				<Text style={styles.meta}>status {state.status}</Text>
			</View>

			<Text style={styles.note}>{lastNote}</Text>

			<Pressable style={styles.button} onPress={handleDemoMove}>
				<Text style={styles.buttonText}>Developer demo move</Text>
			</Pressable>
			<Pressable style={styles.secondaryButton} onPress={handleRestart}>
				<Text style={styles.buttonText}>Restart demo</Text>
			</Pressable>

			<StatusBar style="auto" />
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f2f4f7',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		color: '#1a1f36',
		marginBottom: 4,
	},
	phase: {
		fontSize: 16,
		color: '#5c6b8a',
		marginBottom: 24,
	},
	boardPlaceholder: {
		width: '100%',
		maxWidth: 320,
		aspectRatio: 1,
		borderWidth: 2,
		borderColor: '#c5d0e6',
		borderStyle: 'dashed',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#e8eef8',
		marginBottom: 16,
		padding: 16,
	},
	placeholderLabel: {
		fontSize: 18,
		color: '#3d4a66',
		marginBottom: 8,
	},
	meta: {
		fontSize: 13,
		color: '#5c6b8a',
		textAlign: 'center',
	},
	note: {
		fontSize: 13,
		color: '#334155',
		marginBottom: 16,
		textAlign: 'center',
	},
	button: {
		backgroundColor: '#2f6fed',
		paddingHorizontal: 20,
		paddingVertical: 12,
		marginBottom: 10,
		minWidth: 220,
		alignItems: 'center',
	},
	secondaryButton: {
		backgroundColor: '#475569',
		paddingHorizontal: 20,
		paddingVertical: 12,
		minWidth: 220,
		alignItems: 'center',
	},
	buttonText: {
		color: '#ffffff',
		fontSize: 15,
		fontWeight: '600',
	},
})
