import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'
import type { EvolutionChainLink } from '../types/pokemon.ts'
import PokemonEvolution from './PokemonEvolution.tsx'

const speciesUrl = 'https://pokeapi.co/api/v2/pokemon-species/1/'
const chainUrl = 'https://pokeapi.co/api/v2/evolution-chain/1/'

function link(id: number, name: string, children: EvolutionChainLink[] = []): EvolutionChainLink {
  return {
    species: { name, url: 'https://pokeapi.co/api/v2/pokemon-species/' + id + '/' },
    evolves_to: children,
  }
}

function mockChain(chain: EvolutionChainLink, requestedSpeciesUrl = speciesUrl): void {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input) => {
    const url = String(input)
    if (url === requestedSpeciesUrl) return Response.json({ evolution_chain: { url: chainUrl } })
    if (url === chainUrl) return Response.json({ chain })
    const id = url.split('/').at(-1)
    return Response.json({ sprites: { front_default: '/images/' + id + '.png' } })
  }))
}

afterEach(() => vi.unstubAllGlobals())

test('loads the real tree into linked stages with images and navigates through React Router', async () => {
  mockChain(link(1, 'bulbasaur', [link(2, 'ivysaur', [link(3, 'venusaur')])]))
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<PokemonEvolution speciesUrl={speciesUrl} />} />
        <Route path="/pokemon/2" element={<h1>Ivysaur details</h1>} />
      </Routes>
    </MemoryRouter>,
  )

  expect(screen.getByRole('status').textContent).toBe('Loading evolution chain...')
  const ivysaur = await screen.findByRole('link', { name: 'Ivysaur' })
  const section = screen.getByRole('region', { name: 'Evolution Chain' })
  expect(within(section).getAllByRole('link')).toHaveLength(3)
  expect(section.querySelectorAll('.pokemon-evolution-arrow')).toHaveLength(2)
  expect(ivysaur.getAttribute('href')).toBe('/pokemon/2')
  expect(ivysaur.querySelector('img')?.getAttribute('src')).toBe('/images/2.png')
  expect(screen.queryByRole('status')).toBeNull()

  fireEvent.click(ivysaur)
  expect(await screen.findByRole('heading', { name: 'Ivysaur details' })).toBeTruthy()
})

test('renders branched evolutions under one shared parent with separate destinations', async () => {
  mockChain(link(133, 'eevee', [link(134, 'vaporeon'), link(135, 'jolteon'), link(700, 'sylveon')]))
  render(<MemoryRouter><PokemonEvolution speciesUrl={speciesUrl} /></MemoryRouter>)

  await screen.findByRole('link', { name: 'Eevee' })
  const section = screen.getByRole('region', { name: 'Evolution Chain' })
  expect(section.querySelectorAll('.pokemon-evolution-tree > li')).toHaveLength(1)
  expect(section.querySelectorAll('.pokemon-evolution-branches > li')).toHaveLength(3)
  expect(section.querySelectorAll('.pokemon-evolution-arrow')).toHaveLength(3)
  expect(screen.getByRole('link', { name: 'Vaporeon' }).getAttribute('href')).toBe('/pokemon/134')
  expect(screen.getByRole('link', { name: 'Jolteon' }).getAttribute('href')).toBe('/pokemon/135')
  expect(screen.getByRole('link', { name: 'Sylveon' }).getAttribute('href')).toBe('/pokemon/700')
})

test('hides the entire section when the full chain contains only one Pokémon', async () => {
  const mewtwoSpeciesUrl = 'https://pokeapi.co/api/v2/pokemon-species/150/'
  mockChain(link(150, 'mewtwo'), mewtwoSpeciesUrl)
  const { container } = render(
    <MemoryRouter><PokemonEvolution speciesUrl={mewtwoSpeciesUrl} /></MemoryRouter>,
  )

  await waitFor(() => expect(container.childElementCount).toBe(0))
  expect(screen.queryByRole('region', { name: 'Evolution Chain' })).toBeNull()
  expect(screen.queryByRole('heading', { name: 'Evolution Chain' })).toBeNull()
  expect(screen.queryByText('This Pokémon has no evolutions.')).toBeNull()
  expect(screen.queryByRole('link', { name: 'Mewtwo' })).toBeNull()
  expect(container.querySelector('img')).toBeNull()
})

test('keeps the whole chain visible when viewing its final stage, Venusaur', async () => {
  const venusaurSpeciesUrl = 'https://pokeapi.co/api/v2/pokemon-species/3/'
  mockChain(link(1, 'bulbasaur', [link(2, 'ivysaur', [link(3, 'venusaur')])]), venusaurSpeciesUrl)
  render(<MemoryRouter><PokemonEvolution speciesUrl={venusaurSpeciesUrl} /></MemoryRouter>)

  await screen.findByRole('link', { name: 'Venusaur' })
  const section = screen.getByRole('region', { name: 'Evolution Chain' })
  expect(within(section).getAllByRole('link')).toHaveLength(3)
  expect(screen.getByRole('link', { name: 'Bulbasaur' }).getAttribute('href')).toBe('/pokemon/1')
  expect(screen.getByRole('link', { name: 'Ivysaur' }).getAttribute('href')).toBe('/pokemon/2')
  expect(screen.getByRole('link', { name: 'Venusaur' }).getAttribute('href')).toBe('/pokemon/3')
  expect(section.querySelectorAll('.pokemon-evolution-arrow')).toHaveLength(2)
})

test('reports a failed chain request and leaves the loading state', async () => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input) =>
    String(input) === speciesUrl
      ? Response.json({ evolution_chain: { url: chainUrl } })
      : new Response(null, { status: 503 }),
  ))
  render(<MemoryRouter><PokemonEvolution speciesUrl={speciesUrl} /></MemoryRouter>)

  expect((await screen.findByRole('alert')).textContent).toBe('Error: Failed to load evolution chain')
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.queryByRole('link')).toBeNull()
})

test('aborts pending requests on Pokémon changes and unmount without displaying abort errors', async () => {
  const signals: AbortSignal[] = []
  vi.stubGlobal('fetch', vi.fn<typeof fetch>((_input, init) => new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal
    if (!signal) throw new Error('Expected an AbortSignal')
    signals.push(signal)
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  })))
  const { rerender, unmount } = render(
    <MemoryRouter><PokemonEvolution speciesUrl={speciesUrl} /></MemoryRouter>,
  )

  expect(signals).toHaveLength(1)
  expect(signals[0]?.aborted).toBe(false)
  rerender(<MemoryRouter><PokemonEvolution speciesUrl="https://pokeapi.co/api/v2/pokemon-species/133/" /></MemoryRouter>)
  await waitFor(() => expect(signals).toHaveLength(2))
  expect(signals[0]?.aborted).toBe(true)
  expect(signals[1]?.aborted).toBe(false)
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByRole('status')).toBeTruthy()

  unmount()
  expect(signals[1]?.aborted).toBe(true)
})
