import { useEffect, useRef, useState } from 'react'
import type { Pokemon, PokemonResponse, PokemonSummary } from '../types/pokemon.ts'
import toPokemonCard from '../utils/toPokemonCard.ts'
import { chooseDailyPokemon, localDayKey, millisecondsUntilLocalMidnight, readDailyPokemon, writeDailyPokemon } from '../utils/dailyPokemon.ts'
import type { DailyPokemonSelection } from '../utils/dailyPokemon.ts'

interface DailyPokemonOptions {
  index: readonly PokemonSummary[]
  indexLoading: boolean
  indexError: string | null
  cachedPokemon: readonly Pokemon[]
  catalogLoading: boolean
  enabled: boolean
}
export interface DailyPokemonResult {
  pokemon: Pokemon | null
  loading: boolean
  error: string | null
  storageWarning: boolean
  canRetry: boolean
  retry: () => void
}
interface DailyPokemonData { id: number; pokemon: Pokemon | null; error: string | null }

export default function usePokemonOfTheDay({ index, indexLoading, indexError, cachedPokemon, catalogLoading, enabled }: DailyPokemonOptions): DailyPokemonResult {
  const [selection, setSelection] = useState<DailyPokemonSelection | null>(null)
  const remembered = useRef<DailyPokemonSelection | null>(null)
  const cache = useRef(new Map<number, Pokemon>())
  const [result, setResult] = useState<DailyPokemonData | null>(null)
  const [storageWarning, setStorageWarning] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled || indexLoading || indexError || index.length === 0) return
    let midnightTimer = 0
    function refreshDate(): void {
      const now = new Date()
      const today = localDayKey(now)
      const stored = readDailyPokemon()
      const previous = stored?.date === today ? stored : remembered.current?.date === today ? remembered.current : stored ?? remembered.current
      const next = chooseDailyPokemon(index, previous, now)
      if (next) {
        remembered.current = next
        setStorageWarning(stored?.date === next.date && stored.id === next.id ? false : !writeDailyPokemon(next))
        setSelection((current) => current?.date === next.date && current.id === next.id ? current : next)
      }
      window.clearTimeout(midnightTimer)
      midnightTimer = window.setTimeout(refreshDate, millisecondsUntilLocalMidnight(now) + 25)
    }
    function onVisibility(): void { if (document.visibilityState === 'visible') refreshDate() }
    refreshDate()
    // Focus/visibility recover from suspended tabs; the minute check also handles clock/timezone changes.
    const clockTimer = window.setInterval(() => {
      if (remembered.current?.date !== localDayKey(new Date())) refreshDate()
    }, 60_000)
    window.addEventListener('focus', refreshDate)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearTimeout(midnightTimer)
      window.clearInterval(clockTimer)
      window.removeEventListener('focus', refreshDate)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [index, indexLoading, indexError, enabled])

  const id = selection?.id
  const available = cachedPokemon.find((pokemon) => pokemon.id === id)
  useEffect(() => {
    if (!enabled || !id) return
    const existing = cache.current.get(id) ?? available
    if (existing) {
      cache.current.set(id, existing)
      setResult((current) => current?.id === id && current.pokemon === existing ? current : { id, pokemon: existing, error: null })
      return
    }
    // Let the catalog finish its pending page first so its result can be reused.
    if (catalogLoading) return
    const controller = new AbortController()
    async function load(): Promise<void> {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon/' + id, { signal: controller.signal })
        if (!response.ok) throw new Error('Could not load today’s Pokémon.')
        const data: PokemonResponse = await response.json()
        if (data.id !== id) throw new Error('Unexpected daily Pokémon data.')
        const pokemon = toPokemonCard(data)
        if (!controller.signal.aborted) {
          if (cache.current.size >= 8) cache.current.clear()
          cache.current.set(data.id, pokemon)
          setResult({ id: data.id, pokemon, error: null })
        }
      } catch (error) {
        if (!controller.signal.aborted) setResult({ id: id ?? 0, pokemon: null, error: error instanceof Error ? error.message : 'Could not load today’s Pokémon.' })
      }
    }
    void load()
    return () => controller.abort()
  }, [id, available, catalogLoading, enabled, attempt])

  const current = result?.id === id ? result : null
  const error = indexError ?? (!indexLoading && index.length === 0 ? 'No Pokémon are available for today’s pick.' : current?.error ?? null)
  return {
    pokemon: current?.pokemon ?? null,
    loading: enabled && !error && !current?.pokemon,
    error,
    storageWarning,
    canRetry: Boolean(id && !indexError && error),
    retry: () => { setResult(null); setAttempt((value) => value + 1) },
  }
}
