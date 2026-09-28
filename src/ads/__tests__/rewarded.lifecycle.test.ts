/**
 * Focused rewarded Undo lifecycle tests — single-flight load, show await,
 * reward semantics, state reset, and diagnostic telemetry order.
 */

import {
	__resetAdsServiceForTests,
	preloadRewardedUndo,
	showRewardedUndo,
} from '../adsService'
import { trackEvent } from '../../analytics/appMetrica'
import { RewardedAdLoader } from 'yandex-mobile-ads'

jest.mock('../../analytics/appMetrica', () => ({
	trackEvent: jest.fn(),
}))

jest.mock('yandex-mobile-ads', () => ({
	RewardedAdLoader: {
		create: jest.fn(),
	},
	MobileAds: {
		initialize: jest.fn(async () => undefined),
	},
}))

const trackEventMock = trackEvent as jest.MockedFunction<typeof trackEvent>
const createLoaderMock = RewardedAdLoader.create as jest.MockedFunction<
	typeof RewardedAdLoader.create
>
const loadAdMock = jest.fn()

/**
 * Mutable callback bag — adsService assigns handlers via property setters.
 */
function makeAd (showImpl?: () => Promise<void>): {
	ad: any
	callbacks: {
		onRewarded?: () => void
		onAdImpression?: () => void
		onAdDismissed?: () => void
		onAdFailedToShow?: (error?: unknown) => void
	}
} {
	const callbacks: {
		onRewarded?: () => void
		onAdImpression?: () => void
		onAdDismissed?: () => void
		onAdFailedToShow?: (error?: unknown) => void
	} = {}
	const ad: any = {
		show: jest.fn(showImpl ?? (async () => undefined)),
	}
	Object.defineProperty(ad, 'onRewarded', {
		set (fn: () => void) {
			callbacks.onRewarded = fn
		},
	})
	Object.defineProperty(ad, 'onAdImpression', {
		set (fn: () => void) {
			callbacks.onAdImpression = fn
		},
	})
	Object.defineProperty(ad, 'onAdDismissed', {
		set (fn: () => void) {
			callbacks.onAdDismissed = fn
		},
	})
	Object.defineProperty(ad, 'onAdFailedToShow', {
		set (fn: (error?: unknown) => void) {
			callbacks.onAdFailedToShow = fn
		},
	})
	return { ad, callbacks }
}

function eventNames (): string[] {
	return trackEventMock.mock.calls.map((call) => call[0] as string)
}

/** Flush microtasks so ensure/present can attach show handlers. */
async function flushMicrotasks (times = 5): Promise<void> {
	for (let i = 0; i < times; i += 1) {
		await Promise.resolve()
	}
}

