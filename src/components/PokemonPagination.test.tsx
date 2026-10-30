import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import PokemonPagination from './PokemonPagination.tsx'

test('only allows available pagination actions at the first and last page', () => {
  const onPrevious = vi.fn<() => void>()
  const onNext = vi.fn<() => void>()
  const { rerender } = render(
    <PokemonPagination
      page={1}
      totalPages={3}
      onPrevious={onPrevious}
      onNext={onNext}
    />
  )

  const previousButton = screen.getByRole('button', { name: 'Previous' })
  const nextButton = screen.getByRole('button', { name: 'Next' })

  expect(screen.getByText('Page 1 of 3')).toBeTruthy()
  expect(previousButton.hasAttribute('disabled')).toBe(true)
  expect(nextButton.hasAttribute('disabled')).toBe(false)

  fireEvent.click(previousButton)
  expect(onPrevious).not.toHaveBeenCalled()

  fireEvent.click(nextButton)
  expect(onNext).toHaveBeenCalledTimes(1)
  expect(onPrevious).not.toHaveBeenCalled()

  rerender(
    <PokemonPagination
      page={3}
      totalPages={3}
      onPrevious={onPrevious}
      onNext={onNext}
    />
  )

  expect(screen.getByText('Page 3 of 3')).toBeTruthy()
  expect(previousButton.hasAttribute('disabled')).toBe(false)
  expect(nextButton.hasAttribute('disabled')).toBe(true)

  fireEvent.click(nextButton)
  expect(onNext).toHaveBeenCalledTimes(1)

  fireEvent.click(previousButton)
  expect(onPrevious).toHaveBeenCalledTimes(1)
  expect(onNext).toHaveBeenCalledTimes(1)
})
