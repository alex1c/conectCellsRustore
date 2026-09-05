/**
 * Centralized tunable knobs for the Connect Cells rules.
 * Change values here for Phase 2 gameplay experiments (dev only).
 * Do not expose board-size pickers in production UI.
 */

/** Side length of the square board. TUNABLE: try 4 / 5 / 6 */
export const BOARD_SIZE = 5

/** Inclusive max value used when filling the initial board. TUNABLE */
export const MAX_INITIAL_VALUE = 3

/** Minimum legal cell value. */
export const MIN_CELL_VALUE = 1

/** Value placed by post-move spawn. TUNABLE */
export const SPAWN_VALUE = 1

/** Score multiplier base: gain = SCORE_BASE * V * chainLevel. TUNABLE */
export const SCORE_BASE = 10

/** Delay between visual chain / merge steps in the UI (ms). TUNABLE */
export const CHAIN_STEP_DELAY_MS = 160

/** Persist schema version for saved games. */
export const SAVE_SCHEMA_VERSION = 1
