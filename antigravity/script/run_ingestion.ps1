# 에러 발생 시 스크립트를 즉시 중단하도록 설정
$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "🚀 [Project YOGI Ingestion Pipeline] 수집 프로세스 시작 (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. 현재 스크립트 기준 경로 및 설정 로드
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PipelineEnv = Join-Path $ScriptDir "..\config\pipeline_env.json"

if (-not (Test-Path $PipelineEnv)) {
    Write-Error "❌ 에러: pipeline_env.json 파일을 찾을 수 없습니다."
    Exit 1
}

# 2. 실행 환경 확인 (JSON 데이터를 읽어 환경 변수 추출)
$EnvJson = Get-Content $PipelineEnv -Raw -Encoding UTF8 | ConvertFrom-Json
$RunEnv = if ($EnvJson.NODE_ENV) { $EnvJson.NODE_ENV } else { "development" }
Write-Host "ℹ️ 현재 구동 환경: $RunEnv" -ForegroundColor Yellow

# 3. 백오프 및 재시도 변수 세팅
$MaxRetries = 3
$RetryCount = 0
$Success = $false

# 4. Ingestion & Validation 실행 루프
while ($RetryCount -lt $MaxRetries) {
    $CurrentAttempt = $RetryCount + 1
    Write-Host "🔄 [Step 1/2] 외부 API 데이터 수집 및 1차 백업 중... (시도: $CurrentAttempt / $MaxRetries)" -ForegroundColor White
    
    try {
        # NestJS 텔레메트리 잉제스천 실행
        npm run telemetry:ingest
        
        Write-Host "✅ [Step 1/2] 원천 데이터 백업 완료 (Plan.raw_plan_description 적재 성공)" -ForegroundColor Green
        $Success = $true
        break
    }
    catch {
        $RetryCount++
        if ($RetryCount -lt $MaxRetries) {
            $BackoffDelay = $RetryCount * 5
            Write-Warning "⚠️ 경고: 수집 파이프라인 실패. ${BackoffDelay}초 후 재시도합니다..."
            Start-Sleep -Seconds $BackoffDelay
        }
    }
}

if (-not $Success) {
    Write-Error "❌ 치명적 에러: 최대 재시도 횟수를 초과하여 수집 파이프라인이 중단되었습니다."
    Exit 1
}

# 5. 데이터 검증 및 최종 구조 적재 (Transform) 단계
Write-Host "🔄 [Step 2/2] 수집된 데이터 검증 및 다형성 스키마 파싱 정제 시작..." -ForegroundColor White
try {
    npm run telemetry:transform
    Write-Host "✅ [Step 2/2] 정제 및 PostgreSQL TIMESTAMPTZ 반영 완료!" -ForegroundColor Green
}
catch {
    Write-Error "❌ 에러: 데이터 변환/검증 단계에서 실패했습니다. 스키마 오염을 확인하세요."
    Exit 1
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "🎉 Ingestion 파이프라인이 성공적으로 완료되었습니다." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan