# 🗄️ Banco de dados — Cars2You

> Referência do esquema da plataforma. **Consultar antes de escrever qualquer SQL**
> (relatórios C6/IGA, sondas, queries de coorte).
>
> **Importado em 2026-09-09** de dois arquivos exportados pelo Thomas, preservados em
> [`_fontes/`](_fontes/).

## Arquivos

| Arquivo | O que tem |
|---|---|
| [`schema.md`](schema.md) | **As 144 tabelas.** Descrição, colunas com tipos, FKs de saída, quem referencia a tabela, índices. Índice por domínio no topo. |
| [`dominios.md`](dominios.md) | **O que os valores significam.** Domínios de `status` medidos por consulta, duplicidade no catálogo `models`, e o fan-out de whitelabel que infla contagem. |
| [`consultas/`](consultas/) | SQL já escrita e conferida contra o schema. Cada arquivo declara suas premissas no cabeçalho. |
| `_fontes/Banco_cars.txt` | Original: descrição + relacionamentos + índices por tabela. **Não tem colunas.** |
| `_fontes/Diagrama_cars.pdf` | Original: diagrama ER com colunas e tipos. **Não tem índices nem descrições.** |

O `schema.md` é o cruzamento dos dois — é o arquivo pra ler no dia a dia.

## Números

**144 tabelas · 1.474 colunas documentadas (+49 não documentadas, ver ressalva 2) · 239 chaves
estrangeiras.** MySQL/MariaDB, padrão Laravel
(`id BIGINT`, `created_at`/`updated_at`/`deleted_at TIMESTAMP`, tabelas pivô `a_b`).

## Como consultar

```bash
grep -n "^## nome_da_tabela$" context/banco-de-dados/schema.md
```

```bash
grep -n "whitelabel_id" context/banco-de-dados/schema.md
```

Pra achar todo mundo que aponta pra uma tabela, procure a linha `**Referenciada por**`
dentro do bloco dela.

## Hubs — as tabelas que todo join atravessa

| Tabela | Referenciada por |
|---|---|
| `users` | 30 tabelas |
| `whitelabels` | 29 |
| `shops` | 22 |
| `advertisements` | 17 |
| `client_groups` | 12 |
| `vehicles` | 10 |
| `categories` | 9 |
| `contents` | 8 |
| `events`, `shop_stocks`, `brands`, `models` | 6 cada |

## Multi-tenant: onde o filtro de whitelabel entra

`whitelabel_id` aparece em **31 tabelas**. É a coluna que sustenta o recorte dos relatórios.
Whitelabels que importam pras frentes ativas:

| ID | Whitelabel | Frente |
|---|---|---|
| 43 | Canal C6 Auto | `c6` |
| 48 | Colaboradores C6 | `c6` |
| 62 | Lance Fácil BTB | Lance Fácil BTB |
| 65 | BTB Associados | Lance Fácil BTB |
| 7 | Marketplace | `cars2you` |
| 4 | Trucks2you | `cars2you` |

São exatamente os 6 do recorte do relatório C6 (ver `subjects/c6/`). Quando o recorte
é por whitelabel, o caminho depende da tabela: algumas têm `whitelabel_id` direto,
outras só chegam via pivô (`event_whitelabels`, `advertisement_negotiation_whitelabels`,
`publishing_channel_whitelabels`, `user_whitelabels`, `whitelabel_client_groups`).

## Colunas onipresentes

| Coluna | Em quantas tabelas |
|---|---|
| `created_at` | 135 |
| `updated_at` | 131 |
| `deleted_at` | 79 ← **soft delete: quase sempre precisa de `WHERE deleted_at IS NULL`** |
| `status` | 42 |
| `whitelabel_id` | 31 |
| `user_id` | 22 |
| `shop_id` | 18 |
| `advertisement_id` | 17 |
| `situation` | 11 |
| `vehicle_id` | 10 |
| `event_id` | 6 |

⚠️ **79 tabelas têm `deleted_at`.** Esquecer o `IS NULL` inflaciona contagem — atenção
especial em `users`, `advertisements`, `vehicles` e `offers`, que alimentam as métricas
do relatório.

## Mapa de domínios

