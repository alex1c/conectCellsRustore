/**
 * Sticky banner slot for Home / Settings / How to Play / About / GameScreen.
 * About reuses howToPlayBanner (R-M-20075886-3) for secondary info screens.
 * GameScreen uses gameBanner (R-M-20075886-6) with a fixed reserved dock so
 * load / no-fill / refresh cannot reflow the hex board.
 *
 * Collapsing slots (Home/Settings/…) shrink to zero when ads are unavailable.
 * Fixed slots always keep reservedHeight with a dark-theme fill.
 *
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

import { COLOR_APP_BACKGROUND } from '../ui/theme/colors'
import { initAds, isAdsSdkReady } from './adsService'
import {
	GAME_BANNER_RESERVED_HEIGHT,
	resolveAdUnitId,
	type AdPlacementKey,
} from './placements'

export type BannerPlacement = Extract<
	AdPlacementKey,
	'homeBanner' | 'settingsBanner' | 'howToPlayBanner' | 'gameBanner'
>

export interface BannerSlotProps {
	placement: BannerPlacement
	/**
	 * When set, always reserve this height (dp). Used by GameScreen so
	 * loading / no-fill cannot shift board geometry.
	 */
	reservedHeight?: number
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
			return null
		}
		return this.props.children
	}
}

export function BannerSlot (props: BannerSlotProps) {
	const { placement, reservedHeight } = props
	const isFixed = typeof reservedHeight === 'number' && reservedHeight > 0
	const [adSize, setAdSize] = useState<unknown>(null)
	const [failed, setFailed] = useState(false)
	const [BannerView, setBannerView] = useState<any>(null)

	// Plain params object — BannerView constructs AdRequest itself.
	// Placement-only dependency: ordinary GameScreen re-renders must not
	// recreate the request identity / remount the native banner.
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

	const showAd =
		!failed &&
		!!adSize &&
		!!BannerView &&
		!!adRequestParams.adUnitId &&
		isAdsSdkReady()

	if (isFixed) {
		return (
			<View
				style={[
					styles.fixedDock,
					{ height: reservedHeight },
				]}
				accessibilityElementsHidden={!showAd}
				pointerEvents={showAd ? 'box-none' : 'none'}
			>
				{showAd ? (
					<BannerErrorBoundary onError={() => setFailed(true)}>
						<View style={styles.wrap} pointerEvents="box-none">
							<BannerView
								size={adSize}
								adRequest={adRequestParams}
								onAdFailedToLoad={() => setFailed(true)}
							/>
						</View>
					</BannerErrorBoundary>
				) : null}
			</View>
		)
	}

	if (!showAd) {
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

/** Default reserved height for GameScreen — re-export for callers/tests. */
export { GAME_BANNER_RESERVED_HEIGHT }

const styles = StyleSheet.create({
	fixedDock: {
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		// Match app chrome so no-fill looks intentional, not white.
		backgroundColor: COLOR_APP_BACKGROUND,
	},
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
