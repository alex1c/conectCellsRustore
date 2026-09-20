/**
 * Gameplay sound effects — original short tones via expo-audio.
 * Fire-and-forget only: never await from the gameplay hot path.
 * Soft-fails when native module is missing or sound is disabled.
 * No background music — SFX only (Settings label: «Звуки»).
 */

import {
	createAudioPlayer,
	setAudioModeAsync,
	type AudioPlayer,
} from 'expo-audio'

export type SoundId =
	| 'select'
	| 'move'
	| 'merge'
	| 'merge2'
	| 'merge3'
	| 'spawn'
	| 'blocked'
	| 'levelup'
	| 'gameover'
	| 'terminal'

const SOURCES: Record<SoundId, number> = {
	select: require('../../../assets/sounds/select.wav'),
	move: require('../../../assets/sounds/move.wav'),
	merge: require('../../../assets/sounds/merge.wav'),
	merge2: require('../../../assets/sounds/merge2.wav'),
	merge3: require('../../../assets/sounds/merge3.wav'),
	spawn: require('../../../assets/sounds/spawn.wav'),
	blocked: require('../../../assets/sounds/blocked.wav'),
	levelup: require('../../../assets/sounds/levelup.wav'),
	gameover: require('../../../assets/sounds/gameover.wav'),
	terminal: require('../../../assets/sounds/terminal.wav'),
}

/** Per-cue volumes — select/move stay quiet for long sessions. */
const VOLUME: Record<SoundId, number> = {
	select: 0.32,
	move: 0.28,
	spawn: 0.4,
	blocked: 0.45,
	merge: 0.55,
	merge2: 0.6,
	merge3: 0.65,
	terminal: 0.72,
	levelup: 0.55,
	gameover: 0.5,
}

let enabled = true
let ready = false
const players = new Map<SoundId, AudioPlayer>()

/** Reflect persisted Sounds preference (default ON). */
export function setSoundEnabled (value: boolean): void {
	enabled = value
}

export function isSoundEnabled (): boolean {
	return enabled
}

/** Preload players once; safe to call repeatedly. */
export async function initSounds (): Promise<void> {
	if (ready) {
		return
	}
	try {
		await setAudioModeAsync({
			playsInSilentMode: true,
			interruptionMode: 'mixWithOthers',
			shouldPlayInBackground: false,
			shouldRouteThroughEarpiece: false,
			allowsRecording: false,
		})
		for (const id of Object.keys(SOURCES) as SoundId[]) {
			const player = createAudioPlayer(SOURCES[id], {
				updateInterval: 500,
				downloadFirst: false,
			})
			player.volume = VOLUME[id]
			players.set(id, player)
		}
		ready = true
	} catch {
		// Existing / older native clients without expo-audio stay silent.
		ready = false
	}
}

/** Play a short SFX; no-ops when disabled or unavailable. */
export function playSound (id: SoundId): void {
	if (!enabled || !ready) {
		return
	}
	try {
		const player = players.get(id)
		if (!player) {
			return
		}
		player.volume = VOLUME[id]
		player.seekTo(0)
		player.play()
	} catch {
		// Never block gameplay on audio errors.
	}
}

export function playSelect (): void {
	playSound('select')
}

export function playMove (): void {
	playSound('move')
}

export function playBlocked (): void {
	playSound('blocked')
}

export function playSpawn (): void {
	playSound('spawn')
}

export function playLevelUp (): void {
	playSound('levelup')
}

export function playGameOver (): void {
	playSound('gameover')
}

export function playTerminal (): void {
	playSound('terminal')
}

/**
 * Cascade / merge pitch escalate.
 * cascade 1 + groupSize≥5 uses a slightly richer tone (merge2).
 */
export function resolveMergeSoundId (
	cascadeLevel: number,
	groupSize = 4,
): SoundId {
	if (cascadeLevel >= 3) {
		return 'merge3'
	}
	if (cascadeLevel >= 2) {
		return 'merge2'
	}
	if (groupSize >= 5) {
		return 'merge2'
	}
	return 'merge'
}

export function playMergeSound (
	cascadeLevel: number,
	groupSize = 4,
): void {
	playSound(resolveMergeSoundId(cascadeLevel, groupSize))
}

/** Alias used by call sites that prefer explicit naming. */
export function playMerge (cascadeLevel: number, groupSize = 4): void {
	playMergeSound(cascadeLevel, groupSize)
}

/**
 * Stop any in-flight SFX (app background / ad open).
 * Does not unload players — resume stays instant.
 */
export function pauseGameplayAudio (): void {
	for (const player of players.values()) {
		try {
			player.pause()
		} catch {
			// ignore
		}
	}
}

/** Release native players (tests / teardown). */
export function releaseSounds (): void {
	for (const player of players.values()) {
		try {
			player.release()
		} catch {
			// ignore
		}
	}
	players.clear()
	ready = false
}
