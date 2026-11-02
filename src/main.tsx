import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AppExperience from './components/AppExperience.tsx'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element was not found')

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AppExperience><App /></AppExperience>
    </BrowserRouter>
  </StrictMode>,
)
