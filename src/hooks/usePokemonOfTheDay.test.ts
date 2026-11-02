import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import usePokemonOfTheDay from './usePokemonOfTheDay.ts'
import { DAILY_POKEMON_STORAGE_KEY } from '../utils/dailyPokemon.ts'
import type { Pokemon, PokemonResponse } from '../types/pokemon.ts'

const index = [{ id: 1, name: 'bulbasaur' }, { id: 6, name: 'charizard' }, { id: 150, name: 'mewtwo' }]
const cards: Pokemon[] = index.map((p) => ({ ...p, types: ['normal'], image: '/image-' + p.id + '.png' }))
const options = { index, indexLoading: false, indexError: null, cachedPokemon: [] as Pokemon[], catalogLoading: false, enabled: true }
function data(id: number): PokemonResponse {
  return { id, name: index.find((p) => p.id === id)?.name ?? 'pokemon', species: { name: 'pokemon', url: '/species/' },
    types: [{ type: { name: 'normal', url: '/type/1' } }], height: 10, weight: 100, forms: [], abilities: [], stats: [],
    sprites: { front_default: '/image-' + id + '.png', front_shiny: null } }
}
const settle = async () => { await act(async () => { await Promise.resolve() }) }
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 2, 12))
  window.localStorage.removeItem(DAILY_POKEMON_STORAGE_KEY)
  vi.spyOn(Math, 'random').mockReturnValue(.99)
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input) => Response.json(data(Number(String(input).split('/').at(-1))))))
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); window.localStorage.removeItem(DAILY_POKEMON_STORAGE_KEY) })

test('keeps a full-index choice independent of filtered/cached catalog records and preserves it on refresh', async () => {
  const first = renderHook((props) => usePokemonOfTheDay(props), { initialProps: options })
  await settle()
  expect(first.result.current.pokemon?.id).toBe(150)
  first.rerender({ ...options, cachedPokemon: [cards[0]!] })
  await settle()
  expect(first.result.current.pokemon?.id).toBe(150)
  expect(fetch).toHaveBeenCalledTimes(1)
  first.unmount()
  vi.mocked(Math.random).mockReturnValue(0)
  const refreshed = renderHook(() => usePokemonOfTheDay(options))
  await settle()
  expect(refreshed.result.current.pokemon?.id).toBe(150)
  expect(JSON.parse(window.localStorage.getItem(DAILY_POKEMON_STORAGE_KEY) ?? '{}')).toEqual({ date: '2026-11-02', id: 150 })
})
test('waits for a pending catalog page and reuses its data without another API request', async () => {
  const view = renderHook((props) => usePokemonOfTheDay(props), { initialProps: { ...options, catalogLoading: true } })
  await settle()
  expect(fetch).not.toHaveBeenCalled()
  view.rerender({ ...options, cachedPokemon: cards, catalogLoading: false })
  await settle()
  expect(view.result.current.pokemon).toBe(cards[2])
  expect(fetch).not.toHaveBeenCalled()
})
test('updates at local midnight, excludes yesterday’s Pokémon and cleans up every timer', async () => {
  vi.setSystemTime(new Date(2026, 10, 2, 23, 59, 59))
  window.localStorage.setItem(DAILY_POKEMON_STORAGE_KEY, JSON.stringify({ date: '2026-11-02', id: 1 }))
  vi.mocked(Math.random).mockReturnValue(0)
  const view = renderHook(() => usePokemonOfTheDay({ ...options, cachedPokemon: cards }))
  await settle()
  expect(view.result.current.pokemon?.id).toBe(1)
  await act(async () => { vi.advanceTimersByTime(2000) })
  expect(view.result.current.pokemon?.id).toBe(6)
  expect(JSON.parse(window.localStorage.getItem(DAILY_POKEMON_STORAGE_KEY) ?? '{}')).toEqual({ date: '2026-11-03', id: 6 })
  expect(fetch).not.toHaveBeenCalled()
  view.unmount()
  expect(vi.getTimerCount()).toBe(0)
})
test.each(['focus', 'visibilitychange'])('recovers the date after a suspended tab via %s', async (event) => {
  const view = renderHook(() => usePokemonOfTheDay({ ...options, cachedPokemon: cards }))
  await settle()
  expect(view.result.current.pokemon?.id).toBe(150)
  vi.setSystemTime(new Date(2026, 10, 3, 9))
  await act(async () => { (event === 'focus' ? window : document).dispatchEvent(new Event(event)) })
  expect(view.result.current.pokemon?.id).toBe(6)
})
test('handles a clock/date jump even without a focus event', async () => {
  const view = renderHook(() => usePokemonOfTheDay({ ...options, cachedPokemon: cards }))
  await settle()
  vi.setSystemTime(new Date(2026, 10, 3, 9))
  await act(async () => { vi.advanceTimersByTime(60_000) })
  expect(view.result.current.pokemon?.id).toBe(6)
})
test('keeps a temporary selection through navigation when localStorage is blocked', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked') })
  const view = renderHook((props) => usePokemonOfTheDay(props), { initialProps: { ...options, cachedPokemon: cards } })
  await settle()
  expect(view.result.current.storageWarning).toBe(true)
  view.rerender({ ...options, cachedPokemon: cards, enabled: false })
  await settle()
  expect(vi.getTimerCount()).toBe(0)
  vi.mocked(Math.random).mockReturnValue(0)
  view.rerender({ ...options, cachedPokemon: cards })
  await settle()
  expect(view.result.current.pokemon?.id).toBe(150)
})
test('shows a network error and retries the same daily choice', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response('Unavailable', { status: 503 })).mockResolvedValueOnce(Response.json(data(150)))
  const view = renderHook(() => usePokemonOfTheDay(options))
  await settle()
  expect(view.result.current.error).toContain('Could not load')
  expect(view.result.current.loading).toBe(false)
  expect(view.result.current.canRetry).toBe(true)
  await act(async () => view.result.current.retry())
  expect(view.result.current.pokemon?.id).toBe(150)
  expect(fetch).toHaveBeenCalledTimes(2)
})
test('aborts an old day’s request and ignores its late response after midnight', async () => {
  vi.setSystemTime(new Date(2026, 10, 2, 23, 59, 59))
  window.localStorage.setItem(DAILY_POKEMON_STORAGE_KEY, JSON.stringify({ date: '2026-11-02', id: 1 }))
  let resolveOld: ((response: Response) => void) | undefined
  vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveOld = resolve }))
  vi.mocked(Math.random).mockReturnValue(0)
  const view = renderHook(() => usePokemonOfTheDay(options))
  await settle()
  const signal = vi.mocked(fetch).mock.calls[0]?.[1]?.signal
  await act(async () => { vi.advanceTimersByTime(2000) })
  expect(signal?.aborted).toBe(true)
  expect(view.result.current.pokemon?.id).toBe(6)
  await act(async () => { resolveOld?.(Response.json(data(1))) })
  expect(view.result.current.pokemon?.id).toBe(6)
})
