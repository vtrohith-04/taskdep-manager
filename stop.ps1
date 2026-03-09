# PowerShell script to stop all running processes for the project

Write-Host "🛑 Stopping Task Dependency Manager..." -ForegroundColor Yellow

# Kill processes on common ports
$ports = @(5000, 5173)  # Server and client ports

foreach ($port in $ports) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
                 Where-Object { $_.State -eq "Listen" } |
                 ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }

    if ($processes) {
        foreach ($process in $processes) {
            Write-Host "   Killing process $($process.Name) (PID: $($process.Id)) on port $port" -ForegroundColor Cyan
            Stop-Process -Id $process.Id -Force
        }
    }
}

# Kill any remaining node processes (be careful with this)
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Found $($nodeProcesses.Count) node process(es). Force killing all..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
}

# Clean up any background jobs from run.ps1
Get-Job | Remove-Job -Force

Write-Host "✅ All processes stopped." -ForegroundColor Green