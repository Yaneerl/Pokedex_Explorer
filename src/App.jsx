import items from './data/items.json'
import PokemonList from './components/PokemonList.jsx'

// Task 1: display local JSON data. No API calls or selected-item state yet.
export default function App() {
  return (
    <main className="app">
      <header className="app-header">
        <p className="eyebrow">YOUR DIGITAL POKÉDEX</p>
        <h1>PokéDex Explorer</h1>
        <p className="intro">
          Discover Pokémon from every generation. This first version uses local sample data.
        </p>
      </header>
      <PokemonList pokemon={items} />
    </main>
  )
}
