/**
 * About screen — brand, publisher, version, developer contacts.
 * Dark theme is the only 1.0 appearance. No game-screen placement.
 */

import { useCallback } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
	APP_DISPLAY_NAME,
	APP_PUBLISHER,
	APP_VERSION,
} from '../../branding'
import {
	FOREST_MUSIC_CONTACT_EMAIL,
	FOREST_MUSIC_SITE_LABEL,
	openForestMusicEmail,
	openForestMusicSite,
} from '../links/forestMusicRuStore'
import {
	COLOR_ACCENT,
	COLOR_APP_BACKGROUND,
	COLOR_DIVIDER,
	COLOR_SURFACE_ELEVATED,
	COLOR_TEXT,
	COLOR_TEXT_MUTED,
	COLOR_TEXT_SECONDARY,
} from '../theme/colors'

export interface AboutScreenProps {
	onBack: () => void
}

export function AboutScreen (props: AboutScreenProps) {
	const { onBack } = props
	const insets = useSafeAreaInsets()

	const handleOpenSite = useCallback(() => {
		void openForestMusicSite()
	}, [])

	const handleOpenEmail = useCallback(() => {
		void openForestMusicEmail()
	}, [])

	return (
		<View
			style={[
				styles.root,
				{
					paddingTop: insets.top + 8,
					paddingBottom: Math.max(insets.bottom, 8),
				},
			]}
		>
			<Pressable onPress={onBack} hitSlop={12}>
				<Text style={styles.back}>← Назад</Text>
			</Pressable>

			<Text style={styles.screenTitle}>О приложении</Text>

			<View style={styles.card}>
				<Text style={styles.brand}>{APP_DISPLAY_NAME}</Text>
				<Text style={styles.version}>Версия {APP_VERSION}</Text>

				<View style={styles.divider} />

				{/* Publisher block — kept for store / branding continuity. */}
				<Text style={styles.sectionLabel}>Разработчик</Text>
				<Text style={styles.sectionValue}>{APP_PUBLISHER}</Text>

				<View style={styles.divider} />

				{/* External website — Linking.openURL, no WebView. */}
				<Text style={styles.sectionLabel}>Сайт</Text>
				<Pressable
					onPress={handleOpenSite}
					hitSlop={8}
					accessibilityRole="link"
					accessibilityLabel={`Сайт ${FOREST_MUSIC_SITE_LABEL}`}
				>
					<Text style={styles.linkValue}>{FOREST_MUSIC_SITE_LABEL}</Text>
				</Pressable>

				<View style={styles.divider} />

				{/* mailto: contact — opens the system email client. */}
				<Text style={styles.sectionLabel}>Связаться с разработчиком</Text>
				<Pressable
					onPress={handleOpenEmail}
					hitSlop={8}
					accessibilityRole="link"
					accessibilityLabel={`Написать на ${FOREST_MUSIC_CONTACT_EMAIL}`}
				>
					<Text style={styles.linkValue}>{FOREST_MUSIC_CONTACT_EMAIL}</Text>
				</Pressable>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: COLOR_APP_BACKGROUND,
		paddingHorizontal: 20,
	},
	back: {
		color: COLOR_ACCENT,
		fontWeight: '700',
		fontSize: 15,
		marginBottom: 16,
	},
	screenTitle: {
		fontSize: 20,
		fontWeight: '800',
		color: COLOR_TEXT,
		marginBottom: 16,
	},
	card: {
		backgroundColor: COLOR_SURFACE_ELEVATED,
		borderRadius: 16,
		paddingHorizontal: 20,
		paddingVertical: 22,
		borderWidth: 1,
		borderColor: COLOR_DIVIDER,
	},
	brand: {
		fontSize: 26,
		fontWeight: '900',
		color: COLOR_TEXT,
		marginBottom: 6,
	},
	version: {
		fontSize: 15,
		fontWeight: '600',
		color: COLOR_TEXT_SECONDARY,
	},
	divider: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_DIVIDER,
		marginVertical: 16,
	},
	sectionLabel: {
		fontSize: 13,
		fontWeight: '600',
		color: COLOR_TEXT_MUTED,
		marginBottom: 6,
		textTransform: 'none',
	},
	sectionValue: {
		fontSize: 16,
		fontWeight: '700',
		color: COLOR_TEXT,
	},
	linkValue: {
		fontSize: 16,
		fontWeight: '700',
		color: COLOR_ACCENT,
		textDecorationLine: 'underline',
	},
})
