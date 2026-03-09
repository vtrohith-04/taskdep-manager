# PowerShell script to run the project in one terminal and open browser
# Prerequisites: npm i (to install concurrently at root level)

Write-Host "Starting Task Dependency Manager..." -ForegroundColor Green

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not available. Please reinstall Node.js." -ForegroundColor Red
    exit 1
}

# Check if concurrently is installed
if (-not (Test-Path "node_modules/concurrently")) {
    Write-Host "Installing concurrently..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install concurrently. Check your internet connection." -ForegroundColor Red
        exit 1
    }
}

# Check and install server dependencies
if (-not (Test-Path "server/node_modules")) {
    Write-Host "Installing server dependencies..." -ForegroundColor Yellow
    cd server
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install server dependencies." -ForegroundColor Red
        exit 1
    }
    cd ..
}

# Check and install client dependencies
if (-not (Test-Path "client/node_modules")) {
    Write-Host "Installing client dependencies..." -ForegroundColor Yellow
    cd client
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install client dependencies." -ForegroundColor Red
        exit 1
    }
    cd ..
}

# Check if MongoDB is running (basic check)
$mongoRunning = $false
try {
    $mongoCheck = Test-NetConnection -ComputerName localhost -Port 27017 -ErrorAction Stop
    if ($mongoCheck.TcpTestSucceeded) {
        $mongoRunning = $true
    }
} catch {
    # Ignore errors, will warn later
}

if (-not $mongoRunning) {
    Write-Host "WARNING: MongoDB doesn't appear to be running on localhost:27017" -ForegroundColor Yellow
    Write-Host "   Make sure MongoDB is installed and running, or update MONGO_URI in server/.env" -ForegroundColor Yellow
    Write-Host "   Continuing anyway..." -ForegroundColor Yellow
}

# Open browser after servers start
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 5
    try {
        Start-Process "http://localhost:5173"
        Write-Host "Browser opened at http://localhost:5173" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not open browser automatically" -ForegroundColor Yellow
    }
}

# Run both servers concurrently in the foreground
Write-Host "Launching servers..." -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop all servers" -ForegroundColor Cyan
concurrently --names "SERVER,CLIENT" --prefix "[{name}]" --kill-others `
    "cd server && npm run dev" `
    "cd client && npm run dev"