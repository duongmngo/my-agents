# Stops the My Agents dev servers (backend :8000, frontend :3000) and, unless
# -KeepInfra is passed, the my-agents-* Docker containers.
param([switch]$KeepInfra)

$ports = 8000, 3000
# Wrapper processes that belong to a dev server's tree (npm/next/uvicorn/env launchers).
$wrapperPattern = 'uvicorn|npm-cli\.js|npm run dev|next dev|next\\dist|env\.exe|my-agents'

function Get-Proc([int]$id) { Get-CimInstance Win32_Process -Filter "ProcessId=$id" -ErrorAction SilentlyContinue }

foreach ($port in $ports) {
    $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $listener) { Write-Output "port ${port}: nothing listening"; continue }

    # Walk up to the outermost ancestor that is still part of the server, so the
    # uvicorn reloader / npm wrapper dies too instead of respawning or lingering.
    $root = Get-Proc $listener.OwningProcess
    while ($root) {
        $parent = Get-Proc $root.ParentProcessId
        if (-not $parent -or $parent.CommandLine -notmatch $wrapperPattern) { break }
        $root = $parent
    }

    Write-Output "port ${port}: stopping tree rooted at PID $($root.ProcessId) ($($root.Name))"
    taskkill /PID $root.ProcessId /T /F | Out-Null
}

Start-Sleep -Seconds 1
foreach ($port in $ports) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        Write-Output "WARNING: port $port is still in use"
    } else {
        Write-Output "port ${port}: free"
    }
}

if (-not $KeepInfra) {
    $containers = docker ps --filter "name=my-agents-" --format "{{.Names}}"
    if ($containers) {
        docker stop $containers | Out-Null
        Write-Output "stopped containers: $($containers -join ', ')"
    } else {
        Write-Output "no my-agents containers running"
    }
}
