import { useCallback, useEffect, useId, useRef } from 'react'
import type { CSSProperties } from 'react'
import PokedexDevice from './PokedexDevice.tsx'

export const INTRO_DURATION_MS = 3200
const durationStyle: CSSProperties & { '--intro-duration': string } = { '--intro-duration': INTRO_DURATION_MS + 'ms' }

interface PokedexIntroProps {
  onComplete: () => void
}

export default function PokedexIntro({ onComplete }: PokedexIntroProps) {
  const headingId = useId()
  const overlayRef = useRef<HTMLDivElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const finished = useRef(false)
  const finish = useCallback((): void => {
    if (finished.current) return
    finished.current = true
    onComplete()
  }, [onComplete])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    skipRef.current?.focus({ preventScroll: true })
    const overlay = overlayRef.current
    const handleEnd = (event: AnimationEvent): void => {
      if (event.target === overlay && event.animationName === 'pokedex-intro-exit') finish()
    }
    overlay?.addEventListener('animationend', handleEnd)
    // CSS may be disabled or animationend may be interrupted: never block entry.
    const timeout = window.setTimeout(finish, INTRO_DURATION_MS + 250)
    return () => {
      window.clearTimeout(timeout)
      overlay?.removeEventListener('animationend', handleEnd)
      document.body.style.overflow = previousOverflow
    }
  }, [finish])

  return (
    <div
      className="pokedex-intro"
      style={durationStyle}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); finish() }
        if (event.key === 'Tab') { event.preventDefault(); skipRef.current?.focus() }
      }}
    >
      <h1 id={headingId} className="pokedex-intro-accessible-title">Opening PokéDex Explorer</h1>
      <div className="pokedex-intro-stage"><PokedexDevice /></div>
      <button className="pokedex-intro-skip" type="button" ref={skipRef} onClick={finish}>Skip Intro <span aria-hidden="true">→</span></button>
    </div>
  )
}
