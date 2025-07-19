import React, { useEffect } from 'react'
import { useEmailAnalysis } from '../hooks/useApi'
import { EmailAnalysis } from '../types/api'
import './Dashboard.css'

const Dashboard: React.FC = () => {
  const { data, loading, error, refetch } = useEmailAnalysis(10)



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
      <div className="dashboard-header">
        <h2>Email Dashboard</h2>
        <button onClick={refetch}>Refresh</button>
      </div>
      
      <div className="email-list">
        {data.results.map((email: EmailAnalysis) => (
            <div key={email.uid} className="email-item">
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
                    {truncateText(email.analysis.begründung)}
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
        ))}
      </div>
    </div>
  )
}

export default Dashboard 