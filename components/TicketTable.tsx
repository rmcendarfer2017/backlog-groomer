'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Ticket, TicketScore, Flag, FlagSeverity } from '@/lib/types'

interface Props {
  tickets: Ticket[]
  jiraBaseUrl: string
  scores: Map<string, TicketScore>
  flags: Record<string, Flag[]>
}

type SortKey = 'composite' | 'quality' | 'freshness' | 'themeAlignment' | 'key'
type SortDir = 'desc' | 'asc'

function daysAgo(dateStr: string): number {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

function scoreColor(n: number): string {
  if (n >= 70) return 'text-green-700 bg-green-50'
  if (n >= 45) return 'text-amber-700 bg-amber-50'
  return 'text-red-700 bg-red-50'
}

const SEVERITY_STYLES: Record<FlagSeverity, string> = {
  light: 'bg-sky-50 text-sky-700 border-sky-200',
  moderate: 'bg-orange-50 text-orange-700 border-orange-200',
  significant: 'bg-red-50 text-red-700 border-red-200',
}

const FLAG_LABELS: Record<string, string> = {
  compliance: 'Compliance',
  security: 'Security',
  legal: 'Legal',
  partner_dependency: 'Partner dep.',
  multi_team: 'Multi-team',
}

function FlagBadge({ flag }: { flag: Flag }) {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
  return (
    <>
      <span
        onMouseEnter={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setAnchor({ x: r.left + r.width / 2, y: r.top })
        }}
        onMouseLeave={() => setAnchor(null)}
        className={`inline-flex items-center px-1.5 py-0.5 rounded border text-xs font-medium cursor-help ${SEVERITY_STYLES[flag.severity]}`}
      >
        {FLAG_LABELS[flag.type] ?? flag.type}
      </span>
      {anchor && createPortal(
        <div
          className="pointer-events-none fixed z-50 w-56 rounded-lg bg-gray-900 px-3 py-2 text-xs text-gray-100 leading-relaxed shadow-xl"
          style={{ left: anchor.x, top: anchor.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          <span className="font-semibold capitalize">{flag.severity} overhead</span> — {flag.reason}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>,
        document.body,
      )}
    </>
  )
}

function InfoTooltip({ text }: { text: string }) {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
  return (
    <>
      <span
        onMouseEnter={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setAnchor({ x: r.left + r.width / 2, y: r.top })
        }}
        onMouseLeave={() => setAnchor(null)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold cursor-help leading-none select-none"
      >
        i
      </span>
      {anchor && createPortal(
        <div
          className="pointer-events-none fixed z-50 w-64 rounded-lg bg-gray-900 px-3 py-2 text-xs text-gray-100 leading-relaxed shadow-xl"
          style={{ left: anchor.x, top: anchor.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>,
        document.body,
      )}
    </>
  )
}

function ScorePill({ value, title }: { value: number; title: string }) {
  return (
    <span title={title} className={`inline-flex items-center justify-center w-9 h-6 rounded text-xs font-semibold ${scoreColor(value)}`}>
      {value}
    </span>
  )
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-6 text-right text-gray-200 tabular-nums">{value}</span>
    </div>
  )
}

function CompositeScorePill({ score }: { score: TicketScore }) {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
  return (
    <>
      <span
        onMouseEnter={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setAnchor({ x: r.left + r.width / 2, y: r.top })
        }}
        onMouseLeave={() => setAnchor(null)}
        className={`inline-flex items-center justify-center w-9 h-6 rounded text-xs font-semibold cursor-default ${scoreColor(score.composite)}`}
      >
        {score.composite}
      </span>
      {anchor && createPortal(
        <div
          className="pointer-events-none fixed z-50 w-52 rounded-lg bg-gray-900 px-3 py-3 shadow-xl"
          style={{ left: anchor.x, top: anchor.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          <p className="text-xs font-semibold text-white mb-2">Score breakdown</p>
          <div className="space-y-1.5 text-xs text-gray-400">
            <div>
              <div className="flex justify-between mb-0.5"><span>Quality</span><span className="text-gray-300">×35%</span></div>
              <MiniBar value={score.quality} color="bg-indigo-400" />
            </div>
            <div>
              <div className="flex justify-between mb-0.5"><span>Freshness</span><span className="text-gray-300">×25%</span></div>
              <MiniBar value={score.freshness} color="bg-teal-400" />
            </div>
            <div>
              <div className="flex justify-between mb-0.5"><span>Theme alignment</span><span className="text-gray-300">×30%</span></div>
              <MiniBar value={score.themeAlignment} color="bg-violet-400" />
            </div>
            <div>
              <div className="flex justify-between mb-0.5"><span>Uniqueness</span><span className="text-gray-300">×10%</span></div>
              <MiniBar value={100 - score.similarity} color="bg-amber-400" />
            </div>
          </div>
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>,
        document.body,
      )}
    </>
  )
}

export function TicketTable({ tickets, jiraBaseUrl, scores, flags }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('composite')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterSeverity, setFilterSeverity] = useState<FlagSeverity | 'all'>('all')

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No tickets loaded. Configure your Jira credentials and click &ldquo;Fetch Backlog&rdquo;.</p>
      </div>
    )
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const hasScores = scores.size > 0
  const hasFlags = Object.keys(flags).length > 0
  const flaggedCount = Object.keys(flags).length

  const filtered = filterSeverity === 'all'
    ? tickets
    : tickets.filter((t) => (flags[t.key] ?? []).some((f) => f.severity === filterSeverity))

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'key') {
      return sortDir === 'asc'
        ? a.key.localeCompare(b.key)
        : b.key.localeCompare(a.key)
    }
    const sa = scores.get(a.key)
    const sb = scores.get(b.key)
    const av = sa ? sa[sortKey] : -1
    const bv = sb ? sb[sortKey] : -1
    return sortDir === 'desc' ? bv - av : av - bv
  })

  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k
    return (
      <th
        className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap"
        onClick={() => handleSort(k)}
      >
        {label}
        <span className="ml-1 text-gray-400">{active ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
      </th>
    )
  }

  return (
    <div>
      {hasFlags && (
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-medium text-gray-500">Filter by flag:</span>
          {(['all', 'light', 'moderate', 'significant'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                filterSeverity === s
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {s === 'all' ? `All (${tickets.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${tickets.filter((t) => (flags[t.key] ?? []).some((f) => f.severity === s)).length})`}
            </button>
          ))}
          <span className="text-xs text-gray-400 ml-1">{flaggedCount} ticket{flaggedCount !== 1 ? 's' : ''} flagged</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader label="Key" k="key" />
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Summary</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-32">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-16">Age</th>
              {(hasScores || hasFlags) && (
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Flags</th>
              )}
              {hasScores && (
                <>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap" onClick={() => handleSort('composite')}>
                    <span className="inline-flex items-center gap-1">
                      Score {sortKey === 'composite' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
                      <InfoTooltip text="Weighted priority signal: Quality (35%) + Freshness (25%) + Theme alignment (30%) + Uniqueness (10%). Higher = higher priority. Complexity is intentionally excluded — it is a filter, not a score." />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap" onClick={() => handleSort('quality')}>
                    <span className="inline-flex items-center gap-1">
                      Quality {sortKey === 'quality' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
                      <InfoTooltip text="How well-written and evidenced the ticket is. Rewards specificity, cited data or logs, and testable acceptance criteria. A dry technical ticket with a 3% error rate outscores a vague one marked 'urgent'. Prose quality is not measured." />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap" onClick={() => handleSort('freshness')}>
                    <span className="inline-flex items-center gap-1">
                      Fresh {sortKey === 'freshness' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
                      <InfoTooltip text="Recency of the last update, decayed over time. 100 = updated in the last 2 weeks. Near 0 = untouched for 6+ months. A stale ticket is not necessarily low priority — but it is a signal worth reviewing." />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap" onClick={() => handleSort('themeAlignment')}>
                    <span className="inline-flex items-center gap-1">
                      Theme {sortKey === 'themeAlignment' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
                      <InfoTooltip text="How closely this ticket aligns to your active strategic themes (configured in Settings). 100 = directly advances a theme. 0 = no connection, or no themes configured. Themes must be time-bound — expired themes are excluded." />
                    </span>
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sorted.map((ticket) => {
              const days = daysAgo(ticket.updated)
              const score = scores.get(ticket.key)
              const ticketFlags = flags[ticket.key] ?? []
              return (
                <tr key={ticket.key} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <a
                      href={jiraBaseUrl ? `${jiraBaseUrl}/browse/${ticket.key}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:underline"
                    >
                      {ticket.key}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-gray-800 max-w-sm">
                    <span className="line-clamp-2">{ticket.summary}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                      {ticket.status}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 font-medium text-xs ${days > 180 ? 'text-red-600' : days > 90 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {days}d
                  </td>
                  {(hasScores || hasFlags) && (
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {ticketFlags.map((flag, i) => (
                          <FlagBadge key={i} flag={flag} />
                        ))}
                      </div>
                    </td>
                  )}
                  {hasScores && score && (
                    <>
                      <td className="px-4 py-2.5"><CompositeScorePill score={score} /></td>
                      <td className="px-4 py-2.5"><ScorePill value={score.quality} title="Quality" /></td>
                      <td className="px-4 py-2.5"><ScorePill value={score.freshness} title="Freshness" /></td>
                      <td className="px-4 py-2.5"><ScorePill value={score.themeAlignment} title="Theme alignment" /></td>
                    </>
                  )}
                  {hasScores && !score && <td className="px-4 py-2.5 text-gray-300 text-xs" colSpan={4}>—</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 border-t flex items-center justify-between">
          <span>{sorted.length}{filterSeverity !== 'all' ? ` of ${tickets.length}` : ''} tickets</span>
          {hasScores && (
            <span className="inline-flex items-center gap-1 text-gray-400">
              Q=quality · F=freshness · T=theme · S=similarity
              <InfoTooltip text="S = Similarity: how much this ticket overlaps with others in the backlog. High similarity lowers the composite score — likely a duplicate or near-duplicate." />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
