param([string]$JavaHome = '')
$ErrorActionPreference = 'Stop'
if ($env:K_SERVICE) { throw 'This harness is local-only.' }
foreach ($port in @(9099, 8080, 4400)) {
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
    throw "Port $port is occupied. Preserve the existing process; do not start another emulator."
  }
}
if ($JavaHome) {
  if (-not (Test-Path -LiteralPath (Join-Path $JavaHome 'bin/java.exe'))) { throw 'Supply a Java 21+ JDK directory.' }
  $env:JAVA_HOME = (Resolve-Path -LiteralPath $JavaHome).Path
  $env:Path = "$(Join-Path $env:JAVA_HOME 'bin');$env:Path"
}
$argsForFirebase = @('emulators:start', '--only', 'auth,firestore', '--project', 'demo-praxis-local', '--config', 'firebase.emulators.json', '--export-on-exit', 'output/followup/emulator-data')
if (Test-Path -LiteralPath 'output/followup/emulator-data/firebase-export-metadata.json') {
  $argsForFirebase += @('--import', 'output/followup/emulator-data')
}
# Explicit demo project prevents an inherited production project from being selected.
& npx.cmd --no-install firebase @argsForFirebase
exit $LASTEXITCODE
