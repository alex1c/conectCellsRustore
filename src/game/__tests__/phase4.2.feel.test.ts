/**
 * Phase 4.2 — sound / haptic / settings polish (no RN speaker/vibrator).
 */

/* eslint-disable import/first -- jest.mock factories must precede imports */

const mockStorage = new Map<string, string>()

jest.mock('@react-native-async-storage/async-storage', () => ({
	__esModule: true,
	default: {
		getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
		setItem: jest.fn(async (key: string, value: string) => {
			mockStorage.set(key, value)
		}),
		removeItem: jest.fn(async (key: string) => {
			mockStorage.delete(key)
		}),
		clear: jest.fn(async () => {
			mockStorage.clear()
		}),
	},
}))

jest.mock('expo-audio', () => ({
	createAudioPlayer: jest.fn(() => ({
		volume: 1,
		seekTo: jest.fn(),
		play: jest.fn(),
		pause: jest.fn(),
		release: jest.fn(),
	})),
	setAudioModeAsync: jest.fn(async () => undefined),
}))

jest.mock('expo-haptics', () => ({
	selectionAsync: jest.fn(async () => undefined),
	impactAsync: jest.fn(async () => undefined),
	notificationAsync: jest.fn(async () => undefined),
	ImpactFeedbackStyle: { Soft: 'Soft', Medium: 'Medium', Heavy: 'Heavy' },
	NotificationFeedbackType: {
		Success: 'Success',
		Warning: 'Warning',
		Error: 'Error',
	},
}))

import AsyncStorage from '@react-native-async-storage/async-storage'

import {
	SETTINGS_DEFAULTS,
	SETTINGS_LABELS,
	STORAGE_KEY_HAPTIC_ENABLED,
	STORAGE_KEY_SOUND_ENABLED,
	parseBoolSetting,
} from '../../storage/settings'
import {
	loadHapticEnabled,
	loadSoundEnabled,
	saveHapticEnabled,
	saveSoundEnabled,
} from '../../storage/preferences'
import {
	isHapticEnabled,
	setHapticEnabled,
	hapticSelection,
	hapticMove,
} from '../../ui/feel/haptics'
import {
	isSoundEnabled,
	playMergeSound,
	playSound,
	resolveMergeSoundId,
	setSoundEnabled,
} from '../../ui/feel/sound'
import { COLOR_SURFACE, COLOR_BOARD_PLANE, COLOR_APP_BACKGROUND } from '../../ui/theme/colors'
import { getHexCellVisual } from '../../ui/theme/cellVisuals'

describe('Phase 4.2 settings labels + defaults', () => {
	it('uses Звуки / Вибрация and defaults ON', () => {
		expect(SETTINGS_LABELS.sound).toBe('Звуки')
		expect(SETTINGS_LABELS.haptic).toBe('Вибрация')
		expect(SETTINGS_DEFAULTS.soundEnabled).toBe(true)
		expect(SETTINGS_DEFAULTS.hapticEnabled).toBe(true)
		expect(parseBoolSetting(null, true)).toBe(true)
		expect(parseBoolSetting('false', true)).toBe(false)
	})
})

describe('Phase 4.2 preference persistence', () => {
	beforeEach(async () => {
		mockStorage.clear()
		await AsyncStorage.clear()
	})

	it('persists sound enabled flag', async () => {
		expect(await loadSoundEnabled()).toBe(true)
		await saveSoundEnabled(false)
		expect(await AsyncStorage.getItem(STORAGE_KEY_SOUND_ENABLED)).toBe(
			'false',
		)
		expect(await loadSoundEnabled()).toBe(false)
		await saveSoundEnabled(true)
		expect(await loadSoundEnabled()).toBe(true)
	})

	it('persists haptic enabled flag', async () => {
		expect(await loadHapticEnabled()).toBe(true)
		await saveHapticEnabled(false)
		expect(await AsyncStorage.getItem(STORAGE_KEY_HAPTIC_ENABLED)).toBe(
			'false',
		)
		expect(await loadHapticEnabled()).toBe(false)
		await saveHapticEnabled(true)
		expect(await loadHapticEnabled()).toBe(true)
	})
})

describe('Phase 4.2 sound service helpers', () => {
	afterEach(() => {
		setSoundEnabled(true)
	})

	it('resolves cascade / groupSize merge sound ids', () => {
		expect(resolveMergeSoundId(1, 4)).toBe('merge')
		expect(resolveMergeSoundId(1, 5)).toBe('merge2')
		expect(resolveMergeSoundId(2, 4)).toBe('merge2')
		expect(resolveMergeSoundId(3, 4)).toBe('merge3')
		expect(resolveMergeSoundId(4, 8)).toBe('merge3')
	})

	it('keeps terminal as a dedicated cue id', () => {
		// Terminal clear uses playTerminal() → 'terminal', not merge escalate.
		expect(resolveMergeSoundId(3, 8)).toBe('merge3')
		expect(resolveMergeSoundId(1, 4)).not.toBe('terminal')
	})

	it('no-ops play when sound disabled', () => {
		setSoundEnabled(false)
		expect(isSoundEnabled()).toBe(false)
		expect(() => playSound('select')).not.toThrow()
		expect(() => playMergeSound(2, 5)).not.toThrow()
		expect(() => playSound('terminal')).not.toThrow()
	})
})

describe('Phase 4.2 haptic service helpers', () => {
	afterEach(() => {
		setHapticEnabled(true)
	})

	it('no-ops when haptic disabled', () => {
		setHapticEnabled(false)
		expect(isHapticEnabled()).toBe(false)
		expect(() => hapticSelection()).not.toThrow()
		expect(() => hapticMove()).not.toThrow()
	})

	it('keeps move haptic as intentional no-op when enabled', () => {
		setHapticEnabled(true)
		expect(() => hapticMove()).not.toThrow()
	})
})

describe('Phase 4.2 / 4.3 visual tokens', () => {
	it('uses dark-only surface tokens and defined empty cells', () => {
		expect(COLOR_APP_BACKGROUND.toLowerCase()).toBe('#101826')
		expect(COLOR_SURFACE.toLowerCase()).not.toBe('#eef3f8')
		expect(COLOR_SURFACE.toLowerCase()).not.toBe('#ffffff')
		expect(COLOR_SURFACE.toLowerCase()).not.toBe('#d8e0eb')
		expect(COLOR_BOARD_PLANE.length).toBeGreaterThan(0)
		const empty = getHexCellVisual(null)
		expect(empty.fill.toLowerCase()).not.toBe('#edf1f7')
		expect(empty.fill.toLowerCase()).not.toBe('#d5dde8')
		expect(empty.stroke.toLowerCase()).not.toBe('#c5d0e0')
	})
})
