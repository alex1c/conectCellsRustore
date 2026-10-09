/**
 * Contracts for Android launcher name localization (Expo app.json locales).
 * Prevents regression where a stale android/ tree ships only Гексоника.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- Jest CommonJS contracts */

import {
	APP_DISPLAY_NAME_INTL,
	APP_DISPLAY_NAME_RU,
} from '../../branding'

const nodeFs = require('fs') as {
	readFileSync: (path: string, encoding: string) => string
	existsSync: (path: string) => boolean
}
const nodePath = require('path') as {
	join: (...parts: string[]) => string
	resolve: (...parts: string[]) => string
}

declare const __dirname: string

const root = nodePath.resolve(__dirname, '../../..')

describe('Android launcher locale contracts', () => {
	it('keeps default expo.name as international Hexonica', () => {
		const appJson = JSON.parse(
			nodeFs.readFileSync(nodePath.join(root, 'app.json'), 'utf8'),
		) as { expo: { name: string; locales: Record<string, string> } }
		expect(appJson.expo.name).toBe(APP_DISPLAY_NAME_INTL)
		expect(appJson.expo.locales).toEqual({
			en: './native-locales/en.json',
			ru: './native-locales/ru.json',
			es: './native-locales/es.json',
			de: './native-locales/de.json',
			tr: './native-locales/tr.json',
		})
	})

	it('defines android.app_name in every native-locales file', () => {
		const expected: Record<string, string> = {
			en: APP_DISPLAY_NAME_INTL,
			es: APP_DISPLAY_NAME_INTL,
			de: APP_DISPLAY_NAME_INTL,
			tr: APP_DISPLAY_NAME_INTL,
			ru: APP_DISPLAY_NAME_RU,
		}
		for (const [lang, name] of Object.entries(expected)) {
			const filePath = nodePath.join(
				root,
				'native-locales',
				`${lang}.json`,
			)
			const json = JSON.parse(
				nodeFs.readFileSync(filePath, 'utf8'),
			) as {
				android?: { app_name?: string }
				ios?: { CFBundleDisplayName?: string }
			}
			expect(json.android?.app_name).toBe(name)
			expect(json.ios?.CFBundleDisplayName).toBe(name)
		}
	})

	it('matches generated android res when the native tree exists', () => {
		const resRoot = nodePath.join(
			root,
			'android',
			'app',
			'src',
			'main',
			'res',
		)
		if (!nodeFs.existsSync(resRoot)) {
			// CNG folder is gitignored — skip until local prebuild.
			return
		}

		const readName = (relative: string): string => {
			const raw = nodeFs.readFileSync(
				nodePath.join(resRoot, relative),
				'utf8',
			)
			const match = raw.match(/name="app_name"[^>]*>([^<]*)</)
			expect(match).not.toBeNull()
			return (match?.[1] ?? '').replace(/^"+|"+$/g, '').trim()
		}

		expect(readName(nodePath.join('values', 'strings.xml'))).toBe(
			APP_DISPLAY_NAME_INTL,
		)
		expect(readName(nodePath.join('values-b+ru', 'strings.xml'))).toBe(
			APP_DISPLAY_NAME_RU,
		)
		for (const lang of ['en', 'es', 'de', 'tr']) {
			expect(
				readName(nodePath.join(`values-b+${lang}`, 'strings.xml')),
			).toBe(APP_DISPLAY_NAME_INTL)
		}
	})
})
