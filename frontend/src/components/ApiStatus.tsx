import React, { useState, useEffect } from 'react';
import './ApiStatus.css';

interface ApiStatusProps {
  healthData?: {
    status: string;
    services: Record<string, string>;
  };
}

const ApiStatus: React.FC<ApiStatusProps> = ({ healthData }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (healthData && healthData.services) {
      const hasErrors = Object.values(healthData.services).some(status => 
        status !== 'ok' && status !== 'auth_error' && status !== 'forbidden'
      );
      setIsVisible(hasErrors);
    } else {
      setIsVisible(false);
    }
  }, [healthData]);

  if (!isVisible || !healthData) {
    return null;
  }

  const getServiceIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return '✅';
      case 'auth_error':
        return '🔑';
      case 'forbidden':
        return '🚫';
      case 'timeout':
        return '⏰';
      case 'connection_error':
        return '🌐';
      default:
        return '❌';
    }
  };

  const getServiceMessage = (service: string, status: string) => {
    switch (service) {
      case 'openrouter':
        switch (status) {
          case 'auth_error':
            return 'API-Key ist ungültig oder fehlt';
          case 'forbidden':
            return 'API-Zugriff verweigert';
          case 'timeout':
            return 'Verbindung zu OpenRouter timeout';
          case 'connection_error':
            return 'OpenRouter nicht erreichbar';
          default:
            return 'OpenRouter Service-Fehler';
        }
      case 'imap':
        switch (status) {
          case 'error':
            return 'IMAP-Verbindung fehlgeschlagen';
          default:
            return 'IMAP Service-Fehler';
        }
      default:
        return 'Unbekannter Service-Fehler';
    }
  };

  const getServiceHelp = (service: string, status: string) => {
    switch (service) {
      case 'openrouter':
        switch (status) {
          case 'auth_error':
            return 'Überprüfen Sie Ihren OPENROUTER_API_KEY in der .env Datei';
          case 'forbidden':
            return 'Überprüfen Sie die API-Key-Berechtigungen bei OpenRouter';
          case 'timeout':
            return 'Netzwerkverbindung überprüfen';
          case 'connection_error':
            return 'Internetverbindung überprüfen';
          default:
            return 'OpenRouter-Konfiguration überprüfen';
        }
      case 'imap':
        return 'IMAP-Einstellungen in der .env Datei überprüfen';
      default:
        return 'Service-Konfiguration überprüfen';
    }
  };

  const hasErrors = Object.values(healthData.services).some(status => 
    status !== 'ok' && status !== 'auth_error' && status !== 'forbidden'
  );

  if (!hasErrors) {
    return null;
  }

  return (
    <div className="api-status">
      <div className="api-status-header">
        <span className="api-status-icon">⚠️</span>
        <span className="api-status-title">Service-Probleme erkannt</span>
        <button 
          className="api-status-close"
          onClick={() => setIsVisible(false)}
        >
          ×
        </button>
      </div>
      
      <div className="api-status-content">
        {Object.entries(healthData.services).map(([service, status]) => {
          if (status === 'ok' || status === 'auth_error' || status === 'forbidden') return null;
          
          return (
            <div key={service} className="api-status-item">
              <div className="api-status-service">
                <span className="api-status-service-icon">
                  {getServiceIcon(status)}
                </span>
                <span className="api-status-service-name">
                  {service === 'openrouter' ? 'OpenRouter AI' : service.toUpperCase()}
                </span>
                <span className="api-status-service-status">
                  {status === 'auth_error' ? 'Auth Fehler' : 
                   status === 'forbidden' ? 'Verweigert' :
                   status === 'timeout' ? 'Timeout' :
                   status === 'connection_error' ? 'Verbindung' : 'Fehler'}
                </span>
              </div>
              <div className="api-status-message">
                {getServiceMessage(service, status)}
              </div>
              <div className="api-status-help">
                💡 {getServiceHelp(service, status)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApiStatus; 