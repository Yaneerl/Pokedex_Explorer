import type { PokemonSummary } from '../types/pokemon.ts'

export const DAILY_POKEMON_STORAGE_KEY = 'pokedex-explorer:pokemon-of-the-day:v1'
export interface DailyPokemonSelection { date: string; id: number }

export function localDayKey(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}
export function millisecondsUntilLocalMidnight(date: Date): number {
  const midnight = new Date(date)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - date.getTime()
}
function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number)
  return localDayKey(new Date(year, month - 1, day)) === value
}
export function readDailyPokemon(): DailyPokemonSelection | null {
  try {
    const stored = window.localStorage.getItem(DAILY_POKEMON_STORAGE_KEY)
    const value: unknown = stored === null ? null : JSON.parse(stored)
    if (value && typeof value === 'object' && 'date' in value && 'id' in value &&
      typeof value.date === 'string' && validDate(value.date) && typeof value.id === 'number' && Number.isSafeInteger(value.id) && value.id > 0) {
      return { date: value.date, id: value.id }
    }
  } catch {
    // Corrupt or unavailable storage never prevents the catalog from working.
  }
  return null
}
export function writeDailyPokemon(selection: DailyPokemonSelection): boolean {
  try {
    window.localStorage.setItem(DAILY_POKEMON_STORAGE_KEY, JSON.stringify(selection))
    return true
  } catch { return false }
}

/** The input is the full species index, never the searched/filtered catalog page. */
export function chooseDailyPokemon(
  index: readonly PokemonSummary[], previous: DailyPokemonSelection | null, now: Date, random: () => number = Math.random,
): DailyPokemonSelection | null {
  if (index.length === 0) return null
  const date = localDayKey(now)
  if (previous?.date === date && index.some((entry) => entry.id === previous.id)) return previous
  const alternatives = previous ? index.filter((entry) => entry.id !== previous.id) : index
  const pool = alternatives.length > 0 ? alternatives : index
  const selected = pool[Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))]
  return selected ? { date, id: selected.id } : null
}
