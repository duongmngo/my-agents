# Coding Conventions

Standards and guidelines for consistent code across the project.

## Structure

```
conventions/
├── backend/      # Python/FastAPI conventions
├── frontend/     # TypeScript/React conventions
└── general/      # Cross-cutting standards
```

## Backend Conventions

| File | Description |
|------|-------------|
| [api_convention.md](backend/api_convention.md) | API design patterns and REST conventions |
| [api-field-conventions.md](backend/api-field-conventions.md) | Field naming and data type standards |
| [backend-conventions.md](backend/backend-conventions.md) | General Python/FastAPI practices |
| [01-service-implementation.md](backend/01-service-implementation.md) | Service layer patterns |
| [02-workspace-api-integration.md](backend/02-workspace-api-integration.md) | Workspace scoping patterns |
| [03-api-dto-standardization.md](backend/03-api-dto-standardization.md) | DTO and schema standards |

## Frontend Conventions

| File | Description |
|------|-------------|
| [frontend-conventions.md](frontend/frontend-conventions.md) | React/TypeScript patterns |

## General

| File | Description |
|------|-------------|
| [backend-architecture.md](general/backend-architecture.md) | System architecture overview |
| [general-best-practices.md](general/general-best-practices.md) | Cross-cutting best practices |

## Quick Reference

### API Naming
- Use `snake_case` for JSON fields
- Use plural nouns for collections: `/api/v1/notes`
- Use `workspace_id` parameter for tenant scoping

### Code Style
- Backend: Follow PEP 8, use type hints
- Frontend: ESLint + Prettier, prefer TypeScript strict mode
