import { 
  AnalysisResponse, 
  ModifySubjectResponse, 
  HealthResponse 
} from '../types/api'

const API_BASE = '/api'

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${endpoint}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  // Get email analysis
  async getEmailAnalysis(limit: number = 10): Promise<AnalysisResponse> {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime()
    return this.request<AnalysisResponse>(`/analyze?limit=${limit}&t=${timestamp}`)
  }

  // Modify email subject
  async modifySubject(uid: string, risk: 'hoch' | 'mittel' | 'niedrig'): Promise<ModifySubjectResponse> {
    return this.request<ModifySubjectResponse>(`/modify-subject?uid=${uid}&risk=${risk}`, {
      method: 'POST',
    })
  }

  // Get health status
  async getHealth(): Promise<HealthResponse> {
    const timestamp = new Date().getTime()
    return this.request<HealthResponse>(`/health?t=${timestamp}`)
  }

  // Server-Sent Events für Echtzeit-Updates
  createEventSource(): EventSource {
    return new EventSource(`${API_BASE}/events`)
  }
}

// Export singleton instance
export const apiService = new ApiService() 