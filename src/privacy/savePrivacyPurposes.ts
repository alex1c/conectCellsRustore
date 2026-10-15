/**
 * Coordinated privacy purpose save.
 *
 * - Revoke closes runtime gates synchronously before the first await.
 * - Grant opens gates only after a successful persist of the *current* epoch.
 * - Concurrent saves are serialized so a delayed older write cannot land
 *   after a newer decision or re-open gates via stale bootstrap.
 * - Persist failure is fail-closed (revokes stay closed; prior grant is not restored).
 */

import { applyConsentGatesSync } from './applyConsentGates'
import {
	writePersistedPrivacyConsent,
	type PersistedPrivacyConsent,
	type PurposeDecision,
} from './consentPersistence'
import { bootstrapOptionalSdks } from './optionalSdkBootstrap'

/** Monotonic save epoch — stale completions compare against this. */
let consentSaveEpoch = 0

/**
 * Serialize AsyncStorage writes so completion order matches decision order.
 * A delayed older setItem must not overwrite a newer purpose payload.
 */
let writeChain: Promise<void> = Promise.resolve()

export type SavePrivacyPurposesInput = {
	analytics: PurposeDecision
	ads: PurposeDecision
}

export type SavePrivacyPurposesResult =
	| { status: 'applied'; saved: PersistedPrivacyConsent }
	| { status: 'superseded' }
	| { status: 'failed'; error: Error }

/** Test helper — resets the save epoch and write queue. */
export function __resetConsentSaveEpochForTests (): void {
	consentSaveEpoch = 0
	writeChain = Promise.resolve()
}

/** Current save epoch (for tests asserting race winners). */
export function getConsentSaveEpochForTests (): number {
	return consentSaveEpoch
}

/**
 * Persist purpose choices with race-safe gate updates.
 * Callers update React state only when status === 'applied'.
 */
export async function savePrivacyPurposes (
	input: SavePrivacyPurposesInput,
): Promise<SavePrivacyPurposesResult> {
	const epoch = ++consentSaveEpoch

	// 1) Sync revoke immediately — block ads/analytics before any await.
	//    Grants stay closed until persist succeeds (openGrants: false).
	applyConsentGatesSync({
		analytics: input.analytics,
		ads: input.ads,
		openGrants: false,
	})

	const run = async (): Promise<SavePrivacyPurposesResult> => {
		// Newer save already started — skip this write entirely.
		if (epoch !== consentSaveEpoch) {
			return { status: 'superseded' }
		}

		try {
			const saved = await writePersistedPrivacyConsent(input)

			// Stale completion: do not restore gates / React state / bootstrap.
			if (epoch !== consentSaveEpoch) {
				return { status: 'superseded' }
			}

			// 2) Open grants only after successful persist of the current decision.
			await bootstrapOptionalSdks({
				analytics: saved.analytics,
				ads: saved.ads,
			})

			if (epoch !== consentSaveEpoch) {
				return { status: 'superseded' }
			}

			return { status: 'applied', saved }
		} catch (error) {
			// Fail-closed: revokes already applied; do not re-open prior grants.
			if (epoch === consentSaveEpoch) {
				applyConsentGatesSync({
					analytics: input.analytics,
					ads: input.ads,
					openGrants: false,
				})
			}
			return {
				status: 'failed',
				error:
					error instanceof Error
						? error
						: new Error('privacy_consent_persist_failed'),
			}
		}
	}

	// Chain writes; keep the queue alive even when a save fails.
	const resultPromise = writeChain.then(run, run)
	writeChain = resultPromise.then(
		() => undefined,
		() => undefined,
	)
	return resultPromise
}
