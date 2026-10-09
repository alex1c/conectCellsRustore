/**
 * Interactive Hexonica tutorial step model.
 * Coach copy lives in locale dictionaries (tutorial.<id>.title/body).
 */

export type TutorialSource = 'first_launch' | 'help'

export type TutorialStepId =
	| 'select'
	| 'move'
	| 'path_tip'
	| 'merge'
	| 'merge_tip'
	| 'large_group'
	| 'spawn'
	| 'levels'
	| 'done'

export interface TutorialStepDef {
	id: TutorialStepId
	/** 1-based progress index for dots / "2 / 9". */
	index: number
	/** i18n key for the coach title. */
	titleKey: string
	/** i18n key for the coach body. */
	bodyKey: string
	/** Show primary Continue / Play instead of waiting for a board action. */
	coachOnly: boolean
	/** Optional i18n key for the primary button (defaults to common.next). */
	primaryLabelKey?: string
}

export const TUTORIAL_STEPS: readonly TutorialStepDef[] = [
	{
		id: 'select',
		index: 1,
		titleKey: 'tutorial.select.title',
		bodyKey: 'tutorial.select.body',
		coachOnly: false,
	},
	{
		id: 'move',
		index: 2,
		titleKey: 'tutorial.move.title',
		bodyKey: 'tutorial.move.body',
		coachOnly: false,
	},
	{
		id: 'path_tip',
		index: 3,
		titleKey: 'tutorial.path_tip.title',
		bodyKey: 'tutorial.path_tip.body',
		coachOnly: true,
		primaryLabelKey: 'common.next',
	},
	{
		id: 'merge',
		index: 4,
		titleKey: 'tutorial.merge.title',
		bodyKey: 'tutorial.merge.body',
		coachOnly: false,
	},
	{
		id: 'merge_tip',
		index: 5,
		titleKey: 'tutorial.merge_tip.title',
		bodyKey: 'tutorial.merge_tip.body',
		coachOnly: true,
		primaryLabelKey: 'common.next',
	},
	{
		id: 'large_group',
		index: 6,
		titleKey: 'tutorial.large_group.title',
		bodyKey: 'tutorial.large_group.body',
		coachOnly: true,
		primaryLabelKey: 'common.next',
	},
	{
		id: 'spawn',
		index: 7,
		titleKey: 'tutorial.spawn.title',
		bodyKey: 'tutorial.spawn.body',
		coachOnly: false,
	},
	{
		id: 'levels',
		index: 8,
		titleKey: 'tutorial.levels.title',
		bodyKey: 'tutorial.levels.body',
		coachOnly: true,
		primaryLabelKey: 'common.next',
	},
	{
		id: 'done',
		index: 9,
		titleKey: 'tutorial.done.title',
		bodyKey: 'tutorial.done.body',
		coachOnly: true,
		primaryLabelKey: 'common.play',
	},
] as const

export const TUTORIAL_STEP_COUNT = TUTORIAL_STEPS.length

export function getTutorialStep (index: number): TutorialStepDef {
	const clamped = Math.min(
		Math.max(0, index),
		TUTORIAL_STEPS.length - 1,
	)
	return TUTORIAL_STEPS[clamped]!
}
