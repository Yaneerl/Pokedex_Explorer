import { expect, test } from 'vitest'
import type { EvolutionChainLink } from '../types/pokemon.ts'
import buildEvolutionTree from './buildEvolutionTree.ts'

function link(id: number, name: string, children: EvolutionChainLink[] = []): EvolutionChainLink {
  return {
    species: { name, url: 'https://pokeapi.co/api/v2/pokemon-species/' + id + '/' },
    evolves_to: children,
  }
}

test('preserves the order and connections of a three-stage evolution chain', () => {
  const chain = link(1, 'bulbasaur', [link(2, 'ivysaur', [link(3, 'venusaur')])])

  expect(buildEvolutionTree(chain)).toEqual({
    id: 1, name: 'bulbasaur', children: [{
      id: 2, name: 'ivysaur', children: [{ id: 3, name: 'venusaur', children: [] }],
    }],
  })
})

test('keeps all eight Eevee evolutions as separate sibling branches', () => {
  const chain = link(133, 'eevee', [
    link(134, 'vaporeon'), link(135, 'jolteon'), link(136, 'flareon'),
    link(196, 'espeon'), link(197, 'umbreon'), link(470, 'leafeon'),
    link(471, 'glaceon'), link(700, 'sylveon'),
  ])

  expect(buildEvolutionTree(chain)).toEqual({
    id: 133, name: 'eevee', children: [
      { id: 134, name: 'vaporeon', children: [] },
      { id: 135, name: 'jolteon', children: [] },
      { id: 136, name: 'flareon', children: [] },
      { id: 196, name: 'espeon', children: [] },
      { id: 197, name: 'umbreon', children: [] },
      { id: 470, name: 'leafeon', children: [] },
      { id: 471, name: 'glaceon', children: [] },
      { id: 700, name: 'sylveon', children: [] },
    ],
  })
})

test('preserves a Pokémon without evolutions as a single stage', () => {
  expect(buildEvolutionTree(link(150, 'mewtwo'))).toEqual({
    id: 150, name: 'mewtwo', children: [],
  })
})
