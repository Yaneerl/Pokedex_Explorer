import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'
import type { PokemonResponse } from '../types/pokemon.ts'
import PokemonDetails from './PokemonDetails.tsx'

function pokemon(id: number, name: string, shinyArtwork: string | null): PokemonResponse {
  return {
    id, name, height: 7, weight: 69, forms: [],
    species: { name, url: 'https://pokeapi.co/api/v2/pokemon-species/' + id + '/' },
    abilities: [{ ability: { name: 'overgrow', url: '/ability/65/' }, is_hidden: false, slot: 1 }],
    types: [{ type: { name: 'grass', url: '/type/12/' } }],
    stats: [
      { base_stat: 45, stat: { name: 'hp' } },
      { base_stat: 49, stat: { name: 'attack' } },
      { base_stat: 49, stat: { name: 'defense' } },
      { base_stat: 65, stat: { name: 'special-attack' } },
      { base_stat: 65, stat: { name: 'special-defense' } },
      { base_stat: 45, stat: { name: 'speed' } },
    ],
    sprites: {
      front_default: '/sprite-' + id + '.png',
      front_shiny: '/sprite-shiny-' + id + '.png',
      other: { 'official-artwork': { front_default: '/artwork-' + id + '.png', front_shiny: shinyArtwork } },
    },
  }
}

afterEach(() => vi.unstubAllGlobals())

test('uses API artwork and sprite fallback, preserves details on toggle and resets to Normal after route navigation', async () => {
  const first = pokemon(1, 'bulbasaur', '/artwork-shiny-1.png')
  const second = pokemon(2, 'ivysaur', null)
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = String(input)
    if (url === 'https://pokeapi.co/api/v2/pokemon/1') return Response.json(first)
    if (url === 'https://pokeapi.co/api/v2/pokemon/2') return Response.json(second)
    if (url.includes('/pokemon-species/')) {
      const data = url === first.species.url ? first : second
      return Response.json({
        evolution_chain: { url: '/chain/' },
        varieties: [{
          is_default: true,
          pokemon: { name: data.name, url: 'https://pokeapi.co/api/v2/pokemon/' + data.id },
        }],
      })
    }
    if (url === '/chain/') return Response.json({ chain: { species: first.species, evolves_to: [] } })
    throw new Error('Unexpected request: ' + url)
  })
  vi.stubGlobal('fetch', fetchMock)
  render(
    <MemoryRouter initialEntries={['/pokemon/1']}>
      <Link to="/pokemon/2">Next Pokémon</Link>
      <Routes><Route path="/pokemon/:id" element={<PokemonDetails />} /></Routes>
    </MemoryRouter>,
  )

  expect((await screen.findByRole('img', { name: 'bulbasaur Normal artwork' })).getAttribute('src')).toBe('/artwork-1.png')
  await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
  const requestsBeforeToggle = fetchMock.mock.calls.length
  fireEvent.click(screen.getByRole('button', { name: 'Shiny' }))
  expect(screen.getByRole('img', { name: 'bulbasaur Shiny artwork' }).getAttribute('src')).toBe('/artwork-shiny-1.png')
  expect(fetchMock.mock.calls.length).toBe(requestsBeforeToggle)
  expect(screen.getAllByRole('meter')).toHaveLength(6)
  expect(screen.getByText('Overgrow')).toBeTruthy()
  expect(screen.getByText('0.7 m')).toBeTruthy()
  expect(screen.getByText('6.9 kg')).toBeTruthy()

  fireEvent.click(screen.getByRole('link', { name: 'Next Pokémon' }))
  expect((await screen.findByRole('img', { name: 'ivysaur Normal artwork' })).getAttribute('src')).toBe('/artwork-2.png')
  expect(screen.getByRole('button', { name: 'Normal' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'Shiny' }))
  expect(screen.getByRole('img', { name: 'ivysaur Shiny artwork' }).getAttribute('src')).toBe('/sprite-shiny-2.png')
})
