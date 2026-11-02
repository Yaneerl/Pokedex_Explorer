import { useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'

/** Animate CSS variables only; React state and the measured image bounds stay untouched. */
export default function useArtworkTilt(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const allowed = useRef(false)
  const target = useRef({ x: 0, y: 0 })
  const start = useRef<(() => void) | null>(null)

  useEffect(() => {
    const frame = ref.current
    if (!frame || typeof window.matchMedia !== 'function') return
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let request: number | null = null
    let current = { x: 0, y: 0 }
    function reset(): void {
      if (request !== null) window.cancelAnimationFrame(request)
      request = null
      current = { x: 0, y: 0 }
      target.current = { x: 0, y: 0 }
      frame?.style.removeProperty('--tilt-x')
      frame?.style.removeProperty('--tilt-y')
      frame?.removeAttribute('data-tilting')
    }
    function animate(): void {
      current.x += (target.current.x - current.x) * 0.16
      current.y += (target.current.y - current.y) * 0.16
      frame?.style.setProperty('--tilt-x', String(current.x))
      frame?.style.setProperty('--tilt-y', String(current.y))
      if (Math.abs(current.x - target.current.x) + Math.abs(current.y - target.current.y) > 0.002) {
        request = window.requestAnimationFrame(animate)
      } else {
        request = null
        if (target.current.x === 0 && target.current.y === 0) reset()
      }
    }
    start.current = () => {
      if (!allowed.current) return
      frame.setAttribute('data-tilting', 'true')
      if (request === null) request = window.requestAnimationFrame(animate)
    }
    function updatePreference(): void {
      allowed.current = enabled && pointer.matches && !reduced.matches
      if (!allowed.current) reset()
    }
    updatePreference()
    pointer.addEventListener('change', updatePreference)
    reduced.addEventListener('change', updatePreference)
    window.addEventListener('resize', reset)
    return () => {
      reset()
      allowed.current = false
      start.current = null
      pointer.removeEventListener('change', updatePreference)
      reduced.removeEventListener('change', updatePreference)
      window.removeEventListener('resize', reset)
    }
  }, [enabled])

  function onPointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!allowed.current || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    target.current = {
      x: Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)),
      y: Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1)),
    }
    start.current?.()
  }
  function onPointerLeave(): void {
    target.current = { x: 0, y: 0 }
    start.current?.()
  }
  return { ref, onPointerMove, onPointerLeave }
}
