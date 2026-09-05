/**
 * Numeric knobs for Phase 1 rules.
 * Values marked TUNABLE in docs/GAME_RULES.md live here.
 */

/** Side length of the square board. TUNABLE */
export const BOARD_SIZE = 5

/** Inclusive max value used when filling the initial board. TUNABLE */
export const MAX_INITIAL_VALUE = 3

/** Minimum legal cell value. */
export const MIN_CELL_VALUE = 1

/** Value placed by post-move spawn. TUNABLE */
export const SPAWN_VALUE = 1

/** Score multiplier base: gain = SCORE_BASE * V * chainLevel. TUNABLE */
export const SCORE_BASE = 10
