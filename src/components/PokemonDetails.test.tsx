import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
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


function showSpeciesDetails() {
  return render(<MemoryRouter initialEntries={['/pokemon/1']}>
    <Link to="/pokemon/2">Next Pokémon</Link>
    <Routes><Route path="/pokemon/:id" element={<PokemonDetails />} /></Routes>
  </MemoryRouter>)
}

function speciesFixture(id: number, name: string) {
  return {
    varieties: [{ is_default: true, pokemon: { name, url: 'https://pokeapi.co/api/v2/pokemon/' + id } }],
    evolution_chain: { url: '/chain/' + id },
    genera: [{ genus: 'Seed Pokémon', language: { name: 'en', url: '/language/en' } }],
    flavor_text_entries: [
      { flavor_text: name + ' has a seed\non its back.\f', language: { name: 'en', url: '/language/en' } },
      { flavor_text: name + ' has a seed on its back.', language: { name: 'en', url: '/language/en' } },
    ],
  }
}

function speciesResponse(input: RequestInfo | URL): Response {
  const url = String(input)
  const id = url.includes('/2') ? 2 : 1
  const name = id === 1 ? 'bulbasaur' : 'ivysaur'
  if (url.includes('/pokemon-species/')) return Response.json(speciesFixture(id, name))
  if (url.startsWith('/chain/')) return Response.json({ chain: { species: { name, url: '/pokemon-species/' + id + '/' }, evolves_to: [] } })
  return Response.json(pokemon(id, name, null))
}

test('shares one species response between the English entry, Mega discovery and evolution, with no toggle refetch', async () => {
  const fetchMock = vi.fn<typeof fetch>(async (input) => speciesResponse(input))
  vi.stubGlobal('fetch', fetchMock)
  showSpeciesDetails()
  expect(await screen.findByText('Seed Pokémon')).toBeTruthy()
  await waitFor(() => expect(screen.queryAllByRole('status')).toHaveLength(0))
  expect(screen.getAllByText('bulbasaur has a seed on its back.')).toHaveLength(1)
  expect(screen.queryByRole('region', { name: 'Evolution Chain' })).toBeNull()
  expect(fetchMock.mock.calls.filter(([input]) => String(input).includes('/pokemon-species/'))).toHaveLength(1)
  const before = fetchMock.mock.calls.length
  fireEvent.click(screen.getByRole('button', { name: 'Shiny' }))
  fireEvent.click(screen.getByRole('button', { name: 'Normal' }))
  expect(fetchMock.mock.calls.length).toBe(before)
})

test('displays honest fallbacks when no English species text is supplied', async () => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input) => String(input).includes('/pokemon-species/')
    ? Response.json({ ...speciesFixture(1, 'bulbasaur'), genera: [], flavor_text_entries: [] }) : speciesResponse(input)))
  showSpeciesDetails()
  await waitFor(() => expect(screen.queryAllByRole('status')).toHaveLength(0))
  expect(await screen.findByText('Genus unavailable')).toBeTruthy()
  expect(screen.getByText('An English Pokédex description is not available for this Pokémon.')).toBeTruthy()
  expect(screen.getAllByRole('meter')).toHaveLength(6)
})

test('a failed shared species request leaves the image, measurements and stats usable and ends loading', async () => {
  const mock = vi.fn<typeof fetch>(async (input) => String(input).includes('/pokemon-species/') ? new Response(null, { status: 503 }) : speciesResponse(input))
  vi.stubGlobal('fetch', mock)
  showSpeciesDetails()
  await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0))
  expect(screen.getByRole('img', { name: 'bulbasaur Normal artwork' })).toBeTruthy()
  expect(screen.getAllByRole('meter')).toHaveLength(6)
  expect(screen.getByText('0.7 m')).toBeTruthy()
  expect(screen.queryAllByRole('status')).toHaveLength(0)
  expect(mock.mock.calls.filter(([input]) => String(input).includes('/pokemon-species/'))).toHaveLength(1)
})

test('aborts the shared species request on route change and ignores its late English entry', async () => {
  const pending: { signal: AbortSignal; finish: () => void }[] = []
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
    if (String(input) === 'https://pokeapi.co/api/v2/pokemon-species/1/') {
      if (!init?.signal) throw new Error('Expected AbortSignal')
      const signal = init.signal
      return new Promise<Response>((resolve) => pending.push({ signal, finish: () => resolve(speciesResponse(input)) }))
    }
    return speciesResponse(input)
  }))
  showSpeciesDetails()
  await screen.findByText('Loading species information...')
  expect(pending).toHaveLength(1)
  fireEvent.click(screen.getByRole('link', { name: 'Next Pokémon' }))
  await screen.findByText('ivysaur has a seed on its back.')
  expect(pending[0]?.signal.aborted).toBe(true)
  await act(async () => { pending[0]?.finish() })
  expect(screen.queryByText('bulbasaur has a seed on its back.')).toBeNull()
  expect(screen.getByRole('heading', { name: 'Ivysaur' })).toBeTruthy()
})
