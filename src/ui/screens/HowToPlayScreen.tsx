/**
 * How to Play screen — reuses onboarding copy with a bottom banner.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BannerSlot } from '../../ads/BannerSlot'

const SECTIONS = [
	{
		title: 'Ход',
		lines: [
			'Выберите клетку.',
			'Переместите её на пустую клетку по свободному пути.',
		],
	},
	{
		title: 'Объединение',
		lines: [
			'Соединяйте 4 или больше одинаковых клеток.',
			'Они превратятся в одну более ценную.',
		],
	},
	{
		title: 'Большие группы',
		lines: [
			'Большие группы лучше очищают поле и дают больше очков.',
		],
	},
	{
		title: 'Уровни',
		lines: [
			'С ростом счёта уровень повышается.',
			'Сложность растёт постепенно.',
		],
	},
] as const

export interface HowToPlayScreenProps {
	onBack: () => void
}

export function HowToPlayScreen (props: HowToPlayScreenProps) {
	const { onBack } = props
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
				<Text style={styles.title}>Как играть</Text>
				<View style={styles.backSpacer} />
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{SECTIONS.map((section) => (
					<View key={section.title} style={styles.card}>
						<Text style={styles.cardTitle}>{section.title}</Text>
						{section.lines.map((line) => (
							<Text key={line} style={styles.line}>
								{line}
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
		backgroundColor: '#eef3f8',
		paddingHorizontal: 20,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
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
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 16,
		gap: 12,
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 14,
		padding: 16,
	},
	cardTitle: {
		fontSize: 17,
		fontWeight: '800',
		color: '#0f172a',
		marginBottom: 8,
	},
	line: {
		fontSize: 15,
		color: '#334155',
		lineHeight: 22,
		marginBottom: 4,
	},
})
