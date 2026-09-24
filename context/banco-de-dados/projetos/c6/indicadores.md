# C6 — indicadores medidos

> Fonte única dos números da frente C6. Cada número traz data e como foi
> medido. Significado das tabelas em
> [`plataforma/dominios.md`](../../plataforma/dominios.md).

## Eventos do Canal C6 Auto (WL 43) — 2026-09-24

Medido por conexão direta (`consulta.py --base cars2you`), eventos com nome
`Evento Exclusivo C6 Auto%` e fim a partir de 2026-06-01.

| medida | valor |
|---|---|
| eventos de 01/06 a 30/09 | **55** (~14 por mês) |
| veículos por evento | 7 a 83 |
| lances por evento | 0 a 519 |
| lojas ofertantes por evento | até 52 |
| lances sem loja (`buyer_shop_id` nulo) | **0** em todos |
| veículo de outra loja vendedora que não a 104754 | **0** em todos |
| canais alvejados | só o 43, em todos |

### Desfecho das negociações (mesmo recorte)

| status | negociações | com `offer_actual_id` | vencedora = maior oferta | com transação |
|---:|---:|---:|---:|---:|
| 11 Sem ofertas | 870 | 0 | — | 0 |
| 7 Vendido | 550 | 550 | 550 | 550 |
| 18 Venda cancelada | 111 | 111 | 111 | 111 |
| 14 Vendedor rejeitou | 106 | 105 | 103 | 1 |
| 2 Aguardando pagamento | 69 | 69 | 69 | 69 |
| 1 Ativo | 36 | 4 | 4 | 0 |
| 15 Comprador rejeitou | 5 | 5 | 5 | 0 |
| 3 Aguardando confirmação | 5 | 5 | 5 | 5 |

Nenhum lance com preço zero, nenhum de usuário interno.

### Lojas que ofertaram (mesmo recorte)

**202 lojas, todas do WL 43**, cadastradas de 2023-03-23 a 2026-09-21.
**Nenhuma** tem `key_account_id`, `business_consultant_id` ou
`business_consultant_2_id` preenchido.

### Lojas novas no WL 43, por mês de cadastro

| mês | lojas | já ofertaram |
|---|---:|---:|
| 2026-03 | 20 | 3 |
| 2026-04 | 12 | 2 |
| 2026-05 | 13 | 3 |
| 2026-06 | 121 | 14 |
| 2026-07 | 186 | 16 |
| 2026-08 | 131 | 4 |
| 2026-09 (até 24) | 212 | 8 |

O cadastro cresceu 10× a partir de junho e a conversão em oferta não
acompanhou.

## Planilha de lojas ativas do C6 — representantes (2026-09-24)

`LojasAtivas_C6.xlsx`, recebida do Thomas em 24/09 (exportação do BigQuery, aba
`bquxjob_6e22e03c_1a010a5444a`). Perfilada com `openpyxl`, sem banco.

| medida | valor |
|---|---:|
| linhas | 30.718 |
| CNPJs distintos | 30.179 |
| `NR_CNPJ` | texto, 14 dígitos em 100% das linhas |
| `TP_STATUS` | `A` em 100% |
| linhas sem `USUARIO_GP` | 1.189 |
| CNPJs só com linhas sem representante | 1.099 |
| CNPJs com **mais de um** representante | 35 — todos com mais de um `CD_LOJA` (filiais); 7 com empate no topo |
| representantes distintos | 30 |

### Casamento com as lojas do painel (2026-09-24, noite)

`shops.cnpj` das **3.191 lojas do WL 43**: 14 dígitos em 100%, sem máscara,
nenhuma vazia (medido por conexão direta). Os dois lados já vêm só com
dígitos; o nó normaliza assim mesmo.

Coleta local com o SQL do nó (17 eventos, 399 lojas no painel):

| caminho | lojas |
|---|---:|
| representante único | 381 |
| mais de um representante (maioria / empate) | 0 / 0 |
| CNPJ na planilha sem representante | 10 |
| CNPJ fora da planilha | 8 |
| loja sem CNPJ | 0 |

Das **113 lojas que ofertaram, 111 têm representante** e 2 ficaram Sem
Representante. 22 representantes aparecem no ranking.

## Painel de Eventos C6 — custo das consultas (2026-09-24)

SQL exato do nó `Montar Consultas`, rodado pela conexão direta
(`coleta_local.py`), às 14:24. Uma linha por consulta, com a tabela
empacotada em `JSON_ARRAYAGG`.

| consulta | linhas | pacote | tempo |
|---|---:|---:|---:|
| `eventos` | 16 | 1,6 KB | 0,29s |
| `veiculos` | 383 | 86,2 KB | 0,59s |
| `ofertas` | 2.100 | 129,9 KB | 0,44s |
| `lojas` | 399 | 29,6 KB | 0,31s |
| `ult_anterior` | 320 | 11,3 KB | 1,11s |

No n8n, pelo MCP, o **run 53605 inteiro levou 5,3s** (seis nós, cinco
chamadas). O pacote de 130 KB passou inteiro, conferido contra o `total`.
O tamanho que o relatório de evento C6 de produção passa pelo MCP **não foi
medido** — não há outro número para comparar.

## Painel de Eventos C6 — primeira coleta (2026-09-24, 14:47)

Run **53605** do workflow `VelPJDX8USP9WIeT`, 5,3s. Recorte: 16 eventos do WL 43
com fim desde 25/08/2026.

| medida | valor |
|---|---:|
| veículos publicados (negociações) | 383 |
| vendidos | 181 |
| volume vendido | R$ 7.783.300 |
| com oferta / sem oferta | 207 / 176 |
| lances | 2.101 |
| veículos com oferta no VMV | 40 |
| lojas ofertantes | 112 |
| lojas que arremataram | 68 |
| lojas novas no canal (25/08 a 24/09) | 295, das quais 8 ofertaram |

Os números por evento batem com a medição independente acima (23957: 48
veículos, 506 lances, 50 lojas; 23852: 57/262/44; 23969: 25/130/32;
23938: 20/200/31) — travados em `automations/n8n-sdk/painel-eventos-c6/prova-local.js`.
