import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'
import type { PokemonResponse, PokemonSummary } from '../types/pokemon.ts'
import PokemonComparison from './PokemonComparison.tsx'

const index: PokemonSummary[] = [
  { id: 1, name: 'bulbasaur' }, { id: 2, name: 'ivysaur' }, { id: 3, name: 'venusaur' },
  { id: 6, name: 'charizard' }, { id: 25, name: 'pikachu' }, { id: 26, name: 'raichu' },
  { id: 125, name: 'electabuzz' }, { id: 252, name: 'treecko' },
]

function pokemon(id: number): Pick<PokemonResponse, 'id' | 'name' | 'types' | 'sprites' | 'stats'> {
  const summary = index.find((item) => item.id === id)
  if (!summary) throw new Error('Unknown fixture ID: ' + id)
  const types = id === 6 ? ['fire', 'flying'] : id === 1 ? ['grass', 'poison'] : ['electric']
  return {
    ...summary,
    types: types.map((name) => ({ type: { name, url: '/type/' + name } })),
    stats: [
      { base_stat: 45, stat: { name: 'hp' } }, { base_stat: 49, stat: { name: 'attack' } },
      { base_stat: 49, stat: { name: 'defense' } }, { base_stat: 65, stat: { name: 'special-attack' } },
      { base_stat: 65, stat: { name: 'special-defense' } }, { base_stat: 45, stat: { name: 'speed' } },
    ],
    sprites: {
      front_default: '/sprite-' + id + '.png', front_shiny: null,
      other: { 'official-artwork': { front_default: id === 25 ? '/artwork-25.png' : null, front_shiny: null } },
    },
  }
}

function mockApi() {
  const mock = vi.fn<typeof fetch>(async (input) => Response.json(pokemon(Number(String(input).split('/').at(-1)))))
  vi.stubGlobal('fetch', mock)
  return mock
}

function showComparison() {
  return render(<MemoryRouter><PokemonComparison pokemonIndex={index} indexLoading={false} indexError={null} /></MemoryRouter>)
}

function slot(number: number) {
  return screen.getByRole('region', { name: 'Pokémon ' + number })
}

function choose(number: number, query: string, name: string) {
  fireEvent.change(screen.getByLabelText('Search Pokémon ' + number), { target: { value: query } })
  fireEvent.click(screen.getByRole('button', { name: 'Select ' + name + ' for Pokémon ' + number }))
}

function selected(number: number) {
  return within(slot(number)).getByRole('article', { name: 'Selected Pokémon ' + number })
}

afterEach(() => vi.unstubAllGlobals())

test('starts with two Empty States and searches partial names or an exact Pokédex number independently', () => {
  const fetchMock = mockApi()
  showComparison()
  expect(screen.getAllByText('No Pokémon selected. Search by name or Pokédex number.')).toHaveLength(2)
  fireEvent.change(screen.getByLabelText('Search Pokémon 1'), { target: { value: '  SAUR  ' } })
  const leftResults = screen.getByRole('list', { name: 'Search results for Pokémon 1' })
  expect(within(leftResults).getAllByRole('button').map((button) => button.textContent)).toEqual(['#0001 · bulbasaur', '#0002 · ivysaur', '#0003 · venusaur'])
  fireEvent.change(screen.getByLabelText('Search Pokémon 2'), { target: { value: '25' } })
  const rightResults = screen.getByRole('list', { name: 'Search results for Pokémon 2' })
  expect(within(rightResults).getAllByRole('button')).toHaveLength(1)
  expect(within(rightResults).getByRole('button', { name: 'Select pikachu for Pokémon 2' })).toBeTruthy()
  expect(within(leftResults).getAllByRole('button')).toHaveLength(3)
  expect(fetchMock).not.toHaveBeenCalled()
})

