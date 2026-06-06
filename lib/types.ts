export interface JiraCredentials {
  baseUrl: string
  email: string
  apiToken: string
  projectKey: string
}

export interface Ticket {
  id: string
  key: string
  summary: string
  description: string
  status: string
  priority: string
  created: string
  updated: string
  labels: string[]
  assignee: string | null
  reporter: string | null
  issueType: string
  jiraUrl: string
}

export interface Theme {
  id: string
  name: string
  description: string
  quarter: string
  active: boolean
}

export type HousekeepingActionType =
  | 'merge_candidate'
  | 'stale_close'
  | 'enrichment_rewrite'
  | 'theme_orphan'

export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type ContextConfidence = 'full' | 'partial' | 'low'
export type ActionStatus = 'pending' | 'accepted' | 'dismissed'

export type FlagType = 'compliance' | 'security' | 'legal' | 'partner_dependency' | 'multi_team'
export type FlagSeverity = 'light' | 'moderate' | 'significant'

export interface Flag {
  type: FlagType
  severity: FlagSeverity
  reason: string
}

export interface TicketScore {
  key: string
  quality: number        // 0-100
  freshness: number      // 0-100
  themeAlignment: number // 0-100
  similarity: number     // 0-100 (higher = more duplicate-like = worse)
  composite: number      // 0-100 weighted final score
}

export interface HousekeepingAction {
  id: string
  type: HousekeepingActionType
  ticketIds: string[]
  reason: string
  suggestedRewrite?: string
  confidence: ConfidenceLevel
  contextConfidence: ContextConfidence
  status: ActionStatus
}
