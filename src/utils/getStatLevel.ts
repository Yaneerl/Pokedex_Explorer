export type StatLevel = 'low' | 'medium' | 'high'

export default function getStatLevel(value: number): StatLevel {
  if (value < 50) return 'low'
  if (value < 90) return 'medium'
  return 'high'
}
