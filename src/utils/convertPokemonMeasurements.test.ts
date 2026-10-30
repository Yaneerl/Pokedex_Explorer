import { expect, test } from 'vitest'
import { decimetersToMeters, hectogramsToKilograms } from './convertPokemonMeasurements.ts'

test.each([
  { decimeters: 1, meters: 0.1 },
  { decimeters: 7, meters: 0.7 },
  { decimeters: 145, meters: 14.5 },
])('converts $decimeters decimeters to $meters meters', ({ decimeters, meters }) => {
  expect(decimetersToMeters(decimeters)).toBe(meters)
})

test.each([
  { hectograms: 1, kilograms: 0.1 },
  { hectograms: 69, kilograms: 6.9 },
  { hectograms: 3980, kilograms: 398 },
])('converts $hectograms hectograms to $kilograms kilograms', ({ hectograms, kilograms }) => {
  expect(hectogramsToKilograms(hectograms)).toBe(kilograms)
})
