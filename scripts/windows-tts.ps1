# Speaks each narration line with a voice built into Windows (free, offline) and saves one WAV per line.
# Called by `npm run voice -- hemisphere --engine=windows`; it passes a JSON list of { key, say }.
param(
  [Parameter(Mandatory = $true)][string]$LinesJson,
  [Parameter(Mandatory = $true)][string]$OutDir,
  [string]$Voice = "Microsoft Mark",
  [double]$Rate = 0.95
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
[void][Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]

# Windows speech APIs are asynchronous; this waits for one result.
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() |
  Where-Object { $_.Name -eq "AsTask" -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } |
  Select-Object -First 1
function Await($operation, [Type]$resultType) {
  $task = $asTask.MakeGenericMethod($resultType).Invoke($null, @($operation))
  [void]$task.Wait(-1)
  $task.Result
}

$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$chosen = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.DisplayName -eq $Voice } | Select-Object -First 1
if (-not $chosen) { throw "Voice '$Voice' is not installed. Installed: $(([Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | ForEach-Object DisplayName) -join ', ')" }
$synth.Voice = $chosen
$synth.Options.SpeakingRate = $Rate
# Ask Windows to report when each word starts, so videos can show words in sync with the voice.
try { $synth.Options.IncludeWordBoundaryMetadata = $true } catch { }

New-Item -ItemType Directory -Force $OutDir | Out-Null
$lines = Get-Content -Raw -Encoding UTF8 $LinesJson | ConvertFrom-Json
foreach ($line in $lines) {
  $stream = Await ($synth.SynthesizeTextToStreamAsync($line.say)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $reader = New-Object Windows.Storage.Streams.DataReader ($stream.GetInputStreamAt(0))
  [void](Await ($reader.LoadAsync([uint32]$stream.Size)) ([uint32]))
  $bytes = New-Object byte[] ([int]$stream.Size)
  $reader.ReadBytes($bytes)
  [IO.File]::WriteAllBytes((Join-Path $OutDir "$($line.key).wav"), $bytes)
  # Word timings (seconds from the start of the clip), saved next to the audio when Windows provides them.
  $words = @()
  try {
    foreach ($track in $stream.TimedMetadataTracks) {
      foreach ($cue in $track.Cues) { $words += [pscustomobject]@{ start = [math]::Round($cue.StartTime.TotalSeconds, 3); text = $cue.Text } }
    }
  } catch { }
  if ($words.Count -gt 0) {
    $json = ConvertTo-Json -InputObject @($words) -Compress
    [IO.File]::WriteAllText((Join-Path $OutDir "$($line.key).words.json"), $json, (New-Object Text.UTF8Encoding $false))
  }
  Write-Output "  ok $($line.key) ($($words.Count) word times)"
}
