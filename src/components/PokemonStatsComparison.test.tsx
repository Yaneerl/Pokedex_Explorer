import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { PokemonResponse, PokemonStatName, PokemonSummary } from '../types/pokemon.ts'
import { FAVORITES_STORAGE_KEY } from '../utils/favorites.ts'
import PokemonComparison from './PokemonComparison.tsx'
import { pokemonFixture, pokemonApiResponse, pokemonApiUrl, requestUrl } from '../test/pokemonApiFixtures.ts'

const names: PokemonStatName[] = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
const index: PokemonSummary[] = [{ id: 1, name: 'bulbasaur' }, { id: 6, name: 'charizard' }, { id: 25, name: 'pikachu' }]
const values: Record<number, number[]> = { 1: [45, 49, 49, 65, 65, 45], 6: [78, 84, 78, 109, 85, 100], 25: [35, 55, 40, 50, 50, 90] }
function pokemon(id: number): PokemonResponse {
  return { ...pokemonFixture(id), sprites: { front_default: null, front_shiny: null },
    stats: names.map((name, i) => ({ stat: { name }, base_stat: values[id]?.[i] ?? 0 })) }
}
function mockApi() {
  const mock = vi.fn<typeof fetch>(async (input) => pokemonApiResponse(input, pokemon))
  vi.stubGlobal('fetch', mock)
  return mock
}
function showComparison() {
  return render(<MemoryRouter><PokemonComparison pokemonIndex={index} indexLoading={false} indexError={null} /></MemoryRouter>)
}
function slot(n: number) { return within(screen.getByRole('region', { name: 'Pokémon ' + n })) }
function choose(n: number, name: string) {
  fireEvent.change(screen.getByLabelText('Search Pokémon ' + n), { target: { value: name } })
  fireEvent.click(slot(n).getByRole('button', { name: 'Select ' + name + ' for Pokémon ' + n }))
}
function comparison() { return within(screen.getByRole('region', { name: 'Stats Comparison' })) }
function row(label: string) { return within(comparison().getByRole('listitem', { name: label })) }
function favoriteMode(n: number) { fireEvent.click(slot(n).getByRole('button', { name: 'My Favorites' })) }
function favorite(n: number, name: string) { fireEvent.click(slot(n).getByRole('button', { name: 'Select ' + name + ' for Pokémon ' + n })) }

beforeEach(() => window.localStorage.removeItem(FAVORITES_STORAGE_KEY))
async function ready(n: number) {
  await waitFor(() => expect(slot(n).queryByRole('status')).toBeNull())
}

afterEach(() => { vi.unstubAllGlobals(); window.localStorage.removeItem(FAVORITES_STORAGE_KEY) })

test('shows comparison only after both selections and renders six accessible pairs, totals, summary and a Base Stats explanation', async () => {
  const fetchMock = mockApi()
  showComparison()
  expect(screen.queryByRole('region', { name: 'Stats Comparison' })).toBeNull()
  choose(1, 'bulbasaur')
  await slot(1).findByRole('article')
  await ready(1)
  expect(screen.queryByRole('region', { name: 'Stats Comparison' })).toBeNull()
  choose(2, 'pikachu')
  await screen.findByRole('region', { name: 'Stats Comparison' })
  expect(comparison().getAllByRole('listitem')).toHaveLength(6)
  expect(comparison().getAllByRole('meter')).toHaveLength(12)
  expect(comparison().getByText('Base Stats only. This comparison does not predict the winner of a real battle.')).toBeTruthy()
  expect(comparison().getByText('Shared bar scale: 0–255')).toBeTruthy()
  expect(row('HP').getByRole('meter', { name: 'bulbasaur HP' }).getAttribute('aria-valuenow')).toBe('45')
  expect(row('HP').getByRole('meter', { name: 'pikachu HP' }).getAttribute('aria-valuemax')).toBe('255')
  expect(row('HP').getByText('bulbasaur leads')).toBeTruthy()
  expect(row('HP').getByText('Difference: 10 points')).toBeTruthy()
  expect(row('Attack').getByText('pikachu leads')).toBeTruthy()
  expect(row('Attack').getByText('Difference: 6 points')).toBeTruthy()
  expect(comparison().getByText('318')).toBeTruthy()
  expect(comparison().getByText('320')).toBeTruthy()
  expect(comparison().getByText('4', { selector: '.stats-comparison-summary-card strong' })).toBeTruthy()
  expect(comparison().getByText('2', { selector: '.stats-comparison-summary-card strong' })).toBeTruthy()
  expect(fetchMock.mock.calls.map(([input]) => requestUrl(input)).sort()).toEqual([
    ...[1, 25].map((id) => pokemonApiUrl('pokemon', id)),
    ...[1, 25].map((id) => pokemonApiUrl('pokemon-species', id)),
  ].sort())
})

