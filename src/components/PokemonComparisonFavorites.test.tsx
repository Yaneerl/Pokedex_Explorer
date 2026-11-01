import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { PokemonResponse, PokemonSummary } from '../types/pokemon.ts'
import { FAVORITES_STORAGE_KEY } from '../utils/favorites.ts'
import PokemonComparison from './PokemonComparison.tsx'

const index: PokemonSummary[] = [{ id: 1, name: 'bulbasaur' }, { id: 6, name: 'charizard' }, { id: 25, name: 'pikachu' }]
function data(id: number): Pick<PokemonResponse, 'id' | 'name' | 'types' | 'sprites' | 'stats'> {
  const summary = index.find((item) => item.id === id)
  if (!summary) throw new Error('Unexpected fixture ID')
  return { ...summary, types: [{ type: { name: id === 6 ? 'fire' : 'electric', url: '/type/' } }],
    stats: [
      { base_stat: 45, stat: { name: 'hp' } }, { base_stat: 49, stat: { name: 'attack' } },
      { base_stat: 49, stat: { name: 'defense' } }, { base_stat: 65, stat: { name: 'special-attack' } },
      { base_stat: 65, stat: { name: 'special-defense' } }, { base_stat: 45, stat: { name: 'speed' } },
    ],
    sprites: { front_default: '/sprite-' + id + '.png', front_shiny: null } }
}
function mockApi() {
  const mock = vi.fn<typeof fetch>(async (input) => Response.json(data(Number(String(input).split('/').at(-1)))))
  vi.stubGlobal('fetch', mock)
  return mock
}
function showComparison(indexError: string | null = null) {
  return render(<MemoryRouter initialEntries={['/compare']}><Routes>
    <Route path="/compare" element={<PokemonComparison pokemonIndex={index} indexLoading={false} indexError={indexError} />} />
    <Route path="/" element={<h1>Catalog destination</h1>} />
  </Routes></MemoryRouter>)
}
function slot(number: number) { return within(screen.getByRole('region', { name: 'Pokémon ' + number })) }
function mode(number: number, name: 'My Favorites' | 'Search Pokémon') {
  fireEvent.click(slot(number).getByRole('button', { name }))
}
function choose(number: number, name: string) {
  fireEvent.click(slot(number).getByRole('button', { name: 'Select ' + name + ' for Pokémon ' + number }))
}
function selected(number: number) { return within(slot(number).getByRole('article', { name: 'Selected Pokémon ' + number })) }

beforeEach(() => window.localStorage.removeItem(FAVORITES_STORAGE_KEY))
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.localStorage.removeItem(FAVORITES_STORAGE_KEY)
})

test('loads the saved API metadata lazily once for both lists and selects independently without refetching or writing storage', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6,25]')
  const fetchMock = mockApi()
  const writeSpy = vi.spyOn(Storage.prototype, 'setItem')
  showComparison()
  expect(fetchMock).not.toHaveBeenCalled()
  mode(1, 'My Favorites')
  expect(slot(1).getByRole('status').textContent).toBe('Loading favorites...')
  const list = await slot(1).findByRole('list')
  expect(within(list).getAllByRole('button')).toHaveLength(2)
  expect(within(list).getByText('#0006 · charizard')).toBeTruthy()
  expect(within(list).getByRole('img', { name: 'charizard official artwork' }).getAttribute('src')).toBe('/sprite-6.png')
  choose(1, 'charizard')
  expect(selected(1).getByText('#0006')).toBeTruthy()
  expect(selected(1).getByText('fire')).toBeTruthy()
  mode(2, 'My Favorites')
  choose(2, 'pikachu')
  expect(selected(2).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
  expect(selected(1).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(writeSpy).not.toHaveBeenCalled()
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[6,25]')
})

test('preserves the other side and search text while switching sources and replacing selections in either direction', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6,25]')
  mockApi()
  showComparison()
  fireEvent.change(screen.getByLabelText('Search Pokémon 1'), { target: { value: 'bulb' } })
  mode(1, 'My Favorites')
  await slot(1).findByRole('list')
  choose(1, 'charizard')
  fireEvent.change(screen.getByLabelText('Search Pokémon 2'), { target: { value: '25' } })
  choose(2, 'pikachu')
  await slot(2).findByRole('article')
  mode(1, 'Search Pokémon')
  expect((screen.getByLabelText('Search Pokémon 1') as HTMLInputElement).value).toBe('bulb')
  choose(1, 'bulbasaur')
  await slot(1).findByRole('heading', { name: 'bulbasaur' })
  expect(selected(2).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
  mode(2, 'My Favorites')
  choose(2, 'charizard')
  expect(selected(1).getByRole('heading', { name: 'bulbasaur' })).toBeTruthy()
  expect(selected(2).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  mode(1, 'My Favorites')
  expect(selected(1).getByRole('heading', { name: 'bulbasaur' })).toBeTruthy()
  expect(slot(1).getByRole('button', { name: 'My Favorites' }).getAttribute('aria-pressed')).toBe('true')
  expect(slot(1).getByRole('button', { name: 'Search Pokémon' }).getAttribute('aria-pressed')).toBe('false')
})

