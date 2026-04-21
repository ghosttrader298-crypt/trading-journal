'use client'
import { useState, useEffect, useCallback } from 'react'
import { JournalEntry } from '@/types'

export function useJournal(account_id?: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (account_id) params.set('account_id', account_id)
      const res = await fetch(`/api/journal?${params}`)
      if (!res.ok) throw new Error('Failed to fetch journal')
      const { data } = await res.json()
      setEntries(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [account_id])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const saveEntry = async (data: Partial<JournalEntry>) => {
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (res.ok) { await fetchEntries(); return { data: result.data } }
    return { error: result.error }
  }

  const deleteEntry = async (id: string) => {
    const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' })
    if (res.ok) { await fetchEntries(); return { success: true } }
    return { error: 'Failed to delete' }
  }

  return { entries, loading, error, refetch: fetchEntries, saveEntry, deleteEntry }
}