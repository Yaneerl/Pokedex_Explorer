import { useId } from 'react'
import type { PokemonWithStats } from '../types/pokemon.ts'
import comparePokemonStats from '../utils/comparePokemonStats.ts'
import { STAT_SCALE_MAX } from '../utils/pokemonStats.ts'
import PokemonStatComparisonRow from './PokemonStatComparisonRow.tsx'

interface PokemonStatsComparisonProps {
  left: PokemonWithStats
  right: PokemonWithStats
}

export default function PokemonStatsComparison({ left, right }: PokemonStatsComparisonProps) {
  const headingId = useId()
  const comparison = comparePokemonStats(left.stats, right.stats)
  return (
    <section className="stats-comparison" aria-labelledby={headingId}>
      <div className="stats-comparison-header">
        <h2 id={headingId}>Stats Comparison</h2>
        <p className="stats-comparison-scale">Shared bar scale: 0–{STAT_SCALE_MAX}</p>
      </div>
      <p className="stats-comparison-note">Base Stats only. This comparison does not predict the winner of a real battle.</p>
      <ul className="stats-comparison-list">
        {comparison.rows.map((row) => <PokemonStatComparisonRow key={row.name} row={row} leftName={left.name} rightName={right.name} />)}
      </ul>
      <div className="stats-comparison-summary" aria-label="Base stats summary">
        {(['left', 'right'] as const).map((side) => (
          <div key={side} className="stats-comparison-summary-card">
            <h3>{side === 'left' ? left.name : right.name}</h3>
            <p>Total Base Stats: <strong>{comparison.totals[side]}</strong></p>
            <p>Leads in <strong>{comparison.leads[side]}</strong> of 6 stats</p>
          </div>
        ))}
      </div>
      <p className="stats-comparison-ties">Tied stats: <strong>{comparison.leads.tie}</strong> of 6</p>
    </section>
  )
}
