# AI-Powered Backlog Groomer
## Prioritization Methodology & Framework

*Framework Design Document — Version 3.0*

---

## 1. Purpose & Context

This document defines the core prioritization methodology and architecture for an AI-powered backlog grooming tool designed for product managers. The system ingests tickets from sources such as Jira, Linear, and CSV exports, applies a two-layer scoring model to surface priority, flags risk, and suggests housekeeping actions (merges, closures, rewrites).

**System Positioning:** This tool acts as an *AI backlog intelligence and hygiene system*. It provides decision support by organizing observable data, pulling external business context, and learning from organizational behavior over time. It is a decision-support and learning engine, not an autonomous decision-maker.

---

## 2. The Effort Question

AI-assisted development has meaningfully reduced the effort cost of *code authorship* for a significant class of features. However, code authorship is often only 10–30% of total delivery effort. The remainder—architecture, testing, data migration, change management, and operational support—remains largely unaccelerated by AI.

For this reason, **build complexity must remain a filter, not a scoring dimension**. Mixing "should we do this?" with "can we do this right now?" in a single priority score destroys the signal for both. The framework keeps total delivery complexity (code + testing + ops) visible to the user, but strictly separate from the core strategic priority signal.

---

## 3. The Two-Layer Scoring Model

To avoid the "false precision" trap of relying solely on ticket descriptions, the framework employs a strict two-layer scoring architecture.

### 3.1 Layer 1 — AI-Observable Signals

These are dimensions the AI evaluates with high reliability from ticket content and backlog metadata alone. They do not require external context.

| Dimension | What it measures | Reliability |
|---|---|---|
| Ticket quality | Specificity, completeness, evidence cited, acceptance criteria presence | High |
| Similarity clustering | Semantic overlap with other tickets; duplicate and near-duplicate detection | High |
| Freshness | Age, recency of activity, supersession by newer tickets or shipped features | High |
| Theme alignment | Semantic fit to active, time-bound strategic themes | High — requires active themes |

### 3.2 Layer 2 — Business Context (The Integration Pipeline)

To prevent the system from degrading into AI-only guesswork, Layer 2 introduces critical business context. Crucially, **Layer 2 relies on automated data pipelines, not manual user entry.** Relying on PMs to manually update metadata leads to system abandonment.

| Dimension | Primary Source of Truth (Automated) | Fallback / Override |
|---|---|---|
| Revenue impact | CRM Integration (e.g., Salesforce/HubSpot opportunities linked to ticket) | PM manual override |
| Customer reach | Support Integration (e.g., Zendesk/Intercom ticket volume mapping) | PM manual override |
| Usage metrics | Product Analytics (e.g., Amplitude/PostHog feature flags) | PM manual override |

*System constraint: When integrations are missing or fail to find a match, the tool MUST surface the ticket with a visual "low context confidence" indicator.*

### 3.3 Scoring Synthesis

The final priority signal is a composite of Layer 1 AI scores and Layer 2 automated business context, ultimately adjusted by any manual PM overrides. 

---

## 4. Dimension Definitions

### 4.1 Reach — Context-Dependent

Reach is scored as a *frequency signal* across the backlog. If Layer 2 integrations (e.g., Zendesk) are active, Reach transforms into a high-confidence metric based on real support volume. Without integration or PM override, Reach is explicitly flagged as a low-confidence estimate.

### 4.2 Impact — Evidence Over Emotion

Impact weights **quantification** (dollars, percentages, frequencies) and **specificity** over emotional urgency. A dry, highly specific technical ticket citing a "3% transaction failure rate" outscores a vaguely written ticket stating "this is killing our workflow."

### 4.3 Confidence — Quality of Evidence

Confidence measures the presence of data (logs, analytics, user research), testable problem statements, and bounded scope. It explicitly does *not* measure prose quality. A well-written ticket with no data is not high-confidence.

### 4.4 Strategic Fit & Theme Versioning

