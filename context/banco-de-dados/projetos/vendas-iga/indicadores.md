# Estudo de Vendas IGA — números medidos

> 🔴 **Fonte única** dos números deste estudo. O HTML e o `README` da pasta
> `automations/estudo-vendas-iga/` linkam aqui. **Atualizado em 2026-11-09** (`ULTIMO = 2026-10`,
> nov/26 aberto fica fora), base Cars2You, pela conexão direta (`extrai.py`: 77.000 negociações do
> IGA e 16.014 vendas dos demais desde out/21), analisado em `analise.py`; os números de manchete
> são os que a página mostra (todos os clusters).
> **v2 (08/10):** mês a mês, êxito por veículo único, % sobre a FIPE. A página mostra de **jan/24**
> em diante; a regressão do esperado de mercado usa vendas desde jan/23.
> Histórico: medido em 08/10 e re-extraído em 15/10 (`ULTIMO = 2026-09`); a coluna "até set/26"
> abaixo é o que a página mostrava então, para comparar.

## O que é "IGA" no banco

Anúncio cujo vendedor (`advertisements.shop_id`) é **594 Itaú Unibanco**, **598 Repasse
Itaú** ou **16036 IGA Participações**. O whitelabel 64 "Venda Direta Itaú" **não** serve de
critério: os eventos "Venda Direta IGA" miram os whitelabels 5 e 7.

## Definições do estudo (v2)

| | |
|---|---|
| Veículo publicado | veículo único por mês de evento: 55.095 veículos-mês de out/21 a out/26 (54.342 até set/26) |
| Êxito | vendidos ÷ publicados (únicos no mês) |
| % sobre a FIPE | (preço de venda, ou o VMV se não vendeu) ÷ FIPE do anúncio; corte 20%–120%; VMV 999999 fora |

## 🔴 O cluster mudou de classificação em 2025

`vehicles.cluster_id` tem duas taxonomias que **não se sobrepõem**: **C1–C6** até **abr/25**
e **G1–G17** a partir de **mar/25** (fev/25 já tem 21 veículos G). Em 2025-05 só 10 veículos
são C contra 1.265 G. Cluster **não é série contínua**: filtrar por C dá só até a troca,
por G só depois. Medido em 08/10 sobre os veículos do IGA. Não se sabe o mapeamento C → G.

## Manchetes da página

| | até out/26 (09/11) | até set/26 (08/10) |
|---|---:|---:|
| Êxito, 12 meses | **46,7%** (+3,3 p.p. sobre os 12 anteriores, 43,4%) | 47,7% (+4,8; 42,9%) |
| Vendidos / publicados, 12 meses | 5.144 de 11.016 | 5.433 de 11.383 |
| Vendidos, 12 anteriores | 5.593 (−8,0%) | 5.473 (−0,7%) |
| Volume vendido, 12 meses | R$ 237,5 mi | R$ 249,4 mi |
| Lojas que compraram no último mês | 84 (out/26) | 98 (set/26) |
| % sobre a FIPE nas vendas, 12 meses | 67,4% (−2,5 p.p.) | 67,7% (−2,8) |
| Esperado de mercado, mesmos veículos | 65,5% | 65,5% |
| IGA − esperado, 12 meses | **+2,0 p.p.** (+3,3 nos 12 anteriores) | +2,2 (+3,4) |
| Meses com diferença positiva (desde jan/24) | 33 de 34, média +3,8 p.p. | 32 de 33, +3,9 |
| Recorrentes que pararam | **53 de 148 (36%)** | 45 de 145 (31%) |

Out/26 teve o menor êxito da série desde dez/24 (29%): **33%** (250 vendidos de 753 publicados);
jul a out/26: 37%, 39%, 35%, 33%.

## Êxito por janela fixa (vendidos ÷ publicados únicos no mês)

| período | êxito |
|---|---:|
| jan–jun/24 | 54% |
| jul/24–mar/25 | 38% |
| out/25–mar/26 | 53% |
| abr–out/26 | **41%** (2.426 vendidos de 5.950 publicados) |

