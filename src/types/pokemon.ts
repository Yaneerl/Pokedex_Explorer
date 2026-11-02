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

export type PokemonStatName =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'special-attack'
  | 'special-defense'
  | 'speed'

export interface PokemonStat {
  name: PokemonStatName
  value: number
}

export interface PokemonWithStats extends Pokemon {
  stats: PokemonStat[]
}

export interface PokemonAbility {
  name: string
  isHidden: boolean
  slot: number
}

export interface PokemonDetailsData extends PokemonWithStats {
  shinyImage: string | null
  speciesUrl: string
  heightMeters: number
  weightKg: number
  abilities: PokemonAbility[]
}

export interface PokemonAbilityResponse {
  ability: NamedApiResource
  is_hidden: boolean
  slot: number
}

export interface PokemonStatResponse {
  base_stat: number
  stat: { name: PokemonStatName }
}

// Only the API fields consumed by the catalog and details are modeled here.
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
  forms: NamedApiResource[]
  species: NamedApiResource
  height: number // Decimeters, as returned by PokeAPI.
  weight: number // Hectograms, as returned by PokeAPI.
  abilities: PokemonAbilityResponse[]
  stats: PokemonStatResponse[]
  types: { type: NamedApiResource }[]
  sprites: {
    front_default: string | null
    front_shiny: string | null
    other?: {
      'official-artwork'?: { front_default: string | null; front_shiny: string | null }
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

export type PokemonClassification = 'regular' | 'legendary' | 'mythical'

export interface PokemonSpeciesResponse {
  is_legendary?: boolean
  is_mythical?: boolean
  genera?: { genus: string; language: NamedApiResource }[]
  flavor_text_entries?: { flavor_text: string; language: NamedApiResource }[]
  varieties: { is_default: boolean; pokemon: NamedApiResource }[]
  evolution_chain: { url: string } | null
}

export interface EvolutionChainLink {
  species: NamedApiResource
  evolves_to: EvolutionChainLink[]
}

export interface EvolutionChainResponse {
  chain: EvolutionChainLink
}

export interface EvolutionNode extends PokemonSummary {
  children: EvolutionNode[]
}

export interface EvolutionStage extends PokemonSummary {
  image: string | null
  children: EvolutionStage[]
}

export interface PokemonFormResponse {
  is_mega: boolean
  names: { name: string; language: NamedApiResource }[]
}

export interface PokemonFormOption {
  label: string
  pokemon: PokemonDetailsData
}

export interface PokemonMegaFormsData {
  regular: PokemonDetailsData
  megaForms: PokemonFormOption[]
}
