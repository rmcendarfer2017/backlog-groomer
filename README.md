# Backlog Groomer

**AI-powered backlog intelligence for product managers.** Stop guessing which tickets to prioritize. The Backlog Groomer connects to your Jira backlog, applies a structured scoring framework, and surfaces the housekeeping work that's been quietly rotting in your queue — all without requiring you to manually maintain a spreadsheet or beg an engineer to run a report.

---

## Why this exists

Most backlogs share the same problems regardless of team size or industry:

- **Duplicate tickets** that accumulate over months as different people file the same request
- **Stale tickets** that nobody has touched in six months but are too scary to close
- **Vague tickets** that say "improve performance" with no data, no scope, and no acceptance criteria
- **Priority scores** that mix "should we do this?" with "can we do it right now?" — destroying the signal for both

The Backlog Groomer separates these concerns into a methodology based on three principles:

1. **Housekeeping first.** The highest-reliability signals — duplicates, stale items, enrichment gaps — don't require any external business context. Run them first to build trust and clean up noise before scoring.
2. **Scores show their work.** Every priority score is broken down into four visible dimensions so a PM can agree or override with a reason, not just a gut feeling.
3. **Flags are not scores.** Compliance, security, legal, and partner dependencies are shown alongside the score — never folded into it. A ticket that requires a legal review is still high-priority work. Baking coordination overhead into the score hides that signal.

---

## What's in this repo

| Path | What it is |
|---|---|
| `app/` `components/` `lib/` | The Backlog Groomer web app (Next.js) |
| `skill/` | The Claude.ai slash command for users already on Claude Chat with Jira connected |
| `backlog grooming framework.md` | The full prioritization methodology this tool is built on |
| `ROADMAP.md` | Planned phases: Layer 2 business context, override intelligence, Linear support |

---

## Part 1 — The Backlog Groomer Web App

A full-featured Next.js application for product managers who want a dedicated grooming tool connected to their Jira backlog.

### What it does

**Housekeeping Sweep**
Analyzes your entire backlog and surfaces four categories of issues:

- **Merge candidates** — tickets with high semantic overlap that likely represent the same work, with a suggested merge order
- **Stale tickets** — items exceeding 180 days with no activity that appear superseded or no longer relevant
- **Enrichment rewrites** — tickets with vague titles, missing descriptions, or no acceptance criteria, with a full AI-generated rewrite suggestion
- **Theme orphans** — tickets that don't align to any of your active strategic themes (only flagged when themes are configured)

**Layer 1 Priority Scoring**
Scores every ticket across four dimensions and produces a ranked table:

| Dimension | What it measures |
|---|---|
| **Quality** | Specificity, evidence cited, presence of testable acceptance criteria |
| **Freshness** | Recency of last update, decayed over time |
| **Theme alignment** | Semantic fit to your active, time-bound strategic themes |
| **Similarity** | How duplicate-like this ticket is relative to others — shown separately so you can see why a ticket ranked lower |

The composite score is a weighted formula that redistributes weights automatically when no themes are configured.

**Coordination Flags**
Detects five categories of execution overhead from ticket text — compliance, security, legal, partner dependencies, and multi-team coordination — and surfaces them as Light / Moderate / Significant flags. These appear alongside the score and never deflate it.

**Interactive Backlog Table**
- Sort by any scoring dimension
- Filter by flag severity during sprint planning
- Hover the composite score for a breakdown chart showing each dimension's contribution
- Color-coded score pills (green / amber / red) for at-a-glance prioritization

### Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| AI | Anthropic SDK → Claude (server-side API routes) |
| Data source | Jira REST API v3 |
| State | `localStorage` (no database required) |

### Getting started

