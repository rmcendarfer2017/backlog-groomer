import { NextRequest, NextResponse } from 'next/server'
import { validateCredentials } from '@/lib/jira'
import type { JiraCredentials } from '@/lib/types'

export async function POST(req: NextRequest) {
  let body: Partial<JiraCredentials>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { baseUrl, email, apiToken, projectKey } = body
  if (!baseUrl || !email || !apiToken || !projectKey) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
  }

  const result = await validateCredentials({ baseUrl, email, apiToken, projectKey })
  return NextResponse.json(result, { status: result.ok ? 200 : 401 })
}
