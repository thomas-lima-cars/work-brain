# Qualidade do dado — o que mente, e como

> Armadilhas **da plataforma**, válidas para qualquer projeto. O que é achado
> de um estudo só mora em `../projetos/<nome>/`.
>
> Cada item traz **quando foi medido**. Dado se conserta; a lista envelhece.

## Colunas que não são o que o nome diz

| coluna | o problema | medido |
|---|---|---|
| `advertisement_negotiations.value_actual` | **Não é o valor da venda.** Preenchida em 72.346 das 72.354 negociações "Sem Ofertas" | 14/09 |
| `versions.code_molicar` | **Repete o valor de `code_fipe`** na maioria das linhas. Não é código Molicar | 14/09 |
| `advertisement_negotiations.min_sale_price` (VMV) | **Na Dealers é valor-sentinela:** `999000,00` em 98,1% das vendas, 66 valores distintos em 4.771 linhas. Na Cars2You é real (mediana 0,71× a FIPE) | 17/09 |
| `vehicle_extra_fields.reason` | Preenchida em **1** de 4.582 linhas | 15/09 |
| `vehicles.ports_qtd` | Preenchida em **11** de 1.302 linhas | 14/09 |

## Catálogos duplicados

| catálogo | o problema | medido |
|---|---|---|
| `models` | O **mesmo modelo repartido em ids diferentes**. Strada = 601 e 2000000428; Saveiro, Toro, Renegade, Hilux, Compass, S10 idem. Na Cars2You: 2.876 registros para 2.390 nomes distintos | 18/09 |
| `colors` | "Branco" (735) e "Branca" (53) como níveis **separados** | 14/09 |

➡️ Por isso agrupar por **nome normalizado**, não por id. Ver
[`../projetos/precificacao/definicoes.md`](../projetos/precificacao/definicoes.md).

## Datas

| onde | o problema |
|---|---|
| `advertisement_negotiations.finish_date_offer` | Registros em **1969** e em **2030**. Nunca use para ordenar "a última" — use `MAX(id)` |
| Todas | O banco responde em **UTC**; os eventos são horário de Brasília |

## Soft delete

**79 tabelas têm `deleted_at`.** Esquecer o `IS NULL` infla contagem. Atenção
especial em `users`, `advertisements`, `vehicles` e `offers`, que alimentam
quase toda métrica.

## Contagem de linhas

⚠️ **`information_schema.tables.table_rows` é estimativa e erra.** Em 17/09,
ao classificar 44 tabelas como vazias ou não, errou em 2 casos — nos dois
sentidos. **Contar com `COUNT(*)`** antes de afirmar que uma tabela está vazia.

## Preenchimento que varia por base

Antes de usar uma coluna numa análise que cruza as duas operações, **medir o
preenchimento nas duas**. Exemplos encontrados em 17/09:

| coluna | Cars2You | Dealers |
|---|---:|---:|
| `valor_molicar_anuncio` | 54,1% | **0,0%** |
| `valor_ref_vendedor` | 57,7% | **0,0%** |
| `cluster` | 22 níveis | **3 níveis** |
| `whitelabel_id` | 6 níveis | **1 nível** |
| FIPE do anúncio | 85,6% | 73,8% |

Uma coluna morta numa base não é "efeito zero" — é **ausência de medida**.

⚠️ **`vehicles.cluster_id` mudou de taxonomia em 2025** (C1–C6 até abr/25, G1–G17 a partir de mar/25, sem sobreposição). Detalhe e medição em [`projetos/vendas-iga/indicadores.md`](../projetos/vendas-iga/indicadores.md).

## Texto livre

`vehicles.description` é `TEXT` digitado à mão, preenchida em ~98%.

- ⚠️ **Não é texto livre de verdade na Cars2You**: 1.410 textos distintos para
  4.596 vendas, com frases de formulário cobrindo boa parte. Na Dealers é
  genuinamente livre: 4.470 distintos para 4.771.
- ⚠️ **Cláusula de contrato se disfarça de informação.** "não mencionamos sobre
  o funcionamento do motor" aparece em 71,4% das vendas da Dealers — é texto
  jurídico genérico, não afirmação sobre aquele carro.
- ⚠️ **Termo presente em quase toda a base não separa nada.** O "efeito" que
  ele mostra está medido contra o punhado de linhas sem descrição.
