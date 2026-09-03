# Ambiente n8n — Cars2You

> Importado em 2026-09-03 de `n8n-cars2you-contexto.md` (gerado na sessão Cowork de 02/09/2026).
> Estado do ambiente n8n, inventário de workflows, credenciais e o procedimento de cópia via MCP.
> Contexto de negócio da reunião → `memory/inputs/meetings/2026-09-02-squad-de-relatorios.md`.
>
> ⚠️ Inventário da seção 2 reflete 02/09/2026. Reconfirmar com
> `search_workflows({ projectId: "yAo7DiqDfz6XfXyv", limit: 200 })`.

---

## 1. Ambiente n8n

- **Instância:** https://cars2you.app.n8n.cloud
- **Acesso:** via MCP server oficial do n8n (ferramentas `mcp__n8n__*`).
- **Usuário desta sessão:** Thomas Lima <thomas.lima@cars2you.com.br>

### Projetos
| Projeto | ID | Tipo |
|---|---|---|
| Cars2You | `yAo7DiqDfz6XfXyv` | team |
| Thomas Lima <thomas.lima@cars2you.com.br> | `OcIBv5UMs6Iqfu51` | personal |

Todos os workflows de produção vivem no projeto **Cars2You**. O projeto pessoal do Thomas estava
vazio até criarmos a cópia descrita na seção 4.

### Credenciais (todas globais, `isGlobal: true`, home project = Caio Ledesma)
| Nome | ID | Tipo |
|---|---|---|
| MCP Cars2You Readonly - BD SQL | `Cc8CxzVDwvA3EysZ` | `httpBearerAuth` |
| Microsoft Outlook Power BI/Automações | `G3MiTRT9jTVPx6Wn` | `microsoftOutlookOAuth2Api` |
| Microsoft SharePoint Conta PowerBI/Automações | `AOTm9J6pFcF0DS6g` | `microsoftSharePointOAuth2Api` |
| Microsoft Excel Power BI/Automações | `ZZlB5pMp9oH6hdlH` | `microsoftExcelOAuth2Api` |
| OpenAI Bot N8N - Whats | `56XlihGDq6PYtGH7` | `openAiApi` |
| Evolution API Key | `A46wz7IuxLPWqy5Z` | `httpHeaderAuth` |

- **Banco de dados:** acesso somente-leitura via MCP `run_query` no endpoint
  `https://mcp-cars2you-readonly.cars2you.com.br/sse` (transporte SSE, bearer auth).
  Database usado nas queries: `cars2you_production`.
- **WhatsApp:** enviado via Evolution API. **E-mail:** via Microsoft Outlook (OAuth2).
  **Arquivos/relatórios:** hospedados no SharePoint; planilhas via Excel Graph API.

---

## 2. Inventário de workflows (projeto Cars2You)

25 workflows no total. `🟩` = produtivo/estável; `TEMP` = descartável.

### C6 Lojistas (Evento Exclusivo C6 Auto — shop 104754)
- `PYCbGrJqV1a0u9hP` — 🟩 Gatilho Fim de Evento C6 Lojistas
- `ehsqQo6hiPDRf58I` — 🟩 Relatório de Evento C6 Lojistas
- `lXJNM4hbE92vEDsu` — 🟩 Planilha de Evento C6 Lojistas (2 .xlsx: completo c/ comprador; banco s/ comprador)
- `f2DWD6yFNuLg5AE4` — 🟩 Remanescentes C6 Lojistas
- `2ECmLRceNEgCCYyb` — 🟩 C6 Lojista - Análise de base de cadastros (semanal, grupo 10 loja 594)

### IGA
- `Vx8DTLJmho0OvSKJ` — 🟩 Gatilho Fim de Evento IGA
- `sYcHnaeVjLRCll9H` — 🟩 Relatório de Evento IGA
- `yoskRxyXhtjn4vhI` — 🟩 Remanescentes do Evento IGA (por UF, WhatsApp via Evolution)
- `UmqceMdN4BSTREMj` — 🟩 Resultado VD IGA (Planilha) — preenche template SharePoint via Graph
- `mgDSyxuO0Mzjkrfy` — 🟩 IGA - Análise de base de cadastros (semanal, grupo 10 loja 594)
- `dgxa0pkeFhQVqJ5X` — 🟩 Cockpit Comprador IGA (formulário + allowlist, 10 queries, cockpit HTML por Outlook)
- `DVpaCz02psdgKb5J` — IGA - Controle de cadastros diários (e-mail 08h, cadastros do dia anterior)
- `20LeyMLjrAKeKVeS` — 📡 Pulso de Eventos no Ar (status no WhatsApp a cada 2h, 8h-20h, seg-sáb)

