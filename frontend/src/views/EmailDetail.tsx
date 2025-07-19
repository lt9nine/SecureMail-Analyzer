import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { EmailAnalysis } from '../types/api'
import { apiService } from '../services/api'
import './EmailDetail.css'

const EmailDetail: React.FC = () => {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()
  const [email, setEmail] = useState<EmailAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmail = async () => {
      if (!uid) return
      
      try {
        setLoading(true)
        const response = await apiService.getEmailAnalysis(100) // Get all emails
        const foundEmail = response.results.find((e: EmailAnalysis) => e.uid === uid)
        
        if (foundEmail) {
          setEmail(foundEmail)
        } else {
          setError('E-Mail nicht gefunden')
        }
      } catch (err) {
        setError('Fehler beim Laden der E-Mail')
        console.error('Error fetching email:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEmail()
  }, [uid])

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

  if (loading) {
    return (
      <div className="email-detail">
        <div className="loading">
          <h2>E-Mail wird geladen...</h2>
        </div>
      </div>
    )
  }

  if (error || !email) {
    return (
      <div className="email-detail">
        <div className="error">
          <h2>Fehler</h2>
          <p>{error || 'E-Mail nicht gefunden'}</p>
          <button onClick={() => navigate('/')}>Zurück zum Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="email-detail">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Zurück zum Dashboard
        </button>
        <h1>E-Mail Details</h1>
      </div>

      <div className="email-container">
        {/* Basic Info */}
        <div className="section basic-info">
          <h2>📧 Grundinformationen</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>UID:</label>
              <span>{email.uid}</span>
            </div>
            <div className="info-item">
              <label>Betreff:</label>
              <span className="subject">{email.subject}</span>
            </div>
            <div className="info-item">
              <label>Absender:</label>
              <span>{email.from_addr}</span>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="section risk-assessment">
          <h2>⚠️ Risikobewertung</h2>
          <div className="risk-grid">
            <div className="risk-card">
              <h3>Final Score</h3>
              <div className={`score-display ${getScoreColor(email.final.score)}`}>
                {email.final.score}/100
              </div>
              <div className={`risk-level ${getRiskColor(email.final.risikostufe)}`}>
                {getRiskIcon(email.final.risikostufe)} {email.final.risikostufe.toUpperCase()}
              </div>
            </div>
            
            <div className="risk-card">
              <h3>KI-Analyse</h3>
              <div className={`score-display ${getScoreColor(email.analysis.score)}`}>
                {email.analysis.score}/100
              </div>
              <div className={`risk-level ${getRiskColor(email.analysis.risikostufe)}`}>
                {getRiskIcon(email.analysis.risikostufe)} {email.analysis.risikostufe.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className={`section ai-analysis ${getAIScoreColor(email.analysis.score)}`}>
          <h2>🤖 KI-Analyse</h2>
          <div className="ai-content">
            <div className="ai-bewertung">
              <h3>Bewertung: {email.analysis.bewertung}</h3>
            </div>
            <div className="ai-gruende">
              <h3>Gründe für die Bewertung:</h3>
              <ul>
                {email.analysis.gruende.map((grund, index) => (
                  <li key={index}>{grund}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Header Analysis */}
        <div className="section header-analysis">
          <h2>📋 Header-Analyse</h2>
          <div className="header-grid">
            <div className="header-item">
              <label>SPF:</label>
              <span className={email.headers.spf === 'pass' ? 'status-ok' : 'status-warning'}>
                {email.headers.spf}
              </span>
            </div>
            <div className="header-item">
              <label>DKIM:</label>
              <span className={email.headers.dkim === 'vorhanden' ? 'status-ok' : 'status-warning'}>
                {email.headers.dkim}
              </span>
            </div>
            <div className="header-item">
              <label>DMARC:</label>
              <span className={email.headers.dmarc === 'pass' ? 'status-ok' : 'status-warning'}>
                {email.headers.dmarc}
              </span>
            </div>
            <div className="header-item">
              <label>Domain:</label>
              <span>{email.headers.from_domain}</span>
            </div>
            <div className="header-item">
              <label>Lookalike Check:</label>
              <span className={email.headers.from_lookalike === 'ok' ? 'status-ok' : 'status-warning'}>
                {email.headers.from_lookalike}
              </span>
            </div>
            <div className="header-item">
              <label>Reply-To:</label>
              <span>{email.headers.reply_to}</span>
            </div>
            <div className="header-item">
              <label>Return-Path:</label>
              <span>{email.headers.return_path}</span>
            </div>
            <div className="header-item">
              <label>Reply-Path Warning:</label>
              <span className={email.headers.reply_path_warning === 'ok' ? 'status-ok' : 'status-warning'}>
                {email.headers.reply_path_warning}
              </span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="section links-section">
          <h2>🔗 Links ({email.links.length})</h2>
          {email.links.length > 0 ? (
            <div className="links-list">
              {email.links.map((link, index) => (
                <div key={index} className="link-item">
                  <div className="link-url">{link.url}</div>
                  <div className="link-details">
                    <span>Domain: {link.domain}</span>
                    <span>Punycode: {link.is_punycode ? '⚠️ Ja' : '✅ Nein'}</span>
                    <span>Risk Score: {link.risk_score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-links">Keine Links in dieser E-Mail gefunden.</p>
          )}
        </div>

        {/* Attachments */}
        <div className="section attachments-section">
          <h2>📎 Anhänge</h2>
          <div className="attachments-grid">
            <div className="attachment-item">
              <label>Anhänge gesamt:</label>
              <span>{email.headers.attachments?.length || 0}</span>
            </div>
            <div className="attachment-item">
              <label>Gefährliche Anhänge:</label>
              <span className="status-warning">{email.headers.dangerous_attachments?.length || 0}</span>
            </div>
            <div className="attachment-item">
              <label>Verschlüsselte Anhänge:</label>
              <span>{email.headers.encrypted_attachments?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div className="section recipients-section">
          <h2>👥 Empfänger</h2>
          <div className="recipients-grid">
            <div className="recipient-item">
              <label>To:</label>
              <span>{email.headers.to_count}</span>
            </div>
            <div className="recipient-item">
              <label>CC:</label>
              <span>{email.headers.cc_count}</span>
            </div>
            <div className="recipient-item">
              <label>BCC:</label>
              <span>{email.headers.bcc_count}</span>
            </div>
            <div className="recipient-item">
              <label>Empfänger-Warning:</label>
              <span className={email.headers.recipient_warning === 'ok' ? 'status-ok' : 'status-warning'}>
                {email.headers.recipient_warning}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailDetail 