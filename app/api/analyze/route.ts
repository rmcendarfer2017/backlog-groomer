import { NextRequest, NextResponse } from 'next/server'
import { analyzeBacklog } from '@/lib/analyze'
import type { Ticket, Theme } from '@/lib/types'

export async function POST(req: NextRequest) {
  let body: { tickets: Ticket[]; themes: Theme[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { tickets, themes } = body
  if (!Array.isArray(tickets) || tickets.length === 0) {
    return NextResponse.json({ error: 'No tickets provided' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const actions = await analyzeBacklog(tickets, themes ?? [])
    return NextResponse.json({ actions })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
