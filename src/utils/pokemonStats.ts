import type { PokemonResponse, PokemonStat, PokemonStatName } from '../types/pokemon.ts'

export const POKEMON_STAT_NAMES = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const
export const STAT_SCALE_MAX = 255
export const STAT_LABELS: Record<PokemonStatName, string> = {
  hp: 'HP', attack: 'Attack', defense: 'Defense',
  'special-attack': 'Special Attack', 'special-defense': 'Special Defense', speed: 'Speed',
}

export function toPokemonStats(data: Pick<PokemonResponse, 'stats'>): PokemonStat[] {
  if (!Array.isArray(data.stats) || data.stats.length !== POKEMON_STAT_NAMES.length) {
    throw new Error('All six base stats are required for this Pokémon.')
  }
  return POKEMON_STAT_NAMES.map((name) => {
    const entry = data.stats.find((item) => item?.stat?.name === name)
    if (!entry || !Number.isInteger(entry.base_stat) || entry.base_stat < 0 || entry.base_stat > STAT_SCALE_MAX) {
      throw new Error('Invalid or missing base stat: ' + STAT_LABELS[name] + '.')
    }
    return { name, value: entry.base_stat }
  })
}
