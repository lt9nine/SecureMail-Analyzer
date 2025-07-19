import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import './ThemeToggle.css'

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button 
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="toggle-container">
        <div className="toggle-track">
          <div className="toggle-thumb">
            {theme === 'light' ? (
              <span className="sun-icon">☀️</span>
            ) : (
              <span className="moon-icon">🌙</span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

export default ThemeToggle 