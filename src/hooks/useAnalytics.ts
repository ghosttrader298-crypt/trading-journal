'use client'
import { useState, useEffect, useCallback } from 'react'
import { AnalyticsData } from '@/types'

export function useAnalytics(account_id?: string, days: number = 30) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ days: days.toString() })
      if (account_id) params.set('account_id', account_id)
      const res = await fetch(`/api/analytics?${params}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const { data } = await res.json()
      setAnalytics(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [account_id, days])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  return { analytics, loading, error, refetch: fetchAnalytics }
}