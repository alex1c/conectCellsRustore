/**
 * Game Over overlay with new-game and optional undo actions.
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

export interface GameOverOverlayProps {
	visible: boolean
	score: number
	best: number
	canUndo: boolean
	onNewGame: () => void
	onUndo: () => void
}

export function GameOverOverlay (props: GameOverOverlayProps) {
	const { visible, score, best, canUndo, onNewGame, onUndo } = props
	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.backdrop}>
				<View style={styles.card}>
					<Text style={styles.title}>Игра окончена</Text>
					<Text style={styles.line}>Счёт: {score}</Text>
					<Text style={styles.line}>Лучший: {best}</Text>
					<Pressable style={styles.primary} onPress={onNewGame}>
						<Text style={styles.primaryText}>Новая игра</Text>
					</Pressable>
					{canUndo ? (
						<Pressable style={styles.secondary} onPress={onUndo}>
							<Text style={styles.secondaryText}>
								Отменить последний ход
							</Text>
						</Pressable>
					) : null}
				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(15, 23, 42, 0.55)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	card: {
		width: '100%',
		maxWidth: 360,
		backgroundColor: '#ffffff',
		borderRadius: 16,
		padding: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: '800',
		color: '#0f172a',
		marginBottom: 12,
		textAlign: 'center',
	},
	line: {
		fontSize: 17,
		color: '#334155',
		textAlign: 'center',
		marginBottom: 4,
	},
	primary: {
		marginTop: 20,
		backgroundColor: '#2563eb',
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	primaryText: {
		color: '#ffffff',
		fontWeight: '700',
		fontSize: 16,
	},
	secondary: {
		marginTop: 10,
		backgroundColor: '#e2e8f0',
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	secondaryText: {
		color: '#0f172a',
		fontWeight: '600',
		fontSize: 15,
	},
})
