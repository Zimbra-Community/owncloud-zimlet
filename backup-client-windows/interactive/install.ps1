$PSScriptRoot = ($MyInvocation.MyCommand.Path | Split-Path | Resolve-Path).ProviderPath

# Install files into $($Env:SystemDrive)
Remove-Item -Recurse -Force "$($Env:SystemDrive)\OCBACKUP"
mkdir "$($Env:SystemDrive)\OCBACKUP"
Copy-Item $PSScriptRoot\* "$($Env:SystemDrive)\OCBACKUP\"

# Configure ownCloud credentials and backup time
[System.Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null
[System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms") | Out-Null
$objForm = New-Object System.Windows.Forms.Form 
$objForm.Text = "Configure ownCloud backup"
$objForm.Size = New-Object System.Drawing.Size(300,300) 
$objForm.StartPosition = "CenterScreen"

$objForm.KeyPreview = $True
$objForm.Add_KeyDown({if ($_.KeyCode -eq "Enter") 
    {$x=$username.Text;$objForm.Close()}})
$objForm.Add_KeyDown({if ($_.KeyCode -eq "Escape") 
    {$objForm.Close()}})

$OKButton = New-Object System.Windows.Forms.Button
$OKButton.Location = New-Object System.Drawing.Size(75,220)
$OKButton.Size = New-Object System.Drawing.Size(75,23)
$OKButton.Text = "OK"
$OKButton.Add_Click({$x=$username.Text;$u = $password.Text; $objForm.Close()})
$objForm.Controls.Add($OKButton)

$CancelButton = New-Object System.Windows.Forms.Button
$CancelButton.Location = New-Object System.Drawing.Size(150,220)
$CancelButton.Size = New-Object System.Drawing.Size(75,23)
$CancelButton.Text = "Cancel"
$CancelButton.Add_Click({$objForm.Close()})
$objForm.Controls.Add($CancelButton)

$usernameLbl = New-Object System.Windows.Forms.Label
$usernameLbl.Location = New-Object System.Drawing.Size(10,20) 
$usernameLbl.Size = New-Object System.Drawing.Size(280,20) 
$usernameLbl.Text = "ownCloud username:"
$objForm.Controls.Add($usernameLbl) 

$username = New-Object System.Windows.Forms.TextBox 
$username.Location = New-Object System.Drawing.Size(10,40) 
$username.Size = New-Object System.Drawing.Size(260,20) 
$objForm.Controls.Add($username) 

$passwordLbl = New-Object System.Windows.Forms.Label
$passwordLbl.Location = New-Object System.Drawing.Size(10,60) 
$passwordLbl.Size = New-Object System.Drawing.Size(280,20) 
$passwordLbl.Text = "ownCloud password (stored in plaintext):"
$objForm.Controls.Add($passwordLbl) 

$password = New-Object System.Windows.Forms.TextBox 
$password.Location = New-Object System.Drawing.Size(10,80) 
$password.Size = New-Object System.Drawing.Size(260,20) 
$objForm.Controls.Add($password) 


$urlLbl = New-Object System.Windows.Forms.Label
$urlLbl.Location = New-Object System.Drawing.Size(10,100) 
$urlLbl.Size = New-Object System.Drawing.Size(280,40) 
$urlLbl.Text = "ownCloud url (example: https://owncloud.example.com/remote.php/webdav/):"
$objForm.Controls.Add($urlLbl) 

$url = New-Object System.Windows.Forms.TextBox 
$url.Location = New-Object System.Drawing.Size(10,140) 
$url.Size = New-Object System.Drawing.Size(260,20) 
$objForm.Controls.Add($url)


$timeLbl = New-Object System.Windows.Forms.Label
$timeLbl.Location = New-Object System.Drawing.Size(10,160) 
$timeLbl.Size = New-Object System.Drawing.Size(280,20) 
$timeLbl.Text = "run daily backup at:"
$objForm.Controls.Add($timeLbl) 

$time = New-Object System.Windows.Forms.ListBox 
$time.Location = New-Object System.Drawing.Size(10,180) 
$time.Size = New-Object System.Drawing.Size(260,20) 
$time.Height = 40

$time.Items.Add("00:00") | Out-Null
$time.Items.Add("01:00") | Out-Null
$time.Items.Add("02:00") | Out-Null
$time.Items.Add("03:00") | Out-Null
$time.Items.Add("04:00") | Out-Null
$time.Items.Add("05:00") | Out-Null
$time.Items.Add("06:00") | Out-Null
$time.Items.Add("07:00") | Out-Null
$time.Items.Add("08:00") | Out-Null
$time.Items.Add("09:00") | Out-Null
$time.Items.Add("10:00") | Out-Null
$time.Items.Add("11:00") | Out-Null
$time.Items.Add("12:00") | Out-Null
$time.Items.Add("13:00") | Out-Null
$time.Items.Add("14:00") | Out-Null
$time.Items.Add("15:00") | Out-Null
$time.Items.Add("16:00") | Out-Null
$time.Items.Add("17:00") | Out-Null
$time.Items.Add("18:00") | Out-Null
$time.Items.Add("19:00") | Out-Null
$time.Items.Add("20:00") | Out-Null
$time.Items.Add("21:00") | Out-Null
$time.Items.Add("22:00") | Out-Null
$time.Items.Add("23:00") | Out-Null
$time.SetSelected(1,$true)
$objForm.Controls.Add($time) | Out-Null

$objForm.Topmost = $True

$objForm.Add_Shown({$objForm.Activate()}) | Out-Null
$objForm.ShowDialog() | Out-Null

# Configure ownCloud backup, ask user for local path to backup
Function Get-FileName($descr)

{   
   [System.Reflection.Assembly]::LoadWithPartialName("System.windows.forms") | Out-Null
   Add-Type -AssemblyName System.Windows.Forms
   $FolderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog
   $FolderBrowser.Description = $descr
   $FolderBrowser.ShowDialog() | Out-Null
   $FolderBrowser.SelectedPath
}

$backupFolder = Get-FileName("Please select local folder to backup to ownCloud")
#$backupFolder2 = Get-FileName("Please select local folder #2 to backup to ownCloud")

# Save scheduled time to task definition
Get-Content "$($Env:SystemDrive)\OCBACKUP\task.xml" | ForEach-Object { $_ -replace "OWNDRIVEBACKUPTIME", $time.Text } | Set-Content ("$($Env:SystemDrive)\OCBACKUP\task-modified.xml")

# Save values to XML config file
$ConfigFileloc = ("$($Env:SystemDrive)\OCBACKUP\config.xml")
[xml]$ConfigFile = (Get-Content $ConfigFileLoc)
$ConfigFile.Configuration.General.credentials = $username.Text + ":" + $password.Text
$ConfigFile.Configuration.General.backupFolder = $backupFolder
# $ConfigFile.Configuration.General.backupFolder2 = $backupFolder2
$ConfigFile.Configuration.General.url = $url.Text
$ConfigFile.Save("$ConfigFileLoc")	


# Create scheduled task
$delTaskCmd = "schtasks /delete /tn ownCloud /f"
$createTaskCmd = 'schtasks /create /XML "$($Env:SystemDrive)\OCBACKUP\task-modified.xml" /tn ownCloud'
Invoke-Expression "& $delTaskCmd"
Invoke-Expression "& $createTaskCmd"

Write-Host "You can now close this window"
