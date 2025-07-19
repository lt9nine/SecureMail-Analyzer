import React, { useState } from 'react';
import './DashboardStats.css';

interface EmailStats {
  total: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  averageScore: number;
  topThreats: Array<{ threat: string; count: number }>;
  riskTrend: Array<{ date: string; score: number }>;
}

interface DashboardStatsProps {
  stats: EmailStats;
  isLoading?: boolean;
  onFilterChange?: (filters: FilterOptions) => void;
}

interface FilterOptions {
  dateRange: 'all' | 'today' | 'week' | 'month';
  riskLevel: 'all' | 'high' | 'medium' | 'low';
  showTrends: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  stats, 
  isLoading = false, 
  onFilterChange 
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'all',
    riskLevel: 'all',
    showTrends: true
  });

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  if (isLoading) {
    return (
      <div className="dashboard-stats">
        <div className="stats-header">
          <h2>📊 Statistiken</h2>
        </div>
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <p>Lade Statistiken...</p>
        </div>
      </div>
    );
  }

  const calculatePieChart = () => {
    const total = stats.highRisk + stats.mediumRisk + stats.lowRisk;
    if (total === 0) return { high: 0, medium: 0, low: 0 };
    
    const high = (stats.highRisk / total) * 360;
    const medium = (stats.mediumRisk / total) * 360;
    const low = (stats.lowRisk / total) * 360;
    
    return { high, medium, low };
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#64748b';
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const pieData = calculatePieChart();

  return (
    <div className="dashboard-stats">
      <div className="stats-header">
        <h2>📊 Statistiken</h2>
        <div className="stats-summary">
          <span className="total-emails">{stats.total} E-Mails analysiert</span>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="stats-filters">
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
          <label>Risiko-Level:</label>
          <select 
            value={filters.riskLevel} 
            onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
          >
            <option value="all">Alle</option>
            <option value="high">Hoch</option>
            <option value="medium">Mittel</option>
            <option value="low">Niedrig</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <input 
              type="checkbox" 
              checked={filters.showTrends}
              onChange={(e) => handleFilterChange('showTrends', e.target.checked)}
            />
            Trends anzeigen
          </label>
        </div>
      </div>

      <div className="stats-grid">
        {/* Risk Distribution Chart */}
        <div className="stats-card risk-distribution">
          <h3>Risikoverteilung</h3>
          <div className="chart-container">
            <div className="pie-chart" style={{
              background: `conic-gradient(
                ${getRiskColor('high')} 0deg ${pieData.high}deg,
                ${getRiskColor('medium')} ${pieData.high}deg ${pieData.high + pieData.medium}deg,
                ${getRiskColor('low')} ${pieData.high + pieData.medium}deg 360deg
              )`
            }}>
              {stats.highRisk > 0 && (
                <span 
                  className="segment-label" 
                  style={{ 
                    top: '10px', 
                    left: '50%', 
                    transform: 'translateX(-50%)'
                  }}
                >
                  Hoch: {stats.highRisk}
                </span>
              )}
              {stats.mediumRisk > 0 && (
                <span 
                  className="segment-label" 
                  style={{ 
                    bottom: '10px', 
                    left: '10px'
                  }}
                >
                  Mittel: {stats.mediumRisk}
                </span>
              )}
              {stats.lowRisk > 0 && (
                <span 
                  className="segment-label" 
                  style={{ 
                    bottom: '10px', 
                    right: '10px'
                  }}
                >
                  Niedrig: {stats.lowRisk}
                </span>
              )}
            </div>
          </div>
          
          {/* Risk Distribution Summary */}
          <div className="risk-summary">
            <div className="risk-item">
              <span className="risk-dot high"></span>
              <span>Hoch: {stats.highRisk} ({stats.total > 0 ? Math.round((stats.highRisk / stats.total) * 100) : 0}%)</span>
            </div>
            <div className="risk-item">
              <span className="risk-dot medium"></span>
              <span>Mittel: {stats.mediumRisk} ({stats.total > 0 ? Math.round((stats.mediumRisk / stats.total) * 100) : 0}%)</span>
            </div>
            <div className="risk-item">
              <span className="risk-dot low"></span>
              <span>Niedrig: {stats.lowRisk} ({stats.total > 0 ? Math.round((stats.lowRisk / stats.total) * 100) : 0}%)</span>
            </div>
          </div>
        </div>

        {/* Average Score */}
        <div className="stats-card average-score">
          <h3>Durchschnittlicher Score</h3>
          <div className="score-display">
            <div className="score-value">{Math.round(stats.averageScore)}</div>
            <div className="score-label">von 100</div>
            <div className="score-risk-level">
              Risiko: <span className={`risk-level-${getRiskLevel(stats.averageScore)}`}>
                {getRiskLevel(stats.averageScore) === 'high' ? 'Hoch' : 
                 getRiskLevel(stats.averageScore) === 'medium' ? 'Mittel' : 'Niedrig'}
              </span>
            </div>
          </div>
          <div className="score-bar">
            <div 
              className="score-fill" 
              style={{ width: `${stats.averageScore}%` }}
            ></div>
          </div>
          
          {/* Score Breakdown */}
          <div className="score-breakdown">
            <div className="breakdown-item">
              <span>0-39</span>
              <span className="breakdown-label">Niedrig</span>
            </div>
            <div className="breakdown-item">
              <span>40-69</span>
              <span className="breakdown-label">Mittel</span>
            </div>
            <div className="breakdown-item">
              <span>70-100</span>
              <span className="breakdown-label">Hoch</span>
            </div>
          </div>
        </div>

        {/* Top Threats */}
        <div className="stats-card top-threats">
          <h3>Häufigste Bedrohungen</h3>
          <div className="threats-list">
            {stats.topThreats.slice(0, 5).map((threat, index) => (
              <div key={index} className="threat-item">
                <div className="threat-info">
                  <span className="threat-name">{threat.threat}</span>
                  <span className="threat-count">{threat.count}x</span>
                </div>
                <div className="threat-bar">
                  <div 
                    className="threat-fill" 
                    style={{ 
                      width: `${(threat.count / Math.max(...stats.topThreats.map(t => t.count))) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          {stats.topThreats.length === 0 && (
            <div className="no-data">
              <span>Keine Bedrohungen erkannt</span>
            </div>
          )}
        </div>

        {/* Risk Trend */}
        {filters.showTrends && (
          <div className="stats-card risk-trend">
            <h3>Risiko-Trend (7 Tage)</h3>
            <div className="trend-chart">
              {stats.riskTrend.map((point, index) => (
                <div key={index} className="trend-point">
                  <div 
                    className="trend-bar" 
                    style={{ height: `${point.score}%` }}
                  ></div>
                  <span className="trend-label">{point.date}</span>
                </div>
              ))}
            </div>
            
            {/* Trend Summary */}
            <div className="trend-summary">
              <div className="trend-stat">
                <span className="trend-label">Durchschnitt:</span>
                <span className="trend-value">
                  {Math.round(stats.riskTrend.reduce((sum, p) => sum + p.score, 0) / stats.riskTrend.length)}
                </span>
              </div>
              <div className="trend-stat">
                <span className="trend-label">Höchster:</span>
                <span className="trend-value">
                  {Math.max(...stats.riskTrend.map(p => p.score))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardStats; 