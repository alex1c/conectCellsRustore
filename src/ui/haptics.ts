/**
 * Lightweight haptic helpers. Failures are swallowed so gameplay never blocks.
 */

import * as Haptics from 'expo-haptics'

export async function hapticSelection (): Promise<void> {
	try {
		await Haptics.selectionAsync()
	} catch {
		// Platforms without haptics are fine.
	}
}

export async function hapticMerge (): Promise<void> {
	try {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
	} catch {
		// ignore
	}
}

export async function hapticChain (): Promise<void> {
	try {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
	} catch {
		// ignore
	}
}

export async function hapticInvalid (): Promise<void> {
	try {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
	} catch {
		// ignore
	}
}
