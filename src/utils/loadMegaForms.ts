import type {
  PokemonFormOption, PokemonFormResponse, PokemonMegaFormsData,
  PokemonResponse, PokemonSpeciesResponse,
} from '../types/pokemon.ts'
import toPokemonDetails from './toPokemonDetails.ts'

async function fetchData<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Failed to load Mega forms')
  return response.json()
}

export default async function loadMegaForms(
  current: PokemonResponse,
  signal: AbortSignal,
  speciesData?: PokemonSpeciesResponse,
): Promise<PokemonMegaFormsData> {
  const species = speciesData ?? await fetchData<PokemonSpeciesResponse>(current.species.url, signal)
  const regularResource = species.varieties.find((variety) => variety.is_default)?.pokemon
  if (!regularResource) throw new Error('Regular form is unavailable')

  const regular = regularResource.name === current.name
    ? current
    : await fetchData<PokemonResponse>(regularResource.url, signal)
  const candidates = species.varieties.filter((variety) => !variety.is_default)
  const options = await Promise.all(candidates.map(async (variety): Promise<PokemonFormOption | null> => {
    const pokemon = variety.pokemon.name === current.name
      ? current
      : await fetchData<PokemonResponse>(variety.pokemon.url, signal)
    const forms = await Promise.all(pokemon.forms.map((resource) =>
      fetchData<PokemonFormResponse>(resource.url, signal),
    ))
    const mega = forms.find((form) => form.is_mega)
    if (!mega) return null

    const label = mega.names.find((entry) => entry.language.name === 'en')?.name
      || pokemon.name.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    return { label, pokemon: toPokemonDetails(pokemon) }
  }))

  signal.throwIfAborted()
  return {
    regular: toPokemonDetails(regular),
    megaForms: options.filter((option): option is PokemonFormOption => option !== null),
  }
}
