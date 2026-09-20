/**
 * Game Over overlay — New Game + optional rewarded Undo rescue.
 * Dark theme is the only 1.0 appearance.
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import {
	COLOR_ACCENT,
	COLOR_BUTTON_PRIMARY_TEXT,
	COLOR_BUTTON_SECONDARY,
	COLOR_DIVIDER,
	COLOR_MODAL_SCRIM,
	COLOR_SURFACE_ELEVATED,
	COLOR_TEXT,
	COLOR_TEXT_MUTED,
	COLOR_TEXT_SECONDARY,
} from '../theme/colors'

export interface GameOverOverlayProps {
	visible: boolean
	score: number
	best: number
	level: number
	bestLevel: number
	canUndo: boolean
	undoBusy?: boolean
	onNewGame: () => void
	onRewardedUndo: () => void
	onBackHome?: () => void
}

export function GameOverOverlay (props: GameOverOverlayProps) {
	const {
		visible,
		score,
		best,
		level,
		bestLevel,
		canUndo,
		undoBusy = false,
		onNewGame,
		onRewardedUndo,
		onBackHome,
	} = props
	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.backdrop}>
				<View style={styles.card}>
					<Text style={styles.title}>Игра окончена</Text>
					<Text style={styles.line}>Счёт: {score}</Text>
					<Text style={styles.line}>Уровень: {level}</Text>
					<Text style={styles.gap} />
					<Text style={styles.line}>Рекорд: {best}</Text>
					<Text style={styles.line}>Лучший уровень: {bestLevel}</Text>
					<Pressable style={styles.primary} onPress={onNewGame}>
						<Text style={styles.primaryText}>Новая игра</Text>
					</Pressable>
					{canUndo ? (
						<Pressable
							style={[styles.secondary, undoBusy && styles.disabled]}
							onPress={onRewardedUndo}
							disabled={undoBusy}
						>
							<Text style={styles.secondaryText}>
								{undoBusy
									? 'Загрузка рекламы…'
									: '↶ Отменить последний ход 🎬'}
							</Text>
						</Pressable>
					) : null}
					{onBackHome ? (
						<Pressable style={styles.home} onPress={onBackHome}>
							<Text style={styles.homeText}>На главную</Text>
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
		backgroundColor: COLOR_MODAL_SCRIM,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	card: {
		width: '100%',
		maxWidth: 360,
		backgroundColor: COLOR_SURFACE_ELEVATED,
		borderRadius: 16,
		padding: 24,
		borderWidth: 1,
		borderColor: COLOR_DIVIDER,
	},
	title: {
		fontSize: 24,
		fontWeight: '800',
		color: COLOR_TEXT,
		marginBottom: 12,
		textAlign: 'center',
	},
	line: {
		fontSize: 17,
		color: COLOR_TEXT_SECONDARY,
		textAlign: 'center',
		marginBottom: 4,
	},
	gap: {
		height: 8,
	},
	primary: {
		marginTop: 20,
		backgroundColor: COLOR_ACCENT,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	primaryText: {
		color: COLOR_BUTTON_PRIMARY_TEXT,
		fontWeight: '700',
		fontSize: 16,
	},
	secondary: {
		marginTop: 10,
		backgroundColor: COLOR_BUTTON_SECONDARY,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	secondaryText: {
		color: COLOR_TEXT,
		fontWeight: '600',
		fontSize: 15,
		textAlign: 'center',
	},
	home: {
		marginTop: 10,
		paddingVertical: 12,
		alignItems: 'center',
	},
	homeText: {
		color: COLOR_TEXT_MUTED,
		fontWeight: '600',
		fontSize: 15,
	},
	disabled: {
		opacity: 0.6,
	},
})
