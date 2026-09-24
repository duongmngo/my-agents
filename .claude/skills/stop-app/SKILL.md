---
name: stop-app
description: Stop the locally running My Agents stack (FastAPI backend on :8000, Next.js frontend on :3000, and the my-agents-* Docker containers). Use when asked to stop, kill or shut down the app, or to free ports 8000/3000.
---

# Stop the app

Verified on Windows (Git Bash). Run from the repo root:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/stop-app/stop-app.ps1
```

The script:

1. Finds the process listening on :8000 and :3000. It walks up to the outermost process that still belongs to the server (the uvicorn `--reload` supervisor, `env -u OPENAI_API_KEY`, and the `npm run dev` and `next dev` wrappers), then runs `taskkill /T /F` on that tree. Killing only the listener PID leaves the parent processes running.
2. Checks that both ports are free.
3. Runs `docker stop` on the `my-agents-*` containers. Their data is kept, and `run-app` starts them again. Containers from other projects, such as `gamekami_*`, are left running.

If the user wants to stop only the servers and keep the infra running (for example, before a backend restart), add `-KeepInfra`.

The script stops the servers even when the user started them in their own VS Code terminal. If the request is only to "kill what Claude started", check the parent chain first (`Get-CimInstance Win32_Process`). A server whose ancestor is `OpenConsole.exe` and has no `claude` shell-snapshot in its command line was started by the user, so ask before stopping it.
