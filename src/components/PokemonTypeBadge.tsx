import '../styles/pokemon-type-badge.css'
import { getPokemonTypeStyle, getPokemonTypeTheme } from '../utils/pokemonTypeTheme.ts'

interface PokemonTypeBadgeProps {
  type: string
}

export default function PokemonTypeBadge({ type }: PokemonTypeBadgeProps) {
  return (
    <span className="type-chip pokemon-type-badge" style={getPokemonTypeStyle(type)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d={getPokemonTypeTheme(type).iconPath} />
      </svg>
      <span>{type}</span>
    </span>
  )
}
