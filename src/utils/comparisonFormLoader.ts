import type { PokemonMegaFormsData, PokemonResponse } from '../types/pokemon.ts'
import loadMegaForms from './loadMegaForms.ts'

interface PendingResource<T> {
  controller: AbortController
  promise: Promise<T>
  consumers: number
}
export interface ComparisonFormLoader {
  rememberPokemon: (pokemon: PokemonResponse) => void
  loadPokemon: (id: number, signal: AbortSignal) => Promise<PokemonResponse>
  loadForms: (id: number, signal: AbortSignal) => Promise<PokemonMegaFormsData>
}

/** Share in-flight reads across the two slots; cancel only when no slot still needs them. */
function sharedRead<T>(
  cache: Map<number, T>, pending: Map<number, PendingResource<T>>,
  id: number, signal: AbortSignal, load: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  signal.throwIfAborted()
  const cached = cache.get(id)
  if (cached) return Promise.resolve(cached)
  let request = pending.get(id)
  if (!request || request.controller.signal.aborted) {
    const controller = new AbortController()
    const resource: PendingResource<T> = {
      controller, consumers: 0,
      promise: load(controller.signal).then((data) => {
        controller.signal.throwIfAborted()
        if (cache.size >= 24) cache.delete(cache.keys().next().value ?? id)
        cache.set(id, data)
        return data
      }).finally(() => {
        if (pending.get(id) === resource) pending.delete(id)
      }),
    }
    request = resource
    pending.set(id, resource)
  }
  const resource = request
  resource.consumers += 1
  return new Promise<T>((resolve, reject) => {
    let settled = false
    function release(): boolean {
      if (settled) return false
      settled = true
      signal.removeEventListener('abort', abort)
      resource.consumers -= 1
      if (resource.consumers === 0 && pending.get(id) === resource) resource.controller.abort()
      return true
    }
    function abort(): void {
      if (release()) reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', abort, { once: true })
    resource.promise.then(
      (data) => { if (release()) resolve(data) },
      (error: unknown) => { if (release()) reject(error) },
    )
    if (signal.aborted) abort()
  })
}

export default function createComparisonFormLoader(): ComparisonFormLoader {
  const pokemonCache = new Map<number, PokemonResponse>()
  const pokemonPending = new Map<number, PendingResource<PokemonResponse>>()
  const formsCache = new Map<number, PokemonMegaFormsData>()
  const formsPending = new Map<number, PendingResource<PokemonMegaFormsData>>()
  function loadPokemon(id: number, signal: AbortSignal): Promise<PokemonResponse> {
    return sharedRead(pokemonCache, pokemonPending, id, signal, async (requestSignal) => {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon/' + id, { signal: requestSignal })
      if (response.status === 404) throw new Error('Pokémon was not found.')
      if (!response.ok) throw new Error('Failed to load Pokémon.')
      const data: PokemonResponse = await response.json()
      if (data.id !== id) throw new Error('Unexpected Pokémon data.')
      return data
    })
  }
  function loadForms(id: number, signal: AbortSignal): Promise<PokemonMegaFormsData> {
    return sharedRead(formsCache, formsPending, id, signal, async (requestSignal) => {
      const pokemon = await loadPokemon(id, requestSignal)
      return loadMegaForms(pokemon, requestSignal)
    })
  }
  function rememberPokemon(pokemon: PokemonResponse): void {
    if (pokemonCache.size >= 24 && !pokemonCache.has(pokemon.id)) pokemonCache.delete(pokemonCache.keys().next().value ?? pokemon.id)
    pokemonCache.set(pokemon.id, pokemon)
  }
  return { loadPokemon, loadForms, rememberPokemon }
}
