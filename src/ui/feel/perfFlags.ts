/**
 * DEV performance flags — all OFF by default for real-device play.
 * Enable only for explicit A/B instrumentation sessions.
 */

/**
 * When true, turn telemetry + optional timing logs may run in __DEV__.
 * Must stay false for ordinary OPPO human play — hot-path logging was a
 * measured contributor to perceived lag.
 */
export const PERF_TELEMETRY = false
