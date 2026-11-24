# Receber Estudos (n8n)

Webhook que recebe o HTML de um estudo montado **no PC do Thomas** e grava na pasta
**Estudos** do SharePoint (site N8N, `Documentos Compartilhados/Estudos/`).

Existe porque o n8n Cloud fica fora da VPC e só alcança a Cars2You (pelo MCP). Um
estudo que precisa da **Dealers** roda no PC, com a VPN, e só a entrega passa pelo
n8n, com a credencial do SharePoint que os painéis já usam.

| | |
|---|---|
| Workflow | `bbbITLpsU9wc9rAR` (projeto Cars2You), criado e publicado em 23/11/2026, versão `121f165a` |
| Endereço | `POST https://cars2you.app.n8n.cloud/webhook/estudos-receber?estudo=<chave>` |
| Corpo | o HTML cru, `Content-Type: application/octet-stream` |
| Token | cabeçalho `x-estudo-token`; o valor mora em `~/.estudos-n8n.env` (`URL=`, `TOKEN=`), **fora do repo** |
| Resposta | `{ ok, estudo, caminho, enviados, gravados, url, gravado_em }` |

Nós: **Receber HTML** (webhook, `onlyRunIf` no token) → **Conferir Arquivo** → **Subir no
SharePoint** (PUT no Graph do site N8N) → **Resposta**.

## Segurança

- Sem o token certo, o n8n responde `200 {"message":"Webhook call received"}` e **não cria
  execução** (medido em 23/11). Por isso quem envia confere o `ok` da resposta, não o
  código HTTP.
- Quem envia não escolhe o caminho: a chave `estudo` tem de estar em `ESTUDOS`, no
  Conferir Arquivo, e o nome do arquivo é fixo. Arquivo com menos de 200 KB ou que não
  começa como HTML é recusado.
- O `.wf.ts` deste diretório tem `__TOKEN__` no lugar do token. Ao reenviar o workflow,
  trocar pelo `TOKEN` de `~/.estudos-n8n.env` (o token do n8n e o do arquivo precisam
  bater). Trocar o token = gerar um novo, gravar no arquivo e atualizar o nó.

## Estudos que usam

| chave | arquivo na pasta Estudos | quem envia |
|---|---|---|
| `republicacoes-dealers` | `estudo-republicacoes-dealers.html` | `automations/estudo-republicacoes-dealers/roda-semanal.ps1`, tarefa do Windows toda segunda 0h |

Estudo novo: acrescentar a chave em `ESTUDOS` (no n8n e no `.wf.ts`), com ok do Thomas.

## Provas (23/11)

- Token errado: `200`, corpo `{"message":"Webhook call received"}`, sem execução.
- Envio do HTML real (2.041.777 bytes): `ok: true`, 2.041.777 gravados, 7,9 s,
  `Estudos/estudo-republicacoes-dealers.html` às 18h47 UTC.
