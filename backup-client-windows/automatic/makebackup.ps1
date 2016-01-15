$PSScriptRoot = ($MyInvocation.MyCommand.Path | Split-Path | Resolve-Path).ProviderPath

$filename = (Get-Date -uformat %a)
$filename = "backup-"+$filename+".zip"

function create-7zip([String] $aDirectory, [String] $aZipfile){
    [string]$pathToZipExe = "$($Env:SystemDrive)\OCBACKUP\7za.exe";
    [Array]$arguments = "a", "-tzip", "$aZipfile", "$aDirectory", "-r";
    & $pathToZipExe $arguments;
}

Remove-Item -Recurse -Force "$($Env:windir)\temp\$($filename)"

# Define your folders here
create-7zip "C:\some folder\some dir a" "$($Env:windir)\temp\$($filename)"
create-7zip "C:\some folder\some dir b" "$($Env:windir)\temp\$($filename)"

# Define ownCloud user, password and url here
$curlCmd = '"$($Env:SystemDrive)\OCBACKUP\curl.exe" -u USERNAME:PASSWORD -T "$($Env:windir)\temp\$($filename)" https://OWNCLOUD_SERVER_DOMAIN/remote.php/webdav/'
Invoke-Expression "& $curlCmd"
Remove-Item -Recurse -Force "$($Env:windir)\temp\$($filename)"
exit
