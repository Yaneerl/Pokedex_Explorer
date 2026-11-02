import type { CSSProperties } from 'react'
import type { POKEMON_TYPES } from '../types/pokemon.ts'

export type PokemonTypeName = (typeof POKEMON_TYPES)[number]

interface PokemonTypeTheme {
  accent: string
  surface: string
  ink: string
  iconPath: string
}

// Original SVG line drawings created for this project; no external icon assets.
const TYPE_THEMES: Record<PokemonTypeName, PokemonTypeTheme> = {
  normal: { accent: '#7e8491', surface: '#f0f1f4', ink: '#46505f', iconPath: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z' },
  fire: { accent: '#d96538', surface: '#fff0e9', ink: '#98401d', iconPath: 'M13 2c1 5-4 5-3 10-2-1-3-3-3-3-5 6-2 13 5 13s10-8 5-13c0 3-2 4-2 4 1-5 0-8-2-11ZM12 15c-3 3-2 5 0 5s3-3 0-5Z' },
  water: { accent: '#448ec2', surface: '#eaf5ff', ink: '#235b86', iconPath: 'M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13ZM8 15c0 2 1 3 3 3' },
  electric: { accent: '#c59b24', surface: '#fff8df', ink: '#775b09', iconPath: 'm14 2-10 12h7l-1 8L21 9h-8l1-7Z' },
  grass: { accent: '#5d9c58', surface: '#edf7e9', ink: '#376b32', iconPath: 'M20 3C8 1 1 9 6 16c7 5 15-2 14-13ZM3 22 16 9M8 17l-1-6M11 14l6 1' },
  ice: { accent: '#57a7b4', surface: '#e9f8fa', ink: '#286775', iconPath: 'M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M20 14l-4 1 1 4M4 14l4 1-1 4M20 10l-4-1 1-4' },
  fighting: { accent: '#c46655', surface: '#fff0ed', ink: '#903e30', iconPath: 'M7 12V6a2 2 0 0 1 4 0v5M11 5a2 2 0 0 1 4 0v6M15 7a2 2 0 0 1 4 0v6M19 10a2 2 0 0 1 3 2v5l-4 5H9l-4-4-3-5a2 2 0 0 1 3-2l4 4h5' },
  poison: { accent: '#9b6ab2', surface: '#f6eefb', ink: '#71448a', iconPath: 'M7 15v5h10v-5a8 8 0 1 0-10 0ZM8 9h1M15 9h1M11 13h2M10 17v3M14 17v3' },
  ground: { accent: '#b18a50', surface: '#faf1e4', ink: '#775527', iconPath: 'M2 15 8 5h6l8 10H2ZM3 19h18M6 22h12M8 5l3 6 3-6M11 11l-3 4' },
  flying: { accent: '#8299c8', surface: '#eef2fc', ink: '#4e638e', iconPath: 'M3 19C3 6 12 4 22 3l-5 7h-5l4 2-4 4H7l3 2-4 3-3-2ZM4 18l9-9' },
  psychic: { accent: '#cb668b', surface: '#fff0f6', ink: '#963b60', iconPath: 'M12 21a9 9 0 1 1 9-9c0 5-8 8-12 4-3-3-1-8 3-8 3 0 4 4 1 5h-2' },
  bug: { accent: '#8d9d42', surface: '#f4f7e6', ink: '#59661f', iconPath: 'M8 9a4 4 0 0 1 8 0v8a4 4 0 0 1-8 0V9ZM12 9v12M7 3l3 3M17 3l-3 3M3 9l5 3M21 9l-5 3M2 15h6M22 15h-6M4 22l4-4M20 22l-4-4' },
  rock: { accent: '#a79770', surface: '#f6f2e8', ink: '#71603b', iconPath: 'm7 3 10 1 5 10-5 7H5L2 12 7 3Zm0 0 4 7 6-6M2 12l9-2 6 11M11 10l-6 11M11 10l11 4' },
  ghost: { accent: '#7b74ad', surface: '#f2f0fa', ink: '#564d83', iconPath: 'M4 12a8 8 0 0 1 16 0v10l-4-3-4 3-4-3-4 3V12ZM8 11h1M15 11h1M10 16h4' },
  dragon: { accent: '#7762c1', surface: '#f2edff', ink: '#594394', iconPath: 'M5 22c0-7 2-10 7-11L8 7l5 1 2-6 3 5 4 3-3 6h-6c-2 1-3 3-3 6M14 12h3M18 7l-3 1M5 22h8' },
  dark: { accent: '#726975', surface: '#f1eef3', ink: '#504556', iconPath: 'M19 4a10 10 0 1 0 1 15A10 10 0 0 1 19 4ZM5 14l2 2' },
  steel: { accent: '#7b9aab', surface: '#edf5fa', ink: '#456271', iconPath: 'm12 2 9 5v10l-9 5-9-5V7l9-5ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z' },
  fairy: { accent: '#c683b2', surface: '#fff0fa', ink: '#8b4b7d', iconPath: 'm12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6ZM3 3v3M1.5 4.5h3M21 18v4M19 20h4' },
}

const UNKNOWN_TYPE: PokemonTypeTheme = {
  accent: '#7e8491', surface: '#f0f1f4', ink: '#46505f',
  iconPath: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 9a3 3 0 1 1 4 3l-1 1v1M12 17h.01',
}

export function getPokemonTypeTheme(type: string): PokemonTypeTheme {
  return Object.hasOwn(TYPE_THEMES, type) ? TYPE_THEMES[type as PokemonTypeName] : UNKNOWN_TYPE
}

type PokemonTypeStyle = CSSProperties & {
  '--type-accent': string
  '--type-surface': string
  '--type-ink': string
  '--type-glow': string
}

export function getPokemonTypeStyle(type: string): PokemonTypeStyle {
  const theme = getPokemonTypeTheme(type)
  return {
    '--type-accent': theme.accent,
    '--type-surface': theme.surface,
    '--type-ink': theme.ink,
    '--type-glow': theme.accent + '33',
  }
}
