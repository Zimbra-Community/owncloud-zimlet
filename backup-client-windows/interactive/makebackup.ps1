$PSScriptRoot = ($MyInvocation.MyCommand.Path | Split-Path | Resolve-Path).ProviderPath

$filename = (Get-Date -uformat %a)
$filename = "backup-"+$filename+".zip"

$ConfigFileloc = ("$($Env:SystemDrive)\OCBACKUP\config.xml")
[xml]$ConfigFile = (Get-Content $ConfigFileLoc)


function create-7zip([String] $aDirectory, [String] $aZipfile){
    [string]$pathToZipExe = "$($Env:SystemDrive)\OCBACKUP\7za.exe";
    [Array]$arguments = "a", "-tzip", "$aZipfile", "$aDirectory", "-r";
    & $pathToZipExe $arguments;
}

Remove-Item -Recurse -Force "$($Env:windir)\temp\$($filename)"

if ( Test-Path $ConfigFile.Configuration.General.backupFolder -PathType Any)
{
   create-7zip $ConfigFile.Configuration.General.backupFolder "$($Env:windir)\temp\$($filename)"
}

#if ( Test-Path $ConfigFile.Configuration.General.backupFolder2 -PathType Any)
#{
#   create-7zip $ConfigFile.Configuration.General.backupFolder2 "$($Env:windir)\temp\$($filename)"
#}

$curlCmd = '"$($Env:SystemDrive)\OCBACKUP\curl.exe" -u $ConfigFile.Configuration.General.credentials -T "$($Env:windir)\temp\$($filename)" $ConfigFile.Configuration.General.url'
Invoke-Expression "& $curlCmd"
Remove-Item -Recurse -Force "$($Env:windir)\temp\$($filename)"
exit
