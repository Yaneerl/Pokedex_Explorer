import { expect, test } from 'vitest'
import { FULL_ARTWORK_BOUNDS, fitArtwork, getArtworkBounds } from './artworkFrame.ts'

test('detects asymmetric transparent margins and ignores nearly invisible pixels', () => {
  const pixels = new Uint8ClampedArray(10 * 10 * 4)
  pixels[(3 * 10 + 2) * 4 + 3] = 255
  pixels[(7 * 10 + 6) * 4 + 3] = 255
  pixels[3] = 16
  expect(getArtworkBounds(pixels, 10, 10)).toEqual({ left: .2, top: .3, width: .5, height: .5 })
})

test('returns a safe missing measurement for transparent, incomplete or empty image data', () => {
  expect(getArtworkBounds(new Uint8ClampedArray(16), 2, 2)).toBeNull()
  expect(getArtworkBounds(new Uint8ClampedArray(4), 2, 2)).toBeNull()
  expect(getArtworkBounds(new Uint8ClampedArray(), 0, 0)).toBeNull()
})

test.each([
  ['wide artwork', 3, 420, 340],
  ['tall artwork', .4, 420, 340],
  ['small phone', 1.3, 220, 250],
  ['square artwork', 1, 360, 340],
] as const)('centers and contains %s on both axes without distortion', (_label, aspectRatio, width, height) => {
  const bounds = { left: .2, top: .1, width: .65, height: .7 }
  const frame = fitArtwork(bounds, aspectRatio, width, height)
  expect(frame.width / frame.height).toBeCloseTo(aspectRatio)
  expect(frame.left + (bounds.left + bounds.width / 2) * frame.width).toBeCloseTo(width / 2)
  expect(frame.top + (bounds.top + bounds.height / 2) * frame.height).toBeCloseTo(height / 2)
  expect(frame.left + bounds.left * frame.width).toBeGreaterThanOrEqual(15.9)
  expect(frame.left + (bounds.left + bounds.width) * frame.width).toBeLessThanOrEqual(width - 15.9)
  expect(frame.top + bounds.top * frame.height).toBeGreaterThanOrEqual(15.9)
  expect(frame.top + (bounds.top + bounds.height) * frame.height).toBeLessThanOrEqual(height - 15.9)
})

test('contains the original image when pixel measurement is unavailable', () => {
  expect(fitArtwork(FULL_ARTWORK_BOUNDS, 1, 300, 340)).toEqual({ left: 16, top: 36, width: 268, height: 268 })
})
