import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest globals stay disabled; register DOM cleanup explicitly.
afterEach(cleanup)
