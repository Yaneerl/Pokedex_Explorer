import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { PokemonResponse } from '../types/pokemon.ts'
import { FAVORITES_STORAGE_KEY } from '../utils/favorites.ts'
import PokemonFavorites from './PokemonFavorites.tsx'

type CardResponse = Pick<PokemonResponse, 'id' | 'name' | 'types' | 'sprites'>
const cards: Record<number, CardResponse> = {
  6: {
    id: 6, name: 'charizard', types: [{ type: { name: 'fire', url: '/type/10/' } }, { type: { name: 'flying', url: '/type/3/' } }],
    sprites: { front_default: '/sprite-6.png', front_shiny: null, other: { 'official-artwork': { front_default: '/artwork-6.png', front_shiny: null } } },
  },
  25: {
    id: 25, name: 'pikachu', types: [{ type: { name: 'electric', url: '/type/13/' } }],
    sprites: { front_default: '/sprite-25.png', front_shiny: null },
  },
}

function mockApi() {
  const mock = vi.fn<typeof fetch>(async (input) => {
    const id = Number(String(input).split('/').at(-1))
    const data = cards[id]
    if (!data) throw new Error('Unexpected Pokémon request: ' + String(input))
    return Response.json(data)
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

function showFavorites() {
  return render(
    <MemoryRouter initialEntries={['/favorites']}>
      <Routes>
        <Route path="/favorites" element={<PokemonFavorites />} />
        <Route path="/" element={<h1>Catalog destination</h1>} />
        <Route path="/pokemon/6" element={<h1>Charizard details destination</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => window.localStorage.removeItem(FAVORITES_STORAGE_KEY))
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.localStorage.removeItem(FAVORITES_STORAGE_KEY)
})

test('loads saved Pokémon with API images, names, Pokédex numbers and types', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6,25]')
  mockApi()
  showFavorites()
  expect(screen.getByRole('status').textContent).toBe('Loading favorites...')

  const list = await screen.findByRole('list', { name: 'Favorite Pokémon' })
  expect(within(list).getAllByRole('listitem')).toHaveLength(2)
  expect(within(list).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  expect(within(list).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
  expect(within(list).getByText('#0006')).toBeTruthy()
  expect(within(list).getByText('#0025')).toBeTruthy()
  expect(within(list).getByText('fire')).toBeTruthy()
  expect(within(list).getByText('flying')).toBeTruthy()
  expect(within(list).getByText('electric')).toBeTruthy()
  expect(within(list).getByRole('img', { name: 'charizard official artwork' }).getAttribute('src')).toBe('/artwork-6.png')
  expect(within(list).getByRole('img', { name: 'pikachu official artwork' }).getAttribute('src')).toBe('/sprite-25.png')
  expect(screen.queryByRole('status')).toBeNull()
})

test('removes cards immediately without navigating or refetching and shows Empty State after the last removal', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6,25]')
  const fetchMock = mockApi()
  showFavorites()
  const remove = await screen.findByRole('button', { name: 'Remove Charizard from favorites' })
  fireEvent.keyDown(remove, { key: 'Enter' })
  expect(screen.getByRole('heading', { name: 'Favorites' })).toBeTruthy()
  fireEvent.click(remove)
  expect(screen.queryByRole('button', { name: 'View charizard details' })).toBeNull()
  expect(screen.getByRole('button', { name: 'View pikachu details' })).toBeTruthy()
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[25]')

  fireEvent.click(screen.getByRole('button', { name: 'Remove Pikachu from favorites' }))
  expect(screen.getByText(/No favorites yet/)).toBeTruthy()
  expect(screen.queryByRole('list', { name: 'Favorite Pokémon' })).toBeNull()
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[]')
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

test.each([
  { label: 'missing', value: null },
  { label: 'corrupt', value: '{broken' },
])('shows Empty State and a catalog link for $label storage without API requests', ({ value }) => {
  if (value !== null) window.localStorage.setItem(FAVORITES_STORAGE_KEY, value)
  const fetchMock = mockApi()
  showFavorites()
  expect(screen.getByText(/No favorites yet/)).toBeTruthy()
  const link = screen.getByRole('link', { name: 'Explore Pokémon' })
  expect(link.getAttribute('href')).toBe('/')
  expect(fetchMock).not.toHaveBeenCalled()
  fireEvent.click(link)
  expect(screen.getByRole('heading', { name: 'Catalog destination' })).toBeTruthy()
})

test.each(['click', 'Enter', ' '])('opens the correct details route using %s on a favorite card', async (action) => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6]')
  mockApi()
  showFavorites()
  const card = await screen.findByRole('button', { name: 'View charizard details' })
  if (action === 'click') fireEvent.click(card)
  else fireEvent.keyDown(card, { key: action })
  expect(await screen.findByRole('heading', { name: 'Charizard details destination' })).toBeTruthy()
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[6]')
})

test('shows a failed API request as an error rather than a misleading empty list', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6]')
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => new Response(null, { status: 503 })))
  showFavorites()
  expect((await screen.findByRole('alert')).textContent).toBe('Error: Failed to load favorite Pokémon #6.')
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.queryByText(/No favorites yet/)).toBeNull()
  expect(screen.getByRole('link', { name: '← Back to Pokédex' })).toBeTruthy()
})

test('reports unavailable localStorage without crashing or fetching', () => {
  const fetchMock = mockApi()
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError') })
  showFavorites()
  expect(screen.getByRole('alert').textContent).toBe('Error: Favorites could not be read in this browser.')
  expect(screen.queryByText(/No favorites yet/)).toBeNull()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('keeps a card after a failed removal write and removes it only when retry succeeds', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6,25]')
  mockApi()
  showFavorites()
  const remove = await screen.findByRole('button', { name: 'Remove Charizard from favorites' })
  const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })
  fireEvent.click(remove)
  expect(screen.getByRole('alert').textContent).toBe('Favorites could not be saved in this browser.')
  expect(screen.getByRole('button', { name: 'View charizard details' })).toBeTruthy()
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[6,25]')

  blocked.mockRestore()
  fireEvent.click(remove)
  expect(screen.queryByRole('button', { name: 'View charizard details' })).toBeNull()
  expect(screen.getByRole('button', { name: 'View pikachu details' })).toBeTruthy()
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[25]')
})

test('aborts pending Pokémon requests when leaving the Favorites page', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6,25]')
  const signals: AbortSignal[] = []
  vi.stubGlobal('fetch', vi.fn<typeof fetch>((_input, init) => new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal
    if (!signal) throw new Error('Expected AbortSignal')
    signals.push(signal)
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  })))
  const view = showFavorites()
  await waitFor(() => expect(signals).toHaveLength(2))
  expect(screen.getByRole('status')).toBeTruthy()
  view.unmount()
  expect(signals.every((signal) => signal.aborted)).toBe(true)
})
