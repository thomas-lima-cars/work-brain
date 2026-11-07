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

## Coleta de 2026-11-03 18:13

`coleta_local.py`, conexão direta: 43 consultas, 45,4 s no banco, nenhum
pacote acima de 130 KB. 264 eventos (fim desde 04/10) · 29.574 negociações ·
4.857 veículos · 2.313 lojas · HTML 2.598 KB. Conferido com
`_confere_banco.py 26`: 30/10 fechado exato, e os cartões de hoje iguais ao banco.

**Hoje (03/11, até 18:13):** 26 eventos ativos no dia · 1.620 veículos · 9
comitentes · ativos 1.409 (146 com acesso, 11 com oferta) · **em análise 136,
todos do vendedor** · vendidos 0 · removidos 75 (44 sem ofertas, 31 cancelados).
No dia: 36 novos; 530 com acesso, 135 com oferta. Lojistas: logaram 660,
acessaram 407, ofertaram 90, compraram 0.

**Por comitente hoje** (eventos · veículos · ativos · análise · removidos):
LM Transportes 14 · 1.260 · 1.162 · 68 · 30 — Banco Volkswagen 2 · 130 · 19 ·
67 · 44 — Outlet Netcarros 2 · 95 · 93 · 1 · 1 — C6 Bank Lojista 1 · 75 · 75 —
Banco Volkswagen S.A. 1 · 20 · 20 — Multifrota 1 · 18 — Kovi 1 · 13 — Vamos 2 · 8
— BB Consórcios 1 · 1.

**30/10 (fechado):** 1.679 veículos ativos, 41 novos · com acesso 614 · com
oferta 86 · vendidos 21 · lojistas 754 / 445 / 103 / 20.
**Período (04/10 a 03/11):** ofertaram 765 lojas · compraram 425.

Vendas com a oferta vencedora **sem loja**: **12** na janela (eram 3 em 28/10).

## Os status do cartão, em funil — coleta de 2026-11-06 14:27

Pedido do Thomas, 06/11, em três passos no mesmo dia:
1. Os status viraram sem oferta, com oferta, VMV atingido, vendidos e
   removidos. Removido ficou só com 8 e 10 (suspenso, cancelado), o que o
   Thomas confirmou.
2. "O volume com oferta e com acesso do gráfico não bate com os cartões": o
   cartão de Sem oferta saiu e o gráfico passou a ser acumulado no evento.
3. "Com oferta e VMV atingido devem ser acumulativos em relação aos status
   posteriores": o cartão virou funil.

**O funil.** De cada veículo dos eventos ativos no dia, conta a negociação no
evento mais recente:
- **Com oferta**: teve lance de loja até o dia, ou vendeu até o dia.
- **VMV atingido**: o maior lance chegou ao VMV, ou vendeu.
- **Vendidos** (2, 3, 7, pela data da oferta vencedora) cabe em VMV
  atingido, que cabe em Com oferta.
- **Removidos** (8, 10) é à parte; o removido que teve lance conta também em
  Com oferta.
- Sem oferta, o resto, não tem cartão.

**Por que o 11 saiu do Removido.** Na coleta de 03/11, o 11 ("sem ofertas")
era 44 dos 75 removidos de hoje. Num dia passado, com o status de hoje, ele
virava quase tudo: **1.618 dos 1.862** veículos de 24/10 (dia 20 daquela
coleta) e 1.383 de 1.679 em 30/10 (dia 26).

**Por que o gráfico não batia.** Antes, o gráfico contava o que aconteceu
NAQUELE dia, e o cartão o estado do veículo. Coleta de 06/11, 11:45, dia
05/11:
- **com acesso**: gráfico 311, cartão 531;
- **com lance**: gráfico 11, cartão 21.

Agora o gráfico, a rosca do comitente e o termômetro do evento contam, de
cada veículo ativo no dia, a negociação do evento mais recente ativo nele
(a mesma do cartão), com acesso, lance ou venda **do começo do evento até o
dia**. O lance de antes do piso vem sem bit e conta.

**Cartão = gráfico, em todo dia.** Com oferta e Vendidos do cartão são o
último ponto do gráfico nos 31 dias, com filtro de canal, comitente e
evento (prova). Os números:

| dia | veículos | com acesso | com oferta | VMV atingido | vendidos | removidos |
|---|---:|---:|---:|---:|---:|---:|
| hoje, 06/11 14:27 | 1.738 | 660 | 33 | 1 | 0 | 78 |
| 29/10 | 1.856 | 524 | 86 | 53 | 50 | 102 |

