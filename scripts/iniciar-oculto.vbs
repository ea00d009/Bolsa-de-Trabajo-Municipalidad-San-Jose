Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""C:\Apps\Bolsa-de-trabajo\scripts\autostart-services.ps1""", 0, False