describe('rewarded undo lifecycle', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		__resetAdsServiceForTests({ sdkReady: true })
		createLoaderMock.mockResolvedValue({
			loadAd: loadAdMock,
		} as any)
	})

	afterEach(() => {
		__resetAdsServiceForTests()
	})

	it('reuses an existing preload without a second loadAd', async () => {
		const { ad, callbacks } = makeAd()
		loadAdMock.mockResolvedValueOnce(ad)

		await preloadRewardedUndo('game')
		expect(loadAdMock).toHaveBeenCalledTimes(1)

		const showPromise = showRewardedUndo({ source: 'game' })
		await flushMicrotasks()

		// Critical window: show must reuse preload — no second loadAd yet.
		expect(loadAdMock).toHaveBeenCalledTimes(1)
		expect(ad.show).toHaveBeenCalledTimes(1)

		callbacks.onRewarded?.()
		callbacks.onAdDismissed?.()
		const result = await showPromise
		expect(result).toEqual({ status: 'rewarded' })
	})

	it('reuses an in-flight preload (no duplicate loadAd)', async () => {
		let resolveLoad!: (value: any) => void
		const loadGate = new Promise<any>((resolve) => {
			resolveLoad = resolve
		})
		loadAdMock.mockReturnValueOnce(loadGate)

		const preloadPromise = preloadRewardedUndo('game')
		const showPromise = showRewardedUndo({ source: 'game' })
		await flushMicrotasks()

		// Both share the single in-flight loadAd.
		expect(createLoaderMock).toHaveBeenCalledTimes(1)
		expect(loadAdMock).toHaveBeenCalledTimes(1)

		const { ad, callbacks } = makeAd()
		resolveLoad(ad)
		await preloadPromise
		await flushMicrotasks()

		expect(loadAdMock).toHaveBeenCalledTimes(1)
		expect(ad.show).toHaveBeenCalledTimes(1)

		callbacks.onRewarded?.()
		callbacks.onAdDismissed?.()
		expect(await showPromise).toEqual({ status: 'rewarded' })
	})

	it('starts exactly one direct load when no preload exists', async () => {
		const { ad, callbacks } = makeAd()
		loadAdMock.mockResolvedValueOnce(ad)

		const showPromise = showRewardedUndo({ source: 'game' })
		await flushMicrotasks()

		expect(loadAdMock).toHaveBeenCalledTimes(1)
		callbacks.onAdDismissed?.()
		await showPromise
	})

	it('show Promise rejection resets state and emits show_failed', async () => {
		const { ad } = makeAd(async () => {
			throw new Error('show_boom')
		})
		loadAdMock.mockResolvedValueOnce(ad)

		const result = await showRewardedUndo({ source: 'game' })
		expect(result.status).toBe('failed')
		expect(eventNames()).toContain('rewarded_show_failed')

		// Later retry must be able to load again (state not stuck).
		const { ad: ad2, callbacks } = makeAd()
		loadAdMock.mockResolvedValueOnce(ad2)
		const retry = showRewardedUndo({ source: 'game' })
		await flushMicrotasks()
		callbacks.onRewarded?.()
		callbacks.onAdDismissed?.()
		expect(await retry).toEqual({ status: 'rewarded' })
		expect(loadAdMock).toHaveBeenCalledTimes(2)
	})

	it('onAdFailedToShow resets state and emits show_failed', async () => {
		const { ad, callbacks } = makeAd()
		loadAdMock.mockResolvedValueOnce(ad)

		const showPromise = showRewardedUndo({ source: 'game_over' })
		await flushMicrotasks()

		callbacks.onAdFailedToShow?.({ message: 'native_fail' })
		const result = await showPromise
		expect(result.status).toBe('failed')
		expect(eventNames()).toContain('rewarded_show_failed')
	})

	it('dismiss without reward grants no Undo', async () => {
		const { ad, callbacks } = makeAd()
		loadAdMock.mockResolvedValueOnce(ad)

		const showPromise = showRewardedUndo({ source: 'game' })
		await flushMicrotasks()

		callbacks.onAdImpression?.()
		callbacks.onAdDismissed?.()
		expect(await showPromise).toEqual({
			status: 'dismissed_without_reward',
		})
		expect(eventNames()).not.toContain('rewarded_reward')
	})

	it('reward + dismiss yields exactly one rewarded result', async () => {
		const { ad, callbacks } = makeAd()
		loadAdMock.mockResolvedValueOnce(ad)

		const showPromise = showRewardedUndo({ source: 'game' })
		await flushMicrotasks()

		callbacks.onAdImpression?.()
		callbacks.onRewarded?.()
		callbacks.onAdDismissed?.()
		// Extra dismiss must not double-resolve / change semantics.
		callbacks.onAdDismissed?.()

		expect(await showPromise).toEqual({ status: 'rewarded' })
		const rewardEvents = eventNames().filter((n) => n === 'rewarded_reward')
		expect(rewardEvents).toHaveLength(1)
	})

	it('successful flow starts exactly one next preload', async () => {
		const first = makeAd()
		const second = makeAd()
		loadAdMock
			.mockResolvedValueOnce(first.ad)
			.mockResolvedValueOnce(second.ad)

		const showPromise = showRewardedUndo({ source: 'game' })
		await flushMicrotasks()

		first.callbacks.onRewarded?.()
		first.callbacks.onAdDismissed?.()
		await showPromise

		// Fire-and-forget next preload via single-flight ensure.
		await flushMicrotasks(10)
		expect(loadAdMock).toHaveBeenCalledTimes(2)
	})

	it('failed flow allows a later retry', async () => {
		loadAdMock.mockRejectedValueOnce(new Error('fill_miss'))
		const first = await showRewardedUndo({ source: 'game' })
		expect(first.status).toBe('failed')
		expect(eventNames()).toContain('rewarded_load_failed')

		const { ad, callbacks } = makeAd()
		loadAdMock.mockResolvedValueOnce(ad)
		const secondPromise = showRewardedUndo({ source: 'game' })
		await flushMicrotasks()
		callbacks.onRewarded?.()
		callbacks.onAdDismissed?.()
		expect(await secondPromise).toEqual({ status: 'rewarded' })
	})

	it('emits lifecycle telemetry in diagnostic order', async () => {
		const { ad, callbacks } = makeAd()
		loadAdMock.mockResolvedValueOnce(ad)

		const showPromise = showRewardedUndo({ source: 'game' })
		await flushMicrotasks()

		callbacks.onAdImpression?.()
		callbacks.onRewarded?.()
		callbacks.onAdDismissed?.()
		await showPromise

		const names = eventNames().filter((n) => n.startsWith('rewarded_'))
		// Next preload may append another load_requested — keep prefix order.
		expect(names.slice(0, 6)).toEqual([
			'rewarded_load_requested',
			'rewarded_loaded',
			'rewarded_show_requested',
			'rewarded_impression',
			'rewarded_reward',
			'rewarded_closed',
		])
		expect(trackEventMock).toHaveBeenCalledWith(
			'rewarded_load_requested',
			expect.objectContaining({ placement: 'undo', source: 'game' }),
		)
	})
})
