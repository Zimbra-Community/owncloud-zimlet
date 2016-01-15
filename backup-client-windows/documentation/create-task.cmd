schtasks /delete /tn ownCloud /f
schtasks /create /XML task.xml /tn ownCloud

REM task.xml can be exported from Windows GUI
