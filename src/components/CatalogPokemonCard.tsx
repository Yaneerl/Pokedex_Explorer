import { useState } from 'react'
import type { Pokemon } from '../types/pokemon.ts'
import { getPokemonTypeStyle } from '../utils/pokemonTypeTheme.ts'
import PokemonFavoriteButton from './PokemonFavoriteButton.tsx'
import PokemonTypeBadge from './PokemonTypeBadge.tsx'
import '../styles/catalog-cards.css'

interface CatalogPokemonCardProps {
  pokemon: Pokemon
  onSelect: (pokemon: Pokemon) => void
}

export default function CatalogPokemonCard({ pokemon, onSelect }: CatalogPokemonCardProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null)
  const primaryType = pokemon.types[0] ?? 'normal'

  return (
    <li className="pokemon-card catalog-card" data-primary-type={primaryType} style={getPokemonTypeStyle(primaryType)}>
      <div className="catalog-card-content">
        <div className="catalog-card-topbar">
          <span className="pokemon-number">#{String(pokemon.id).padStart(4, '0')}</span>
          <span className="catalog-card-signal" aria-hidden="true"><span /><span /><span /></span>
        </div>
        <div className="catalog-card-artwork">
          {pokemon.image && failedImage !== pokemon.image ? (
            <img src={pokemon.image} alt={pokemon.name + ' official artwork'} width="168" height="168" loading="lazy" onError={() => setFailedImage(pokemon.image)} />
          ) : (
            <span className="catalog-card-no-image" role="img" aria-label={'No artwork available for ' + pokemon.name}><span aria-hidden="true" />No image</span>
          )}
        </div>
        <h3 title={pokemon.name}>{pokemon.name}</h3>
        <div className="pokemon-types">
          {pokemon.types.map((type) => <PokemonTypeBadge key={type} type={type} />)}
        </div>
      </div>
      <button className="catalog-card-open" type="button" aria-label={'View ' + pokemon.name + ' details'} onClick={() => onSelect(pokemon)} />
      <PokemonFavoriteButton pokemonId={pokemon.id} name={pokemon.name} compact />
    </li>
  )
}
