export type UserRole = 'USER' | 'SUPER_ADMIN' | 'VIEW_ONLY_ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED'
export type AccountType = 'DEMO' | 'LIVE' | 'FUNDED' | 'PROP'
export type MarketType = 'FOREX' | 'CRYPTO' | 'STOCKS' | 'FUTURES' | 'OPTIONS'
export type TradeDirection = 'BUY' | 'SELL'
export type TradeStatus = 'OPEN' | 'CLOSED' | 'CANCELLED'
export type TradeSession = 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'OVERLAP'

export interface User {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  display_name: string | null
  avatar_url: string | null
  timezone: string
  preferred_currency: string
  default_broker: string | null
  risk_tolerance: number
  notification_preferences: Record<string, any>
  created_at: string
  updated_at: string
  last_login_at: string | null
}

export interface SafeUser {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  display_name: string | null
  avatar_url: string | null
  timezone: string
  preferred_currency: string
  default_broker: string | null
  risk_tolerance: number
  created_at: string
  last_login_at: string | null
}

export interface TradingAccount {
  id: string
  user_id: string
  name: string
  account_type: AccountType
  broker: string | null
  currency: string
  initial_balance: number
  current_balance: number
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Trade {
  id: string
  user_id: string
  account_id: string
  symbol: string
  market_type: MarketType
  direction: TradeDirection
  status: TradeStatus
  position_size: number | null
  leverage: number
  account_size: number | null
  risk_percent: number | null
  entry_price: number | null
  stop_loss: number | null
  take_profit: number | null
  exit_price: number | null
  pnl_amount: number | null
  pnl_percent: number | null
  fees: number
  risk_reward: number | null
  opened_at: string | null
  closed_at: string | null
  strategy_name: string | null
  setup_type: string | null
  timeframe: string | null
  session: TradeSession | null
  reason_for_entry: string | null
  reason_for_exit: string | null
  confirmation_checklist: string[]
  confidence_before: number | null
  fear_score: number | null
  greed_score: number | null
  discipline_score: number | null
  emotional_state: string | null
  confidence_after: number | null
  is_revenge_trade: boolean
  is_fomo_trade: boolean
  followed_rules: string[]
  broken_rules: string[]
  lessons_learned: string | null
  screenshot_before: string | null
  screenshot_after: string | null
  created_at: string
  updated_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  account_id: string | null
  date: string
  market_conditions: string | null
  plan: string | null
  what_went_well: string | null
  mistakes: string | null
  lessons: string | null
  mood_before: number | null
  mood_after: number | null
  screenshots: string[]
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  account_id: string | null
  goal_type: string
  title: string
  target_value: number | null
  current_value: number
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface AnalyticsData {
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_pnl: number
  avg_pnl: number
  best_trade: number
  worst_trade: number
  profit_factor: number
  avg_risk_reward: number
  expectancy: number
  max_drawdown: number
  avg_discipline_score: number
  revenge_trades: number
  fomo_trades: number
  daily_pnl: { date: string; pnl: number }[]
  equity_curve: { date: string; equity: number }[]
  pnl_by_session: Record<string, number>
  pnl_by_weekday: Record<string, number>
  pnl_by_setup: Record<string, number>
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface JWTPayload {
  sub: string
  email: string
  role: UserRole
  jti: string
  iat: number
  exp: number
}