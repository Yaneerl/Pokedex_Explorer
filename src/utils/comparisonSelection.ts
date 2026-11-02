import type { PokemonMegaFormsData, PokemonWithStats } from '../types/pokemon.ts'

export type ComparisonSide = 'left' | 'right'

export interface ComparisonSelection {
  pokemon: PokemonWithStats | null
  pendingId: number | null
  error: string | null
  baseId?: number
  forms?: PokemonMegaFormsData
  formsError?: string
}
export type ComparisonState = Record<ComparisonSide, ComparisonSelection>

export type ComparisonAction =
  | { type: 'swap' }
  | { type: 'select'; side: ComparisonSide; id: number; pokemon?: PokemonWithStats }
  | { type: 'preview-loaded'; side: ComparisonSide; id: number; pokemon: PokemonWithStats }
  | { type: 'loaded'; side: ComparisonSide; id: number; pokemon: PokemonWithStats; forms?: PokemonMegaFormsData; formsError?: string }
  | { type: 'form'; side: ComparisonSide; id: number }
  | { type: 'failed'; side: ComparisonSide; id: number; error: string }

export const initialComparisonState: ComparisonState = {
  left: { pokemon: null, pendingId: null, error: null },
  right: { pokemon: null, pendingId: null, error: null },
}

function availableForms(forms: PokemonMegaFormsData): PokemonWithStats[] {
  return [forms.regular, ...forms.megaForms.map((option) => ({ ...option.pokemon, name: option.label }))]
}
function occupied(other: ComparisonSelection, id: number): boolean {
  return other.pokemon?.id === id || other.pendingId === id
}
function duplicate(current: ComparisonSelection): ComparisonSelection {
  return { ...current, pendingId: null, error: 'Choose a different form. This exact Pokémon form is already selected or loading on the other side.' }
}

export default function comparisonSelection(state: ComparisonState, action: ComparisonAction): ComparisonState {
  if (action.type === 'swap') {
    if (!state.left.pokemon || !state.right.pokemon || state.left.pendingId !== null || state.right.pendingId !== null) return state
    return { left: { ...state.right, error: null }, right: { ...state.left, error: null } }
  }
  const current = state[action.side]
  const other = state[action.side === 'left' ? 'right' : 'left']
  if (action.type === 'form') {
    if (!current.forms || current.pendingId !== null) return state
    const pokemon = availableForms(current.forms).find((form) => form.id === action.id)
    if (!pokemon) return state
    return {
      ...state,
      [action.side]: occupied(other, pokemon.id) ? duplicate(current) : { ...current, pokemon, error: null },
    }
  }
  if (action.type === 'select') {
    const forms = current.baseId === action.id ? current.forms : other.baseId === action.id ? other.forms : undefined
    if (forms) {
      // The regular form may be occupied; offer another verified form of this same species.
      const pokemon = availableForms(forms).find((form) => !occupied(other, form.id))
      return {
        ...state,
        [action.side]: pokemon
          ? { pokemon, baseId: action.id, forms, pendingId: null, error: null }
          : duplicate(current),
      }
    }
    return {
      ...state,
      [action.side]: {
        ...current,
        pokemon: current.pokemon ?? (action.pokemon && !occupied(other, action.pokemon.id) ? action.pokemon : null),
        pendingId: action.id, error: null,
      },
    }
  }
  // Late responses must never overwrite a newer selection or the opposite slot.
  if (current.pendingId !== action.id) return state
  if (action.type === 'failed') return { ...state, [action.side]: { ...current, pendingId: null, error: action.error } }
  if (action.type === 'preview-loaded') {
    if (occupied(other, action.pokemon.id)) return state
    return { ...state, [action.side]: { ...current, pokemon: action.pokemon, baseId: action.id, forms: undefined, formsError: undefined } }
  }
  const options = action.forms ? availableForms(action.forms) : [action.pokemon]
  const pokemon = options.find((form) => !occupied(other, form.id))
  return {
    ...state,
    [action.side]: pokemon
      ? { pokemon, baseId: action.id, forms: action.forms, formsError: action.formsError, pendingId: null, error: null }
      : { ...duplicate(current), formsError: action.formsError },
  }
}