test('updates all graphs and totals after either side changes without changing the opposite Pokémon', async () => {
  const fetchMock = mockApi()
  showComparison()
  choose(1, 'bulbasaur'); choose(2, 'pikachu')
  await screen.findByRole('region', { name: 'Stats Comparison' })
  choose(1, 'charizard')
  await comparisonAfter('534')
  expect(row('HP').getByRole('meter', { name: 'charizard HP' }).getAttribute('aria-valuenow')).toBe('78')
  expect(row('HP').getByText('Difference: 43 points')).toBeTruthy()
  expect(row('Speed').getByText('Difference: 10 points')).toBeTruthy()
  expect(row('HP').getByRole('meter', { name: 'pikachu HP' })).toBeTruthy()
  choose(2, 'bulbasaur')
  await comparisonAfter('318')
  expect(row('Speed').getByText('Difference: 55 points')).toBeTruthy()
  expect(row('HP').getByRole('meter', { name: 'charizard HP' })).toBeTruthy()
  expect(fetchMock.mock.calls.map(([input]) => requestUrl(input)).sort()).toEqual([
    ...[1, 6, 25, 10034, 10035].map((id) => pokemonApiUrl('pokemon', id)),
    ...[1, 6, 25].map((id) => pokemonApiUrl('pokemon-species', id)),
    ...[10034, 10035].map((id) => pokemonApiUrl('pokemon-form', id)),
  ].sort())
})
async function comparisonAfter(total: string) {
  await screen.findByRole('region', { name: 'Stats Comparison' })
  await comparison().findByText(total)
}

test('reuses favorite Pokémon data for comparison and replacement while fetching only missing form metadata', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[1,6,25]')
  const fetchMock = mockApi()
  showComparison()
  favoriteMode(1)
  await slot(1).findByRole('list')
  favorite(1, 'bulbasaur')
  favoriteMode(2)
  favorite(2, 'pikachu')
  await comparisonAfter('320')
  expect(row('Attack').getByText('pikachu leads')).toBeTruthy()
  favorite(1, 'charizard')
  await comparisonAfter('534')
  expect(row('HP').getByText('Difference: 43 points')).toBeTruthy()
  expect(comparison().getByText('534')).toBeTruthy()
  expect(comparison().getByText('320')).toBeTruthy()
  expect(fetchMock.mock.calls.map(([input]) => requestUrl(input)).sort()).toEqual([
    ...[1, 6, 25, 10034, 10035].map((id) => pokemonApiUrl('pokemon', id)),
    ...[1, 6, 25].map((id) => pokemonApiUrl('pokemon-species', id)),
    ...[10034, 10035].map((id) => pokemonApiUrl('pokemon-form', id)),
  ].sort())
})

test('compares a search selection with a favorite using the same stats and duplicate guard', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6,25]')
  const fetchMock = mockApi()
  showComparison()
  choose(1, 'bulbasaur')
  await slot(1).findByRole('article')
  await ready(1)
  favoriteMode(2)
  await slot(2).findByRole('list')
  favorite(2, 'pikachu')
  await comparisonAfter('320')
  expect(row('Speed').getByText('Difference: 45 points')).toBeTruthy()
  favoriteMode(1)
  favorite(1, 'pikachu')
  expect(slot(1).getByRole('alert').textContent).toContain('Choose a different form.')
  expect(row('HP').getByRole('meter', { name: 'bulbasaur HP' })).toBeTruthy()
  favorite(1, 'charizard')
  await comparisonAfter('534')
  expect(row('HP').getByText('Difference: 43 points')).toBeTruthy()
  expect(fetchMock.mock.calls.map(([input]) => requestUrl(input)).sort()).toEqual([
    ...[1, 6, 25, 10034, 10035].map((id) => pokemonApiUrl('pokemon', id)),
    ...[1, 6, 25].map((id) => pokemonApiUrl('pokemon-species', id)),
    ...[10034, 10035].map((id) => pokemonApiUrl('pokemon-form', id)),
  ].sort())
})

test('labels equal stats as Tie with a zero difference and the correct tied-stat summary', async () => {
  const fetchMock = mockApi()
  fetchMock.mockImplementation(async (input) => {
    return pokemonApiResponse(input, (id) => ({ ...pokemon(id), stats: pokemon(1).stats }))
  })
  showComparison()
  choose(1, 'bulbasaur'); choose(2, 'pikachu')
  await screen.findByRole('region', { name: 'Stats Comparison' })
  expect(comparison().getAllByText('Tie')).toHaveLength(6)
  expect(comparison().getAllByText('Difference: 0 points')).toHaveLength(6)
  expect(comparison().getAllByText('0', { selector: '.stats-comparison-summary-card strong' })).toHaveLength(2)
  expect(comparison().getByText('6', { selector: '.stats-comparison-ties strong' })).toBeTruthy()
  expect(row('HP').getByRole('meter', { name: 'bulbasaur HP' }).getAttribute('aria-valuenow')).toBe('45')
})

