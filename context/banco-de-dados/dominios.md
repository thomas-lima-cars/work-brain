# Domínios e armadilhas — medidos no banco, não supostos

> Complemento do [`schema.md`](schema.md). Lá estão as colunas e os tipos; aqui está o que
> os valores **significam** e onde a leitura ingênua erra. Tudo nesta página foi medido
> por consulta, com a execução anotada. Nada foi inferido do nome da coluna.
>
> **Última medição:** 2026-09-09

## `advertisement_negotiations.status`

O `schema.md` mostra `TINYINT(1)` e para por aí — a ressalva 4 do [`README`](README.md)
registrava esse buraco. Medido na sonda `a6fNNTUYYayehNIn`, execução **49813**, sobre as
negociações dos eventos ativos naquele dia:

| status | negociações | leitura |
|---:|---:|---|
| **1** | 252 | **em aberto** — é o "disponível" |
| 2, 3, 7 | 9 | vendido (bate com o `IN (2, 3, 7)` que a sonda do lote 2 já usava) |
| 10, 14 | 5 | **desconhecido** — pouca massa, não deu pra concluir |

O filtro de disponibilidade é, então:

```sql
an.deleted_at IS NULL AND an.status = 1
```

**Por que importa:** sem olhar `status`, os eventos ativos daquele dia mostravam 261
veículos. Disponíveis de verdade eram **248**. Quem contar negociação sem filtrar status
infla o número em ~5%.

⚠️ A amostra é de um dia. Os valores 10 e 14 continuam sem leitura, e nada garante que
2/3/7 sejam os únicos estados de "vendido" — são os únicos que **apareceram**.

## O catálogo `models` tem nomes duplicados em duas faixas de id

Encontrado ao conferir a execução **49846** do relatório de aderência: veículo "Strada" e
loja cujo modelo mais ofertado é "Strada", casando por id, davam **zero**.

| modelo | ids encontrados |
|---|---|
| Amarok | 1089 e 2000000427 |
| Fiorino | 893 e 2000000460 |
| Strada | 601 e 2000000428 |

A faixa `2000000xxx` tem cara de catálogo importado de outra fonte, convivendo com o
original. **Consequência prática:** comparar modelo por `model_id` devolve "não bate" para
carros que são o mesmo modelo. Comparar por nome resolve esses casos, mas junta versões
que talvez devessem ficar separadas — não há resposta óbvia, é decisão de negócio.

Tamanho medido: **8 de 60.295 pares** naquele relatório (0,01%), valendo ~12 pontos de
score cada. Irrelevante no agregado, mas é duplicação real de catálogo.

⚠️ Os três só apareceram porque estavam entre os veículos daquele relatório. **O catálogo
inteiro não foi varrido** — pode haver muito mais. `categories` não apresentou o problema.

## Somar por whitelabel infla o número

`event_whitelabels` é 1:N — um evento alveja vários whitelabels, e o mesmo veículo conta
em cada um. Medido em 2026-09-09: a soma por whitelabel deu **305** contra **261** veículos
reais. Inflação de **1,17×**.

O sintoma é visível a olho nu quando aparece: Banco GM, Apeop, Clube FMP e Canal de vendas
Omni mostravam **exatamente 21 veículos, 3 eventos, 1 loja** cada — o mesmo lote de 21
carros de uma loja só, exposto em quatro canais.

**Regra:** para total de veículos, conte sem fatiar por whitelabel. A fatia por whitelabel
serve para ler distribuição, nunca para somar.

## Ainda sem decodificar

- `situation` e `status` de `advertisements`, `offers`, `vehicles`, `shop_stocks`
- `events.status` — sabe-se que `0` existe e não é "ativo" (o evento "Preparação Repasse"
  estava com `status = 0` e mesmo assim passou por um filtro que só olhava datas)
