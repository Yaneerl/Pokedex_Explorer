export const FAVORITES_STORAGE_KEY = 'pokedex-explorer:favorites'

export type FavoriteIds = number[]

export interface FavoritesState {
  ids: FavoriteIds
  error: string | null
}

function isPokemonId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function normalizeIds(value: unknown): FavoriteIds {
  const entries: unknown[] = Array.isArray(value) ? value : []
  return [...new Set(entries.filter(isPokemonId))]
}

export function readFavorites(): FavoritesState {
  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    const parsed: unknown = stored === null ? [] : JSON.parse(stored)
    return { ids: normalizeIds(parsed), error: null }
  } catch (error) {
    if (error instanceof SyntaxError) return { ids: [], error: null }
    return { ids: [], error: 'Favorites could not be read in this browser.' }
  }
}

export function setFavorite(ids: readonly number[], pokemonId: number, favorite: boolean): FavoriteIds {
  const current = normalizeIds(ids)
  if (!isPokemonId(pokemonId)) return current
  return favorite ? normalizeIds([...current, pokemonId]) : current.filter((id) => id !== pokemonId)
}

export function writeFavorites(ids: readonly number[]): string | null {
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(normalizeIds(ids)))
    return null
  } catch {
    return 'Favorites could not be saved in this browser.'
  }
}
