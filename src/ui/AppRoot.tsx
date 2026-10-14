/**
 * Production app shell — routes Home / Game / Settings / Tutorial / About.
 * First launch opens interactive tutorial before Home.
 *
 * Optional SDKs (AppMetrica / Yandex Ads) start via privacy bootstrap —
 * never from an ungated cold-start effect.
 */

import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native'

import { trackEvent } from '../analytics/appMetrica'
import { useTranslation } from '../localization/useTranslation'
import { ConsentModal } from '../privacy/ConsentModal'
import { bootstrapOptionalSdks } from '../privacy/optionalSdkBootstrap'
import { applyYandexUserConsent } from '../privacy/sdkConsentBridge'
import { usePrivacyConsent } from '../privacy/usePrivacyConsent'
import { ConfirmDialog } from './components/ConfirmDialog'
import { useGameController } from './hooks/useGameController'
import { GameScreen } from './GameScreen'
import type { AppRoute } from './navigation'
import { AboutScreen } from './screens/AboutScreen'
import { HomeScreen } from './screens/HomeScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TutorialScreen } from './screens/TutorialScreen'
import { COLOR_ACCENT, COLOR_APP_BACKGROUND, COLOR_TEXT_MUTED } from './theme/colors'
import type { TutorialSource } from './tutorial/tutorialSteps'

