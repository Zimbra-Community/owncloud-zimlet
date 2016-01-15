powershell.exe -NoProfile -sta -noexit -Command "& {Start-Process PowerShell.exe -ArgumentList '-NoProfile -sta -noexit -ExecutionPolicy unrestricted -file ""%~dp0install.ps1""' -Verb RunAs}"

