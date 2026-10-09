/**
 * How to Play screen — static rules copy with a bottom banner.
 * Orphan relative to AppRoot (interactive TutorialScreen is the live path),
 * but kept localized so a future remount stays consistent.
 * Dark theme is the only 1.0 appearance.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BannerSlot } from '../../ads/BannerSlot'
import { useTranslation } from '../../localization/useTranslation'
import {
	COLOR_ACCENT,
	COLOR_APP_BACKGROUND,
	COLOR_DIVIDER,
	COLOR_SURFACE_ELEVATED,
	COLOR_TEXT,
	COLOR_TEXT_SECONDARY,
} from '../theme/colors'

const SECTION_KEYS = [
	{
		id: 'move',
		titleKey: 'howToPlay.move.title',
		lineKeys: ['howToPlay.move.line1', 'howToPlay.move.line2'],
	},
	{
		id: 'merge',
		titleKey: 'howToPlay.merge.title',
		lineKeys: ['howToPlay.merge.line1', 'howToPlay.merge.line2'],
	},
	{
		id: 'largeGroups',
		titleKey: 'howToPlay.largeGroups.title',
		lineKeys: ['howToPlay.largeGroups.line1'],
	},
	{
		id: 'levels',
		titleKey: 'howToPlay.levels.title',
		lineKeys: ['howToPlay.levels.line1', 'howToPlay.levels.line2'],
	},
] as const

export interface HowToPlayScreenProps {
	onBack: () => void
}

export function HowToPlayScreen (props: HowToPlayScreenProps) {
	const { onBack } = props
	const insets = useSafeAreaInsets()
	const { t } = useTranslation()

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
				<Text style={styles.title}>{t('howToPlay.title')}</Text>
				<View style={styles.backSpacer} />
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{SECTION_KEYS.map((section) => (
					<View key={section.id} style={styles.card}>
						<Text style={styles.cardTitle}>{t(section.titleKey)}</Text>
						{section.lineKeys.map((lineKey) => (
							<Text key={lineKey} style={styles.line}>
								{t(lineKey)}
							</Text>
						))}
					</View>
				))}
			</ScrollView>

			{/* Banner stays below tutorial content and above the home indicator. */}
			<BannerSlot placement="howToPlayBanner" />
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
		marginBottom: 12,
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
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 16,
		gap: 12,
	},
	card: {
		backgroundColor: COLOR_SURFACE_ELEVATED,
		borderRadius: 14,
		padding: 16,
		borderWidth: 1,
		borderColor: COLOR_DIVIDER,
	},
	cardTitle: {
		fontSize: 17,
		fontWeight: '800',
		color: COLOR_TEXT,
		marginBottom: 8,
	},
	line: {
		fontSize: 15,
		color: COLOR_TEXT_SECONDARY,
		lineHeight: 22,
		marginBottom: 4,
	},
})