Strategic fit measures alignment with defined business themes. Because organizational themes drift over time, **all themes must be time-bound** (e.g., "Q3 2026: Enterprise Security").

* **Handling Drift:** When a theme is retired, tickets attached to it do not lose their score retroactively. The old theme becomes read-only.
* New or updated tickets are evaluated strictly against the active taxonomy, ensuring historical scoring remains stable.

### 4.5 Defensibility: Strategy vs. Moat

The system explicitly decouples strategic value from product defensibility:
* **Strategic Fit (Value Creation):** Does this move us toward our current business goals?
* **Defensibility (Value Protection):** Does building this create a durable moat? (e.g., increases switching costs, leverages proprietary data, creates network effects).

**The Strategy/Moat Matrix (Evaluation Logic):**

| | High Strategic Fit | Low Strategic Fit |
|---|---|---|
| **High Defensibility** | **Core Moat-Builders:** Deep workflow integrations. Highest priority. | **Expensive Distractions:** Hard for competitors to copy, but irrelevant to current goals. |
| **Low Defensibility** | **Table Stakes:** Necessary for current goals, but easily cloned by competitors. | **Backlog Clutter:** Low value, easily replicated. Prime candidates for archiving. |

Defensibility is scored only when specific structural signals (data lock-in, ecosystem dependencies) are present in the text, or via explicit PM context.

---

## 5. Housekeeping as Primary Value

The highest-reliability capabilities of this system are its hygiene actions. These operate on signals the AI can observe directly and reliably, and should be surfaced prominently to build user trust.

| Action | Triggered when | Reliability |
|---|---|---|
| Merge candidate | High semantic similarity in title and description | High |
| Stale / close suggestion | Exceeds age threshold, no recent activity, appears superseded | High |
| Enrichment rewrite | Title is vague, description missing, or lacks Acceptance Criteria | High |
| Theme orphan alert | Ticket does not align to any active strategic theme | High |

---

## 6. Flags Over Score for Coordination Overhead

Coordination overhead (compliance, security, legal, partner dependencies) varies wildly. Baking this into a universal numerical penalty destroys reasoning observability.

The framework uses **Flags** (Light / Moderate / Significant) to surface these dependencies. This preserves the "why" so users can filter by execution context during sprint planning without artificially deflating a ticket's core priority score.

---

## 7. The Learning Engine: Override Intelligence

To build a durable moat, the tool must learn how a specific organization actually prioritizes. The **Override Intelligence Layer** tracks the delta between the AI's recommendation and the user's final action.

**The Feedback Loop Architecture:**
1.  **Track:** The AI recommends a rank based on standard weights. The PM manually drags the ticket to a lower or higher priority.
2.  **Analyze:** The system records the override and calculates patterns over time *(e.g., identifying that a specific team consistently downranks tickets flagged with 'Security Overhead' during end-of-quarter sprints).*
3.  **Calibrate:** The system periodically surfaces insights and prompts weight adjustments: *"Historically, your team overrides revenue-related recommendations 12% of the time, but overrides complexity-related recommendations 73% of the time. Would you like to adjust the baseline weight for complexity?"*

---

## 8. Summary of System Design Principles

1. **Surfaces intelligence; PMs make decisions:** The UI must frame outputs as recommendations requiring approval, not autonomous actions.
2. **Integrate, don't interrogate:** Pull business context automatically. Do not rely on manual data entry as the primary source of truth.
3. **Housekeeping first:** Lead user workflows with the highest-trust, highest-reliability hygiene actions.
4. **Separate strategy from defensibility:** Value creation is scored independently of value protection.
5. **Themes must expire:** Time-bound taxonomies are required to prevent historical data rot.
6. **Flags preserve what scores destroy:** Keep execution context visible alongside the priority score.
7. **Continuous learning over static scoring:** Override tracking is the core mechanism for aligning the AI with organizational reality.