import type { EvolutionChainLink, EvolutionNode } from '../types/pokemon.ts'

export default function buildEvolutionTree(link: EvolutionChainLink): EvolutionNode {
  const id = Number(link.species.url.split('/').filter(Boolean).at(-1))
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error('Invalid evolution species ID')
  }

  return {
    id,
    name: link.species.name,
    children: link.evolves_to.map(buildEvolutionTree),
  }
}
