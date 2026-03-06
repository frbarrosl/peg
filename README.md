# Peg — Money Transfer Quote App

A full-stack application for getting international money transfer quotes, saving them, submitting transfer requests, and viewing transfer history.

---

## A Note on AI Usage

Using AI as part of the development process is, at this point, a standard practice — and one I apply daily in my current role. That said, it does not replace understanding; if anything, it accelerates it.

For this project I used Claude Code with the Haiku model, which is Anthropic's lightest and least capable model in the Claude family. Working with a constrained model requires writing precise, well-scoped prompts and breaking work into small, deliberate increments. Every technical decision — data model design, stack selection, framework choices, software architecture — was mine. The AI handled implementation within those boundaries.

No black-box, single-prompt generation was used at any point during development.

---

## Setup Instructions

### Prerequisites

- Python 3.12
- Node.js 20+
- Docker (for PostgreSQL)

### 1. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL 17 on port 5433 (db: `peg`, user: `peg`, password: `peg`).

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required env vars (see `.env.example`):

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` for local dev |
| `DB_NAME` | Database name (`peg`) |
| `DB_USER` | Database user (`peg`) |
| `DB_PASSWORD` | Database password (`peg`) |
| `DB_HOST` | Database host (`localhost`) |
| `DB_PORT` | Database port (`5433`) |
| `EXCHANGERATE_API_KEY` | API key from [exchangerate-api.com](https://www.exchangerate-api.com) (free tier available) |

Run migrations and seed data:

```bash
python manage.py migrate
python manage.py loaddata exchange/fixtures/initial_data.json
python manage.py loaddata exchange/fixtures/currencies.json
python manage.py runserver
```

The GraphQL endpoint will be available at `http://localhost:8000/graphql/` (GraphiQL UI in dev mode).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Data Model Decisions

### Schema overview

```
Provider          — exchange rate API providers (configurable, prioritized)
FeeConfig         — fee rules applied to transfers (percentage + fixed amount)
ExchangeProviderResponse  — raw API call log (request, response body, status, latency)
Currency          — seeded list of supported currencies (code + name)
Quote             — full quote lifecycle tied to a user
```

### Quote lifecycle

```
DRAFT → PENDING → COMPLETED
              ↑
           EXPIRED (if confirm is called after 5-minute window)
```

A `Quote` is created as `DRAFT` the moment a user selects a currency pair. It holds the exchange rate snapshotted at that time and expires in 5 minutes (`expires_at`). When the user enters an amount and confirms:

- If the quote is still valid → status moves to `PENDING` (transfer submitted, awaiting async processing)
- If the quote has expired → the existing draft is marked `EXPIRED`, a fresh rate is fetched, and a new `DRAFT` is returned to the frontend so the user can review and re-confirm

The `PENDING → COMPLETED` transition is intentionally left to a background process (not implemented). My Transactions shows both `PENDING` and `COMPLETED` quotes.

### Why persist `ExchangeProviderResponse`

The raw API response (URL, full JSON body, HTTP status, response time in ms) is stored on every external call. This serves two purposes: it makes the quote auditable — you can always trace which rate a quote was based on and whether the API call succeeded — and it makes it straightforward to debug provider failures or unexpected rate values.

### Why `Provider` and `FeeConfig` are their own models

Both are designed to be configurable without code changes. A new exchange rate provider can be added by inserting a row (setting `base_url`, `api_key_env_name`, and `priority`). Fee rules can change independently of quote logic. Each `Quote` holds FK references to the `Provider` and `FeeConfig` that were active at creation time, so historical quotes are never retroactively affected by config changes.

### Why the rate is snapshotted at quote creation (not at confirm)

Exchange rates move. Snapshotting the rate at quote time lets the UI show a stable price to the user while they fill in the amount. The 5-minute expiry enforces that the rate cannot be arbitrarily stale. When a quote expires, the frontend shows the refreshed rate in-place so the user can make an informed decision before re-confirming.

Having the timestamp of when a user requested a quote versus when (or whether) they confirmed it also creates a useful signal: analyzing abandoned quotes — where users got a rate but never submitted — can reveal which currency pairs, amounts, or rate conditions cause drop-off, which in turn informs pricing strategy and UX improvements.

---

## Architecture Overview

### Stack

| Layer | Technology |
|---|---|
| Backend | Django 5.2 + Python 3.12 |
| API | GraphQL via graphene-django 3.2.3 |
| Auth | JWT via django-graphql-jwt 0.4.0 |
| Database | PostgreSQL 17 (Docker locally) |
| External API | ExchangeRate-API v6 (pair endpoint) |
| Frontend | React 19 + Vite 6 |
| GraphQL client | Apollo Client 4.0 |
| UI | MUI v7 + Framer Motion |

### Project structure

