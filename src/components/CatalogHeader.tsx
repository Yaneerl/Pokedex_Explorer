import { Link } from 'react-router'
import InterfaceIcon from './InterfaceIcon.tsx'
import '../styles/catalog-controls.css'

export default function CatalogHeader() {
  return (
    <header className="app-header catalog-header">
      <div className="catalog-title-panel">
        <p className="eyebrow"><span aria-hidden="true">01 / </span>YOUR DIGITAL POKÉDEX</p>
        <h1 className="catalog-title">PokéDex <span>Explorer</span></h1>
        <p className="intro">Discover Pokémon from every generation. Powered by PokéAPI.</p>
        <div className="catalog-title-detail" aria-hidden="true"><span /><span /><span /><span /></div>
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
