import type { Ticket } from './types'

const now = new Date()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString()

export const DEMO_TICKETS: Ticket[] = [
  // --- MERGE CANDIDATES: near-duplicate pairs ---
  {
    id: '10001', key: 'DEMO-1',
    summary: 'Add dark mode support to the dashboard',
    description: 'Users have requested a dark mode option for the main dashboard. Should respect system preference via prefers-color-scheme and allow manual toggle. Acceptance criteria: toggle in user settings, persists across sessions, covers all pages.',
    status: 'To Do', priority: 'Medium',
    created: daysAgo(45), updated: daysAgo(10),
    labels: ['ui', 'accessibility'], assignee: null, reporter: 'Alex Kim',
    issueType: 'Story', jiraUrl: '#',
  },
  {
    id: '10002', key: 'DEMO-2',
    summary: 'Implement dark theme for the application',
    description: 'Product has asked for a dark theme. Should toggle between light and dark. Users want it to follow OS settings. Needs to work on dashboard and settings pages.',
    status: 'To Do', priority: 'Low',
    created: daysAgo(30), updated: daysAgo(25),
    labels: ['ui'], assignee: null, reporter: 'Jordan Lee',
    issueType: 'Story', jiraUrl: '#',
  },
  {
    id: '10003', key: 'DEMO-3',
    summary: 'Export report data to CSV',
    description: 'Allow users to export filtered report data to a CSV file for use in Excel or Google Sheets. Should include all visible columns. Acceptance criteria: button on reports page, file downloads immediately, includes column headers.',
    status: 'To Do', priority: 'Medium',
    created: daysAgo(60), updated: daysAgo(5),
    labels: ['reporting', 'data-export'], assignee: 'Sam Rivera', reporter: 'Alex Kim',
    issueType: 'Story', jiraUrl: '#',
  },
  {
    id: '10004', key: 'DEMO-4',
    summary: 'Download reports as CSV file',
    description: 'Users need to be able to download their report data as a CSV. Should work from the main reports view. Needed for finance team use in spreadsheets.',
    status: 'Backlog', priority: 'Medium',
    created: daysAgo(55), updated: daysAgo(50),
    labels: ['reporting'], assignee: null, reporter: 'Taylor Brooks',
    issueType: 'Story', jiraUrl: '#',
  },

  // --- STALE: old tickets with no activity ---
  {
    id: '10005', key: 'DEMO-5',
    summary: 'Migrate remaining v1 API endpoints to v2',
    description: 'Several legacy v1 endpoints are still in use. These need to be migrated to the v2 format before the v1 deprecation date. See migration guide in Confluence. Blocked on the auth team completing their v2 token work.',
    status: 'In Progress', priority: 'High',
    created: daysAgo(280), updated: daysAgo(210),
    labels: ['api', 'migration', 'tech-debt'], assignee: 'Jordan Lee', reporter: 'Jordan Lee',
    issueType: 'Task', jiraUrl: '#',
  },
  {
    id: '10006', key: 'DEMO-6',
    summary: 'Evaluate Segment vs Amplitude for analytics',
    description: 'Need to decide on an analytics platform before Q2. Compare pricing, data ownership, and integration complexity. Decision should be documented in Confluence.',
    status: 'To Do', priority: 'Low',
    created: daysAgo(320), updated: daysAgo(290),
    labels: ['analytics', 'research'], assignee: null, reporter: 'Sam Rivera',
    issueType: 'Spike', jiraUrl: '#',
  },
  {
    id: '10007', key: 'DEMO-7',
    summary: 'Fix pagination bug on the users list page',
    description: 'Page 2 of the users list sometimes shows duplicate entries. Reported by 2 support tickets in March. Intermittent — happens when total user count is a multiple of the page size.',
    status: 'To Do', priority: 'Medium',
    created: daysAgo(200), updated: daysAgo(185),
    labels: ['bug', 'users'], assignee: null, reporter: 'Alex Kim',
    issueType: 'Bug', jiraUrl: '#',
  },

  // --- ENRICHMENT REWRITES: vague, missing detail ---
  {
    id: '10008', key: 'DEMO-8',
    summary: 'Improve onboarding',
    description: '',
    status: 'Backlog', priority: 'High',
    created: daysAgo(20), updated: daysAgo(20),
    labels: [], assignee: null, reporter: 'Taylor Brooks',
    issueType: 'Epic', jiraUrl: '#',
  },
  {
    id: '10009', key: 'DEMO-9',
    summary: 'Fix the thing with notifications',
    description: 'Notifications are broken sometimes. Need to fix this.',
    status: 'To Do', priority: 'High',
    created: daysAgo(8), updated: daysAgo(8),
    labels: ['notifications'], assignee: null, reporter: 'Jordan Lee',
    issueType: 'Bug', jiraUrl: '#',
  },
  {
    id: '10010', key: 'DEMO-10',
    summary: 'Performance',
    description: 'The app feels slow.',
    status: 'Backlog', priority: 'Medium',
    created: daysAgo(15), updated: daysAgo(15),
    labels: [], assignee: null, reporter: 'Sam Rivera',
    issueType: 'Story', jiraUrl: '#',
  },

  // --- WELL-FORMED (control group): these should not be flagged ---
  {
    id: '10011', key: 'DEMO-11',
    summary: 'Add MFA support for enterprise accounts',
    description: 'Enterprise customers require multi-factor authentication. Implement TOTP-based MFA using an authenticator app. Acceptance criteria: (1) users can enroll an authenticator app from security settings, (2) MFA is enforced for enterprise accounts on login, (3) recovery codes generated on enrollment, (4) admin can reset MFA for a user.',
    status: 'To Do', priority: 'High',
    created: daysAgo(14), updated: daysAgo(2),
    labels: ['security', 'enterprise'], assignee: 'Alex Kim', reporter: 'Taylor Brooks',
    issueType: 'Story', jiraUrl: '#',
  },
  {
    id: '10012', key: 'DEMO-12',
    summary: 'Rate limit the public API to prevent abuse',
    description: 'We have had 3 incidents in the last quarter where a single client caused degraded performance for all users. Implement per-API-key rate limiting at 1000 req/min. Return HTTP 429 with Retry-After header. Acceptance criteria: rate limit enforced, limit visible in API docs, internal keys are exempt.',
    status: 'To Do', priority: 'High',
    created: daysAgo(7), updated: daysAgo(1),
    labels: ['api', 'reliability', 'security'], assignee: 'Sam Rivera', reporter: 'Alex Kim',
    issueType: 'Story', jiraUrl: '#',
  },
]
