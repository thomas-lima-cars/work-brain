# Painel de Eventos Cars2You — indicadores medidos

> Fonte única dos números do Painel de Eventos Cars2You
> ([`automations/n8n-sdk/painel-eventos-cars2you/`](../../../../automations/n8n-sdk/painel-eventos-cars2you/README.md)).
> Cada número traz data e como foi medido. Significado das tabelas em
> [`plataforma/dominios.md`](../../plataforma/dominios.md).

## O recorte de 30 dias nos seis canais — 2026-10-28

Medido por conexão direta (`consulta.py --base cars2you`), eventos que alvejam
4, 7, 43, 48, 62 ou 65, não apagados, com fim desde 28/09/2026.

| medida | valor |
|---|---|
| eventos que já abriram (medição das 12:00) | 262: 246 encerrados e 16 abertos. Na coleta das 15:35, 265 |
| eventos agendados, ofertas ainda fechadas (12:00) | 22, com 498 negociações — fora do painel |
| canais com evento | **só 4, 7 e 43** (7: 250 eventos; 4: 79; 43: 14). 48, 62 e 65: nenhum |
| negociações apagadas (`an.deleted_at`) | **0** |
| anúncio apagado com negociação no evento | 0 |
| status das negociações dos encerrados | 11 (sem ofertas) 23.765 · 7: 807 · 14: 668 · 10: 451 · 1: 366 · 2: 350 · 15: 164 · 18: 106 · 3: 90 · 13: 25 · 9: 10 · 8: 1 |

### A LM recria o anúncio a cada feirão

| comitente | negociações | anúncios | veículos | eventos |
|---|---:|---:|---:|---:|
| LM Transportes | 23.495 | 23.495 | **2.781** | 130 |
| os outros 16 | 4.369 | 4.369 | 2.159 | 131 |

Um anúncio por negociação nos dois grupos, mas na LM cada veículo passa em
**8,4 feirões** em 30 dias. Consequência: "veículo" no painel é sempre o
**distinto** (`vehicle_id`); contar negociação ou anúncio multiplicaria a LM.

Comitentes por negociações: LM Transportes 23.495 · Outlet Netcarros 1.360 ·
C6 Bank Lojista 806 · Itaú Unibanco 753 · Banco Volkswagen 737 + 166 (duas
lojas) · GMF 143 · Kovi 112 · Creditas 85 · Scania 60 · e cauda.

### `vehicles.created_at` é o dia da primeira negociação, não o dia em que o carro estreia

Sobre os 4.940 veículos do recorte:

| medida | fora da LM | LM |
|---|---:|---:|
| veículos | 2.159 | 2.781 |
| criados desde 28/09 | 1.788 | 1.930 |
| criados no dia da 1ª negociação da vida | **2.159 (100%)** | 2.777 |
| criados no dia em que abriu o 1º evento deles na janela | **376** | 1.418 |
| já negociados antes de 28/09 | 371 | 851 |

O cadastro acontece quando o evento é montado, dias antes de abrir. Por isso
o painel chama de **novo** o veículo no dia da **estreia** (início das ofertas
do primeiro evento da vida dele), e não no dia do cadastro.

## Volume e pacotes — coleta de 2026-10-28 15:35

`coleta_local.py`, conexão direta, o SQL exato do Montar Consultas.

| | |
|---|---|
| eventos | 265 |
| negociações / veículos | 27.865 / 4.941 |
| pares (negociação, loja) com acesso a anúncio | ~52 mil, em 12 partes de 95 a 110 KB |
| pares (negociação, loja) com lance | 5.215 |
| vendas (oferta vencedora em 2, 3, 7) | 1.251 |
| (loja, canal) com login | 2.307 |
| lojas citadas | 2.306 |
| consultas / tempo no banco | **43 / ~50 s** |
| maior pacote | `negs` ~103 KB em 14 partes (120 KB em 12) |
| HTML | **2.574 KB** |

Com 10 partes de acesso, três passaram de 130 KB (até 133,5): por isso 12.

## O que o painel mostrou — coleta de 2026-10-28 15:35

Conferido contra SQL escrito de novo (`_confere_banco.py`), exato nos dias
fechados.

**Hoje (28/10, até 15:35):** 19 eventos ativos no dia · 1.754 veículos · 10
comitentes · ativos 1.412 (619 com acesso, 66 com oferta) · em análise 5 ·
vendidos 4 (R$ 221.400) · removidos 333 (303 sem ofertas, 30 cancelados).

**20/10 (dia 22, fechado):** 1.851 veículos ativos, 80 novos · com acesso 628
(33,9%) · com oferta 70 (3,8%) · vendidos 43 (2,3%) · lojistas: logaram 811,
acessaram 532, ofertaram 101, compraram 34.

**28/09 (dia 0):** lojistas logaram 762, acessaram 449, ofertaram 72,
compraram 17.

**O período inteiro (28/09 a 28/10):** logaram 2.304 lojas · acessaram 1.705
· ofertaram 776 · compraram 420.

### Oferta vencedora sem loja

3 vendas do recorte (28/09, Marketplace) têm a oferta vencedora com
`buyer_shop_id` nulo — no C6 isso nunca aconteceu (`c6/indicadores.md`). Mais
1 venda com a oferta vencedora de 27/09, antes da janela.

### A carteira comercial na coleta local

Com o literal do Radar (21/09, 1.436 CNPJ em 7 carteiras): **1.080 das 2.306
lojas** do painel casam pelo CNPJ (47%); 1.226 ficam "Não distribuído"; 0 sem
CNPJ. No Radar o casamento é 94% porque as lojas dele são as elegíveis, quase
todas clientes da carteira; aqui entra toda loja que logou.
