import { useEffect, useState } from 'react'
import type { PokemonSpeciesResponse } from '../types/pokemon.ts'

export interface PokemonSpeciesResult {
  data: PokemonSpeciesResponse | null
  loading: boolean
  error: string | null
}

interface SpeciesState {
  url: string
  data: PokemonSpeciesResponse | null
  error: string | null
}

export default function usePokemonSpecies(url: string): PokemonSpeciesResult {
  const [result, setResult] = useState<SpeciesState | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    async function load(): Promise<void> {
      try {
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error('Failed to load Pokémon species')
        const data: PokemonSpeciesResponse = await response.json()
        if (!controller.signal.aborted) setResult({ url, data, error: null })
      } catch (error) {
        if (!controller.signal.aborted) setResult({ url, data: null, error: error instanceof Error ? error.message : 'Failed to load Pokémon species' })
      }
    }
    load()
    return () => controller.abort()
  }, [url])
  const current = result?.url === url ? result : null
  return { data: current?.data ?? null, loading: !current, error: current?.error ?? null }
}
