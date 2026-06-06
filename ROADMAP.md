# Backlog Groomer — Product Roadmap

This document tracks all features deferred from the MVP. The MVP ships housekeeping-only because these are the highest-confidence, highest-trust capabilities as defined in the framework (`backlog grooming framework.md`).

---

## MVP (Shipped)

- Jira backlog ingestion (REST API v3, API token auth)
- AI-powered housekeeping via Claude:
  - **Merge candidates** — semantic similarity detection
  - **Stale/close suggestions** — age + activity analysis
  - **Enrichment rewrites** — vague titles, missing descriptions, no acceptance criteria
  - **Theme orphan alerts** — tickets not aligned to any active strategic theme
- Time-bound strategic themes (active/expired, read-only on expiry)
- Low context confidence visual indicator
- Accept / Dismiss per suggestion (persisted in localStorage)
- Settings page: Jira credentials, connection test, theme management

---

## Phase 2 — Layer 1 Scoring

Per framework §3.1: AI-Observable Signals that do not require external context.

- **Ticket quality score** — specificity, completeness, evidence cited, acceptance criteria presence
- **Similarity clustering score** — semantic overlap score per ticket (dedup signal visible in ticket table)
- **Freshness score** — age-weighted activity decay
- **Theme alignment score** — 0–1 fit against active themes

UI: add a priority score column to the ticket table, sortable.

---

## Phase 3 — Layer 2 Business Context

Per framework §3.2: Automated data pipelines, not manual entry. When integrations are absent, surface "low context confidence" indicator.

- **CRM integration** — Salesforce/HubSpot opportunity links → revenue impact signal
- **Support integration** — Zendesk/Intercom ticket volume → customer reach signal
- **Product analytics integration** — Amplitude/PostHog feature flags → usage metrics signal
- **Low context confidence escalation** — tickets with no Layer 2 matches get flagged prominently

---

## Phase 4 — Scoring Synthesis & UI

Per framework §3.3: Composite priority signal.

- **Composite priority score** — Layer 1 AI score + Layer 2 business context + PM overrides
- **Strategy / Moat matrix view** — 2×2: High/Low Strategic Fit × High/Low Defensibility (framework §4.5)
- **Complexity filter** — total delivery effort (code + testing + ops) shown as a filter, NOT a scoring dimension (framework §2)
- Sort/filter backlog by composite score

---

## Phase 5 — Flags System

Per framework §6: Coordination overhead flagged separately, not baked into priority score.

- Flag types: **Light** / **Moderate** / **Significant**
- Flag reasons: compliance, security, legal, partner dependency
- Sprint planning filter: filter backlog by flag level
- Flags shown alongside score without deflating it

---

## Phase 6 — Override Intelligence (Learning Engine)

Per framework §7: The core mechanism for aligning the AI with organizational reality.

- **Track PM overrides** — record when PM manually reorders tickets vs. AI recommendation
- **Pattern analysis** — identify which dimensions get overridden most (e.g. "73% of complexity overrides happen at end-of-quarter")
- **Calibration prompts** — "Historically, your team overrides revenue-related recommendations 12% of the time. Would you like to adjust the baseline weight for revenue impact?"
- Persist override history in a local database (SQLite or IndexedDB)

---

## Phase 7 — Integrations & Sync

- **Jira webhook** — real-time backlog sync instead of manual fetch
- **Linear API** — alternative to Jira for Linear-native teams
- **CSV import** — fallback for any tool that exports spreadsheets
- **Bulk export** — export housekeeping suggestions as a CSV or Jira bulk-edit CSV
