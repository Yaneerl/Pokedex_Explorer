import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import PokemonArtwork from './PokemonArtwork.tsx'
import PokemonArtworkImage from './PokemonArtworkImage.tsx'

let resize: () => void
let disconnect: ReturnType<typeof vi.fn>
let frameWidth = 400
let frameHeight = 340
const pixels = new Uint8ClampedArray(256 * 256 * 4)
pixels[(38 * 256 + 26) * 4 + 3] = 255
pixels[(218 * 256 + 230) * 4 + 3] = 255

beforeEach(() => {
  frameWidth = 400
  frameHeight = 340
  disconnect = vi.fn()
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback }
    observe = vi.fn()
    disconnect = disconnect
  })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    width: frameWidth, height: frameHeight, x: 0, y: 0, top: 0, left: 0,
    right: frameWidth, bottom: frameHeight, toJSON: () => ({}),
  }))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(), getImageData: () => ({ data: pixels }),
  } as unknown as CanvasRenderingContext2D)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

function loadImage(): HTMLImageElement {
  const image = screen.getByRole<HTMLImageElement>('img')
  Object.defineProperties(image, { naturalWidth: { value: 475 }, naturalHeight: { value: 475 } })
  fireEvent.load(image)
  return image
}
function expectCentered(image: HTMLImageElement) {
  expect(Number.parseFloat(image.style.left) + Number.parseFloat(image.style.width) * (26 + 205 / 2) / 256).toBeCloseTo(frameWidth / 2)
  expect(Number.parseFloat(image.style.top) + Number.parseFloat(image.style.height) * (38 + 181 / 2) / 256).toBeCloseTo(frameHeight / 2)
}

test('centers the visible artwork on both axes and recalculates when the viewport changes', () => {
  const { unmount } = render(<div><PokemonArtworkImage source="/centered-normal.png" alt="Artwork" onError={vi.fn()} /></div>)
  const image = loadImage()
  expectCentered(image)
  frameWidth = 200
  frameHeight = 260
  act(() => resize())
  expectCentered(image)
  expect(Number.parseFloat(image.style.width) * 205 / 256).toBeCloseTo(168)
  unmount()
  expect(disconnect).toHaveBeenCalled()
})

test('keeps the original image centered and usable when canvas pixel access is denied', () => {
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(() => { throw new DOMException('Blocked') })
  render(<div><PokemonArtworkImage source="/blocked-centering.png" alt="Artwork" onError={vi.fn()} /></div>)
  const image = loadImage()
  expect(Number.parseFloat(image.style.left) + Number.parseFloat(image.style.width) / 2).toBeCloseTo(200)
  expect(Number.parseFloat(image.style.top) + Number.parseFloat(image.style.height) / 2).toBeCloseTo(170)
})

test('retries without CORS before reporting an unavailable image', () => {
  const onError = vi.fn()
  render(<div><PokemonArtworkImage source="/cors-centering.png" alt="Artwork" onError={onError} /></div>)
  fireEvent.error(screen.getByRole('img'))
  expect(screen.getByRole('img').hasAttribute('crossorigin')).toBe(false)
  expect(onError).not.toHaveBeenCalled()
  fireEvent.error(screen.getByRole('img'))
  expect(onError).toHaveBeenCalledOnce()
})

test('remeasures Shiny margins and reuses Normal measurement on returning', () => {
  render(<PokemonArtwork name="charizard" image="/center-normal.png" shinyImage="/center-shiny.png" hero />)
  const normal = loadImage()
  const normalTop = normal.style.top
  expectCentered(normal)
  fireEvent.click(screen.getByRole('button', { name: 'Shiny' }))
  const shinyPixels = new Uint8ClampedArray(256 * 256 * 4)
  shinyPixels[(10 * 256 + 40) * 4 + 3] = 255
  shinyPixels[(240 * 256 + 210) * 4 + 3] = 255
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue({
    drawImage: vi.fn(), getImageData: () => ({ data: shinyPixels }),
  } as unknown as CanvasRenderingContext2D)
  const shiny = loadImage()
  expect(Number.parseFloat(shiny.style.left) + Number.parseFloat(shiny.style.width) * (40 + 171 / 2) / 256).toBeCloseTo(200)
  expect(Number.parseFloat(shiny.style.top) + Number.parseFloat(shiny.style.height) * (10 + 231 / 2) / 256).toBeCloseTo(170)
  expect(shiny.style.top).not.toBe(normalTop)
  fireEvent.click(screen.getByRole('button', { name: 'Normal' }))
  expect(loadImage().style.top).toBe(normalTop)
  expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledTimes(2)
})

test('preserves appearance controls and a clear fallback when Shiny is missing', () => {
  render(<PokemonArtwork name="mewtwo" image="/mewtwo-normal.png" shinyImage={null} hero />)
  fireEvent.click(screen.getByRole('button', { name: 'Shiny' }))
  expect(screen.queryByRole('img')).toBeNull()
  expect(screen.getByRole('status').textContent).toContain('Shiny image is not available')
  fireEvent.click(screen.getByRole('button', { name: 'Normal' }))
  expect(screen.getByRole('img').getAttribute('src')).toBe('/mewtwo-normal.png')
})
