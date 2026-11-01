import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { PokemonResponse, PokemonStatName, PokemonSummary } from '../types/pokemon.ts'
import { FAVORITES_STORAGE_KEY } from '../utils/favorites.ts'
import PokemonComparison from './PokemonComparison.tsx'

const names: PokemonStatName[] = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
const index: PokemonSummary[] = [{ id: 1, name: 'bulbasaur' }, { id: 6, name: 'charizard' }, { id: 25, name: 'pikachu' }]
const values: Record<number, number[]> = { 1: [45, 49, 49, 65, 65, 45], 6: [78, 84, 78, 109, 85, 100], 25: [35, 55, 40, 50, 50, 90] }
function pokemon(id: number): Pick<PokemonResponse, 'id' | 'name' | 'types' | 'sprites' | 'stats'> {
  const summary = index.find((item) => item.id === id)
  if (!summary) throw new Error('Unknown fixture ID')
  return { ...summary, types: [{ type: { name: 'normal', url: '/type/' } }], sprites: { front_default: null, front_shiny: null },
    stats: names.map((name, i) => ({ stat: { name }, base_stat: values[id]?.[i] ?? 0 })) }
}
function mockApi() {
  const mock = vi.fn<typeof fetch>(async (input) => Response.json(pokemon(Number(String(input).split('/').at(-1)))))
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
afterEach(() => { vi.unstubAllGlobals(); window.localStorage.removeItem(FAVORITES_STORAGE_KEY) })

test('shows comparison only after both selections and renders six accessible pairs, totals, summary and a Base Stats explanation', async () => {
  const fetchMock = mockApi()
  showComparison()
  expect(screen.queryByRole('region', { name: 'Stats Comparison' })).toBeNull()
  choose(1, 'bulbasaur')
  await slot(1).findByRole('article')
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
  expect(fetchMock).toHaveBeenCalledTimes(2)
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
  expect(fetchMock).toHaveBeenCalledTimes(4)
})
async function comparisonAfter(total: string) {
  await screen.findByRole('region', { name: 'Stats Comparison' })
  await comparison().findByText(total)
}

test('uses already loaded favorite stats for comparison and replacement with no additional fetches', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[1,6,25]')
  const fetchMock = mockApi()
  showComparison()
  favoriteMode(1)
  await slot(1).findByRole('list')
  favorite(1, 'bulbasaur')
  favoriteMode(2)
  favorite(2, 'pikachu')
  expect(row('Attack').getByText('pikachu leads')).toBeTruthy()
  favorite(1, 'charizard')
  expect(row('HP').getByText('Difference: 43 points')).toBeTruthy()
  expect(comparison().getByText('534')).toBeTruthy()
  expect(comparison().getByText('320')).toBeTruthy()
  expect(fetchMock).toHaveBeenCalledTimes(3)
})

test('compares a search selection with a favorite using the same stats and duplicate guard', async () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6,25]')
  const fetchMock = mockApi()
  showComparison()
  choose(1, 'bulbasaur')
  await slot(1).findByRole('article')
  favoriteMode(2)
  await slot(2).findByRole('list')
  favorite(2, 'pikachu')
  expect(row('Speed').getByText('Difference: 45 points')).toBeTruthy()
  favoriteMode(1)
  favorite(1, 'pikachu')
  expect(slot(1).getByRole('alert').textContent).toContain('Choose a different Pokémon')
  expect(row('HP').getByRole('meter', { name: 'bulbasaur HP' })).toBeTruthy()
  favorite(1, 'charizard')
  expect(row('HP').getByText('Difference: 43 points')).toBeTruthy()
  expect(fetchMock).toHaveBeenCalledTimes(3)
})

test('labels equal stats as Tie with a zero difference and the correct tied-stat summary', async () => {
  const fetchMock = mockApi()
  fetchMock.mockImplementation(async (input) => {
    const id = Number(String(input).split('/').at(-1))
    return Response.json({ ...pokemon(id), stats: pokemon(1).stats })
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
  fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve }))
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
  fetchMock.mockImplementationOnce(async () => Response.json({ ...pokemon(6), stats: [] }))
  choose(1, 'charizard')
  expect((await slot(1).findByRole('alert')).textContent).toContain('All six base stats are required')
  expect(row('HP').getByRole('meter', { name: 'bulbasaur HP' })).toBeTruthy()
})
