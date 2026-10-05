[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$RepositoryPath
)
$ErrorActionPreference = 'Stop'
$kitRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$bootstrapPath = Join-Path $kitRoot 'BOOTSTRAP.md'
if (-not (Test-Path -LiteralPath $bootstrapPath -PathType Leaf)) {
  throw 'The complete extracted kit must include BOOTSTRAP.md beside its scripts folder.'
}
$requestedPath = (Resolve-Path -LiteralPath $RepositoryPath).Path
if (-not (Test-Path -LiteralPath $requestedPath -PathType Container)) {
  throw 'RepositoryPath must be an existing local PRAXIS checkout or worktree.'
}
$repoRoot = & git -C $requestedPath rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0) { throw 'RepositoryPath must be inside the existing PRAXIS Git checkout.' }
$repoRoot = (Resolve-Path -LiteralPath ([string]$repoRoot).Trim()).Path
$codexCommand = Get-Command codex.cmd -ErrorAction SilentlyContinue
if (-not $codexCommand) { $codexCommand = Get-Command codex -ErrorAction Stop }
$instruction = 'Read the complete portable build instructions at ' + $bootstrapPath + '. Use ' + $kitRoot + ' as kitRoot and the current repository as the PRAXIS checkout. Follow BOOTSTRAP.md, audit the real repository, preserve existing work, and implement and test the ordered SIGNAL phases. Update the durable progress log and accurately record blocked or unverified live checks. Prepare a reviewable release; do not deploy production without authorization.'
$launchArguments = @('--cd', $repoRoot, '--add-dir', $kitRoot, '--sandbox', 'workspace-write', '--ask-for-approval', 'on-request', $instruction)
& $codexCommand.Source @launchArguments
if ($LASTEXITCODE -ne 0) {
  throw ('Codex exited with code ' + $LASTEXITCODE + '. Review its session output before relaunching.')
}
