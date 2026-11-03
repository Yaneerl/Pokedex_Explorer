const paths = {
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  compare: 'M8 3v18M16 3v18M3 8h10l-3-3M21 16H11l3 3',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  filter: 'M3 4h18l-7 8v7l-4 2v-9L3 4Z',
  layers: 'm12 3 10 5-10 5L2 8l10-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',
  classification: 'M9 3h6l2 4 4 2v6l-4 2-2 4H9l-2-4-4-2V9l4-2 2-4Zm0 9 2 2 4-4',
  sort: 'M7 3v18l-4-4m4 4 4-4M14 5h7M14 10h5M14 15h3',
  reset: 'M3 10a9 9 0 1 1 2 8M3 4v6h6',
  previous: 'm14 5-7 7 7 7M7 12h14',
  next: 'm10 5 7 7-7 7M3 12h14',
  height: 'M5 3v18M2 6l3-3 3 3M2 18l3 3 3-3M12 3h9v18h-9V3Zm0 4h4m-4 5h6m-6 5h4',
  weight: 'M9 7a3 3 0 1 1 6 0M6 7h12l3 14H3L6 7Zm6 4v5m-3 0h6',
  ability: 'm13 2-9 12h7l-1 8 10-13h-7l1-7Z',
  hidden: 'M5 10V7a7 7 0 0 1 14 0v3M4 10h16v11H4V10Zm8 4v3m-2-1h4',
} as const

interface InterfaceIconProps {
  name: keyof typeof paths
}

export default function InterfaceIcon({ name }: InterfaceIconProps) {
  return (
    <svg className="interface-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  )
}
