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

## Funil das lojas novas do WL 43 (2026-09-28)

Conexão direta. Lojas do WL 43 não apagadas com cadastro desde 20/08/2026;
"logou" e "acessou anúncio" em qualquer data (ver `access_logs.route` em
`dominios.md`), "ofertou" em qualquer evento.

| `situation` | lojas | logaram | acessaram anúncio | ofertaram |
|---:|---:|---:|---:|---:|
| 3 | 292 | 255 | 111 | 10 |
| 5 | 11 | 0 | 0 | 0 |

"Aprovado" no painel = `situation = 3` (Thomas, 28/09). Nenhuma loja fora do 3
logou.

## Pátios dos eventos do C6 (2026-09-28)

422 negociações nos eventos do recorte com fim desde 29/08: **100% com
`advertisements.shop_stock_id`**, 22 pátios, todos com nome ("HUB Suzano/SP"
133, "HUB São Jose dos Pinhais/PR" 43, "HUB Goiania/GO" 37…, e cinco "DC - …").
Dois ids diferentes têm o **mesmo nome** ("HUB Varzea Grande/MT", 109849 e
109848): o painel agrupa pelo nome.

## Painel de Eventos C6 — pacotes de acesso (2026-09-28)

Conexão direta, eventos do recorte com fim desde 29/08, acessos do WL 43 entre
o menor início e o maior fim desses eventos.

| pacote | linhas | JSON | tempo |
|---|---:|---:|---:|
| loja × dia, com máscara das horas (`BIT_OR(1 << HOUR)`) e contagem | 3.491 | 105 KB | 4,8s |
| dia × hora, contagem | 603 | 11,8 KB | 4,7s |
| evento × anúncio × loja, distinto, dentro do intervalo do próprio evento | 4.071 | 101 KB | 3,2s |

Sem resumo, o bruto seria 34.767 acessos. `USUARIO_GN` da planilha:
vazio em 19.321 das 30.718 linhas (63%), 250 valores distintos.

⚠️ Esses três pacotes foram **substituídos em 29/09** (tabela abaixo): o
filtro de Representante precisa saber de quem é cada acesso por hora.

## Painel de Eventos C6 — as sete consultas da versão 3 (2026-09-29)

`coleta_local.py` (SQL exato do nó), conexão direta, eventos com fim desde
30/08. Uma linha por consulta.

| consulta | linhas | pacote | tempo |
|---|---:|---:|---:|
| `eventos` | 16 | 1,6 KB | 0,28s |
| `veiculos` | 415 | 81,8 KB | 0,57s |
| `ofertas` | 1.857 | 114,8 KB | 0,45s |
| `lojas` | 315 | 25,2 KB | 0,60s |
| `acessos_anuncio` (com máscara dos dias) | 4.006 | 108,8 KB | 0,46s |
| `acessos_p0` (loja × dia × hora, id par) | 4.459 | 116,1 KB | 1,95s |
| `acessos_p1` (id ímpar) | 3.416 | 89,2 KB | 2,29s |

Loja × dia × hora inteiro daria ~205 KB — acima dos 130 KB que o MCP já
provou passar, por isso as duas partes. A página gerada tem 700 KB.

### O painel com essa coleta (sem filtro)

| medida | valor |
|---|---:|
| veículos publicados / com oferta / vendidos | 415 / 192 / 161 |
| volume vendido | R$ 6.980.500 |
| anúncios acessados | 370 (89%) |
| com VMV atingido | 31 |
| lances / ofertantes / compradores | 1.857 / 111 / 63 |
| lojas que acessaram o canal no período | 555 |
| acessos no período (todas / lojas novas) | 34.281 / 2.577 |
| funil dos novos: cadastrados → aprovados → logaram → acessaram → ofertaram → compraram | 213 → 213 → 192 → 82 → 9 → 4 |
| pátios | 21 |

Representante nas 315 lojas do painel: **GP** 298 únicos, 9 vazios na
planilha, 8 fora dela; **GN** 141 únicos, 166 vazios, 8 fora.

## Carteira de representantes no n8n — tabelas de dados (2026-09-30)

A planilha virou duas **tabelas de dados** no projeto Cars2You do n8n. Contadas
pela API de tabelas (filtro + `count`), em 30/09:

| medida | valor |
|---|---:|
| "Carteira C6 - Lojas (base 17-08-2026)" (`3CErbnlGy2b5sFT5`) | 30.719 linhas |
| — iguais à planilha de 24/09 (mesma primeira e última linha) | 30.718 |
| — linha de teste ("LOJA TESTE CAIO", `Base_Data` = "TESTE - apagar antes de produção") | 1 |
| linhas com `GN_Usuario` vazio (tabela / planilha) | 19.321 / 19.321 |
| linhas com `GP_Usuario` vazio (tabela / planilha) | 1.190 / 1.189 — a diferença é a linha de teste |
| "Carteira C6 - Gerentes" (`2yD9cWG0J98sFFll`) | 280 linhas: 249 GN + 30 GP + 1 de teste do Caio |
| usuários distintos na carteira (GN / GP / nos dois papéis) | 249 / 30 / 0 — todos com nome na tabela de gerentes |

O `Nome` é o usuário com a inicial maiúscula (RAFAEL.CONTESSOTO → Rafael
Contessoto); `Qtd_Lojas` bate com a contagem na carteira (conferido em 6
usuários).

## Painel de Eventos C6 — runs no n8n (2026-09-28/29)

| run | workflow | resultado |
|---|---|---|
| 54781 | `8051egvfncc3unuT` (arquivado) | disparado com upload desligado; o resultado não foi lido (leitura barrada pela permissão) |
| 54794 | `53RGtYzUzMoVtxpJ` | **erro em 1,2s**: 404 no Baixar Representantes — `LojasAtivas_C6.xlsx` não está no SharePoint |
| 55187 (30/09) | `0Ndif0UK2UjTfaIN` | **caiu em 0,8s, falta de memória**: o Ler Nomes (tabela de dados) rodou uma vez por item de entrada — 30.719 × 280 |
| 55191 (30/09) | `0Ndif0UK2UjTfaIN` | ✅ **15 s**, primeira publicação: 732.180 bytes no SharePoint |

### O painel publicado no run 55191 (2026-09-30, 11:01, sem filtro)

| medida | valor |
|---|---:|
| eventos / veículos publicados / com oferta / vendidos | 16 / 417 / 200 / 158 |
| ofertas / lojas no cadastro do painel | 1.882 / 318 |
| valor vendido | R$ 6.821.500 |
| vendido ÷ soma dos VMV publicados | 34,3% |
| arremate ÷ FIPE (vendidos com FIPE) / ÷ VMV (vendidos com VMV) | 65,3% / 87,5% |
| funil dos novos: cadastrados → aprovados → logaram → acessaram → ofertaram → compraram | 215 → 214 → 192 → 82 → 9 → 4 |
| representante GP: único / vazio na carteira / fora dela | 300 / 9 / 9 |
| representante GN: único / vazio na carteira / fora dela | 143 / 166 / 9 |
| linhas da carteira ignoradas (sem `Base_Data` de data) | 1 |

Score do veículo na coleta local de 29/09: maior bruto **353**; com peso 100 no
VMV e escala 0–100 inteira, 25 veículos com 1 ou 2 acessos cairiam em 0 junto
com os 44 sem atividade — por isso uma casa decimal.

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
