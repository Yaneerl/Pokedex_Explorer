import { Link } from 'react-router'
import InterfaceIcon from './InterfaceIcon.tsx'
import PokemonOfTheDay from './PokemonOfTheDay.tsx'
import type { DailyPokemonResult } from '../hooks/usePokemonOfTheDay.ts'
import '../styles/catalog-controls.css'
import '../styles/catalog-daily.css'

interface CatalogHeaderProps { daily: DailyPokemonResult }

export default function CatalogHeader({ daily }: CatalogHeaderProps) {
  return (
    <header className="app-header catalog-header">
      <div className="catalog-title-panel">
        <div className="catalog-title-copy">
          <p className="eyebrow"><span aria-hidden="true">01 / </span>YOUR DIGITAL POKÉDEX</p>
          <h1 className="catalog-title">PokéDex <span>Explorer</span></h1>
          <p className="intro">Discover Pokémon from every generation. Powered by PokéAPI.</p>
          <div className="catalog-title-detail" aria-hidden="true"><span /><span /><span /><span /></div>
        </div>
        <PokemonOfTheDay daily={daily} />
      </div>
      <nav className="app-navigation catalog-navigation" aria-label="Main navigation">
        <span className="catalog-navigation-label" aria-hidden="true">QUICK ACCESS / 01</span>
        <Link className="device-control device-control--navigation" to="/favorites">
          <InterfaceIcon name="heart" /><span>Favorites</span><span className="device-control-code" aria-hidden="true">FAV</span>
        </Link>
        <Link className="device-control device-control--navigation" to="/compare">
          <InterfaceIcon name="compare" /><span>Pokémon Comparison</span><span className="device-control-code" aria-hidden="true">CMP</span>
        </Link>
      </nav>
    </header>
  )
}