O que ainda é o status de hoje, num dia passado: removido e a fase
(aberto, em análise, encerrado). O banco não guarda o status de cada dia.

**Desempate por id.** Um veículo pode ter duas negociações no mesmo evento,
com o mesmo fim; aí vale a de id maior. O painel desempatava pela ordem de
chegada das partes. Em 29/10, o veículo 454869 tinha duas no evento 24291,
uma com acesso e outra sem, e a conferência dava 525 contra 524. Desde 06/11
o painel ordena as negociações por id.

**Conferido contra o banco** com `_confere_banco.py` (linhas cruas e conta em
Python):
- **29/10 e 15/10 exatos**, todos os campos.
- Hoje anda com o banco: 33 com oferta contra 34 no banco minutos depois.

## A aba Mensal, 12 meses — coleta de 2026-11-06 14:27

Coleta pelo `coleta_local.py`, conexão direta: **70 consultas, 157 s no
banco** (eram 135 s antes; varia com o cache). A mais lenta é a
`mes_loj_p1`, com 17,8 s. Os pacotes do mensal têm ~1 KB por mês, mais
82 KB da lista de eventos dos 12 meses. O HTML tem **2.723 KB**.

Evento com mais de 31 dias de ofertas fica fora. Sem a regra, dezembro/2025
tinha **11.693** veículos e 67 comitentes: o "Anúncios cancelados" (id 266,
de 25/05/2021 a 16/12/2025) tem **10.127** negociações. Com a regra, 2.199.
Nos 12 meses, 9 eventos passam de 60 dias e somam 10.226 negociações.

O mensal usa o mesmo funil e o mesmo acumulado do diário, sobre a negociação
mais recente do veículo no mês:
- com acesso = alguma loja abriu o anúncio naquele evento, a qualquer tempo;
- com oferta e vendidos do gráfico são os do cartão.

| mês | eventos | veículos | novos | com acesso | com oferta | VMV atingido | vendidos | removidos | valor vendido | lojas acessaram / ofertaram / compraram |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 2025-12 | 159 | 2.199 | 1.688 | 2.065 | 1.118 | 993 | 852 | 13 | R$ 63,1 mi | 1.190 / 495 / 267 |
| 2026-01 | 150 | 2.040 | 1.691 | 1.821 | 1.456 | 1.260 | 1.067 | 39 | R$ 79,0 mi | 1.272 / 552 / 313 |
| 2026-02 ⚠ | 134 | 1.888 | 1.620 | 403 | 1.189 | 960 | 869 | 3 | R$ 59,7 mi | 667 / 530 / 269 |
| 2026-03 ⚠ | 167 | 2.094 | 1.693 | 1.123 | 1.131 | 946 | 845 | 25 | R$ 61,5 mi | 1.129 / 550 / 266 |
| 2026-04 | 154 | 1.908 | 1.614 | 1.784 | 1.324 | 1.121 | 992 | 0 | R$ 72,8 mi | 1.345 / 587 / 310 |
| 2026-05 | 173 | 2.197 | 1.813 | 1.962 | 1.204 | 1.045 | 905 | 20 | R$ 67,9 mi | 1.372 / 584 / 314 |
| 2026-06 | 186 | 2.712 | 2.065 | 1.722 | 1.159 | 987 | 803 | 8 | R$ 66,1 mi | 1.465 / 635 / 308 |
| 2026-07 | 249 | 3.287 | 2.348 | 2.474 | 1.423 | 1.220 | 1.050 | 105 | R$ 74,9 mi | 1.522 / 679 / 372 |
| 2026-08 | 184 | 2.850 | 1.945 | 2.295 | 1.340 | 1.251 | 1.008 | 123 | R$ 73,3 mi | 1.567 / 665 / 370 |
| 2026-09 | 242 | 3.483 | 2.491 | 2.643 | 1.595 | 1.205 | 1.059 | 111 | R$ 75,2 mi | 1.578 / 718 / 367 |
| 2026-10 | 268 | 4.967 | 3.700 | 3.446 | 1.870 | 1.447 | 1.324 | 548 | R$ 105,2 mi | 1.716 / 770 / 427 |
| 2026-11 (até 06/11) | 54 | 2.227 | 499 | 1.046 | 322 | 159 | 150 | 112 | R$ 10,0 mi | 882 / 223 / 90 |

