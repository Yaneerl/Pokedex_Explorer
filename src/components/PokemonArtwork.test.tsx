import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import PokemonArtwork from './PokemonArtwork.tsx'

test('defaults to Normal and switches the displayed image and selection to Shiny and back', () => {
  render(<PokemonArtwork name="bulbasaur" image="/normal.png" shinyImage="/shiny.png" />)

  const normal = screen.getByRole('button', { name: 'Normal' })
  const shiny = screen.getByRole('button', { name: 'Shiny' })
  expect(normal.getAttribute('aria-pressed')).toBe('true')
  expect(shiny.getAttribute('aria-pressed')).toBe('false')
  expect(screen.getByRole('img', { name: 'bulbasaur Normal artwork' }).getAttribute('src')).toBe('/normal.png')

  fireEvent.click(shiny)
  expect(screen.getByRole('img', { name: 'bulbasaur Shiny artwork' }).getAttribute('src')).toBe('/shiny.png')
  expect(shiny.getAttribute('aria-pressed')).toBe('true')
  expect(normal.getAttribute('aria-pressed')).toBe('false')

  fireEvent.click(normal)
  expect(screen.getByRole('img', { name: 'bulbasaur Normal artwork' }).getAttribute('src')).toBe('/normal.png')
  expect(normal.getAttribute('aria-pressed')).toBe('true')
})

test('explains a missing Shiny image without rendering a broken image and allows returning to Normal', () => {
  render(<PokemonArtwork name="bulbasaur" image="/normal.png" shinyImage={null} />)

  fireEvent.click(screen.getByRole('button', { name: 'Shiny' }))
  expect(screen.getByRole('status').textContent).toBe('Shiny image is not available for this Pokémon.')
  expect(screen.queryByRole('img')).toBeNull()

  fireEvent.click(screen.getByRole('button', { name: 'Normal' }))
  expect(screen.getByRole('img').getAttribute('src')).toBe('/normal.png')
  expect(screen.queryByRole('status')).toBeNull()
})

test('replaces a failed Shiny image with a clear message while keeping Normal usable', () => {
  render(<PokemonArtwork name="bulbasaur" image="/normal.png" shinyImage="/unavailable.png" />)

  fireEvent.click(screen.getByRole('button', { name: 'Shiny' }))
  fireEvent.error(screen.getByRole('img'))
  expect(screen.queryByRole('img')).toBeNull()
  expect(screen.getByRole('status').textContent).toBe('Shiny image is not available for this Pokémon.')

  fireEvent.click(screen.getByRole('button', { name: 'Normal' }))
  expect(screen.getByRole('img').getAttribute('src')).toBe('/normal.png')
})
