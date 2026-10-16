# Estudo de Vendas IGA — números medidos

> 🔴 **Fonte única** dos números deste estudo. O HTML e o `README` da pasta
> `automations/estudo-vendas-iga/` linkam aqui. Medido em **2026-10-08**, base
> Cars2You, pela conexão direta (`extrai.py`), analisado em `analise.py`.
> **v2 (08/10):** mês a mês de jan/23 a set/26, êxito por veículo único, % sobre a FIPE.
> Os números da v1 (conversão por negociação, deságio por trimestre) foram substituídos.
> **Re-extraído em 2026-10-15** (mesmo `ULTIMO = 2026-09`): as manchetes abaixo não mudaram;
> mudaram detalhes por loja (5 de 715 trocaram de "ativa") e somas por célula do `resultados.json`
> (`cel.sec/ses/sg`, 28 de 31 itens; causa não medida). Pareamento exato: 434 células em vez
> de 435, mesmo +0,8 p.p.

## O que é "IGA" no banco

Anúncio cujo vendedor (`advertisements.shop_id`) é **594 Itaú Unibanco**, **598 Repasse
Itaú** ou **16036 IGA Participações**. O whitelabel 64 "Venda Direta Itaú" **não** serve de
critério: os eventos "Venda Direta IGA" miram os whitelabels 5 e 7.

## Definições do estudo (v2)

| | |
|---|---|
| Veículo publicado | veículo único por mês de evento: 54.342 veículos-mês de out/21 a set/26 (42.644 de jan/23 a set/26) |
| Êxito | vendidos ÷ publicados (únicos no mês) |
| % sobre a FIPE | (preço de venda, ou o VMV se não vendeu) ÷ FIPE do anúncio; corte 20%–120%; VMV 999999 fora |

## 🔴 O cluster mudou de classificação em 2025

`vehicles.cluster_id` tem duas taxonomias que **não se sobrepõem**: **C1–C6** até **abr/25**
e **G1–G17** a partir de **mar/25** (fev/25 já tem 21 veículos G). Em 2025-05 só 10 veículos
são C contra 1.265 G. Cluster **não é série contínua**: filtrar por C dá só até a troca,
por G só depois. Medido em 08/10 sobre os veículos do IGA. Não se sabe o mapeamento C → G.

## Êxito (vendidos ÷ publicados únicos no mês)

| período | êxito |
|---|---:|
| jan–jun/24 | 54% |
| jul/24–mar/25 | 38% |
| out/25–mar/26 | 53% |
| abr–set/26 | 42% |
| 12 meses até set/26 | 47,7% (12 anteriores: 42,9%); 5.433 vendidos de 11.383 publicados |

## % sobre a FIPE

Últimos 12 meses: IGA (venda ou VMV) **67,0%**, demais vendedores (venda) **71,1%**. Desde
jan/23, só vendas: IGA 69,7%, demais 72,1% (o IGA vende carro mais velho: idade mediana 8
anos contra 3; 124 mil km contra 96 mil; FIPE R$ 48 mil contra R$ 69 mil).

**Contra o esperado de mercado** (regressão com efeito fixo de modelo, idade, km, cluster,
mês; 135 modelos nos dois lados, ≥ 5 vendas cada; 14.187 vendas IGA × 8.683 dos demais):
IGA **+2,2 p.p.** nos últimos 12 meses (+3,4 nos 12 anteriores), **positivo em 43 dos 45
meses**, média da série +4,1 p.p. (equivale ao antigo deságio 4,1 p.p. menor).
Conferência por pareamento exato (435 células trimestrais): **+0,8 p.p.** — mesmo sinal, menor.

🔴 A FIPE do anúncio, para o IGA, só está preenchida para o que vendeu até 3T/25 (não
vendidos 0–40%, vendidos 76–100%; depois 70–90% nos dois). Antes de 4T/25 a média do IGA
mistura vendas bem cobertas com VMV de poucos não vendidos.

## Pedido (VMV) contra o preço que comparáveis alcançaram (sem FIPE)

146 modelos, de jan/23. Êxito por faixa do VMV em relação ao mercado:

| faixa | êxito |
|---|---:|
| mais de 10% abaixo | 64% |
| até 10% abaixo | 59% |
| até 10% acima | 52% |
| 10 a 25% acima | 43% |
| mais de 25% acima | 29% |

Decomposição do êxito (pelo pedido × pela demanda): jan–jun/24 → jul/24–mar/25: −0,2 × −12,4 p.p.;
→ out/25–mar/26: +1,7 × +9,6; → abr–set/26: +0,3 × −11,8. **O êxito se move pela demanda, não
pelo nível de pedido** (decomposição, não prova de causa).

🔧 Correção de 08/10: a v1 calculava o "esperado de mercado" com o efeito fixo de modelo
tirado SEM o termo IGA, o que colava o esperado no próprio IGA e encolhia o pedido e a
diferença. Na v2 o termo IGA entra na conta do efeito fixo.

## Compradores

**Recorrente (definição de 09/10):** comprou do IGA no mês **e** em ao menos 6 dos 12 meses
anteriores. (Até 08/10 era "3 meses com compra em 6"; os números abaixo substituem os dessa regra.)

145 lojas foram recorrentes em algum mês da janela-base (jun/25 a mai/26); **45 não compraram
de jun a set/26** (31%), 947 compras na janela-base. Dos 45: 33 ainda acessam o canal; 34 sem
nenhuma oferta ao IGA no período; 234 → 12 ofertas por loja. 715 lojas distintas compraram do
IGA desde out/21.
