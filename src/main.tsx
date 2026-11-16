import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
// Bootstrap (business profile components) loads first, in the lowest CSS layer.
import './styles/bootstrap.scss'
import './index.css'

// Apply the theme before first paint so color transitions don't animate from light to dark on load.
;(() => {
  const q = new URLSearchParams(window.location.search).get('theme')
  let mode: string | null = null
  try {
    mode = JSON.parse(localStorage.getItem('bitinary:theme') ?? 'null')
  } catch {
    mode = null
  }
  const pick = q === 'light' || q === 'dark' ? q : mode === 'light' || mode === 'dark' ? mode : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  document.documentElement.dataset.theme = pick
})()

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error: unknown) => {
      console.error('Service worker registration failed:', error)
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
