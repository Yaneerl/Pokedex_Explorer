import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'
import App from '../App.tsx'
import type { Pokemon, PokemonResponse } from '../types/pokemon.ts'
import { FAVORITES_STORAGE_KEY } from '../utils/favorites.ts'
import CatalogPokemonCard from './CatalogPokemonCard.tsx'

const charizard: Pokemon = { id: 6, name: 'charizard', image: '/charizard.png', types: ['fire', 'flying'] }
const show = (pokemon = charizard, onSelect = vi.fn<(pokemon: Pokemon) => void>()) => {
  const view = render(<ul><CatalogPokemonCard pokemon={pokemon} onSelect={onSelect} /></ul>)
  return { ...view, onSelect }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.localStorage.removeItem(FAVORITES_STORAGE_KEY)
})

test('shows the Pokédex identity, artwork and both types with two separate accessible actions', () => {
  const { container } = show()
  expect(screen.getByText('#0006')).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'charizard' })).toBeTruthy()
  expect(screen.getByAltText('charizard official artwork')).toBeTruthy()
  expect(screen.getByText('fire')).toBeTruthy()
  expect(screen.getByText('flying')).toBeTruthy()
  const details = screen.getByRole('button', { name: 'View charizard details' })
  const favorite = screen.getByRole('button', { name: 'Add charizard to favorites' })
  expect(details.contains(favorite)).toBe(false)
  expect(favorite.contains(details)).toBe(false)
  expect(container.querySelectorAll('button button, [role="button"] button')).toHaveLength(0)
})

test('the compact heart adds and removes the original ID without duplicates, other-favorite loss or navigation', () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[25]')
  const { onSelect } = show()
  fireEvent.click(screen.getByRole('button', { name: 'Add charizard to favorites' }))
  expect(screen.getByRole('button', { name: 'Remove charizard from favorites' }).getAttribute('aria-pressed')).toBe('true')
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[25,6]')
  fireEvent.click(screen.getByRole('button', { name: 'Remove charizard from favorites' }))
  expect(screen.getByRole('button', { name: 'Add charizard to favorites' }).getAttribute('aria-pressed')).toBe('false')
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[25]')
  expect(onSelect).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'View charizard details' }))
  expect(onSelect).toHaveBeenCalledExactlyOnceWith(charizard)
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[25]')
})

test('a remounted catalog card restores its saved heart state', () => {
  const first = show()
  fireEvent.click(screen.getByRole('button', { name: 'Add charizard to favorites' }))
  first.unmount()
  show()
  expect(screen.getByRole('button', { name: 'Remove charizard from favorites' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'Remove charizard from favorites' }))
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[]')
})

test('missing and failed artwork uses a labeled fallback and a replacement image can render', () => {
  const { rerender } = show({ ...charizard, image: null })
  expect(screen.getByRole('img', { name: 'No artwork available for charizard' })).toBeTruthy()
  rerender(<ul><CatalogPokemonCard pokemon={charizard} onSelect={vi.fn()} /></ul>)
  fireEvent.error(screen.getByAltText('charizard official artwork'))
  expect(screen.queryByAltText('charizard official artwork')).toBeNull()
  expect(screen.getByRole('img', { name: 'No artwork available for charizard' })).toBeTruthy()
  rerender(<ul><CatalogPokemonCard pokemon={{ ...charizard, image: '/replacement.png' }} onSelect={vi.fn()} /></ul>)
  expect(screen.getByAltText('charizard official artwork').getAttribute('src')).toBe('/replacement.png')
  expect(screen.queryByText('No image')).toBeNull()
})

test('a failed favorite write shows an error without marking the heart saved or opening details', () => {
  const { onSelect } = show()
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })
  fireEvent.click(screen.getByRole('button', { name: 'Add charizard to favorites' }))
  expect(screen.getByRole('alert').textContent).toContain('could not be saved')
  expect(screen.getByRole('button', { name: 'Add charizard to favorites' }).getAttribute('aria-pressed')).toBe('false')
  expect(onSelect).not.toHaveBeenCalled()
})

test('the real App navigates from a catalog card to details and back while retaining search and its favorite', async () => {
  const api = 'https://pokeapi.co/api/v2'
  const response: PokemonResponse = {
    id: 6, name: 'charizard', height: 17, weight: 905,
    species: { name: 'charizard', url: api + '/pokemon-species/6/' },
    forms: [], abilities: [],
    types: ['fire', 'flying'].map((name) => ({ type: { name, url: api + '/type/' + name } })),
    stats: [
      { base_stat: 78, stat: { name: 'hp' } }, { base_stat: 84, stat: { name: 'attack' } },
      { base_stat: 78, stat: { name: 'defense' } }, { base_stat: 109, stat: { name: 'special-attack' } },
      { base_stat: 85, stat: { name: 'special-defense' } }, { base_stat: 100, stat: { name: 'speed' } },
    ],
    sprites: { front_default: '/charizard.png', front_shiny: null },
  }
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input) => {
    const url = String(input)
    if (url.includes('/pokemon-species?')) return Response.json({ results: [response.species] })
    if (url === api + '/pokemon/6') return Response.json(response)
    if (url === response.species.url) return Response.json({ evolution_chain: null, varieties: [{ is_default: true, pokemon: { name: 'charizard', url: api + '/pokemon/6' } }] })
    throw new Error('Unexpected request: ' + url)
  }))
  render(<MemoryRouter><App /></MemoryRouter>)
  await screen.findByRole('button', { name: 'View charizard details' })
  fireEvent.change(screen.getByLabelText('Search Pokémon'), { target: { value: 'char' } })
  await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
  fireEvent.click(screen.getByRole('button', { name: 'Add charizard to favorites' }))
  expect(screen.getByRole('heading', { name: 'PokéDex Explorer' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'View charizard details' }))
  await screen.findByRole('heading', { name: 'Charizard' })
  fireEvent.click(screen.getByRole('button', { name: '← Back to Pokédex' }))
  await screen.findByRole('button', { name: 'View charizard details' })
  expect(screen.getByLabelText('Search Pokémon')).toHaveProperty('value', 'char')
  expect(screen.getByRole('button', { name: 'Remove charizard from favorites' }).getAttribute('aria-pressed')).toBe('true')
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[6]')
})
