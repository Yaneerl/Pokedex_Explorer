import { expect, test } from 'vitest'
import type { PokemonSpeciesResponse } from '../types/pokemon.ts'
import getPokemonSpeciesInfo from './getPokemonSpeciesInfo.ts'

const language = (name: string) => ({ name, url: '/language/' + name })
const base: PokemonSpeciesResponse = { varieties: [], evolution_chain: null }

test('selects real English genus and one description while normalizing line breaks, form feeds and repeated entries', () => {
  const species = {
    ...base,
    genera: [{ genus: 'Graine', language: language('fr') }, { genus: '  Seed  Pokémon ', language: language('en') }],
    flavor_text_entries: [
      { flavor_text: 'Description française', language: language('fr') },
      { flavor_text: 'A seed\ngrows on\fits back.  ', language: language('en') },
      { flavor_text: 'A seed grows on its back.', language: language('en') },
      { flavor_text: 'Another English entry.', language: language('en') },
    ],
  }
  expect(getPokemonSpeciesInfo(species)).toEqual({ genus: 'Seed Pokémon', description: 'A seed grows on its back.' })
})

test('does not substitute another language or invent information when English is missing', () => {
  expect(getPokemonSpeciesInfo({ ...base, genera: [{ genus: 'Graine', language: language('fr') }], flavor_text_entries: [{ flavor_text: 'Une description.', language: language('fr') }] })).toEqual({ genus: null, description: null })
  expect(getPokemonSpeciesInfo(base)).toEqual({ genus: null, description: null })
  expect(getPokemonSpeciesInfo(null)).toEqual({ genus: null, description: null })
})

test('ignores blank English entries before selecting meaningful data', () => {
  expect(getPokemonSpeciesInfo({ ...base,
    genera: [{ genus: '  ', language: language('en') }, { genus: 'Seed Pokémon', language: language('en') }],
    flavor_text_entries: [{ flavor_text: '\n\f ', language: language('en') }, { flavor_text: 'A valid entry.', language: language('en') }],
  })).toEqual({ genus: 'Seed Pokémon', description: 'A valid entry.' })
})
