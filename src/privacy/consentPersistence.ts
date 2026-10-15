/**
 * Persist analytics / ads purpose choices (AsyncStorage).
 *
 * Fail-closed deny model (Google Play):
 * - A compact deny ledger is written before the main consent blob whenever
 *   any purpose is denied. On read, ledger denials override stale "granted"
 *   in the main blob (covers "main write failed after revoke").
 * - If even the ledger write fails, we best-effort wipe the main blob so a
 *   cold start cannot silently re-activate SDKs from an old grant (restart
 *   becomes undecided / re-prompt instead of auto-grant).
 * - Re-grant writes the main blob first, then clears ledger entries for
 *   granted purposes. If ledger clear fails, merge stays deny (fail-closed);
 *   the UI Retry path must succeed before gates open.
 *
 * Limits (not an absolute guarantee):
 * - AsyncStorage is a single backend. If setItem and removeItem both fail
 *   (full disk / corrupted store), a prior granted blob may survive process
 *   death. Session gates stay closed; cold start may re-read that grant.
 * - This module does not add a second native store (no new dependencies).
 * - RuStore does not use this gate; reads remain best-effort.
 *
 * Write failures must not be treated as success by callers.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

export const STORAGE_KEY_PRIVACY_CONSENT = 'connectcells.privacyConsent.v1'

/**
 * Compact deny ledger — separate key so a failed main-blob rewrite cannot
 * leave "granted" as the only surviving record after a user revoke.
 */
export const STORAGE_KEY_PRIVACY_DENY_LEDGER =
	'connectcells.privacyConsent.denyLedger.v1'

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

