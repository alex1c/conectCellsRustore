/**
 * Short first-run / help onboarding (4 steps). Visual diagrams, not a playable tutorial.
 * Orphan relative to AppRoot (interactive TutorialScreen is the live path).
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { useTranslation } from '../../localization/useTranslation'
import {
	COLOR_ACCENT,
	COLOR_BUTTON_PRIMARY_TEXT,
	COLOR_DIVIDER,
	COLOR_MODAL_SCRIM,
	COLOR_SURFACE,
	COLOR_SURFACE_ELEVATED,
	COLOR_TEXT,
	COLOR_TEXT_MUTED,
	COLOR_TEXT_SECONDARY,
} from '../theme/colors'

export interface OnboardingModalProps {
	visible: boolean
	step: number
	onNext: () => void
	onSkip: () => void
	onFinish: () => void
}

const STEP_DEFS = [
	{
		id: 'move',
		titleKey: 'onboarding.move.title',
		lineKeys: [
			'onboarding.move.line1',
			'onboarding.move.line2',
			'onboarding.move.line3',
		],
		diagram: '● → ○',
	},
	{
		id: 'merge',
		titleKey: 'onboarding.merge.title',
		lineKeys: [
			'onboarding.merge.line1',
			'onboarding.merge.line2',
			'onboarding.merge.line3',
		],
		diagram: '1 1 1 1 → 4',
	},
	{
		id: 'spawn',
		titleKey: 'onboarding.spawn.title',
		lineKeys: ['onboarding.spawn.line1', 'onboarding.spawn.line2'],
		diagramKey: 'onboarding.spawn.diagram',
	},
	{
		id: 'levels',
		titleKey: 'onboarding.levels.title',
		lineKeys: ['onboarding.levels.line1', 'onboarding.levels.line2'],
		diagramKey: 'onboarding.levels.diagram',
	},
] as const

export const ONBOARDING_STEP_COUNT = STEP_DEFS.length

export function OnboardingModal (props: OnboardingModalProps) {
	const { visible, step, onNext, onSkip, onFinish } = props
	const { t } = useTranslation()
	const safeStep = Math.min(Math.max(0, step), STEP_DEFS.length - 1)
	const current = STEP_DEFS[safeStep]!
	const isLast = safeStep >= STEP_DEFS.length - 1
	const diagram =
		'diagram' in current
			? current.diagram
			: t(current.diagramKey)

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.backdrop}>
				<View style={styles.card}>
					<Text style={styles.kicker}>
						{t('onboarding.kicker', {
							name: t('brand.name'),
							step: safeStep + 1,
							total: STEP_DEFS.length,
						})}
					</Text>
					<Text style={styles.title}>{t(current.titleKey)}</Text>
					<View style={styles.diagramBox}>
						<Text style={styles.diagram}>{diagram}</Text>
					</View>
					{current.lineKeys.map((lineKey) => (
						<Text key={lineKey} style={styles.line}>
							{t(lineKey)}
						</Text>
					))}
					<Pressable
						style={styles.primary}
						onPress={isLast ? onFinish : onNext}
					>
						<Text style={styles.primaryText}>
							{isLast ? t('common.play') : t('common.next')}
						</Text>
					</Pressable>
					{!isLast ? (
						<Pressable style={styles.secondary} onPress={onSkip}>
							<Text style={styles.secondaryText}>
								{t('common.skip')}
							</Text>
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
		backgroundColor: COLOR_MODAL_SCRIM,
		justifyContent: 'center',
		padding: 24,
	},
	card: {
		backgroundColor: COLOR_SURFACE_ELEVATED,
		borderRadius: 18,
		padding: 22,
		borderWidth: 1,
		borderColor: COLOR_DIVIDER,
	},
	kicker: {
		fontSize: 12,
		fontWeight: '700',
		color: COLOR_TEXT_MUTED,
		textTransform: 'uppercase',
		letterSpacing: 0.6,
		marginBottom: 6,
	},
	title: {
		fontSize: 24,
		fontWeight: '800',
		color: COLOR_TEXT,
		marginBottom: 14,
	},
	diagramBox: {
		backgroundColor: COLOR_SURFACE,
		borderRadius: 12,
		paddingVertical: 16,
		paddingHorizontal: 12,
		marginBottom: 14,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: COLOR_DIVIDER,
	},
	diagram: {
		fontSize: 18,
		fontWeight: '800',
		color: COLOR_ACCENT,
		textAlign: 'center',
	},
	line: {
		fontSize: 15,
		lineHeight: 22,
		color: COLOR_TEXT_SECONDARY,
		marginBottom: 8,
	},
	primary: {
		marginTop: 14,
		backgroundColor: COLOR_ACCENT,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	primaryText: {
		color: COLOR_BUTTON_PRIMARY_TEXT,
		fontWeight: '700',
		fontSize: 16,
	},
	secondary: {
		marginTop: 10,
		paddingVertical: 12,
		alignItems: 'center',
	},
	secondaryText: {
		color: COLOR_TEXT_MUTED,
		fontWeight: '600',
	},
})
