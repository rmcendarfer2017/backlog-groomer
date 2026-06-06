'use client'

import { useState } from 'react'
import type { HousekeepingAction, HousekeepingActionType } from '@/lib/types'
import { ActionCard } from './ActionCard'

interface Props {
  actions: HousekeepingAction[]
  jiraBaseUrl: string
  onAccept: (id: string) => void
  onDismiss: (id: string) => void
}

const ORDER: HousekeepingActionType[] = ['merge_candidate', 'stale_close', 'enrichment_rewrite', 'theme_orphan']

const TYPE_CONFIG: Record<HousekeepingActionType, { label: string; color: string; bg: string; icon: string }> = {
  merge_candidate: { label: 'Merge Candidates', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: '⇒' },
  stale_close:     { label: 'Stale Tickets',    color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',   icon: '⌛' },
  enrichment_rewrite: { label: 'Needs Enrichment', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '✎' },
  theme_orphan:    { label: 'Theme Orphans',    color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200', icon: '⊘' },
}

export function HousekeepingFeed({ actions, jiraBaseUrl, onAccept, onDismiss }: Props) {
  const [activeFilter, setActiveFilter] = useState<HousekeepingActionType | null>(null)

  if (actions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg font-medium mb-1">No housekeeping actions yet</p>
        <p className="text-sm">Fetch your backlog and click &ldquo;Analyze&rdquo; to get suggestions.</p>
      </div>
    )
  }

  const pending = actions.filter((a) => a.status === 'pending')
  const accepted = actions.filter((a) => a.status === 'accepted')
  const dismissed = actions.filter((a) => a.status === 'dismissed')

  const countByType = (type: HousekeepingActionType) => actions.filter((a) => a.type === type).length
  const pendingByType = (type: HousekeepingActionType) => actions.filter((a) => a.type === type && a.status === 'pending').length

  const visibleTypes = activeFilter ? [activeFilter] : ORDER

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          {ORDER.map((type) => {
            const total = countByType(type)
            if (total === 0) return null
            const cfg = TYPE_CONFIG[type]
            const pendingCount = pendingByType(type)
            const isActive = activeFilter === type
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(isActive ? null : type)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isActive
                    ? 'ring-2 ring-offset-1 ring-current shadow-sm scale-[1.02]'
                    : activeFilter !== null
                    ? 'opacity-40 hover:opacity-70'
                    : 'hover:shadow-sm hover:scale-[1.02]'
                } ${cfg.bg} ${cfg.color}`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                <span className="font-bold">{total}</span>
                {pendingCount < total && (
                  <span className="opacity-60">({pendingCount})</span>
                )}
              </button>
            )
          })}
          <div className="ml-auto flex items-center gap-4 text-xs text-gray-500 border-l pl-4">
            <span><span className="font-semibold text-gray-700">{pending.length}</span> pending</span>
            {accepted.length > 0 && <span><span className="font-semibold text-green-600">{accepted.length}</span> accepted</span>}
            {dismissed.length > 0 && <span><span className="font-semibold text-gray-400">{dismissed.length}</span> dismissed</span>}
            {activeFilter && (
              <button onClick={() => setActiveFilter(null)} className="text-indigo-600 hover:text-indigo-800 font-medium underline">
                Clear filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action groups */}
      {visibleTypes.map((type) => {
        const group = actions.filter((a) => a.type === type)
        if (group.length === 0) return null
        const cfg = TYPE_CONFIG[type]
        return (
          <section key={type}>
            <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${cfg.color}`}>
              {cfg.label} ({group.length})
            </h3>
            <div className="space-y-3">
              {group.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  jiraBaseUrl={jiraBaseUrl}
                  onAccept={onAccept}
                  onDismiss={onDismiss}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
