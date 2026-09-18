# Definições — o que cada conceito de negócio vira em SQL

> **Fonte única.** Toda análise que fala de "venda", "deságio" ou "FIPE" usa
> estas definições. Se um número em qualquer lugar do brain discordar daqui, o
> errado é o outro — ou a definição mudou e este arquivo não foi atualizado.
>
> Cada linha diz **o que foi escolhido, o que foi descartado e por quê**. A
> escolha importa mais que a fórmula: quase toda divergência de número entre
> duas análises veio de definição, não de conta.

## Venda

Veículo cuja **última linha válida** em `advertisement_negotiations` tem
`status IN (2, 3, 7)`.

| | |
|---|---|
| **"Última"** | `MAX(an.id)` por `vehicle_id`, entre as não deletadas |
| **Por que não por data** | `finish_date_offer` tem lixo: um registro em 1969, outro em 2030 |
| **Por que "última" e não "qualquer"** | Contar qualquer negociação 2/3/7 inclui o carro que vendeu e teve a venda **cancelada** depois. Diferença medida em 14/09: **299 veículos, 2,6%** |

```sql
INNER JOIN (SELECT a2.vehicle_id AS vid, MAX(an2.id) AS ult
              FROM advertisement_negotiations an2
              INNER JOIN advertisements a2 ON a2.id = an2.advertisement_id
             WHERE an2.deleted_at IS NULL
             GROUP BY a2.vehicle_id) u ON u.ult = an.id
WHERE an.status IN (2, 3, 7)
```

Os status vêm de [`dominios.md`](dominios.md): 2 = Aguardando Pagamento,
3 = Aguardando Confirmação de Pagamento, 7 = Vendido.

## Valor da venda

`offers.price`, alcançado por `an.offer_actual_id`.

| descartado | por quê |
|---|---|
| `an.value_actual` | **Lixo.** Preenchido em 72.346 das 72.354 negociações "Sem Ofertas" |
| `MAX(offers.price)` | Pega o maior lance da negociação, não o vencedor |

```sql
LEFT JOIN offers o ON o.id = an.offer_actual_id AND o.deleted_at IS NULL
```

## Valor FIPE

`advertisements.fipe_price` — a **do anúncio**, contemporânea da oferta.

| descartado | por quê |
|---|---|
| `vehicles.fipe_price` | Menos preenchida, e não acompanha o momento da oferta |

⚠️ O preenchimento varia por base — ver [`indicadores.md`](indicadores.md).
O que falta **sai da amostra**, então toda análise nasce cega nessa fatia.

## Deságio

```
deságio = 1 − (valor da venda ÷ FIPE do anúncio)
```

Deságio de 30% = o carro saiu por 70% da tabela. Sempre em **pontos
percentuais** quando comparado entre grupos, nunca em "%".

## Grupo / modelo

**Marca + nome do modelo, normalizados** (`UPPER(TRIM(...))`).

| descartado | por quê |
|---|---|
| `model_id` | O catálogo reparte o mesmo modelo em ids diferentes. Strada = 601 e 2000000428; Saveiro, Toro, Renegade, Hilux, Compass e S10 idem. Por id, a Strada vira dois grupos de 172 e 33 |

```sql
CONCAT(UPPER(TRIM(COALESCE(b.name, '(sem marca)'))), ' ',
       UPPER(TRIM(COALESCE(m.name, '(sem modelo)'))))
```

Marca entra na chave porque nome de modelo **não é único entre marcas**.

## Idade do veículo

`YEAR(an.finish_date_offer) − v.model_year`. Pode dar 0 ou negativo em carro
de modelo futuro — é esperado, não erro.

## Corte de outlier

`0,20 ≤ (venda ÷ FIPE) ≤ 1,20`.

Medido em 14/09: **95,7% da massa está entre 0,40 e 0,90**, e a cauda chega a
**107× a FIPE**. O corte tira a cauda sem tocar no miolo.

## Controle por grupo

Toda comparação subtrai a média do próprio grupo antes de medir:

```
efeito = média(deságio − média do grupo) no nível  −  o mesmo fora dele
```

Sem isso, qualquer coluna correlacionada com o modelo parece driver sem ser.
⚠️ **Quando há mais de uma base, o grupo é o par (base, modelo)** — um Gol da
Cars2You e um da Dealers são operações diferentes, e num grupo só a diferença
entre as bases vazaria para dentro do efeito de km e idade.

## Escopo padrão do estudo

| | |
|---|---|
| Janela | 12 meses, data como **literal** calculada fora do SQL (o banco responde em UTC, o evento é Brasília) |
| Modelos | 20 mais vendidos **de cada base**, re-derivados — copiar a lista de uma para a outra mede o ranking de lá na base de cá |
| Excluídos | Motocicleta, Caminhão, Ônibus, Reboque, Semirreboque — **filtrados por LINHA, no `WHERE`** |
| "Não informada" | **Fica.** Não se sabe o que é, e descartar sem saber é pior que manter e declarar |

⚠️ **Nunca filtrar categoria por `MAX(cat.name)` agregado.** MAX em texto pega
o alfabeticamente último, e um veículo sem categoria rotula o modelo inteiro.
Aconteceu em 15/09: Gol, Onix e HB20 apareceram como "Não informada".
