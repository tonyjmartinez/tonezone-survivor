param()
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
& node (Join-Path $repo 'tools\package-game.cjs') mobile
if ($LASTEXITCODE -ne 0) { throw 'Shared game packaging failed.' }
