import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { PokemonResponse, PokemonSummary } from '../types/pokemon.ts'
import { FAVORITES_STORAGE_KEY } from '../utils/favorites.ts'
import PokemonComparison from './PokemonComparison.tsx'
import { pokemonFixture, pokemonSpeciesFixture, pokemonApiResponse, pokemonApiUrl, requestUrl } from '../test/pokemonApiFixtures.ts'

const index: PokemonSummary[] = [{ id: 1, name: 'bulbasaur' }, { id: 6, name: 'charizard' }, { id: 25, name: 'pikachu' }]
function data(id: number): PokemonResponse {
  return { ...pokemonFixture(id), sprites: { front_default: '/sprite-' + id + '.png', front_shiny: null } }
}
function mockApi() {
  const mock = vi.fn<typeof fetch>(async (input) => pokemonApiResponse(input, data))
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
async function ready(n: number) {
  await waitFor(() => expect(slot(n).queryByRole('status')).toBeNull())
}

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
  await ready(1)
  mode(2, 'My Favorites')
  choose(2, 'pikachu')
  await ready(2)
  expect(selected(2).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
  expect(selected(1).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  expect(fetchMock.mock.calls.map(([input]) => requestUrl(input)).sort()).toEqual([
    ...[6, 25, 10034, 10035].map((id) => pokemonApiUrl('pokemon', id)),
    ...[6, 25].map((id) => pokemonApiUrl('pokemon-species', id)),
    ...[10034, 10035].map((id) => pokemonApiUrl('pokemon-form', id)),
  ].sort())
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
  await ready(2)
  mode(1, 'Search Pokémon')
  expect((screen.getByLabelText('Search Pokémon 1') as HTMLInputElement).value).toBe('bulb')
  choose(1, 'bulbasaur')
  await slot(1).findByRole('heading', { name: 'bulbasaur' })
  await ready(1)
  expect(selected(2).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
  mode(2, 'My Favorites')
  choose(2, 'charizard')
  await slot(2).findByRole('heading', { name: 'charizard' })
  await ready(2)
  expect(selected(1).getByRole('heading', { name: 'bulbasaur' })).toBeTruthy()
  expect(selected(2).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  mode(1, 'My Favorites')
  expect(selected(1).getByRole('heading', { name: 'bulbasaur' })).toBeTruthy()
  expect(slot(1).getByRole('button', { name: 'My Favorites' }).getAttribute('aria-pressed')).toBe('true')
  expect(slot(1).getByRole('button', { name: 'Search Pokémon' }).getAttribute('aria-pressed')).toBe('false')
})

test('rejects exact duplicates across favorites and search in both directions and preserves previous selections', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[1,25]')
  const fetchMock = mockApi()
  showComparison()
  mode(1, 'My Favorites')
  await slot(1).findByRole('list')
  choose(1, 'bulbasaur')
  await ready(1)
  fireEvent.change(screen.getByLabelText('Search Pokémon 2'), { target: { value: '25' } })
  choose(2, 'pikachu')
  await ready(2)
  choose(1, 'pikachu')
  expect(slot(1).getByRole('alert').textContent).toContain('Choose a different form.')
  fireEvent.change(screen.getByLabelText('Search Pokémon 2'), { target: { value: '1' } })
  choose(2, 'bulbasaur')
  expect(slot(2).getByRole('alert').textContent).toContain('Choose a different form.')
  expect(selected(1).getByRole('heading', { name: 'bulbasaur' })).toBeTruthy()
  expect(selected(2).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
  expect(fetchMock.mock.calls.map(([input]) => requestUrl(input)).sort()).toEqual([
    ...[1, 25].map((id) => pokemonApiUrl('pokemon', id)),
    ...[1, 25].map((id) => pokemonApiUrl('pokemon-species', id)),
  ].sort())
  mode(2, 'My Favorites')
  choose(2, 'bulbasaur')
  expect(slot(2).getByRole('alert').textContent).toContain('Choose a different form.')
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
  let defer = true
  fetchMock.mockImplementation(async (input, init) => {
    if (requestUrl(input) === pokemonApiUrl('pokemon-species', 25) && defer) {
      defer = false
      return new Promise<Response>((resolve) => { finish = resolve; signal = init?.signal })
    }
    return pokemonApiResponse(input, data)
  })
  fireEvent.change(screen.getByLabelText('Search Pokémon 2'), { target: { value: '25' } })
  choose(2, 'pikachu')
  await waitFor(() => expect(finish).toBeTypeOf('function'))
  choose(1, 'pikachu')
  expect(slot(1).getByRole('alert').textContent).toContain('already selected or loading')
  expect(slot(1).queryByRole('article')).toBeNull()
  mode(2, 'My Favorites')
  choose(2, 'charizard')
  expect(signal?.aborted).toBe(true)
  if (!finish) throw new Error('Expected pending search request')
  await act(async () => finish?.(Response.json(pokemonSpeciesFixture(25))))
  await slot(2).findByRole('heading', { name: 'charizard' })
  await ready(2)
  expect(selected(2).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  choose(1, 'pikachu')
  await ready(1)
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
  await ready(2)
  expect(selected(2).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
})

test('handles failed favorites loading without losing a search selection or disabling search', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6]')
  const fetchMock = mockApi()
  showComparison()
  fireEvent.change(screen.getByLabelText('Search Pokémon 2'), { target: { value: '25' } })
  choose(2, 'pikachu')
  await slot(2).findByRole('article')
  await ready(2)
  fetchMock.mockImplementation(async (input) => requestUrl(input) === pokemonApiUrl('pokemon', 6)
    ? new Response(null, { status: 503 }) : pokemonApiResponse(input, data))
  mode(1, 'My Favorites')
  expect((await slot(1).findByRole('alert')).textContent).toContain('Failed to load favorite Pokémon #6.')
  expect(selected(2).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
  mode(1, 'Search Pokémon')
  fireEvent.change(screen.getByLabelText('Search Pokémon 1'), { target: { value: '1' } })
  choose(1, 'bulbasaur')
  await slot(1).findByRole('article')
  await ready(1)
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
