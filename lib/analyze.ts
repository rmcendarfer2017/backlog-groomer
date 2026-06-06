import Anthropic from '@anthropic-ai/sdk'
import type { Ticket, Theme, HousekeepingAction, HousekeepingActionType, ConfidenceLevel, ContextConfidence } from './types'

const BATCH_SIZE = 25

const SYSTEM_PROMPT = `You are a product backlog hygiene assistant. Analyze the provided tickets and return a JSON array of housekeeping actions.

Focus ONLY on what you can observe directly from the ticket content and metadata. Never invent business context you cannot see.

Return a JSON array where each item has:
- type: one of "merge_candidate" | "stale_close" | "enrichment_rewrite" | "theme_orphan"
- ticketIds: array of ticket keys affected (primary first)
- reason: one concise sentence explaining why
- suggestedRewrite: (only for enrichment_rewrite) improved title + short description
- confidence: "high" | "medium" | "low" — your confidence this is a real issue
- contextConfidence: "full" | "partial" | "low" — how much observable context you had

Rules:
- merge_candidate: tickets with high semantic overlap in title and description that likely represent the same work
- stale_close: tickets that exceed ~180 days with no update, appear superseded by newer tickets, or are clearly no longer relevant
- enrichment_rewrite: vague titles (<5 meaningful words), missing description, or no acceptance criteria
- theme_orphan: tickets that don't align to any of the provided active themes (only flag if themes are provided)
- Return an empty array if no actions are warranted
- Do not hallucinate ticket keys — only reference keys from the input
- Output ONLY the raw JSON array, no markdown fences, no preamble`

interface RawAction {
  type?: string
  ticketIds?: unknown[]
  reason?: string
  suggestedRewrite?: string
  confidence?: string
  contextConfidence?: string
}

function parseActions(raw: string, idPrefix: string): HousekeepingAction[] {
  const cleaned = raw.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
  let parsed: RawAction[]
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const validTypes: HousekeepingActionType[] = ['merge_candidate', 'stale_close', 'enrichment_rewrite', 'theme_orphan']
  const confidenceLevels: ConfidenceLevel[] = ['high', 'medium', 'low']
  const contextLevels: ContextConfidence[] = ['full', 'partial', 'low']

  return parsed
    .filter((a): a is RawAction => typeof a === 'object' && a !== null)
    .map((a, i): HousekeepingAction | null => {
      const type = a.type as HousekeepingActionType
      if (!validTypes.includes(type)) return null
      return {
        id: `${idPrefix}-${i}`,
        type,
        ticketIds: Array.isArray(a.ticketIds) ? a.ticketIds.map(String) : [],
        reason: typeof a.reason === 'string' ? a.reason : '',
        suggestedRewrite: typeof a.suggestedRewrite === 'string' ? a.suggestedRewrite : undefined,
        confidence: confidenceLevels.includes(a.confidence as ConfidenceLevel) ? (a.confidence as ConfidenceLevel) : 'medium',
        contextConfidence: contextLevels.includes(a.contextConfidence as ContextConfidence) ? (a.contextConfidence as ContextConfidence) : 'partial',
        status: 'pending',
      }
    })
    .filter((a): a is HousekeepingAction => a !== null)
}

export async function analyzeBacklog(tickets: Ticket[], themes: Theme[]): Promise<HousekeepingAction[]> {
  const client = new Anthropic()
  const allActions: HousekeepingAction[] = []

  const activeThemes = themes.filter((t) => t.active)
  const themesText = activeThemes.length > 0
    ? `\nActive strategic themes:\n${activeThemes.map((t) => `- ${t.quarter}: ${t.name} — ${t.description}`).join('\n')}`
    : '\nNo active themes configured — skip theme_orphan checks.'

  for (let i = 0; i < tickets.length; i += BATCH_SIZE) {
    const batch = tickets.slice(i, i + BATCH_SIZE)
    const ticketJson = JSON.stringify(
      batch.map((t) => ({
        key: t.key,
        type: t.issueType,
        summary: t.summary,
        description: t.description.slice(0, 500),
        status: t.status,
        priority: t.priority,
        created: t.created,
        updated: t.updated,
        labels: t.labels,
      })),
      null,
      2,
    )

    const userContent = `Tickets to analyze:${themesText}\n\n${ticketJson}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (textContent && textContent.type === 'text') {
      const batchActions = parseActions(textContent.text, `batch${Math.floor(i / BATCH_SIZE)}`)
      allActions.push(...batchActions)
    }
  }

  // Deduplicate: if the same ticket pair appears in multiple merge_candidate actions, keep the first
  const seen = new Set<string>()
  return allActions.filter((action) => {
    if (action.type !== 'merge_candidate') return true
    const key = [...action.ticketIds].sort().join(',')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
