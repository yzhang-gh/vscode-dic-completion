$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
# mv: Move-Item (backup)
mv words words.old -Force
# gc: Get-Content; sort: Sort-Object
gc words.old | sort -CaseSensitive > words