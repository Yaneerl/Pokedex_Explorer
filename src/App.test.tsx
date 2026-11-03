import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App.tsx'
import { FAVORITES_STORAGE_KEY } from './utils/favorites.ts'

const api = 'https://pokeapi.co/api/v2'

afterEach(() => {
  vi.unstubAllGlobals()
  window.localStorage.removeItem(FAVORITES_STORAGE_KEY)
})

test.each(['Favorites', 'Pokémon Comparison'])('keeps catalog search, type, generation, classification, sorting and page after visiting %s', async (destination) => {
  const species = Array.from({ length: 45 }, (_, index) => ({
    name: 'pokemon-' + (index + 1), url: api + '/pokemon-species/' + (index + 1) + '/',
  }))
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[25]')
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input) => {
    const url = String(input)
    if (url.includes('/pokemon-species?')) return Response.json({ results: species })
    if (url === api + '/type/fire') return Response.json({ pokemon: species.map((pokemon) => ({ pokemon })) })
    if (url === api + '/generation/1') return Response.json({ pokemon_species: species })
    if (url.includes('/graphql/')) return Response.json({ data: { pokemon_v2_pokemonspecies: [{ id: 999, is_legendary: true, is_mythical: false }] } })
    if (url.startsWith(api + '/pokemon/')) {
      const id = Number(url.split('/').at(-1))
      return Response.json({
        id, name: 'pokemon-' + id,
        types: [{ type: { name: 'fire', url: '/type/10/' } }],
        sprites: { front_default: '/pokemon-' + id + '.png' },
      })
    }
    throw new Error('Unexpected request: ' + url)
  }))
  const { container } = render(<MemoryRouter><App /></MemoryRouter>)
  await screen.findByText('Showing 1–20 of 45 Pokémon')
  fireEvent.change(screen.getByLabelText('Search Pokémon'), { target: { value: 'pokemon' } })
  fireEvent.change(screen.getByLabelText('Pokémon Type'), { target: { value: 'fire' } })
  fireEvent.change(screen.getByLabelText('Generation'), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('Classification'), { target: { value: 'regular' } })
  fireEvent.change(screen.getByLabelText('Sort By'), { target: { value: 'id-desc' } })
  await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  await screen.findByText('Showing 21–40 of 45 Pokémon')
  const before = Array.from(container.querySelectorAll('.pokemon-number'), (number) => number.textContent)
  expect(before).toHaveLength(20)

  fireEvent.click(screen.getByRole('link', { name: destination }))
  if (destination === 'Favorites') await screen.findByRole('button', { name: 'View pokemon-25 details' })
  else await screen.findByRole('heading', { name: 'Pokémon Comparison' })
  const back = screen.getByRole('link', { name: destination === 'Favorites' ? 'Back to Pokédex' : '← Back to Pokédex' })
  expect(back.getAttribute('href')).toBe('/')
  fireEvent.click(back)
  await screen.findByText('Showing 21–40 of 45 Pokémon')
  expect(screen.getByLabelText('Search Pokémon')).toHaveProperty('value', 'pokemon')
  expect(screen.getByLabelText('Pokémon Type')).toHaveProperty('value', 'fire')
  expect(screen.getByLabelText('Generation')).toHaveProperty('value', '1')
  expect(screen.getByLabelText('Classification')).toHaveProperty('value', 'regular')
  expect(screen.getByLabelText('Sort By')).toHaveProperty('value', 'id-desc')
  expect(screen.getByText('Page 2 of 3')).toBeTruthy()
  expect(Array.from(container.querySelectorAll('.pokemon-number'), (number) => number.textContent)).toEqual(before)
})
