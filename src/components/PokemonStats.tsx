import type { PokemonStat } from '../types/pokemon.ts'
import { STAT_LABELS, STAT_SCALE_MAX } from '../utils/pokemonStats.ts'
import getStatLevel from '../utils/getStatLevel.ts'

interface PokemonStatsProps {
  stats: PokemonStat[]
}

export default function PokemonStats({ stats }: PokemonStatsProps) {
  return (
    <section className="pokemon-stats" aria-labelledby="pokemon-stats-heading">
      <h3 id="pokemon-stats-heading">Base stats</h3>
      <p className="pokemon-stats-scale">Bar scale: 0–{STAT_SCALE_MAX}</p>
      <ul className="pokemon-stats-list">
        {stats.map((stat) => (
          <li key={stat.name}>
            <div className="pokemon-stat-label">
              <span id={'pokemon-stat-' + stat.name}>{STAT_LABELS[stat.name]}</span>
              <span className="pokemon-stat-value">{stat.value}</span>
            </div>
            <div
              className="pokemon-stat-track"
              role="meter"
              aria-labelledby={'pokemon-stat-' + stat.name}
              aria-valuemin={0}
              aria-valuemax={STAT_SCALE_MAX}
              aria-valuenow={stat.value}
            >
              <div
                className={'pokemon-stat-fill pokemon-stat-fill--' + getStatLevel(stat.value)}
                style={{ width: Math.min(100, Math.max(0, stat.value / STAT_SCALE_MAX * 100)) + '%' }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
