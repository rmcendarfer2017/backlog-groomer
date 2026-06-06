'use client'

import type { ContextConfidence } from '@/lib/types'

interface Props {
  contextConfidence: ContextConfidence
}

const styles: Record<ContextConfidence, string> = {
  full: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  low: 'bg-orange-100 text-orange-800',
}

const labels: Record<ContextConfidence, string> = {
  full: 'Full context',
  partial: 'Partial context',
  low: 'Low context confidence',
}

export function ConfidenceTag({ contextConfidence }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[contextConfidence]}`}>
      {contextConfidence === 'low' && <span className="mr-1">⚠</span>}
      {labels[contextConfidence]}
    </span>
  )
}
