import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { PokemonAbility } from '../types/pokemon.ts'
import PokemonAbilities from './PokemonAbilities.tsx'

test('shows every ability with a readable name and the correct regular or hidden label', () => {
  const abilities: PokemonAbility[] = [
    { name: 'cute-charm', isHidden: false, slot: 1 },
    { name: 'magic-guard', isHidden: false, slot: 2 },
    { name: 'friend-guard', isHidden: true, slot: 3 },
  ]

  render(<PokemonAbilities abilities={abilities} />)

  const section = screen.getByRole('region', { name: 'Abilities' })
  const rows = within(section).getAllByRole('listitem')
  expect(rows).toHaveLength(3)

  const [firstRegular, secondRegular, hidden] = rows
  if (!firstRegular || !secondRegular || !hidden) {
    throw new Error('Expected all three ability rows')
  }

  expect(within(firstRegular).getByText('Cute Charm')).toBeTruthy()
  expect(within(firstRegular).getByText('Regular Ability')).toBeTruthy()
  expect(within(firstRegular).queryByText('Hidden Ability')).toBeNull()

  expect(within(secondRegular).getByText('Magic Guard')).toBeTruthy()
  expect(within(secondRegular).getByText('Regular Ability')).toBeTruthy()
  expect(within(secondRegular).queryByText('Hidden Ability')).toBeNull()

  expect(within(hidden).getByText('Friend Guard')).toBeTruthy()
  expect(within(hidden).getByText('Hidden Ability')).toBeTruthy()
  expect(within(hidden).queryByText('Regular Ability')).toBeNull()
})
