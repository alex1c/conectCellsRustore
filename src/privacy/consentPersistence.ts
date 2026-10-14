/**
 * Persist analytics / ads purpose choices (AsyncStorage).
 * Write failures must not be treated as success by callers.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

export const STORAGE_KEY_PRIVACY_CONSENT = 'connectcells.privacyConsent.v1'

export type PurposeDecision = 'granted' | 'denied'

export type ConsentStorageStatus =
	| 'ok'
	| 'unavailable'
	| 'corrupt'
	| 'untrusted'

export type PersistedPrivacyConsent = {
	analytics: PurposeDecision | null
	ads: PurposeDecision | null
	updatedAtIso: string | null
	storageStatus: ConsentStorageStatus
}

const UNDECIDED: PersistedPrivacyConsent = {
	analytics: null,
	ads: null,
	updatedAtIso: null,
	storageStatus: 'ok',
}

function parsePurposes (raw: unknown): PersistedPrivacyConsent | null {
	if (!raw || typeof raw !== 'object') {
		return null
	}
	const obj = raw as Record<string, unknown>
	const analytics =
		obj.analytics === 'granted' || obj.analytics === 'denied'
			? obj.analytics
			: null
	const ads =
		obj.ads === 'granted' || obj.ads === 'denied' ? obj.ads : null
	if (
		obj.analytics !== undefined &&
		obj.analytics !== null &&
		analytics === null
	) {
		return null
	}
	if (obj.ads !== undefined && obj.ads !== null && ads === null) {
		return null
	}
	return {
		analytics,
		ads,
		updatedAtIso:
			typeof obj.updatedAtIso === 'string' ? obj.updatedAtIso : null,
		storageStatus: 'ok',
	}
}

/** Reads saved purpose choices. Failures → untrusted / unavailable. */
export async function readPersistedPrivacyConsent (): Promise<PersistedPrivacyConsent> {
	try {
		const json = await AsyncStorage.getItem(STORAGE_KEY_PRIVACY_CONSENT)
		if (json === null) {
			return { ...UNDECIDED }
		}
		try {
			const parsed = parsePurposes(JSON.parse(json))
			if (!parsed || parsed.analytics === null || parsed.ads === null) {
				return { ...UNDECIDED, storageStatus: 'corrupt' }
			}
			return parsed
		} catch {
			return { ...UNDECIDED, storageStatus: 'corrupt' }
		}
	} catch {
		return { ...UNDECIDED, storageStatus: 'untrusted' }
	}
}

export type WritePrivacyConsentInput = {
	analytics: PurposeDecision
	ads: PurposeDecision
}

/**
 * Persists both purposes. Throws on AsyncStorage write failure so UI can Retry.
 */
export async function writePersistedPrivacyConsent (
	input: WritePrivacyConsentInput,
): Promise<PersistedPrivacyConsent> {
	const updatedAtIso = new Date().toISOString()
	const next: PersistedPrivacyConsent = {
		analytics: input.analytics,
		ads: input.ads,
		updatedAtIso,
		storageStatus: 'ok',
	}
	const payload = JSON.stringify({
		analytics: next.analytics,
		ads: next.ads,
		updatedAtIso,
	})
	await AsyncStorage.setItem(STORAGE_KEY_PRIVACY_CONSENT, payload)
	return next
}

/** Test helper — clears consent storage. */
export async function clearPersistedPrivacyConsentForTests (): Promise<void> {
	await AsyncStorage.removeItem(STORAGE_KEY_PRIVACY_CONSENT)
}
