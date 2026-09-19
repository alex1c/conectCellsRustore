/**
 * Unified haptic mapping for Phase 3 game feel.
 * Honors the persisted haptic preference; failures never block gameplay.
 */

import * as Haptics from 'expo-haptics'

let enabled = true

/** Reflect persisted Vibration preference (default ON). */
export function setHapticEnabled (value: boolean): void {
	enabled = value
}

export function isHapticEnabled (): boolean {
	return enabled
}

async function run (action: () => Promise<void>): Promise<void> {
	if (!enabled) {
		return
	}
	try {
		await action()
	} catch {
		// Platforms without haptics are fine.
	}
}

/** Select occupied cell. */
export async function hapticSelection (): Promise<void> {
	await run(() => Haptics.selectionAsync())
}

/** Successful short move — very light / optional. */
export async function hapticMove (): Promise<void> {
	await run(() =>
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
	)
}

/** Blocked / illegal path. */
export async function hapticBlocked (): Promise<void> {
	await run(() =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
	)
}

/** Merge of exactly 4. */
export async function hapticMerge4 (): Promise<void> {
	await run(() =>
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
	)
}

/** Merge of 5+. */
export async function hapticMergeLarge (): Promise<void> {
	await run(() =>
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
	)
}

/** Cascade step 2. */
export async function hapticCascade2 (): Promise<void> {
	await run(() =>
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
	)
}

/** Cascade step 3+. */
export async function hapticCascade3 (): Promise<void> {
	await run(() =>
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
	)
}

/** Terminal merge clear — celebratory success + heavy impact. */
export async function hapticTerminalClear (): Promise<void> {
	await run(() =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
	)
	await run(() =>
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
	)
}

/** Level-up success feedback. */
export async function hapticLevelUp (): Promise<void> {
	await run(() =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
	)
}

/** Game over — distinct but not aggressive. */
export async function hapticGameOver (): Promise<void> {
	await run(() =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
	)
}

/** @deprecated Prefer hapticBlocked — kept for older call sites. */
export async function hapticInvalid (): Promise<void> {
	await hapticBlocked()
}

/** @deprecated Prefer hapticMerge4 / hapticMergeLarge. */
export async function hapticMerge (): Promise<void> {
	await hapticMerge4()
}

/** @deprecated Prefer hapticCascade2 / hapticCascade3. */
export async function hapticChain (): Promise<void> {
	await hapticCascade2()
}
