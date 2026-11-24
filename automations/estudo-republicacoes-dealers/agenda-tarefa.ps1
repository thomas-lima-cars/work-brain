<#
  Registra (ou atualiza) a tarefa do Windows que roda o Estudo de Republicacoes Dealers
  toda segunda as 0h. Rodar uma vez, como o proprio usuario (sem admin):

    powershell -NoProfile -ExecutionPolicy Bypass -File agenda-tarefa.ps1

  - Se o PC estiver desligado na hora, a tarefa roda assim que ele ligar (StartWhenAvailable).
  - So roda com o usuario logado: a VPN e o ambiente do Python sao da sessao dele.
  - O roda-semanal.ps1 espera a VPN por ate 12 h; o limite da tarefa e 13 h.
#>
$nome = 'Estudo de Republicacoes Dealers'
$script = Join-Path $PSScriptRoot 'roda-semanal.ps1'
$acao = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $script + '"') `
  -WorkingDirectory $PSScriptRoot
$gatilho = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At '00:00'
$config = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 13) -MultipleInstances IgnoreNew
$quem = New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $nome -Action $acao -Trigger $gatilho -Settings $config -Principal $quem `
  -Description 'Estudo de Republicacoes Dealers (work-brain): extrai, analisa e monta o HTML, e envia ao n8n (Receber Estudos), que grava na pasta Estudos do SharePoint. Espera a VPN por ate 12 h. Log em rodadas.log.' -Force |
  Select-Object TaskName, State