```
peg/
├── docker-compose.yml
├── backend/
│   ├── peg/               # Django project (settings, root schema, urls)
│   ├── users/             # Registration + JWT auth mutations
│   ├── exchange/          # Core domain: Provider, FeeConfig, Quote, services, schema
│   │   ├── models.py
│   │   ├── services.py    # Business logic (fetch rate, create draft, confirm)
│   │   ├── schema.py      # GraphQL queries + mutations
│   │   └── fixtures/      # Seed data for Provider, FeeConfig, and Currencies
│   └── core/              # Generic articles (boilerplate, not part of the assignment)
└── frontend/
    └── src/
        ├── apollo/        # Apollo client with JWT auth header
        ├── context/       # AuthContext (token storage, login/logout)
        ├── graphql/       # GQL queries and mutations
        ├── pages/         # ExchangePage, TransactionsPage, LoginPage, RegisterPage
        └── components/    # Layout, auth forms, routing guards
```

### Auth flow

Auth is handled with JWT. On login, a token is stored in `localStorage` and attached to every GraphQL request via an Apollo link. Server-side, `graphql_jwt.middleware.JSONWebTokenMiddleware` resolves the user from the token. All sensitive queries and mutations check `info.context.user.is_anonymous` and return an error if unauthenticated.

### Exchange flow (end-to-end)

1. User selects a currency pair → `requestQuote` mutation → fetches live rate from ExchangeRate-API → persists `ExchangeProviderResponse` + `Quote` (DRAFT, expires in 5 min)
2. User enters an amount → debounced `updateDraftQuote` mutation saves `amount_sent` on the draft
3. User clicks Confirm → `confirmQuote` mutation:
   - Checks expiry; if expired: marks draft as `EXPIRED`, fetches fresh rate, creates new `DRAFT`, returns it to the frontend with `quoteExpired: true` → modal stays open with updated rate and original amount
   - If not expired: computes fee and received amount, sets status to `PENDING`
4. User views history → `myTransactions` query returns `PENDING` + `COMPLETED` quotes for the authenticated user

---

## Tradeoffs

**No token refresh.** JWT tokens from `django-graphql-jwt` expire (default 5 minutes). The frontend does not implement token refresh — the user would need to log in again after expiry. This is a known gap; adding a `refreshToken` call on Apollo link retry would fix it.

**`core` app left in place.** The `core` app (Article model + page) is unused boilerplate from the initial scaffold. It doesn't interfere with the assignment flow but adds noise.

**No input validation on the backend for `amount_sent`.** The frontend prevents submitting with a zero or empty amount, but the backend does not validate that `amount_sent > 0`. A production service would reject invalid amounts at the API layer.

**Single active provider and fee config.** `get_active_provider()` and `get_active_fee()` each return the first active record. There is no multi-provider fallback or fee routing logic. This is intentional simplicity — the model supports it, the service does not need it yet.

**`ExchangeProviderResponse` is never cleaned up.** Every API call creates a log row. Over time this table grows unbounded. A TTL-based cleanup job or archival strategy would be needed in production.

---

## Testing

### Backend (pytest)

```bash
cd backend
source .venv/bin/activate
pytest -v
```

The test suite covers the two most critical layers of the backend:

| File | Type | What it tests |
| --- | --- | --- |
| `exchange/tests/test_services.py` | Unit | `create_draft_quote`, `confirm_quote`, `fetch_exchange_rate` — all HTTP calls mocked |
| `exchange/tests/test_schema.py` | Integration | GraphQL mutations/queries: `requestQuote`, `updateDraftQuote`, `confirmQuote`, `myTransactions`, `currencies` |
| `users/tests/test_schema.py` | Integration | GraphQL register, login (`tokenAuth`), `me` query |

All 26 tests pass. External HTTP calls are mocked with `unittest.mock.patch` so no live API key is required.

---

## What I'd Improve With More Time

- **Token refresh** — implement silent token refresh in the Apollo link so sessions don't expire mid-use
- **Quote expiry on the frontend** — show a countdown timer on the exchange page so the user knows how long their rate is valid before they need to re-fetch
- **Background PENDING → COMPLETED transition** — a Celery task (or Django-Q job) that simulates async transfer processing and moves quotes from `PENDING` to `COMPLETED` after a delay
- **Provider fallback** — if the primary exchange rate provider fails, automatically retry with the next active provider by priority
- **Rate caching** — cache recent exchange rates (e.g. Redis, 60s TTL) to avoid hitting the API on every `requestQuote` for the same currency pair
- **Test coverage** — unit tests for `services.py` (mock the API call) and integration tests for the GraphQL mutations
- **Input validation** — enforce `amount_sent > 0` and valid currency codes server-side
- **Idle quote garbage collection** — a periodic job that marks long-lived `DRAFT` quotes as `EXPIRED` so stale data doesn't accumulate; currently expired drafts are only cleaned up when the user attempts to confirm them
- **Bank account management** — the ability to add a source funding account (to top up balance) and one or more destination accounts (recipient bank details), which would complete the real transfer flow beyond the quote stage
