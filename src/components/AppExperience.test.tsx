import { StrictMode, useEffect, useState } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '../App.tsx'
import { INTRO_STORAGE_KEY, REDUCED_MOTION_QUERY } from '../hooks/useIntroPlayback.ts'
import AppExperience from './AppExperience.tsx'
import PokedexIntro, { INTRO_DURATION_MS } from './PokedexIntro.tsx'

function motionPreference(reduced = false) {
  const media = Object.assign(new EventTarget(), { matches: reduced, media: REDUCED_MOTION_QUERY })
  vi.stubGlobal('matchMedia', vi.fn(() => media))
  return {
    media,
    change(matches: boolean) {
      media.matches = matches
      media.dispatchEvent(Object.assign(new Event('change'), { matches, media: REDUCED_MOTION_QUERY }))
    },
  }
}
const mounted = vi.fn()
function UnderlyingPage() {
  const [count, setCount] = useState(0)
  useEffect(() => { mounted() }, [])
  return <main><h1>Catalog</h1><button onClick={() => setCount(count + 1)}>Count {count}</button></main>
}
function show() { return render(<AppExperience><UnderlyingPage /></AppExperience>) }
function finishAnimation(element: Element, name = 'pokedex-intro-exit') {
  fireEvent(element, Object.assign(new Event('animationend', { bubbles: true }), { animationName: name }))
}

beforeEach(() => {
  vi.useFakeTimers()
  window.sessionStorage.removeItem(INTRO_STORAGE_KEY)
  mounted.mockClear()
  motionPreference()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  window.sessionStorage.removeItem(INTRO_STORAGE_KEY)
  document.body.style.overflow = ''
})

test('shows one accessible intro on first entry while mounting the underlying app and reserving keyboard focus', () => {
  const view = show()
  const dialog = screen.getByRole('dialog', { name: 'Opening PokéDex Explorer' })
  const skip = screen.getByRole('button', { name: 'Skip Intro' })
  expect(document.activeElement).toBe(skip)
  expect(document.body.style.overflow).toBe('hidden')
  expect(view.container.querySelector('main')).toBeTruthy()
  expect(view.container.querySelector('[inert]')?.getAttribute('aria-hidden')).toBe('true')
  expect(screen.queryByRole('heading', { name: 'Catalog' })).toBeNull()
  expect(mounted).toHaveBeenCalledTimes(1)
  expect(window.sessionStorage.getItem(INTRO_STORAGE_KEY)).toBe('1')
  fireEvent.keyDown(dialog, { key: 'Tab' })
  expect(document.activeElement).toBe(skip)
  fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
  expect(document.activeElement).toBe(skip)
})

