import type { PokemonSpeciesResult } from '../hooks/usePokemonSpecies.ts'
import getPokemonSpeciesInfo from '../utils/getPokemonSpeciesInfo.ts'

interface PokemonSpeciesInfoProps {
  species: PokemonSpeciesResult
}

export default function PokemonSpeciesInfo({ species }: PokemonSpeciesInfoProps) {
  const info = getPokemonSpeciesInfo(species.data)
  return (
    <section className="pokemon-species-info" aria-label="Pokédex entry">
      <dl className="pokemon-genus"><dt>Genus</dt><dd>{species.loading ? 'Loading...' : info.genus ?? 'Genus unavailable'}</dd></dl>
      <p className="details-section-code" aria-hidden="true">POKÉDEX ENTRY / FIELD NOTES</p>
      {species.loading ? <p role="status">Loading species information...</p> : (
        <p className="pokemon-description">{info.description ?? 'An English Pokédex description is not available for this Pokémon.'}</p>
      )}
      {species.error && <p role="alert">Error: {species.error}</p>}
    </section>
  )
}
