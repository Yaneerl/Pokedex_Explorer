import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { expect, test, vi } from 'vitest'
import type { DailyPokemonResult } from '../hooks/usePokemonOfTheDay.ts'
import CatalogHeader from './CatalogHeader.tsx'
import PokemonOfTheDay from './PokemonOfTheDay.tsx'
const ready: DailyPokemonResult = { pokemon: { id: 6, name: 'charizard', types: ['fire', 'flying'], image: '/charizard.png' }, loading: false, error: null, retry: vi.fn(), storageWarning: false, canRetry: false }

test('places the complete daily display inside the existing header and navigates to its details', () => {
  render(<MemoryRouter><Routes><Route path="/" element={<CatalogHeader daily={ready} />} /><Route path="/pokemon/6" element={<h1>Charizard details</h1>} /></Routes></MemoryRouter>)
  const section = screen.getByRole('region', { name: 'Pokémon of the Day' })
  expect(section.closest('header')).not.toBeNull()
  expect(section.closest('.catalog-title-panel')).not.toBeNull()
  expect(within(section).getByRole('img').getAttribute('src')).toBe('/charizard.png')
  expect(within(section).getByText('#0006')).toBeTruthy()
  expect(within(section).getByText('fire')).toBeTruthy()
  expect(within(section).getByText('flying')).toBeTruthy()
  expect(within(section).getAllByRole('group')[0]?.querySelectorAll('svg')).toHaveLength(2)
  expect(screen.getByRole('link', { name: 'Favorites' }).getAttribute('href')).toBe('/favorites')
  expect(screen.getByRole('link', { name: 'Pokémon Comparison' }).getAttribute('href')).toBe('/compare')
  fireEvent.click(screen.getByRole('link', { name: 'View Pokémon' }))
  expect(screen.getByRole('heading', { name: 'Charizard details' })).toBeTruthy()
})
test('keeps loading/error states within the daily screen and offers a working retry', () => {
  const retry = vi.fn()
  const view = render(<MemoryRouter><PokemonOfTheDay daily={{ ...ready, pokemon: null, loading: true }} /></MemoryRouter>)
  expect(screen.getByRole('status').textContent).toContain('Scanning')
  expect(screen.queryByRole('link', { name: 'View Pokémon' })).toBeNull()
  view.rerender(<MemoryRouter><PokemonOfTheDay daily={{ ...ready, pokemon: null, error: 'API unavailable', canRetry: true, retry }} /></MemoryRouter>)
  expect(screen.getByRole('alert').textContent).toBe('API unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))
  expect(retry).toHaveBeenCalledOnce()
})
test('replaces a failed image with readable fallback while retaining its navigation and badges', () => {
  render(<MemoryRouter><PokemonOfTheDay daily={ready} /></MemoryRouter>)
  fireEvent.error(screen.getByRole('img'))
  fireEvent.error(screen.getByRole('img'))
  expect(screen.queryByRole('img')).toBeNull()
  expect(screen.getByText('Image unavailable')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'View Pokémon' }).getAttribute('href')).toBe('/pokemon/6')
  expect(screen.getByText('fire')).toBeTruthy()
})
