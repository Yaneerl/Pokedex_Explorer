import type { Pokemon, PokemonResponse } from '../types/pokemon.ts'
import toPokemonCard from './toPokemonCard.ts'

export default async function loadFavoritePokemon(ids: readonly number[], signal: AbortSignal): Promise<Pokemon[]> {
  return Promise.all(ids.map(async (id) => {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/' + id, { signal })
    if (!response.ok) throw new Error('Failed to load favorite Pokémon #' + id + '.')
    const data: PokemonResponse = await response.json()
    if (data.id !== id) throw new Error('Unexpected favorite Pokémon data.')
    return toPokemonCard(data)
  }))
}
