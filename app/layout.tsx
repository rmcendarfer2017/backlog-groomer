import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Backlog Groomer',
  description: 'AI-powered backlog hygiene for product managers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b bg-white px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Backlog Groomer</h1>
              <p className="text-xs text-gray-500">AI-powered backlog hygiene</p>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">Dashboard</a>
              <a href="/settings" className="text-gray-600 hover:text-gray-900 transition-colors">Settings</a>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
