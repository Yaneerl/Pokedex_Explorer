import { useState } from 'react'

interface PokemonArtworkProps {
  name: string
  image: string | null
  shinyImage: string | null
}

type ArtworkVariant = 'normal' | 'shiny'

export default function PokemonArtwork({ name, image, shinyImage }: PokemonArtworkProps) {
  const [variant, setVariant] = useState<ArtworkVariant>('normal')
  const [failedImage, setFailedImage] = useState<string | null>(null)
  const source = variant === 'shiny' ? shinyImage : image
  const label = variant === 'shiny' ? 'Shiny' : 'Normal'

  return (
    <div className="pokemon-artwork">
      <div className="pokemon-artwork-preview">
        {source && source !== failedImage ? (
          <img
            key={source}
            src={source}
            alt={name + ' ' + label + ' artwork'}
            width="220"
            height="220"
            onError={() => setFailedImage(source)}
          />
        ) : (
          <p role="status">{label} image is not available for this Pokémon.</p>
        )}
      </div>
      <div className="pokemon-artwork-toggle" role="group" aria-label="Pokémon appearance">
        <button type="button" aria-pressed={variant === 'normal'} onClick={() => setVariant('normal')}>
          Normal
        </button>
        <button type="button" aria-pressed={variant === 'shiny'} onClick={() => setVariant('shiny')}>
          Shiny
        </button>
      </div>
    </div>
  )
}
