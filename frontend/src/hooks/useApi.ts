import { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { AnalysisResponse, HealthResponse } from '../types/api'

export function useEmailAnalysis(limit: number = 10) {
  const [data, setData] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching email analysis with limit:', limit)
      const result = await apiService.getEmailAnalysis(limit)
      console.log('Received email analysis:', result)
      setData(result)
    } catch (err) {
      console.error('Error fetching email analysis:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [limit])

  const refetch = () => {
    console.log('Manual refetch triggered')
    fetchData()
  }

  return { data, loading, error, refetch }
}

export function useHealthCheck() {
  const [data, setData] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await apiService.getHealth()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
} 