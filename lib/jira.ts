import type { JiraCredentials, Ticket } from './types'

function authHeader(credentials: JiraCredentials): string {
  const token = Buffer.from(`${credentials.email}:${credentials.apiToken}`).toString('base64')
  return `Basic ${token}`
}

export async function validateCredentials(credentials: JiraCredentials): Promise<{ ok: boolean; projectCount: number; error?: string }> {
  try {
    const res = await fetch(`${credentials.baseUrl}/rest/api/3/project/search?maxResults=1`, {
      headers: {
        Authorization: authHeader(credentials),
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      const body = await res.text()
      return { ok: false, projectCount: 0, error: `Jira returned ${res.status}: ${body.slice(0, 200)}` }
    }
    const data = await res.json()
    return { ok: true, projectCount: data.total ?? 0 }
  } catch (err) {
    return { ok: false, projectCount: 0, error: String(err) }
  }
}

interface JiraIssueFields {
  summary: string
  description?: { content?: Array<{ content?: Array<{ text?: string }> }> } | null
  status?: { name?: string }
  priority?: { name?: string }
  created?: string
  updated?: string
  labels?: string[]
  assignee?: { displayName?: string } | null
  reporter?: { displayName?: string } | null
  issuetype?: { name?: string }
}

function extractDescription(fields: JiraIssueFields): string {
  if (!fields.description) return ''
  const content = fields.description?.content ?? []
  return content
    .flatMap((block) => block.content ?? [])
    .map((inline) => inline.text ?? '')
    .join(' ')
    .trim()
}

function transformIssue(issue: { id: string; key: string; fields: JiraIssueFields }, baseUrl: string): Ticket {
  const f = issue.fields
  return {
    id: issue.id,
    key: issue.key,
    summary: f.summary ?? '',
    description: extractDescription(f),
    status: f.status?.name ?? 'Unknown',
    priority: f.priority?.name ?? 'None',
    created: f.created ?? '',
    updated: f.updated ?? '',
    labels: f.labels ?? [],
    assignee: f.assignee?.displayName ?? null,
    reporter: f.reporter?.displayName ?? null,
    issueType: f.issuetype?.name ?? 'Story',
    jiraUrl: `${baseUrl}/browse/${issue.key}`,
  }
}

export async function fetchBacklog(
  credentials: JiraCredentials,
  jql?: string,
  maxResults = 100,
): Promise<Ticket[]> {
  const defaultJql = `project = "${credentials.projectKey}" AND statusCategory != Done ORDER BY created DESC`
  const query = jql ?? defaultJql
  const encoded = encodeURIComponent(query)
  const fields = 'summary,description,status,priority,created,updated,labels,assignee,reporter,issuetype'

  let startAt = 0
  const tickets: Ticket[] = []

  while (tickets.length < maxResults) {
    const batch = Math.min(50, maxResults - tickets.length)
    const url = `${credentials.baseUrl}/rest/api/3/search/jql?jql=${encoded}&startAt=${startAt}&maxResults=${batch}&fields=${fields}`
    const res = await fetch(url, {
      headers: {
        Authorization: authHeader(credentials),
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Jira search failed (${res.status}): ${body.slice(0, 300)}`)
    }
    const data = await res.json()
    const issues = data.issues ?? []
    tickets.push(...issues.map((i: { id: string; key: string; fields: JiraIssueFields }) => transformIssue(i, credentials.baseUrl)))
    if (tickets.length >= data.total || issues.length === 0) break
    startAt += issues.length
  }

  const seen = new Set<string>()
  return tickets.filter((t) => {
    if (seen.has(t.key)) return false
    seen.add(t.key)
    return true
  })
}
