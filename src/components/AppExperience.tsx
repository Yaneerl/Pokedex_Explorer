import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import useIntroPlayback from '../hooks/useIntroPlayback.ts'
import PokedexIntro from './PokedexIntro.tsx'
import '../styles/pokedex-intro.css'

interface AppExperienceProps {
  children: ReactNode
}

export default function AppExperience({ children }: AppExperienceProps) {
  const { showIntro, completeIntro } = useIntroPlayback()
  const contentRef = useRef<HTMLDivElement>(null)
  const wasVisible = useRef(showIntro)
  const keyboardCompletion = useRef(false)
  const finishIntro = useCallback((keyboard = false): void => {
    keyboardCompletion.current = keyboard
    completeIntro()
  }, [completeIntro])

  useEffect(() => {
    if (showIntro || !wasVisible.current) return
    wasVisible.current = false
    // Pointer/automatic completion should not give the title a keyboard-style focus ring.
    // Removing the dialog releases focus naturally; Tab then enters the page normally.
    if (!keyboardCompletion.current) return
    const content = contentRef.current
    const target = content?.querySelector<HTMLElement>('h1') ?? content?.querySelector<HTMLElement>('h2') ?? content?.querySelector<HTMLElement>('main')
    if (target) {
      // Keep a programmatic focus target; removing tabindex immediately blurs it in Chrome.
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    }
  }, [showIntro])

  return (
    <>
      <div className="app-experience" ref={contentRef} inert={showIntro} aria-hidden={showIntro ? true : undefined}>
        {children}
      </div>
      {showIntro && <PokedexIntro onComplete={finishIntro} />}
    </>
  )
}
