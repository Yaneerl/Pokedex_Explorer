import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// jsdom has no viewport scrolling; keep navigation effects deterministic in tests.
beforeEach(() => vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined))

// Vitest globals stay disabled; register DOM cleanup explicitly.
afterEach(() => { cleanup(); vi.restoreAllMocks() })
