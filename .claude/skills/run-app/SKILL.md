---
name: run-app
description: Start the My Agents stack locally (Docker infra, Alembic migrations, FastAPI backend, Next.js frontend) and smoke-test it. Use when asked to run, start or restart the app, or to check a change in the running app.
---

# Run the app

Verified on Windows (Git Bash). Paths are relative to the repo root.

## 1. Infrastructure

```bash
docker start my-agents-postgres my-agents-redis my-agents-minio my-agents-qdrant \
  || docker compose -f documents/development/docker-compose-infra.yml up -d
```

Host ports: Postgres 5433, Redis 6380, MinIO 9002/9003, Qdrant 6333/6334.

## 2. Backend

First time only: `python -m venv backend/venv`, then `backend/venv/Scripts/pip install -r backend/requirements.txt`, then `cp backend/env-example backend/.env` and set `OPENAI_API_KEY`.

```bash
cd backend && venv/Scripts/alembic.exe upgrade head
```

Then start it as a **background** command. The `env -u` prefix drops any shell/machine-level variable that `backend/.env` also defines (e.g. a machine-wide `OPENAI_API_KEY`), because both `pydantic-settings` and the agents' `load_dotenv()` would otherwise let the process environment win over `.env`:

```bash
cd backend && env $(grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' .env | sed 's/=$//; s/^/-u /') \
  venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If migrations fail with "Can't locate revision" or "already exists" errors, the local DB has drifted from the migration history. **Ask the user before** recreating it, because it deletes their local data:

```bash
docker exec my-agents-postgres psql -U postgres -c "DROP DATABASE my_agents_db" -c "CREATE DATABASE my_agents_db"
```

## 3. Frontend

First time only: `cd frontend && npm install`. Then start it as a **background** command:

```bash
cd frontend && npm run dev
```

## 4. Smoke test

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/docs        # 200
curl -s -L -o /dev/null -w "%{http_code}\n" http://localhost:3000          # 200 (redirects to /en)
curl -s -X POST http://localhost:8000/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"admin@demo.com","password":"admin123"}' | head -c 80  # {"success":true,...
```

To call authenticated endpoints, send `Authorization: Bearer <tokens.accessToken>` and `X-Workspace-Id: <id from GET /api/v1/workspaces/>`.

## Restarting and troubleshooting

- **Restart the backend** after any `backend/.env` change, because `--reload` ignores it. On Windows, find the PID with `netstat -ano | grep ":8000 .*LISTENING"` and stop the whole tree with `taskkill /PID <pid> /T /F`.
- **Wrong env values / OpenAI 401:** if the backend was started without the `env -u …` prefix from step 2, a machine-level `OPENAI_API_KEY` (or any other variable set in the shell) overrides `.env`. Restart it with that command.
- **Next.js env changes** (`frontend/.env.local`) need `npm run dev` restarted. The frontend reads `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`, and falls back to `localhost:8000` when they're unset.
