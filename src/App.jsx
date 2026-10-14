
import { useState } from 'react'
import items from './data/items.json'
import PokemonList from './components/PokemonList.jsx'
import PokemonDetails from './components/PokemonDetails.jsx'

export default function App() {
  const [selectedPokemon, setSelectedPokemon] = useState(null)

  return (
    <main className="app">
      {selectedPokemon ? (
        <PokemonDetails
          pokemon={selectedPokemon}
          onBack={() => setSelectedPokemon(null)}
        />
      ) : (
        <>
          <header className="app-header">
            <p className="eyebrow">YOUR DIGITAL POKÉDEX</p>
            <h1>PokéDex Explorer</h1>
            <p className="intro">
              Discover Pokémon from every generation.
              This version uses local sample data.
            </p>
          </header>

          <PokemonList
            pokemon={items}
            onSelect={setSelectedPokemon}
          />
        </>
      )}
    </main>
  )
}