### Estoque LM
- `noemX4AA7FFxafYZ` — 🟩 Estoque LM (Planilha → Data Table)
- `8YnGmVUvl6BmrKKb` — 🟩 Lista LM (HTML)
- `BvqnJZoex3Y7ekL6` — 🟩 Proposta LM (Formulário)
- `pIAZj3tGTyhvlLVO` — TEMP checar Estoque LM

### Lance Fácil BTB
- `K8XX09IOxufdhilb` — Lance Fácil BTB Associados - Controle de cadastros diários
- `oJPNgFxQZXQLDa06` — Lance Fácil BTB - Controle de cadastros diários

### Geral / operação
- `vxyzWHfrcIR2gdsd` — 🟩 Auditoria de Estoque por Loja  ← **origem da cópia (seção 4)**
- `TKxpirO9fUg5KYcY` — Cars2You — Envia Relatório (tags: relatórios, cars2you)
- `RuDVQk6pjR36TMat` — Testes (inativo)

### TEMP / descartáveis (C6) — ainda ATIVOS, marcados para arquivar
- `Qk9ldFifIWgGWIhr` — TEMP corrigir template C6
- `jztu08zVhdkLHPxH` — TEMP inspecionar template C6
- `BmEuC16mnTEWc2FN` — TEMP consulta banco C6

> ⚠️ Higiene pendente: arquivar os 3 TEMP acima (e "Testes" já inativo).
> A lista canônica e atualizada de IDs deve ser reconfirmada no modo code com
> `mcp__n8n__search_workflows({ projectId: "yAo7DiqDfz6XfXyv", limit: 200 })`.

---

## 3. "Auditoria de Estoque por Loja" — anatomia do workflow (origem `vxyzWHfrcIR2gdsd`)

Cadeia linear de 6 nós:

1. **Diariamente às 08h** — `n8n-nodes-base.scheduleTrigger` v1.3 — `rule.interval = [{ triggerAtHour: 8 }]`
2. **Montar Queries** — `n8n-nodes-base.code` v2 (5303 chars) — monta 5 queries agregadas
   (`lojas`, `veiculos`, `matriz`, `aging`, `disponivel30`) sobre `cars2you_production`.
   - Whitelabels no escopo: `4` (Trucks2you), `7` (Marketplace Cars2You), `43` (C6 Auto),
     `48` (Colaboradores C6), `62` (Lance Fácil BTB), `65` (Lance Fácil BTB Associados).
   - Filtra `enable_advertiser = 1`, exclui `name LIKE 'Teste%'`.
   - **Variável `MODO`** no topo do código: `'teste'` (só Guilherme) ou `'producao'` (lista completa).
     Os destinatários viajam no item e são lidos pelo nó do Outlook.
   - ⚠️ run_query do MCP corta em 50 linhas por chamada sem avisar → por isso as queries agregam
     por loja com `GROUP_CONCAT` (máx. 20 linhas) e o "Montar HTML" desempacota.
3. **MCP Run** — `@n8n/n8n-nodes-langchain.mcpClient` v1.1 — SSE, bearer.
   - `endpointUrl: https://mcp-cars2you-readonly.cars2you.com.br/sse`
   - `tool = run_query`; `jsonInput = ={{ JSON.stringify({ sql: $json.sql, database: $json.database }) }}`
   - `options.timeout = 60000`; cred `httpBearerAuth = Cc8CxzVDwvA3EysZ`
4. **Montar HTML** — `n8n-nodes-base.code` v2 (48712 chars) — constrói o relatório HTML interativo
   (ranking de lojas ordenável, filtro por loja, matriz situação × status, aging, etc.). Inclui um
   **logo em base64 (~8876 chars)** — cuidado ao editar/transcrever.
5. **Anexar HTML** — `n8n-nodes-base.code` v2 (599 chars) — anexa o HTML como binário `html`.
6. **Enviar Relatorio por Email** — `n8n-nodes-base.microsoftOutlook` v2
   - `toRecipients = ={{ $json.destinatarios }}`
   - `subject = =Auditoria de Estoque por Loja - {{ $now.toFormat("dd/MM/yyyy") }}{{ $json.modo === 'teste' ? ' [TESTE]' : '' }}`
   - `bodyContent` = corpo padrão "Prezados, ... Automação Cars2You."
   - `additionalFields.attachments = [{ binaryPropertyName: 'html' }]`
   - cred `microsoftOutlookOAuth2Api = G3MiTRT9jTVPx6Wn`

