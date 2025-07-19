import React, { useState, useEffect } from 'react'
import './EmailFilters.css'

export interface FilterOptions {
  riskLevel: string[]
  scoreRange: [number, number]
  senderDomain: string
  searchTerm: string
}

interface EmailFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void
  totalEmails: number
  filteredCount: number
}

const EmailFilters: React.FC<EmailFiltersProps> = ({ 
  onFiltersChange, 
  totalEmails, 
  filteredCount 
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    riskLevel: [],
    scoreRange: [0, 100],
    senderDomain: '',
    searchTerm: ''
  })

  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const handleRiskLevelChange = (level: string) => {
    setFilters(prev => ({
      ...prev,
      riskLevel: prev.riskLevel.includes(level)
        ? prev.riskLevel.filter(l => l !== level)
        : [...prev.riskLevel, level]
    }))
  }

  const handleScoreRangeChange = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      scoreRange: [min, max]
    }))
  }

  const handleSenderDomainChange = (domain: string) => {
    setFilters(prev => ({
      ...prev,
      senderDomain: domain
    }))
  }

  const handleSearchChange = (term: string) => {
    setFilters(prev => ({
      ...prev,
      searchTerm: term
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      riskLevel: [],
      scoreRange: [0, 100],
      senderDomain: '',
      searchTerm: ''
    })
  }

  const hasActiveFilters = filters.riskLevel.length > 0 || 
    filters.scoreRange[0] > 0 || 
    filters.scoreRange[1] < 100 || 
    filters.senderDomain || 
    filters.searchTerm

  return (
    <div className="email-filters">
      <div className="filters-header">
        <div className="filters-title">
          <h3>🔍 Filter & Suche</h3>
          <span className="email-count">
            {filteredCount} von {totalEmails} E-Mails
          </span>
        </div>
        <div className="filters-controls">
          <button 
            className="expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼' : '▶'} Filter
          </button>
          {hasActiveFilters && (
            <button 
              className="clear-filters-button"
              onClick={clearAllFilters}
            >
              🗑️ Alle löschen
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="filters-content">
          {/* Search */}
          <div className="filter-section">
            <label>🔍 Suche</label>
            <input
              type="text"
              placeholder="Betreff oder Absender suchen..."
              value={filters.searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Risk Level Filter */}
          <div className="filter-section">
            <label>⚠️ Risiko-Level</label>
            <div className="risk-level-buttons">
              {[
                { level: 'hoch', label: '🔴 Hoch', color: 'risk-high' },
                { level: 'mittel', label: '🟡 Mittel', color: 'risk-medium' },
                { level: 'niedrig', label: '🟢 Niedrig', color: 'risk-low' }
              ].map(({ level, label, color }) => (
                <button
                  key={level}
                  className={`risk-button ${color} ${
                    filters.riskLevel.includes(level) ? 'active' : ''
                  }`}
                  onClick={() => handleRiskLevelChange(level)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Score Range Slider */}
          <div className="filter-section">
            <label>📊 Score-Bereich: {filters.scoreRange[0]} - {filters.scoreRange[1]}</label>
            <div className="score-slider-container">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.scoreRange[0]}
                onChange={(e) => handleScoreRangeChange(parseInt(e.target.value), filters.scoreRange[1])}
                className="score-slider min"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={filters.scoreRange[1]}
                onChange={(e) => handleScoreRangeChange(filters.scoreRange[0], parseInt(e.target.value))}
                className="score-slider max"
              />
              <div className="score-labels">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Sender Domain Filter */}
          <div className="filter-section">
            <label>🌐 Sender-Domain</label>
            <input
              type="text"
              placeholder="z.B. gmail.com, microsoft.com..."
              value={filters.senderDomain}
              onChange={(e) => handleSenderDomainChange(e.target.value)}
              className="domain-input"
            />
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="active-filters">
              <h4>Aktive Filter:</h4>
              <div className="filter-tags">
                {filters.riskLevel.map(level => (
                  <span key={level} className="filter-tag risk">
                    {level.toUpperCase()}
                  </span>
                ))}
                {(filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100) && (
                  <span className="filter-tag score">
                    Score: {filters.scoreRange[0]}-{filters.scoreRange[1]}
                  </span>
                )}
                {filters.senderDomain && (
                  <span className="filter-tag domain">
                    Domain: {filters.senderDomain}
                  </span>
                )}
                {filters.searchTerm && (
                  <span className="filter-tag search">
                    Suche: "{filters.searchTerm}"
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EmailFilters 