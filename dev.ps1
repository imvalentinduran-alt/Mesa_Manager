# dev.ps1 — Arranca backend (FastAPI) y frontend (Vite) en ventanas separadas.
# Uso: .\dev.ps1
# Requiere: Python en PATH, Node/npm en PATH, PostgreSQL corriendo.

$Root = $PSScriptRoot

Write-Host ""
Write-Host "  Mesa Manager - Entorno de desarrollo" -ForegroundColor Cyan
Write-Host "  -------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# ── 1. Backend ────────────────────────────────────────────────────────────────
Write-Host "  [1/2] Iniciando backend FastAPI en :8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$Root'; `$host.UI.RawUI.WindowTitle = 'Mesa Manager - Backend'; python api/main.py"

# ── 2. Esperar a que el backend responda ──────────────────────────────────────
Write-Host "        Esperando que el backend esté listo..." -ForegroundColor DarkGray
$intentos = 0
$listo    = $false
while ($intentos -lt 20 -and -not $listo) {
    Start-Sleep -Milliseconds 800
    $intentos++
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $listo = $true }
    } catch {}
}

if (-not $listo) {
    Write-Host ""
    Write-Host "  ERROR: El backend no respondio en 16 s." -ForegroundColor Red
    Write-Host "  Revisa la ventana del backend para ver el error." -ForegroundColor Red
    Write-Host ""
    Read-Host "  Presiona Enter para salir"
    exit 1
}

Write-Host "        Backend listo." -ForegroundColor Green
Write-Host ""

# ── 3. Frontend ───────────────────────────────────────────────────────────────
Write-Host "  [2/2] Iniciando frontend Vite en :5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$Root'; `$host.UI.RawUI.WindowTitle = 'Mesa Manager - Frontend'; npm run dev"

Start-Sleep -Milliseconds 1500
Write-Host "        Frontend arrancando." -ForegroundColor Green
Write-Host ""
Write-Host "  App disponible en: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend API en:    http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Cierra las ventanas de Backend y Frontend para detener el entorno." -ForegroundColor DarkGray
Write-Host ""
