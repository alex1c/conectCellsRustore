/**
 * Foreground locale refresh — one AppState subscription for the app lifetime.
 */

import { useEffect } from 'react'

import { subscribeDeviceLocaleRefresh } from './localeSync'

/**
 * When Android Settings language changes while the app is backgrounded,
 * returning to foreground picks up the new locale without restarting the game.
 */
export function useDeviceLocaleRefresh (): void {
	useEffect(() => {
		return subscribeDeviceLocaleRefresh()
	}, [])
}
