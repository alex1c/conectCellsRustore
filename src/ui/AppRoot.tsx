/**
 * Production app shell — routes Home / Game / Settings / Tutorial / About.
 * First launch opens interactive tutorial before Home.
 */

import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { initAds } from '../ads/adsService'
import { initAnalytics, trackEvent } from '../analytics/appMetrica'
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

	useEffect(() => {
		let cancelled = false
		;(async () => {
			await initAnalytics()
			if (cancelled) {
				return
			}
			trackEvent('app_open')
			void initAds()
		})()
		return () => {
			cancelled = true
		}
	}, [])

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
				<Text style={styles.loadingText}>Загрузка…</Text>
			</View>
		)
	}

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
				title="Начать новую игру?"
				body="Текущая партия будет потеряна. Продолжить?"
				confirmLabel="Новая игра"
				onCancel={() => setConfirmNewVisible(false)}
				onConfirm={beginFreshParty}
			/>
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
