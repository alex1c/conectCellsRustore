/**
 * Hexonica 1.0 visual tokens — dark theme only.
 * No light theme / selector / system sync in this release.
 * Occupied cell fills stay in cellVisuals.ts (independent palette).
 */

/** Deep blue-gray app / screen backdrop. */
export const COLOR_APP_BACKGROUND = '#101826'

/** Slightly lighter panel sitting on the app backdrop. */
export const COLOR_SURFACE = '#162033'

/** Elevated cards / chrome buttons / modal sheets. */
export const COLOR_SURFACE_ELEVATED = '#1e2c42'

/** Soft plane under the hex field. */
export const COLOR_BOARD_BACKGROUND = 'rgba(22, 32, 48, 0.92)'

/** Empty hex fill — visible destinations without competing with tiles. */
export const COLOR_EMPTY_CELL = '#243347'

/** Empty hex border. */
export const COLOR_EMPTY_CELL_BORDER = '#3d5168'

/** Primary text on dark surfaces. */
export const COLOR_TEXT_PRIMARY = '#e8eef7'

/** Secondary / supporting text. */
export const COLOR_TEXT_SECONDARY = '#a8b4c8'

/** Muted labels / hints. */
export const COLOR_TEXT_MUTED = '#7d8a9c'

/** Hairline dividers / borders. */
export const COLOR_DIVIDER = '#2a3a50'

/** Primary action (Continue, Undo). */
export const COLOR_BUTTON_PRIMARY = '#3b82f6'

/** Secondary / restart chrome. */
export const COLOR_BUTTON_SECONDARY = '#3a4a63'

/** On-primary button label. */
export const COLOR_BUTTON_PRIMARY_TEXT = '#f8fafc'

/** Soft primary tint (Continue subtitle). */
export const COLOR_BUTTON_PRIMARY_SUB = '#bfdbfe'

/** Warning / blocked-path copy. */
export const COLOR_WARNING = '#fbbf24'

/** Progress track under the level bar. */
export const COLOR_PROGRESS_TRACK = '#243347'

/** Progress fill. */
export const COLOR_PROGRESS_FILL = '#3b82f6'

/** Score gain flash / board +N popup. */
export const COLOR_SCORE_GAIN = '#4ade80'

/** Modal / sheet scrim. */
export const COLOR_MODAL_SCRIM = 'rgba(4, 8, 16, 0.72)'

/** Switch track when off. */
export const COLOR_SWITCH_TRACK_OFF = '#3d5168'

/** Switch track when on. */
export const COLOR_SWITCH_TRACK_ON = '#2563eb'

/** Switch thumb. */
export const COLOR_SWITCH_THUMB = '#f8fafc'

/** Selection ring on occupied cells. */
export const COLOR_SELECTION_RING = '#60a5fa'

// --- Compatibility aliases used by existing screens ---

/** @deprecated Prefer COLOR_APP_BACKGROUND — kept as card/panel alias path. */
export const COLOR_SURFACE_CARD = COLOR_SURFACE_ELEVATED

/** @deprecated Prefer COLOR_BOARD_BACKGROUND. */
export const COLOR_BOARD_PLANE = COLOR_BOARD_BACKGROUND

/** @deprecated Prefer COLOR_TEXT_PRIMARY. */
export const COLOR_TEXT = COLOR_TEXT_PRIMARY

/** @deprecated Prefer COLOR_BUTTON_PRIMARY. */
export const COLOR_ACCENT = COLOR_BUTTON_PRIMARY

/** @deprecated Prefer COLOR_BUTTON_SECONDARY. */
export const COLOR_ACCENT_SECONDARY = COLOR_BUTTON_SECONDARY
