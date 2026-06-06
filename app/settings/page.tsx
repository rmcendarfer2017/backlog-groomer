'use client'

import { useState, useEffect } from 'react'
import type { JiraCredentials, Theme } from '@/lib/types'

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

const EMPTY_CREDS: JiraCredentials = { baseUrl: '', email: '', apiToken: '', projectKey: '' }

export default function SettingsPage() {
  const [creds, setCreds] = useState<JiraCredentials>(EMPTY_CREDS)
  const [themes, setThemes] = useState<Theme[]>([])
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [saved, setSaved] = useState(false)

  const [newTheme, setNewTheme] = useState({ name: '', description: '', quarter: '' })

  useEffect(() => {
    setCreds(loadFromStorage<JiraCredentials>('jira_credentials', EMPTY_CREDS))
    setThemes(loadFromStorage<Theme[]>('active_themes', []))
  }, [])

  function handleSaveCreds() {
    try {
      saveToStorage('jira_credentials', creds)
      setSaved(true)
    } catch {
      alert('Could not save to browser storage. Make sure you are not in private/incognito mode.')
    }
  }

  async function handleTestConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/jira/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      })
      const data = await res.json()
      if (data.ok) {
        setTestResult({ ok: true, message: `Connected — ${data.projectCount} project(s) visible` })
      } else {
        setTestResult({ ok: false, message: data.error ?? 'Connection failed' })
      }
    } catch (err) {
      setTestResult({ ok: false, message: String(err) })
    } finally {
      setTesting(false)
    }
  }

  function handleAddTheme() {
    if (!newTheme.name || !newTheme.quarter) return
    const theme: Theme = {
      id: `theme-${Date.now()}`,
      name: newTheme.name,
      description: newTheme.description,
      quarter: newTheme.quarter,
      active: true,
    }
    const updated = [...themes, theme]
    setThemes(updated)
    saveToStorage('active_themes', updated)
    setNewTheme({ name: '', description: '', quarter: '' })
  }

  function handleToggleTheme(id: string) {
    const updated = themes.map((t) => t.id === id ? { ...t, active: !t.active } : t)
    setThemes(updated)
    saveToStorage('active_themes', updated)
  }

  function handleRemoveTheme(id: string) {
    const updated = themes.filter((t) => t.id !== id)
    setThemes(updated)
    saveToStorage('active_themes', updated)
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Settings</h2>

      <section className="mb-10">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Jira Connection</h3>
        <p className="text-sm text-gray-500 mb-4">
          Use a Jira API token — your Jira password is never accepted here.{' '}
          <a
            href="https://id.atlassian.com/manage-profile/security/api-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Generate one here.
          </a>
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
            <input
              type="url"
              placeholder="https://yourcompany.atlassian.net"
              value={creds.baseUrl}
              onChange={(e) => setCreds({ ...creds, baseUrl: e.target.value.replace(/\/$/, '') })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={creds.email}
              onChange={(e) => setCreds({ ...creds, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
            <input
              type="password"
              placeholder="••••••••••••••••"
              value={creds.apiToken}
              onChange={(e) => setCreds({ ...creds, apiToken: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Key</label>
            <input
              type="text"
              placeholder="e.g. PROJ or PLAT"
              value={creds.projectKey}
              onChange={(e) => setCreds({ ...creds, projectKey: e.target.value.toUpperCase() })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {saved && (
          <div className="mt-3 rounded-lg px-4 py-3 text-sm bg-green-50 text-green-700 border border-green-300 font-medium">
            Credentials saved. You can now fetch your backlog from the dashboard.
          </div>
        )}

        {testResult && (
          <div className={`mt-3 rounded-lg px-4 py-2.5 text-sm ${testResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {testResult.message}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleTestConnection}
            disabled={testing || !creds.baseUrl || !creds.email || !creds.apiToken || !creds.projectKey}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? 'Testing…' : 'Test Connection'}
          </button>
          <button
            onClick={handleSaveCreds}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Save
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Strategic Themes</h3>
        <p className="text-sm text-gray-500 mb-4">
          Time-bound themes used to detect theme orphans. Expired themes become read-only to preserve historical scoring.
        </p>

        <div className="space-y-2 mb-4">
          {themes.length === 0 && (
            <p className="text-sm text-gray-400 italic">No themes configured — theme orphan detection will be skipped.</p>
          )}
          {themes.map((theme) => (
            <div key={theme.id} className={`flex items-center justify-between rounded-lg border px-4 py-3 ${theme.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{theme.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{theme.quarter}</span>
                  {!theme.active && <span className="text-xs text-gray-400">(expired — read-only)</span>}
                </div>
                {theme.description && <p className="text-xs text-gray-500 mt-0.5">{theme.description}</p>}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleToggleTheme(theme.id)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  {theme.active ? 'Expire' : 'Reactivate'}
                </button>
                <button
                  onClick={() => handleRemoveTheme(theme.id)}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-dashed border-gray-300 p-4 space-y-3">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Add theme</p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Quarter (e.g. Q3 2026)"
              value={newTheme.quarter}
              onChange={(e) => setNewTheme({ ...newTheme, quarter: e.target.value })}
              className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Theme name (e.g. Enterprise Security)"
              value={newTheme.name}
              onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <input
            type="text"
            placeholder="Description (optional)"
            value={newTheme.description}
            onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleAddTheme}
            disabled={!newTheme.name || !newTheme.quarter}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Theme
          </button>
        </div>
      </section>
    </div>
  )
}