test('shows loading during replacement, restores the valid comparison on error and then updates on retry', async () => {
  const fetchMock = mockApi()
  showComparison()
  choose(1, 'bulbasaur'); choose(2, 'pikachu')
  await screen.findByRole('region', { name: 'Stats Comparison' })
  let finish: ((response: Response) => void) | undefined
  let defer = true
  fetchMock.mockImplementation((input) => {
    if (requestUrl(input) === pokemonApiUrl('pokemon', 6) && defer) { defer = false; return new Promise<Response>((resolve) => { finish = resolve }) }
    return Promise.resolve(pokemonApiResponse(input, pokemon))
  })
  choose(1, 'charizard')
  expect(screen.getByText('Updating stats comparison...').getAttribute('role')).toBe('status')
  expect(screen.queryByRole('region', { name: 'Stats Comparison' })).toBeNull()
  await act(async () => finish?.(new Response(null, { status: 503 })))
  expect(slot(1).getByRole('alert').textContent).toBe('Failed to load Pokémon.')
  expect(row('HP').getByRole('meter', { name: 'bulbasaur HP' })).toBeTruthy()
  choose(1, 'charizard')
  await comparisonAfter('534')
  expect(row('HP').getByRole('meter', { name: 'charizard HP' })).toBeTruthy()
  expect(slot(1).queryByRole('alert')).toBeNull()
})

test('rejects incomplete API stats without replacing the last valid comparison', async () => {
  const fetchMock = mockApi()
  showComparison()
  choose(1, 'bulbasaur'); choose(2, 'pikachu')
  await screen.findByRole('region', { name: 'Stats Comparison' })
  fetchMock.mockImplementation(async (input) => requestUrl(input) === pokemonApiUrl('pokemon', 6)
    ? Response.json({ ...pokemon(6), stats: [] }) : pokemonApiResponse(input, pokemon))
  choose(1, 'charizard')
  expect((await slot(1).findByRole('alert')).textContent).toContain('All six base stats are required')
  expect(row('HP').getByRole('meter', { name: 'bulbasaur HP' })).toBeTruthy()
})

test('swaps loaded Pokémon and stats without fetching, and disables Swap for empty or pending selections', async () => {
  const fetchMock = mockApi()
  showComparison()
  const swap = screen.getByRole('button', { name: 'Swap Pokémon' })
  expect(swap.hasAttribute('disabled')).toBe(true)
  choose(1, 'bulbasaur')
  await slot(1).findByRole('article')
  await ready(1)
  expect(swap.hasAttribute('disabled')).toBe(true)
  choose(2, 'charizard')
  await slot(2).findByRole('article')
  await ready(2)
  expect(swap.hasAttribute('disabled')).toBe(false)
  const before = fetchMock.mock.calls.length
  fireEvent.click(swap)
  expect(slot(1).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  expect(slot(2).getByRole('heading', { name: 'bulbasaur' })).toBeTruthy()
  expect(row('HP').getAllByRole('meter').map((meter) => meter.getAttribute('aria-label'))).toEqual(['charizard HP', 'bulbasaur HP'])
  const summaries = comparison().getByLabelText('Base stats summary').children
  expect(summaries[0]?.textContent).toContain('Total Base Stats: 534')
  expect(summaries[1]?.textContent).toContain('Total Base Stats: 318')
  expect(fetchMock).toHaveBeenCalledTimes(before)

  let finish: ((response: Response) => void) | undefined
  let defer = true
  fetchMock.mockImplementation((input) => {
    if (requestUrl(input) === pokemonApiUrl('pokemon', 25) && defer) { defer = false; return new Promise<Response>((resolve) => { finish = resolve }) }
    return Promise.resolve(pokemonApiResponse(input, pokemon))
  })
  choose(1, 'pikachu')
  expect(swap.hasAttribute('disabled')).toBe(true)
  fireEvent.click(swap)
  expect(slot(2).getByRole('heading', { name: 'bulbasaur' })).toBeTruthy()
  await act(async () => { finish?.(Response.json(pokemon(25))) })
  await slot(1).findByRole('heading', { name: 'pikachu' })
  await ready(1)
  expect(swap.hasAttribute('disabled')).toBe(false)
  expect(slot(2).getByRole('heading', { name: 'bulbasaur' })).toBeTruthy()
  expect(fetchMock).toHaveBeenCalledTimes(before + 2)
})
