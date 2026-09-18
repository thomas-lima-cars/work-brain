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
