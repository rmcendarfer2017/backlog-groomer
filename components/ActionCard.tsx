'use client'

import type { HousekeepingAction, HousekeepingActionType } from '@/lib/types'
import { ConfidenceTag } from './ConfidenceTag'

interface Props {
  action: HousekeepingAction
  jiraBaseUrl: string
  onAccept: (id: string) => void
  onDismiss: (id: string) => void
}

const typeConfig: Record<HousekeepingActionType, { label: string; color: string; bg: string }> = {
  merge_candidate: { label: 'Merge Candidate', color: 'text-purple-800', bg: 'bg-purple-100' },
  stale_close: { label: 'Stale — Consider Closing', color: 'text-gray-700', bg: 'bg-gray-100' },
  enrichment_rewrite: { label: 'Needs Enrichment', color: 'text-blue-800', bg: 'bg-blue-100' },
  theme_orphan: { label: 'Theme Orphan', color: 'text-amber-800', bg: 'bg-amber-100' },
}

const statusStyles = {
  pending: '',
  accepted: 'opacity-60 border-green-400',
  dismissed: 'opacity-40 border-gray-300',
}

export function ActionCard({ action, jiraBaseUrl, onAccept, onDismiss }: Props) {
  const cfg = typeConfig[action.type]

  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm transition-opacity ${statusStyles[action.status]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            <ConfidenceTag contextConfidence={action.contextConfidence} />
          </div>

          <p className="text-sm text-gray-800 mb-2">{action.reason}</p>

          <div className="flex flex-wrap gap-1 mb-2">
            {action.ticketIds.map((key) => (
              <a
                key={key}
                href={`${jiraBaseUrl}/browse/${key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono hover:bg-slate-200 transition-colors"
              >
                {key}
              </a>
            ))}
          </div>

          {action.suggestedRewrite && (
            <div className="mt-2 rounded bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">Suggested rewrite</p>
              <p className="text-sm text-blue-900 whitespace-pre-wrap">{action.suggestedRewrite}</p>
            </div>
          )}
        </div>

        {action.status === 'pending' && (
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={() => {
                onAccept(action.id)
                if (action.ticketIds[0]) {
                  window.open(`${jiraBaseUrl}/browse/${action.ticketIds[0]}`, '_blank', 'noopener,noreferrer')
                }
              }}
              className="px-3 py-1.5 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => onDismiss(action.id)}
              className="px-3 py-1.5 text-xs font-medium rounded bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {action.status !== 'pending' && (
          <span className="text-xs text-gray-400 shrink-0 mt-1">
            {action.status === 'accepted' ? '✓ Accepted' : '✕ Dismissed'}
          </span>
        )}
      </div>
    </div>
  )
}
