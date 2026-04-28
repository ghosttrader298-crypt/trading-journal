'use client'
import { useState, useEffect, useCallback } from 'react'
import { Trade } from '@/types'

interface UseTradesOptions {
  account_id?: string
  status?: string
  market_type?: string
  direction?: string
  limit?: number
  import_session_id?: string
}

export function useTrades(options: UseTradesOptions = {}) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrades = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (options.account_id) params.set('account_id', options.account_id)
      if (options.status) params.set('status', options.status)
      if (options.market_type) params.set('market_type', options.market_type)
      if (options.direction) params.set('direction', options.direction)
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.import_session_id) params.set('import_session_id', options.import_session_id)

      const res = await fetch(`/api/trades?${params}`)
      if (!res.ok) throw new Error('Failed to fetch trades')
      const result = await res.json()
      setTrades(result.data || [])
      setCount(result.count || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [
    options.account_id,
    options.status,
    options.market_type,
    options.direction,
    options.limit,
    options.import_session_id,
  ])

  useEffect(() => { fetchTrades() }, [fetchTrades])

  const createTrade = async (data: Partial<Trade>) => {
    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (res.ok) { await fetchTrades(); return { data: result.data } }
    return { error: result.error }
  }

  const updateTrade = async (id: string, data: Partial<Trade>) => {
    const res = await fetch(`/api/trades/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (res.ok) { await fetchTrades(); return { data: result.data } }
    return { error: result.error }
  }

  const deleteTrade = async (id: string) => {
    const res = await fetch(`/api/trades/${id}`, { method: 'DELETE' })
    if (res.ok) { await fetchTrades(); return { success: true } }
    return { error: 'Failed to delete' }
  }

  return {
    trades,
    count,
    loading,
    error,
    refetch: fetchTrades,
    createTrade,
    updateTrade,
    deleteTrade,
  }
}