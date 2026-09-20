/**
 * Pointy-top hex cell with selection / pulse / spawn / shrink feedback.
 * Animated.Values are per-position (stable React key row:col). Every transient
 * animation MUST restore canonical scale/opacity on end or interrupt — otherwise
 * empty/occupied cells stay permanently shrunken after merge/spawn.
 * Uses timing/spring only — never Animated.loop (Hermes-fragile).
 * Memoized so traveler / unrelated board updates do not re-render idle cells.
 */

import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'

import { TIMING_SELECTION_MS, TIMING_SPAWN_MS } from '../feel/timings'
import { getHexCellVisual, hexValueFontSize } from '../theme/cellVisuals'
import { COLOR_SELECTION_RING } from '../theme/colors'

export interface HexCellViewProps {
	value: number | null
	size: number
	row: number
	col: number
	selected: boolean
	pulse: boolean
	/** Extra-strong pop for large merges / cascade. */
	pulseStrong?: boolean
	spawn: boolean
	/** Merge converge: shrink absorbed cells. */
	shrinking?: boolean
	/** Light shake when path is blocked while selected. */
	shake?: boolean
	/** Origin hidden while native path traveler is in flight. */
	hiddenByTravel?: boolean
	disabled: boolean
	/** Stable parent callback — identity must not change per board render. */
	onCellPress: (row: number, col: number) => void
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

function hexCellPropsEqual (
	prev: HexCellViewProps,
	next: HexCellViewProps,
): boolean {
	return (
		prev.value === next.value &&
		prev.size === next.size &&
		prev.row === next.row &&
		prev.col === next.col &&
		prev.selected === next.selected &&
		prev.pulse === next.pulse &&
		prev.pulseStrong === next.pulseStrong &&
		prev.spawn === next.spawn &&
		prev.shrinking === next.shrinking &&
		prev.shake === next.shake &&
		prev.hiddenByTravel === next.hiddenByTravel &&
		prev.disabled === next.disabled &&
		prev.hitSlop === next.hitSlop &&
		prev.onCellPress === next.onCellPress
	)
}

function HexCellViewInner (props: HexCellViewProps) {
	const {
		value,
		size,
		row,
		col,
		selected,
		pulse,
		pulseStrong = false,
		spawn,
		shrinking = false,
		shake = false,
		hiddenByTravel = false,
		disabled,
		onCellPress,
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

	const handlePress = useCallback(() => {
		onCellPress(row, col)
	}, [onCellPress, row, col])

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
			snapCanonical(scale, opacity, wobble, selected)
			void finished
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

	/**
	 * Occupied cells: onPressIn for snappier selection feedback.
	 * Empty destinations: onPress so a cancelable finger drag does not
	 * accidentally commit a move on touch-down.
	 */
	const usePressIn = value !== null

	return (
		<Pressable
			disabled={disabled}
			onPress={usePressIn ? undefined : handlePress}
			onPressIn={usePressIn ? handlePress : undefined}
			hitSlop={hitSlop}
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			style={hiddenByTravel ? styles.hidden : undefined}
		>
			<Animated.View
				style={[
					styles.hex,
					{
						width,
						height,
						backgroundColor: visual.fill,
						borderColor: selected ? COLOR_SELECTION_RING : visual.stroke,
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

export const HexCellView = memo(HexCellViewInner, hexCellPropsEqual)

const styles = StyleSheet.create({
	hex: {
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	label: {
		fontWeight: '800',
	},
	hidden: {
		opacity: 0,
	},
})
