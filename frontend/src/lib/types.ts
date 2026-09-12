// Os formatos que a API do Atalho devolve (espelham os schemas do backend)

export type LinkStatus = "active" | "inactive" | "expired"

export interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export interface Link {
  id: string
  slug: string
  short_url: string
  target_url: string
  title: string | null
  active: boolean
  status: LinkStatus
  expires_at: string | null
  // Só gente: robô (preview de WhatsApp, crawler) não entra
  total_clicks: number
  created_at: string
  updated_at: string
}

export interface LinkList {
  links: Link[]
  total: number
  current_page: number
  total_pages: number
}

// label null = a informação não veio (sem referrer é acesso direto)
export interface BreakdownItem {
  label: string | null
  clicks: number
}

export interface DailyClicks {
  date: string
  clicks: number
  unique_visitors: number
}

export interface LinkStats {
  link_id: string
  days: number
  time_zone: string
  from: string
  to: string
  totals: {
    clicks: number
    unique_visitors: number
    previous_clicks: number
    previous_unique_visitors: number
    bot_clicks: number
  }
  daily: DailyClicks[]
  referrers: BreakdownItem[]
  devices: BreakdownItem[]
  browsers: BreakdownItem[]
  languages: BreakdownItem[]
}

export interface ApiErrorBody {
  error: string
  message: string
  issues?: { field: string; message: string }[]
}
