import { expect, test } from 'vitest'
import type { PokemonSummary } from '../types/pokemon.ts'
import searchPokemon from './searchPokemon.ts'

const pokemon: PokemonSummary[] = [
  { id: 1, name: 'bulbasaur' },
  { id: 2, name: 'ivysaur' },
  { id: 3, name: 'venusaur' },
  { id: 4, name: 'charmander' },
  { id: 25, name: 'pikachu' },
  { id: 125, name: 'electabuzz' },
  { id: 252, name: 'treecko' },
]

test('finds all Pokemon whose name contains the search text', () => {
  expect(searchPokemon(pokemon, 'saur')).toEqual([
    { id: 1, name: 'bulbasaur' },
    { id: 2, name: 'ivysaur' },
    { id: 3, name: 'venusaur' },
  ])
})

test('matches the exact Pokedex number rather than IDs containing its digits', () => {
  expect(searchPokemon(pokemon, '25')).toEqual([
    { id: 25, name: 'pikachu' },
  ])
})