export function AppRoot () {
	const game = useGameController()
	const { t } = useTranslation()
	const consent = usePrivacyConsent()
	/**
	 * null = use cold-start default derived from onboardingCompleted.
	 * Avoids an effect that setStates route on boot (eslint cascading-render).
	 */
	const [route, setRoute] = useState<AppRoute | null>(null)
	const [confirmNewVisible, setConfirmNewVisible] = useState(false)
	/** Where Settings / Tutorial / About should return. */
	const [returnRoute, setReturnRoute] = useState<AppRoute>('home')
	const [tutorialSource, setTutorialSource] =
		useState<TutorialSource>('first_launch')

	const resolvedRoute: AppRoute = !game.ready
		? 'boot'
		: route ?? (game.onboardingCompleted ? 'home' : 'tutorial')

	// Re-apply Yandex consent signal when returning to foreground (docs: every launch).
	useEffect(() => {
		const sub = AppState.addEventListener('change', (next) => {
			if (next !== 'active' || !consent.ready) {
				return
			}
			if (!consent.requirement.requiresExplicitConsent) {
				applyYandexUserConsent('granted')
				return
			}
			if (consent.ads !== null) {
				applyYandexUserConsent(consent.ads)
				void bootstrapOptionalSdks({
					analytics: consent.analytics,
					ads: consent.ads,
				})
			}
		})
		return () => {
			sub.remove()
		}
	}, [
		consent.ready,
		consent.requirement.requiresExplicitConsent,
		consent.analytics,
		consent.ads,
	])

	const handleContinue = useCallback(() => {
		trackEvent('home_continue')
		game.continueSession()
		setRoute('game')
	}, [game])

	const beginFreshParty = useCallback(() => {
		trackEvent('new_game')
		game.startNewGame()
		setConfirmNewVisible(false)
		setRoute('game')
	}, [game])

	const handleNewGamePress = useCallback(() => {
		if (game.hasActiveGame) {
			setConfirmNewVisible(true)
			return
		}
		beginFreshParty()
	}, [beginFreshParty, game.hasActiveGame])

	const openSettings = useCallback(() => {
		trackEvent('settings_open')
		setReturnRoute(resolvedRoute === 'game' ? 'game' : 'home')
		setRoute('settings')
	}, [resolvedRoute])

	const openTutorial = useCallback(
		(source: TutorialSource) => {
			trackEvent('how_to_play_open', { source })
			setTutorialSource(source)
			setReturnRoute(
				resolvedRoute === 'settings'
					? 'settings'
					: resolvedRoute === 'game'
						? 'game'
						: 'home',
			)
			setRoute('tutorial')
		},
		[resolvedRoute],
	)

	const openHowToPlay = useCallback(() => {
		openTutorial('help')
	}, [openTutorial])

	const openAbout = useCallback(() => {
		setReturnRoute('settings')
		setRoute('about')
	}, [])

	const goBackFromSecondary = useCallback(() => {
		setRoute(returnRoute === 'boot' ? 'home' : returnRoute)
	}, [returnRoute])

	const goHome = useCallback(() => {
		game.goHome()
		setRoute('home')
	}, [game])

	const finishTutorial = useCallback(() => {
		game.markOnboardingComplete()
		if (tutorialSource === 'help') {
			setRoute(returnRoute === 'boot' ? 'home' : returnRoute)
			return
		}
		setRoute('home')
	}, [game, returnRoute, tutorialSource])

	const skipTutorial = useCallback(() => {
		game.markOnboardingComplete()
		if (tutorialSource === 'help') {
			setRoute(returnRoute === 'boot' ? 'home' : returnRoute)
			return
		}
		setRoute('home')
	}, [game, returnRoute, tutorialSource])

	if (!game.ready || resolvedRoute === 'boot') {
		return (
			<View style={styles.loading}>
				<ActivityIndicator size="large" color={COLOR_ACCENT} />
				<Text style={styles.loadingText}>{t('common.loading')}</Text>
			</View>
		)
	}

	const shell = (() => {
		if (resolvedRoute === 'tutorial') {
			return (
				<TutorialScreen
					source={tutorialSource}
					onFinished={finishTutorial}
					onSkipped={skipTutorial}
				/>
			)
		}

		if (resolvedRoute === 'settings') {
			return (
				<SettingsScreen
					soundEnabled={game.soundEnabled}
					hapticEnabled={game.hapticEnabled}
					onToggleSound={game.setSoundPref}
					onToggleHaptic={game.setHapticPref}
					onHowToPlay={openHowToPlay}
					onAbout={openAbout}
					onPrivacyChoices={
						consent.requirement.requiresExplicitConsent
							? consent.openEditor
							: undefined
					}
					onBack={goBackFromSecondary}
				/>
			)
		}

		if (resolvedRoute === 'about') {
			return <AboutScreen onBack={goBackFromSecondary} />
		}

		if (resolvedRoute === 'game') {
			return (
				<GameScreen
					game={game}
					onBackHome={goHome}
					onOpenSettings={openSettings}
					onOpenHowToPlay={openHowToPlay}
					onResetOnboarding={
						typeof __DEV__ !== 'undefined' && __DEV__
							? () => {
								game.resetOnboardingForDev()
								setTutorialSource('first_launch')
								setRoute('tutorial')
							}
							: undefined
					}
				/>
			)
		}

		return (
			<>
				<HomeScreen
					hasActiveGame={game.hasActiveGame}
					activeScore={game.displayScore}
					activeLevel={game.level}
					bestScore={game.bestScore}
					bestLevel={game.bestLevel}
					onContinue={handleContinue}
					onNewGame={handleNewGamePress}
					onHowToPlay={openHowToPlay}
					onSettings={openSettings}
				/>
				<ConfirmDialog
					visible={confirmNewVisible}
					title={t('restart.title')}
					body={t('restart.bodyConfirm')}
					confirmLabel={t('restart.confirm')}
					onCancel={() => setConfirmNewVisible(false)}
					onConfirm={beginFreshParty}
				/>
			</>
		)
	})()

	return (
		<>
			{shell}
			{/* Consent overlays gameplay — never a blank blocked boot screen. */}
			<ConsentModal consent={consent} />
		</>
	)
}

const styles = StyleSheet.create({
	loading: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLOR_APP_BACKGROUND,
		gap: 12,
	},
	loadingText: {
		color: COLOR_TEXT_MUTED,
	},
})