`settings`: `executionOrder v1`, `binaryMode separate`, `timeSavedMode fixed`,
`callerPolicy workflowsFromSameOwner`.

---

## 4. Cópia criada nesta sessão

- **Nome:** 🟩 Auditoria de Estoque por Loja (Cópia)
- **ID:** `GgjVZlU04wvJzLbK`
- **Projeto:** pessoal do Thomas (`OcIBv5UMs6Iqfu51`)
- **Estado:** inativa (`active: false`)
- **URL:** https://cars2you.app.n8n.cloud/workflow/GgjVZlU04wvJzLbK
- **Fidelidade:** verificada byte-a-byte (MD5) contra a origem — os 3 code nodes, tipos, versões,
  posições, credenciais (IDs originais reutilizados) e expressões conferem.

⚠️ **Antes de ativar:** o gatilho é o mesmo (08h diário) e `MODO` está em `'producao'`. Ativar
faria a cópia disparar e-mail para a lista completa em paralelo ao original. Para testar, trocar
`MODO` para `'teste'` no nó "Montar Queries" primeiro.

---

## 5. Procedimento: copiar/versionar workflow via MCP (aprendizado desta sessão)

O MCP do n8n **não** tem "duplicar via JSON cru"; a criação é via SDK (`create_workflow_from_code`).
Passos que funcionaram:

1. **Habilitar acesso MCP no workflow de origem** (card na lista → Settings → "Available in MCP").
   Sem isso, `get_workflow_details` responde `Workflow is not available in MCP`.
2. `get_workflow_details({ workflowId, detailLevel: 'full' })` → JSON grande vai para arquivo;
   inspecionar com `jq` (nodes, connections, settings, credenciais, expressões `=...`).
3. `get_workflow_sdk_reference()` **antes** de escrever código SDK (é um subset restrito de TS:
   sem arrow/loops/try/`new`; `const` apenas; sem métodos nativos de array/string exceto
   `.repeat()/.trim()` e `JSON.stringify`).
4. **Gerar o código SDK programaticamente** (script Python), embutindo cada `jsCode` como literal
   via `json.dumps(...)` (escaping seguro — os code nodes contêm backticks e `${}`), e convertendo
   cada expressão n8n `=...` em `expr("...")` (strip do `=` inicial, `json.dumps` do resto).
5. **Reutilizar credenciais existentes** com `newCredential('Nome', 'ID')` (2º arg = ID exato).
   Nunca inventar IDs de credencial.
6. `validate_workflow({ code })` — warnings `INVALID_EXPRESSION_PATH` para campos que só existem em
   runtime (ex.: `$json.sql`, `$json.destinatarios`) são **benignos**; erros bloqueiam.
7. `create_workflow_from_code({ code, name, projectId, versionName, versionDescription })`.
   Confirmar `targetProject` na resposta.
8. **Verificar fidelidade**: comparar MD5 dos `jsCode` criados vs. origem. Nesta sessão houve **1 erro
   de transcrição de 1 caractere no base64 do logo** na 1ª tentativa — detectado por checksum e
   corrigido com um update. **Sempre checar o base64/HTML grande por checksum.**
9. Passos 6-7 exigem enviar o código inteiro inline; para arquivos grandes (~59KB), delegar a um
   subagente que lê o `.ts` e faz as chamadas mantém o contexto principal limpo.

O código SDK gerado da Auditoria está em `n8n-sdk/auditoria-estoque-loja.wf.ts` (importado 2026-09-03, MD5 conferido). Import do SDK usado:
`import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';`

---

## 6. Próximas ações técnicas
1. (Opcional) Reconfirmar inventário/IDs com `search_workflows({ projectId: "yAo7DiqDfz6XfXyv", limit: 200 })` — a seção 2 reflete a listagem de 02/09/2026.
2. Abrir `ehsqQo6hiPDRf58I` (Relatório C6) e mapear o que falta para a visão de safra com botão em 100% da base.
3. (Higiene) arquivar os 3 workflows TEMP e o "Testes".
4. Se for usar a cópia `GgjVZlU04wvJzLbK`: ajustar `MODO='teste'` antes de ativar.
