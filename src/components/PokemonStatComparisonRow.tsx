import type { StatComparisonRow } from '../utils/comparePokemonStats.ts'
import { STAT_LABELS, STAT_SCALE_MAX } from '../utils/pokemonStats.ts'

interface PokemonStatComparisonRowProps {
  row: StatComparisonRow
  leftName: string
  rightName: string
}

export default function PokemonStatComparisonRow({ row, leftName, rightName }: PokemonStatComparisonRowProps) {
  const label = STAT_LABELS[row.name]
  return (
    <li className="stat-comparison-row" aria-label={label}>
      <h3>{label}</h3>
      <div className="stat-comparison-values">
        {(['left', 'right'] as const).map((side) => {
          const name = side === 'left' ? leftName : rightName
          const level = row.leader === 'tie' ? 'tie' : row.leader === side ? 'leading' : 'trailing'
          return (
            <div key={side} className={'stat-comparison-value stat-comparison-value--' + level}>
              <div className="stat-comparison-label"><span>{name}</span><strong>{row[side]}</strong></div>
              <div className="stat-comparison-track" role="meter" aria-label={name + ' ' + label} aria-valuemin={0} aria-valuemax={STAT_SCALE_MAX} aria-valuenow={row[side]}>
                <div className="stat-comparison-fill" style={{ width: row[side] / STAT_SCALE_MAX * 100 + '%' }} />
              </div>
            </div>
          )
        })}
      </div>
      <p className="stat-comparison-result">
        <strong>{row.leader === 'tie' ? 'Tie' : (row.leader === 'left' ? leftName : rightName) + ' leads'}</strong>
        <span>Difference: {row.difference} {row.difference === 1 ? 'point' : 'points'}</span>
      </p>
    </li>
  )
}
