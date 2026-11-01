import type { Pokemon, PokemonResponse } from '../types/pokemon.ts'

export default function toPokemonCard(data: PokemonResponse): Pokemon {
  return {
    id: data.id,
    name: data.name,
    types: data.types.map((entry) => entry.type.name),
    image: data.sprites.other?.['official-artwork']?.front_default ?? data.sprites.front_default,
  }
}
