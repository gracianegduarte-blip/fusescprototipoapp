import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import PhoneFrame from './components/PhoneFrame'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PhoneFrame>
      <App />
    </PhoneFrame>
  </React.StrictMode>,
)
