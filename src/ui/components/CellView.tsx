/**
 * Single board cell with selection / pulse / spawn feedback.
 */

import { useEffect, useMemo } from 'react'
import {
	Animated,
	Pressable,
	StyleSheet,
	Text,
	ViewStyle,
} from 'react-native'

import { getCellVisual } from '../theme/cellVisuals'

export interface CellViewProps {
	value: number | null
	size: number
	selected: boolean
	legalTarget: boolean
	pulse: boolean
	spawn: boolean
	shake: boolean
	disabled: boolean
	onPress: () => void
}

export function CellView (props: CellViewProps) {
	const {
		value,
		size,
		selected,
		legalTarget,
		pulse,
		spawn,
		shake,
		disabled,
		onPress,
	} = props

	// Stable Animated.Value instances for the lifetime of this cell.
	const scale = useMemo(() => new Animated.Value(1), [])
	const opacity = useMemo(() => new Animated.Value(1), [])
	const translateX = useMemo(() => new Animated.Value(0), [])
	const visual = getCellVisual(value)

	useEffect(() => {
		if (selected) {
			Animated.spring(scale, {
				toValue: 1.05,
				friction: 6,
				useNativeDriver: true,
			}).start()
		} else {
			Animated.spring(scale, {
				toValue: 1,
				friction: 6,
				useNativeDriver: true,
			}).start()
		}
	}, [selected, scale])

	useEffect(() => {
		if (pulse) {
			Animated.sequence([
				Animated.timing(scale, {
					toValue: 1.12,
					duration: 90,
					useNativeDriver: true,
				}),
				Animated.timing(scale, {
					toValue: selected ? 1.05 : 1,
					duration: 90,
					useNativeDriver: true,
				}),
			]).start()
		}
	}, [pulse, scale, selected])

	useEffect(() => {
		if (spawn) {
			opacity.setValue(0.2)
			scale.setValue(0.7)
			Animated.parallel([
				Animated.timing(opacity, {
					toValue: 1,
					duration: 160,
					useNativeDriver: true,
				}),
				Animated.timing(scale, {
					toValue: 1,
					duration: 160,
					useNativeDriver: true,
				}),
			]).start()
		}
	}, [spawn, opacity, scale])

	useEffect(() => {
		if (shake) {
			Animated.sequence([
				Animated.timing(translateX, {
					toValue: -4,
					duration: 40,
					useNativeDriver: true,
				}),
				Animated.timing(translateX, {
					toValue: 4,
					duration: 40,
					useNativeDriver: true,
				}),
				Animated.timing(translateX, {
					toValue: 0,
					duration: 40,
					useNativeDriver: true,
				}),
			]).start()
		}
	}, [shake, translateX])

	const fontSize = value !== null && value >= 10 ? size * 0.32 : size * 0.4

	const selectedStyle: ViewStyle = selected
		? {
				borderWidth: 3,
				borderColor: '#2563eb',
			}
		: {}

	const legalStyle: ViewStyle = legalTarget
		? {
				borderWidth: 2,
				borderColor: '#16a34a',
			}
		: {}

	return (
		<Pressable
			disabled={disabled}
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={
				value === null ? 'Empty cell' : `Cell value ${value}`
			}
		>
			<Animated.View
				style={[
					styles.cell,
					{
						width: size,
						height: size,
						backgroundColor: visual.background,
						borderColor: visual.border,
						opacity,
						transform: [{ scale }, { translateX }],
					},
					selectedStyle,
					legalStyle,
				]}
			>
				<Text
					style={[
						styles.label,
						{ color: visual.text, fontSize },
					]}
					numberOfLines={1}
					adjustsFontSizeToFit
				>
					{value === null ? '' : String(value)}
				</Text>
			</Animated.View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	cell: {
		borderRadius: 10,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	label: {
		fontWeight: '700',
	},
})
