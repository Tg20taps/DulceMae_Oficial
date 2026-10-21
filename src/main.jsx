import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Fuentes servidas desde la misma página: sin esperar a Google Fonts.
import '@fontsource-variable/montserrat'
import '@fontsource-variable/playfair-display'
import '@fontsource-variable/playfair-display/wght-italic.css'
import './index.css'
import { CartProvider } from './context/CartContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>,
)
