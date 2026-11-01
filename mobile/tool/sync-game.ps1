param()
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$dirty = & git -C $repo status --porcelain -- src/game.js src/sprites.js
if ($dirty) { throw 'Commit the source game changes before refreshing the mobile snapshot.' }
$revision = (& git -C $repo log -1 --format=%h -- src/game.js src/sprites.js).Trim()
foreach ($file in @('game.js', 'sprites.js')) {
    Copy-Item -LiteralPath (Join-Path $repo "src\$file") -Destination (Join-Path $repo "mobile\assets\game\src\$file")
}
$adapter = Join-Path $repo 'mobile\assets\game\mobile.js'
$content = Get-Content -LiteralPath $adapter -Raw
$content = $content -replace "sourceRevision: '[a-f0-9]+'", "sourceRevision: '$revision'"
Set-Content -LiteralPath $adapter -Value $content -Encoding utf8 -NoNewline
Write-Output "Bundled source $revision. Run the original smoke, mobile smoke and Android integration tests."
