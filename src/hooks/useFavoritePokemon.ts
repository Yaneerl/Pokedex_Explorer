import { useEffect, useState } from 'react'
import type { Pokemon } from '../types/pokemon.ts'
import { readFavorites } from '../utils/favorites.ts'
import loadFavoritePokemon from '../utils/loadFavoritePokemon.ts'

export interface FavoritePokemonResult {
  pokemon: Pokemon[]
  loading: boolean
  error: string | null
}

export default function useFavoritePokemon(enabled: boolean): FavoritePokemonResult {
  const [saved] = useState(readFavorites)
  const [result, setResult] = useState<{ pokemon: Pokemon[]; error: string | null } | null>(null)

  useEffect(() => {
    if (!enabled || saved.error || saved.ids.length === 0) return
    const controller = new AbortController()
    async function load(): Promise<void> {
      try {
        const pokemon = await loadFavoritePokemon(saved.ids, controller.signal)
        if (!controller.signal.aborted) setResult({ pokemon, error: null })
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ pokemon: [], error: error instanceof Error ? error.message : 'Failed to load favorites.' })
          controller.abort()
        }
      }
    }
    load()
    return () => controller.abort()
  }, [enabled, saved])

  const error = saved.error ?? result?.error ?? null
  return { pokemon: result?.pokemon ?? [], error, loading: enabled && !error && saved.ids.length > 0 && !result }
}
