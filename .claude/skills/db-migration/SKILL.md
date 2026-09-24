---
name: db-migration
description: Create, review and apply Alembic migrations for the backend. Use when a SQLAlchemy model changes, a table or column is added, or data needs seeding.
---

# Database migrations

Migrations live in `backend/alembic/versions/` and are numbered sequentially (`001_…`, `002_…`). Run commands from `backend/`.

## Create

Autogenerate from model changes. `alembic/env.py` assigns the next number automatically:

```bash
venv/Scripts/alembic.exe revision --autogenerate -m "add something"
```

For a hand-written migration (data or seeding), pass the next number yourself:

```bash
venv/Scripts/alembic.exe revision -m "seed something" --rev-id 008
```

## Review (required)

Autogenerate compares the models against **your local database**, not against the migration history. Before applying, read the whole generated file and remove anything that isn't part of your change:

- `drop_table` or `create_table` for tables the app doesn't own. Leftovers from other projects in the same Postgres, such as `strapi_*` tables, have shipped by mistake before.
- `alter_column` operations that only change `server_default` on columns you didn't touch.
- The matching operations in `downgrade()`.

Make sure the migration also works on a **fresh** database: never assume a table or column exists unless an earlier migration creates it.

## Apply and verify

```bash
venv/Scripts/alembic.exe upgrade head
venv/Scripts/alembic.exe current          # should print the new head
venv/Scripts/alembic.exe downgrade -1 && venv/Scripts/alembic.exe upgrade head   # round-trip check
```

Seed migrations must be idempotent. Skip rows that already exist, as `007_seed_default_accounts.py` does, and remove exactly what they added in `downgrade()`.

If you add or change seeded accounts, update the "Default accounts" table in `README.md`.
