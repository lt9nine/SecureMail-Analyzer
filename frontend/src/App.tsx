import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

import Dashboard from './views/Dashboard'
import EmailDetail from './views/EmailDetail'
import HealthStatus from './components/HealthStatus'
import ThemeToggle from './components/ThemeToggle'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <header className="App-header">
            <div className="container">
              <h1>SecureMail Analyzer</h1>
              <div className="header-controls">
                <HealthStatus />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/email/:uid" element={<EmailDetail />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App 