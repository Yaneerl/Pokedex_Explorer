import { expect, test } from 'vitest'
import type { GenerationResults, PokemonSummary, TypeResults } from '../types/pokemon.ts'
import { filterPokemonByGeneration, filterPokemonByType } from './filterPokemon.ts'

const pokemon: PokemonSummary[] = [
  { id: 4, name: 'charmander' },
  { id: 6, name: 'charizard' },
  { id: 7, name: 'squirtle' },
  { id: 25, name: 'pikachu' },
  { id: 151, name: 'mew' },
  { id: 155, name: 'cyndaquil' },
  { id: 252, name: 'treecko' },
]

test('filters by the selected type using its API IDs and ignores stale type data', () => {
  const typeResults: TypeResults = {
    type: 'fire',
    ids: new Set([4, 6, 155, 10006]),
  }

  expect(filterPokemonByType(pokemon, 'fire', typeResults)).toEqual([
    { id: 4, name: 'charmander' },
    { id: 6, name: 'charizard' },
    { id: 155, name: 'cyndaquil' },
  ])
  expect(filterPokemonByType(pokemon, 'all', typeResults)).toEqual(pokemon)
  expect(filterPokemonByType(pokemon, 'water', typeResults)).toEqual([])
})

test('filters by the selected generation using its API IDs and ignores stale generation data', () => {
  const generationResults: GenerationResults = {
    generation: '1',
    ids: new Set([4, 6, 7, 25, 151]),
  }

  expect(filterPokemonByGeneration(pokemon, '1', generationResults)).toEqual([
    { id: 4, name: 'charmander' },
    { id: 6, name: 'charizard' },
    { id: 7, name: 'squirtle' },
    { id: 25, name: 'pikachu' },
    { id: 151, name: 'mew' },
  ])
  expect(filterPokemonByGeneration(pokemon, 'all', generationResults)).toEqual(pokemon)
  expect(filterPokemonByGeneration(pokemon, '2', generationResults)).toEqual([])
})
