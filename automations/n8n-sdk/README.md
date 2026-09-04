# `n8n-sdk/` — workflows como código

Código dos nós n8n versionado fora do n8n. Nasceu como "workflows via SDK" e virou
também a **casa do código dos nós Code**, porque o n8n não versiona, não revisa e
não dá checksum.

## O port do relatório de base de clientes (2026-09-03/04)

Sandbox: **`0pUtqToo0zNNibQT`** (projeto pessoal do Thomas, inativo, e-mail desabilitado).
Origem: `2ECmLRceNEgCCYyb` (produção).

| Arquivo | O que é |
|---|---|
| `nodes-originais/` | Os 3 nós Code de **produção**, verbatim, com md5. Ponto de partida de tudo |
| `montar-queries-LOTE1-todos.js` | Transformação mecânica: tira o `whitelabel_id = 43`, base vira a plataforma |
| `montar-queries-LOTE1b-coorte.js` | Troca `kpi`+`situacao` pela coorte (o `kpi` estourava o deadline) |
| `montar-queries-LOTE1d.js` | **No ar.** `status2` via PC, `total_ofertas` via JOIN, paginação medida |
| `no-adaptador-queries.js` | Nó "Montar Queries" da arquitetura B |
| `no-adaptador-mcp.js` | Nó "MCP Run" da arquitetura B |
| `no-injetar-filtros.js` | Nó novo: injeta a barra de filtros de safra no HTML pronto |
| `montar-html-coorte.js` | Alternativa à arquitetura B — o gerador patchado. **Não usado**: 88 KB não passa pela API |
| `port-base-clientes.wf.ts` | SDK completo do sandbox. **Não usado** pelo mesmo motivo |
| `auditoria-estoque-loja.wf.ts` | Outro workflow, de sessão anterior |

Scripts (`gera_*.py`, `prova_*.js`, `testa_*.js`, `valida_*.py`) geram e **provam** cada
lote. Não são rascunho: são a evidência de que nenhuma query foi reescrita de cabeça.

## 🚨 O limite que moldou a arquitetura

O `update_workflow` do MCP só aceita o `jsCode` **inline**. O `Montar HTML` tem 87 KB —
esse literal sozinho passa de **50 mil tokens**, mais do que cabe numa mensagem. Ou seja:
**aquele nó não pode ser reescrito pela API**, nem por subagente.

Daí a **arquitetura B**:

```
Trigger → Montar Queries Base → MCP Exec → Montar Queries → MCP Run → Montar HTML → Injetar Filtros → Anexar HTML
            (o builder real)      (o MCP real)  (adaptador)    (adaptador)   (INTOCADO)      (novo)
```

Os nós reais foram **renomeados**; os adaptadores assumiram os nomes antigos. O
`Montar HTML` lê `$('Montar Queries')` e `$('MCP Run')` pelo nome e recebe exatamente o
que sempre esperou — seguindo byte-idêntico à produção (md5 `9e570f948b63`).
Mudança de formato de dado vive nos adaptadores; mudança de interface, no injetor.

## Regras que valeram caro

- **Nunca reescrever SQL de cabeça.** Transformar o texto de produção, com prova de
  roundtrip. Escrever "do zero" a partir de resumo produziu tabela inexistente
  (`vehicle_provider_reports`), join errado e 5 faixas viradas 4.
- **Toda transmissão confere md5** nas duas pontas.
- **Provisionar página com folga, mas medir depois.** Chute de 8,8x desperdiçou 47% das
  chamadas; com o medido, 876 no lugar de 1.440.
- **Query de verificação primeiro na fila.** Se algo pesado estourar lá na frente, o nó
  inteiro falha e não devolve nada.
- **Testar o gerador localmente** (`testa_cadeia_B.js`) alimentando com dados gravados
  de uma execução. Evita 13 min de produção por tentativa.
