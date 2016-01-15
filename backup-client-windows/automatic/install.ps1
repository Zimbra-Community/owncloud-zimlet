$PSScriptRoot = ($MyInvocation.MyCommand.Path | Split-Path | Resolve-Path).ProviderPath

# Install files into $($Env:SystemDrive)
Remove-Item -Recurse -Force "$($Env:SystemDrive)\OCBACKUP"
mkdir "$($Env:SystemDrive)\OCBACKUP"
Copy-Item $PSScriptRoot\* "$($Env:SystemDrive)\OCBACKUP\"

# Create scheduled task
$delTaskCmd = "schtasks /delete /tn ownCloud /f"
$createTaskCmd = 'schtasks /create /XML "$($Env:SystemDrive)\OCBACKUP\task.xml" /tn ownCloud'
Invoke-Expression "& $delTaskCmd"
Invoke-Expression "& $createTaskCmd"

Write-Host "You can now close this window"
