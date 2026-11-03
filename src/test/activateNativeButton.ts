import { fireEvent } from '@testing-library/react'

/** jsdom does not implement the browser's default Enter/Space click activation. */
export default function activateNativeButton(element: HTMLElement, key: 'Enter' | ' '): void {
  if (!(element instanceof HTMLButtonElement) || element.disabled) throw new Error('Expected an enabled native button')
  element.focus()
  const downAllowed = fireEvent.keyDown(element, { key })
  if (key === 'Enter' && downAllowed) fireEvent.click(element, { detail: 0 })
  const upAllowed = fireEvent.keyUp(element, { key })
  if (key === ' ' && downAllowed && upAllowed) fireEvent.click(element, { detail: 0 })
}
