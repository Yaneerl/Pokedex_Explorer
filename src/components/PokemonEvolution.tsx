import { useEffect, useState } from 'react'
import type {
  EvolutionChainResponse, EvolutionNode, EvolutionStage,
  PokemonResponse, PokemonSpeciesResponse,
} from '../types/pokemon.ts'
import buildEvolutionTree from '../utils/buildEvolutionTree.ts'
import PokemonEvolutionStage from './PokemonEvolutionStage.tsx'

interface PokemonEvolutionProps {
  speciesUrl: string
}

interface EvolutionState {
  speciesUrl: string
  tree: EvolutionStage | null
  error: string | null
}

async function loadStage(node: EvolutionNode, signal: AbortSignal): Promise<EvolutionStage> {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon/' + node.id, { signal })
  if (!response.ok) throw new Error('Failed to load evolution Pokémon images')
  const data: PokemonResponse = await response.json()
  const children = await Promise.all(node.children.map((child) => loadStage(child, signal)))

  return {
    id: node.id,
    name: node.name,
    image: data.sprites.other?.['official-artwork']?.front_default ?? data.sprites.front_default,
    children,
  }
}

export default function PokemonEvolution({ speciesUrl }: PokemonEvolutionProps) {
  const [result, setResult] = useState<EvolutionState | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadEvolution(): Promise<void> {
      try {
        const speciesResponse = await fetch(speciesUrl, { signal: controller.signal })
        if (!speciesResponse.ok) throw new Error('Failed to load Pokémon species')
        const species: PokemonSpeciesResponse = await speciesResponse.json()
        if (!species.evolution_chain) throw new Error('Evolution data is unavailable')

        const chainResponse = await fetch(species.evolution_chain.url, { signal: controller.signal })
        if (!chainResponse.ok) throw new Error('Failed to load evolution chain')
        const chain: EvolutionChainResponse = await chainResponse.json()
        const root = buildEvolutionTree(chain.chain)
        const tree: EvolutionStage = root.children.length === 0
          ? { ...root, image: null, children: [] }
          : await loadStage(root, controller.signal)

        if (!controller.signal.aborted) setResult({ speciesUrl, tree, error: null })
      } catch (err) {
        if (!controller.signal.aborted) {
          setResult({
            speciesUrl,
            tree: null,
            error: err instanceof Error ? err.message : 'Failed to load evolution chain',
          })
          // Cancel any sibling image requests when one request fails.
          controller.abort()
        }
      }
    }

    loadEvolution()
    return () => controller.abort()
  }, [speciesUrl])

  const currentResult = result?.speciesUrl === speciesUrl ? result : null
  const tree = currentResult?.tree

  // Check the full chain's root, not whether the current Pokémon is its final stage.
  if (tree && tree.children.length === 0) return null

  return (
    <section className="pokemon-evolution" aria-labelledby="pokemon-evolution-heading">
      <h3 id="pokemon-evolution-heading">Evolution Chain</h3>
      {!currentResult && <p role="status">Loading evolution chain...</p>}
      {currentResult?.error && <p role="alert">Error: {currentResult.error}</p>}
      {tree && (
        <ul className="pokemon-evolution-tree">
          <PokemonEvolutionStage stage={tree} />
        </ul>
      )}
    </section>
  )
}
