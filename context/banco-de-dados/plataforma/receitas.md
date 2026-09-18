# Receitas — fragmentos de SQL já conferidos

> Para **não reescrever** o mesmo join toda vez, e não reintroduzir um erro já
> corrigido. Cada fragmento diz o que resolve e o que dá errado sem ele.
>
> Colar daqui é mais rápido e mais seguro que lembrar.

## A última negociação de cada veículo

O join mais usado do brain. Sem ele, um veículo com histórico conta várias
vezes.

```sql
INNER JOIN (SELECT a2.vehicle_id AS vid, MAX(an2.id) AS ult
              FROM advertisement_negotiations an2
              INNER JOIN advertisements a2 ON a2.id = an2.advertisement_id
             WHERE an2.deleted_at IS NULL
             GROUP BY a2.vehicle_id) u ON u.ult = an.id
```

⚠️ **Por `MAX(id)`, nunca por data** — `finish_date_offer` tem 1969 e 2030.
⚠️ Funciona no MCP. `ROW_NUMBER() OVER (PARTITION BY ...)` **não** — o
validador rejeita.

## Da negociação até o veículo, com valor e FIPE

```sql
FROM advertisement_negotiations an
<ULTIMA>
LEFT  JOIN offers o         ON o.id = an.offer_actual_id AND o.deleted_at IS NULL
INNER JOIN advertisements a ON a.id = an.advertisement_id
INNER JOIN vehicles v       ON v.id = a.vehicle_id
LEFT  JOIN versions ver     ON ver.id = v.version_id
LEFT  JOIN shop_stocks ss   ON ss.id = v.shop_stock_id
LEFT  JOIN models m         ON m.id = v.model_id
LEFT  JOIN brands b         ON b.id = v.brand_id
LEFT  JOIN categories cat   ON cat.id = v.category_id
```

Os catálogos entram como `LEFT` de propósito: `INNER` num catálogo incompleto
descarta venda em silêncio.

## O laudo cautelar, uma linha por veículo

```sql
LEFT JOIN (SELECT vpr0.vehicle_id AS vid, MAX(vpr0.situation) AS sit
             FROM vehicle_precautionary_reports vpr0
            WHERE vpr0.deleted_at IS NULL
            GROUP BY vpr0.vehicle_id) lau ON lau.vid = v.id
```

Pré-agregado mesmo sendo hoje 1 por veículo — o join direto ficaria refém disso
continuar verdade.

## Modelo como chave de agrupamento

```sql
CONCAT(UPPER(TRIM(COALESCE(b.name, '(sem marca)'))), ' ',
       UPPER(TRIM(COALESCE(m.name, '(sem modelo)'))))
```

## Excluir motos e pesados

```sql
AND COALESCE(cat.name, 'Nao informada')
    NOT IN ('Motocicleta', 'Caminhao', 'Onibus', 'Reboque', 'Semireboque')
```

⚠️ **Por LINHA, no `WHERE`.** Nunca por modelo agregado com `MAX(cat.name)`:
MAX em texto pega o alfabeticamente último, e um veículo sem categoria rotula
o modelo inteiro.

## Recorte de data

Calcular **fora do SQL** e passar como literal — o banco é UTC e o evento é
Brasília:

```python
agora = dt.datetime.now(dt.timezone.utc) - dt.timedelta(minutes=180)
ini = agora.replace(year=agora.year - 1)
JANELA = (" AND an.finish_date_offer >= '%s 00:00:00'"
          " AND an.finish_date_offer <= '%s 23:59:59'"
          % (ini.strftime("%Y-%m-%d"), agora.strftime("%Y-%m-%d")))
```

## ⚠️ Erros que já custaram refação

| erro | o que acontece | onde já aconteceu |
|---|---|---|
| **Alias repetido no `FROM`** | SQL inválida; nenhuma prova de JS pega | 15/09, adaptando a sonda 4 para a 10 — pegaria 96 chamadas |
| **Filtro diferente entre duas consultas da mesma amostra** | Cada uma bate com o próprio gabarito, cada um com o número errado | 15/09: 4.127 contra 4.582 |
| **Filtro novo sem ajustar o gabarito** | Não dá erro. Dá base errada | — |
| **`MAX(campo_texto)`** para resumir categoria | Pega o alfabeticamente último | 15/09: Gol e Onix como "Não informada" |
| **`INNER JOIN` em catálogo** | Descarta linha sem avisar | — |

Guardas correspondentes em `automations/n8n-sdk/precificacao/monta-sonda-10.js`.
