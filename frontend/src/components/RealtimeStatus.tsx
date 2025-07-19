import React, { useEffect, useState } from 'react'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import './RealtimeStatus.css'

const RealtimeStatus: React.FC = () => {
  const { isConnected, lastUpdate, lastHeartbeat, error } = useRealtimeUpdates()
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  // Zeige Benachrichtigung für neue E-Mails
  useEffect(() => {
    if (lastUpdate) {
      const { latest_email } = lastUpdate
      const riskEmoji = {
        hoch: '🔴',
        mittel: '🟡',
        niedrig: '🟢'
      }[latest_email.risk_level] || '⚪'

      setNotificationMessage(
        `${riskEmoji} Neue E-Mail: "${latest_email.subject}" von ${latest_email.from_addr} (Score: ${latest_email.score})`
      )
      setShowNotification(true)

      // Verstecke Benachrichtigung nach 5 Sekunden
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [lastUpdate])

  const getConnectionStatus = () => {
    if (error) return { status: 'error', text: 'Verbindung fehlgeschlagen', icon: '❌' }
    if (isConnected) return { status: 'connected', text: 'Live-Updates aktiv', icon: '🟢' }
    return { status: 'connecting', text: 'Verbinde...', icon: '🟡' }
  }

  const connectionStatus = getConnectionStatus()

  return (
    <div className="realtime-status">
      {/* Connection Status */}
      <div className={`connection-status ${connectionStatus.status}`}>
        <span className="status-icon">{connectionStatus.icon}</span>
        <span className="status-text">{connectionStatus.text}</span>
        {error && <span className="error-text">({error})</span>}
      </div>

      {/* Heartbeat Indicator */}
      {lastHeartbeat && (
        <div className="heartbeat">
          <span className="heartbeat-dot">💓</span>
          <span className="heartbeat-time">
            {new Date(lastHeartbeat.timestamp * 1000).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* New Email Notification */}
      {showNotification && (
        <div className="email-notification">
          <div className="notification-content">
            <span className="notification-icon">📧</span>
            <span className="notification-message">{notificationMessage}</span>
            <button 
              className="notification-close"
              onClick={() => setShowNotification(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Last Update Info */}
      {lastUpdate && (
        <div className="last-update">
          <span className="update-label">Letztes Update:</span>
          <span className="update-time">
            {new Date(lastUpdate.timestamp * 1000).toLocaleTimeString()}
          </span>
          <span className="update-count">
            ({lastUpdate.email_count} E-Mails)
          </span>
        </div>
      )}
    </div>
  )
}

export default RealtimeStatus 