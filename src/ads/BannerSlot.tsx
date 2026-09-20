/**
 * Sticky banner slot for Home / Settings / How to Play / About.
 * About reuses howToPlayBanner (R-M-20075886-3) for secondary info screens.
 * Collapses to zero height when ads are unavailable so layout stays intact.
 * Never crashes the host screen on SDK errors.
 * Unmount on screen exit tears down the native banner (correct lifecycle).
 *
 * Yandex BannerView builds `new AdRequest(adRequest)` during render — the
 * `adRequest` prop MUST be a plain AdRequestParams object (with adUnitId),
 * never undefined and never a pre-built AdRequest instance (double-wrap
 * leaves `_adUnitId` empty for the native bridge).
 */

/* eslint-disable @typescript-eslint/no-require-imports -- native SDK optional at runtime */

import { Component, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'

import { initAds, isAdsSdkReady } from './adsService'
import { resolveAdUnitId, type AdPlacementKey } from './placements'

export interface BannerSlotProps {
	placement: Extract<
		AdPlacementKey,
		'homeBanner' | 'settingsBanner' | 'howToPlayBanner'
	>
}

class BannerErrorBoundary extends Component<
	{ children: ReactNode; onError: () => void },
	{ failed: boolean }
> {
	state = { failed: false }

	static getDerivedStateFromError () {
		return { failed: true }
	}

	componentDidCatch () {
		this.props.onError()
	}

	render () {
		if (this.state.failed) {
			return <View style={styles.empty} />
		}
		return this.props.children
	}
}

export function BannerSlot (props: BannerSlotProps) {
	const { placement } = props
	const [adSize, setAdSize] = useState<unknown>(null)
	const [failed, setFailed] = useState(false)
	const [BannerView, setBannerView] = useState<any>(null)

	// Plain params object — BannerView constructs AdRequest itself.
	const adRequestParams = useMemo(
		() => ({ adUnitId: resolveAdUnitId(placement) }),
		[placement],
	)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
				return
			}
			const ready = await initAds()
			if (!ready || cancelled) {
				setFailed(true)
				return
			}
			try {
				const ads = require('yandex-mobile-ads')
				const size = await ads.BannerAdSize.stickySize(
					Dimensions.get('window').width,
				)
				if (cancelled) {
					return
				}
				// Store the component type (updater form avoids calling it as a function).
				setBannerView(() => ads.BannerView)
				setAdSize(size)
			} catch {
				if (!cancelled) {
					setFailed(true)
				}
			}
		})()
		return () => {
			cancelled = true
		}
	}, [placement])

	if (
		failed ||
		!adSize ||
		!BannerView ||
		!adRequestParams.adUnitId ||
		!isAdsSdkReady()
	) {
		return <View style={styles.empty} accessibilityElementsHidden />
	}

	return (
		<BannerErrorBoundary onError={() => setFailed(true)}>
			<View style={styles.wrap} pointerEvents="box-none">
				<BannerView
					size={adSize}
					adRequest={adRequestParams}
					onAdFailedToLoad={() => setFailed(true)}
				/>
			</View>
		</BannerErrorBoundary>
	)
}

const styles = StyleSheet.create({
	wrap: {
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 0,
	},
	empty: {
		height: 0,
	},
})
