import type { PokemonSpeciesResponse } from '../types/pokemon.ts'

interface PokemonSpeciesInfo {
  genus: string | null
  description: string | null
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export default function getPokemonSpeciesInfo(species: PokemonSpeciesResponse | null): PokemonSpeciesInfo {
  const genus = species?.genera?.find((entry) => entry.language.name === 'en' && normalizeText(entry.genus))
  const descriptions = [...new Set((species?.flavor_text_entries ?? [])
    .filter((entry) => entry.language.name === 'en')
    .map((entry) => normalizeText(entry.flavor_text))
    .filter(Boolean))]
  return { genus: genus ? normalizeText(genus.genus) : null, description: descriptions[0] ?? null }
}
