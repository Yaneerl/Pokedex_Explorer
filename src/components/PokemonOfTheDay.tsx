import { useId, useState } from 'react'
import { Link } from 'react-router'
import type { DailyPokemonResult } from '../hooks/usePokemonOfTheDay.ts'
import PokemonArtworkImage from './PokemonArtworkImage.tsx'
import PokemonTypeBadge from './PokemonTypeBadge.tsx'
import InterfaceIcon from './InterfaceIcon.tsx'
import { getPokemonTypeStyle } from '../utils/pokemonTypeTheme.ts'

interface PokemonOfTheDayProps { daily: DailyPokemonResult }

export default function PokemonOfTheDay({ daily }: PokemonOfTheDayProps) {
  const titleId = useId()
  const [failedImage, setFailedImage] = useState<string | null>(null)
  const { pokemon, loading, error, retry, storageWarning, canRetry } = daily
  const source = pokemon?.image
  return (
    <section className="pokemon-of-the-day" aria-labelledby={titleId} style={getPokemonTypeStyle(pokemon?.types[0] ?? 'normal')}>
      <h2 id={titleId} className="daily-heading"><span aria-hidden="true" />Pokémon of the Day</h2>
      {loading ? <div className="daily-state" role="status">Scanning today’s Pokémon…</div> : error ? (
        <div className="daily-state"><p role="alert">{error}</p>{canRetry && <button className="device-control" type="button" onClick={retry}>Try Again</button>}</div>
      ) : pokemon ? (
        <div className="daily-content">
          <div className="daily-artwork">
            {source && source !== failedImage ? <PokemonArtworkImage inset={6} key={source} source={source} alt={pokemon.name + ' — Pokémon of the Day'} onError={() => setFailedImage(source)} /> : <span className="daily-image-fallback">Image unavailable</span>}
          </div>
          <div className="daily-info">
            <span className="daily-number">#{String(pokemon.id).padStart(4, '0')}</span>
            <h3>{pokemon.name.replaceAll('-', ' ')}</h3>
            <div className="daily-types" role="group" aria-label="Daily Pokémon types">{pokemon.types.map((type) => <PokemonTypeBadge key={type} type={type} />)}</div>
            <Link className="device-control daily-view" to={'/pokemon/' + pokemon.id}>View Pokémon<InterfaceIcon name="next" /></Link>
          </div>
        </div>
      ) : null}
      {pokemon && storageWarning && <p className="daily-storage-note">Daily pick is kept for this visit.</p>}
    </section>
  )
}