- ⚠️ **Contém CNPJ digitado à mão.** Encontrado 1 de instituição financeira em
  4.771 descrições. Sem CPF, chassi ou renavam — conferido por regex.

## PII — o que nunca sai numa consulta

`vehicles.plate`, `chassi`, `renavam`; `vehicle_extra_fields.renavam`,
`last_owner_name`, `last_owner_document`, números de motor, `contract_number`;
`users.email`; `shops.cnpj`; qualquer coluna `*document*` (são CPF/CNPJ).

**Nunca `SELECT *`** em `vehicles` nem em `vehicle_extra_fields`.

## Registros de outra natureza dentro da base de vendas

🚨 **Chevrolet Agile (código FIPE 004362-1), Cars2You, medido em 15/09.**
39 de 44 vendas com `km NULL`, `ano_modelo 2010`, FIPE ~R$ 28 mil e venda de
R$ 35 mil a **R$ 503 mil** — com o **VMV igual ao preço de venda**. O preço foi
definido, não disputado. Concentrado em poucos compradores, em blocos de ids
consecutivos criados no mesmo dia.

Não são lances fora da curva: são **lançamentos de outra natureza**. A
assinatura (`km NULL` + VMV = preço de venda) nunca foi procurada no resto da
base — pendência aberta.

🧪 **Contas de teste vendendo em produção — medido em 14/10/2026.** Vendedores
(`shops`) com nome de teste aparecem como comitente de vendas reais nas duas
bases, na amostra de 100 modelos × 12 meses do preditivo: "Teste Cars2you v3 -
novo" e "Teste Concessionária A" (Cars2You, 5 vendas), "Dealers Club - Teste 1"
e "Tutorial Dealers Club - Teste" (Dealers, 19). Razão venda/FIPE média de
0,56 a 0,76 — não destoa a ponto de saltar no olho. **Filtro por nome**
(`teste|tutorial` em `shops.name`) no `preditivo/modelo-preco.py`. Não se sabe
se há conta de teste sem "teste" no nome.

**A conta de teste carrega cópia de carro real (medido em 2026-11-18).** Casando
as duas bases por chassi, "Teste Cars2you v3 - novo" (Cars2You) tem 61 carros que
na Dealers são do C6, do Banco Volkswagen, da Finamax e do Bradesco, e "Dealers
Club - Teste 1" (Dealers) tem 31 da Outlet Netcarros e da LM. Quem cruza as bases
sem tirar o teste conta esses carros como republicação.

## Chassi e placa: o mesmo carro cadastrado em vários comitentes

Medido em **2026-11-18** (conexão direta, veículos com negociação em 2026).
Chassi normalizado repetido em mais de 3 veículos: 19 valores na Cars2You, 1 na
Dealers.

- **18 carros do BANCO GM copiados em cinco comitentes** da Cars2You (Bemol,
  Apeop, Clube FMP, Omni Financiamento e BBC), um evento por comitente entre
  06/2026 e 11/2026, mais contas de teste. Cada chassi aparece em 6 veículos. O
  mesmo lote de carros em vários vendedores parece uma vitrine para cliente novo.
  Contar veículo distinto por chassi junta os seis em um.
- Um chassi em **32 veículos**, de Chevrolet Agile a IVECO Daily: lixo de
  cadastro, e o Agile é o mesmo da seção abaixo.

Para casar carro entre as bases ou dentro de uma, valor de chassi ou placa
repetido em muitos veículos tem que sair (o Estudo de Republicações usa teto 3).

## Início de oferta no futuro

Há negociação com `start_date_offer` (do evento ou da própria negociação) em
**2027 e 2028**: 12 carros do Estudo de Republicações tinham a primeira
publicação "de 2026" nessas datas. Janela por ano precisa de teto, não só de piso.

## A FIPE do anúncio é rala na Dealers

Nas negociações de 2026 dos carros publicados nas duas bases (medido em
2026-11-18): `advertisements.fipe_price` preenchida em **87,3%** na Cars2You e em
**38,7%** na Dealers. `molicar_price` (anúncio e veículo): 32,2% na Cars2You, **0%**
na Dealers. Por carro (1.401), ficam sem FIPE em nenhum anúncio de 2026: 125 na
Cars2You e 287 na Dealers (4 deles com a FIPE do cadastro do veículo).
