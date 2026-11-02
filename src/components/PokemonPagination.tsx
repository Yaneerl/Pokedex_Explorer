import InterfaceIcon from './InterfaceIcon.tsx'

interface PokemonPaginationProps {
  page: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}

export default function PokemonPagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: PokemonPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav className="pagination" aria-label="Pokémon pages">
      <button
        className="device-control"
        type="button"
        disabled={page === 1}
        onClick={onPrevious}
      >
        <InterfaceIcon name="previous" />Previous
      </button>

      <span>
        Page {page} of {totalPages}
      </span>

      <button
        className="device-control device-control--primary"
        type="button"
        disabled={page >= totalPages}
        onClick={onNext}
      >
        Next<InterfaceIcon name="next" />
      </button>
    </nav>
  )
}
