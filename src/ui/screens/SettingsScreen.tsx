/**
 * Production Settings screen with sound/haptic toggles and About entry.
 * Dark theme is the only 1.0 appearance.
 */

import { useCallback } from 'react'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BannerSlot } from '../../ads/BannerSlot'
import { useTranslation } from '../../localization/useTranslation'
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
	const { t } = useTranslation()

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
					<Text style={styles.back}>{t('common.back')}</Text>
				</Pressable>
				<Text style={styles.title}>{t('settings.title')}</Text>
				<View style={styles.backSpacer} />
			</View>

			<View style={styles.card}>
				<View style={styles.row}>
					{/* SFX only — never labeled «Музыка» / Music. */}
					<Text style={styles.label}>{t('settings.sound')}</Text>
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
					<Text style={styles.label}>{t('settings.haptic')}</Text>
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
					<Text style={styles.linkText}>{t('settings.howToPlay')}</Text>
				</Pressable>
				<Pressable style={styles.linkRow} onPress={onAbout}>
					<Text style={styles.linkText}>{t('settings.about')}</Text>
				</Pressable>
				{/*
				 * ForestMusic cross-promotion — Settings only.
				 * Not shown on the game screen / startup; opens externally.
				 */}
				<Pressable
					style={[styles.linkRow, styles.linkRowLast]}
					onPress={handleOpenOtherApps}
					accessibilityRole="link"
					accessibilityLabel={t('settings.otherAppsA11y')}
				>
					<Text style={styles.linkText}>{t('settings.otherApps')}</Text>
					<Text style={styles.linkSubtext}>
						{t('settings.otherAppsSub')}
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
		width: 96,
	},
	backSpacer: {
		width: 96,
	},
	title: {
		fontSize: 20,
		fontWeight: '800',
		color: COLOR_TEXT,
		flexShrink: 1,
		textAlign: 'center',
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
		gap: 12,
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		color: COLOR_TEXT_SECONDARY,
		flexShrink: 1,
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
