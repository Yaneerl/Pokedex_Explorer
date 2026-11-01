import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { EvolutionChainLink, PokemonResponse, PokemonStatName } from '../types/pokemon.ts'
import PokemonDetails from './PokemonDetails.tsx'
import { FAVORITES_STORAGE_KEY } from '../utils/favorites.ts'

const api = 'https://pokeapi.co/api/v2/'
const statNames: PokemonStatName[] = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
const resource = (kind: string, id: number, name: string) => ({ name, url: api + kind + '/' + id + '/' })
const stats = (values: number[]) => statNames.map((name, index) => ({ stat: { name }, base_stat: values[index] ?? 0 }))
const types = (names: string[]) => names.map((name) => ({ type: { name, url: '/type/' + name } }))
const abilities = (name: string) => [{ ability: { name, url: '/ability/' + name }, is_hidden: false, slot: 1 }]

function pokemon(id: number, name: string, speciesId: number, overrides: Partial<PokemonResponse> = {}): PokemonResponse {
  return {
    id, name, height: 17, weight: 905,
    species: resource('pokemon-species', speciesId, name.split('-')[0] ?? name),
    forms: [resource('pokemon-form', id, name)],
    stats: stats([78, 84, 78, 109, 85, 100]),
    types: types(['fire', 'flying']),
    abilities: abilities('blaze'),
    sprites: {
      front_default: '/normal-' + id + '.png', front_shiny: '/shiny-' + id + '.png',
      other: { 'official-artwork': { front_default: '/artwork-' + id + '.png', front_shiny: '/artwork-shiny-' + id + '.png' } },
    },
    ...overrides,
  }
}

function fixtures(): Record<string, unknown> {
  const charizard = pokemon(6, 'charizard', 6)
  const charizardX = pokemon(10034, 'charizard-mega-x', 6, {
    weight: 1105, stats: stats([78, 130, 111, 130, 85, 100]), types: types(['fire', 'dragon']), abilities: abilities('tough-claws'),
  })
  const charizardY = pokemon(10035, 'charizard-mega-y', 6, {
    weight: 1005, stats: stats([78, 104, 78, 159, 115, 100]), abilities: abilities('drought'),
  })
  const gmax = pokemon(10196, 'charizard-gmax', 6)
  const pikachu = pokemon(25, 'pikachu', 25)
  const pikachuCap = pokemon(10080, 'pikachu-cap', 25)
  const mewtwo = pokemon(150, 'mewtwo', 150, { height: 20, weight: 1220, types: types(['psychic']) })
  const mewtwoX = pokemon(10043, 'mewtwo-mega-x', 150, {
    height: 23, weight: 1270, stats: stats([106, 190, 100, 154, 100, 130]),
    types: types(['psychic', 'fighting']), abilities: abilities('steadfast'),
  })
  const mewtwoY = pokemon(10044, 'mewtwo-mega-y', 150)
  const db: Record<string, unknown> = {}
  for (const data of [charizard, charizardX, charizardY, gmax, pikachu, pikachuCap, mewtwo, mewtwoX, mewtwoY,
    pokemon(4, 'charmander', 4), pokemon(5, 'charmeleon', 5)]) {
    db[api + 'pokemon/' + data.id] = data
    db[api + 'pokemon/' + data.id + '/'] = data
    db[api + 'pokemon-form/' + data.id + '/'] = {
      is_mega: [10034, 10035, 10043, 10044].includes(data.id),
      names: [{ name: 'Mega ' + (data.id > 10040 ? 'Mewtwo' : 'Charizard') + (data.name.endsWith('-x') ? ' X' : ' Y'), language: { name: 'en', url: '/language/9/' } }],
    }
  }
  const species = (id: number, chain: number, varieties: PokemonResponse[]) => {
    db[api + 'pokemon-species/' + id + '/'] = {
      evolution_chain: { url: api + 'evolution-chain/' + chain + '/' },
      varieties: varieties.map((data, index) => ({ is_default: index === 0, pokemon: resource('pokemon', data.id, data.name) })),
    }
  }
  species(6, 2, [charizard, charizardX, charizardY, gmax])
  species(150, 77, [mewtwo, mewtwoX, mewtwoY])
  species(25, 10, [pikachu, pikachuCap])
  const link = (id: number, name: string, children: EvolutionChainLink[] = []): EvolutionChainLink => ({
    species: resource('pokemon-species', id, name), evolves_to: children,
  })
  db[api + 'evolution-chain/2/'] = { chain: link(4, 'charmander', [link(5, 'charmeleon', [link(6, 'charizard')])]) }
  db[api + 'evolution-chain/77/'] = { chain: link(150, 'mewtwo') }
  db[api + 'evolution-chain/10/'] = { chain: link(25, 'pikachu') }
  return db
}

