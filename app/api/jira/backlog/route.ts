import { NextRequest, NextResponse } from 'next/server'
import { fetchBacklog } from '@/lib/jira'
import type { JiraCredentials } from '@/lib/types'

export async function POST(req: NextRequest) {
  let body: { credentials: JiraCredentials; jql?: string; maxResults?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { credentials, jql, maxResults } = body
  if (!credentials?.baseUrl || !credentials?.email || !credentials?.apiToken || !credentials?.projectKey) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  try {
    const tickets = await fetchBacklog(credentials, jql, maxResults ?? 100)
    return NextResponse.json({ tickets })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
