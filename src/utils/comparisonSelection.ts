import type { Pokemon } from '../types/pokemon.ts'

export type ComparisonSide = 'left' | 'right'

export interface ComparisonSelection {
  pokemon: Pokemon | null
  pendingId: number | null
  error: string | null
}

export type ComparisonState = Record<ComparisonSide, ComparisonSelection>

export type ComparisonAction =
  | { type: 'select'; side: ComparisonSide; id: number; pokemon?: Pokemon }
  | { type: 'loaded'; side: ComparisonSide; id: number; pokemon: Pokemon }
  | { type: 'failed'; side: ComparisonSide; id: number; error: string }

export const initialComparisonState: ComparisonState = {
  left: { pokemon: null, pendingId: null, error: null },
  right: { pokemon: null, pendingId: null, error: null },
}

export default function comparisonSelection(state: ComparisonState, action: ComparisonAction): ComparisonState {
  const current = state[action.side]
  if (action.type === 'select') {
    const other = state[action.side === 'left' ? 'right' : 'left']
    if (other.pokemon?.id === action.id || other.pendingId === action.id) {
      return {
        ...state,
        [action.side]: { ...current, pendingId: null, error: 'Choose a different Pokémon. This Pokémon is already selected or loading on the other side.' },
      }
    }
    return {
      ...state,
      [action.side]: { ...current, pokemon: action.pokemon ?? current.pokemon, pendingId: action.pokemon || current.pokemon?.id === action.id ? null : action.id, error: null },
    }
  }

  // Ignore responses for an earlier selection that has since been replaced.
  if (current.pendingId !== action.id) return state
  return {
    ...state,
    [action.side]: action.type === 'loaded'
      ? { pokemon: action.pokemon, pendingId: null, error: null }
      : { ...current, pendingId: null, error: action.error },
  }
}
