import React, { useState, useMemo } from 'react';
import './EmailSearch.css';

export interface SearchFilters {
  query: string;
  riskLevel: 'all' | 'high' | 'medium' | 'low';
  dateRange: 'all' | 'today' | 'week' | 'month';
  sortBy: 'date' | 'score' | 'subject' | 'sender';
  sortOrder: 'asc' | 'desc';
  hasAttachments: boolean;
  hasLinks: boolean;
}

interface EmailSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  totalEmails: number;
  filteredCount: number;
}

const EmailSearch: React.FC<EmailSearchProps> = ({ 
  onFiltersChange, 
  totalEmails, 
  filteredCount 
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    riskLevel: 'all',
    dateRange: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    hasAttachments: false,
    hasLinks: false
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: SearchFilters = {
      query: '',
      riskLevel: 'all',
      dateRange: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
      hasAttachments: false,
      hasLinks: false
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = useMemo(() => {
    return filters.query !== '' || 
           filters.riskLevel !== 'all' || 
           filters.dateRange !== 'all' || 
           filters.hasAttachments || 
           filters.hasLinks;
  }, [filters]);

  return (
    <div className="email-search">
      <div className="search-header">
        <div className="search-main">
          <div className="search-input-group">
            <div className="search-icon">🔍</div>
            <input
              type="text"
              placeholder="E-Mails durchsuchen..."
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="search-input"
            />
            {filters.query && (
              <button
                onClick={() => handleFilterChange('query', '')}
                className="clear-search"
                title="Suche löschen"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="search-actions">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`advanced-toggle ${showAdvanced ? 'active' : ''}`}
            >
              {showAdvanced ? '▼' : '▶'} Erweiterte Suche
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="clear-filters"
                title="Alle Filter löschen"
              >
                Filter löschen
              </button>
            )}
          </div>
        </div>

        <div className="search-stats">
          <span className="results-count">
            {filteredCount} von {totalEmails} E-Mails
          </span>
        </div>
      </div>

      {showAdvanced && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Risiko-Level:</label>
              <select
                value={filters.riskLevel}
                onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
              >
                <option value="all">Alle Risiken</option>
                <option value="high">Hoch</option>
                <option value="medium">Mittel</option>
                <option value="low">Niedrig</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Zeitraum:</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="all">Alle</option>
                <option value="today">Heute</option>
                <option value="week">Letzte 7 Tage</option>
                <option value="month">Letzter Monat</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sortieren nach:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="date">Datum</option>
                <option value="score">Score</option>
                <option value="subject">Betreff</option>
                <option value="sender">Absender</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Reihenfolge:</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              >
                <option value="desc">Absteigend</option>
                <option value="asc">Aufsteigend</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="checkbox-filters">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.hasAttachments}
                  onChange={(e) => handleFilterChange('hasAttachments', e.target.checked)}
                />
                <span>Mit Anhängen</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.hasLinks}
                  onChange={(e) => handleFilterChange('hasLinks', e.target.checked)}
                />
                <span>Mit Links</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="active-filters">
          <span className="active-filters-label">Aktive Filter:</span>
          <div className="filter-tags">
            {filters.query && (
              <span className="filter-tag">
                Suche: "{filters.query}"
                <button onClick={() => handleFilterChange('query', '')}>✕</button>
              </span>
            )}
            {filters.riskLevel !== 'all' && (
              <span className="filter-tag">
                Risiko: {filters.riskLevel === 'high' ? 'Hoch' : filters.riskLevel === 'medium' ? 'Mittel' : 'Niedrig'}
                <button onClick={() => handleFilterChange('riskLevel', 'all')}>✕</button>
              </span>
            )}
            {filters.dateRange !== 'all' && (
              <span className="filter-tag">
                Zeitraum: {filters.dateRange === 'today' ? 'Heute' : filters.dateRange === 'week' ? 'Letzte 7 Tage' : 'Letzter Monat'}
                <button onClick={() => handleFilterChange('dateRange', 'all')}>✕</button>
              </span>
            )}
            {filters.hasAttachments && (
              <span className="filter-tag">
                Mit Anhängen
                <button onClick={() => handleFilterChange('hasAttachments', false)}>✕</button>
              </span>
            )}
            {filters.hasLinks && (
              <span className="filter-tag">
                Mit Links
                <button onClick={() => handleFilterChange('hasLinks', false)}>✕</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSearch; 