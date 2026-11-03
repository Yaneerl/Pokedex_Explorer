import type { PokemonResponse, PokemonSpeciesResponse, PokemonFormResponse, PokemonStatName } from '../types/pokemon.ts'

export const pokemonApiUrl = (resource: string, id: number): string => 'https://pokeapi.co/api/v2/' + resource + '/' + id
export const requestUrl = (input: Parameters<typeof fetch>[0]): string => input instanceof Request ? input.url : String(input)

const records: Record<number, { name: string; types: string[]; stats: number[]; height: number; weight: number; ability: string; speciesId?: number }> = {
  1: { name: 'bulbasaur', types: ['grass', 'poison'], stats: [45, 49, 49, 65, 65, 45], height: 7, weight: 69, ability: 'overgrow' },
  2: { name: 'ivysaur', types: ['grass', 'poison'], stats: [60, 62, 63, 80, 80, 60], height: 10, weight: 130, ability: 'overgrow' },
  3: { name: 'venusaur', types: ['grass', 'poison'], stats: [80, 82, 83, 100, 100, 80], height: 20, weight: 1000, ability: 'overgrow' },
  6: { name: 'charizard', types: ['fire', 'flying'], stats: [78, 84, 78, 109, 85, 100], height: 17, weight: 905, ability: 'blaze' },
  25: { name: 'pikachu', types: ['electric'], stats: [35, 55, 40, 50, 50, 90], height: 4, weight: 60, ability: 'static' },
  26: { name: 'raichu', types: ['electric'], stats: [60, 90, 55, 90, 80, 110], height: 8, weight: 300, ability: 'static' },
  125: { name: 'electabuzz', types: ['electric'], stats: [65, 83, 57, 95, 85, 105], height: 11, weight: 300, ability: 'static' },
  252: { name: 'treecko', types: ['grass'], stats: [40, 45, 35, 65, 55, 70], height: 5, weight: 50, ability: 'overgrow' },
  10034: { name: 'charizard-mega-x', types: ['fire', 'dragon'], stats: [78, 130, 111, 130, 85, 100], height: 17, weight: 1105, ability: 'tough-claws', speciesId: 6 },
  10035: { name: 'charizard-mega-y', types: ['fire', 'flying'], stats: [78, 104, 78, 159, 115, 100], height: 17, weight: 1005, ability: 'drought', speciesId: 6 },
}
const statNames: PokemonStatName[] = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']

export function pokemonFixture(id: number): PokemonResponse {
  const data = records[id]
  if (!data) throw new Error('Unknown Pokémon fixture: ' + id)
  const speciesId = data.speciesId ?? id
  const species = records[speciesId]
  if (!species) throw new Error('Unknown species fixture: ' + speciesId)
  return {
    id, name: data.name, height: data.height, weight: data.weight,
    species: { name: species.name, url: pokemonApiUrl('pokemon-species', speciesId) },
    forms: [{ name: data.name, url: pokemonApiUrl('pokemon-form', id) }],
    abilities: [{ ability: { name: data.ability, url: '/ability/' + data.ability }, is_hidden: false, slot: 1 }],
    stats: statNames.map((name, i) => ({ stat: { name }, base_stat: data.stats[i]! })),
    types: data.types.map((name) => ({ type: { name, url: '/type/' + name } })),
    sprites: { front_default: '/sprite-' + id + '.png', front_shiny: '/shiny-' + id + '.png',
      other: { 'official-artwork': { front_default: '/artwork-' + id + '.png', front_shiny: '/artwork-shiny-' + id + '.png' } } },
  }
}

export function pokemonSpeciesFixture(id: number): PokemonSpeciesResponse {
  const regular = pokemonFixture(id)
  return {
    is_legendary: false, is_mythical: false, evolution_chain: null,
    varieties: [id, ...(id === 6 ? [10034, 10035] : [])].map((formId) => ({
      is_default: formId === id,
      pokemon: { name: pokemonFixture(formId).name, url: pokemonApiUrl('pokemon', formId) },
    })),
    genera: [{ genus: regular.name + ' fixture', language: { name: 'en', url: '/language/9' } }],
    flavor_text_entries: [],
  }
}

/** Route every modeled endpoint explicitly; unexpected requests fail instead of receiving the wrong shape. */
export function pokemonApiResponse(input: Parameters<typeof fetch>[0], regularPokemon = pokemonFixture): Response {
  const url = new URL(requestUrl(input))
  const match = /^\/api\/v2\/(pokemon|pokemon-species|pokemon-form)\/(\d+)\/?$/.exec(url.pathname)
  if (url.origin !== 'https://pokeapi.co' || !match) throw new Error('Unexpected fixture request: ' + url.href)
  const id = Number(match[2])
  if (match[1] === 'pokemon') return Response.json(id >= 10000 ? pokemonFixture(id) : regularPokemon(id))
  if (match[1] === 'pokemon-species') return Response.json(pokemonSpeciesFixture(id))
  const data: PokemonFormResponse = { is_mega: id === 10034 || id === 10035,
    names: [{ name: id === 10034 ? 'Mega Charizard X' : id === 10035 ? 'Mega Charizard Y' : pokemonFixture(id).name,
      language: { name: 'en', url: '/language/9' } }] }
  return Response.json(data)
}
