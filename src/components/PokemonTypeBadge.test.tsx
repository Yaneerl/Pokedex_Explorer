import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { POKEMON_TYPES } from '../types/pokemon.ts'
import PokemonTypeBadge from './PokemonTypeBadge.tsx'

function contrast(a: string, b: string): number {
  const luminance = (hex: string): number => {
    const channel = (offset: number): number => {
      const value = parseInt(hex.slice(offset, offset + 2), 16) / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    }
    return channel(1) * 0.2126 + channel(3) * 0.7152 + channel(5) * 0.0722
  }
  const first = luminance(a)
  const second = luminance(b)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

test('all eighteen type badges have visible names, distinct decorative SVGs and readable type colors', () => {
  const { container } = render(<div>{POKEMON_TYPES.map((type) => <PokemonTypeBadge key={type} type={type} />)}</div>)
  const paths = new Set<string>()
  const colors = new Set<string>()
  for (const type of POKEMON_TYPES) {
    const badge = screen.getByText(type).closest<HTMLElement>('.pokemon-type-badge')
    if (!badge) throw new Error('Missing type badge: ' + type)
    const icon = badge.querySelector('svg')
    expect(icon?.getAttribute('aria-hidden')).toBe('true')
    expect(icon?.getAttribute('focusable')).toBe('false')
    const path = icon?.querySelector('path')?.getAttribute('d')
    expect(path).toBeTruthy()
    paths.add(path ?? '')
    colors.add(badge.style.getPropertyValue('--type-accent'))
    expect(contrast(badge.style.getPropertyValue('--type-ink'), badge.style.getPropertyValue('--type-surface'))).toBeGreaterThanOrEqual(4.5)
  }
  expect(paths.size).toBe(18)
  expect(colors.size).toBe(18)
  expect(container.querySelectorAll('button, a, [tabindex]')).toHaveLength(0)
})

test('unknown API types retain their readable names and a safe neutral icon, including object-property names', () => {
  const { container } = render(<><PokemonTypeBadge type="stellar" /><PokemonTypeBadge type="constructor" /></>)
  expect(screen.getByText('stellar')).toBeTruthy()
  expect(screen.getByText('constructor')).toBeTruthy()
  for (const path of container.querySelectorAll('svg path')) expect(path.getAttribute('d')).toBeTruthy()
  expect(container.querySelectorAll('.pokemon-type-badge')).toHaveLength(2)
})
