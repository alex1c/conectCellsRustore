/**
 * Local preference persistence: sound, haptic, onboarding seen.
 */

export const STORAGE_KEY_SOUND_ENABLED = 'connectcells.settings.sound.v1'
export const STORAGE_KEY_HAPTIC_ENABLED = 'connectcells.settings.haptic.v1'
export const STORAGE_KEY_ONBOARDING_DONE = 'connectcells.onboarding.done.v1'

export const SETTINGS_DEFAULTS = {
	soundEnabled: true,
	hapticEnabled: true,
	onboardingDone: false,
} as const

/** Parse a stored boolean preference; invalid → default. */
export function parseBoolSetting (
	raw: unknown,
	defaultValue: boolean,
): boolean {
	if (typeof raw === 'boolean') {
		return raw
	}
	if (raw === 'true' || raw === '1') {
		return true
	}
	if (raw === 'false' || raw === '0') {
		return false
	}
	return defaultValue
}
