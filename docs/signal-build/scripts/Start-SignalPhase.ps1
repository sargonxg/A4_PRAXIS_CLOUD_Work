[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^(0[0-9]|1[01])$')][string]$Phase,
  [switch]$NonInteractive
)
$ErrorActionPreference = 'Stop'
$repoRoot = & git rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0) { throw 'Run this launcher from inside the PRAXIS worktree.' }
$repoRoot = ([string]$repoRoot).Trim()
$kitRelative = 'docs/signal-build'
$phaseDirectory = Join-Path $repoRoot ($kitRelative + '/codex/phases')
$phaseFiles = @(Get-ChildItem -LiteralPath $phaseDirectory -Filter ($Phase + '_*.md') -File)
if ($phaseFiles.Count -ne 1) { throw 'Expected one phase file. Check that the complete kit is installed.' }
$phaseRelative = $kitRelative + '/codex/phases/' + $phaseFiles[0].Name
$instruction = 'Read the active repository instructions, docs/signal-build/codex/CONTROLLER.md and docs/signal/PROGRESS.md if present. Execute ' + $phaseRelative + '. Implement and test the complete phase, update durable progress, and report verified results and blocked checks. Do not deploy production.'
$codexCommand = Get-Command codex.cmd -ErrorAction SilentlyContinue
if (-not $codexCommand) { $codexCommand = Get-Command codex -ErrorAction Stop }
Push-Location -LiteralPath $repoRoot
try {
  if ($NonInteractive) {
    $reports = Join-Path $repoRoot 'docs/signal/session-reports'
    New-Item -ItemType Directory -Path $reports -Force | Out-Null
    $reportPath = Join-Path $reports ($Phase + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.md')
    & $codexCommand.Source exec --sandbox workspace-write --output-last-message $reportPath $instruction
  } else {
    & $codexCommand.Source --sandbox workspace-write --ask-for-approval on-request $instruction
  }
  if ($LASTEXITCODE -ne 0) { throw ('Codex exited with code ' + $LASTEXITCODE + '. Inspect its report before advancing.') }
} finally { Pop-Location }