**Prerequisites**
- Node.js 18+
- An Anthropic API key ([get one here](https://console.anthropic.com))
- A Jira account with an API token ([generate one here](https://id.atlassian.com/manage-profile/security/api-tokens))

**1. Clone and install**

```bash
git clone https://github.com/rmcendarfer2017/backlog-groomer.git
cd backlog-groomer
npm install
```

**2. Add your Anthropic API key**

Create a `.env.local` file in the project root:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**3. Start the app**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**4. Connect your Jira backlog**

1. Go to **Settings** in the app
2. Enter your Jira base URL (e.g. `https://yourcompany.atlassian.net`), email, API token, and project key
3. Click **Test Connection** to verify, then **Save**

**5. Run your first grooming session**

1. Click **Fetch Backlog** to load tickets from Jira
2. Click **Score** to run Layer 1 priority scoring and flag detection
3. Click **Analyze** to run the housekeeping sweep
4. Review the Housekeeping tab and Backlog table

> **No Jira account?** Click **Load demo data** on the dashboard to explore the full feature set with 12 pre-built tickets designed to trigger every housekeeping category and scoring scenario.

### Network access

If you're accessing the app from another device on your network, add your IP to `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  allowedDevOrigins: ['your.local.ip'],
}
```

---

## Part 2 — The Backlog Groomer Skill for Claude Chat

For product managers who are already using [Claude.ai](https://claude.ai) and have Jira connected via MCP, the Backlog Groomer is available as a custom slash command — no separate app required.

Once installed, typing `/backlog-groomer` in a Claude.ai conversation triggers the full grooming workflow: housekeeping sweep, Layer 1 scoring, coordination flags, and interactive follow-ups. The same methodology, the same output formats, directly in your Claude chat.

### Who this is for

- You already use Claude.ai (Pro or Team plan with Projects access)
- You have the **Jira/Atlassian integration** connected in your Claude.ai Project, **or** you're comfortable pasting backlog data as JSON or CSV
- You want grooming results in a conversation rather than a separate web app

### How to install

**Option A — Let Claude install it for you**

1. Open [claude.ai](https://claude.ai) and start a new conversation
2. Share the `skill/backlog-groomer-prompt.md` file from this repo
3. Claude will recognize the skill file and walk you through installing it as a custom command in your Project settings

**Option B — Manual install**

1. Open a Claude.ai Project (or create one named "Backlog Groomer")
2. Go to Project settings → **Commands** → **Add command**
3. Name: `backlog-groomer`
4. Body: copy everything below the `## SKILL CONTENT` line in `skill/backlog-groomer-prompt.md` and paste it
5. Save

### How to use

Once installed, in any conversation inside that Project:

```
/backlog-groomer
```

Or pass your Jira project key directly to skip the setup questions:

```
/backlog-groomer PROJ
```

**With Jira MCP connected**, Claude fetches your backlog automatically and confirms the ticket count before proceeding.

**Without Jira MCP**, Claude asks you to paste ticket data in JSON, CSV, or plain text format.

### What the skill can do

After loading your backlog, you can ask Claude to:

| Prompt | What happens |
|---|---|
| Run housekeeping | Merge candidates, stale tickets, enrichment rewrites, theme orphans |
| Score and rank | Full priority table with Q / F / T / Sim breakdown and flags |
| `Rewrite KEY-8` | Generates a full enrichment rewrite: title, description, acceptance criteria |
| `Expand KEY-42` | Shows each scoring dimension, its weight, and plain-English rationale |
| `Show significant flags only` | Filters to tickets with hard external dependencies |
| `What should I groom first?` | Recommends the 3–5 highest-impact actions |
| `Compare KEY-3 and KEY-11` | Side-by-side scoring and similarity analysis |
| `Set themes: Q3 2026 Enterprise Security` | Updates active themes; offers to re-run theme alignment |

### Connecting Jira MCP

If you don't already have Jira connected to your Claude.ai Project:

1. In Project settings, find **Integrations** or **Connected apps**
2. Add the **Jira** (Atlassian) integration
3. Authenticate with your Jira credentials

Once connected, the skill detects the integration automatically and fetches tickets by project key with no manual data entry.

---

## The Framework

Both the web app and the skill are built on the same prioritization methodology, documented in full in [`backlog grooming framework.md`](backlog%20grooming%20framework.md).

Key design decisions that distinguish this framework from generic prioritization tools:

- **Build complexity is a filter, not a score.** AI-assisted development has reduced the cost of code authorship, but not architecture, testing, data migration, or operational support. Mixing "should we do this?" with "can we do it right now?" in a single score destroys both signals.
- **Automated context over manual entry.** The framework is designed to pull business context from integrations (CRM, support, analytics) rather than ask PMs to maintain metadata. When integrations are absent, low-context confidence is surfaced visibly rather than silently filled in.
- **Override intelligence.** The roadmap includes a learning engine that tracks when PMs override AI recommendations, identifies patterns over time, and periodically prompts weight recalibration — so the tool adapts to how your team actually prioritizes, not just how the framework says you should.

---

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for the full phase plan. Upcoming:

- **Layer 2 business context** — CRM, support volume, and product analytics integrations to enrich the priority score with real business data
- **Scoring synthesis** — composite score combining Layer 1 AI signals with Layer 2 business context and PM overrides
- **Override intelligence** — track accept/dismiss patterns and surface calibration insights
- **Flags system** — Light / Moderate / Significant coordination overhead flags with sprint planning filter
- **Linear API** — alternative to Jira for Linear-native teams
- **CSV import** — fallback for any tool that exports spreadsheets

---

## License

MIT
