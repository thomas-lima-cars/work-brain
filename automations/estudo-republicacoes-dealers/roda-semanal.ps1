<#
  Estudo de Republicacoes Dealers: rodada semanal no PC do Thomas (23/11).

  Por que no PC e nao no n8n: o n8n Cloud fica fora da VPC e so alcanca a Cars2You pelo MCP;
  a Dealers so responde pela conexao direta, com a VPN ligada (acessos.md).

  O que faz:
    1. espera a VPN: testa as duas bases a cada 15 min, por ate 12 h (a tarefa dispara segunda 0h,
       quando a VPN costuma estar desligada; o estudo sai assim que ela subir);
    2. roda extrai.py -> analisa.py -> monta-estudo.js, parando no primeiro erro;
    3. envia o HTML ao workflow Receber Estudos do n8n (automations/n8n-sdk/receber-estudos/), que grava
       em Estudos/estudo-republicacoes-dealers.html no SharePoint (site N8N). O endereco e o token ficam
       em ~/.estudos-n8n.env (URL=..., TOKEN=...), fora do repo.

  Uso:  powershell -NoProfile -ExecutionPolicy Bypass -File roda-semanal.ps1
  Log:  rodadas.log, nesta pasta (fora do git). Sai com codigo 0 so quando o SharePoint confirmou a gravacao.
#>
param(
  [int]$EsperaMaxHoras = 12,
  [int]$IntervaloMin = 15
)

$ErrorActionPreference = 'Continue'
$pasta = $PSScriptRoot
$raiz = (Resolve-Path (Join-Path $pasta '..\..')).Path
$log = Join-Path $pasta 'rodadas.log'
$html = Join-Path $pasta 'estudo-republicacoes-dealers.html'
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUTF8 = '1'

function Write-Log([string]$msg) {
  ('{0:yyyy-MM-dd HH:mm:ss}  {1}' -f (Get-Date), $msg) | Out-File -FilePath $log -Append -Encoding utf8
}

function Invoke-Passo([string]$nome, [string]$exe, [string[]]$argumentos) {
  Write-Log ('> ' + $nome)
  $ini = Get-Date
  & $exe @argumentos 2>&1 | ForEach-Object { '    ' + $_ } | Out-File -FilePath $log -Append -Encoding utf8
  $codigo = $LASTEXITCODE
  Write-Log ('  ' + $nome + ': codigo ' + $codigo + ', ' + [int]((Get-Date) - $ini).TotalSeconds + ' s')
  return $codigo
}

function Test-Bases {
  foreach ($b in @('dealers', 'cars2you')) {
    & python (Join-Path $raiz 'automations\bancos\consulta.py') --testar --base $b *> $null
    if ($LASTEXITCODE -ne 0) { return $b }
  }
  return $null
}

Set-Location $raiz
Write-Log '=== rodada semanal'

$envArq = Join-Path $env:USERPROFILE '.estudos-n8n.env'
$cfg = @{}
if (Test-Path -LiteralPath $envArq) {
  Get-Content -LiteralPath $envArq | Where-Object { $_ -match '^\s*([A-Z_]+)\s*=\s*(.+?)\s*$' } | ForEach-Object { $cfg[$Matches[1]] = $Matches[2] }
}
if (-not $cfg['URL'] -or -not $cfg['TOKEN']) {
  Write-Log ('ERRO: faltam URL e TOKEN em ' + $envArq)
  exit 2
}

# 1. espera a VPN
$limite = (Get-Date).AddHours($EsperaMaxHoras)
while ($true) {
  $falhou = Test-Bases
  if (-not $falhou) { Write-Log 'bancos ok (VPN ligada)'; break }
  if ((Get-Date) -ge $limite) {
    Write-Log ('ERRO: a base ' + $falhou + ' nao respondeu em ' + $EsperaMaxHoras + ' h (VPN desligada?). Estudo nao atualizado.')
    exit 3
  }
  Write-Log ('base ' + $falhou + ' sem resposta (VPN desligada?); nova tentativa em ' + $IntervaloMin + ' min')
  Start-Sleep -Seconds ($IntervaloMin * 60)
}

# 2. pipeline
$passos = @(
  @('extrai.py', 'python', @((Join-Path $pasta 'extrai.py'))),
  @('analisa.py', 'python', @('-I', (Join-Path $pasta 'analisa.py'))),
  @('monta-estudo.js', 'node', @((Join-Path $pasta 'monta-estudo.js')))
)
foreach ($p in $passos) {
  $c = Invoke-Passo $p[0] $p[1] $p[2]
  if ($c -ne 0) { Write-Log ('ERRO: ' + $p[0] + ' falhou; o HTML do destino ficou como estava.'); exit 4 }
}

$arq = Get-Item -LiteralPath $html -ErrorAction SilentlyContinue
if (-not $arq -or $arq.LastWriteTime -lt (Get-Date).AddMinutes(-30)) {
  Write-Log 'ERRO: o HTML nao foi gerado agora; nada copiado.'
  exit 5
}

# 3. envia ao n8n, que grava no SharePoint
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$destino = $cfg['URL'] + '?estudo=republicacoes-dealers'
try {
  $r = Invoke-RestMethod -Method Post -Uri $destino -InFile $html -ContentType 'application/octet-stream' `
    -Headers @{ 'x-estudo-token' = $cfg['TOKEN'] } -TimeoutSec 300 -ErrorAction Stop
} catch {
  Write-Log ('ERRO ao enviar ao n8n: ' + $_.Exception.Message)
  exit 6
}
if (-not $r -or -not $r.ok) {
  Write-Log ('ERRO: o n8n nao confirmou a gravacao (token errado ou workflow desligado?). Resposta: ' + ($r | ConvertTo-Json -Compress))
  exit 7
}
Write-Log ('OK: SharePoint ' + $r.caminho + ', ' + [int]($r.gravados / 1KB) + ' KB, ' + $r.gravado_em)
exit 0