function response(db: Record<string, unknown>, input: RequestInfo | URL): Response {
  const url = String(input)
  if (!(url in db)) throw new Error('Unexpected request: ' + url)
  return Response.json(db[url])
}

function mockApi(db = fixtures()) {
  const mock = vi.fn<typeof fetch>(async (input) => response(db, input))
  vi.stubGlobal('fetch', mock)
  return mock
}

function showPokemon(id = 6) {
  return render(
    <MemoryRouter initialEntries={['/pokemon/' + id]}>
      <Link to="/pokemon/25">Open Pikachu</Link>
      <Link to="/pokemon/6">Open Charizard</Link>
      <Routes><Route path="/pokemon/:id" element={<PokemonDetails />} /></Routes>
    </MemoryRouter>,
  )
}

async function chooseMega(id: number) {
  const select = await screen.findByRole('combobox', { name: 'Mega Evolution' })
  fireEvent.change(select, { target: { value: String(id) } })
  return select
}

beforeEach(() => window.localStorage.removeItem(FAVORITES_STORAGE_KEY))

afterEach(() => {
  vi.unstubAllGlobals()
  window.localStorage.removeItem(FAVORITES_STORAGE_KEY)
})

test.each([
  { id: 6, labels: ['Regular', 'Mega Charizard X', 'Mega Charizard Y'] },
  { id: 150, labels: ['Regular', 'Mega Mewtwo X', 'Mega Mewtwo Y'] },
])('lists both verified Mega forms for Pokémon $id, excluding other varieties', async ({ id, labels }) => {
  mockApi()
  showPokemon(id)
  const select = await screen.findByRole('combobox', { name: 'Mega Evolution' })
  expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(labels)
  expect(within(select).queryByRole('option', { name: /gmax/i })).toBeNull()
})

test('hides the Mega selector when alternate forms all have is_mega false', async () => {
  mockApi()
  showPokemon(25)
  await screen.findByRole('heading', { name: 'Pikachu' })
  await waitFor(() => expect(screen.queryByText('Loading Mega forms...')).toBeNull())
  expect(screen.queryByRole('combobox', { name: 'Mega Evolution' })).toBeNull()
  expect(screen.getByRole('img', { name: 'pikachu Normal artwork' })).toBeTruthy()
})

