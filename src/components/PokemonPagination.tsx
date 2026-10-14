
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
        type="button"
        disabled={page === 1}
        onClick={onPrevious}
      >
        Previous
      </button>

      <span>
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={onNext}
      >
        Next
      </button>
    </nav>
  )
}
