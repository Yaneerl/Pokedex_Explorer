import { expect, test } from 'vitest'
import type { PokemonStat, PokemonStatName, PokemonStatResponse } from '../types/pokemon.ts'
import comparePokemonStats from './comparePokemonStats.ts'
import { toPokemonStats } from './pokemonStats.ts'

const names: PokemonStatName[] = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
function stats(values: readonly number[]): PokemonStat[] {
  return names.map((name, index) => {
    const value = values[index]
    if (value === undefined) throw new Error('Incomplete test fixture')
    return { name, value }
  })
}
const left = stats([78, 84, 78, 109, 85, 100])
const right = stats([80, 82, 83, 100, 85, 80])

test('computes all six differences, leaders, totals and the tie count from actual input stats', () => {
  const comparison = comparePokemonStats(left, right)
  expect(comparison.rows).toEqual([
    { name: 'hp', left: 78, right: 80, difference: 2, leader: 'right' },
    { name: 'attack', left: 84, right: 82, difference: 2, leader: 'left' },
    { name: 'defense', left: 78, right: 83, difference: 5, leader: 'right' },
    { name: 'special-attack', left: 109, right: 100, difference: 9, leader: 'left' },
    { name: 'special-defense', left: 85, right: 85, difference: 0, leader: 'tie' },
    { name: 'speed', left: 100, right: 80, difference: 20, leader: 'left' },
  ])
  expect(comparison.totals).toEqual({ left: 534, right: 510 })
  expect(comparison.leads).toEqual({ left: 3, right: 2, tie: 1 })
})

test('reports six ties and zero differences for equal stats without assigning an advantage', () => {
  const comparison = comparePokemonStats(left, left)
  expect(comparison.leads).toEqual({ left: 0, right: 0, tie: 6 })
  expect(comparison.rows.every((row) => row.leader === 'tie' && row.difference === 0)).toBe(true)
  expect(comparison.totals).toEqual({ left: 534, right: 534 })
})

test('matches stats by name instead of array position and preserves its inputs', () => {
  const reversed = [...right].reverse()
  const before = structuredClone(reversed)
  expect(comparePokemonStats(left, reversed)).toEqual(comparePokemonStats(left, right))
  expect(reversed).toEqual(before)
})

test('swapping the Pokémon swaps the lead counts and totals but keeps absolute differences', () => {
  const comparison = comparePokemonStats(right, left)
  expect(comparison.totals).toEqual({ left: 510, right: 534 })
  expect(comparison.leads).toEqual({ left: 2, right: 3, tie: 1 })
  expect(comparison.rows.map((row) => row.difference)).toEqual([2, 2, 5, 9, 0, 20])
})

test('handles the shared scale boundaries without normalizing away a stat advantage', () => {
  const comparison = comparePokemonStats(stats([0, 0, 0, 0, 0, 0]), stats([255, 255, 255, 255, 255, 255]))
  expect(comparison.totals).toEqual({ left: 0, right: 1530 })
  expect(comparison.leads).toEqual({ left: 0, right: 6, tie: 0 })
  expect(comparison.rows.map((row) => row.difference)).toEqual([255, 255, 255, 255, 255, 255])
})

test('rejects an incomplete comparison instead of treating missing data as zero', () => {
  expect(() => comparePokemonStats(left.slice(1), right)).toThrow('All six base stats are required')
})

const apiStats = (): PokemonStatResponse[] => left.map((entry) => ({ base_stat: entry.value, stat: { name: entry.name } }))
test('maps reordered API stats into the shared six-stat model', () => {
  expect(toPokemonStats({ stats: apiStats().reverse() })).toEqual(left)
})
test('rejects missing or duplicated API stats', () => {
  expect(() => toPokemonStats({ stats: apiStats().slice(1) })).toThrow('All six base stats')
  const duplicate = apiStats()
  duplicate[0] = { base_stat: 78, stat: { name: 'attack' } }
  expect(() => toPokemonStats({ stats: duplicate })).toThrow('Invalid or missing base stat: HP.')
})
test.each([-1, 256, Number.NaN])('rejects an invalid API base stat %s', (value) => {
  const invalid = apiStats()
  invalid[0] = { base_stat: value, stat: { name: 'hp' } }
  expect(() => toPokemonStats({ stats: invalid })).toThrow('Invalid or missing base stat: HP.')
})
