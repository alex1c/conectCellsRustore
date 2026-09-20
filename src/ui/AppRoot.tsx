/**
 * Production app shell — routes Home / Game / Settings / How to Play / About.
 * Cold start always lands on Home; game math stays in useGameController.
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
import { HowToPlayScreen } from './screens/HowToPlayScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { COLOR_SURFACE, COLOR_TEXT_MUTED } from './theme/colors'

export function AppRoot () {
	const game = useGameController()
	// Cold start ALWAYS lands on Home — never auto-enter game.
	const [route, setRoute] = useState<AppRoute>('home')
	const [confirmNewVisible, setConfirmNewVisible] = useState(false)
	/** Where Settings / HowToPlay / About should return. */
	const [returnRoute, setReturnRoute] = useState<AppRoute>('home')

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
		setReturnRoute(route === 'game' ? 'game' : 'home')
		setRoute('settings')
	}, [route])

	const openHowToPlay = useCallback(() => {
		trackEvent('how_to_play_open')
		setReturnRoute(
			route === 'settings' ? 'settings' : route === 'game' ? 'game' : 'home',
		)
		setRoute('howToPlay')
	}, [route])

	const openAbout = useCallback(() => {
		setReturnRoute('settings')
		setRoute('about')
	}, [])

	const goBackFromSecondary = useCallback(() => {
		setRoute(returnRoute)
	}, [returnRoute])

	const goHome = useCallback(() => {
		game.goHome()
		setRoute('home')
	}, [game])

	if (!game.ready) {
		return (
			<View style={styles.loading}>
				<ActivityIndicator size="large" color="#1d4ed8" />
				<Text style={styles.loadingText}>Загрузка…</Text>
			</View>
		)
	}

	if (route === 'settings') {
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

	if (route === 'howToPlay') {
		return <HowToPlayScreen onBack={goBackFromSecondary} />
	}

	if (route === 'about') {
		return <AboutScreen onBack={goBackFromSecondary} />
	}

	if (route === 'game') {
		return (
			<GameScreen
				game={game}
				onBackHome={goHome}
				onOpenSettings={openSettings}
				onOpenHowToPlay={openHowToPlay}
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
		backgroundColor: COLOR_SURFACE,
		gap: 12,
	},
	loadingText: {
		color: COLOR_TEXT_MUTED,
	},
})
