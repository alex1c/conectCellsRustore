/**
 * Expo app.config.js — store embedding and invalid-value rejection.
 * Runs in a fresh Node process so Jest's module cache cannot freeze env.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- Node config contracts */

const nodeChild = require('child_process') as {
	execFileSync: (
		file: string,
		args: string[],
		opts: { encoding: string; cwd: string; env: Record<string, string> },
	) => string
}
const nodePath = require('path') as {
	resolve: (...parts: string[]) => string
}

declare const __dirname: string

const root = nodePath.resolve(__dirname, '../../..')

/**
 * Evaluate app.config.js in an isolated Node process with the given env.
 */
function evalAppConfig (env: Record<string, string | undefined>): {
	ok: boolean
	extra?: { appStore?: string }
	android?: { package?: string; versionCode?: number }
	version?: string
	error?: string
} {
	const script = `
		const envPatch = ${JSON.stringify(env)};
		for (const [k, v] of Object.entries(envPatch)) {
			if (v === undefined || v === null) delete process.env[k];
			else process.env[k] = v;
		}
		try {
			const c = require('./app.config.js');
			process.stdout.write(JSON.stringify({
				ok: true,
				extra: c.expo.extra,
				android: {
					package: c.expo.android && c.expo.android.package,
					versionCode: c.expo.android && c.expo.android.versionCode,
				},
				version: c.expo.version,
			}));
		} catch (e) {
			process.stdout.write(JSON.stringify({
				ok: false,
				error: e && e.message ? String(e.message) : String(e),
			}));
		}
	`
	const childEnv: Record<string, string> = {}
	for (const [key, value] of Object.entries(process.env)) {
		if (typeof value === 'string') {
			childEnv[key] = value
		}
	}
	for (const [key, value] of Object.entries(env)) {
		if (value === undefined || value === null) {
			delete childEnv[key]
		} else {
			childEnv[key] = value
		}
	}
	const raw = nodeChild.execFileSync(
		process.execPath,
		['-e', script],
		{
			encoding: 'utf8',
			cwd: root,
			env: childEnv,
		},
	)
	return JSON.parse(raw) as {
		ok: boolean
		extra?: { appStore?: string }
		android?: { package?: string; versionCode?: number }
		version?: string
		error?: string
	}
}

describe('app.config.js store flavor', () => {
	it('defaults to rustore and embeds extra.appStore', () => {
		const result = evalAppConfig({
			APP_STORE: undefined,
			EXPO_PUBLIC_APP_STORE: undefined,
		})
		expect(result.ok).toBe(true)
		expect(result.extra?.appStore).toBe('rustore')
	})

	it('selects googleplay when APP_STORE=googleplay', () => {
		const result = evalAppConfig({
			APP_STORE: 'googleplay',
			EXPO_PUBLIC_APP_STORE: undefined,
		})
		expect(result.ok).toBe(true)
		expect(result.extra?.appStore).toBe('googleplay')
	})

	it('throws on invalid APP_STORE (never silent Play)', () => {
		const result = evalAppConfig({
			APP_STORE: 'amazon',
			EXPO_PUBLIC_APP_STORE: undefined,
		})
		expect(result.ok).toBe(false)
		expect(result.error).toMatch(/Invalid APP_STORE/)
	})

	it('does not change package or versionCode', () => {
		const result = evalAppConfig({
			APP_STORE: undefined,
			EXPO_PUBLIC_APP_STORE: undefined,
		})
		expect(result.ok).toBe(true)
		expect(result.android?.package).toBe('ru.forestmusic.connectcells')
		expect(result.android?.versionCode).toBe(2)
		expect(result.version).toBe('1.0.1')
	})
})
