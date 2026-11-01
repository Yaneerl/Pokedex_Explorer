import type { PokemonDetailsData, PokemonResponse } from '../types/pokemon.ts'
import { toPokemonStats } from './pokemonStats.ts'
import { decimetersToMeters, hectogramsToKilograms } from './convertPokemonMeasurements.ts'

export default function toPokemonDetails(data: PokemonResponse): PokemonDetailsData {
  return {
    id: data.id,
    name: data.name,
    speciesUrl: data.species.url,
    heightMeters: decimetersToMeters(data.height),
    weightKg: hectogramsToKilograms(data.weight),
    abilities: data.abilities.map((entry) => ({
      name: entry.ability.name,
      isHidden: entry.is_hidden,
      slot: entry.slot,
    })),
    stats: toPokemonStats(data),
    types: data.types.map((entry) => entry.type.name),
    shinyImage: data.sprites.other?.['official-artwork']?.front_shiny ?? data.sprites.front_shiny ?? null,
    image: data.sprites.other?.['official-artwork']?.front_default ?? data.sprites.front_default,
  }
}
