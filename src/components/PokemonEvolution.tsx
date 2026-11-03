import type { PokemonSpeciesResult } from '../hooks/usePokemonSpecies.ts'
import { useEffect, useState } from 'react'
import type {
  EvolutionChainResponse, EvolutionNode, EvolutionStage,
  PokemonResponse, PokemonSpeciesResponse,
} from '../types/pokemon.ts'
import buildEvolutionTree from '../utils/buildEvolutionTree.ts'
import PokemonEvolutionStage from './PokemonEvolutionStage.tsx'
import PokemonEvolutionCard from './PokemonEvolutionCard.tsx'
import PokemonDetailsSkeleton from './PokemonDetailsSkeleton.tsx'

interface PokemonEvolutionProps {
  speciesUrl: string
  speciesState?: PokemonSpeciesResult
  currentSpeciesId?: number
}

interface EvolutionState {
  speciesUrl: string
  tree: EvolutionStage | null
  error: string | null
  loading: boolean
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

function pendingStage(node: EvolutionNode): EvolutionStage {
  return { ...node, image: null, children: node.children.map(pendingStage) }
}

// Only a single uninterrupted path can use a linear visual track.
function getLinearStages(root: EvolutionStage | null | undefined): EvolutionStage[] | null {
  if (!root) return null
  const stages: EvolutionStage[] = []
  let current: EvolutionStage | undefined = root
  while (current) {
    if (current.children.length > 1) return null
    stages.push(current)
    current = current.children[0]
  }
  return stages
}

export default function PokemonEvolution({ speciesUrl, speciesState, currentSpeciesId }: PokemonEvolutionProps) {
  const [result, setResult] = useState<EvolutionState | null>(null)

  const sharedSpecies = speciesState?.data
  const hasSharedSpecies = speciesState !== undefined
  const sharedError = speciesState?.error

  useEffect(() => {
    if (hasSharedSpecies && !sharedSpecies) return
    const controller = new AbortController()

    let knownTree: EvolutionStage | null = null
    async function loadEvolution(): Promise<void> {
      try {
        let species = sharedSpecies
        if (!species) {
          const speciesResponse = await fetch(speciesUrl, { signal: controller.signal })
          if (!speciesResponse.ok) throw new Error('Failed to load Pokémon species')
          species = await speciesResponse.json() as PokemonSpeciesResponse
        }
        if (!species.evolution_chain) throw new Error('Evolution data is unavailable')

        const chainResponse = await fetch(species.evolution_chain.url, { signal: controller.signal })
        if (!chainResponse.ok) throw new Error('Failed to load evolution chain')
        const chain: EvolutionChainResponse = await chainResponse.json()
        const root = buildEvolutionTree(chain.chain)
        knownTree = pendingStage(root)
        if (!controller.signal.aborted) setResult({ speciesUrl, tree: knownTree, error: null, loading: root.children.length > 0 })
        const tree: EvolutionStage = root.children.length === 0
          ? { ...root, image: null, children: [] }
          : await loadStage(root, controller.signal)

        if (!controller.signal.aborted) setResult({ speciesUrl, tree, error: null, loading: false })
      } catch (err) {
        if (!controller.signal.aborted) {
          setResult({
            speciesUrl,
            tree: knownTree,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load evolution chain',
          })
          // Cancel any sibling image requests when one request fails.
          controller.abort()
        }
      }
    }

    loadEvolution()
    return () => controller.abort()
  }, [speciesUrl, sharedSpecies, hasSharedSpecies])

  const currentResult = result?.speciesUrl === speciesUrl ? result : null
  const tree = currentResult?.tree
  const linearStages = getLinearStages(tree)
  const loading = !sharedError && (!currentResult || currentResult.loading)

  // Check the full chain's root, not whether the current Pokémon is its final stage.
  if (tree && tree.children.length === 0) return null

  return (
    <section className={'pokemon-evolution' + (linearStages || !tree ? ' pokemon-evolution--linear' : ' pokemon-evolution--branching')}
      style={linearStages || !tree ? { maxWidth: (linearStages?.length ?? 3) * 230 + 64 } : undefined}
      aria-busy={loading}
      aria-labelledby="pokemon-evolution-heading">
      <h3 id="pokemon-evolution-heading">Evolution Chain</h3>
      {loading && <p role="status" className="details-loading-announcement">Loading evolution chain...</p>}
      {!tree && loading && <PokemonDetailsSkeleton evolutionOnly />}
      {(sharedError || currentResult?.error) && <p role="alert">Error: {sharedError ?? currentResult?.error}</p>}
      {linearStages ? (
        <ol className="pokemon-evolution-linear" aria-label="Evolution stages">
          {linearStages.map((stage, index) => (
            <li className="pokemon-evolution-step" key={stage.id}>
              {index > 0 && <span className="pokemon-evolution-arrow" aria-hidden="true">→</span>}
              <PokemonEvolutionCard stage={stage} currentSpeciesId={currentSpeciesId} loadingImages={loading} />
            </li>
          ))}
        </ol>
      ) : tree && (
        <ul className="pokemon-evolution-tree">
          <PokemonEvolutionStage stage={tree} currentSpeciesId={currentSpeciesId} loadingImages={loading} />
        </ul>
      )}
    </section>
  )
}
