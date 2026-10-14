
import { useEffect, useState } from 'react'

const GRAPHQL_URL = 'https://beta.pokeapi.co/graphql/v1beta'

// Get Legendary and Mythical Pokémon from PokéAPI
const CLASSIFICATION_QUERY = `
  query GetSpecialPokemon {
    pokemon_v2_pokemonspecies(
      limit: 2000
      where: {
        _or: [
          { is_legendary: { _eq: true } }
          { is_mythical: { _eq: true } }
        ]
      }
    ) {
      id
      is_legendary
      is_mythical
    }
  }
`

export default function usePokemonClassification(enabled) {
  const [classificationData, setClassificationData] = useState({
    loaded: false,
    legendaryIds: new Set(),
    mythicalIds: new Set(),
  })

  const [classificationLoading, setClassificationLoading] =
    useState(false)

  const [classificationError, setClassificationError] =
    useState(null)

  useEffect(() => {
    if (!enabled || classificationData.loaded) return

    const controller = new AbortController()

    async function loadClassifications() {
      setClassificationLoading(true)
      setClassificationError(null)

      try {
        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: CLASSIFICATION_QUERY,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(
            'Failed to load Pokémon classifications'
          )
        }

        const payload = await response.json()

        const species =
          payload.data?.pokemon_v2_pokemonspecies

        if (
          payload.errors?.length ||
          !Array.isArray(species) ||
          species.length === 0
        ) {
          throw new Error(
            'PokéAPI classification data is unavailable'
          )
        }

        const legendaryIds = new Set(
          species
            .filter((item) => item.is_legendary)
            .map((item) => item.id)
        )

        const mythicalIds = new Set(
          species
            .filter((item) => item.is_mythical)
            .map((item) => item.id)
        )

        if (!controller.signal.aborted) {
          setClassificationData({
            loaded: true,
            legendaryIds,
            mythicalIds,
          })
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setClassificationError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setClassificationLoading(false)
        }
      }
    }

    loadClassifications()

    return () => controller.abort()
  }, [enabled, classificationData.loaded])

  return {
    classificationData,
    classificationLoading,
    classificationError,
    clearClassificationError: () =>
      setClassificationError(null),
  }
}
