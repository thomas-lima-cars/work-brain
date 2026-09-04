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


## Lote 2 — whitelabel na página inteira (2026-09-04)

O lote 1f fez o **seletor** de whitelabel funcionar em 18 valores. O lote 2 leva o
recorte para **todas as seções**, e troca o gerador por um reativo por desenho.

### Camada de dados

| Arquivo | O que é |
|---|---|
| `_lote2_bloco.js` | As 15 queries `_wl` novas, como JS de verdade |
| `gera_lote2.py` | Transformação mecânica sobre o lote 1f, 5 asserts |
| `montar-queries-LOTE2-full-wl.js` | Saída — 27 globais **byte-a-byte intactas** + 15 `_wl` |
| `prova_lote2.js` | Harness local, 5 baterias, sem tocar no banco |

**O padrão:** a dimensão whitelabel entra por `INNER JOIN user_whitelabels`, nunca
por `WHERE`. Quem está em N whitelabels aparece N vezes no recorte e **uma** no
total — por isso cada seção tem DUAS queries: a global (intocada, alimenta
"Todos") e a `_wl`. Somar os WLs para chegar no total dá número inflado.

**O que não ganha whitelabel, e por quê:**
- `evol_media_oferta` — sai de `advertisements` + `shops`, não passa por usuário.
  Não existe "whitelabel de um anúncio": a chave é `shop_id`, e o Feirão C6 roda no
  mesmo WL 7 do IGA. Os 3 gráficos dela ficam globais, rotulados na tela.
- `evol_cadastro` — o `ym` da `coorte_wl` **já é** o mês de cadastro. Query a menos.
- As 7 `rx_*` — já vêm indexadas por `buyer_user_id`. Em vez de multiplicar 855
  chamadas por 58, entra 1 mapa `rx_buyer_wl` e o recorte acontece no cliente.

### Gerador (novo, reativo por desenho)

O de produção assava valor no HTML (`<div class="kpi-value">29.010</div>`), então só
dava para filtrar reescrevendo texto. Este embarca **dado** e desenha tudo no
cliente, num único `render()`.

```
gerador/10-dados.js    ingestão do MCP -> objeto DADOS      (roda no n8n)
gerador/20-css.css     CSS verbatim do relatório anterior   (nó "Montar CSS")
gerador/30-shell.html  esqueleto vazio + barra de filtro
gerador/40-app.js      o renderizador                       (roda no browser)
build_gerador.py       concatena, com 6 provas
```

Saída: `montar-css.js` (12,5 KB) + `montar-html-lote2.js` (70,6 KB).

**Por que dois nós:** o `jsCode` viaja INLINE pela API do MCP, e nó grande demais
não passa — foi o que aposentou o gerador de 87 KB. O CSS é estático e nunca muda
junto com a lógica; separá-lo devolve 12 KB de folga para o nó que evolui.

Layout, ordem das seções, títulos e configuração dos 12 gráficos foram **extraídos
do relatório anterior**, não reinventados.

### Provas locais (`testa_gerador_local.js`)

Roda o nó fora do n8n com um `$()` falso. A coorte vem dos **JSONs reais** do
protótipo (58 whitelabels, 78 safras, 29.002 clientes) — a versão que inventava 5
WLs passava e mentia sobre o peso do HTML.

Confere: 12 canvas, JSON parseável, o CSS chegou, a invariante
*plataforma ≥ maior WL isolado*, e o recorte do WL43 reproduzindo produção (2.921).

### O que a sonda ensinou (e o que ela derrubou)

Sonda = workflow separado (`7TCmS8JFacDTmySQ`), sem nó de e-mail, que roda só as
queries novas. Existe porque **quando uma query estoura o deadline o nó inteiro
falha e não devolve nada** — subir o lote completo daria "falhou" sem dizer qual.

| Execução | O que provou |
|---|---|
| 48571 | 9 das 15 `_wl` passam (216 chamadas, 9min32s). `uf_compra_wl` estoura na 1ª página |
| — | **`uf_cadastro_wl` PASSOU**: materializar a base por WL não é o gargalo |
| 48573 | Fatiar por ano da compra **não** resolveu — hipótese minha, tratada como conclusão |
| 48644 | Variantes A–E, 1 página cada, para isolar por medição |

⚠️ **Bug no relatório de produção**, achado ao comparar: as 12 barras de recência
saem com `width:30,4%` — vírgula decimal é declaração CSS inválida, o navegador
descarta. **As barras estão zeradas em produção.** Aqui a largura sai com ponto.

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
