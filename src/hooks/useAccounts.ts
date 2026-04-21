'use client'
import { useState, useEffect, useCallback } from 'react'
import { TradingAccount } from '@/types'

export function useAccounts() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([])
  const [activeAccount, setActiveAccountState] = useState<TradingAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/accounts')
      if (!res.ok) throw new Error('Failed to fetch accounts')
      const { data } = await res.json()
      setAccounts(data || [])
      if (data && data.length > 0) {
        const defaultAcc = data.find((a: TradingAccount) => a.is_default) || data[0]
        setActiveAccountState(defaultAcc)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  const switchAccount = (account: TradingAccount) => {
    setActiveAccountState(account)
  }

  const createAccount = async (data: Partial<TradingAccount>) => {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (res.ok) {
      await fetchAccounts()
      return { data: result.data }
    }
    return { error: result.error }
  }

  return { accounts, activeAccount, switchAccount, loading, error, refetch: fetchAccounts, createAccount }
}