⚠ **Fevereiro e março/2026 têm acesso subcontado.** O `access_logs` não tem
linha de 06/02 a 11/03/2026: só 5 dos 28 dias de fevereiro e 20 dos 31 de
março têm registro (`plataforma/dominios.md`). O painel avisa e marca esses
meses no eixo.

Conferido com `_confere_mes.py` (linhas cruas e conta em Python, sem o SQL
do Montar Consultas):
- Na coleta das 11:45, com a regra antiga: out/26, fev/26 e dez/25 exatos.
- Com o funil (14:27): **out/26, abr/26 e jan/26 exatos** em todos os campos
  e nos eventos.

Fevereiro tem lance com preço nulo: o `MAX` ignora, mas ele conta como lance.

Outubro tem 548 removidos, contra 0 a 123 nos outros meses — não investigado.

## As médias da planilha de metas — 2026-11-06

`gera_metas.py` (conexão direta), 12 meses fechados (nov/25 a out/26), eventos
dos seis canais com no máximo 31 dias de ofertas: **2.157 eventos, 123.407
negociações, 25.056 veículos**. Versão de 06/11 à noite (motos em Leves,
teste fora, inativos de ago a out/26 fora — C6 Bank - CSixer e Repasse Itaú):
**39 grupos** (comitente × categoria) no mensal, **40** no diário — na
planilha larga, **24 comitentes** em cada aba. Base
pequena: no mensal, 7 grupos com a meta do comitente e 14 com a da
categoria; no diário, 7 e 15.

| categoria (todos os comitentes, sem teste) | mensal: % com oferta · % vendidos | diário |
|---|---|---|
| Leves (motos inclusive) | 53,9% · 39,9% | 17,9% · 9,2% |
| Pesados | 57,6% · 41,8% | 14,6% · 5,6% |
| Não informada | 14,0% · 7,0% (quase só a LM) | 2,2% · 0,7% | Os valores de cada grupo moram na planilha
`automations/n8n-sdk/painel-eventos-cars2you/metas-painel-eventos.xlsx` (fonte
única deles); aqui, os maiores e a conferência.

**Conferência contra o painel** (coleta de 06/11 14:27): veículos, com oferta e
vendidos de dez/25 a out/26 iguais, mês a mês (out/26: 4.967 / 1.870 / 1.323
no gerador, 1.324 vendidos no painel — o banco andou); dias 15/10 (1.671 /
178 / 76) e 29/10 (1.856 / 86 / 50) iguais.

| grupo | mensal: veículos/mês · % com oferta · % vendidos | diário: veículos/dia · % com oferta · % vendidos |
|---|---|---|
| Itaú Unibanco · Leves | 883 · 56,2% · 45,1% | 61 · 45,4% · 33,6% |
| LM Transportes · Leves | 751 · 37,4% · 17,8% | 294 · 7,9% · 2,3% |
| C6 Bank Lojista · Leves | 253 · 81,7% · 66,1% | 44 · 25,6% · 12,6% |
| Outlet Netcarros · Leves | 202 · 27,7% · 17,3% | 108 · 4,6% · 1,4% |
| Banco Volkswagen · Leves | 162 · 73,8% · 63,6% | 51 · 28,7% · 12,9% |
| Banco Volkswagen S.A. · Pesados | 107 · 79,2% · 65,6% | 19 · 33,0% · 13,3% |
| LM Transportes · Pesados | 102 · 28,8% · 12,5% | 59 · 6,1% · 1,4% |

⚠️ **A média diária fica muito abaixo da mensal** e é assim por construção: o
% do dia conta o veículo em todo dia em que está ativo, desde a abertura, e
o lance chega perto do fim do evento; o do mês olha o veículo uma vez, já com
o status final. Comparar meta diária com o dia e a mensal com o mês, nunca
cruzado.

Na coleta de 20:07, com a planilha da noite, a meta do dia (06/11) deu 11,8%
com oferta e 4,8% vendidos, para 1.776 dos 1.777 veículos ativos (105 com
oferta, 5,9%); a de nov/26, 45,0% e 28,0%, para 2.206 dos 2.264 (os de
comitente de teste ficam sem meta). Por categoria, hoje: Leves 1.568
veículos, meta 11,5% com oferta; Pesados 198, 15,0%; Não informada 10, 1,3%;
Equipamentos 1, sem meta.