test('Skip Intro restores focus and scrolling without remounting the app or resetting state', () => {
  document.body.style.overflow = 'auto'
  const cleared = vi.spyOn(window, 'clearTimeout')
  const view = show()
  const underlyingButton = view.container.querySelector('main button')
  if (!underlyingButton) throw new Error('Expected mounted content')
  // A background state update must survive removing the intro overlay.
  fireEvent.click(underlyingButton)
  fireEvent.click(screen.getByRole('button', { name: 'Skip Intro' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByRole('button', { name: 'Count 1' })).toBeTruthy()
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Catalog' }))
  expect(view.container.querySelector('[inert]')).toBeNull()
  expect(document.body.style.overflow).toBe('auto')
  expect(mounted).toHaveBeenCalledTimes(1)
  expect(cleared).toHaveBeenCalled()
  act(() => vi.runOnlyPendingTimers())
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('completes on the final overlay animation only and ignores bubbled device animations', () => {
  show()
  const dialog = screen.getByRole('dialog')
  const device = dialog.querySelector('svg')
  if (!device) throw new Error('Expected SVG device')
  finishAnimation(device)
  finishAnimation(dialog, 'pokedex-screen-reveal')
  expect(screen.getByRole('dialog')).toBeTruthy()
  finishAnimation(dialog)
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByRole('heading', { name: 'Catalog' })).toBeTruthy()
})

test('allows Escape to skip and does not replay after remounting or refreshing the same session', () => {
  const first = show()
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(screen.queryByRole('dialog')).toBeNull()
  first.unmount()
  show()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByRole('heading', { name: 'Catalog' })).toBeTruthy()
})

test('does not restart if the page is refreshed while the intro is still running', () => {
  const first = show()
  expect(screen.getByRole('dialog')).toBeTruthy()
  first.unmount()
  show()
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('bypasses the intro immediately with reduced motion and never locks the app', () => {
  motionPreference(true)
  const view = show()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(view.container.querySelector('[inert]')).toBeNull()
  expect(screen.getByRole('button', { name: 'Count 0' })).toBeTruthy()
  expect(document.body.style.overflow).toBe('')
  expect(vi.getTimerCount()).toBe(0)
})

test('ends immediately when reduced motion is enabled during playback and cleans up its listener', () => {
  const preference = motionPreference()
  const remove = vi.spyOn(preference.media, 'removeEventListener')
  const view = show()
  act(() => preference.change(true))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Catalog' }))
  act(() => vi.runOnlyPendingTimers())
  expect(screen.queryByRole('dialog')).toBeNull()
  view.unmount()
  expect(remove).toHaveBeenCalledWith('change', expect.any(Function))
})

test('falls back to a bounded timeout if CSS animation events never arrive', () => {
  show()
  act(() => vi.advanceTimersByTime(INTRO_DURATION_MS + 249))
  expect(screen.getByRole('dialog')).toBeTruthy()
  act(() => vi.advanceTimersByTime(1))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.body.style.overflow).toBe('')
})

test('survives blocked sessionStorage and does not reopen during navigation', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked') })
  render(<MemoryRouter><AppExperience><Link to="/compare">Comparison</Link><Routes>
    <Route path="/" element={<h1>Catalog</h1>} /><Route path="/compare" element={<h1>Compare destination</h1>} />
  </Routes></AppExperience></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'Skip Intro' }))
  fireEvent.click(screen.getByRole('link', { name: 'Comparison' }))
  expect(screen.getByRole('heading', { name: 'Compare destination' })).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('cleans up timers and scroll locking under StrictMode and on unmount', () => {
  const done = vi.fn()
  const scheduled = vi.spyOn(window, 'setTimeout')
  const cleared = vi.spyOn(window, 'clearTimeout')
  const view = render(<StrictMode><PokedexIntro onComplete={done} /></StrictMode>)
  expect(screen.getAllByRole('dialog')).toHaveLength(1)
  const introTimers = scheduled.mock.calls.flatMap((args, i) => args[1] === INTRO_DURATION_MS + 250 ? [scheduled.mock.results[i]?.value] : [])
  expect(introTimers).toHaveLength(2)
  view.unmount()
  for (const timer of introTimers) expect(cleared).toHaveBeenCalledWith(timer)
  act(() => vi.runOnlyPendingTimers())
  expect(done).not.toHaveBeenCalled()
  expect(document.body.style.overflow).toBe('')
})

test('calls completion only once even if Skip, animationend and the fallback overlap', () => {
  const done = vi.fn()
  render(<PokedexIntro onComplete={done} />)
  fireEvent.click(screen.getByRole('button', { name: 'Skip Intro' }))
  finishAnimation(screen.getByRole('dialog'))
  act(() => vi.advanceTimersByTime(INTRO_DURATION_MS + 250))
  expect(done).toHaveBeenCalledTimes(1)
})

test('keeps a direct Comparison route mounted and loads API data behind the intro without extra requests', async () => {
  const fetchMock = vi.fn<typeof fetch>(async () => Response.json({ results: [] }))
  vi.stubGlobal('fetch', fetchMock)
  const view = render(<MemoryRouter initialEntries={['/compare']}><AppExperience><App /></AppExperience></MemoryRouter>)
  await act(async () => { await Promise.resolve() })
  expect(view.container.querySelector('.pokemon-comparison')).toBeTruthy()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Skip Intro' }))
  expect(screen.getByRole('heading', { name: 'Pokémon Comparison' })).toBeTruthy()
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('reveals the real catalog controls and navigation already mounted behind the opening', async () => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => Response.json({ results: [] })))
  const view = render(<MemoryRouter><AppExperience><App /></AppExperience></MemoryRouter>)
  await act(async () => { await Promise.resolve() })
  const originalMain = view.container.querySelector('main')
  const originalSearch = view.container.querySelector('#pokemon-search')
  const originalNavigation = view.container.querySelector('.app-navigation')
  expect(originalSearch).toBeTruthy()
  expect(originalNavigation).toBeTruthy()
  expect(screen.queryByRole('searchbox', { name: 'Search Pokémon' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Skip Intro' }))
  expect(screen.getByRole('searchbox', { name: 'Search Pokémon' })).toBe(originalSearch)
  expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBe(originalNavigation)
  expect(view.container.querySelector('main')).toBe(originalMain)
})
