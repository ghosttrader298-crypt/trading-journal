import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

// Detect broker format from headers
function detectBrokerFormat(headers: string[]): string {
  const h = headers.map(h => h.toLowerCase().trim())
  if (h.includes('ticket') && h.includes('type') && h.includes('lots')) return 'MT4'
  if (h.includes('position') && h.includes('symbol') && h.includes('profit')) return 'MT5'
  if (h.includes('trade id') || h.includes('tradeid')) return 'CTRADER'
  if (h.includes('orderno') || h.includes('order no')) return 'GENERIC'
  return 'GENERIC'
}

// Map broker CSV row to trade fields
function mapRow(headers: string[], row: string[], format: string, accountId: string, userId: string) {
  const get = (keys: string[]) => {
    for (const key of keys) {
      const idx = headers.findIndex(h => h.toLowerCase().trim() === key.toLowerCase())
      if (idx !== -1 && row[idx] !== undefined) return row[idx].trim()
    }
    return null
  }

  const symbol = get(['symbol', 'instrument', 'pair', 'currency pair', 'item']) || ''
  const typeRaw = get(['type', 'direction', 'side', 'action', 'order type', 'trade type']) || ''
  const direction = typeRaw.toLowerCase().includes('buy') ? 'BUY' : 'SELL'

  const pnlRaw = get(['profit', 'pnl', 'p&l', 'net profit', 'gain/loss', 'realized pl', 'realized p&l', 'closed p&l'])
  const pnl_amount = pnlRaw ? parseFloat(pnlRaw.replace(/[^-0-9.]/g, '')) : null

  const entryRaw = get(['open price', 'entry price', 'entry', 'open', 'price open', 'open_price'])
  const exitRaw = get(['close price', 'exit price', 'exit', 'close', 'price close', 'close_price'])
  const slRaw = get(['sl', 'stop loss', 's/l', 'stoploss'])
  const tpRaw = get(['tp', 'take profit', 't/p', 'takeprofit'])
  const lotsRaw = get(['lots', 'lot size', 'volume', 'size', 'quantity', 'qty'])
  const feesRaw = get(['commission', 'swap', 'fees', 'fee', 'charges'])

  const openTimeRaw = get(['open time', 'opentime', 'open_time', 'entry time', 'time', 'created', 'open date'])
  const closeTimeRaw = get(['close time', 'closetime', 'close_time', 'exit time', 'closed', 'close date'])

  const brokerIdRaw = get(['ticket', 'position', 'trade id', 'tradeid', 'order', 'orderno', 'id', 'deal'])

  // Detect market type from symbol
  const detectMarket = (sym: string) => {
    const s = sym.toUpperCase()
    if (/BTC|ETH|XRP|ADA|SOL|DOGE|LTC|BNB|USDT/.test(s)) return 'CRYPTO'
    if (/US30|SPX|NAS|DAX|FTSE|GER|JP225|NIKKEI/.test(s)) return 'FUTURES'
    if (/AAPL|TSLA|AMZN|GOOGL|MSFT|META|NFLX/.test(s)) return 'STOCKS'
    return 'FOREX'
  }

  if (!symbol) return null

  return {
    user_id: userId,
    account_id: accountId,
    symbol: symbol.toUpperCase(),
    market_type: detectMarket(symbol),
    direction,
    status: 'CLOSED',
    entry_price: entryRaw ? parseFloat(entryRaw.replace(/[^-0-9.]/g, '')) : null,
    exit_price: exitRaw ? parseFloat(exitRaw.replace(/[^-0-9.]/g, '')) : null,
    stop_loss: slRaw ? parseFloat(slRaw.replace(/[^-0-9.]/g, '')) : null,
    take_profit: tpRaw ? parseFloat(tpRaw.replace(/[^-0-9.]/g, '')) : null,
    pnl_amount: isNaN(pnl_amount!) ? null : pnl_amount,
    position_size: lotsRaw ? parseFloat(lotsRaw.replace(/[^-0-9.]/g, '')) : null,
    fees: feesRaw ? parseFloat(feesRaw.replace(/[^-0-9.]/g, '')) || 0 : 0,
    opened_at: openTimeRaw ? new Date(openTimeRaw).toISOString() : new Date().toISOString(),
    closed_at: closeTimeRaw ? new Date(closeTimeRaw).toISOString() : new Date().toISOString(),
    broker_trade_id: brokerIdRaw || null,
    imported_at: new Date().toISOString(),
  }
}

export const POST = requireUser(async (req, _ctx, user: JWTPayload) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const account_id = formData.get('account_id') as string

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    if (!account_id) return NextResponse.json({ error: 'Account ID required' }, { status: 400 })

    // Verify account ownership
    const { data: account } = await supabaseAdmin
      .from('trading_accounts')
      .select('id')
      .eq('id', account_id)
      .eq('user_id', user.sub)
      .single()

    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    // Parse CSV
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 })

    // Parse headers — handle quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          inQuotes = !inQuotes
        } else if (line[i] === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += line[i]
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0])
    const format = detectBrokerFormat(headers)

    const validRows: any[] = []
    const errors: { row: number; reason: string }[] = []
    const duplicateIds: string[] = []

    // Get existing broker_trade_ids for this account
    const { data: existingTrades } = await supabaseAdmin
      .from('trades')
      .select('broker_trade_id')
      .eq('account_id', account_id)
      .not('broker_trade_id', 'is', null)

    const existingIds = new Set((existingTrades || []).map(t => t.broker_trade_id))

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue

      const row = parseCSVLine(line)
      const mapped = mapRow(headers, row, format, account_id, user.sub)

      if (!mapped) {
        errors.push({ row: i + 1, reason: 'Missing symbol or could not parse row' })
        continue
      }

      // Check duplicate
      if (mapped.broker_trade_id && existingIds.has(mapped.broker_trade_id)) {
        duplicateIds.push(mapped.broker_trade_id)
        continue
      }

      validRows.push(mapped)
    }

    // Insert valid rows in batches of 50
    let imported = 0
    for (let i = 0; i < validRows.length; i += 50) {
      const batch = validRows.slice(i, i + 50)
      const { error } = await supabaseAdmin.from('trades').insert(batch)
      if (!error) imported += batch.length
    }

    // Log import
    await supabaseAdmin.from('import_logs').insert({
      user_id: user.sub,
      account_id,
      file_name: file.name,
      total_rows: lines.length - 1,
      imported_rows: imported,
      duplicate_rows: duplicateIds.length,
      error_rows: errors.length,
      errors: errors.slice(0, 20),
      status: 'COMPLETED',
    })

    return NextResponse.json({
      data: {
        format_detected: format,
        total_rows: lines.length - 1,
        imported,
        duplicates: duplicateIds.length,
        errors: errors.length,
        error_details: errors.slice(0, 5),
      },
      message: `Successfully imported ${imported} trades`,
    })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ error: 'Failed to process CSV file' }, { status: 500 })
  }
})