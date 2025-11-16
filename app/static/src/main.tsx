import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Error boundary for debugging
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Root element not found!')
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found</div>'
} else {
  try {
    // Get basename from current path
    const pathname = window.location.pathname
    const basename = pathname.startsWith('/static') ? '/static' : ''
    
    console.log('Initializing React app with basename:', basename, 'pathname:', pathname)
    
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </React.StrictMode>,
    )
    console.log('React app initialized successfully')
  } catch (error) {
    console.error('Error initializing React app:', error)
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error}</div>`
  }
}

