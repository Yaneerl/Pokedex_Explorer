
import { useEffect, useState } from 'react'
import PokemonList from './components/PokemonList.jsx'
import PokemonDetails from './components/PokemonDetails.jsx'

const PAGE_SIZE = 20
const API_URL = 'https://pokeapi.co/api/v2'

export default function App() {
  const [pokemonList, setPokemonList] = useState([])
  const [selectedPokemon, setSelectedPokemon] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  useEffect(() => {
    const controller = new AbortController()

    async function loadPokemon() {
      setLoading(true)
      setError(null)

      try {
        const offset = (page - 1) * PAGE_SIZE

        const response = await fetch(
          `${API_URL}/pokemon-species?limit=${PAGE_SIZE}&offset=${offset}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('Failed to load Pokémon list')
        }

        const listData = await response.json()

        const results = await Promise.all(
          listData.results.map(async (item) => {
            const id = Number(
              item.url.split('/').filter(Boolean).pop()
            )

            const detailsResponse = await fetch(
              `${API_URL}/pokemon/${id}`,
              { signal: controller.signal }
            )

            if (!detailsResponse.ok) {
              throw new Error('Failed to load Pokémon details')
            }

            const data = await detailsResponse.json()

            return {
              id: data.id,
              name: data.name,
              types: data.types.map(
                (entry) => entry.type.name
              ),
              image:
                data.sprites.other['official-artwork']
                  .front_default,
            }
          })
        )

        if (!controller.signal.aborted) {
          setPokemonList(results)
          setTotal(listData.count)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadPokemon()

    return () => controller.abort()
  }, [page])

  return (
    <main className="app">
      {selectedPokemon ? (
        <PokemonDetails
          pokemon={selectedPokemon}
          onBack={() => setSelectedPokemon(null)}
        />
      ) : (
        <>
          <header className="app-header">
            <p className="eyebrow">YOUR DIGITAL POKÉDEX</p>
            <h1>PokéDex Explorer</h1>
            <p className="intro">
              Discover Pokémon from every generation.
              Powered by PokéAPI.
            </p>
          </header>

          {loading && <p>Loading Pokémon...</p>}

          {error && <p role="alert">Error: {error}</p>}

          {!loading && !error && (
            <>
              <PokemonList
                pokemon={pokemonList}
                onSelect={setSelectedPokemon}
              />

              <nav
                className="pagination"
                aria-label="Pokémon pages"
              >
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>

                <span>
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </nav>
            </>
          )}
        </>
      )}
    </main>
  )
}
