# 로또 랩 당첨번호 주간 자동 갱신 (Windows 작업 스케줄러용).
#
#   갱신 -> 커밋 -> main 푸시 -> GitHub Actions 가 Pages 에 배포
#
# 등록/해제 명령은 README 의 "자동 실행" 절 참고. 로그는 저장소 바깥
# (..\lotto-update.log) 에 쌓이고 1MB 를 넘으면 .1 로 한 번 밀어둔다.
#
# 이 파일은 UTF-8 BOM 으로 저장해야 한다. Windows PowerShell 5.1 은 BOM 이 없으면
# .ps1 을 CP949 로 읽어 아래 한글이 전부 깨지고 파싱 자체가 실패한다.
#
# 안전장치 - 아래 중 하나라도 걸리면 아무것도 하지 않고 종료한다.
#   - 현재 브랜치가 main 이 아님
#   - 워킹트리에 커밋 안 된 변경이 있음
#   - origin/main 과 갈라져 fast-forward 불가
#   - 갱신 스크립트가 0 이 아닌 코드로 끝남 (응답 검증 실패 포함)
#   - lottoData.js 말고 다른 파일이 바뀜

$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$log = Join-Path (Split-Path -Parent $repo) 'lotto-update.log'
$data = 'app/src/data/lottoData.js'

function Write-Log($msg) {
    $line = '{0}  {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    Write-Output $line
    try { Add-Content -Path $log -Value $line -Encoding utf8 } catch {}
}

function Stop-With($msg) {
    Write-Log "중단: $msg"
    exit 1
}

if (Test-Path $log) {
    if ((Get-Item $log).Length -gt 1MB) { Move-Item $log "$log.1" -Force }
}

Set-Location $repo
Write-Log '--- 시작 ---'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Stop-With 'git 을 찾을 수 없습니다' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Stop-With 'node 를 찾을 수 없습니다' }

$branch = (git rev-parse --abbrev-ref HEAD | Out-String).Trim()
if ($branch -ne 'main') { Stop-With "현재 브랜치가 '$branch' 입니다 (main 에서만 돕니다)" }

if (git status --porcelain) { Stop-With '워킹트리에 커밋 안 된 변경이 있습니다' }

git fetch origin --quiet
if ($LASTEXITCODE -ne 0) { Stop-With 'git fetch 실패 (네트워크나 자격증명 확인)' }

git merge --ff-only origin/main --quiet
if ($LASTEXITCODE -ne 0) { Stop-With 'origin/main 과 갈라져 있어 fast-forward 할 수 없습니다' }

# 네이티브 명령에 2>&1 을 쓰면 PS 5.1 이 정상 출력까지 오류로 감싸므로 파일로 받는다
$outFile = Join-Path $env:TEMP 'lotto-update-out.txt'
$errFile = Join-Path $env:TEMP 'lotto-update-err.txt'

Write-Log '갱신 스크립트 실행'
$p = Start-Process -FilePath 'node' -ArgumentList 'app/scripts/update-data.mjs' `
    -WorkingDirectory $repo -NoNewWindow -Wait -PassThru `
    -RedirectStandardOutput $outFile -RedirectStandardError $errFile

$out = @()
if (Test-Path $outFile) { $out = @(Get-Content $outFile -Encoding utf8) }
foreach ($line in $out) { if ($line.Trim()) { Write-Log "  $line" } }

if ($p.ExitCode -ne 0) {
    if (Test-Path $errFile) {
        foreach ($line in (Get-Content $errFile -Encoding utf8)) {
            if ($line.Trim()) { Write-Log "  ! $line" }
        }
    }
    Stop-With "갱신 스크립트가 실패했습니다 (exit $($p.ExitCode))"
}

$changed = @(git status --porcelain)
if (-not $changed) {
    Write-Log '새 회차 없음 — 끝'
    exit 0
}

# 데이터 파일 하나만 바뀌어야 한다. 그 외는 사람이 봐야 할 상황
$paths = @($changed | ForEach-Object { $_.Substring(3).Trim() })
$unexpected = @($paths | Where-Object { $_ -ne $data })
if ($unexpected.Count -gt 0) { Stop-With "예상 밖 파일이 바뀌었습니다: $($unexpected -join ', ')" }

$m = [regex]::Match(($out -join "`n"), '(\d+)개 회차 추가 \((\d+)~(\d+)회\)')
if ($m.Success) {
    $subject = 'data: 로또 당첨번호 {0}~{1}회 추가' -f $m.Groups[2].Value, $m.Groups[3].Value
} else {
    $subject = 'data: 로또 당첨번호 갱신'
}

git add $data
git commit --quiet -m $subject -m '주간 자동 갱신 (scripts/auto-update.ps1, 작업 스케줄러).'
if ($LASTEXITCODE -ne 0) { Stop-With 'git commit 실패' }

git push origin main --quiet
if ($LASTEXITCODE -ne 0) { Stop-With 'git push 실패 (자격증명이 만료됐는지 확인하세요). 커밋은 로컬에 남아 있습니다' }

Write-Log "$subject — push 완료. Actions 가 배포합니다."
exit 0
