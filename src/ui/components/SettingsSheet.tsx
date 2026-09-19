/**
 * Compact settings sheet: Sound, Haptic, How to Play.
 */

import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native'

export interface SettingsSheetProps {
	visible: boolean
	soundEnabled: boolean
	hapticEnabled: boolean
	onToggleSound: (value: boolean) => void
	onToggleHaptic: (value: boolean) => void
	onHowToPlay: () => void
	onClose: () => void
}

export function SettingsSheet (props: SettingsSheetProps) {
	const {
		visible,
		soundEnabled,
		hapticEnabled,
		onToggleSound,
		onToggleHaptic,
		onHowToPlay,
		onClose,
	} = props

	return (
		<Modal visible={visible} transparent animationType="fade">
			<Pressable style={styles.backdrop} onPress={onClose}>
				<Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
					<Text style={styles.title}>Настройки</Text>

					<View style={styles.row}>
						<Text style={styles.label}>Звук</Text>
						<Switch
							value={soundEnabled}
							onValueChange={onToggleSound}
							trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
							thumbColor={soundEnabled ? '#1d4ed8' : '#f8fafc'}
						/>
					</View>

					<View style={styles.row}>
						<Text style={styles.label}>Вибрация</Text>
						<Switch
							value={hapticEnabled}
							onValueChange={onToggleHaptic}
							trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
							thumbColor={hapticEnabled ? '#1d4ed8' : '#f8fafc'}
						/>
					</View>

					<Pressable style={styles.help} onPress={onHowToPlay}>
						<Text style={styles.helpText}>Как играть</Text>
					</Pressable>

					<Pressable style={styles.close} onPress={onClose}>
						<Text style={styles.closeText}>Закрыть</Text>
					</Pressable>
				</Pressable>
			</Pressable>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(15, 23, 42, 0.45)',
		justifyContent: 'center',
		padding: 24,
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		padding: 20,
	},
	title: {
		fontSize: 20,
		fontWeight: '800',
		color: '#0f172a',
		marginBottom: 16,
		textAlign: 'center',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#e2e8f0',
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		color: '#334155',
	},
	help: {
		marginTop: 16,
		backgroundColor: '#e2e8f0',
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	helpText: {
		fontWeight: '700',
		color: '#0f172a',
		fontSize: 15,
	},
	close: {
		marginTop: 10,
		paddingVertical: 12,
		alignItems: 'center',
	},
	closeText: {
		color: '#64748b',
		fontWeight: '600',
	},
})
