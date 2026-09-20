/**
 * Home screen — Continue / New Game / records / How to Play / Settings.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BannerSlot } from '../../ads/BannerSlot'
import { APP_DISPLAY_NAME } from '../../branding'
import {
	COLOR_ACCENT,
	COLOR_ACCENT_SECONDARY,
	COLOR_SURFACE,
	COLOR_TEXT,
	COLOR_TEXT_MUTED,
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

	return (
		<View
			style={[
				styles.root,
				{ paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 8) },
			]}
		>
			<View style={styles.body}>
				<Text style={styles.brand}>{APP_DISPLAY_NAME}</Text>
				<Text style={styles.tagline}>Числовая головоломка</Text>

				<View style={styles.stats}>
					<Text style={styles.stat}>Рекорд: {bestScore}</Text>
					<Text style={styles.stat}>Лучший уровень: {bestLevel}</Text>
				</View>

				{hasActiveGame ? (
					<Pressable style={styles.primary} onPress={onContinue}>
						<Text style={styles.primaryText}>Продолжить</Text>
						<Text style={styles.primarySub}>
							Уровень {activeLevel} · счёт {activeScore}
						</Text>
					</Pressable>
				) : null}

				<Pressable
					style={hasActiveGame ? styles.secondary : styles.primary}
					onPress={onNewGame}
				>
					<Text
						style={
							hasActiveGame ? styles.secondaryText : styles.primaryText
						}
					>
						Новая игра
					</Text>
				</Pressable>

				<Pressable style={styles.link} onPress={onHowToPlay}>
					<Text style={styles.linkText}>Как играть</Text>
				</Pressable>
				<Pressable style={styles.link} onPress={onSettings}>
					<Text style={styles.linkText}>Настройки</Text>
				</Pressable>
			</View>

			{/* Banner above bottom safe area — never covers primary controls. */}
			<BannerSlot placement="homeBanner" />
		</View>
	)
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: COLOR_SURFACE,
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
		color: COLOR_ACCENT_SECONDARY,
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
		color: '#ffffff',
		fontSize: 18,
		fontWeight: '800',
	},
	primarySub: {
		marginTop: 4,
		color: '#bfdbfe',
		fontSize: 13,
		fontWeight: '600',
	},
	secondary: {
		backgroundColor: '#c5d0e0',
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
