/**
 * Home screen — Continue / New Game / records / How to Play / Settings.
 * Dark theme is the only 1.0 appearance.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BannerSlot } from '../../ads/BannerSlot'
import { useTranslation } from '../../localization/useTranslation'
import {
	COLOR_ACCENT,
	COLOR_APP_BACKGROUND,
	COLOR_BUTTON_PRIMARY_SUB,
	COLOR_BUTTON_PRIMARY_TEXT,
	COLOR_BUTTON_SECONDARY,
	COLOR_TEXT,
	COLOR_TEXT_MUTED,
	COLOR_TEXT_SECONDARY,
} from '../theme/colors'

export interface HomeScreenProps {
	hasActiveGame: boolean
	activeScore: number
	activeLevel: number
	bestScore: number
	bestLevel: number
	onContinue: () => void
	onNewGame: () => void
	onHowToPlay: () => void
	onSettings: () => void
}

export function HomeScreen (props: HomeScreenProps) {
	const {
		hasActiveGame,
		activeScore,
		activeLevel,
		bestScore,
		bestLevel,
		onContinue,
		onNewGame,
		onHowToPlay,
		onSettings,
	} = props
	const insets = useSafeAreaInsets()
	const { t } = useTranslation()

	return (
		<View
			style={[
				styles.root,
				{
					paddingTop: insets.top + 12,
					paddingBottom: Math.max(insets.bottom, 8),
				},
			]}
		>
			<View style={styles.body}>
				<Text style={styles.brand}>{t('brand.name')}</Text>
				<Text style={styles.tagline}>{t('brand.tagline')}</Text>

				<View style={styles.stats}>
					<Text style={styles.stat}>
						{t('home.bestScore', { score: bestScore })}
					</Text>
					<Text style={styles.stat}>
						{t('home.bestLevel', { level: bestLevel })}
					</Text>
				</View>

				{hasActiveGame ? (
					<Pressable
						style={styles.primary}
						onPress={onContinue}
						accessibilityRole="button"
						accessibilityLabel={t('home.continueA11y', {
							level: activeLevel,
							score: activeScore,
						})}
					>
						<Text style={styles.primaryText}>
							{t('home.continue')}
						</Text>
						<Text style={styles.primarySub}>
							{t('home.continueSub', {
								level: activeLevel,
								score: activeScore,
							})}
						</Text>
					</Pressable>
				) : null}

				<Pressable
					style={hasActiveGame ? styles.secondary : styles.primary}
					onPress={onNewGame}
					accessibilityRole="button"
					accessibilityLabel={t('home.newGame')}
				>
					<Text
						style={
							hasActiveGame
								? styles.secondaryText
								: styles.primaryText
						}
					>
						{t('home.newGame')}
					</Text>
				</Pressable>

				<Pressable
					style={styles.link}
					onPress={onHowToPlay}
					accessibilityRole="button"
					accessibilityLabel={t('home.howToPlay')}
				>
					<Text style={styles.linkText}>{t('home.howToPlay')}</Text>
				</Pressable>

				<Pressable
					style={styles.link}
					onPress={onSettings}
					accessibilityRole="button"
					accessibilityLabel={t('home.settings')}
				>
					<Text style={styles.linkText}>{t('home.settings')}</Text>
				</Pressable>
			</View>

			<BannerSlot placement="homeBanner" />
		</View>
	)
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: COLOR_APP_BACKGROUND,
		paddingHorizontal: 24,
	},
	body: {
		flex: 1,
		justifyContent: 'center',
	},
	brand: {
		fontSize: 40,
		fontWeight: '900',
		color: COLOR_TEXT,
		textAlign: 'center',
		letterSpacing: 0.5,
	},
	tagline: {
		marginTop: 6,
		fontSize: 15,
		color: COLOR_TEXT_MUTED,
		textAlign: 'center',
		fontWeight: '600',
		marginBottom: 28,
	},
	stats: {
		alignItems: 'center',
		marginBottom: 28,
		gap: 4,
	},
	stat: {
		fontSize: 15,
		color: COLOR_TEXT_SECONDARY,
		fontWeight: '600',
	},
	primary: {
		backgroundColor: COLOR_ACCENT,
		borderRadius: 14,
		paddingVertical: 16,
		paddingHorizontal: 18,
		alignItems: 'center',
		marginBottom: 12,
	},
	primaryText: {
		color: COLOR_BUTTON_PRIMARY_TEXT,
		fontSize: 18,
		fontWeight: '800',
	},
	primarySub: {
		marginTop: 4,
		color: COLOR_BUTTON_PRIMARY_SUB,
		fontSize: 13,
		fontWeight: '600',
	},
	secondary: {
		backgroundColor: COLOR_BUTTON_SECONDARY,
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: 'center',
		marginBottom: 12,
	},
	secondaryText: {
		color: COLOR_TEXT,
		fontSize: 17,
		fontWeight: '700',
	},
	link: {
		paddingVertical: 12,
		alignItems: 'center',
	},
	linkText: {
		color: COLOR_ACCENT,
		fontSize: 16,
		fontWeight: '700',
	},
})
