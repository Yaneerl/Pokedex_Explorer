import InterfaceIcon from './InterfaceIcon.tsx'
import { GENERATIONS, POKEMON_TYPES } from '../types/pokemon.ts'
import type {
  ClassificationFilter, GenerationFilter, SortOrder, TypeFilter,
} from '../types/pokemon.ts'

interface PokemonFiltersProps {
  search: string
  selectedType: TypeFilter
  selectedGeneration: GenerationFilter
  selectedClassification: ClassificationFilter
  sortBy: SortOrder
  onSearchChange: (value: string) => void
  onTypeChange: (value: TypeFilter) => void
  onGenerationChange: (value: GenerationFilter) => void
  onClassificationChange: (value: ClassificationFilter) => void
  onSortChange: (value: SortOrder) => void
  onReset: () => void
}

export default function PokemonFilters({
  search,
  selectedType,
  selectedGeneration,
  selectedClassification,
  sortBy,
  onSearchChange,
  onTypeChange,
  onGenerationChange,
  onClassificationChange,
  onSortChange,
  onReset,
}: PokemonFiltersProps) {
  const hasFilters =
    search.trim() !== '' ||
    selectedType !== 'all' ||
    selectedGeneration !== 'all' ||
    selectedClassification !== 'all' ||
    sortBy !== 'id-asc'

  return (
    <section className="search-section catalog-filters" aria-label="Pokémon filters">
      <div className="catalog-panel-heading">
        <span className="catalog-zone" aria-hidden="true">02</span>
        <h2>Search &amp; Filters</h2>
      </div>
      <span className="catalog-filter-system" aria-hidden="true"><span />CATALOG CONTROL / 05</span>
      <div className="catalog-console-body">
        <div className="filter-field filter-field--search">
          <span className="catalog-search-code" aria-hidden="true">POKÉDEX / INDEX SEARCH</span>
          <label htmlFor="pokemon-search"><InterfaceIcon name="search" />Search Pokémon</label>
          <div className="catalog-search-input">
            <InterfaceIcon name="search" />
            <input
              id="pokemon-search"
              type="search"
              placeholder="Name or #..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <p className="catalog-search-hint">Search by name or Pokédex number.</p>
        </div>

        <div className="catalog-filter-bank">
          <span className="catalog-filter-bank-label" aria-hidden="true">REFINE RESULTS / 04</span>
          <div className="catalog-filter-grid">
            <div className="filter-field">
              <label htmlFor="pokemon-type"><InterfaceIcon name="filter" />Pokémon Type</label>
              <select
                id="pokemon-type"
                value={selectedType}
                onChange={(event) => onTypeChange(event.target.value as TypeFilter)}
              >
                <option value="all">All Types</option>
                {POKEMON_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="pokemon-generation"><InterfaceIcon name="layers" />Generation</label>
              <select
                id="pokemon-generation"
                value={selectedGeneration}
                onChange={(event) => onGenerationChange(event.target.value as GenerationFilter)}
              >
                <option value="all">All Generations</option>
                {GENERATIONS.map((generation) => (
                  <option key={generation} value={String(generation)}>
                    Generation {generation}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="pokemon-classification"><InterfaceIcon name="classification" />Classification</label>
              <select
                id="pokemon-classification"
                value={selectedClassification}
                onChange={(event) => onClassificationChange(event.target.value as ClassificationFilter)}
              >
                <option value="all">All Pokémon</option>
                <option value="regular">Regular</option>
                <option value="legendary">Legendary</option>
                <option value="mythical">Mythical</option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="pokemon-sort"><InterfaceIcon name="sort" />Sort By</label>
              <select
                id="pokemon-sort"
                value={sortBy}
                onChange={(event) => onSortChange(event.target.value as SortOrder)}
              >
                <option value="id-asc">Number: Low–High</option>
                <option value="id-desc">Number: High–Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>
        <div className="catalog-reset-area">
          <span className="catalog-reset-label" aria-hidden="true">Restore defaults</span>
          <button className="device-control catalog-reset" type="button" onClick={onReset} disabled={!hasFilters}>
            <InterfaceIcon name="reset" />Reset Filters
          </button>
        </div>
      </div>
    </section>
  )
}
