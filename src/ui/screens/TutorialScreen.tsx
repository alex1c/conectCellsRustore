/**
 * Interactive Hexonica tutorial — ad-free, dark theme, real board/engine.
 */

import { useMemo, useState } from 'react'
import {
	LayoutChangeEvent,
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { HexBoardView } from '../components/HexBoardView'
import {
	COLOR_ACCENT,
	COLOR_APP_BACKGROUND,
	COLOR_BUTTON_PRIMARY_TEXT,
	COLOR_BUTTON_SECONDARY,
	COLOR_DIVIDER,
	COLOR_SURFACE_ELEVATED,
	COLOR_TEXT,
	COLOR_TEXT_MUTED,
	COLOR_TEXT_SECONDARY,
	COLOR_WARNING,
} from '../theme/colors'
import {
	useTutorialController,
} from '../tutorial/useTutorialController'
import type { TutorialSource } from '../tutorial/tutorialSteps'

const H_PAD = 16

export interface TutorialScreenProps {
	source: TutorialSource
	onFinished: () => void
	onSkipped: () => void
}

export function TutorialScreen (props: TutorialScreenProps) {
	const { source, onFinished, onSkipped } = props
	const insets = useSafeAreaInsets()
	const [boardWidth, setBoardWidth] = useState(320)

	const tutorial = useTutorialController({
		source,
		onComplete: onFinished,
		onSkip: onSkipped,
	})

	const handleBoardLayout = (event: LayoutChangeEvent) => {
		const width = event.nativeEvent.layout.width
		if (width > 0) {
			setBoardWidth(Math.floor(width))
		}
	}

	const progressDots = useMemo(() => {
		return Array.from({ length: tutorial.stepCount }, (_, i) => (
			<View
				key={i}
				style={[
					styles.dot,
					i === tutorial.stepIndex ? styles.dotActive : null,
				]}
			/>
		))
	}, [tutorial.stepCount, tutorial.stepIndex])

	const showClose = source === 'help'
	const showSkip = source === 'first_launch'

	return (
		<View
			style={[
				styles.root,
				{
					paddingTop: insets.top + 6,
					paddingBottom: Math.max(insets.bottom, 8),
				},
			]}
		>
			<StatusBar style="light" />

			{/* Stable coach header — fixed min height avoids board jump. */}
			<View style={styles.header}>
				{/*
				 * In Expo Dev Client a Tools FAB sits top-right and can steal
				 * taps from Skip/Close. Keep a DEV-only inset so Skip stays usable.
				 */}
				<View
					style={[
						styles.headerTop,
						typeof __DEV__ !== 'undefined' && __DEV__
							? styles.headerTopDevInset
							: null,
					]}
				>
					{showClose ? (
						<Pressable onPress={onSkipped} hitSlop={12}>
							<Text style={styles.headerAction}>Закрыть</Text>
						</Pressable>
					) : (
						<View style={styles.headerSpacer} />
					)}
					<Text style={styles.progressLabel}>
						{tutorial.step.index} / {tutorial.stepCount}
					</Text>
					{showSkip ? (
						<Pressable onPress={tutorial.handleSkip} hitSlop={12}>
							<Text style={styles.headerAction}>Пропустить</Text>
						</Pressable>
					) : (
						<View style={styles.headerSpacer} />
					)}
				</View>
				<View style={styles.dots}>{progressDots}</View>
				<View style={styles.coachCard}>
					<Text style={styles.coachTitle}>{tutorial.step.title}</Text>
					<Text style={styles.coachBody}>{tutorial.step.body}</Text>
					{tutorial.nudgeKey > 0 && !tutorial.step.coachOnly ? (
						<Text style={styles.nudge}>
							Нажмите на подсвеченную клетку.
						</Text>
					) : null}
				</View>
			</View>

			<View style={styles.boardWrap} onLayout={handleBoardLayout}>
				<HexBoardView
					board={tutorial.displayBoard}
					selected={tutorial.selected}
					pulseKey={tutorial.pulseKey}
					spawnKeys={tutorial.spawnKeys}
					shrinkKeys={tutorial.shrinkKeys}
					hintKeys={tutorial.hintKeys}
					traveler={tutorial.traveler}
					scorePopup={tutorial.scorePopup}
					inputLocked={tutorial.inputLocked}
					boardWidth={boardWidth}
					onCellPress={tutorial.handleCellPress}
					onTravelerComplete={tutorial.onTravelerComplete}
				/>
			</View>

			<View style={styles.footer}>
				{tutorial.step.coachOnly ? (
					<Pressable
						style={styles.primary}
						onPress={tutorial.handleCoachContinue}
					>
						<Text style={styles.primaryText}>
							{tutorial.step.primaryLabel ?? 'Далее'}
						</Text>
					</Pressable>
				) : (
					<View style={styles.footerHint}>
						<Text style={styles.footerHintText}>
							Следуйте подсветке на поле
						</Text>
					</View>
				)}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: COLOR_APP_BACKGROUND,
		paddingHorizontal: H_PAD,
	},
	header: {
		minHeight: 168,
	},
	headerTop: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	headerTopDevInset: {
		paddingRight: 56,
	},
	headerAction: {
		color: COLOR_ACCENT,
		fontWeight: '700',
		fontSize: 15,
		minWidth: 88,
	},
	headerSpacer: {
		minWidth: 88,
	},
	progressLabel: {
		color: COLOR_TEXT_MUTED,
		fontWeight: '700',
		fontSize: 13,
	},
	dots: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 6,
		marginBottom: 10,
	},
	dot: {
		width: 7,
		height: 7,
		borderRadius: 99,
		backgroundColor: COLOR_DIVIDER,
	},
	dotActive: {
		backgroundColor: COLOR_ACCENT,
		width: 16,
	},
	coachCard: {
		backgroundColor: COLOR_SURFACE_ELEVATED,
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: COLOR_DIVIDER,
		minHeight: 96,
	},
	coachTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: COLOR_TEXT,
		marginBottom: 6,
	},
	coachBody: {
		fontSize: 14,
		lineHeight: 20,
		color: COLOR_TEXT_SECONDARY,
		fontWeight: '600',
	},
	nudge: {
		marginTop: 8,
		fontSize: 13,
		fontWeight: '700',
		color: COLOR_WARNING,
	},
	boardWrap: {
		flexGrow: 1,
		justifyContent: 'flex-start',
		alignItems: 'center',
		paddingTop: 8,
	},
	footer: {
		minHeight: 56,
		justifyContent: 'center',
		marginTop: 8,
	},
	primary: {
		backgroundColor: COLOR_ACCENT,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	primaryText: {
		color: COLOR_BUTTON_PRIMARY_TEXT,
		fontWeight: '800',
		fontSize: 16,
	},
	footerHint: {
		backgroundColor: COLOR_BUTTON_SECONDARY,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	footerHintText: {
		color: COLOR_TEXT_MUTED,
		fontWeight: '600',
		fontSize: 14,
	},
})
