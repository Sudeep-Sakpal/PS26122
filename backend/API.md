# PS 26122 Backend API

Practical reference for integrating the frontend with this backend. Not a full spec —
just enough to wire up requests correctly.

## Base URL

```
http://localhost:4000/api
```

Port comes from `PORT` in `.env` (default `4000`). All endpoints below are relative to this base.

## Authentication

**None.** This is a screening prototype with no login/session/token — every endpoint is open.

## Response envelope

Every endpoint returns:

```json
{ "success": true, "count": 3, "data": { ... } }
```

`count` only appears on list-shaped endpoints. On error, the shape is:

```json
{ "success": false, "message": "Project 64f... not found", "details": [ ... ] }
```

`details` is present only for validation errors (an array of `{ path, message }`) or Mongo
duplicate-key errors. Stack traces are included only when `NODE_ENV !== "production"`, never in
production responses.

## Status values

| Field | Values | Meaning |
|---|---|---|
| `Project.status` | `on-track`, `at-risk`, `delayed`, `completed` | B1 baseline project status |
| `ScheduleActivity.status` | `not-started`, `in-progress`, `completed`, `delayed`, `at-risk`, `blocked` | B1 baseline, set at schedule import time — does **not** update automatically as reports come in |
| comparison `status` | `DELAYED`, `ON_TRACK`, `AHEAD`, `NO_DATA` | B3's computed planned-vs-actual result. `NO_DATA` means no execution update is linked yet — never assume 0% |
| risk `riskStatus` | `AT_RISK`, `POTENTIAL_IMPACT` | B4's dependency-derived risk (distance 1 vs further) |
| risk `severity` | `HIGH`, `MEDIUM`, `LOW` | Follows directly from `riskStatus` |
| `Report.status` | `processed`, `no-data`, `failed` | B2 ingestion outcome |
| `matchMethod` | `exact-code`, `exact-name`, `keyword`, `fuzzy` | B3's deterministic matching tier |

Note the two status vocabularies are deliberately different in casing/naming (kebab-case B1
baseline vs. SCREAMING_SNAKE B3/B4 computed) so a response never lets you confuse "the schedule
says this activity is delayed" with "B3 just calculated this activity is delayed" — both can be
true, false, or disagree, and each is independently meaningful.

## Confidence fields

All confidence values in API responses are **0–100 integers**. (Internally, B2's extraction
confidence is stored 0–1; it's rescaled to 0–100 at the API boundary so every confidence number in
a response — extraction, match, risk — uses the same scale.)

---

## Endpoints

### Health

**`GET /health`**
No params. Cheap — just uptime + Mongo connection state, no DB queries.

```json
{ "status": "ok", "uptimeSeconds": 42, "timestamp": "2026-...", "db": "connected" }
```

### Projects

**`GET /projects`** — list all projects, newest first.

**`POST /projects`** — create a project.
Body (JSON): `name, code, location, sector, contractor, startDate, endDate` (required),
`status, budgetUtilized, progress` (optional). `code` must be unique (409 if not).

**`GET /projects/:id`** — single project. 400 if `:id` isn't a valid ObjectId, 404 if it doesn't exist.

### Dashboard (B5)

