import { useCallback, useEffect, useState } from 'react'

export const INTRO_STORAGE_KEY = 'pokedex-explorer:intro-seen:v1'
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function shouldShowIntro(): boolean {
  if (typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches) return false
  try { return window.sessionStorage.getItem(INTRO_STORAGE_KEY) !== '1' } catch { return true }
}

export default function useIntroPlayback() {
  const [showIntro, setShowIntro] = useState(shouldShowIntro)
  const completeIntro = useCallback((): void => setShowIntro(false), [])

  useEffect(() => {
    // Mark entry immediately: a refresh during the intro should not restart it.
    try { window.sessionStorage.setItem(INTRO_STORAGE_KEY, '1') } catch { /* Keep working without storage. */ }
    if (typeof window.matchMedia !== 'function') return
    const preference = window.matchMedia(REDUCED_MOTION_QUERY)
    const handleChange = (event: MediaQueryListEvent): void => {
      if (event.matches) completeIntro()
    }
    preference.addEventListener('change', handleChange)
    return () => preference.removeEventListener('change', handleChange)
  }, [completeIntro])

  return { showIntro, completeIntro }
}