| Domínio | Tabelas | Núcleo |
|---|---|---|
| Veículo, ficha técnica e estoque | 25 | `vehicles`, `shop_stocks`, `brands`/`models`/`versions` |
| CRM, marketing, conteúdo e comunicação | 21 | `leads`, `campaigns`, `contents`, `chats`, `notifications` |
| Usuário, acesso e permissão | 24 | `users`, `user_profiles`, `roles`/`permissions`, `access_logs` |
| Anúncio, evento/leilão e negociação | 17 | `advertisements`, `events`, `offers`, `advertisement_negotiations` |
| Whitelabel / multi-tenant | 16 | `whitelabels`, `client_groups`, `whitelabel_permissions` |
| Preferências e taxonomias de busca | 11 | `preferences` + pivôs `*_preference` |
| Relatórios, importação e infraestrutura | 9 | `reports`, `import_logs`, `failed_jobs`, `variables` |
| Loja, parceiro e integração | 8 | `shops`, `shop_integrations`, `accounts`/`banks` |
| Financeiro e logística | 7 | `transactions`, `wallets`, `fees`, `freight_quotes` |
| Vistoria / inspeção | 6 | `inspection`, `item_inspections`, `type_inspections` |

Lista completa de cada domínio no índice do [`schema.md`](schema.md).

## ⚠️ Ressalvas da importação

1. **31 tipos foram reconstruídos** e estão marcados com `*` no `schema.md`. O diagrama
   corta o texto na borda da caixa (`VARCHAR(25…`), então o **tamanho** pode estar errado
   — o nome da coluna e a família do tipo estão certos. Quase todos são
   `VARCHAR(255)*`; um é `TINYINT(1)*` (`whitelabel_leads.enable_wanna_sell`).
   Se o tamanho importar pra alguma query, confirmar no banco.
2. **4 tabelas têm colunas que o diagrama não mostra.** Quando a caixa era alta demais, o
   diagrama colapsou o resto num rótulo "N more..." — essas colunas **não existem em
   nenhuma das duas fontes**. No `schema.md` o ponto está marcado com
   `⚠️ N COLUNAS OCULTAS`:

   | Tabela | Colunas faltando |
   |---|---|
   | `whitelabel_permissions` | 20 |
   | `shops` | 13 |
   | `whitelabels` | 11 |
   | `advertisement_negotiations` | 5 |

   São 49 colunas ao todo. Dá pra inferir algumas por outras vias: `shops.deleted_at`
   aparece no índice `shops_id_deleted_idx`, e `whitelabels.client_group_id` aparece na
   lista de FKs — as duas estão entre as ocultas. Pra fechar essas 4 tabelas, precisa de
   um `SHOW COLUMNS` no banco ou de uma exportação do diagrama sem colapso.
3. **5 tabelas existem só no diagrama** e não no `.txt`: `oauth_clients`,
   `oauth_access_tokens`, `oauth_auth_codes`, `oauth_refresh_tokens`,
   `oauth_personal_access_clients` — OAuth do Laravel Passport. Ficam sem descrição,
   FK nem índice, e o nome pode estar truncado no diagrama.
4. **Nenhuma das duas fontes tem `NOT NULL`, `DEFAULT`, `CHECK` ou os valores dos
   `ENUM`.** O diagrama mostra `ENUM(...)` em 3 colunas sem revelar o conteúdo.
   Colunas como `situation` e `status` (`TINYINT`) têm significado que o `.txt` não
   traz. O que já foi **medido por consulta** está em [`dominios.md`](dominios.md) —
   hoje só `advertisement_negotiations.status`. O resto ainda mora nas queries do n8n.
5. As FKs vêm do `.txt`, que lista o relacionamento lógico. Não dá pra afirmar por aqui
   se a constraint existe no banco nem qual é o `ON DELETE`.
6. É um retrato de **2026-09-09**. Migração nova muda o esquema e não avisa este arquivo —
   reimportar quando desconfiar.

## Próximo passo natural

Continuar a decodificação em [`dominios.md`](dominios.md). Feito:
`advertisement_negotiations.status`. Falta: `situation` e `status` de `advertisements`,
`offers`, `vehicles`, `shop_stocks`, e o `status` de `events` — este último já deu
problema uma vez, num filtro que só olhava datas e engoliu um evento com `status = 0`.

O jeito que funcionou foi **medir**, não ler as queries: uma sonda que traz
`SELECT status, COUNT(*) ... GROUP BY status` e a distribuição decide. Ler o `IN (...)`
de uma query antiga só propaga a suposição de quem a escreveu.
