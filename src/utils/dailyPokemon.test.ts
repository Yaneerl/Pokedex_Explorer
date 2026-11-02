import { afterEach, expect, test, vi } from 'vitest'
import { DAILY_POKEMON_STORAGE_KEY, chooseDailyPokemon, localDayKey, millisecondsUntilLocalMidnight, readDailyPokemon, writeDailyPokemon } from './dailyPokemon.ts'
const index = [{ id: 6, name: 'charizard' }, { id: 150, name: 'mewtwo' }, { id: 1025, name: 'pecharunt' }]
const today = new Date(2026, 10, 2, 12)
afterEach(() => { vi.restoreAllMocks(); window.localStorage.removeItem(DAILY_POKEMON_STORAGE_KEY) })

test('chooses from the entire supplied index, including the last Pokédex entry', () => {
  expect(chooseDailyPokemon(index, null, today, () => .999)).toEqual({ date: '2026-11-02', id: 1025 })
})
test('preserves a saved valid choice for the same local day without drawing again', () => {
  const random = vi.fn(() => 0)
  const saved = { date: '2026-11-02', id: 150 }
  expect(chooseDailyPokemon(index, saved, today, random)).toBe(saved)
  expect(random).not.toHaveBeenCalled()
})
test('avoids the previous choice on the next day when alternatives exist', () => {
  expect(chooseDailyPokemon(index, { date: '2026-11-01', id: 6 }, today, () => 0)?.id).toBe(150)
})
test('handles an empty pool, a single available Pokémon and a stale unavailable ID', () => {
  expect(chooseDailyPokemon([], null, today)).toBeNull()
  expect(chooseDailyPokemon(index.slice(0, 1), { date: '2026-11-01', id: 6 }, today)?.id).toBe(6)
  expect(chooseDailyPokemon(index, { date: '2026-11-02', id: 99999 }, today, () => 0)?.id).toBe(6)
})
test('uses calendar components in local time and schedules the next local midnight', () => {
  const late = new Date(2026, 11, 31, 23, 59, 59)
  vi.spyOn(late, 'toISOString').mockImplementation(() => { throw new Error('UTC must not be used') })
  expect(localDayKey(late)).toBe('2026-12-31')
  expect(millisecondsUntilLocalMidnight(late)).toBe(1000)
  expect(localDayKey(new Date(2027, 0, 1, 0))).toBe('2027-01-01')
})
test('stores and reads a typed daily choice', () => {
  expect(writeDailyPokemon({ date: '2026-11-02', id: 150 })).toBe(true)
  expect(readDailyPokemon()).toEqual({ date: '2026-11-02', id: 150 })
})
test.each(['{bad', '[]', '{}', '{"date":"2026-02-30","id":6}', '{"date":"2026-11-02","id":-1}', '{"date":"2026-11-02","id":1.5}'])('ignores malformed stored data: %s', (value) => {
  window.localStorage.setItem(DAILY_POKEMON_STORAGE_KEY, value)
  expect(readDailyPokemon()).toBeNull()
})
test('survives unavailable browser storage', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked') })
  expect(readDailyPokemon()).toBeNull()
  expect(writeDailyPokemon({ date: '2026-11-02', id: 6 })).toBe(false)
})
