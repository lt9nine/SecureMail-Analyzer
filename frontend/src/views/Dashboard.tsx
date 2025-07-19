import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmailAnalysis } from '../hooks/useApi'
import { EmailAnalysis } from '../types/api'
import EmailSearch, { SearchFilters } from '../components/EmailSearch'
import RealtimeStatus from '../components/RealtimeStatus'
import DashboardStats from '../components/DashboardStats'
import ApiStatus from '../components/ApiStatus'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import { statsService, EmailStats } from '../services/statsService'
import './Dashboard.css'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useEmailAnalysis(10)
  const { lastUpdate } = useRealtimeUpdates()
  const lastUpdateRef = useRef<string | null>(null)
  const [shouldRefresh, setShouldRefresh] = useState(false)
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    riskLevel: 'all',
    dateRange: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    hasAttachments: false,
    hasLinks: false
  })
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [healthData, setHealthData] = useState<any>(null)



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

  // Filter emails based on search filters
  const filteredEmails = useMemo(() => {
    if (!data?.results) return []
    
    let filtered = data.results.filter((email: EmailAnalysis) => {
      // Search query filter
      if (searchFilters.query) {
        const queryLower = searchFilters.query.toLowerCase()
        const subjectMatch = email.subject.toLowerCase().includes(queryLower)
        const senderMatch = email.from_addr.toLowerCase().includes(queryLower)
        if (!subjectMatch && !senderMatch) {
          return false
        }
      }
      
      // Risk level filter
      if (searchFilters.riskLevel !== 'all') {
        const emailRisk = email.final.risikostufe.toLowerCase()
        if (searchFilters.riskLevel === 'high' && emailRisk !== 'hoch') return false
        if (searchFilters.riskLevel === 'medium' && emailRisk !== 'mittel') return false
        if (searchFilters.riskLevel === 'low' && emailRisk !== 'niedrig') return false
      }
      
      // Date range filter - simplified for now
      if (searchFilters.dateRange !== 'all') {
        // Skip date filtering for now as date field is not available
        return true
      }
      
      // Has attachments filter
      if (searchFilters.hasAttachments && (!email.headers.attachments || email.headers.attachments.length === 0)) {
        return false
      }
      
      // Has links filter - simplified for now
      if (searchFilters.hasLinks) {
        // Skip this filter for now as content is not available
        return true
      }
      
      return true
    })
    
    // Sort emails
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (searchFilters.sortBy) {
        case 'date':
          // Use a fallback for date sorting
          aValue = a.uid
          bValue = b.uid
          break
        case 'score':
          aValue = a.final.score
          bValue = b.final.score
          break
        case 'subject':
          aValue = a.subject.toLowerCase()
          bValue = b.subject.toLowerCase()
          break
        case 'sender':
          aValue = a.from_addr.toLowerCase()
          bValue = b.from_addr.toLowerCase()
          break
        default:
          return 0
      }
      
      if (searchFilters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    return filtered
  }, [data?.results, searchFilters])

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

  // Load statistics when emails change
  useEffect(() => {
    const loadStats = async () => {
      if (data?.results) {
        setStatsLoading(true)
        try {
          const emailStats = await statsService.getStatsFromEmails(data.results)
          setStats(emailStats)
        } catch (error) {
          console.error('Error loading stats:', error)
        } finally {
          setStatsLoading(false)
        }
      }
    }

    loadStats()
  }, [data?.results])

  // Load health data
  useEffect(() => {
    const loadHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/health')
        if (response.ok) {
          const health = await response.json()
          setHealthData(health)
        }
      } catch (error) {
        console.error('Error loading health data:', error)
      }
    }

    loadHealth()
    const interval = setInterval(loadHealth, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

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
      <ApiStatus healthData={healthData} />
      <RealtimeStatus />
      <div className="dashboard-header">
        <h2>Email Dashboard</h2>
        <button onClick={refetch}>Refresh</button>
      </div>
      
      {stats && <DashboardStats stats={stats} isLoading={statsLoading} />}
      
      <EmailSearch 
        onFiltersChange={setSearchFilters}
        totalEmails={data?.results?.length || 0}
        filteredCount={filteredEmails.length}
      />
      
      <div className="email-list">
        {filteredEmails.length === 0 ? (
          <div className="no-results">
            <p>Keine E-Mails gefunden, die den aktuellen Filtern entsprechen.</p>
            <button onClick={() => setSearchFilters({
              query: '',
              riskLevel: 'all',
              dateRange: 'all',
              sortBy: 'date',
              sortOrder: 'desc',
              hasAttachments: false,
              hasLinks: false
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