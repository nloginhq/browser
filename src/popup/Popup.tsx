import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './Popup.css'

import Login from './pages/login'
import Vault from './pages/vault'

function App() {
  return (
    <Router>
      <main>
        <Routes>
          <Route path="/popup.html" element={<Login />} />
          <Route path="/vault" element={<Vault />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
