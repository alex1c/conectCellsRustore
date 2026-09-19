/**
 * Production Settings screen with sound/haptic toggles and About entry.
 */

import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BannerSlot } from '../../ads/BannerSlot'

export interface SettingsScreenProps {
	soundEnabled: boolean
	hapticEnabled: boolean
	onToggleSound: (value: boolean) => void
	onToggleHaptic: (value: boolean) => void
	onHowToPlay: () => void
	onAbout: () => void
	onBack: () => void
}

export function SettingsScreen (props: SettingsScreenProps) {
	const {
		soundEnabled,
		hapticEnabled,
		onToggleSound,
		onToggleHaptic,
		onHowToPlay,
		onAbout,
		onBack,
	} = props
	const insets = useSafeAreaInsets()

	return (
		<View
			style={[
				styles.root,
				{ paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 8) },
			]}
		>
			<View style={styles.header}>
				<Pressable onPress={onBack} hitSlop={12}>
					<Text style={styles.back}>← Назад</Text>
				</Pressable>
				<Text style={styles.title}>Настройки</Text>
				<View style={styles.backSpacer} />
			</View>

			<View style={styles.card}>
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
				<Pressable style={styles.linkRow} onPress={onHowToPlay}>
					<Text style={styles.linkText}>Как играть</Text>
				</Pressable>
				<Pressable style={styles.linkRow} onPress={onAbout}>
					<Text style={styles.linkText}>О приложении</Text>
				</Pressable>
			</View>

			<View style={styles.flex} />
			<BannerSlot placement="settingsBanner" />
		</View>
	)
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: '#eef3f8',
		paddingHorizontal: 20,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	back: {
		color: '#1d4ed8',
		fontWeight: '700',
		fontSize: 15,
		width: 80,
	},
	backSpacer: {
		width: 80,
	},
	title: {
		fontSize: 20,
		fontWeight: '800',
		color: '#0f172a',
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 4,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#e2e8f0',
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		color: '#334155',
	},
	linkRow: {
		paddingVertical: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#e2e8f0',
	},
	linkText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#1d4ed8',
	},
	flex: {
		flex: 1,
	},
})
