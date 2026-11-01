import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router'
import PokemonList from './components/PokemonList.tsx'
import PokemonDetails from './components/PokemonDetails.tsx'
import PokemonFavorites from './components/PokemonFavorites.tsx'
import toPokemonCard from './utils/toPokemonCard.ts'
import PokemonFilters from './components/PokemonFilters.tsx'
import PokemonPagination from './components/PokemonPagination.tsx'
import usePokemonClassification from './hooks/usePokemonClassification.ts'
import searchPokemon from './utils/searchPokemon.ts'
import { filterPokemonByGeneration, filterPokemonByType } from './utils/filterPokemon.ts'
import type {
  ClassificationFilter, GenerationFilter, GenerationResults, Pokemon,
  PokemonGenerationResponse, PokemonResponse, PokemonSummary, PokemonTypeResponse,
  SortOrder, SpeciesIndexResponse, TypeFilter, TypeResults,
} from './types/pokemon.ts'

const PAGE_SIZE = 20
const API_URL = 'https://pokeapi.co/api/v2'
function getPokemonId(url: string): number {
  const parts = url.split('/').filter(Boolean)
  return Number(parts[parts.length - 1])
}

export default function App() {
  const navigate = useNavigate()
  const [speciesIndex, setSpeciesIndex] = useState<PokemonSummary[]>([])
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedType, setSelectedType] = useState<TypeFilter>('all')
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationFilter>('all')
  const [selectedClassification, setSelectedClassification] = useState<ClassificationFilter>('all')
  const [sortBy, setSortBy] = useState<SortOrder>('id-asc')
  const [page, setPage] = useState(1)

  const [typeResults, setTypeResults] = useState<TypeResults>({
    type: 'all',
    ids: new Set(),
  })

  const [generationResults, setGenerationResults] = useState<GenerationResults>({
    generation: 'all',
    ids: new Set(),
  })

  const {
    classificationData,
    classificationLoading,
    classificationError,
    clearClassificationError,
  } = usePokemonClassification(selectedClassification !== 'all')

  const [indexLoading, setIndexLoading] = useState(true)
  const [loading, setLoading] = useState(false)

  const [indexError, setIndexError] = useState<string | null>(null)
  const [typeError, setTypeError] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Wait 300ms after the last keystroke before filtering.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase())
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Load names and IDs once, rather than 1025 full Pokémon records.
  useEffect(() => {
    const controller = new AbortController()

    async function loadSpeciesIndex(): Promise<void> {
      try {
        const response = await fetch(
          `${API_URL}/pokemon-species?limit=2000&offset=0`,
          { signal: controller.signal }
        )
        if (!response.ok) throw new Error('Failed to load Pokémon index')

        const data: SpeciesIndexResponse = await response.json()
        const species = data.results
          .map((item) => ({ id: getPokemonId(item.url), name: item.name }))
          .sort((a, b) => a.id - b.id)

        if (!controller.signal.aborted) setSpeciesIndex(species)
      } catch (err) {
        if (!controller.signal.aborted) {
          setIndexError(err instanceof Error ? err.message : 'Failed to load Pokémon index')
        }
      } finally {
        if (!controller.signal.aborted) setIndexLoading(false)
      }
    }

    loadSpeciesIndex()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (selectedType === 'all') return
    const controller = new AbortController()

    async function loadType(): Promise<void> {
      try {
        const response = await fetch(`${API_URL}/type/${selectedType}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Failed to load Pokémon type')

        const data: PokemonTypeResponse = await response.json()
        const ids = new Set(
          data.pokemon.map((entry) => getPokemonId(entry.pokemon.url))
        )

        if (!controller.signal.aborted) {
          setTypeResults({ type: selectedType, ids })
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setTypeError(err instanceof Error ? err.message : 'Failed to load Pokémon type')
        }
      }
    }

    loadType()
    return () => controller.abort()
  }, [selectedType])

  useEffect(() => {
    if (selectedGeneration === 'all') return
    const controller = new AbortController()

    async function loadGeneration(): Promise<void> {
      try {
        const response = await fetch(
          `${API_URL}/generation/${selectedGeneration}`,
          { signal: controller.signal }
        )
        if (!response.ok) {
          throw new Error('Failed to load Pokémon generation')
        }

        const data: PokemonGenerationResponse = await response.json()
        const ids = new Set(
          data.pokemon_species.map((item) => getPokemonId(item.url))
        )

        if (!controller.signal.aborted) {
          setGenerationResults({ generation: selectedGeneration, ids })
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setGenerationError(err instanceof Error ? err.message : 'Failed to load Pokémon generation')
        }
      }
    }

    loadGeneration()
    return () => controller.abort()
  }, [selectedGeneration])

  const typeReady =
    selectedType === 'all' || typeResults.type === selectedType

  const generationReady =
    selectedGeneration === 'all' ||
    generationResults.generation === selectedGeneration

  const classificationReady =
    selectedClassification === 'all' || classificationData.loaded

  const filteredSpecies = useMemo<PokemonSummary[]>(() => {
    let results = filterPokemonByType(speciesIndex, selectedType, typeResults)
    results = filterPokemonByGeneration(results, selectedGeneration, generationResults)

    if (selectedClassification !== 'all') {
      if (!classificationReady) return []
      results = results.filter((pokemon) => {
        const legendary = classificationData.legendaryIds.has(pokemon.id)
        const mythical = classificationData.mythicalIds.has(pokemon.id)

        if (selectedClassification === 'legendary') return legendary
        if (selectedClassification === 'mythical') return mythical
        return !legendary && !mythical
      })
    }

    results = searchPokemon(results, debouncedSearch)

    const sorted = [...results]
    switch (sortBy) {
      case 'id-desc':
        sorted.sort((a, b) => b.id - a.id)
        break
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name))
        break
      default:
        sorted.sort((a, b) => a.id - b.id)
    }
    return sorted
  }, [
    speciesIndex,
    debouncedSearch,
    selectedType,
    selectedGeneration,
    selectedClassification,
    sortBy,
    typeResults,
    generationResults,
    classificationData,
    classificationReady,
  ])

  const totalPages = Math.ceil(filteredSpecies.length / PAGE_SIZE)

  useEffect(() => {
    if (
      indexLoading || indexError || !typeReady || !generationReady ||
      !classificationReady || typeError || generationError || classificationError
    ) return

    const controller = new AbortController()

    async function loadPokemon(): Promise<void> {
      setLoading(true)
      setError(null)

      try {
        const offset = (page - 1) * PAGE_SIZE
        const pageSpecies = filteredSpecies.slice(offset, offset + PAGE_SIZE)
        const results = await Promise.all(
          pageSpecies.map(async (item): Promise<Pokemon> => {
            const response = await fetch(`${API_URL}/pokemon/${item.id}`, {
              signal: controller.signal,
            })
            if (!response.ok) {
              throw new Error('Failed to load Pokémon details')
            }

            const data: PokemonResponse = await response.json()
            return toPokemonCard(data)
          })
        )

        if (!controller.signal.aborted) setPokemonList(results)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load Pokémon details')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadPokemon()
    return () => controller.abort()
  }, [
    filteredSpecies, page, indexLoading, indexError, typeReady,
    generationReady, classificationReady, typeError,
    generationError, classificationError,
  ])

  function handleSearchChange(value: string): void {
    setSearch(value)
    setPage(1)
  }

  function handleTypeChange(value: TypeFilter): void {
    setSelectedType(value)
    setTypeError(null)
    setError(null)
    setPage(1)
  }

  function handleGenerationChange(value: GenerationFilter): void {
    setSelectedGeneration(value)
    setGenerationError(null)
    setError(null)
    setPage(1)
  }

  function handleClassificationChange(value: ClassificationFilter): void {
    setSelectedClassification(value)
    clearClassificationError()
    setError(null)
    setPage(1)
  }

  function handleSortChange(value: SortOrder): void {
    setSortBy(value)
    setPage(1)
  }

  function resetFilters(): void {
    setSearch('')
    setDebouncedSearch('')
    setSelectedType('all')
    setSelectedGeneration('all')
    setSelectedClassification('all')
    setSortBy('id-asc')
    setTypeError(null)
    setGenerationError(null)
    clearClassificationError()
    setError(null)
    setPage(1)
  }

  const currentError =
    indexError || typeError || generationError || classificationError || error

  const searchPending = search.trim().toLowerCase() !== debouncedSearch
  const currentPageSpecies = filteredSpecies.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )
  const pageDataReady =
    pokemonList.length === currentPageSpecies.length &&
    pokemonList.every(
      (pokemon, index) => pokemon.id === currentPageSpecies[index]?.id
    )

  const isLoading =
    indexLoading || !typeReady || !generationReady ||
    !classificationReady ||
    (selectedClassification !== 'all' && classificationLoading) ||
    searchPending || loading || (!currentError && !pageDataReady)

  const firstResult = (page - 1) * PAGE_SIZE + 1
  const lastResult = Math.min(page * PAGE_SIZE, filteredSpecies.length)

  return (
    <main className="app">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <header className="app-header">
                <p className="eyebrow">YOUR DIGITAL POKÉDEX</p>
                <h1>PokéDex Explorer</h1>
                <p className="intro">
                  Discover Pokémon from every generation.
                  Powered by PokéAPI.
                </p>
                <nav className="app-navigation" aria-label="Main navigation">
                  <Link to="/favorites">Favorites</Link>
                </nav>
              </header>

              <PokemonFilters
                search={search}
                selectedType={selectedType}
                selectedGeneration={selectedGeneration}
                selectedClassification={selectedClassification}
                sortBy={sortBy}
                onSearchChange={handleSearchChange}
                onTypeChange={handleTypeChange}
                onGenerationChange={handleGenerationChange}
                onClassificationChange={handleClassificationChange}
                onSortChange={handleSortChange}
                onReset={resetFilters}
              />

              {!currentError && isLoading && (
                <p role="status">Loading Pokémon...</p>
              )}

              {currentError && <p role="alert">Error: {currentError}</p>}

              {!isLoading && !currentError && (
                <>
                  {filteredSpecies.length === 0 ? (
                    <p>No Pokémon found.</p>
                  ) : (
                    <>
                      <p className="results-count">
                        Showing {firstResult}–{lastResult} of{' '}
                        {filteredSpecies.length} Pokémon
                      </p>

                      <PokemonList
                        pokemon={pokemonList}
                        onSelect={(pokemon) => navigate(`/pokemon/${pokemon.id}`)}
                      />

                      <PokemonPagination
                        page={page}
                        totalPages={totalPages}
                        onPrevious={() =>
                          setPage((current) => Math.max(1, current - 1))
                        }
                        onNext={() =>
                          setPage((current) => Math.min(totalPages, current + 1))
                        }
                      />
                    </>
                  )}
                </>
              )}
            </>
          }
        />
        <Route path="/favorites" element={<PokemonFavorites />} />
        <Route path="/pokemon/:id" element={<PokemonDetails />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}
