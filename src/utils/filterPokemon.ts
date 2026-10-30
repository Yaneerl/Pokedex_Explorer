import type {
  GenerationFilter, GenerationResults, PokemonSummary, TypeFilter, TypeResults,
} from '../types/pokemon.ts'

export function filterPokemonByType(
  pokemon: PokemonSummary[],
  selectedType: TypeFilter,
  typeResults: TypeResults
): PokemonSummary[] {
  if (selectedType === 'all') return pokemon
  if (typeResults.type !== selectedType) return []

  return pokemon.filter((item) => typeResults.ids.has(item.id))
}

export function filterPokemonByGeneration(
  pokemon: PokemonSummary[],
  selectedGeneration: GenerationFilter,
  generationResults: GenerationResults
): PokemonSummary[] {
  if (selectedGeneration === 'all') return pokemon
  if (generationResults.generation !== selectedGeneration) return []

  return pokemon.filter((item) => generationResults.ids.has(item.id))
}
