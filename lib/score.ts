import Anthropic from '@anthropic-ai/sdk'
import type { Ticket, Theme, TicketScore, Flag, FlagType, FlagSeverity } from './types'

const BATCH_SIZE = 25

function computeFreshness(updatedIso: string): number {
  if (!updatedIso) return 0
  const days = Math.floor((Date.now() - new Date(updatedIso).getTime()) / 86_400_000)
  if (days <= 14) return 100
  if (days <= 30) return 90
  if (days <= 60) return 75
  if (days <= 90) return 55
  if (days <= 180) return 30
  return Math.max(0, 30 - Math.floor((days - 180) / 10))
}

function composite(quality: number, freshness: number, themeAlignment: number, similarity: number, hasThemes: boolean): number {
  if (hasThemes) {
    return Math.round(quality * 0.35 + freshness * 0.25 + themeAlignment * 0.30 + (100 - similarity) * 0.10)
  }
  return Math.round(quality * 0.50 + freshness * 0.35 + (100 - similarity) * 0.15)
}

const SCORING_SYSTEM = `You are a product backlog scoring and flagging assistant. Analyze each ticket and return a JSON array.

For each ticket return:
- key: the ticket key (string, exactly as provided)
- quality: 0-100. Measures specificity, completeness, evidence cited (data/logs/user research), and presence of acceptance criteria. High = specific problem statement with data and testable AC. Low = vague title, no description, no AC.
- themeAlignment: 0-100. Measures semantic fit to the provided strategic themes. 0 if no themes provided. 100 = directly advances a theme.
- similarity: 0-100. Measures how much this ticket overlaps with OTHER tickets in the batch. 100 = near-duplicate. 0 = entirely unique.
- flags: array of coordination overhead flags (may be empty). Each flag has:
  - type: one of "compliance" | "security" | "legal" | "partner_dependency" | "multi_team"
  - severity: one of "light" | "moderate" | "significant"
  - reason: one sentence explaining the overhead

Flag detection rules:
- compliance: mentions GDPR, HIPAA, SOC2, PCI, accessibility (WCAG), data retention, privacy policy, audit trail
- security: auth changes, encryption, permissions model, vulnerability, pen test, secrets, API keys
- legal: contracts, IP, licensing, terms of service, user agreements, NDAs
- partner_dependency: requires action or approval from a named external partner, vendor, or third-party API
- multi_team: explicitly requires coordination with 2+ teams to ship (not just awareness)
- severity "light": awareness only, no approval gate
- severity "moderate": requires review or sign-off from one stakeholder
- severity "significant": hard dependency — cannot ship without external approval or action
- Only flag when there is a clear signal in the ticket text. Do not flag speculatively.
- Flags do NOT affect scores — they are separate execution-context signals.

Scoring rules:
- Be calibrated: most tickets should score 30-70 on quality. Reserve 85+ for exceptionally well-written tickets with data and AC.
- Similarity should only be high (>60) when tickets are genuinely about the same feature or bug.
- Output ONLY the raw JSON array, no markdown, no preamble.`

interface RawFlag {
  type?: string
  severity?: string
  reason?: string
}

interface RawScore {
  key?: string
  quality?: number
  themeAlignment?: number
  similarity?: number
  flags?: RawFlag[]
}

const VALID_FLAG_TYPES: FlagType[] = ['compliance', 'security', 'legal', 'partner_dependency', 'multi_team']
const VALID_SEVERITIES: FlagSeverity[] = ['light', 'moderate', 'significant']

function parseFlags(raw: RawFlag[] | undefined): Flag[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((f): f is RawFlag =>
      typeof f === 'object' && f !== null &&
      VALID_FLAG_TYPES.includes(f.type as FlagType) &&
      VALID_SEVERITIES.includes(f.severity as FlagSeverity),
    )
    .map((f) => ({
      type: f.type as FlagType,
      severity: f.severity as FlagSeverity,
      reason: typeof f.reason === 'string' ? f.reason : '',
    }))
}

export interface ScoreAndFlags {
  scores: TicketScore[]
  flagsByKey: Record<string, Flag[]>
}

export async function scoreBacklog(tickets: Ticket[], themes: Theme[]): Promise<ScoreAndFlags> {
  const client = new Anthropic()
  const activeThemes = themes.filter((t) => t.active)
  const hasThemes = activeThemes.length > 0

  const themesText = hasThemes
    ? `Active strategic themes:\n${activeThemes.map((t) => `- ${t.quarter}: ${t.name} — ${t.description}`).join('\n')}`
    : 'No active themes configured — set themeAlignment to 0 for all tickets.'

  const scoreMap = new Map<string, { quality: number; themeAlignment: number; similarity: number; flags: Flag[] }>()

  for (let i = 0; i < tickets.length; i += BATCH_SIZE) {
    const batch = tickets.slice(i, i + BATCH_SIZE)
    const ticketJson = JSON.stringify(
      batch.map((t) => ({
        key: t.key,
        type: t.issueType,
        summary: t.summary,
        description: t.description.slice(0, 400),
        labels: t.labels,
        priority: t.priority,
      })),
      null, 2,
    )

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: SCORING_SYSTEM,
      messages: [{ role: 'user', content: `${themesText}\n\nTickets:\n${ticketJson}` }],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') continue

    const cleaned = textContent.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
    let parsed: RawScore[]
    try { parsed = JSON.parse(cleaned) } catch { continue }
    if (!Array.isArray(parsed)) continue

    for (const s of parsed) {
      if (typeof s.key === 'string') {
        scoreMap.set(s.key, {
          quality: typeof s.quality === 'number' ? Math.min(100, Math.max(0, s.quality)) : 50,
          themeAlignment: typeof s.themeAlignment === 'number' ? Math.min(100, Math.max(0, s.themeAlignment)) : 0,
          similarity: typeof s.similarity === 'number' ? Math.min(100, Math.max(0, s.similarity)) : 0,
          flags: parseFlags(s.flags),
        })
      }
    }
  }

  const scores: TicketScore[] = tickets.map((t) => {
    const ai = scoreMap.get(t.key) ?? { quality: 50, themeAlignment: 0, similarity: 0, flags: [] }
    const freshness = computeFreshness(t.updated)
    return {
      key: t.key,
      quality: ai.quality,
      freshness,
      themeAlignment: ai.themeAlignment,
      similarity: ai.similarity,
      composite: composite(ai.quality, freshness, ai.themeAlignment, ai.similarity, hasThemes),
    }
  })

  const flagsByKey: Record<string, Flag[]> = {}
  for (const [key, data] of scoreMap.entries()) {
    if (data.flags.length > 0) flagsByKey[key] = data.flags
  }

  return { scores, flagsByKey }
}
