/** Normalized visible bounds; this module has no species, pose or podium rules. */
export interface ArtworkBounds { left: number; top: number; width: number; height: number }
export const FULL_ARTWORK_BOUNDS: ArtworkBounds = { left: 0, top: 0, width: 1, height: 1 }

export function getArtworkBounds(pixels: Uint8ClampedArray, width: number, height: number): ArtworkBounds | null {
  if (width < 1 || height < 1 || pixels.length !== width * height * 4) return null
  let left = width
  let top = height
  let right = -1
  let bottom = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      // Ignore nearly invisible antialiasing, not opaque artwork.
      if ((pixels[(y * width + x) * 4 + 3] ?? 0) <= 16) continue
      left = Math.min(left, x)
      top = Math.min(top, y)
      right = Math.max(right, x)
      bottom = Math.max(bottom, y)
    }
  }
  if (right < left) return null
  return { left: left / width, top: top / height, width: (right - left + 1) / width, height: (bottom - top + 1) / height }
}

/** Uniformly contain and center the visible artwork within a padded display. */
export function fitArtwork(bounds: ArtworkBounds, aspectRatio: number, frameWidth: number, frameHeight: number) {
  const width = Math.min(Math.max(1, frameWidth - 32) / bounds.width, Math.max(1, frameHeight - 32) * aspectRatio / bounds.height)
  const height = width / aspectRatio
  return {
    width,
    height,
    left: (frameWidth - bounds.width * width) / 2 - bounds.left * width,
    top: (frameHeight - bounds.height * height) / 2 - bounds.top * height,
  }
}
