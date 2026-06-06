# Backlog Groomer Skill

A Claude.ai custom slash command that gives any product manager a full backlog grooming session — housekeeping sweep, priority scoring, and coordination flags — using the same methodology as the Backlog Groomer web app.

## How to install

### Option A — Let Claude walk you through it (recommended)

1. Open [claude.ai](https://claude.ai) and start a new conversation
2. Share the `backlog-groomer-prompt.md` file from this folder
3. Claude will recognize the skill file and guide you through installing it as a custom command in your Project settings

### Option B — Install manually

1. Open a Claude.ai Project (or create one named "Backlog Groomer")
2. Go to Project settings → **Commands** → **Add command**
3. Name: `backlog-groomer`
4. Body: copy everything below the `## SKILL CONTENT` line in `backlog-groomer-prompt.md` and paste it
5. Save

## How to use

Once installed, type in any conversation inside that Project:

```
/backlog-groomer
```

Or skip the setup questions by passing your Jira project key:

```
/backlog-groomer PROJ
```

## What it does

- Connects to Jira automatically if the integration is active, or accepts pasted ticket data
- Runs a housekeeping sweep: merge candidates, stale tickets, enrichment rewrites, theme orphans
- Scores every ticket on quality, freshness, theme alignment, and similarity
- Surfaces coordination flags (compliance, security, legal, partner dependencies) without deflating scores
- Stays in session for follow-up prompts: rewrite a ticket, show flag summaries, expand score breakdowns

## Files

| File | Purpose |
|---|---|
| `backlog-groomer-prompt.md` | The skill file — share with Claude to install, or copy the SKILL CONTENT section manually |
| `README.md` | This file |

## Framework reference

Full methodology: [`backlog grooming framework.md`](../backlog%20grooming%20framework.md)
