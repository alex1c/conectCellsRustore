/**
 * AsyncStorage wrappers for sound / haptic / onboarding preferences.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

import {
	SETTINGS_DEFAULTS,
	STORAGE_KEY_HAPTIC_ENABLED,
	STORAGE_KEY_ONBOARDING_DONE,
	STORAGE_KEY_SOUND_ENABLED,
	parseBoolSetting,
} from './settings'

export {
	SETTINGS_DEFAULTS,
	STORAGE_KEY_HAPTIC_ENABLED,
	STORAGE_KEY_ONBOARDING_DONE,
	STORAGE_KEY_SOUND_ENABLED,
	parseBoolSetting,
} from './settings'

export async function loadSoundEnabled (): Promise<boolean> {
	try {
		const raw = await AsyncStorage.getItem(STORAGE_KEY_SOUND_ENABLED)
		return parseBoolSetting(raw, SETTINGS_DEFAULTS.soundEnabled)
	} catch {
		return SETTINGS_DEFAULTS.soundEnabled
	}
}

export async function saveSoundEnabled (value: boolean): Promise<void> {
	await AsyncStorage.setItem(STORAGE_KEY_SOUND_ENABLED, String(value))
}

export async function loadHapticEnabled (): Promise<boolean> {
	try {
		const raw = await AsyncStorage.getItem(STORAGE_KEY_HAPTIC_ENABLED)
		return parseBoolSetting(raw, SETTINGS_DEFAULTS.hapticEnabled)
	} catch {
		return SETTINGS_DEFAULTS.hapticEnabled
	}
}

export async function saveHapticEnabled (value: boolean): Promise<void> {
	await AsyncStorage.setItem(STORAGE_KEY_HAPTIC_ENABLED, String(value))
}

export async function loadOnboardingDone (): Promise<boolean> {
	try {
		const raw = await AsyncStorage.getItem(STORAGE_KEY_ONBOARDING_DONE)
		return parseBoolSetting(raw, SETTINGS_DEFAULTS.onboardingDone)
	} catch {
		return SETTINGS_DEFAULTS.onboardingDone
	}
}

export async function saveOnboardingDone (value: boolean): Promise<void> {
	await AsyncStorage.setItem(STORAGE_KEY_ONBOARDING_DONE, String(value))
}
