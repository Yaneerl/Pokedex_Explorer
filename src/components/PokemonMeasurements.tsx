import type { PokemonDetailsData } from '../types/pokemon.ts'
import InterfaceIcon from './InterfaceIcon.tsx'

type PokemonMeasurementsProps = Pick<PokemonDetailsData, 'heightMeters' | 'weightKg'>

export default function PokemonMeasurements({ heightMeters, weightKg }: PokemonMeasurementsProps) {
  const measurements = [
    { label: 'Height', value: heightMeters, unit: 'm', icon: 'height' },
    { label: 'Weight', value: weightKg, unit: 'kg', icon: 'weight' },
  ] as const

  return (
    <section className="pokemon-physical-panel" aria-labelledby="pokemon-physical-heading">
      <h3 id="pokemon-physical-heading">Height &amp; Weight</h3>
      <div className="pokemon-measurement-console">
        <span className="pokemon-measurement-caption" aria-hidden="true">METRIC READOUT<span /><span /><span /></span>
        <dl className="pokemon-measurements" aria-label="Height and weight">
          {measurements.map(({ label, value, unit, icon }) => (
            <div className="pokemon-measurement" key={label}>
              <dt><InterfaceIcon name={icon} />{label}</dt>
              <dd>
                <span className="pokemon-measurement-visual" aria-hidden="true">
                  <span className="pokemon-measurement-value">{value.toFixed(1)}</span>
                  <span className="pokemon-measurement-unit">{unit}</span>
                </span>
                <span className="pokemon-measurement-reading">{value.toFixed(1) + ' ' + unit}</span>
              </dd>
            </div>
          ))}
        </dl>
        <div className="pokemon-measurement-ruler" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </section>
  )
}