test('rejects duplicates across favorites and search in both directions and preserves previous selections', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6,25]')
  const fetchMock = mockApi()
  showComparison()
  mode(1, 'My Favorites')
  await slot(1).findByRole('list')
  choose(1, 'charizard')
  fireEvent.change(screen.getByLabelText('Search Pokémon 2'), { target: { value: '25' } })
  choose(2, 'pikachu')
  await slot(2).findByRole('article')
  choose(1, 'pikachu')
  expect(slot(1).getByRole('alert').textContent).toContain('Choose a different Pokémon.')
  fireEvent.change(screen.getByLabelText('Search Pokémon 2'), { target: { value: '6' } })
  choose(2, 'charizard')
  expect(slot(2).getByRole('alert').textContent).toContain('Choose a different Pokémon.')
  expect(selected(1).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  expect(selected(2).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
  expect(fetchMock).toHaveBeenCalledTimes(3)
  mode(2, 'My Favorites')
  choose(2, 'charizard')
  expect(slot(2).getByRole('alert').textContent).toContain('Choose a different Pokémon.')
  expect(selected(2).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
})

test('rejects a favorite already loading on the other side and cancels superseded search requests when choosing a favorite', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6,25]')
  const fetchMock = mockApi()
  showComparison()
  mode(1, 'My Favorites')
  await slot(1).findByRole('list')
  let finish: ((response: Response) => void) | undefined
  let signal: AbortSignal | null | undefined
  fetchMock.mockImplementationOnce((_input, init) => new Promise<Response>((resolve) => { finish = resolve; signal = init?.signal }))
  fireEvent.change(screen.getByLabelText('Search Pokémon 2'), { target: { value: '25' } })
  choose(2, 'pikachu')
  choose(1, 'pikachu')
  expect(slot(1).getByRole('alert').textContent).toContain('already selected or loading')
  expect(slot(1).queryByRole('article')).toBeNull()
  mode(2, 'My Favorites')
  choose(2, 'charizard')
  expect(signal?.aborted).toBe(true)
  if (!finish) throw new Error('Expected pending search request')
  await act(async () => finish?.(Response.json(data(25))))
  expect(selected(2).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  choose(1, 'pikachu')
  expect(selected(1).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
})

test.each([null, 'not JSON', '[null,-1,"25"]'])('shows a safe empty state for missing or invalid saved favorites: %s', (stored) => {
  if (stored !== null) window.localStorage.setItem(FAVORITES_STORAGE_KEY, stored)
  const fetchMock = mockApi()
  showComparison()
  mode(1, 'My Favorites')
  expect(slot(1).getByText(/No favorites yet/)).toBeTruthy()
  expect(slot(1).queryByRole('list')).toBeNull()
  expect(fetchMock).not.toHaveBeenCalled()
  fireEvent.click(slot(1).getByRole('link', { name: 'Explore Pokémon' }))
  expect(screen.getByRole('heading', { name: 'Catalog destination' })).toBeTruthy()
})

test('reports blocked localStorage while regular search remains usable', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
  mockApi()
  showComparison()
  mode(1, 'My Favorites')
  expect(slot(1).getByRole('alert').textContent).toContain('Favorites could not be read')
  fireEvent.change(screen.getByLabelText('Search Pokémon 2'), { target: { value: '25' } })
  choose(2, 'pikachu')
  await slot(2).findByRole('article')
  expect(selected(2).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
})

test('handles failed favorites loading without losing a search selection or disabling search', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6]')
  const fetchMock = mockApi()
  showComparison()
  fireEvent.change(screen.getByLabelText('Search Pokémon 2'), { target: { value: '25' } })
  choose(2, 'pikachu')
  await slot(2).findByRole('article')
  fetchMock.mockImplementationOnce(async () => new Response(null, { status: 503 }))
  mode(1, 'My Favorites')
  expect((await slot(1).findByRole('alert')).textContent).toContain('Failed to load favorite Pokémon #6.')
  expect(selected(2).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
  mode(1, 'Search Pokémon')
  fireEvent.change(screen.getByLabelText('Search Pokémon 1'), { target: { value: '1' } })
  choose(1, 'bulbasaur')
  await slot(1).findByRole('article')
  expect(slot(1).queryByRole('alert')).toBeNull()
})

test('aborts shared favorites loading on unmount and ignores a late response', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6]')
  let signal: AbortSignal | null | undefined
  let finish: ((response: Response) => void) | undefined
  vi.stubGlobal('fetch', vi.fn<typeof fetch>((_input, init) => new Promise<Response>((resolve) => { signal = init?.signal; finish = resolve })))
  const view = showComparison()
  mode(1, 'My Favorites')
  mode(2, 'My Favorites')
  expect(screen.getAllByRole('status')).toHaveLength(2)
  view.unmount()
  expect(signal?.aborted).toBe(true)
  await act(async () => finish?.(Response.json(data(6))))
})

test('keeps favorites usable when the search index fails', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6]')
  mockApi()
  showComparison('Search unavailable')
  expect((screen.getByLabelText('Search Pokémon 1') as HTMLInputElement).disabled).toBe(true)
  mode(1, 'My Favorites')
  await slot(1).findByRole('list')
  choose(1, 'charizard')
  expect(selected(1).getByRole('heading', { name: 'charizard' })).toBeTruthy()
})

test('rejects mismatched favorite API data instead of selecting the wrong Pokémon', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6]')
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => Response.json(data(25))))
  showComparison()
  mode(1, 'My Favorites')
  expect((await slot(1).findByRole('alert')).textContent).toContain('Unexpected favorite Pokémon data.')
  expect(slot(1).queryByRole('list')).toBeNull()
})
