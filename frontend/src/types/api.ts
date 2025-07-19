// API Response Types matching our backend models

export interface HeaderAnalysis {
  spf: string
  dkim: string
  dmarc: string
  from_domain: string
  from_lookalike: string
  reply_to: string
  return_path: string
  reply_path_warning: string
  attachments: any[]
  dangerous_attachments: any[]
  encrypted_attachments: any[]
  to_count: number
  cc_count: number
  bcc_count: number
  recipient_warning: string
  header_anomalies: any[]
  external_images: any[]
  tracking_pixels: any[]
}

export interface LinkAnalysis {
  url: string
  domain: string
  is_punycode: boolean
  risk_score: number
}

export interface AIAnalysis {
  bewertung: string
  risikostufe: string
  score: number
  gruende: string[]
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