# Lojas ofertantes — 6 meses, por UF e whitelabel

Workflow n8n **`LZL3mxfbMIz4avyx`** — projeto pessoal do Thomas, **inativo**, gatilho manual,
**sem nó de e-mail e sem cron**. Criado em 2026-09-09.

<https://cars2you.app.n8n.cloud/workflow/LZL3mxfbMIz4avyx>

## Resultado real — execução 49803 (2026-09-09)

**1.300 lojas** deram lance nos últimos 6 meses, com **103.925 ofertas** sobre
**23.307 veículos**, em **11 whitelabels** e **27 UFs**. A coleta fechou com o gabarito:
1.300 de 1.300. Saída em `saida-49803.html`, dado bruto em `dados-49803.json`.

| Whitelabel | Lojas | Ofertas | Preço médio ponderado |
|---|---:|---:|---:|
| Marketplace Cars2You | 920 | 72.436 | R$ 72.206 |
| Trucks2you | 124 | 16.494 | R$ 292.251 |
| Canal de vendas C6 Auto | 234 | 14.430 | R$ 45.861 |
| Lance Fácil BTB | 13 | 522 | R$ 147.064 |
| _(outros 7, com 1 a 3 lojas cada)_ | 9 | 43 | — |

SP concentra 431 lojas e 32.487 ofertas. **Nenhuma loja da base tem mais de um endereço**,
então a ressalva do `MAX()` para UF não se materializou; só 1 loja ficou sem UF.

⚠️ **`saida-49803.html` tem nome real de loja.** Repo privado, mas pensar antes de repassar.

## Arquitetura — duas fases

```
Rodar (manual)
  → Montar Totais → MCP Totais          fase 1: conta lojas e ofertas (1 chamada)
  → Montar Queries → MCP Exec           fase 2: ceil(lojas/50) páginas x 5 queries
  → Montar HTML
```

A fase 1 existe porque **o `OFFSET` faz o banco re-executar a query inteira a cada
página** — página que sobra não é de graça, é um agregado completo de 6 meses de
`offers` jogado fora. Sabendo o total antes, a fase 2 monta a paginação exata.

Para 1.300 lojas: **131 chamadas** em vez das 301 da 49803, que gastou 170 em páginas
vazias (57% de desperdício, o mesmo padrão dos 74% do Raio-X no relatório C6).

| Arquivo | O que é |
|---|---|
| `montar-totais.js` | Nó da fase 1 |
| `montar-queries.js` | Nó da fase 2 — dimensiona e monta as 5 queries |
| `montar-html.js` | Ingestão, junção, agregados e a página |
| `prova-local.js` | **55 provas** locais com MCP sintético. Não toca no banco |
| `build_wf.py` | Concatena os nós no SDK (`json.dumps` evita escape manual) |
| `saida-49803.html` · `dados-49803.json` | Resultado real |
| `saida-teste-local.html` | Saída da prova. ⚠️ **Dado sintético** |

```bash
node automations/n8n-sdk/lojas-ofertas/prova-local.js
```

## As quatro cicatrizes que este código carrega

Cada uma virou regressão na `prova-local.js`.

**[R1 · exec 49799] O MCP não aceita função de janela.** `ROW_NUMBER() OVER (...)` volta
`syntax error`, com a posição em cima do `PARTITION BY`. Três queries morreram assim.
Hoje: última oferta por `MAX(offers.id)`, topo das modas por `INNER JOIN` no `MAX(n)`.

**[R2 · exec 49799] O MCP corta toda resposta em 50 linhas** (`truncated: true`). Paginar
de 1.000 em 1.000 pulou 950 por página **em silêncio** e o relatório saiu com 100 lojas
parecendo completo — faltavam 1.200. `PAGE = 50`, sempre.

**[R3 · exec 49799] Erro objeto virava `[object Object]`.** O diagnóstico escondeu a causa
real por uma rodada inteira. `erroTexto()` abre objeto, `Error` e array.

**[R4 · exec 49803] Paginação chutada.** 60 páginas para 26 necessárias. Origem da fase 1.

## Premissas

1. **`buyer_shop_id`** — a loja que deu o lance. Confirmado pelo Thomas em 2026-09-09.
   Para inverter, trocar `LADO` em `montar-totais.js` **e** `montar-queries.js`.
2. **Whitelabel vem de `shops.whitelabel_id`** — `offers` não tem whitelabel próprio, então
   cada loja cai em exatamente um. Diferente da base de clientes, onde o recorte passa por
   `user_whitelabels` e um usuário aparece em vários.
3. **Idade usa `model_year`**, não `manufacture_year`.
4. **`STDDEV_SAMP`** (amostral) — nulo com n=1, de propósito.
5. **Dois denominadores:** preço/idade/km sobre veículos; % de modelo/categoria sobre
   ofertas. As duas contagens estão na tabela para isso ficar auditável.
6. **Empate na moda** fica com o menor `item_id`. Na 49803 houve 154 empates de modelo e
   27 de categoria — quase sempre loja com poucas ofertas.

## Ressalvas do resultado

- **A soma de ofertas deu 103.925 contra 103.923 do gabarito — diferença de 2.** A `q_totais`
  rodou às 16h12 e as páginas de `q_ofertas` ao longo dos 19 minutos seguintes: são ofertas
  criadas **durante** o run. Alvo móvel, não erro de query. Se a diferença aparecer grande,
  aí sim é problema.
- **`shops.deleted_at`** está entre as 13 colunas que o diagrama do banco não mostra
  (ver `context/banco-de-dados/README.md`). Uso porque o índice `shops_id_deleted_idx`
  prova que existe — e a 49803 confirmou na prática.
- **A versão de duas fases ainda não rodou em produção.** Está provada localmente (55
  asserts), mas o número real de chamadas e o tempo só se confirmam no próximo run.

## Como pegar o HTML

O nó `Montar HTML` devolve `html`, `resumo`, `falhas`, `diagnostico` e `DADOS`.
Sem nó de e-mail por desenho — baixar da execução. O HTML da 49803 saiu com **512 KB**;
se virar entrega recorrente, a rota da casa é SharePoint + link, não anexo.
