/**
 * Interactive Hexonica tutorial step model + Russian coach copy.
 * Short 1–2 minute flow; no slideshow of text-only pages.
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
	title: string
	body: string
	/** Show primary Continue / Играть instead of waiting for a board action. */
	coachOnly: boolean
	primaryLabel?: string
}

export const TUTORIAL_STEPS: readonly TutorialStepDef[] = [
	{
		id: 'select',
		index: 1,
		title: 'Выберите клетку',
		body: 'Нажмите на клетку с числом.',
		coachOnly: false,
	},
	{
		id: 'move',
		index: 2,
		title: 'Переместите клетку',
		body: 'Нажмите на свободное место.',
		coachOnly: false,
	},
	{
		id: 'path_tip',
		index: 3,
		title: 'Клетке нужен свободный путь',
		body: 'Другие клетки могут перекрыть путь.',
		coachOnly: true,
		primaryLabel: 'Далее',
	},
	{
		id: 'merge',
		index: 4,
		title: 'Соберите одинаковые клетки',
		body: 'Соедините 4 или больше одинаковых клеток.',
		coachOnly: false,
	},
	{
		id: 'merge_tip',
		index: 5,
		title: 'Отлично!',
		body: '4 одинаковых клетки превращаются в одну более ценную.\n1 × 4 → 4    ·    2 × 4 → 8',
		coachOnly: true,
		primaryLabel: 'Далее',
	},
	{
		id: 'large_group',
		index: 6,
		title: 'Собирайте больше!',
		body:
			'Группы из 5 и более дают больше очков и лучше сдерживают заполнение поля.',
		coachOnly: true,
		primaryLabel: 'Далее',
	},
	{
		id: 'spawn',
		index: 7,
		title: 'После ходов появляются новые клетки',
		body: 'Сделайте ход. Не дайте полю заполниться.',
		coachOnly: false,
	},
	{
		id: 'levels',
		index: 8,
		title: 'Набирайте очки и повышайте уровень',
		body:
			'С каждым уровнем поле заполняется быстрее.\nБольшие комбинации помогают освобождать поле.',
		coachOnly: true,
		primaryLabel: 'Далее',
	},
	{
		id: 'done',
		index: 9,
		title: 'Готово!',
		body: 'Стройте комбинации, освобождайте поле и ставьте новый рекорд.',
		coachOnly: true,
		primaryLabel: 'Играть',
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
