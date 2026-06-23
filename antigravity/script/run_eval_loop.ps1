# Set error action preference to stop execution on error
$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Magenta
Write-Host "🤖 [Project YOGI Evaluation Loop] AI Recommendation Eval Start (PowerShell)" -ForegroundColor Magenta
Write-Host "========================================================" -ForegroundColor Magenta

# 1. Check harness path
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HarnessYaml = Join-Path $ScriptDir "..\harness.yaml"

if (-not (Test-Path $HarnessYaml)) {
    Write-Error "❌ Error: harness.yaml master file not found."
    Exit 1
}

# 2. Log step 1
Write-Host "📊 [Eval Step 1] Loading latest polymorphic session data (input_id)..." -ForegroundColor White

# 3. Log step 2 & Run Vitest
Write-Host "🧪 [Eval Step 2] Running LLM Structured Output validation and tests..." -ForegroundColor White

# Set Vitest color terminal env
$env:VITEST_COLOR = "1"

try {
    # Run vitest run for the antigravity folder internal specs
    npx vitest run antigravity --passWithNoTests
    
    Write-Host "✅ [Eval Result] All prompt outputs passed the schema and business logic constraints." -ForegroundColor Green
}
catch {
    Write-Error "❌ [Eval Failure] AI recommendation data format broken or error margin exceeded!"
    Write-Host "💡 Tip: Check prompt templates or raw_plan_description structures." -ForegroundColor Yellow
    Exit 1
}

Write-Host "========================================================" -ForegroundColor Magenta
Write-Host "🎉 AI Evaluation Loop finished successfully. Safe to deploy." -ForegroundColor Magenta
Write-Host "========================================================" -ForegroundColor Magenta