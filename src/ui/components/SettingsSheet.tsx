/**
 * Compact settings sheet: Sounds, Haptic, How to Play.
 * Dark theme is the only 1.0 appearance.
 */

import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native'

import {
	COLOR_DIVIDER,
	COLOR_MODAL_SCRIM,
	COLOR_SURFACE,
	COLOR_SURFACE_ELEVATED,
	COLOR_SWITCH_THUMB,
	COLOR_SWITCH_TRACK_OFF,
	COLOR_SWITCH_TRACK_ON,
	COLOR_TEXT,
	COLOR_TEXT_MUTED,
	COLOR_TEXT_SECONDARY,
} from '../theme/colors'

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
						{/* SFX only — never labeled «Музыка». */}
						<Text style={styles.label}>Звуки</Text>
						<Switch
							value={soundEnabled}
							onValueChange={onToggleSound}
							trackColor={{
								false: COLOR_SWITCH_TRACK_OFF,
								true: COLOR_SWITCH_TRACK_ON,
							}}
							thumbColor={COLOR_SWITCH_THUMB}
						/>
					</View>

					<View style={styles.row}>
						<Text style={styles.label}>Вибрация</Text>
						<Switch
							value={hapticEnabled}
							onValueChange={onToggleHaptic}
							trackColor={{
								false: COLOR_SWITCH_TRACK_OFF,
								true: COLOR_SWITCH_TRACK_ON,
							}}
							thumbColor={COLOR_SWITCH_THUMB}
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
		backgroundColor: COLOR_MODAL_SCRIM,
		justifyContent: 'center',
		padding: 24,
	},
	card: {
		backgroundColor: COLOR_SURFACE_ELEVATED,
		borderRadius: 16,
		padding: 20,
		borderWidth: 1,
		borderColor: COLOR_DIVIDER,
	},
	title: {
		fontSize: 20,
		fontWeight: '800',
		color: COLOR_TEXT,
		marginBottom: 16,
		textAlign: 'center',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLOR_DIVIDER,
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		color: COLOR_TEXT_SECONDARY,
	},
	help: {
		marginTop: 16,
		backgroundColor: COLOR_SURFACE,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	helpText: {
		fontWeight: '700',
		color: COLOR_TEXT,
		fontSize: 15,
	},
	close: {
		marginTop: 10,
		paddingVertical: 12,
		alignItems: 'center',
	},
	closeText: {
		color: COLOR_TEXT_MUTED,
		fontWeight: '600',
	},
})
