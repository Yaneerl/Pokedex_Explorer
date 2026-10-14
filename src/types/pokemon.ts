export const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass',
  'ice', 'fighting', 'poison', 'ground', 'flying',
  'psychic', 'bug', 'rock', 'ghost', 'dragon',
  'dark', 'steel', 'fairy',
] as const

export const GENERATIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

export type TypeFilter = 'all' | (typeof POKEMON_TYPES)[number]
export type GenerationFilter = 'all' | (typeof GENERATIONS)[number]
export type ClassificationFilter = 'all' | 'regular' | 'legendary' | 'mythical'
export type SortOrder = 'id-asc' | 'id-desc' | 'name-asc' | 'name-desc'

export interface PokemonSummary {
  id: number
  name: string
}

export interface Pokemon extends PokemonSummary {
  types: string[]
  image: string | null
}

// Only the API fields consumed by the catalog are modeled here.
export interface NamedApiResource {
  name: string
  url: string
}

export interface SpeciesIndexResponse {
  results: NamedApiResource[]
}

export interface PokemonTypeResponse {
  pokemon: { pokemon: NamedApiResource }[]
}

export interface PokemonGenerationResponse {
  pokemon_species: NamedApiResource[]
}

export interface PokemonResponse extends PokemonSummary {
  types: { type: NamedApiResource }[]
  sprites: {
    front_default: string | null
    other?: {
      'official-artwork'?: { front_default: string | null }
    }
  }
}

export interface ClassificationSpecies {
  id: number
  is_legendary: boolean
  is_mythical: boolean
}

export interface ClassificationResponse {
  data?: { pokemon_v2_pokemonspecies: ClassificationSpecies[] } | null
  errors?: { message: string }[]
}

export interface ClassificationData {
  loaded: boolean
  legendaryIds: Set<number>
  mythicalIds: Set<number>
}

export interface TypeResults {
  type: TypeFilter
  ids: Set<number>
}

export interface GenerationResults {
  generation: GenerationFilter
  ids: Set<number>
}
