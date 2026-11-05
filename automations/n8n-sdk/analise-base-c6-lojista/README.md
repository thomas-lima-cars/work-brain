# `analise-base-c6-lojista/` — Análise de Base de Clientes, C6 Lojista

O relatório que chega por e-mail como `Analise_Base_Clientes_C6_Lojista_<aaaa-mm-dd>.html`.
É a base de clientes do **whitelabel 43 (Canal C6 Auto)**, com KPIs, funil, recência,
evolução mensal, novos × recorrentes, UF, coorte, base acumulada, rankings e as duas abas
de Raio-X.

| | |
|---|---|
| Workflow | **`f6Bw2iiuaWECy9Uz`** — "🟩 C6 Lojista - Analise de base de cadastros", projeto Cars2You |
| Gatilho | **Diário às 8h** (Brasília). O nome do workflow e o catálogo diziam "semanal": está errado |
| Duração | 4 a 5 min (o run 68010, de 04/11/2026, levou 4min39s) |
| Consultas | **256 chamadas** ao MCP: 22 avulsas + 234 páginas de Raio-X (`rx_*`, 50 linhas por página) |
| Destino | E-mail para 13 pessoas (8 da Cars2You e 5 do C6) + WhatsApp (resumo e arquivo) para 2 |
| Origem | Copiado do n8n em 04/11/2026 (`versionId` `29e0f93e…`, de 09/10). Versão atual: `df75b54b-5d3a-4a83-8864-6243f15b5b69`, salva em 04/11/2026 13:29 (Brasília) com a coorte em faixas |

**A fonte da verdade é o n8n.** Esta pasta é a cópia para ler, comparar e preparar mudança.
Nada volta ao n8n sem o ok do Thomas.

## Arquivos

| Arquivo | O quê |
|---|---|
| `n8n/montar-queries.js` | Nó Code: gera as 256 consultas (`queryName`, `database`, `sql`) |
| `n8n/montar-html.js` | Nó Code (100 KB): respostas do MCP → HTML. Lê `$('MCP Run')` e `$('Montar Queries')` |
| `n8n/anexar-html.js` | Nó Code: HTML → binário `html` com o nome do arquivo do dia |
| `n8n/expandir-destinos-whatsapp.js` | Nó Code: um item por destinatário de WhatsApp. **Telefones trocados por `<telefone>`** |
| `workflow.json` | O resto: nós, ligações, gatilho, destinatários do e-mail, credenciais por id e nome. O `jsCode` de cada nó aponta para o arquivo (`@arquivo n8n/...`) |
| `extrai_do_n8n.py` | Traz do n8n ou confere contra ele (abaixo) |

## Fluxo

```
Diariamente às 08h → Montar Queries → MCP Run (256×) → Montar HTML → Anexar HTML
  → Enviar Relatorio por Email (Outlook) → Expandir Destinos WhatsApp
  → Enviar WhatsApp Resumo → Enviar WhatsApp Documento
```

- **MCP Run:** `run_query` no `mcp-cars2you-readonly` (SSE), credencial "MCP Cars2You
  Readonly - BD SQL", banco `cars2you_production`, timeout 120 s.
- **E-mail:** credencial "Microsoft Outlook Power BI/Automações". Assunto
  `Base de Clientes - C6 Lojista - dd/MM/yyyy`.
- **WhatsApp:** Evolution API, instância "Cars2You Comercial", credencial "Evolution API Key".
  `sendText` com o resumo, depois `sendMedia` com o HTML em base64.

## Filtro de cliente

O `BASE` do `montar-queries.js` é o filtro unificado com o Power BI (BI0001, 28/09/2026):
whitelabel 43, não apagado, `internal_user = 0`, fora os e-mails `@cars2you`, `@datapage`,
`@icarros`, `@itau`, `@teste`, `@dnr`, `@netcarros`, `@maisquecliente`, `@dealersclub`,
`@c6bank.com`, e fora quem está no grupo de clientes 7. É o mesmo da Análise de Base dos 6
canais (`../analise-base-geral/`), que nasceu destas consultas.

