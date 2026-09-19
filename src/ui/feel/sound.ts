/**
 * Gameplay sound effects — original short tones via expo-audio.
 * Soft-fails when native module is missing or sound is disabled.
 */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'

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
}

let enabled = true
let ready = false
const players = new Map<SoundId, AudioPlayer>()

/** Reflect persisted Sound preference (default ON). */
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
			player.volume = 0.55
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
		player.seekTo(0)
		player.play()
	} catch {
		// Never block gameplay on audio errors.
	}
}

/** Cascade merge pitch escalation (1 → base, 2 → merge2, 3+ → merge3). */
export function playMergeSound (cascadeLevel: number): void {
	if (cascadeLevel >= 3) {
		playSound('merge3')
	} else if (cascadeLevel >= 2) {
		playSound('merge2')
	} else {
		playSound('merge')
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
