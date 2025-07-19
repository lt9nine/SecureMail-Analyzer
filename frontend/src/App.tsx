import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

import Dashboard from './views/Dashboard'
import EmailDetail from './views/EmailDetail'
import HealthStatus from './components/HealthStatus'

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="container">
            <h1>SecureMail Analyzer</h1>
            <HealthStatus />
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/email/:id" element={<EmailDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App 