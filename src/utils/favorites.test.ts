import { afterEach, expect, test, vi } from 'vitest'
import { FAVORITES_STORAGE_KEY, readFavorites, setFavorite, writeFavorites } from './favorites.ts'

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.removeItem(FAVORITES_STORAGE_KEY)
})

test('starts with an empty list when no favorites have been saved', () => {
  expect(readFavorites()).toEqual({ ids: [], error: null })
})

test.each(['{invalid json', '{"ids":[6]}', 'null'])('safely ignores corrupt or unsupported storage: %s', (stored) => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, stored)
  expect(readFavorites()).toEqual({ ids: [], error: null })
})

test('deduplicates saved IDs and ignores invalid entries without losing valid favorites', () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[6,6,25,0,-1,1.5,"150",null,{},9007199254740992]')
  expect(readFavorites()).toEqual({ ids: [6, 25], error: null })
})

test('adds and removes favorites idempotently while preserving other Pokémon and the input list', () => {
  const original = [6, 25]
  expect(setFavorite(original, 6, true)).toEqual([6, 25])
  const added = setFavorite(original, 150, true)
  expect(added).toEqual([6, 25, 150])
  const removed = setFavorite(added, 6, false)
  expect(removed).toEqual([25, 150])
  expect(setFavorite(removed, 6, false)).toEqual([25, 150])
  expect(original).toEqual([6, 25])
})

test('persists unique favorites and removals in real localStorage for subsequent reads', () => {
  expect(writeFavorites([6, 6, 25])).toBeNull()
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[6,25]')
  expect(readFavorites().ids).toEqual([6, 25])
  expect(writeFavorites(setFavorite(readFavorites().ids, 6, false))).toBeNull()
  expect(readFavorites().ids).toEqual([25])
})

test('reports blocked storage reads without throwing', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError') })
  expect(readFavorites()).toEqual({ ids: [], error: 'Favorites could not be read in this browser.' })
})

test('reports failed storage writes without throwing or changing saved favorites', () => {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, '[25]')
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })
  expect(writeFavorites([6, 25])).toBe('Favorites could not be saved in this browser.')
  expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe('[25]')
})
