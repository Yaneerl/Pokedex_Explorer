import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { FAVORITES_STORAGE_KEY } from '../utils/favorites.ts'
import PokemonFavoriteButton from './PokemonFavoriteButton.tsx'

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.removeItem(FAVORITES_STORAGE_KEY)
})

test('adds and removes a favorite with accessible labels, pressed state and empty or full heart', () => {
  render(<PokemonFavoriteButton pokemonId={6} name="Charizard" />)
  const button = screen.getByRole('button', { name: 'Add Charizard to favorites' })
  expect(button.getAttribute('aria-pressed')).toBe('false')
  expect(button.querySelector('[aria-hidden="true"]')?.textContent).toBe('♡')

  fireEvent.click(button)
  expect(screen.getByRole('button', { name: 'Remove Charizard from favorites' }).getAttribute('aria-pressed')).toBe('true')
  expect(button.querySelector('[aria-hidden="true"]')?.textContent).toBe('♥')
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[6]')

  fireEvent.click(button)
  expect(screen.getByRole('button', { name: 'Add Charizard to favorites' }).getAttribute('aria-pressed')).toBe('false')
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[]')
})

test('restores a saved favorite after remount and keeps other saved Pokémon when removing it', () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[25]')
  const first = render(<PokemonFavoriteButton pokemonId={6} name="Charizard" />)
  fireEvent.click(screen.getByRole('button', { name: 'Add Charizard to favorites' }))
  first.unmount()

  render(<PokemonFavoriteButton pokemonId={6} name="Charizard" />)
  fireEvent.click(screen.getByRole('button', { name: 'Remove Charizard from favorites' }))
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[25]')
})

test('recovers from corrupt stored JSON when saving a favorite', () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '{broken')
  render(<PokemonFavoriteButton pokemonId={6} name="Charizard" />)
  fireEvent.click(screen.getByRole('button', { name: 'Add Charizard to favorites' }))
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[6]')
  expect(screen.queryByRole('alert')).toBeNull()
})

test('does not claim a favorite was saved after a write failure and supports retry', () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[25]')
  const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })
  render(<PokemonFavoriteButton pokemonId={6} name="Charizard" />)
  fireEvent.click(screen.getByRole('button', { name: 'Add Charizard to favorites' }))
  expect(screen.getByRole('alert').textContent).toBe('Favorites could not be saved in this browser.')
  expect(screen.getByRole('button', { name: 'Add Charizard to favorites' }).getAttribute('aria-pressed')).toBe('false')
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[25]')

  blocked.mockRestore()
  fireEvent.click(screen.getByRole('button', { name: 'Add Charizard to favorites' }))
  expect(screen.queryByRole('alert')).toBeNull()
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[25,6]')
})
