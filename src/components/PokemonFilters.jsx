const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass',
  'ice', 'fighting', 'poison', 'ground', 'flying',
  'psychic', 'bug', 'rock', 'ghost', 'dragon',
  'dark', 'steel', 'fairy',
]

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

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
}) {
  const hasFilters =
    search.trim() !== '' ||
    selectedType !== 'all' ||
    selectedGeneration !== 'all' ||
    selectedClassification !== 'all' ||
    sortBy !== 'id-asc'

  return (
    <section className="search-section" aria-label="Pokémon filters">
      <div className="filter-field">
        <label htmlFor="pokemon-search">Search Pokémon</label>
        <input
          id="pokemon-search"
          type="search"
          placeholder="Search by name or number..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="pokemon-type">Pokémon Type</label>
        <select
          id="pokemon-type"
          value={selectedType}
          onChange={(event) => onTypeChange(event.target.value)}
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
        <label htmlFor="pokemon-generation">Generation</label>
        <select
          id="pokemon-generation"
          value={selectedGeneration}
          onChange={(event) => onGenerationChange(event.target.value)}
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
        <label htmlFor="pokemon-classification">Classification</label>
        <select
          id="pokemon-classification"
          value={selectedClassification}
          onChange={(event) => onClassificationChange(event.target.value)}
        >
          <option value="all">All Pokémon</option>
          <option value="regular">Regular (not Legendary/Mythical)</option>
          <option value="legendary">Legendary</option>
          <option value="mythical">Mythical</option>
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="pokemon-sort">Sort By</label>
        <select
          id="pokemon-sort"
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value)}
        >
          <option value="id-asc">Pokédex Number: Low to High</option>
          <option value="id-desc">Pokédex Number: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </select>
      </div>

      <button type="button" onClick={onReset} disabled={!hasFilters}>
        Reset Filters
      </button>
    </section>
  )
}
