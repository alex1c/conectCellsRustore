/**
 * Isolates optional UI so a dev-only crash cannot white-screen the game.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
	children: ReactNode
	label?: string
}

interface State {
	hasError: boolean
	message: string
}

export class UiErrorBoundary extends Component<Props, State> {
	state: State = {
		hasError: false,
		message: '',
	}

	static getDerivedStateFromError (error: Error): State {
		return {
			hasError: true,
			message: error.message || 'Unknown UI error',
		}
	}

	componentDidCatch (error: Error, info: ErrorInfo): void {
		if (__DEV__) {
			console.warn(
				`[UiErrorBoundary:${this.props.label ?? 'ui'}]`,
				error.message,
				info.componentStack,
			)
		}
	}

	render () {
		if (this.state.hasError) {
			if (!__DEV__) {
				return null
			}
			return (
				<View style={styles.box}>
					<Text style={styles.title}>
						{this.props.label ?? 'UI'} error
					</Text>
					<Text style={styles.body}>{this.state.message}</Text>
				</View>
			)
		}
		return this.props.children
	}
}

const styles = StyleSheet.create({
	box: {
		marginTop: 8,
		padding: 8,
		borderRadius: 8,
		backgroundColor: '#fee2e2',
	},
	title: {
		fontWeight: '700',
		color: '#991b1b',
		fontSize: 12,
	},
	body: {
		marginTop: 4,
		color: '#7f1d1d',
		fontSize: 11,
	},
})
