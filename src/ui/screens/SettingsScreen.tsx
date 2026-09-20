/**
 * Production Settings screen with sound/haptic toggles and About entry.
 * Dark theme is the only 1.0 appearance.
 */

import { useCallback } from 'react'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BannerSlot } from '../../ads/BannerSlot'
import { openForestMusicRuStore } from '../links/forestMusicRuStore'
import {
	COLOR_ACCENT,
	COLOR_APP_BACKGROUND,
	COLOR_DIVIDER,
	COLOR_SURFACE_ELEVATED,
	COLOR_SWITCH_THUMB,
	COLOR_SWITCH_TRACK_OFF,
	COLOR_SWITCH_TRACK_ON,
	COLOR_TEXT,
	COLOR_TEXT_MUTED,
	COLOR_TEXT_SECONDARY,
} from '../theme/colors'

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

	const handleOpenOtherApps = useCallback(() => {
		void openForestMusicRuStore()
	}, [])

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
				<Pressable style={styles.linkRow} onPress={onHowToPlay}>
					<Text style={styles.linkText}>Как играть</Text>
				</Pressable>
				<Pressable style={styles.linkRow} onPress={onAbout}>
					<Text style={styles.linkText}>О приложении</Text>
				</Pressable>
				{/*
				 * ForestMusic cross-promotion — Settings only.
				 * Not shown on the game screen / startup; opens externally.
				 */}
				<Pressable
					style={[styles.linkRow, styles.linkRowLast]}
					onPress={handleOpenOtherApps}
					accessibilityRole="link"
					accessibilityLabel="Другие наши приложения. Посмотреть приложения ForestMusic в RuStore"
				>
					<Text style={styles.linkText}>Другие наши приложения</Text>
					<Text style={styles.linkSubtext}>
						Посмотреть приложения ForestMusic в RuStore
					</Text>
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
		backgroundColor: COLOR_APP_BACKGROUND,
		paddingHorizontal: 20,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	back: {
		color: COLOR_ACCENT,
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
		color: COLOR_TEXT,
	},
	card: {
		backgroundColor: COLOR_SURFACE_ELEVATED,
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 4,
		borderWidth: 1,
		borderColor: COLOR_DIVIDER,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLOR_DIVIDER,
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		color: COLOR_TEXT_SECONDARY,
	},
	linkRow: {
		paddingVertical: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLOR_DIVIDER,
	},
	linkRowLast: {
		borderBottomWidth: 0,
	},
	linkText: {
		fontSize: 16,
		fontWeight: '700',
		color: COLOR_ACCENT,
	},
	linkSubtext: {
		marginTop: 4,
		fontSize: 13,
		fontWeight: '500',
		color: COLOR_TEXT_MUTED,
		lineHeight: 18,
	},
	flex: {
		flex: 1,
	},
})
