param(
  [int]$Limit = 15,
  [int]$Delay = 90
)

$ErrorActionPreference = "Stop"

$Repo = "C:\Users\franc\FonatProp_Data_Lake\03_apps\realprice-dubai-web"
$SecretPath = Join-Path $env:USERPROFILE ".fonatprop\gmail_app_password.secure.txt"
$LogPath = Join-Path $Repo "outbound\generated\daily_outreach_task.log"

if (-not (Test-Path -LiteralPath $SecretPath)) {
  throw "Missing encrypted Gmail app password at $SecretPath"
}

$secure = Get-Content -LiteralPath $SecretPath | ConvertTo-SecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringUni(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
)

try {
  $env:FONATPROP_GMAIL_APP_PASSWORD = $plain
  Set-Location -LiteralPath $Repo
  "[$(Get-Date -Format o)] Starting FonatProp daily outreach limit=$Limit delay=$Delay" | Out-File -LiteralPath $LogPath -Append -Encoding utf8
  python scripts\fonatprop_daily_outreach.py --limit $Limit --delay $Delay *>> $LogPath
  "[$(Get-Date -Format o)] Finished FonatProp daily outreach" | Out-File -LiteralPath $LogPath -Append -Encoding utf8
}
finally {
  Remove-Item Env:\FONATPROP_GMAIL_APP_PASSWORD -ErrorAction SilentlyContinue
}

