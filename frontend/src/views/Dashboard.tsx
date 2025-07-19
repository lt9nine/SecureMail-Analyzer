import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmailAnalysis } from '../hooks/useApi'
import { EmailAnalysis } from '../types/api'
import EmailFilters, { FilterOptions } from '../components/EmailFilters'
import RealtimeStatus from '../components/RealtimeStatus'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import './Dashboard.css'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useEmailAnalysis(10)
  const { lastUpdate } = useRealtimeUpdates()
  const lastUpdateRef = useRef<string | null>(null)
  const [shouldRefresh, setShouldRefresh] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    riskLevel: [],
    scoreRange: [0, 100],
    senderDomain: '',
    searchTerm: ''
  })



  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'hoch':
        return 'text-red-600 font-bold'
      case 'mittel':
        return 'text-yellow-600 font-bold'
      case 'niedrig':
        return 'text-green-600 font-bold'
      default:
        return 'text-gray-600'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'hoch':
        return '🔴'
      case 'mittel':
        return '🟡'
      case 'niedrig':
        return '🟢'
      default:
        return '⚪'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getAIScoreColor = (score: number) => {
    if (score >= 70) return 'ai-score-high'
    if (score >= 40) return 'ai-score-medium'
    return 'ai-score-low'
  }

  const truncateText = (text: string, maxLength: number = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Filter emails based on current filters
  const filteredEmails = useMemo(() => {
    if (!data?.results) return []
    
    return data.results.filter((email: EmailAnalysis) => {
      // Risk level filter
      if (filters.riskLevel.length > 0 && !filters.riskLevel.includes(email.final.risikostufe)) {
        return false
      }
      
      // Score range filter
      if (email.final.score < filters.scoreRange[0] || email.final.score > filters.scoreRange[1]) {
        return false
      }
      
      // Sender domain filter
      if (filters.senderDomain && !email.headers.from_domain.toLowerCase().includes(filters.senderDomain.toLowerCase())) {
        return false
      }
      
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const subjectMatch = email.subject.toLowerCase().includes(searchLower)
        const senderMatch = email.from_addr.toLowerCase().includes(searchLower)
        if (!subjectMatch && !senderMatch) {
          return false
        }
      }
      
      return true
    })
  }, [data?.results, filters])

  // Markiere Refresh wenn neue E-Mail empfangen wird
  useEffect(() => {
    if (lastUpdate && lastUpdate.latest_email) {
      const updateKey = `${lastUpdate.latest_email.uid}-${lastUpdate.timestamp}`
      
      // Verhindere doppelte Updates
      if (lastUpdateRef.current !== updateKey) {
        console.log('New email detected, marking for refresh...', lastUpdate.latest_email.subject)
        lastUpdateRef.current = updateKey
        setShouldRefresh(true)
      }
    }
  }, [lastUpdate])

  // Führe Refresh aus wenn markiert
  useEffect(() => {
    if (shouldRefresh) {
      console.log('Executing refresh...')
      refetch()
      setShouldRefresh(false)
    }
  }, [shouldRefresh, refetch])

  if (loading) {
    return (
      <div className="dashboard">
        <h2>Email Dashboard</h2>
        <p>Loading email analysis...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard">
        <h2>Email Dashboard</h2>
        <div className="error">
          <p>Error loading emails: {error}</p>
          <button onClick={refetch}>Retry</button>
        </div>
      </div>
    )
  }

  if (!data || data.results.length === 0) {
    return (
      <div className="dashboard">
        <h2>Email Dashboard</h2>
        <p>No emails found.</p>
        <button onClick={refetch}>Refresh</button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <RealtimeStatus />
      <div className="dashboard-header">
        <h2>Email Dashboard</h2>
        <button onClick={refetch}>Refresh</button>
      </div>
      
      <EmailFilters 
        onFiltersChange={setFilters}
        totalEmails={data?.results?.length || 0}
        filteredCount={filteredEmails.length}
      />
      
      <div className="email-list">
        {filteredEmails.length === 0 ? (
          <div className="no-results">
            <p>Keine E-Mails gefunden, die den aktuellen Filtern entsprechen.</p>
            <button onClick={() => setFilters({
              riskLevel: [],
              scoreRange: [0, 100],
              senderDomain: '',
              searchTerm: ''
            })}>Alle Filter löschen</button>
          </div>
        ) : (
          filteredEmails.map((email: EmailAnalysis) => (
            <div 
              key={email.uid} 
              className="email-item clickable"
              onClick={() => navigate(`/email/${email.uid}`)}
            >
              <div className="email-header">
                <span className={`risk-indicator ${getRiskColor(email.final.risikostufe)}`}>
                  {getRiskIcon(email.final.risikostufe)} {email.final.risikostufe.toUpperCase()}
                </span>
                <span className="score">Score: {email.final.score}/100</span>
              </div>
              
              <div className="email-content">
                <h3 className="subject">{email.subject}</h3>
                <p className="from">From: {email.from_addr || 'Unknown'}</p>
                <div className={`ai-analysis ${getAIScoreColor(email.analysis.score)}`}>
                  <div className="ai-score">
                    <span className={`score-value ${getScoreColor(email.analysis.score)}`}>
                      🤖 AI Score: {email.analysis.score}/100
                    </span>
                  </div>
                  <div className="ai-text">
                    {truncateText(email.analysis.gruende.join(', '))}
                  </div>
                </div>
              </div>
              
              <div className="email-footer">
                <span className="uid">UID: {email.uid}</span>
                <span className="links-count">
                  Links: {email.links.length}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Dashboard 