[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$RepositoryPath,
  [Parameter(Mandatory = $true)][string]$WorktreePath,
  [string]$BranchName = 'feature/praxis-signal',
  [string]$BaseRef = 'HEAD'
)
$ErrorActionPreference = 'Stop'
$repoPath = (Resolve-Path -LiteralPath $RepositoryPath).Path
$kitPath = Split-Path -Parent $PSScriptRoot
if (-not [System.IO.Path]::IsPathRooted($WorktreePath)) { throw 'Use an absolute WorktreePath so Git and PowerShell resolve the same destination.' }
if ([string]::IsNullOrWhiteSpace($BaseRef) -or $BaseRef.StartsWith('-')) { throw 'Use a named branch or commit as BaseRef.' }
if (Test-Path -LiteralPath $WorktreePath) { throw 'Worktree destination already exists. Choose an empty new path.' }
if (-not (Test-Path -LiteralPath (Join-Path $kitPath 'START_HERE.md'))) { throw 'Keep this script inside the extracted build kit.' }
$repoRoot = & git -C $repoPath rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0) { throw 'RepositoryPath is not a Git checkout.' }
$dirty = & git -C $repoPath status --porcelain
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect repository status.' }
if ($dirty) { throw 'The baseline checkout has changes. Checkpoint or resolve your intended work first; no changes were discarded.' }
& git -C $repoPath check-ref-format --branch $BranchName
if ($LASTEXITCODE -ne 0) { throw 'Invalid feature branch name.' }
& git -C $repoPath rev-parse --verify ($BaseRef + '^{commit}')
if ($LASTEXITCODE -ne 0) { throw 'BaseRef does not resolve to a commit.' }
& git -C $repoPath worktree add -b $BranchName $WorktreePath $BaseRef
if ($LASTEXITCODE -ne 0) { throw 'Git could not create the new worktree. Existing branches were not overwritten.' }
$destination = Join-Path $WorktreePath 'docs/signal-build'
if (Test-Path -LiteralPath $destination) { throw 'The baseline already contains docs/signal-build. Reuse or reconcile it manually; nothing was overwritten.' }
New-Item -ItemType Directory -Path $destination -Force | Out-Null
Get-ChildItem -LiteralPath $kitPath -Force | Where-Object { $_.Name -notlike '*.sqlite*' -and $_.Name -notlike '*.db' -and $_.Name -notlike '.env*' -and $_.Name -notin @('.git', 'node_modules', 'qa') } | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $destination -Recurse
}
Write-Host ('Worktree ready: ' + $WorktreePath)
Write-Host 'Root repository instructions were preserved. No packages installed, commits pushed or deployments performed.'
Write-Host 'Open PowerShell in the worktree, run codex, and paste docs/signal-build/codex/START_PROMPT.md.'
