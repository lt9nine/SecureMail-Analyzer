// API Response Types matching our backend models

export interface HeaderAnalysis {
  spf_pass: boolean
  dkim_pass: boolean
  dmarc_pass: boolean
  sender_lookalike: boolean
  reply_to_consistent: boolean
  dangerous_attachments: boolean
  header_anomalies: number
  recipient_count: number
  external_images: number
  tracking_pixels: number
  score: number
}

export interface LinkAnalysis {
  url: string
  domain: string
  is_punycode: boolean
  risk_score: number
}

export interface AIAnalysis {
  score: number
  risikostufe: string
  begründung: string
  empfehlung: string
}

export interface FinalScore {
  score: number
  risikostufe: string
  header_score: number
  link_score: number
  ai_score: number
}

export interface EmailAnalysis {
  uid: string
  subject: string
  from_addr: string
  headers: HeaderAnalysis
  links: LinkAnalysis[]
  analysis: AIAnalysis
  final: FinalScore
}

export interface AnalysisResponse {
  results: EmailAnalysis[]
}

export interface ModifySubjectResponse {
  success: boolean
  new_subject?: string
  error?: string
}

export interface HealthResponse {
  status: string
  version: string
  services: Record<string, string>
} 