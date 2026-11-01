import type { PokemonResponse, PokemonWithStats } from '../types/pokemon.ts'
import toPokemonCard from './toPokemonCard.ts'
import { toPokemonStats } from './pokemonStats.ts'

export default function toPokemonWithStats(data: PokemonResponse): PokemonWithStats {
  return { ...toPokemonCard(data), stats: toPokemonStats(data) }
}