test('switches Regular to Mega X/Y and back, updating all stats, types, abilities, image and measurements', async () => {
  mockApi()
  showPokemon()
  await chooseMega(10034)
  expect(screen.getByRole('heading', { name: 'Mega Charizard X' })).toBeTruthy()
  expect(screen.getAllByRole('meter').map((meter) => meter.getAttribute('aria-valuenow'))).toEqual(['78', '130', '111', '130', '85', '100'])
  expect(screen.getByText('Types: fire, dragon')).toBeTruthy()
  expect(screen.getByText('Tough Claws')).toBeTruthy()
  expect(screen.queryByText('Blaze')).toBeNull()
  expect(screen.getByText('1.7 m')).toBeTruthy()
  expect(screen.getByText('110.5 kg')).toBeTruthy()
  expect(screen.getByRole('img', { name: 'charizard-mega-x Normal artwork' }).getAttribute('src')).toBe('/artwork-10034.png')
  expect(screen.getByText('Pokédex Number: #0006')).toBeTruthy()

  await chooseMega(10035)
  expect(screen.getByText('Drought')).toBeTruthy()
  expect(screen.getByText('Types: fire, flying')).toBeTruthy()
  expect(screen.getByRole('meter', { name: 'Special Attack' }).getAttribute('aria-valuenow')).toBe('159')
  expect(screen.getByText('100.5 kg')).toBeTruthy()

  await chooseMega(6)
  expect(screen.getByRole('heading', { name: 'Charizard' })).toBeTruthy()
  expect(screen.getAllByRole('meter').map((meter) => meter.getAttribute('aria-valuenow'))).toEqual(['78', '84', '78', '109', '85', '100'])
  expect(screen.getByText('Blaze')).toBeTruthy()
  expect(screen.getByText('90.5 kg')).toBeTruthy()
  expect(screen.getByRole('img', { name: 'charizard Normal artwork' }).getAttribute('src')).toBe('/artwork-6.png')
  const chain = await screen.findByRole('region', { name: 'Evolution Chain' })
  await waitFor(() => expect(within(chain).getAllByRole('link').map((stage) => stage.textContent)).toEqual(['Charmander', 'Charmeleon', 'Charizard']))
  expect(within(chain).queryByText(/Mega/)).toBeNull()
})

test('uses Mega-specific height, weight, types and abilities for Mewtwo X', async () => {
  mockApi()
  showPokemon(150)
  await chooseMega(10043)
  expect(screen.getByText('2.3 m')).toBeTruthy()
  expect(screen.getByText('127.0 kg')).toBeTruthy()
  expect(screen.getByText('Types: psychic, fighting')).toBeTruthy()
  expect(screen.getByText('Steadfast')).toBeTruthy()
  expect(screen.getByRole('meter', { name: 'Attack' }).getAttribute('aria-valuenow')).toBe('190')
  await waitFor(() => expect(screen.queryByRole('region', { name: 'Evolution Chain' })).toBeNull())
})

test('switches a Mega form to Shiny and back using that form’s API image without refetching', async () => {
  const fetchMock = mockApi()
  showPokemon()
  await chooseMega(10034)
  await waitFor(() => expect(screen.queryAllByRole('status')).toHaveLength(0))
  const before = fetchMock.mock.calls.length
  fireEvent.click(screen.getByRole('button', { name: 'Shiny' }))
  expect(screen.getByRole('img', { name: 'charizard-mega-x Shiny artwork' }).getAttribute('src')).toBe('/artwork-shiny-10034.png')
  expect(screen.getByRole('meter', { name: 'Attack' }).getAttribute('aria-valuenow')).toBe('130')
  fireEvent.click(screen.getByRole('button', { name: 'Normal' }))
  expect(screen.getByRole('img', { name: 'charizard-mega-x Normal artwork' }).getAttribute('src')).toBe('/artwork-10034.png')
  expect(fetchMock.mock.calls.length).toBe(before)
})

test('handles a missing Mega Shiny image while leaving Normal and the Mega stats usable', async () => {
  const db = fixtures()
  const mega = pokemon(10034, 'charizard-mega-x', 6, {
    sprites: { front_default: '/normal-mega.png', front_shiny: null },
  })
  db[api + 'pokemon/10034/'] = mega
  mockApi(db)
  showPokemon()
  await chooseMega(10034)
  fireEvent.click(screen.getByRole('button', { name: 'Shiny' }))
  expect(screen.getByText('Shiny image is not available for this Pokémon.')).toBeTruthy()
  expect(screen.queryByRole('img', { name: /charizard-mega-x/ })).toBeNull()
  expect(screen.getAllByRole('meter')).toHaveLength(6)
  fireEvent.click(screen.getByRole('button', { name: 'Normal' }))
  expect(screen.getByRole('img', { name: 'charizard-mega-x Normal artwork' }).getAttribute('src')).toBe('/normal-mega.png')
})

