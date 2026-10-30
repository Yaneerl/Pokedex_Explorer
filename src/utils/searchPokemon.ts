import type { PokemonSummary } from '../types/pokemon.ts'

// App trims and lowercases the query before its debounced search runs.
export default function searchPokemon(
  pokemon: PokemonSummary[],
  query: string
): PokemonSummary[] {
  if (!query) return pokemon

  if (/^\d+$/.test(query)) {
    return pokemon.filter((item) => item.id === Number(query))
  }

  return pokemon.filter((item) => item.name.includes(query))
}
