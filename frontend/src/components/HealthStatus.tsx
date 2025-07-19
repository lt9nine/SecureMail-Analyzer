import React from 'react'
import { useHealthCheck } from '../hooks/useApi'

const HealthStatus: React.FC = () => {
  const { data, loading, error } = useHealthCheck()

  if (loading) {
    return <div className="health-status loading">Checking backend status...</div>
  }

  if (error) {
    return (
      <div className="health-status error">
        ⚠️ Backend connection failed: {error}
      </div>
    )
  }

  if (!data) {
    return <div className="health-status error">No health data received</div>
  }

  const allServicesOk = Object.values(data.services).every(status => status === 'ok')

  return (
    <div className={`health-status ${allServicesOk ? 'ok' : 'warning'}`}>
      {allServicesOk ? '✅' : '⚠️'} Backend Status: {data.status}
      <div className="services">
        {Object.entries(data.services).map(([service, status]) => (
          <span key={service} className={`service ${status}`}>
            {service}: {status}
          </span>
        ))}
      </div>
    </div>
  )
}

export default HealthStatus 