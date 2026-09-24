# Backend (FastAPI)

Full rules: [documents/conventions/backend/](../documents/conventions/README.md). This file is the short version.

## Layout

- `app/api/v1/` — routers (thin). Request/response DTOs live in `app/api/v1/dtos/`.
- `app/services/` — business logic. Returns `{"success": bool, "data": ..., "error": str, "message": str}`.
- `app/repositories/` — the only layer that touches the DB session.
- `app/models/` — SQLAlchemy models. `app/core/` — config, security, dependencies, websocket.
- `app/ai/` — LangGraph agents (`agents/`), embeddings, tools. `alembic/versions/` — numbered migrations.

## Layering rules

- Router → its service → that service's repository. Routers never call repositories; a service never uses another domain's repository (call that domain's service instead).
- Sessions come from `db: Session = Depends(get_db)` and are passed down. Never create `SessionLocal()` in routers or services.
- Workspace scoping: use the dependencies in `app/core/dependencies.py` (`get_workspace_id_from_header`, `get_current_workspace`, `get_workspace_member`, …). They read `X-Workspace-Id` and verify membership. Every workspace-owned query filters by `workspace_id`.

## API shape

- JSON is camelCase. DTOs keep snake_case Python attributes with camelCase aliases, e.g. `agent_id: Optional[str] = Field(None, alias="agentId")`, on a base model with `populate_by_name = True` and `from_attributes = True`.
- Map service errors to `HTTPException` in the router with the right status code; don't leak internal exception text.

## Commands (Windows, from `backend/`)

```bash
venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000   # run
venv/Scripts/alembic.exe upgrade head                                   # migrate
venv/Scripts/python.exe -c "import app.main"                            # quick import check
```

There is no automated test suite yet. Verify changes by running the API and exercising the endpoint (interactive docs at http://localhost:8000/docs).

## Migrations

Use the `db-migration` skill. Never edit a migration that is already on `main` unless it is broken for fresh databases.

## Style

PEP 8, 4-space indent, type hints, docstrings on public functions and classes. Import order: stdlib, third-party, local.
