import { expect, test } from 'vitest'
import getStatLevel from './getStatLevel.ts'
import type { StatLevel } from './getStatLevel.ts'

const cases: { value: number; level: StatLevel }[] = [
  { value: 0, level: 'low' },
  { value: 49, level: 'low' },
  { value: 50, level: 'medium' },
  { value: 89, level: 'medium' },
  { value: 90, level: 'high' },
  { value: 255, level: 'high' },
]

test.each(cases)('classifies a stat value of $value as $level', ({ value, level }) => {
  expect(getStatLevel(value)).toBe(level)
})