test('selects by partial name and number and renders the API picture, name, number and types on each side', async () => {
  mockApi()
  showComparison()
  choose(1, 'pika', 'pikachu')
  choose(2, '6', 'charizard')
  await within(slot(1)).findByRole('article')
  await within(slot(2)).findByRole('article')
  expect(within(selected(1)).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
  expect(within(selected(1)).getByText('#0025')).toBeTruthy()
  expect(within(selected(1)).getByText('electric')).toBeTruthy()
  expect(within(selected(1)).getByRole('img').getAttribute('src')).toBe('/artwork-25.png')
  expect(within(selected(2)).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  expect(within(selected(2)).getByText('#0006')).toBeTruthy()
  expect(within(selected(2)).getByText('fire')).toBeTruthy()
  expect(within(selected(2)).getByText('flying')).toBeTruthy()
  expect(within(selected(2)).getByRole('img').getAttribute('src')).toBe('/sprite-6.png')
  expect(within(screen.getByRole('region', { name: 'Stats Comparison' })).getAllByRole('meter')).toHaveLength(12)
})

test('replaces either selected Pokémon without resetting the other side', async () => {
  mockApi()
  showComparison()
  choose(1, '25', 'pikachu')
  choose(2, '6', 'charizard')
  await within(slot(1)).findByRole('article')
  await within(slot(2)).findByRole('article')
  choose(1, 'bulb', 'bulbasaur')
  await within(slot(1)).findByRole('heading', { name: 'bulbasaur' })
  expect(within(selected(2)).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  choose(2, '26', 'raichu')
  await within(slot(2)).findByRole('heading', { name: 'raichu' })
  expect(within(selected(1)).getByRole('heading', { name: 'bulbasaur' })).toBeTruthy()
})

test('rejects a duplicate ID and keeps both existing selections without another API call', async () => {
  const fetchMock = mockApi()
  showComparison()
  choose(1, '25', 'pikachu')
  choose(2, '6', 'charizard')
  await within(slot(1)).findByRole('article')
  await within(slot(2)).findByRole('article')
  const before = fetchMock.mock.calls.length
  choose(2, 'pika', 'pikachu')
  expect(within(slot(2)).getByRole('alert').textContent).toContain('Choose a different Pokémon.')
  expect(within(selected(1)).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
  expect(within(selected(2)).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  expect(fetchMock.mock.calls.length).toBe(before)
})

test('prevents simultaneous duplicate choices while the first side is still loading', async () => {
  const pending: ((response: Response) => void)[] = []
  const fetchMock = vi.fn<typeof fetch>(() => new Promise<Response>((resolve) => pending.push(resolve)))
  vi.stubGlobal('fetch', fetchMock)
  showComparison()
  choose(1, '25', 'pikachu')
  expect(within(slot(1)).getByRole('status').textContent).toBe('Loading Pokémon 1...')
  choose(2, '25', 'pikachu')
  expect(within(slot(2)).getByRole('alert').textContent).toContain('already selected or loading')
  expect(fetchMock).toHaveBeenCalledTimes(1)
  const finish = pending[0]
  if (!finish) throw new Error('Expected pending request')
  await act(async () => finish(Response.json(pokemon(25))))
  expect(within(selected(1)).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
  expect(within(slot(2)).queryByRole('article')).toBeNull()
})

test('cancels superseded requests and ignores late responses without disturbing the other selection', async () => {
  const pending: { signal: AbortSignal; finish: (response: Response) => void }[] = []
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
    const id = Number(String(input).split('/').at(-1))
    if (id !== 25) return Response.json(pokemon(id))
    const signal = init?.signal
    if (!signal) throw new Error('Expected AbortSignal')
    return new Promise<Response>((finish) => pending.push({ signal, finish }))
  }))
  showComparison()
  choose(2, '6', 'charizard')
  await within(slot(2)).findByRole('article')
  choose(1, '25', 'pikachu')
  choose(1, '1', 'bulbasaur')
  await within(slot(1)).findByRole('heading', { name: 'bulbasaur' })
  const request = pending[0]
  if (!request) throw new Error('Expected pending request')
  expect(request.signal.aborted).toBe(true)
  await act(async () => request.finish(Response.json(pokemon(25))))
  expect(within(selected(1)).getByRole('heading', { name: 'bulbasaur' })).toBeTruthy()
  expect(within(selected(2)).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  expect(screen.queryByRole('alert')).toBeNull()
})

test('aborts each pending selection request when leaving the comparison page', () => {
  const signals: AbortSignal[] = []
  vi.stubGlobal('fetch', vi.fn<typeof fetch>((_input, init) => new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal
    if (!signal) throw new Error('Expected AbortSignal')
    signals.push(signal)
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  })))
  const view = showComparison()
  choose(1, '25', 'pikachu')
  choose(2, '6', 'charizard')
  expect(signals).toHaveLength(2)
  view.unmount()
  expect(signals.every((signal) => signal.aborted)).toBe(true)
})

test.each([
  { status: 404, message: 'Pokémon was not found.' },
  { status: 503, message: 'Failed to load Pokémon.' },
])('handles HTTP $status during replacement, keeps previous data and permits retry', async ({ status, message }) => {
  const fetchMock = mockApi()
  showComparison()
  choose(1, '25', 'pikachu')
  choose(2, '6', 'charizard')
  await within(slot(1)).findByRole('article')
  await within(slot(2)).findByRole('article')
  fetchMock.mockImplementationOnce(async () => new Response(null, { status }))
  choose(1, '1', 'bulbasaur')
  expect((await within(slot(1)).findByRole('alert')).textContent).toBe(message)
  expect(within(selected(1)).getByRole('heading', { name: 'pikachu' })).toBeTruthy()
  expect(within(selected(2)).getByRole('heading', { name: 'charizard' })).toBeTruthy()
  choose(1, '1', 'bulbasaur')
  await within(slot(1)).findByRole('heading', { name: 'bulbasaur' })
  expect(within(slot(1)).queryByRole('alert')).toBeNull()
})

test('shows search-index Loading and Error states with a route back to the catalog', () => {
  const fetchMock = mockApi()
  const view = render(<MemoryRouter><PokemonComparison pokemonIndex={[]} indexLoading={true} indexError={null} /></MemoryRouter>)
  expect(screen.getByRole('status').textContent).toBe('Loading Pokémon search...')
  view.rerender(<MemoryRouter><PokemonComparison pokemonIndex={[]} indexLoading={false} indexError="Index unavailable" /></MemoryRouter>)
  expect(screen.getByRole('alert').textContent).toBe('Error: Index unavailable')
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.getByRole('link', { name: '← Back to Pokédex' }).getAttribute('href')).toBe('/')
  expect(fetchMock).not.toHaveBeenCalled()
})

test('shows a no-results message for unmatched names and numbers without fetching', () => {
  const fetchMock = mockApi()
  showComparison()
  fireEvent.change(screen.getByLabelText('Search Pokémon 1'), { target: { value: 'not-a-pokemon' } })
  fireEvent.change(screen.getByLabelText('Search Pokémon 2'), { target: { value: '999999' } })
  expect(within(slot(1)).getByText('No Pokémon found.')).toBeTruthy()
  expect(within(slot(2)).getByText('No Pokémon found.')).toBeTruthy()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('rejects API data with an unexpected ID instead of committing an incorrect selection', async () => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => Response.json(pokemon(6))))
  showComparison()
  choose(1, '25', 'pikachu')
  expect((await within(slot(1)).findByRole('alert')).textContent).toBe('Unexpected Pokémon data.')
  expect(within(slot(1)).queryByRole('article')).toBeNull()
})