**`GET /projects/:id/dashboard`** — one aggregated payload for a project dashboard. See
[Dashboard response shape](#dashboard-response-shape) below.

### Activities

**`GET /projects/:id/activities`** — schedule activities for a project (B1 baseline: `planned`,
`actual`, `status`, dates), each with a `dependsOn` array of predecessor activity ids.

**`GET /projects/:id/activities/:activityId`** — one activity's full detail: identity + planned
schedule + B3's `comparison` (planned/actual/variance/status/reason) + the source report it was
linked from, if any.

**`GET /projects/:id/activities/:activityId/comparison`** — just the B3 comparison object for one
activity: `{ plannedProgress, actualProgress, variance, status, reason, linkedExecutionUpdate }`.

**`GET /projects/:id/activities/:activityId/impact`** — B4 downstream impact from this activity:
`{ activity, isTrigger, downstream: [{ id, code, name, distance, riskStatus, severity, reason, confidence }] }`.
Works for any activity, not just delayed ones — `isTrigger: false` means the chain is shown but
nothing is flagged as at-risk (no delay to propagate).

### Schedule import

**`POST /projects/:id/schedule`** — multipart upload, field name **`file`**, `.xlsx` only, 10 MB
max. Upserts `ScheduleActivity` + `Dependency` records by activity code. Accepts flexible column
headers (Sequence/Code/Name/Owner/Status/Planned/Actual/dates/Depends On, several spellings each).

### Reports (B2)

**`POST /projects/:id/reports`** — multipart upload, field name **`file`**. Accepts **`.txt`,
`.pdf`, `.xlsx`**, 10 MB max. Runs extraction (LLM if `LLM_PROVIDER` is configured, otherwise the
deterministic demo parser) and stores one `Report` + zero-or-more `ExecutionUpdate` records.

Response:
```json
{
  "success": true,
  "data": {
    "report": { "fileName": "...", "fileType": "txt", "status": "processed", ... },
    "executionUpdates": [
      {
        "activityName": "Foundation",
        "activityCode": "B2-ST-01",
        "updateDate": "2025-12-14T...",
        "actualProgress": 70,
        "reason": "Heavy rainfall ...",
        "extractionConfidence": 94,
        "linkedActivity": null
      }
    ],
    "extraction": { "provider": "demo", "warnings": [] }
  }
}
```
`linkedActivity`/`matchConfidence`/`matchMethod` are `null` until you call the link endpoint below
— upload and schedule-matching are separate steps.

**`GET /projects/:id/reports`** — `{ reports: [...with nested executionUpdates], executionUpdates: [...flat] }`.

### Execution updates + schedule linking (B3)

**`GET /projects/:id/execution-updates`** — all execution updates for a project, most recent
first, with `linkedActivity` populated (code/name/sequence) when linked.

**`POST /projects/:id/execution-updates/:updateId/link`** — deterministically match one execution
update to a schedule activity. Idempotent (safe to call again; re-confirms the same result). Never
errors on "already linked" — always 200 with the current match outcome:
```json
{ "data": { "executionUpdate": {...}, "match": { "matched": true, "activityCode": "B2-ST-01", "confidence": 94, "matchMethod": "exact-code" } } }
```
or, if nothing matched confidently enough: `{ "match": { "matched": false, "reason": "..." } }` — no
low-confidence guess is ever forced.

**`POST /projects/:id/execution-updates/link`** — link every currently-unmatched update in the
project in one call. Returns `{ attempted, linked, unmatched, results: [...] }`.

### Risks (B4)

**`GET /projects/:id/risks`** — every downstream risk currently in the project, computed live from
B3's delay state + the stored dependency graph (never hard-coded, never persisted):
```json
{
  "data": {
    "risks": [
      {
        "triggerActivity": { "id": "...", "code": "B2-ST-01", "name": "Foundation", "status": "DELAYED", "variance": -30 },
        "impactedActivity": { "id": "...", "code": "B2-ST-02", "name": "Pillars" },
        "distance": 1,
        "riskStatus": "AT_RISK",
        "severity": "HIGH",
        "reason": "Upstream Foundation activity is delayed by 30 percentage points.",
        "confidence": 94
      }
    ]
  }
}
```
Empty `risks: []` (200, not an error) when there's nothing at risk.

**`GET /projects/:id/dependencies`** — raw dependency edges for a project (debug/demo aid), each
populated with the linked activities' code/name.

---

## Dashboard response shape

```json
{
  "success": true,
  "data": {
    "project": { "_id": "...", "name": "NH-44 Bridge Widening — Package B2", "code": "NH-44-B2", "status": "delayed", ... },
    "summary": {
      "totalActivities": 5,
      "completedActivities": 0,
      "activitiesWithData": 1,
      "activitiesWithoutData": 4,
      "plannedProgress": 31,
      "actualProgress": 70,
      "variance": -30,
      "delayedActivities": 1,
      "onTrackActivities": 0,
      "aheadActivities": 0,
      "atRiskActivities": 2,
      "potentialImpactActivities": 2,
      "totalRisks": 4
    },
    "activities": [
      {
        "id": "...", "code": "B2-ST-01", "name": "Foundation", "sequence": 1, "owner": "R. Deshmukh",
        "scheduleStatus": "delayed",
        "plannedStart": "...", "plannedEnd": "...", "actualStart": "...", "actualEnd": null,
        "plannedProgress": 100, "actualProgress": 70, "variance": -30,
        "delayStatus": "DELAYED",
        "reason": "Heavy rainfall ..."
      }
    ],
    "risks": [ /* same shape as GET /risks */ ],
    "recentUpdates": [ /* up to 5 most recent execution updates, extractedText omitted */ ]
  }
}
```

`summary.plannedProgress` averages every activity's planned figure. `summary.actualProgress` and
`summary.variance` only average activities that actually have a linked execution update
(`activitiesWithData`) — activities with no data are excluded, never counted as 0%.
`summary.variance` is the average of each reporting activity's *own* variance (actual vs. that
same activity's planned), not `actualProgress - plannedProgress` — those two aggregates can cover
different populations when only some activities have reported, so subtracting them would compare
mismatched baselines. Both are `null` whenever no activity has reported yet.

---

## Environment variables (`.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `PORT` | no | `4000` | |
| `NODE_ENV` | no | `development` | `production` suppresses stack traces + request logging |
| `MONGODB_URI` | no | `mongodb://127.0.0.1:27017/ps26122` | |
| `FRONTEND_ORIGIN` | no | `http://localhost:3000` | sets CORS `origin` |
| `LLM_PROVIDER` | no | `demo` | `demo` \| `openai` \| `anthropic` — `demo` needs no key |
| `LLM_API_KEY` | only if provider ≠ `demo` | — | never commit a real value |
| `LLM_MODEL` | no | provider-specific default | |

See `.env.example`.

## Seeding the demo project

```bash
npm run seed
```

Resets and recreates the canonical NH-44 Bridge Widening project (idempotent — safe to re-run):
Foundation → Pillars → Beams → Road Surface, plus a parallel Foundation → Drainage branch. To
reproduce the flagship scenario end-to-end, upload `samples/foundation-site-report.txt` via
`POST /projects/:id/reports`, link the resulting execution update via
`POST /projects/:id/execution-updates/:updateId/link`, then check
`GET /projects/:id/dashboard` or `GET /projects/:id/risks`.
