'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Ticket, HousekeepingAction, Theme, JiraCredentials, TicketScore, Flag } from '@/lib/types'
import { DEMO_TICKETS } from '@/lib/demoData'
import { TicketTable } from '@/components/TicketTable'
import { HousekeepingFeed } from '@/components/HousekeepingFeed'

type Tab = 'backlog' | 'housekeeping'

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

const SCORE_MESSAGES = [
  'Evaluating ticket quality…',
  'Detecting coordination flags…',
  'Measuring theme alignment…',
  'Analyzing similarity clusters…',
  'Computing priority scores…',
]

const ANALYZE_MESSAGES = [
  'Detecting merge candidates…',
  'Checking for stale tickets…',
  'Reviewing enrichment gaps…',
  'Checking theme alignment…',
  'Finalizing suggestions…',
]

function useProgressMessage(active: boolean, messages: string[]): string {
  const [index, setIndex] = useState(0)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!active) { setIndex(0); return }
    ref.current = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length)
    }, 2800)
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [active, messages.length])

  return active ? messages[index] : ''
}

interface StepProps {
  number: number
  label: string
  detail: string
  state: 'done' | 'active' | 'locked'
  action?: React.ReactNode
}

function OnboardingStep({ number, label, detail, state, action }: StepProps) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
      state === 'done' ? 'bg-green-50 border-green-200' :
      state === 'active' ? 'bg-indigo-50 border-indigo-200' :
      'bg-gray-50 border-gray-200 opacity-50'
    }`}>
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
        state === 'done' ? 'bg-green-500 text-white' :
        state === 'active' ? 'bg-indigo-600 text-white' :
        'bg-gray-300 text-gray-500'
      }`}>
        {state === 'done' ? '✓' : number}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${state === 'locked' ? 'text-gray-400' : 'text-gray-800'}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${state === 'locked' ? 'text-gray-400' : 'text-gray-500'}`}>{detail}</p>
        {state === 'active' && action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}

function OnboardingFlow({ hasCredentials, hasTickets, hasScores, hasAnalysis, onLoadDemo }: {
  hasCredentials: boolean
  hasTickets: boolean
  hasScores: boolean
  hasAnalysis: boolean
  onLoadDemo: () => void
}) {
  function stepState(index: number): 'done' | 'active' | 'locked' {
    const states = [hasCredentials, hasTickets, hasScores, hasAnalysis]
    if (states[index]) return 'done'
    const allPrev = states.slice(0, index).every(Boolean)
    return allPrev ? 'active' : 'locked'
  }

  const allDone = hasCredentials && hasTickets && hasScores && hasAnalysis
  if (allDone) return null

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Get started — complete these steps</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OnboardingStep
          number={1} label="Connect Jira" state={stepState(0)}
          detail="Add your Jira URL, email, and API token in Settings."
          action={<a href="/settings" className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700">Go to Settings →</a>}
        />
        <OnboardingStep
          number={2} label="Fetch your backlog" state={stepState(1)}
          detail="Pull tickets from Jira, or load demo data to explore first."
          action={
            <button onClick={onLoadDemo} className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700">
              Load demo data →
            </button>
          }
        />
        <OnboardingStep
          number={3} label="Score tickets" state={stepState(2)}
          detail="Run Layer 1 AI scoring — quality, freshness, theme alignment, and flags."
          action={<p className="text-xs text-indigo-600 font-medium">Click the Score button above ↑</p>}
        />
        <OnboardingStep
          number={4} label="Run housekeeping" state={stepState(3)}
          detail="Detect merge candidates, stale tickets, enrichment gaps, and theme orphans."
          action={<p className="text-xs text-indigo-600 font-medium">Click the Analyze button above ↑</p>}
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('backlog')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [actions, setActions] = useState<HousekeepingAction[]>([])
  const [scores, setScores] = useState<Map<string, TicketScore>>(new Map())
  const [flags, setFlags] = useState<Record<string, Flag[]>>({})
  const [credentials, setCredentials] = useState<JiraCredentials | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [fetching, setFetching] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [scoreError, setScoreError] = useState<string | null>(null)

  const scoreMessage = useProgressMessage(scoring, SCORE_MESSAGES)
  const analyzeMessage = useProgressMessage(analyzing, ANALYZE_MESSAGES)

  useEffect(() => {
    setCredentials(loadFromStorage<JiraCredentials | null>('jira_credentials', null))
    setThemes(loadFromStorage<Theme[]>('active_themes', []))
    setTickets(loadFromStorage<Ticket[]>('cached_tickets', []))
    setActions(loadFromStorage<HousekeepingAction[]>('housekeeping_actions', []))
    const rawScores = loadFromStorage<TicketScore[]>('ticket_scores', [])
    setScores(new Map(rawScores.map((s) => [s.key, s])))
    setFlags(loadFromStorage<Record<string, Flag[]>>('ticket_flags', {}))
  }, [])

  const loadDemo = useCallback(() => {
    setTickets(DEMO_TICKETS)
    saveToStorage('cached_tickets', DEMO_TICKETS)
    setActions([])
    setScores(new Map())
    setFlags({})
    saveToStorage('housekeeping_actions', [])
    saveToStorage('ticket_scores', [])
    saveToStorage('ticket_flags', {})
  }, [])

  const handleFetchBacklog = useCallback(async () => {
    if (!credentials) return
    setFetching(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/jira/backlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Fetch failed')
      setTickets(data.tickets)
      saveToStorage('cached_tickets', data.tickets)
      setActions([])
      setScores(new Map())
      setFlags({})
      saveToStorage('housekeeping_actions', [])
      saveToStorage('ticket_scores', [])
      saveToStorage('ticket_flags', {})
    } catch (err) {
      setFetchError(String(err))
    } finally {
      setFetching(false)
    }
  }, [credentials])

  const handleAnalyze = useCallback(async () => {
    if (tickets.length === 0) return
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickets, themes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed')
      setActions(data.actions)
      saveToStorage('housekeeping_actions', data.actions)
      setTab('housekeeping')
    } catch (err) {
      setAnalyzeError(String(err))
    } finally {
      setAnalyzing(false)
    }
  }, [tickets, themes])

  const handleScore = useCallback(async () => {
    if (tickets.length === 0) return
    setScoring(true)
    setScoreError(null)
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickets, themes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scoring failed')
      const scoreList: TicketScore[] = data.scores
      const flagsData: Record<string, Flag[]> = data.flagsByKey ?? {}
      setScores(new Map(scoreList.map((s) => [s.key, s])))
      setFlags(flagsData)
      saveToStorage('ticket_scores', scoreList)
      saveToStorage('ticket_flags', flagsData)
    } catch (err) {
      setScoreError(String(err))
    } finally {
      setScoring(false)
    }
  }, [tickets, themes])

  const handleAccept = useCallback((id: string) => {
    setActions((prev) => {
      const updated = prev.map((a) => a.id === id ? { ...a, status: 'accepted' as const } : a)
      saveToStorage('housekeeping_actions', updated)
      return updated
    })
  }, [])

  const handleDismiss = useCallback((id: string) => {
    setActions((prev) => {
      const updated = prev.map((a) => a.id === id ? { ...a, status: 'dismissed' as const } : a)
      saveToStorage('housekeeping_actions', updated)
      return updated
    })
  }, [])

  const jiraBaseUrl = credentials?.baseUrl ?? ''
  const hasScores = scores.size > 0
  const hasAnalysis = actions.length > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {credentials ? `${credentials.projectKey} Backlog` : 'Backlog'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadDemo} className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-dashed border-gray-400 text-gray-500 hover:bg-gray-50 transition-colors">
            Load demo data
          </button>
          <button
            onClick={handleFetchBacklog}
            disabled={!credentials || fetching}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {fetching ? 'Fetching…' : 'Fetch Backlog'}
          </button>
          <button
            onClick={handleScore}
            disabled={tickets.length === 0 || scoring}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {scoring ? 'Scoring…' : 'Score'}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={tickets.length === 0 || analyzing}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {analyzing ? 'Analyzing…' : `Analyze${tickets.length > 0 ? ` (${tickets.length})` : ''}`}
          </button>
        </div>
      </div>

      {/* Progress messages */}
      {(scoring || analyzing) && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3">
          <svg className="animate-spin h-4 w-4 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-indigo-700 font-medium">{scoring ? scoreMessage : analyzeMessage}</p>
        </div>
      )}

      {fetchError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <strong>Fetch error:</strong> {fetchError}
        </div>
      )}
      {analyzeError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <strong>Analysis error:</strong> {analyzeError}
        </div>
      )}
      {scoreError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <strong>Scoring error:</strong> {scoreError}
        </div>
      )}

      <OnboardingFlow
        hasCredentials={!!credentials}
        hasTickets={tickets.length > 0}
        hasScores={hasScores}
        hasAnalysis={hasAnalysis}
        onLoadDemo={loadDemo}
      />

      <div className="flex border-b border-gray-200 mb-6">
        {(['backlog', 'housekeeping'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'backlog'
              ? `Backlog${tickets.length > 0 ? ` (${tickets.length})` : ''}`
              : `Housekeeping${actions.length > 0 ? ` (${actions.filter((a) => a.status === 'pending').length} pending)` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'backlog' && (
        <TicketTable tickets={tickets} jiraBaseUrl={jiraBaseUrl} scores={scores} flags={flags} />
      )}
      {tab === 'housekeeping' && (
        <HousekeepingFeed
          actions={actions}
          jiraBaseUrl={jiraBaseUrl}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  )
}
