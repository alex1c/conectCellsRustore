/**
 * Pointy-top hex cell with selection / pulse / spawn / shrink feedback.
 * Animated.Values are per-position (stable React key row:col). Every transient
 * animation MUST restore canonical scale/opacity on end or interrupt — otherwise
 * empty/occupied cells stay permanently shrunken after merge/spawn.
 * Uses timing/spring only — never Animated.loop (Hermes-fragile).
 */

import { useEffect, useMemo, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'

import { TIMING_SELECTION_MS, TIMING_SPAWN_MS } from '../feel/timings'
import { getHexCellVisual, hexValueFontSize } from '../theme/cellVisuals'

export interface HexCellViewProps {
	value: number | null
	size: number
	selected: boolean
	pulse: boolean
	/** Extra-strong pop for large merges / cascade. */
	pulseStrong?: boolean
	spawn: boolean
	/** Merge converge: shrink absorbed cells. */
	shrinking?: boolean
	/** Light shake when path is blocked while selected. */
	shake?: boolean
	disabled: boolean
	onPress: () => void
	/** Expand pressable hit area slightly beyond the visual hex. */
	hitSlop?: number
}

/** Canonical resting transform for a board cell (selected may stay slightly lifted). */
export function canonicalCellTransform (selected: boolean): {
	scale: number
	opacity: number
	wobble: number
} {
	return {
		scale: selected ? 1.07 : 1,
		opacity: 1,
		wobble: 0,
	}
}

function snapCanonical (
	scale: Animated.Value,
	opacity: Animated.Value,
	wobble: Animated.Value,
	selected: boolean,
): void {
	const next = canonicalCellTransform(selected)
	scale.stopAnimation()
	opacity.stopAnimation()
	wobble.stopAnimation()
	scale.setValue(next.scale)
	opacity.setValue(next.opacity)
	wobble.setValue(next.wobble)
}

export function HexCellView (props: HexCellViewProps) {
	const {
		value,
		size,
		selected,
		pulse,
		pulseStrong = false,
		spawn,
		shrinking = false,
		shake = false,
		disabled,
		onPress,
		hitSlop = 6,
	} = props
	const visual = getHexCellVisual(value)

	const scale = useMemo(() => new Animated.Value(1), [])
	const wobble = useMemo(() => new Animated.Value(0), [])
	const opacity = useMemo(() => new Animated.Value(1), [])
	const activeAnimRef = useRef<Animated.CompositeAnimation | null>(null)

	const stopActive = () => {
		if (activeAnimRef.current) {
			activeAnimRef.current.stop()
			activeAnimRef.current = null
		}
	}

	// Selection lift + one-shot wobble (no infinite loop).
	useEffect(() => {
		if (spawn || shrinking || pulse) {
			return undefined
		}
		stopActive()
		if (!selected) {
			snapCanonical(scale, opacity, wobble, false)
			return undefined
		}
		Animated.spring(scale, {
			toValue: 1.07,
			friction: 6,
			useNativeDriver: true,
		}).start()
		const wobbleOnce = Animated.sequence([
			Animated.timing(wobble, {
				toValue: 1,
				duration: TIMING_SELECTION_MS,
				useNativeDriver: true,
			}),
			Animated.timing(wobble, {
				toValue: -1,
				duration: TIMING_SELECTION_MS,
				useNativeDriver: true,
			}),
			Animated.timing(wobble, {
				toValue: 0,
				duration: TIMING_SELECTION_MS,
				useNativeDriver: true,
			}),
		])
		activeAnimRef.current = wobbleOnce
		wobbleOnce.start(({ finished }) => {
			if (finished) {
				activeAnimRef.current = null
			}
		})
		return () => {
			stopActive()
			wobble.setValue(0)
		}
	}, [selected, spawn, shrinking, pulse, scale, wobble, opacity])

	// Pulse pop — always end at canonical (or selected lift).
	useEffect(() => {
		if (!pulse || spawn || shrinking) {
			return undefined
		}
		stopActive()
		const peak = pulseStrong ? 1.18 : 1.1
		const rest = selected ? 1.07 : 1
		const animation = Animated.sequence([
			Animated.timing(scale, {
				toValue: peak,
				duration: pulseStrong ? 70 : 55,
				useNativeDriver: true,
			}),
			Animated.timing(scale, {
				toValue: rest,
				duration: pulseStrong ? 70 : 55,
				useNativeDriver: true,
			}),
		])
		activeAnimRef.current = animation
		animation.start(({ finished }) => {
			activeAnimRef.current = null
			if (finished) {
				scale.setValue(rest)
			} else {
				snapCanonical(scale, opacity, wobble, selected)
			}
		})
		return () => {
			stopActive()
			snapCanonical(scale, opacity, wobble, selected)
		}
	}, [pulse, pulseStrong, spawn, shrinking, selected, scale, opacity, wobble])

	// Spawn appear — MUST finish at scale=1 / opacity=1 (including interrupt).
	useEffect(() => {
		if (!spawn) {
			return undefined
		}
		stopActive()
		scale.setValue(0.8)
		opacity.setValue(0.4)
		const animation = Animated.parallel([
			Animated.timing(scale, {
				toValue: 1,
				duration: TIMING_SPAWN_MS,
				useNativeDriver: true,
			}),
			Animated.timing(opacity, {
				toValue: 1,
				duration: TIMING_SPAWN_MS,
				useNativeDriver: true,
			}),
		])
		activeAnimRef.current = animation
		animation.start(({ finished }) => {
			activeAnimRef.current = null
			// Always land on canonical — finished or interrupted mid-frame.
			snapCanonical(scale, opacity, wobble, selected)
			if (!finished) {
				// keep snap above
			}
		})
		return () => {
			stopActive()
			snapCanonical(scale, opacity, wobble, selected)
		}
	}, [spawn, selected, scale, opacity, wobble])

	/**
	 * Merge absorb shrink. Critical bug fix: when shrinking ends, scale was left
	 * at ~0.35 forever (empty cells AND later re-occupied cells looked tiny).
	 */
	useEffect(() => {
		if (!shrinking) {
			return undefined
		}
		stopActive()
		const animation = Animated.parallel([
			Animated.timing(scale, {
				toValue: 0.35,
				duration: 90,
				useNativeDriver: true,
			}),
			Animated.timing(opacity, {
				toValue: 0.12,
				duration: 90,
				useNativeDriver: true,
			}),
		])
		activeAnimRef.current = animation
		animation.start(({ finished }) => {
			activeAnimRef.current = null
			if (!finished) {
				snapCanonical(scale, opacity, wobble, selected)
			}
		})
		return () => {
			// Leaving shrink mode (board cell cleared / flags cleared) → canonical.
			stopActive()
			snapCanonical(scale, opacity, wobble, selected)
		}
	}, [shrinking, selected, scale, opacity, wobble])

	// Value identity change while idle: force canonical (covers Undo / fixture).
	useEffect(() => {
		if (spawn || shrinking || pulse) {
			return
		}
		snapCanonical(scale, opacity, wobble, selected)
	}, [value, spawn, shrinking, pulse, selected, scale, opacity, wobble])

	useEffect(() => {
		if (!shake) {
			return undefined
		}
		const animation = Animated.sequence([
			Animated.timing(wobble, {
				toValue: 1.4,
				duration: 40,
				useNativeDriver: true,
			}),
			Animated.timing(wobble, {
				toValue: -1.4,
				duration: 40,
				useNativeDriver: true,
			}),
			Animated.timing(wobble, {
				toValue: 0,
				duration: 40,
				useNativeDriver: true,
			}),
		])
		animation.start()
		return () => {
			animation.stop()
			wobble.setValue(0)
		}
	}, [shake, wobble])

	const rotate = wobble.interpolate({
		inputRange: [-1.5, 1.5],
		outputRange: ['-5deg', '5deg'],
	})

	const width = size
	const height = size * 1.1
	const fontSize =
		value !== null ? hexValueFontSize(value, size) : size * 0.36

	return (
		<Pressable
			disabled={disabled}
			onPress={onPress}
			hitSlop={hitSlop}
			accessibilityRole="button"
		>
			<Animated.View
				style={[
					styles.hex,
					{
						width,
						height,
						backgroundColor: visual.fill,
						borderColor: selected ? '#1d4ed8' : visual.stroke,
						borderWidth: selected ? 3 : value === null ? 1 : 1.5,
						opacity,
						transform: [{ scale }, { rotate }],
					},
				]}
			>
				{value !== null ? (
					<Text
						style={[styles.label, { color: visual.text, fontSize }]}
						numberOfLines={1}
						adjustsFontSizeToFit
					>
						{String(value)}
					</Text>
				) : (
					<View />
				)}
			</Animated.View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	hex: {
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	label: {
		fontWeight: '800',
	},
})