## Saúde (execuções de 06/10 a 04/11/2026, medido em 04/11 pelo MCP do n8n)

| Dias | Status | O que houve |
|---|---|---|
| 17, 18, 19/10 | ❌ erro em 2 s | `MCP Run`: "Could not connect to your MCP server", SSE **521**. **Nada saiu** |
| 26, 27, 28/10 | ❌ erro no fim | `Enviar WhatsApp Resumo`: Evolution API respondeu **500**. **O e-mail saiu**; o WhatsApp não |
| os outros 24 | ✅ | |

## O que chama atenção no código

- 🔴 **O comentário do `expandir-destinos-whatsapp.js` contradiz o código.** Diz que o
  Tuunelis "ainda não entrou, de propósito" porque o Caio aprovou o WhatsApp dele numa
  cadência **semanal**, e o gatilho é diário. A linha dele **não está comentada**: o
  Tuunelis recebe o WhatsApp todo dia. Ou a decisão mudou e o comentário ficou velho, ou a
  linha entrou sem querer.
- **Uma falha no WhatsApp marca o run inteiro como erro**, mesmo com o e-mail entregue.
  Quem olha só o status acha que o C6 ficou sem relatório.
- **A Evolution API é chamada por HTTP puro num IP** (`52.206.207.64:8080`), sem TLS. A
  chave vai no cabeçalho.
- **Nenhum nó tem `onError`** e não há alerta de falha (pendência geral, "canal único de
  alerta de falha dos crons").

## Trazer de novo ou conferir

1. Pelo MCP do n8n: `get_workflow_details` de `f6Bw2iiuaWECy9Uz`. O resultado passa de
   140 KB, e o MCP grava num arquivo.
2. Rode `python -I extrai_do_n8n.py <arquivo> --confere`. Ele compara os 4 nós e o
   `workflow.json`, ignorando `versionId` e `updatedAt`, e sai com 1 se algo mudou.
3. Para atualizar a pasta, rode sem `--confere`.

Telefone nunca é gravado: o script troca número de WhatsApp por `<telefone>` dos dois lados
e se recusa a gravar se sobrar algum.

## Histórico

- **03/09/2026:** cópia antiga dos 3 nós Code em `../nodes-originais/`, tirada do
  `2ECmLRceNEgCCYyb` (hoje "[Legado]", inativo). **Está defasada:** o Montar HTML tinha 87
  KB contra os 100 KB de hoje, e o Montar Queries 23 contra 29. Não usar como base.
- **04/11/2026:** esta pasta, copiada do workflow em produção.
- **04/11/2026 — Velocidade de Ativação por Coorte em faixas.** Colado no n8n pelo Thomas
  (versão `df75b54b…`, ativa) e conferido com `--confere`: os 4 nós IGUAL. Primeiro run com
  ela: o agendado de 05/11, 8h.
  Mesmo ajuste da Análise de Base dos 6 canais (v3, 16/10): as colunas deixaram de
  ser acumuladas ("em até 30/60/90/180 dias") e viraram faixas exclusivas, **até 30d ·
  31–60d · 61–90d · 91–180d**, cada pessoa na faixa da primeira vez. A consulta
  `coorte_janela` não mudou: o `celJanela` do `montar-html.js` subtrai o acumulado
  da faixa anterior. O asterisco segue a regra de antes (maturidade da coluna).
  Cabeçalhos "… pela 1ª vez" e nota da seção reescritos.
  **Prova** com o dado da execução 68010 (04/11): o nó original rodado fora do n8n
  reproduz o HTML que o n8n gerou (fora data e hora); fora a seção da coorte, o HTML
  novo é idêntico ao original; nas 11 linhas, cada faixa é a diferença do acumulado e
  as quatro somam o de 180 dias, sem valor negativo; 323 KB nos dois. Conferido na
  tela. Script e dado ficaram fora do repo (nome real de loja).
