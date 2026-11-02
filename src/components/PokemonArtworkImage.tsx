import { useEffect, useRef, useState } from 'react'
import type { SyntheticEvent } from 'react'
import { FULL_ARTWORK_BOUNDS, fitArtwork, getArtworkBounds } from '../utils/artworkFrame.ts'
import type { ArtworkBounds } from '../utils/artworkFrame.ts'

interface PokemonArtworkImageProps {
  source: string
  alt: string
  onError: () => void
  inset?: number
}
interface ImageMeasurement { bounds: ArtworkBounds; aspectRatio: number }

// Measure once per image, with a small bounded cache for Normal/Shiny switching.
const measurements = new Map<string, ImageMeasurement>()
function measureImage(image: HTMLImageElement): ImageMeasurement {
  const cached = measurements.get(image.src)
  if (cached) return cached
  const aspectRatio = image.naturalWidth / image.naturalHeight
  try {
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight))
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (context) {
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const bounds = getArtworkBounds(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)
      if (bounds) {
        const result = { bounds, aspectRatio }
        if (measurements.size >= 64) measurements.clear()
        measurements.set(image.src, result)
        return result
      }
    }
  } catch {
    // Keep images usable when a host denies canvas access; CSS still contains them.
  }
  return { bounds: FULL_ARTWORK_BOUNDS, aspectRatio }
}

/** Center the visible silhouette; transparent PNG padding never becomes an anchor. */
export default function PokemonArtworkImage({ source, alt, onError, inset = 16 }: PokemonArtworkImageProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [measurement, setMeasurement] = useState<ImageMeasurement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [readable, setReadable] = useState(true)

  useEffect(() => {
    const frame = imageRef.current?.parentElement
    if (!frame) return
    const updateSize = () => {
      const { width, height } = frame.getBoundingClientRect()
      setSize({ width, height })
    }
    updateSize()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize)
      return () => window.removeEventListener('resize', updateSize)
    }
    const observer = new ResizeObserver(updateSize)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  function handleLoad(event: SyntheticEvent<HTMLImageElement>): void {
    const image = event.currentTarget
    if (image.naturalWidth > 0 && image.naturalHeight > 0) setMeasurement(measureImage(image))
  }
  const style = measurement && size.width > 0 && size.height > 0
    ? fitArtwork(measurement.bounds, measurement.aspectRatio, size.width, size.height, inset)
    : undefined

  return <img ref={imageRef} key={readable ? 'readable' : 'fallback'} className="pokemon-artwork-image"
    src={source} crossOrigin={readable ? 'anonymous' : undefined} alt={alt} width="340" height="340"
    style={style} onLoad={handleLoad} onError={() => {
      if (readable) setReadable(false)
      else onError()
    }} />
}