export type DenyLedger = {
	analytics?: 'denied'
	ads?: 'denied'
	updatedAtIso: string
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

function parseDenyLedger (raw: unknown): DenyLedger | null {
	if (!raw || typeof raw !== 'object') {
		return null
	}
	const obj = raw as Record<string, unknown>
	const ledger: DenyLedger = {
		updatedAtIso:
			typeof obj.updatedAtIso === 'string'
				? obj.updatedAtIso
				: new Date(0).toISOString(),
	}
	if (obj.analytics === 'denied') {
		ledger.analytics = 'denied'
	}
	if (obj.ads === 'denied') {
		ledger.ads = 'denied'
	}
	if (!ledger.analytics && !ledger.ads) {
		return null
	}
	return ledger
}

/** Build ledger that records only currently denied purposes. */
export function buildDenyLedger (
	input: WritePrivacyConsentInput,
	updatedAtIso: string,
): DenyLedger | null {
	const ledger: DenyLedger = { updatedAtIso }
	if (input.analytics === 'denied') {
		ledger.analytics = 'denied'
	}
	if (input.ads === 'denied') {
		ledger.ads = 'denied'
	}
	if (!ledger.analytics && !ledger.ads) {
		return null
	}
	return ledger
}

/**
 * Ledger denials win over a stale main "granted" (fail-closed merge).
 */
export function mergeConsentWithDenyLedger (
	main: PersistedPrivacyConsent,
	ledger: DenyLedger | null,
): PersistedPrivacyConsent {
	if (!ledger) {
		return main
	}
	return {
		...main,
		analytics:
			ledger.analytics === 'denied' ? 'denied' : main.analytics,
		ads: ledger.ads === 'denied' ? 'denied' : main.ads,
		updatedAtIso: ledger.updatedAtIso || main.updatedAtIso,
	}
}

async function readDenyLedgerRaw (): Promise<DenyLedger | null> {
	try {
		const json = await AsyncStorage.getItem(STORAGE_KEY_PRIVACY_DENY_LEDGER)
		if (json === null) {
			return null
		}
		try {
			return parseDenyLedger(JSON.parse(json))
		} catch {
			return null
		}
	} catch {
		return null
	}
}

async function writeDenyLedger (ledger: DenyLedger): Promise<void> {
	await AsyncStorage.setItem(
		STORAGE_KEY_PRIVACY_DENY_LEDGER,
		JSON.stringify(ledger),
	)
}

async function clearDenyLedger (): Promise<void> {
	await AsyncStorage.removeItem(STORAGE_KEY_PRIVACY_DENY_LEDGER)
}

/** Best-effort wipe of the main consent blob (stale grants). */
async function wipeMainConsentBlob (): Promise<boolean> {
	try {
		await AsyncStorage.removeItem(STORAGE_KEY_PRIVACY_CONSENT)
		return true
	} catch {
		return false
	}
}

/** Reads saved purpose choices. Ledger denials override stale grants. */
export async function readPersistedPrivacyConsent (): Promise<PersistedPrivacyConsent> {
	let main: PersistedPrivacyConsent = { ...UNDECIDED }
	let readFailed = false

	try {
		const json = await AsyncStorage.getItem(STORAGE_KEY_PRIVACY_CONSENT)
		if (json !== null) {
			try {
				const parsed = parsePurposes(JSON.parse(json))
				if (!parsed || parsed.analytics === null || parsed.ads === null) {
					main = { ...UNDECIDED, storageStatus: 'corrupt' }
				} else {
					main = parsed
				}
			} catch {
				main = { ...UNDECIDED, storageStatus: 'corrupt' }
			}
		}
	} catch {
		readFailed = true
		main = { ...UNDECIDED, storageStatus: 'untrusted' }
	}

	const ledger = await readDenyLedgerRaw()
	const merged = mergeConsentWithDenyLedger(main, ledger)

	// If the only surviving signal is the deny ledger, surface denials even
	// when the main blob is missing/corrupt (fail-closed cold start).
	if (
		ledger &&
		(merged.analytics === 'denied' || merged.ads === 'denied')
	) {
		// Fill undecided counterpart from ledger-only cold start: keep null
		// only when that purpose was never denied and main had no value.
		return {
			analytics: merged.analytics,
			ads: merged.ads,
			updatedAtIso: merged.updatedAtIso ?? ledger.updatedAtIso,
			storageStatus: readFailed ? 'untrusted' : main.storageStatus,
		}
	}

	return merged
}

export type WritePrivacyConsentInput = {
	analytics: PurposeDecision
	ads: PurposeDecision
}

export type WritePrivacyConsentResult = PersistedPrivacyConsent & {
	/** True when deny ledger was persisted (or cleared) as intended. */
	denyLedgerOk: boolean
	/** True when a stale main grant blob was wiped after a deny-path failure. */
	wipedStaleGrant: boolean
}

/**
 * Persists both purposes with fail-closed deny ordering.
 * Throws on unrecoverable AsyncStorage failure so UI can Retry.
 */
export async function writePersistedPrivacyConsent (
	input: WritePrivacyConsentInput,
): Promise<WritePrivacyConsentResult> {
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
	const nextLedger = buildDenyLedger(input, updatedAtIso)
	let denyLedgerOk = false
	let wipedStaleGrant = false

	// --- Deny path: ledger first so cold start cannot revive stale grants. ---
	if (nextLedger) {
		try {
			await writeDenyLedger(nextLedger)
			denyLedgerOk = true
		} catch {
			// Same backend may be unhealthy — wipe main grant blob as fallback.
			wipedStaleGrant = await wipeMainConsentBlob()
			throw new Error('privacy_consent_deny_ledger_failed')
		}
	}

	try {
		await AsyncStorage.setItem(STORAGE_KEY_PRIVACY_CONSENT, payload)
	} catch (error) {
		if (nextLedger) {
			// Ledger already records the revoke — wipe stale main granted blob.
			wipedStaleGrant = await wipeMainConsentBlob()
		}
		throw error instanceof Error
			? error
			: new Error('privacy_consent_persist_failed')
	}

	// --- Grant path: clear ledger entries only after main write succeeded. ---
	if (!nextLedger) {
		try {
			await clearDenyLedger()
			denyLedgerOk = true
		} catch {
			// Main says granted but ledger may still deny — fail-closed on read.
			throw new Error('privacy_consent_deny_ledger_clear_failed')
		}
	} else {
		// Refresh ledger to exactly the current denials (drop re-granted purpose).
		try {
			await writeDenyLedger(nextLedger)
			denyLedgerOk = true
		} catch {
			throw new Error('privacy_consent_deny_ledger_refresh_failed')
		}
	}

	return {
		...next,
		denyLedgerOk,
		wipedStaleGrant,
	}
}

/** Test helper — clears consent + deny ledger storage. */
export async function clearPersistedPrivacyConsentForTests (): Promise<void> {
	await AsyncStorage.removeItem(STORAGE_KEY_PRIVACY_CONSENT)
	await AsyncStorage.removeItem(STORAGE_KEY_PRIVACY_DENY_LEDGER)
}