As janelas ficam no molde (`JAN` em `estudo.template.html`). As três primeiras são fixas; a
última, desde 09/11 (Thomas), vai de abr/26 até o último mês fechado e anda sozinha a cada
atualização. Até 08/10 era abr–set/26: 42% (41,9%, 2.176 de 5.197 na extração de 09/11).
Com a re-extração de 09/11 as três primeiras não mudaram.

## % sobre a FIPE

Desde jan/23, só vendas: IGA **69,6%**, demais **72,0%** (até set/26: 69,7% e 72,1%). O IGA vende
carro mais velho: idade mediana 8 anos contra 3; 125 mil km contra 96 mil; FIPE mediana R$ 48 mil
contra R$ 69 mil.

**Contra o esperado de mercado** (regressão com efeito fixo de modelo, idade, km, cluster, mês;
**139 modelos** nos dois lados, ≥ 5 vendas cada; 14.405 vendas IGA × 9.437 dos demais; até set/26
eram 135 modelos, 14.187 × 8.683): manchetes na tabela acima. Média da diferença por veículo
(venda ou VMV, 21.380 veículos): +4,1 p.p. Conferência por pareamento exato (**441 células**
trimestrais, 1.621 vendas IGA × 1.654): **+0,8 p.p.** — mesmo sinal, menor.

🔴 A FIPE do anúncio, para o IGA, só está preenchida para o que vendeu até 3T/25 (não
vendidos 0–40%, vendidos 76–100%; depois 70–90% nos dois). Antes de 4T/25 a média do IGA
mistura vendas bem cobertas com VMV de poucos não vendidos.

## Pedido (VMV) contra o preço que comparáveis alcançaram (sem FIPE)

147 modelos, de jan/23 a out/26 (32.654 veículos). Êxito por faixa do VMV em relação ao mercado
(as faixas saíram da página; medido em `resultados.json`, `fx`):

| faixa | êxito 09/11 | 08/10 |
|---|---:|---:|
| mais de 10% abaixo | 63% | 64% |
| até 10% abaixo | 59% | 59% |
| até 10% acima | 51% | 52% |
| 10 a 25% acima | 43% | 43% |
| mais de 25% acima | 29% | 29% |

Decomposição do êxito (pelo pedido × pela demanda), **medida em 08/10, não refeita em 09/11**:
jan–jun/24 → jul/24–mar/25: −0,2 × −12,4 p.p.; → out/25–mar/26: +1,7 × +9,6; → abr–set/26:
+0,3 × −11,8. **O êxito se move pela demanda, não pelo nível de pedido** (decomposição, não
prova de causa).

🔧 Correção de 08/10: a v1 calculava o "esperado de mercado" com o efeito fixo de modelo
tirado SEM o termo IGA, o que colava o esperado no próprio IGA e encolhia o pedido e a
diferença. Na v2 o termo IGA entra na conta do efeito fixo.

## Compradores

**Recorrente (definição de 09/10):** comprou do IGA no mês **e** em ao menos 6 dos 12 meses
anteriores.

**09/11:** 148 lojas foram recorrentes em algum mês da janela-base (jul/25 a jun/26); **53 não
compraram de jul a out/26** (36%), 994 compras na janela-base. Dos 53: 41 ainda acessam o canal;
40 sem nenhuma oferta ao IGA no período; **224 → 10 ofertas ao IGA por loja** (janela-base →
jul–out/26). 720 lojas distintas compraram do IGA desde out/21 (580 ativas); 291 compraram nos
últimos 12 meses.

08/10 (janela-base jun/25 a mai/26, parou = sem compra de jun a set/26): 45 de 145 (31%), 947
compras; 33 acessam, 34 sem oferta, 234 → 12 ofertas por loja; 715 lojas desde out/21.

🔧 Correção de 09/11: `analise.py` montava o fim da janela-base como "dia 31" de qualquer mês.
Com a janela terminando em junho, `2026-06-31` não é data e o MySQL zerava as ofertas da
janela-base. Agora usa o último dia real do mês (até 08/10 a janela fechava em maio, então os
números antigos não foram afetados).
