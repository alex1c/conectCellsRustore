/**
 * Short first-run / help onboarding (4 steps). Visual diagrams, not a playable tutorial.
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

export interface OnboardingModalProps {
	visible: boolean
	step: number
	onNext: () => void
	onSkip: () => void
	onFinish: () => void
}

const STEPS = [
	{
		title: 'Ход',
		lines: [
			'Выберите клетку.',
			'Нажмите на свободное место, чтобы переместить её.',
			'До клетки должен быть свободный путь.',
		],
		diagram: '● → ○',
	},
	{
		title: 'Объединение',
		lines: [
			'Соедините 4 или больше одинаковых клеток.',
			'Они превратятся в одну более ценную.',
			'1+1+1+1 → 4    ·    2+2+2+2 → 8',
		],
		diagram: '1 1 1 1 → 4',
	},
	{
		title: 'Новые клетки',
		lines: [
			'После хода на поле появляются новые клетки.',
			'Большие объединения помогают сдерживать заполнение поля.',
		],
		diagram: '★ merge → меньше новых',
	},
	{
		title: 'Уровни',
		lines: [
			'Набирайте очки и повышайте уровень.',
			'С каждым уровнем поле заполняется быстрее.',
		],
		diagram: 'Ур. 1 → Ур. 2 → …',
	},
] as const

export const ONBOARDING_STEP_COUNT = STEPS.length

export function OnboardingModal (props: OnboardingModalProps) {
	const { visible, step, onNext, onSkip, onFinish } = props
	const safeStep = Math.min(Math.max(0, step), STEPS.length - 1)
	const current = STEPS[safeStep]!
	const isLast = safeStep >= STEPS.length - 1

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.backdrop}>
				<View style={styles.card}>
					<Text style={styles.kicker}>
						Как играть · {safeStep + 1}/{STEPS.length}
					</Text>
					<Text style={styles.title}>{current.title}</Text>
					<View style={styles.diagramBox}>
						<Text style={styles.diagram}>{current.diagram}</Text>
					</View>
					{current.lines.map((line) => (
						<Text key={line} style={styles.line}>
							{line}
						</Text>
					))}
					<Pressable
						style={styles.primary}
						onPress={isLast ? onFinish : onNext}
					>
						<Text style={styles.primaryText}>
							{isLast ? 'Играть' : 'Далее'}
						</Text>
					</Pressable>
					{!isLast ? (
						<Pressable style={styles.secondary} onPress={onSkip}>
							<Text style={styles.secondaryText}>Пропустить</Text>
						</Pressable>
					) : null}
				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(15, 23, 42, 0.55)',
		justifyContent: 'center',
		padding: 24,
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 18,
		padding: 22,
	},
	kicker: {
		fontSize: 12,
		fontWeight: '700',
		color: '#64748b',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
		marginBottom: 6,
	},
	title: {
		fontSize: 24,
		fontWeight: '800',
		color: '#0f172a',
		marginBottom: 14,
	},
	diagramBox: {
		backgroundColor: '#eef4ff',
		borderRadius: 12,
		paddingVertical: 16,
		paddingHorizontal: 12,
		marginBottom: 14,
		alignItems: 'center',
	},
	diagram: {
		fontSize: 18,
		fontWeight: '800',
		color: '#1d4ed8',
	},
	line: {
		fontSize: 15,
		lineHeight: 22,
		color: '#334155',
		marginBottom: 8,
	},
	primary: {
		marginTop: 14,
		backgroundColor: '#1d4ed8',
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	primaryText: {
		color: '#ffffff',
		fontWeight: '700',
		fontSize: 16,
	},
	secondary: {
		marginTop: 10,
		paddingVertical: 12,
		alignItems: 'center',
	},
	secondaryText: {
		color: '#64748b',
		fontWeight: '600',
	},
})
