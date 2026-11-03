interface PokemonDetailsSkeletonProps { evolutionOnly?: boolean }

/** Decorative placeholders share the real page's layout; they contain no invented data. */
export default function PokemonDetailsSkeleton({ evolutionOnly = false }: PokemonDetailsSkeletonProps) {
  const evolution = (
    <ol className="pokemon-evolution-linear details-evolution-skeleton" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <li className="pokemon-evolution-step" key={index}>
          {index > 0 && <span className="pokemon-evolution-arrow">→</span>}
          <div className="pokemon-evolution-card">
            <span className="pokemon-evolution-number details-skeleton-fill">&nbsp;</span>
            <span className="pokemon-evolution-placeholder details-skeleton-fill" />
            <span className="pokemon-evolution-name details-skeleton-fill">&nbsp;</span>
            <span className="pokemon-evolution-card-state details-skeleton-fill">&nbsp;</span>
          </div>
        </li>
      ))}
    </ol>
  )
  if (evolutionOnly) return evolution
  return (
    <div className="pokemon-details-loading" aria-busy="true">
      <p role="status" className="details-loading-announcement">Loading Pokémon details...</p>
      <div className="pokemon-details-display details-skeleton" aria-hidden="true">
        <div className="pokemon-hero">
          <div className="pokemon-hero-display">
            <span className="details-section-code pokemon-hero-display-label">SPECIMEN DISPLAY / 01</span>
            <div className="pokemon-artwork">
              <div className="pokemon-artwork-preview"><span className="details-skeleton-orb" /></div>
              <div className="pokemon-artwork-toggle"><span className="details-skeleton-control details-skeleton-fill" /><span className="details-skeleton-control details-skeleton-fill" /></div>
            </div>
            <div className="pokemon-hero-form-controls"><div className="details-skeleton-forms details-skeleton-fill" /></div>
          </div>
          <div className="pokemon-hero-info">
            <div className="pokemon-hero-identity">
              <p className="pokemon-record-number details-skeleton-fill">&nbsp;</p>
              <h2 className="details-skeleton-fill">&nbsp;</h2>
              <div className="pokemon-hero-types"><span className="details-skeleton-type details-skeleton-fill" /><span className="details-skeleton-type details-skeleton-fill" /></div>
            </div>
            <div className="pokemon-species-info details-skeleton-species"><span className="details-skeleton-fill" /><span className="details-skeleton-fill" /><span className="details-skeleton-fill" /></div>
            <div className="pokemon-form-controls"><span className="details-skeleton-control details-skeleton-fill" /></div>
          </div>
        </div>
        <section className="pokemon-evolution pokemon-evolution--linear details-skeleton-evolution" style={{ maxWidth: 754 }}>
          <h3>Evolution Chain</h3>{evolution}
        </section>
        <div className="pokemon-details-data-grid">
          <section className="pokemon-physical-panel">
            <h3>Height &amp; Weight</h3>
            <div className="pokemon-measurement-console">
              <span className="pokemon-measurement-caption">METRIC READOUT</span>
              <dl className="pokemon-measurements">{['Height', 'Weight'].map((label) => <div className="pokemon-measurement" key={label}><dt>{label}</dt><dd><span className="pokemon-measurement-visual"><span className="pokemon-measurement-value details-skeleton-fill">&nbsp;</span></span></dd></div>)}</dl>
              <div className="pokemon-measurement-ruler"><span /><span /><span /></div>
            </div>
          </section>
          <section className="pokemon-stats">
            <h3>Base stats</h3><p className="pokemon-stats-scale">Bar scale: 0–255</p>
            <ul className="pokemon-stats-list">{['HP', 'Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed'].map((name) => <li key={name}><div className="pokemon-stat-label"><span>{name}</span><span className="details-skeleton-fill">&nbsp;&nbsp;&nbsp;</span></div><div className="pokemon-stat-track details-skeleton-fill" /></li>)}</ul>
          </section>
          <section className="pokemon-abilities">
            <h3>Abilities</h3><ul className="pokemon-abilities-list">{[0, 1].map((index) => <li className="pokemon-ability" key={index}><span className="pokemon-ability-icon details-skeleton-fill" /><div className="pokemon-ability-content"><span className="pokemon-ability-name details-skeleton-fill">&nbsp;</span><span className="pokemon-ability-badge details-skeleton-fill">&nbsp;</span></div></li>)}</ul>
          </section>
        </div>
      </div>
    </div>
  )
}
