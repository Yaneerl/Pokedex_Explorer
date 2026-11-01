import type { PokemonStat, PokemonStatName } from '../types/pokemon.ts'
import { POKEMON_STAT_NAMES } from './pokemonStats.ts'

export type StatLeader = 'left' | 'right' | 'tie'
export interface StatComparisonRow {
  name: PokemonStatName
  left: number
  right: number
  difference: number
  leader: StatLeader
}
export interface StatsComparison {
  rows: StatComparisonRow[]
  totals: { left: number; right: number }
  leads: { left: number; right: number; tie: number }
}

export default function comparePokemonStats(left: readonly PokemonStat[], right: readonly PokemonStat[]): StatsComparison {
  const rows = POKEMON_STAT_NAMES.map((name): StatComparisonRow => {
    const leftStat = left.find((stat) => stat.name === name)
    const rightStat = right.find((stat) => stat.name === name)
    if (!leftStat || !rightStat) throw new Error('All six base stats are required for comparison.')
    return {
      name, left: leftStat.value, right: rightStat.value,
      difference: Math.abs(leftStat.value - rightStat.value),
      leader: leftStat.value === rightStat.value ? 'tie' : leftStat.value > rightStat.value ? 'left' : 'right',
    }
  })
  const totals = { left: 0, right: 0 }
  const leads = { left: 0, right: 0, tie: 0 }
  for (const row of rows) {
    totals.left += row.left
    totals.right += row.right
    leads[row.leader]++
  }
  return { rows, totals, leads }
}
