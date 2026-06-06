# Backlog Groomer — Claude.ai Project Setup

This turns Claude.ai into a conversational backlog grooming assistant using the PM-TOOLS framework. It runs entirely in Claude.ai chat — no web app, no CLI.

---

## Setup (5 minutes)

### Step 1 — Create a Claude.ai Project

1. Go to [claude.ai](https://claude.ai)
2. Click **Projects** in the left sidebar
3. Click **New Project** and name it (e.g. "Backlog Groomer")

### Step 2 — Add the system prompt

1. Inside the project, click **Edit project instructions** (or the pencil icon)
2. Open `backlog-groomer-prompt.md` from this folder
3. Copy everything **below** the `---` separator (skip the first two lines — those are just setup notes)
4. Paste into the instructions field and save

### Step 3 — Connect Jira (optional but recommended)

If you want Claude to fetch your Jira backlog directly:

1. In the Project, click **Add integration** or **Connect apps**
2. Find **Jira** (Atlassian) and connect with your credentials
3. When you start a conversation, tell Claude your project key — it will search Jira automatically

If you skip this step, Claude will ask you to paste ticket data instead.

---

## Starting a session

Open a new conversation inside the Project and Claude will greet you with three setup questions:
- Your Jira project key (or pasted data)
- Your active strategic themes for this quarter
- Whether to run housekeeping, scoring, or both

---

## Example conversation

```
You:    Let's groom the SCRUM backlog. Themes: Q3 2026 Enterprise Security.
        Run both housekeeping and scoring.

Claude: [Fetches SCRUM backlog via Jira integration]
        Loaded 47 tickets. Running housekeeping sweep...

        ⇒ MERGE CANDIDATE
        Primary:   SCRUM-12 — Add dark mode to dashboard
        Duplicate: SCRUM-31 — Implement dark theme for the app
        ...

        PRIORITY SCORES — SCRUM Backlog
        Rank | Key      | Score | Q  | F  | T  | Flags
          1  | SCRUM-8  |  84   | 90 | 95 | 75 | 🔒 Security (Moderate)
        ...

You:    Rewrite SCRUM-22

Claude: ✎ NEEDS ENRICHMENT — SCRUM-22
        Suggested rewrite:
          Title: ...
          Description: ...
          Acceptance criteria: ...

You:    Show me only significant flags

Claude: [Filtered flag table]
```

---

## Files in this folder

| File | Purpose |
|---|---|
| `backlog-groomer-prompt.md` | The system prompt — paste this into Claude.ai Project instructions |
| `README.md` | This setup guide |

## Framework reference

Full methodology: `D:\PM-TOOLS\Backlog Groomer\backlog grooming framework.md`
Web app implementation: `D:\PM-TOOLS\Backlog Groomer\`