test('keeps regular details and evolution available when Mega discovery fails', async () => {
  const db = fixtures()
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input) => String(input).includes('/pokemon-form/')
    ? new Response(null, { status: 503 }) : response(db, input)))
  showPokemon()
  expect((await screen.findByRole('alert')).textContent).toBe('Error: Failed to load Mega forms')
  expect(screen.getByRole('heading', { name: 'Charizard' })).toBeTruthy()
  expect(screen.getByText('Blaze')).toBeTruthy()
  expect(screen.getAllByRole('meter')).toHaveLength(6)
  expect(screen.queryByRole('combobox', { name: 'Mega Evolution' })).toBeNull()
  const chain = await screen.findByRole('region', { name: 'Evolution Chain' })
  await within(chain).findByRole('link', { name: 'Charizard' })
})

test('aborts pending Mega discovery on route navigation and ignores late responses', async () => {
  const db = fixtures()
  const pending: { signal: AbortSignal; finish: () => void }[] = []
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
    const url = String(input)
    if (url === api + 'pokemon-form/10034/' || url === api + 'pokemon-form/10035/') {
      const signal = init?.signal
      if (!signal) throw new Error('Expected AbortSignal')
      return new Promise<Response>((resolve) => pending.push({ signal, finish: () => resolve(response(db, input)) }))
    }
    return response(db, input)
  }))
  showPokemon()
  await waitFor(() => expect(pending).toHaveLength(2))
  expect(screen.getByText('Loading Mega forms...')).toBeTruthy()
  expect(screen.getAllByRole('meter')).toHaveLength(6)
  fireEvent.click(screen.getByRole('link', { name: 'Open Pikachu' }))
  await screen.findByRole('heading', { name: 'Pikachu' })
  expect(pending.every((request) => request.signal.aborted)).toBe(true)
  await act(async () => { pending.forEach((request) => request.finish()) })
  await waitFor(() => expect(screen.queryByText('Loading Mega forms...')).toBeNull())
  expect(screen.queryByRole('combobox', { name: 'Mega Evolution' })).toBeNull()
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByRole('heading', { name: 'Pikachu' })).toBeTruthy()
})

test('shares one Pokédex favorite across Regular, Mega X/Y and Shiny without duplicates', async () => {
  mockApi()
  showPokemon()
  await chooseMega(10034)
  fireEvent.click(screen.getByRole('button', { name: 'Add Charizard to favorites' }))
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[6]')

  fireEvent.click(screen.getByRole('button', { name: 'Shiny' }))
  expect(screen.getByRole('img', { name: 'charizard-mega-x Shiny artwork' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Remove Charizard from favorites' }).getAttribute('aria-pressed')).toBe('true')
  await chooseMega(10035)
  expect(screen.getByRole('button', { name: 'Remove Charizard from favorites' })).toBeTruthy()
  await chooseMega(6)
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[6]')
  fireEvent.click(screen.getByRole('button', { name: 'Remove Charizard from favorites' }))
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[]')
})

test('retains favorites through Router navigation, remount and a direct Mega URL using the species ID', async () => {
  mockApi()
  const view = showPokemon()
  fireEvent.click(await screen.findByRole('button', { name: 'Add Charizard to favorites' }))
  fireEvent.click(screen.getByRole('link', { name: 'Open Pikachu' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Add Pikachu to favorites' }))
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[6,25]')

  fireEvent.click(screen.getByRole('link', { name: 'Open Charizard' }))
  expect(await screen.findByRole('button', { name: 'Remove Charizard from favorites' })).toBeTruthy()
  view.unmount()
  showPokemon(10034)
  expect(await screen.findByRole('button', { name: 'Remove Charizard from favorites' })).toBeTruthy()
  await chooseMega(10035)
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[6,25]')
  fireEvent.click(screen.getByRole('button', { name: 'Remove Charizard from favorites' }))
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[25]')
})
