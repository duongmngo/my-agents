# My Agents Platform

Multi-tenant AI assistant platform: ChatGPT-like chat, custom agents (LangGraph), knowledge base (RAG), voice, MCP tools.

- `backend/` — FastAPI + SQLAlchemy + Alembic (Python 3.11). See [backend/CLAUDE.md](backend/CLAUDE.md).
- `frontend/` — Next.js 14 App Router + TypeScript + Tailwind + Zustand. See [frontend/CLAUDE.md](frontend/CLAUDE.md).
- `documents/` — architecture, conventions, feature specs, backlog. `documents/development/docker-compose-infra.yml` runs Postgres, Redis, MinIO, Qdrant.

## Running the app

Use the `run-app` skill (`.claude/skills/run-app`). Short version: start the infra containers, `alembic upgrade head`, then uvicorn on :8000 and `npm run dev` on :3000. Seeded logins are in the README's "Default accounts" section (e.g. `admin@demo.com` / `admin123`).

## Conventions

The source of truth is [documents/conventions/](documents/conventions/README.md). Key rules:

- **API JSON is camelCase** in both directions (the conventions index still says snake_case — it is outdated; the code and the detailed docs use camelCase).
- **Tenancy is per workspace.** The frontend sends `X-Workspace-Id` on every request; backend queries must be scoped to the workspace and must verify the user's membership — never trust the client's workspace id alone.
- File names: `snake_case.py` in the backend, `kebab-case.ts(x)` in the frontend.
- Never commit secrets. `.env` files are gitignored; templates live in `backend/env-example` and `documents/development/env-example`.

## Git

- Work on a feature branch, not `main`. Small, focused commits using conventional prefixes (`feat:`, `fix:`, `chore:`, `docs:`), matching the existing history.
- `frontend/tsconfig.tsbuildinfo` is tracked and gets rewritten by `tsc`; restore it (`git checkout -- frontend/tsconfig.tsbuildinfo`) instead of committing the churn.

## Gotchas

- `backend/.env` changes need a manual backend restart — uvicorn `--reload` only watches `.py` files.
- The agents call `load_dotenv()` without `override=True`, so a machine-level `OPENAI_API_KEY` silently wins over `backend/.env`. Check this first on OpenAI 401s.
- Alembic autogenerate diffs against whatever is in your local DB. Review every generated migration and delete operations on unrelated tables (see the `db-migration` skill).
- The frontend persists the current workspace in localStorage. After recreating the DB, a stale workspace id causes 400/403s until it falls back to a valid one.
