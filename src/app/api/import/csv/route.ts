import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

function detectBrokerFormat(headers: string[]): string {
  const h = headers.map(h => h.toLowerCase().trim())
  if (h.includes('ticket') && h.includes('type') && h.includes('lots')) return 'MT4'
  if (h.includes('position') && h.includes('symbol') && h.includes('profit')) return 'MT5'
  if (h.includes('trade id') || h.includes('tradeid')) return 'CTRADER'
  return 'GENERIC'
}

function parseCSVLine(line: string): string[] {
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

function detectMarket(sym: string): string {
  const s = sym.toUpperCase()
  if (/BTC|ETH|XRP|ADA|SOL|DOGE|LTC|BNB/.test(s)) return 'CRYPTO'
  if (/US30|SPX|NAS|DAX|FTSE|GER|JP225|XAUUSD|XAGUSD|OIL|WTI/.test(s)) return 'FUTURES'
  if (/AAPL|TSLA|AMZN|GOOGL|MSFT|META|NFLX/.test(s)) return 'STOCKS'
  return 'FOREX'
}

function mapRow(
  headers: string[],
  row: string[],
  accountId: string,
  userId: string,
  sessionId: string
) {
  const get = (keys: string[]) => {
    for (const key of keys) {
      const idx = headers.findIndex(h => h.toLowerCase().trim() === key.toLowerCase())
      if (idx !== -1 && row[idx] !== undefined && row[idx] !== '') return row[idx].trim()
    }
    return null
  }

  const symbol = get(['symbol', 'instrument', 'pair', 'currency pair', 'item']) || ''
  if (!symbol) return null

  const typeRaw = get(['type', 'direction', 'side', 'action', 'order type']) || ''
  const direction = typeRaw.toLowerCase().includes('buy') ? 'BUY' : 'SELL'

  const pnlRaw = get(['profit', 'pnl', 'p&l', 'net profit', 'gain/loss', 'realized pl', 'closed p&l'])
  const pnl_amount = pnlRaw ? parseFloat(pnlRaw.replace(/[^-0-9.]/g, '')) : null

  const entryRaw = get(['open price', 'entry price', 'entry', 'open', 'price open'])
  const exitRaw = get(['close price', 'exit price', 'exit', 'close', 'price close'])
  const slRaw = get(['sl', 'stop loss', 's/l', 'stoploss'])
  const tpRaw = get(['tp', 'take profit', 't/p', 'takeprofit'])
  const lotsRaw = get(['lots', 'lot size', 'volume', 'size', 'quantity'])
  const feesRaw = get(['commission', 'swap', 'fees', 'fee'])
  const openTimeRaw = get(['open time', 'opentime', 'entry time', 'time', 'open date'])
  const closeTimeRaw = get(['close time', 'closetime', 'exit time', 'closed', 'close date'])
  const brokerIdRaw = get(['ticket', 'position', 'trade id', 'tradeid', 'order', 'id'])
  const commentRaw = get(['comment', 'notes', 'strategy', 'label'])

  const parseNum = (v: string | null) => v ? parseFloat(v.replace(/[^-0-9.]/g, '')) : null
  const parseDate = (v: string | null) => {
    if (!v) return null
    try { return new Date(v).toISOString() } catch { return null }
  }

  return {
    user_id: userId,
    account_id: accountId,
    import_session_id: sessionId,
    symbol: symbol.toUpperCase(),
    market_type: detectMarket(symbol),
    direction,
    status: 'CLOSED',
    entry_price: parseNum(entryRaw),
    exit_price: parseNum(exitRaw),
    stop_loss: parseNum(slRaw),
    take_profit: parseNum(tpRaw),
    pnl_amount: isNaN(pnl_amount!) ? null : pnl_amount,
    position_size: parseNum(lotsRaw),
    fees: parseNum(feesRaw) || 0,
    opened_at: parseDate(openTimeRaw) || new Date().toISOString(),
    closed_at: parseDate(closeTimeRaw) || new Date().toISOString(),
    broker_trade_id: brokerIdRaw || null,
    strategy_name: commentRaw || null,
    imported_at: new Date().toISOString(),
  }
}

export const POST = requireUser(async (req, _ctx, user: JWTPayload) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const account_id = formData.get('account_id') as string
    const session_name = formData.get('session_name') as string || file?.name?.replace('.csv', '') || 'Import'
    const broker_name = formData.get('broker_name') as string || ''
    const description = formData.get('description') as string || ''

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

    // Create import session FIRST to get the session ID
    const { data: importLog, error: logError } = await supabaseAdmin
      .from('import_logs')
      .insert({
        user_id: user.sub,
        account_id,
        file_name: file.name,
        session_name,
        broker_name,
        description,
        total_rows: 0,
        imported_rows: 0,
        duplicate_rows: 0,
        error_rows: 0,
        status: 'PROCESSING',
      })
      .select()
      .single()

    if (logError || !importLog) {
      return NextResponse.json({ error: 'Failed to create import session' }, { status: 500 })
    }

    const sessionId = importLog.id

    // Parse CSV
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())

    if (lines.length < 2) {
      await supabaseAdmin.from('import_logs').update({ status: 'FAILED' }).eq('id', sessionId)
      return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 })
    }

    const headers = parseCSVLine(lines[0])
    const format = detectBrokerFormat(headers)

    // Get existing broker IDs to prevent duplicates within this account
    const { data: existingTrades } = await supabaseAdmin
      .from('trades')
      .select('broker_trade_id')
      .eq('account_id', account_id)
      .not('broker_trade_id', 'is', null)

    const existingIds = new Set((existingTrades || []).map(t => t.broker_trade_id))

    const validRows: any[] = []
    const errors: { row: number; reason: string }[] = []
    let duplicates = 0

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      const row = parseCSVLine(lines[i])
      const mapped = mapRow(headers, row, account_id, user.sub, sessionId)

      if (!mapped) {
        errors.push({ row: i + 1, reason: 'Missing symbol or unparseable row' })
        continue
      }

      if (mapped.broker_trade_id && existingIds.has(mapped.broker_trade_id)) {
        duplicates++
        continue
      }

      validRows.push(mapped)
    }

    // Bulk insert in batches
    let imported = 0
    for (let i = 0; i < validRows.length; i += 100) {
      const batch = validRows.slice(i, i + 100)
      const { error } = await supabaseAdmin.from('trades').insert(batch)
      if (!error) imported += batch.length
    }

    // Update import log with results
    await supabaseAdmin.from('import_logs').update({
      total_rows: lines.length - 1,
      imported_rows: imported,
      duplicate_rows: duplicates,
      error_rows: errors.length,
      errors: errors.slice(0, 20),
      status: 'COMPLETED',
    }).eq('id', sessionId)

    return NextResponse.json({
      data: {
        session_id: sessionId,
        session_name,
        format_detected: format,
        total_rows: lines.length - 1,
        imported,
        duplicates,
        errors: errors.length,
        error_details: errors.slice(0, 5),
      },
      message: `Session "${session_name}" — ${imported} trades imported`,
    })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ error: 'Failed to process CSV file' }, { status: 500 })
  }
})