import { useId } from 'react'
import type { Dispatch } from 'react'
import type { ComparisonAction, ComparisonSelection, ComparisonSide } from '../utils/comparisonSelection.ts'

interface PokemonComparisonFormsProps {
  selection: ComparisonSelection
  other: ComparisonSelection
  side: ComparisonSide
  dispatch: Dispatch<ComparisonAction>
}
export default function PokemonComparisonForms({ selection, other, side, dispatch }: PokemonComparisonFormsProps) {
  const id = useId()
  const number = side === 'left' ? 1 : 2
  const forms = selection.forms
  if (!forms || forms.megaForms.length === 0) return null
  const options = [{ label: 'Regular', pokemon: forms.regular }, ...forms.megaForms]
  return (
    <div className="comparison-form-control">
      <label htmlFor={id}>Pokémon form</label>
      <select id={id} aria-label={'Form for Pokémon ' + number} value={selection.pokemon?.id}
        disabled={selection.pendingId !== null}
        onChange={(event) => dispatch({ type: 'form', side, id: Number(event.target.value) })}>
        {options.map((option) => {
          const unavailable = other.pokemon?.id === option.pokemon.id || other.pendingId === option.pokemon.id
          return <option key={option.pokemon.id} value={option.pokemon.id} disabled={unavailable}>
            {option.label}{unavailable ? ' — selected on other side' : ''}
          </option>
        })}
      </select>
    </div>
  )
}
