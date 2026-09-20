/**
 * Unified haptic mapping for Hexonica game feel.
 * Fire-and-forget: callers should `void hapticX()` — never await on hot path.
 * Honors persisted «Вибрация» preference; failures never block gameplay.
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

function run (action: () => Promise<void>): void {
	if (!enabled) {
		return
	}
	void action().catch(() => {
		// Platforms without haptics are fine.
	})
}

/** Select occupied cell — very light. */
export function hapticSelection (): void {
	run(() => Haptics.selectionAsync())
}

/**
 * Normal move — intentionally silent on OPPO.
 * Movement already has strong visual feedback; vibration felt noisy.
 */
export function hapticMove (): void {
	// no-op by design (Phase 4.2 OPPO feel)
}

/** Blocked / illegal path. */
export function hapticBlocked (): void {
	run(() =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
	)
}

/** Merge of exactly 4. */
export function hapticMerge4 (): void {
	run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium))
}

/** Merge of 5+. */
export function hapticMergeLarge (): void {
	run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy))
}

/** Cascade step 2. */
export function hapticCascade2 (): void {
	run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium))
}

/** Cascade step 3+. */
export function hapticCascade3 (): void {
	run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy))
}

/** Terminal clear — strongest brief success hit (single cue, no chain). */
export function hapticTerminalClear (): void {
	run(() =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
	)
}

/** Level-up success feedback. */
export function hapticLevelUp (): void {
	run(() =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
	)
}

/** Game over — distinct but not aggressive. */
export function hapticGameOver (): void {
	run(() =>
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
	)
}

/** @deprecated Prefer hapticBlocked. */
export function hapticInvalid (): void {
	hapticBlocked()
}

/** @deprecated Prefer hapticMerge4 / hapticMergeLarge. */
export function hapticMerge (): void {
	hapticMerge4()
}

/** @deprecated Prefer hapticCascade2 / hapticCascade3. */
export function hapticChain (): void {
	hapticCascade2()
}
