# Schema gerado — cars2you_production

> 🤖 **Gerado por `automations/bancos/gera-schema.py`** em 2026-09-18, direto do
> `information_schema` de `cars2you_production` (MySQL 8.4.8).
>
> **Não editar à mão** — rode o script de novo.
>
> ⚠️ Este arquivo é a verdade sobre **estrutura**. O
> [`schema.md`](schema.md), escrito à mão, é a verdade sobre **significado**:
> descrição de cada tabela em português, agrupamento por domínio e notas de
> leitura, que o `information_schema` não sabe. Os dois convivem.
>
> 🔒 **79 nomes de coluna sensíveis** (placa, chassi, renavam, documento, senha,
> token) foram **contados e não nomeados** — listá-los seria um mapa de onde
> procurar. Ver a política em [`qualidade.md`](qualidade.md).


## Números

| | |
|---|---:|
| Tabelas | **193** |
| Colunas | 2.075 |
| Chaves estrangeiras | 310 |
| Tabelas vazias | 40 |

## As 15 maiores

| tabela | linhas | colunas |
|---|---:|---:|
| `audits` | 12.037.022 | 14 |
| `access_logs` | 3.190.565 | 8 |
| `vehicle_image_galleries` | 2.754.569 | 11 |
| `notifications` | 2.119.710 | 20 |
| `oauth_access_tokens` | 1.155.726 | 9 |
| `advertisement_negotiation_client_groups` | 927.734 | 5 |
| `offers` | 754.445 | 21 |
| `vehicle_accessories` | 639.521 | 5 |
| `user_access` | 481.869 | 3 |
| `import_row_logs` | 277.057 | 8 |
| `advertisement_negotiation_whitelabels` | 273.078 | 5 |
| `advertisements` | 252.982 | 12 |
| `advertisement_negotiations` | 240.053 | 37 |
| `advertisement_page_views` | 235.868 | 5 |
| `failed_jobs` | 232.776 | 7 |

## Tabelas


### access_logs

_3.190.565 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
advertisement_id                           bigint unsigned
event_id                                   bigint unsigned
route                                      varchar(255) NOT NULL
user_id                                    bigint unsigned NOT NULL
shop_id                                    bigint unsigned
created_at                                 timestamp NOT NULL
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `event_id` → `events.id` · `shop_id` → `shops.id` · `user_id` → `users.id` · `whitelabel_id` → `whitelabels.id`

### accessories

_49 linhas · 9 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
accessory_group_id                         bigint unsigned NOT NULL
name                                       varchar(255) NOT NULL
image_url                                  varchar(255)
status                                     tinyint(1) NOT NULL
approved                                   tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `accessory_group_id` → `accessory_groups.id`

**Referenciada por (1):** `vehicle_accessories`

### accessory_groups

_7 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `accessories`

### accounts

_12 linhas · 13 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned NOT NULL
bank_id                                    bigint unsigned NOT NULL
client_name                                varchar(255)
agency                                     varchar(30)
account                                    varchar(50)
beneficiary                                varchar(255)
···                                        (coluna sensível — nome omitido)
description                                text
status                                     tinyint
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `bank_id` → `banks.id` · `shop_id` → `shops.id`

**Referenciada por (3):** `advertisement_negotiations` · `fee_applicabilities` · `review_negotiations`

### advertisement_negotiation_client_groups

_927.734 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
ads_negoti_id                              bigint unsigned NOT NULL
client_group_id                            bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `ads_negoti_id` → `advertisement_negotiations.id` · `client_group_id` → `client_groups.id`

### advertisement_negotiation_whitelabels

_273.078 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
ads_negoti_id                              bigint unsigned NOT NULL
whitelabel_id                              bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `ads_negoti_id` → `advertisement_negotiations.id` · `whitelabel_id` → `whitelabels.id`

### advertisement_negotiations

_240.053 linhas · 37 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
advertisement_id                           bigint unsigned NOT NULL
event_id                                   bigint unsigned
account_id                                 bigint unsigned
payment_method_id                          bigint unsigned
payment_method_signature_club_id           bigint unsigned
content_id                                 bigint unsigned
status                                     int
situation_counterproposal                  int
start_date_display                         datetime
start_date_offer                           datetime
finish_date_offer                          datetime
finish_date_display                        datetime
price_reference_advertiser                 double(20,2)
enable_buy_now                             tinyint(1) NOT NULL
enable_available_until_sold                tinyint(1) NOT NULL
immediate_sale_price                       double(20,2)
value_actual                               double(20,2)
offer_actual_id                            int
percent_disable                            varchar(45)
enable_final_dispute_time                  tinyint(1) NOT NULL
close_seller_analysis_even_if_vmv_reached  tinyint(1) NOT NULL
initial_price_dispute                      double(20,2)
min_sale_price                             double(20,2)
increment                                  double(20,2)
enable_accept_proposal_below_initial       tinyint(1) NOT NULL
receive_proposal_above_from_realtime       double(20,2)
enable_proposal                            tinyint(1) NOT NULL
initial_price_reference                    double(20,2)
receive_proposal_above_from                double(20,2)
show_client_name                           tinyint(1) NOT NULL
is_highlight_of_the_day                    tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
reason                                     text
seller_at                                  datetime
```

**Aponta para:** `account_id` → `accounts.id` · `advertisement_id` → `advertisements.id` · `content_id` → `contents.id` · `event_id` → `events.id` · `payment_method_id` → `payment_methods.id` · `payment_method_signature_club_id` → `payment_methods.id`

**Referenciada por (3):** `advertisement_negotiation_client_groups` · `advertisement_negotiation_whitelabels` · `offers`

### advertisement_page_views

_235.868 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
advertisement_id                           bigint unsigned NOT NULL
views                                      bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `advertisement_id` → `advertisements.id`

### advertisement_request_logs

_0 linhas · 12 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned
vehicle_id                                 bigint unsigned
advertisement_id                           bigint unsigned
negotiation_type                           varchar(255)
stage                                      varchar(255)
title                                      varchar(255)
message                                    text
request_payload                            json
status                                     int
created_at                                 timestamp
updated_at                                 timestamp
```

### advertisement_request_status_logs

_40.466 linhas · 12 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
advertisement_id                           bigint unsigned NOT NULL
shop_id                                    bigint unsigned NOT NULL
advertisement_status                       int NOT NULL
response                                   text
message                                    varchar(255)
http_status_code                           int
request_url                                varchar(255)
request_payload                            json
sent_at                                    timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

### advertisement_set_items

_0 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
advertisement_set_id                       bigint unsigned NOT NULL
advertisement_id                           bigint unsigned NOT NULL
weight                                     decimal(5,2) NOT NULL
is_main                                    tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `advertisement_set_id` → `advertisement_sets.id`

### advertisement_sets

_0 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
increment                                  decimal(15,2) NOT NULL
initial_price                              decimal(15,2) NOT NULL
min_sale_price                             decimal(15,2) NOT NULL
status                                     tinyint NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `advertisement_set_items`

### advertisements

_252.982 linhas · 12 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
uuid                                       char(36) NOT NULL
shop_id                                    bigint unsigned NOT NULL
shop_stock_id                              bigint unsigned NOT NULL
vehicle_id                                 bigint unsigned NOT NULL
fipe_price                                 double(20,2)
molicar_price                              double(20,2)
retail_value                               double(20,2)
deleted_at                                 timestamp
deleted_by                                 bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `deleted_by` → `users.id` · `shop_id` → `shops.id` · `shop_stock_id` → `shop_stocks.id` · `vehicle_id` → `vehicles.id`

**Referenciada por (20):** `access_logs` · `advertisement_negotiations` · `advertisement_page_views` · `advertisement_set_items` · `chats` · `fee_applicabilities` · `freight_quotes` · `offers` · `offers_automatics` · `pickup_authorizations` · `review_negotiations` · `reviews` · `schedules` · `shop_automation_logs` · `transactions` · `transport_contracts` · `user_advertisement_favorites` · `user_advertisement_financings` · `user_favorites` · `vehicle_advertisements`

### aliases

_23 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
version_id                                 bigint unsigned NOT NULL
user_id                                    bigint unsigned NOT NULL
status                                     tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id` · `version_id` → `versions.id`

**Referenciada por (1):** `vehicles`

### audits

_12.037.022 linhas · 14 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_type                                  varchar(255)
user_id                                    bigint unsigned
event                                      varchar(255) NOT NULL
auditable_type                             varchar(255) NOT NULL
auditable_id                               bigint unsigned NOT NULL
old_values                                 text
new_values                                 text
url                                        text
ip_address                                 varchar(45)
user_agent                                 varchar(1023)
tags                                       varchar(255)
created_at                                 timestamp
updated_at                                 timestamp
```

### banks

_207 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255)
code                                       varchar(32)
description                                text
status                                     tinyint
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `accounts`

### base_cars2you

_20.070 linhas · 45 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
Placa                                      varchar(30)
Data da Venda                              date
DS_RETORNO                                 varchar(120)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
MARCA                                      varchar(40)
MODELO                                     varchar(60)
VERSAO                                     varchar(60)
ANO_MODELO                                 smallint
cdFipeAlt1                                 varchar(12)
vlFipeAlt1                                 decimal(12,2)
MesRefFipe1                                date
dsMarcaFipe1                               varchar(40)
dsModeloFipe1                              varchar(80)
CombFipe1                                  char(2)
CombFipeTrat1                              varchar(20)
cdFipeAlt2                                 varchar(12)
vlFipeAlt2                                 decimal(12,2)
MesRefFipe2                                date
dsMarcaFipe2                               varchar(40)
dsModeloFipe2                              varchar(80)
CombFipe2                                  char(2)
CombFipeTrat2                              varchar(20)
cdFipeAlt3                                 varchar(12)
vlFipeAlt3                                 decimal(12,2)
MesRefFipe3                                date
dsMarcaFipe3                               varchar(40)
dsModeloFipe3                              varchar(80)
CombFipe3                                  char(2)
CombFipeTrat3                              varchar(20)
cdFipeAlt4                                 varchar(12)
vlFipeAlt4                                 decimal(12,2)
MesRefFipe4                                date
dsMarcaFipe4                               varchar(40)
dsModeloFipe4                              varchar(80)
CombFipe4                                  char(2)
CombFipeTrat4                              varchar(20)
cdFipeAlt5                                 varchar(12)
vlFipeAlt5                                 decimal(12,2)
MesRefFipe5                                date
dsMarcaFipe5                               varchar(40)
dsModeloFipe5                              varchar(80)
CombFipe5                                  char(2)
CombFipeTrat5                              varchar(20)
```

### benefit_club_client_groups

_24 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
benefit_club_id                            bigint unsigned NOT NULL
client_group_id                            bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `benefit_club_id` → `benefit_clubs.id` · `client_group_id` → `client_groups.id`

### benefit_club_users

_141.294 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
benefit_club_id                            bigint unsigned NOT NULL
···                                        (coluna sensível — nome omitido)
name                                       varchar(255) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `benefit_club_id` → `benefit_clubs.id`

### benefit_clubs

_24 linhas · 17 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
file_url                                   varchar(255) NOT NULL
name                                       varchar(255) NOT NULL
validation_method                          varchar(255) NOT NULL
···                                        (coluna sensível — nome omitido)
support_text                               varchar(255)
total_registration                         varchar(255) NOT NULL
status                                     tinyint(1) NOT NULL
validation_field                           varchar(255)
validation_field_min_size                  varchar(255) NOT NULL
validation_field_max_size                  varchar(255) NOT NULL
api_url                                    varchar(255) NOT NULL
headers                                    varchar(255) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `whitelabel_id` → `whitelabels.id`

**Referenciada por (2):** `benefit_club_client_groups` · `benefit_club_users`

### bodywork_preferences

_267 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
preference_id                              bigint unsigned NOT NULL
bodywork_id                                bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `bodywork_id` → `bodyworks.id` · `preference_id` → `preferences.id`

### bodyworks

_107 linhas · 10 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
category_id                                bigint unsigned NOT NULL
name                                       varchar(255) NOT NULL
image_url                                  varchar(255)
status                                     tinyint(1) NOT NULL
approved                                   tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
integration_category                       int
```

**Aponta para:** `category_id` → `categories.id`

**Referenciada por (5):** `bodywork_preferences` · `inspection` · `tag_applicabilities` · `vehicles` · `versions`

### brands

_352 linhas · 10 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
category_id                                bigint unsigned NOT NULL
name                                       varchar(255) NOT NULL
image_url                                  varchar(255)
status                                     tinyint(1) NOT NULL
approved                                   tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
created_by                                 bigint unsigned
```

**Aponta para:** `category_id` → `categories.id`

**Referenciada por (6):** `inspection` · `models` · `tag_applicabilities` · `user_alerts` · `vehicles` · `versions`

### business_units

_6 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
description                                text
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (2):** `user_profiles` · `whitelabel_business_unit`

### campaign_client_groups

_24 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
campaign_id                                bigint unsigned NOT NULL
client_group_id                            bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `campaign_id` → `campaigns.id` · `client_group_id` → `client_groups.id`

### campaign_links

_26 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
campaign_id                                bigint unsigned NOT NULL
key_account_id                             bigint unsigned
business_consultant_id                     bigint unsigned
link                                       text NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `business_consultant_id` → `users.id` · `campaign_id` → `campaigns.id` · `key_account_id` → `users.id`

### campaigns

_22 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255)
slug                                       varchar(255)
url                                        varchar(255) NOT NULL
status                                     tinyint NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (2):** `campaign_client_groups` · `campaign_links`

### categories

_24 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
category_group_id                          bigint unsigned NOT NULL
name                                       varchar(255) NOT NULL
description                                text
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `category_group_id` → `category_groups.id`

**Referenciada por (9):** `bodyworks` · `brands` · `fee_applicabilities` · `inspection` · `models` · `tag_applicabilities` · `type_inspection_items` · `vehicles` · `versions`

### category_groups

_11 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
description                                text
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (2):** `categories` · `fee_applicabilities`

### characteristics

_1 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `vehicle_characteristics`

### chat_messages

_3.220 linhas · 10 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
chat_id                                    bigint unsigned NOT NULL
sender_id                                  bigint unsigned
message                                    text NOT NULL
read_at                                    timestamp
type                                       enum('message','event') NOT NULL
metadata                                   json
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `chat_id` → `chats.id` · `sender_id` → `users.id`

### chat_participants

_1.569 linhas · 9 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
chat_id                                    bigint unsigned NOT NULL
user_id                                    bigint unsigned NOT NULL
operator_id                                bigint unsigned
joined_at                                  timestamp
left_at                                    timestamp
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `chat_id` → `chats.id` · `operator_id` → `users.id` · `user_id` → `users.id`

### chats

_1.569 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
advertisement_id                           bigint unsigned NOT NULL
category_id                                smallint
classification_id                          smallint
situation                                  tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `advertisement_id` → `advertisements.id`

**Referenciada por (2):** `chat_messages` · `chat_participants`

### client_groups

_145 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
description                                varchar(255)
status                                     tinyint NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (12):** `advertisement_negotiation_client_groups` · `benefit_club_client_groups` · `campaign_client_groups` · `communication_item_client_groups` · `content_components_group_clients` · `event_client_groups` · `fee_applicabilities` · `publishing_channel_client_groups` · `user_clients_group` · `vozis_inactivity_sections` · `whitelabel_client_groups` · `whitelabel_restriction_users`

### clusters

_30 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `vehicles`

### colors

_48 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
hexadecimal                                varchar(255) NOT NULL
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (2):** `inspection` · `vehicles`

### communication_item_client_groups

_0 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
communication_item_id                      bigint unsigned NOT NULL
client_group_id                            bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `client_group_id` → `client_groups.id` · `communication_item_id` → `communication_items.id`

### communication_item_views

_0 linhas · 9 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
communication_item_id                      bigint unsigned NOT NULL
user_id                                    bigint unsigned NOT NULL
first_shown_at                             timestamp
dismissed_at                               timestamp
dismissed_permanently                      tinyint(1) NOT NULL
answered_at                                timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `communication_item_id` → `communication_items.id` · `user_id` → `users.id`

### communication_item_whitelabels

_0 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
communication_item_id                      bigint unsigned NOT NULL
whitelabel_id                              bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `communication_item_id` → `communication_items.id` · `whitelabel_id` → `whitelabels.id`

### communication_items

_0 linhas · 13 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
type                                       varchar(255) NOT NULL
title                                      varchar(255) NOT NULL
required                                   tinyint(1)
notice_image_desktop                       varchar(255)
notice_image_mobile                        varchar(255)
notice_cta_url                             varchar(255)
status                                     tinyint(1) NOT NULL
published_at                               timestamp
created_by                                 bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `created_by` → `users.id`

**Referenciada por (5):** `communication_item_client_groups` · `communication_item_views` · `communication_item_whitelabels` · `communication_questions` · `communication_responses`

### communication_question_options

_0 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
communication_question_id                  bigint unsigned NOT NULL
label                                      varchar(255) NOT NULL
order                                      int unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `communication_question_id` → `communication_questions.id`

**Referenciada por (1):** `communication_responses`

### communication_questions

_0 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
communication_item_id                      bigint unsigned NOT NULL
question                                   text NOT NULL
answer_type                                varchar(255) NOT NULL
order                                      int unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `communication_item_id` → `communication_items.id`

**Referenciada por (2):** `communication_question_options` · `communication_responses`

### communication_responses

_0 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
communication_item_id                      bigint unsigned NOT NULL
communication_question_id                  bigint unsigned NOT NULL
user_id                                    bigint unsigned NOT NULL
answer_text                                text
communication_question_option_id           bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `communication_item_id` → `communication_items.id` · `communication_question_id` → `communication_questions.id` · `communication_question_option_id` → `communication_question_options.id` · `user_id` → `users.id`

### contact_c2b_requests

_0 linhas · 16 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned
name                                       varchar(255)
email                                      varchar(255)
phone                                      varchar(255)
···                                        (coluna sensível — nome omitido)
your_vehicle                               varchar(255)
interested_vehicle                         varchar(255)
how_to_contact                             varchar(255)
contact_hours                              varchar(255)
greater_interest                           varchar(255)
state                                      varchar(255)
city                                       varchar(255)
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

### contacts

_1.177 linhas · 9 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
name                                       varchar(255) NOT NULL
email                                      varchar(255) NOT NULL
phone                                      varchar(255)
subject                                    varchar(255)
message                                    text
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `whitelabel_id` → `whitelabels.id`

### content_components

_600 linhas · 17 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
···                                        (coluna sensível — nome omitido)
component                                  varchar(255) NOT NULL
title                                      varchar(255)
subtitle                                   varchar(255)
description                                text
button_label                               varchar(255)
button_url                                 varchar(255)
order                                      varchar(255) NOT NULL
image_url                                  varchar(255)
image_mobile_url                           varchar(255)
video_url                                  varchar(255)
whitelabel_id                              bigint unsigned NOT NULL
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `whitelabel_id` → `whitelabels.id`

**Referenciada por (1):** `content_components_items`

### content_components_group_clients

_95 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
component_item_id                          bigint unsigned NOT NULL
client_group_id                            bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `client_group_id` → `client_groups.id` · `component_item_id` → `content_components_items.id`

### content_components_items

_2.223 linhas · 18 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
component_id                               bigint unsigned NOT NULL
title                                      varchar(255)
subtitle                                   varchar(255)
description                                text
button_label                               varchar(255)
button_url                                 varchar(255)
order                                      varchar(255) NOT NULL
image_url                                  varchar(255)
image_mobile_url                           varchar(255)
video_url                                  varchar(255)
icon                                       varchar(255)
type                                       varchar(255)
status                                     tinyint(1) NOT NULL
is_auth                                    tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `component_id` → `content_components.id`

**Referenciada por (1):** `content_components_group_clients`

### content_whitelabel

_3.426 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
content_id                                 bigint unsigned NOT NULL
whitelabel_id                              bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `content_id` → `contents.id` · `whitelabel_id` → `whitelabels.id`

### contents

_121 linhas · 29 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned
title                                      varchar(255)
subtitle                                   varchar(255)
slug                                       varchar(255)
content_type                               varchar(50)
description                                longtext
description2                               longtext
description3                               longtext
whatsapp_enable                            tinyint(1) NOT NULL
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
email_enable                               tinyint(1) NOT NULL
image_url                                  varchar(255)
image_url2                                 varchar(255)
image_url3                                 varchar(255)
status                                     tinyint NOT NULL
email_type                                 varchar(100)
send_to                                    varchar(255)
main_news                                  tinyint
default                                    tinyint(1) NOT NULL
platform_notification                      tinyint(1) NOT NULL
notification_title                         varchar(255)
notification_text                          longtext
notification_url                           varchar(255)
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `shop_id` → `shops.id`

**Referenciada por (6):** `advertisement_negotiations` · `content_whitelabel` · `contents_variables` · `events` · `regulation_acceptances` · `review_negotiations`

### contents_variables

_0 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
content_id                                 bigint unsigned NOT NULL
variable_id                                bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `content_id` → `contents.id` · `variable_id` → `variables.id`

### document_types

_2 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
status                                     tinyint(1) NOT NULL
shared                                     tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `vehicle_documents`

### driver_shifts

_7 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (2):** `inspection` · `vehicles`

### entrance_origins

_7 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (2):** `tag_applicabilities` · `vehicle_extra_fields`

### event_client_groups

_27.689 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
event_id                                   bigint unsigned NOT NULL
client_group_id                            bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `client_group_id` → `client_groups.id` · `event_id` → `events.id`

### event_shops

_4.747 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
event_id                                   bigint unsigned NOT NULL
shop_id                                    bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `event_id` → `events.id` · `shop_id` → `shops.id`

### event_tags

_12 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
status                                     tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `events`

### event_user_alerts

_156 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
event_id                                   bigint unsigned NOT NULL
user_id                                    bigint unsigned NOT NULL
notified_at                                timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `event_id` → `events.id` · `user_id` → `users.id`

### event_whitelabels

_7.663 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
event_id                                   bigint unsigned NOT NULL
whitelabel_id                              bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `event_id` → `events.id` · `whitelabel_id` → `whitelabels.id`

### events

_8.321 linhas · 22 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
situation                                  int
type                                       varchar(45) NOT NULL
name                                       varchar(255) NOT NULL
priority                                   int
event_tag                                  bigint unsigned
description                                text
status                                     tinyint(1) NOT NULL
home_highlight                             tinyint(1) NOT NULL
content_regulation_id                      bigint unsigned
start_date_display                         datetime
start_date_offer                           datetime
finish_date_event                          datetime
finish_date_display                        datetime
seconds_between_ads                        int
finish_type                                varchar(45)
min_seconds_for_more_time                  int
extra_seconds                              int
image_url                                  text
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `content_regulation_id` → `contents.id` · `event_tag` → `event_tags.id`

**Referenciada por (8):** `access_logs` · `advertisement_negotiations` · `event_client_groups` · `event_shops` · `event_user_alerts` · `event_whitelabels` · `fee_applicabilities` · `regulation_acceptances`

### failed_jobs

_232.776 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
uuid                                       varchar(255) NOT NULL UNI
connection                                 text NOT NULL
queue                                      text NOT NULL
payload                                    longtext NOT NULL
exception                                  longtext NOT NULL
failed_at                                  timestamp NOT NULL DEFAULT_GENERATED
```

### fee_applicabilities

_16 linhas · 19 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
fee_id                                     bigint unsigned NOT NULL
payment_method_id                          bigint unsigned
account_id                                 bigint unsigned
whitelabel_id                              bigint unsigned NOT NULL
category_group_id                          bigint unsigned
category_id                                bigint unsigned
shop_id                                    bigint unsigned
client_group_id                            bigint unsigned
advertisement_id                           bigint unsigned
event_id                                   bigint unsigned
charge_from                                varchar(255) NOT NULL
priority                                   int NOT NULL
billing_method                             varchar(255) NOT NULL
application_method                         varchar(255)
value                                      double NOT NULL
recipient                                  varchar(255)
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `account_id` → `accounts.id` · `advertisement_id` → `advertisements.id` · `category_group_id` → `category_groups.id` · `category_id` → `categories.id` · `client_group_id` → `client_groups.id` · `event_id` → `events.id` · `fee_id` → `fees.id` · `payment_method_id` → `payment_methods.id` · `shop_id` → `shops.id` · `whitelabel_id` → `whitelabels.id`

**Referenciada por (1):** `transactions`

### fees

_5 linhas · 10 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
name_site                                  varchar(255) NOT NULL
date_init                                  date NOT NULL
date_end                                   date NOT NULL
priority                                   int NOT NULL
description                                text
status                                     tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `fee_applicabilities`

### freight_quotes

_168 linhas · 11 colunas_

```
id                                         bigint unsigned NOT NULL PK
advertisement_id                           bigint unsigned
vehicles_count                             int NOT NULL
total_value                                decimal(10,2) NOT NULL
unit_value                                 decimal(10,2) NOT NULL
modals                                     json NOT NULL
transit_time                               json NOT NULL
requested_route                            json NOT NULL
production_mode                            tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `advertisement_id` → `advertisements.id`

### fuels

_21 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (2):** `inspection` · `vehicles`

### health_check_result_history_items

_0 linhas · 11 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
check_name                                 varchar(255) NOT NULL
check_label                                varchar(255) NOT NULL
status                                     varchar(255) NOT NULL
notification_message                       text
short_summary                              varchar(255)
meta                                       json NOT NULL
ended_at                                   timestamp NOT NULL
batch                                      char(36) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

### how_did_you_meet_us

_6 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
value                                      varchar(255) NOT NULL
priority                                   smallint unsigned NOT NULL
is_active                                  tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `how_did_you_meet_us_whitelabel`

### how_did_you_meet_us_whitelabel

_12 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
how_did_you_meet_us_id                     bigint unsigned NOT NULL
whitelabel_id                              bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `how_did_you_meet_us_id` → `how_did_you_meet_us.id` · `whitelabel_id` → `whitelabels.id`

### import_logs

_5.369 linhas · 20 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
file_path                                  varchar(255) NOT NULL
file_name                                  varchar(255) NOT NULL
model_type                                 varchar(255) NOT NULL
model_id                                   bigint unsigned
import_type                                varchar(255)
total_rows                                 int unsigned NOT NULL
processed_rows                             int unsigned NOT NULL
success_rows                               int unsigned NOT NULL
error_rows                                 int unsigned NOT NULL
warning_rows                               int unsigned NOT NULL
errors                                     text
warnings                                   text
status                                     varchar(255) NOT NULL
started_at                                 timestamp
completed_at                               timestamp
header_row                                 int unsigned NOT NULL
created_by                                 bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `import_row_logs`

### import_row_logs

_277.057 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
import_log_id                              bigint unsigned NOT NULL
row_number                                 int unsigned NOT NULL
status                                     varchar(255) NOT NULL
error_message                              text
data                                       json
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `import_log_id` → `import_logs.id`

### inspection

_1 linhas · 25 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
uuid                                       char(36) NOT NULL UNI
user_id                                    bigint unsigned
shop_id                                    bigint unsigned
shop_stock_id                              bigint unsigned
brand_id                                   bigint unsigned
model_id                                   bigint unsigned
version_id                                 bigint unsigned
driver_shift_id                            bigint unsigned
bodywork_id                                bigint unsigned
category_id                                bigint unsigned
fuel_id                                    bigint unsigned
color_id                                   bigint unsigned
quote_id                                   bigint
status                                     tinyint NOT NULL
year                                       varchar(255) NOT NULL
manufacturing_year                         varchar(255) NOT NULL
description                                text
···                                        (coluna sensível — nome omitido)
created_at                                 timestamp
updated_at                                 timestamp
elapsed_time_in_seconds                    varchar(255) NOT NULL
vehicle_id                                 bigint unsigned NOT NULL
type                                       varchar(255)
form_data                                  json
```

**Aponta para:** `bodywork_id` → `bodyworks.id` · `brand_id` → `brands.id` · `category_id` → `categories.id` · `color_id` → `colors.id` · `driver_shift_id` → `driver_shifts.id` · `fuel_id` → `fuels.id` · `model_id` → `models.id` · `shop_id` → `shops.id` · `shop_stock_id` → `shop_stocks.id` · `user_id` → `users.id` · `vehicle_id` → `vehicles.id` · `version_id` → `versions.id`

**Referenciada por (3):** `inspection_extras` · `inspection_media` · `reviews`

### inspection_extras

_6 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
inspection_id                              bigint unsigned NOT NULL
inspection_name                            varchar(255) NOT NULL
value                                      varchar(255) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `inspection_id` → `inspection.id`

### inspection_media

_19 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
inspection_id                              bigint unsigned NOT NULL
media_url                                  varchar(255) NOT NULL
description                                varchar(255)
type                                       varchar(255) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `inspection_id` → `inspection.id`

### integrations

_0 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
type                                       varchar(255) NOT NULL
name                                       varchar(255) NOT NULL
status                                     tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Referenciada por (1):** `shop_integrations`

### interest_region_preference

_65 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
preference_id                              bigint unsigned NOT NULL
interest_region_id                         bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `interest_region_id` → `interest_regions.id` · `preference_id` → `preferences.id`

### interest_regions

_5 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(45) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Referenciada por (1):** `interest_region_preference`

### item_inspections

_40 linhas · 25 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
internal_name                              varchar(255) NOT NULL
inspection_name                            varchar(255) NOT NULL
type                                       varchar(255) NOT NULL
description                                varchar(255)
enable_only_quotation                      tinyint(1) NOT NULL
required                                   tinyint(1) NOT NULL
updated_bem                                tinyint(1) NOT NULL
field                                      varchar(255)
site_name                                  varchar(255) NOT NULL
site_description                           varchar(255)
image_url                                  varchar(255)
enable_send_extra_photo                    tinyint(1) NOT NULL
enable_send_extra_video                    tinyint(1) NOT NULL
enable_estimated_deadline                  tinyint(1) NOT NULL
enable_estimated_cost                      tinyint(1) NOT NULL
enable_send_comments                       tinyint(1) NOT NULL
enable_hotspot                             tinyint(1) NOT NULL
enable_required_estimated_deadline         tinyint(1) NOT NULL
enable_required_estimated_cost             tinyint(1) NOT NULL
enable_required_hotspot                    tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
status                                     tinyint(1) NOT NULL
type_items                                 text
```

**Referenciada por (1):** `type_inspection_items`

### leads

_37 linhas · 10 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
email                                      varchar(255) NOT NULL
phone                                      varchar(255) NOT NULL
state                                      varchar(255) NOT NULL
···                                        (coluna sensível — nome omitido)
whitelabel_id                              bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `whitelabel_id` → `whitelabels.id`

### local_segments

_7 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
description                                text
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

### migration_legacy

_780 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
last_id                                    int NOT NULL
whitelabel_id                              int NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

### migrations

_386 linhas · 3 colunas_

```
id                                         int unsigned NOT NULL PK auto_increment
migration                                  varchar(255) NOT NULL
batch                                      int NOT NULL
```

### model_has_permissions

_0 linhas · 3 colunas_

```
permission_id                              bigint unsigned NOT NULL PK
model_type                                 varchar(255) NOT NULL PK
model_id                                   bigint unsigned NOT NULL PK
```

**Aponta para:** `permission_id` → `permissions.id`

### model_has_roles

_74.053 linhas · 3 colunas_

```
role_id                                    bigint unsigned NOT NULL PK
model_type                                 varchar(255) NOT NULL PK
model_id                                   bigint unsigned NOT NULL PK
```

**Aponta para:** `role_id` → `roles.id`

### model_preference

_1.819 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
preference_id                              bigint unsigned NOT NULL
models_id                                  bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `models_id` → `models.id` · `preference_id` → `preferences.id`

### models

_2.938 linhas · 10 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
brand_id                                   bigint unsigned NOT NULL
category_id                                bigint unsigned NOT NULL
name                                       varchar(255) NOT NULL
status                                     tinyint(1) NOT NULL
approved                                   tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
created_by                                 bigint unsigned
```

**Aponta para:** `brand_id` → `brands.id` · `category_id` → `categories.id`

**Referenciada por (6):** `inspection` · `model_preference` · `tag_applicabilities` · `user_alerts` · `vehicles` · `versions`

### notifications

_2.119.710 linhas · 20 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
type                                       varchar(255) NOT NULL
title                                      varchar(255) NOT NULL
user_id                                    bigint unsigned NOT NULL
class_name                                 varchar(255)
mail_to                                    varchar(255) NOT NULL
content_id                                 int
body                                       text NOT NULL
notification_url                           varchar(255)
sent                                       tinyint(1) NOT NULL
sent_at                                    datetime
read                                       tinyint(1) NOT NULL
read_at                                    datetime
response_api                               json
resent_from_id                             bigint unsigned
resent_by_id                               bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id` · `whitelabel_id` → `whitelabels.id`

### oauth_access_tokens

_1.155.726 linhas · 9 colunas_

```
id                                         varchar(100) NOT NULL PK
user_id                                    bigint unsigned
client_id                                  bigint unsigned NOT NULL
name                                       varchar(255)
scopes                                     text
revoked                                    tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
expires_at                                 datetime
```

### oauth_auth_codes

_0 linhas · 6 colunas_

```
id                                         varchar(100) NOT NULL PK
user_id                                    bigint unsigned NOT NULL
client_id                                  bigint unsigned NOT NULL
scopes                                     text
revoked                                    tinyint(1) NOT NULL
expires_at                                 datetime
```

### oauth_clients

_2 linhas · 11 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned
name                                       varchar(255) NOT NULL
···                                        (coluna sensível — nome omitido)
provider                                   varchar(255)
redirect                                   text NOT NULL
personal_access_client                     tinyint(1) NOT NULL
···                                        (coluna sensível — nome omitido)
revoked                                    tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

### oauth_personal_access_clients

_1 linhas · 4 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
client_id                                  bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

### oauth_refresh_tokens

_0 linhas · 4 colunas_

```
id                                         varchar(100) NOT NULL PK
···                                        (coluna sensível — nome omitido)
revoked                                    tinyint(1) NOT NULL
expires_at                                 datetime
```

### offers

_754.445 linhas · 21 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
internal_user_id                           bigint unsigned NOT NULL
seller_shop_id                             bigint unsigned
seller_user_id                             bigint unsigned
advertisement_id                           bigint unsigned NOT NULL
buyer_user_id                              bigint unsigned NOT NULL
buyer_shop_id                              bigint unsigned
advs_negotiation_id                        bigint unsigned NOT NULL
negotiation_type                           int
price                                      double(10,2)
situation                                  int
type_offer                                 text
counter_proposal                           tinyint(1) NOT NULL
message_buyer                              text
deleted_at                                 timestamp
deleted_by                                 bigint unsigned
deletion_ticket_url                        varchar(255)
deletion_observation                       text
created_at                                 timestamp
updated_at                                 timestamp
negotiation_type_filtered                  int STORED GENERATED
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `advs_negotiation_id` → `advertisement_negotiations.id` · `buyer_shop_id` → `shops.id` · `buyer_user_id` → `users.id` · `deleted_by` → `users.id` · `internal_user_id` → `users.id` · `seller_shop_id` → `shops.id` · `seller_user_id` → `users.id`

**Referenciada por (1):** `transactions`

### offers_automatics

_26.168 linhas · 10 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned
user_id                                    bigint unsigned NOT NULL
advertisement_id                           bigint unsigned NOT NULL
price_registered                           decimal(15,2) NOT NULL
price_incremented                          decimal(15,2) NOT NULL
accept_tiebreaker                          tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `shop_id` → `shops.id` · `user_id` → `users.id`

### password_histories

_3.722 linhas · 4 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
···                                        (coluna sensível — nome omitido)
created_at                                 timestamp NOT NULL
```

**Aponta para:** `user_id` → `users.id`

### password_reset_tokens

_1.527 linhas · 6 colunas_

```
email                                      varchar(255) NOT NULL PK
···                                        (coluna sensível — nome omitido)
user_id                                    bigint unsigned
whitelabel_id                              bigint unsigned
···                                        (coluna sensível — nome omitido)
created_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id` · `whitelabel_id` → `whitelabels.id`

### payment_methods

_17 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255)
description                                text
status                                     tinyint NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (3):** `advertisement_negotiations` · `fee_applicabilities` · `review_negotiations`

### pending_device_authorizations

_0 linhas · 15 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
whitelabel_id                              bigint unsigned NOT NULL
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
user_agent                                 text
browser_name                               varchar(100)
os_name                                    varchar(100)
device_type                                varchar(50)
authorized                                 tinyint(1) NOT NULL
authorized_at                              timestamp
expires_at                                 timestamp NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id` · `whitelabel_id` → `whitelabels.id`

### pending_location_authorizations

_18 linhas · 15 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
whitelabel_id                              bigint unsigned NOT NULL
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
ip_address                                 varchar(45) NOT NULL
city                                       varchar(100)
state                                      varchar(100)
country                                    varchar(100)
user_agent                                 text
authorized                                 tinyint(1) NOT NULL
authorized_at                              timestamp
expires_at                                 timestamp NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id` · `whitelabel_id` → `whitelabels.id`

### permissions

_458 linhas · 9 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
alias                                      varchar(255) NOT NULL
guard_name                                 varchar(255) NOT NULL
module                                     varchar(255)
is_menu                                    tinyint(1) NOT NULL
icon                                       varchar(255)
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (2):** `model_has_permissions` · `role_has_permissions`

### personal_access_tokens

_0 linhas · 10 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
name                                       varchar(255) NOT NULL
···                                        (coluna sensível — nome omitido)
abilities                                  text
last_used_at                               timestamp
expires_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

### photo_tags

_41 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(15) NOT NULL
background_color                           varchar(30) NOT NULL
text_color                                 varchar(30) NOT NULL
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `vehicle_extra_fields`

### pickup_authorizations

_619 linhas · 14 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
advertisement_id                           bigint unsigned NOT NULL
schedule_id                                bigint unsigned NOT NULL
stock_id                                   bigint unsigned NOT NULL
vehicle_id                                 bigint unsigned NOT NULL
buyer_user_id                              bigint unsigned NOT NULL
authorized_name                            varchar(255) NOT NULL
···                                        (coluna sensível — nome omitido)
is_active                                  tinyint(1) NOT NULL
consent_checked                            tinyint(1) NOT NULL
consent_at                                 timestamp NOT NULL
updated_by                                 bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `buyer_user_id` → `users.id` · `schedule_id` → `schedules.id` · `stock_id` → `shop_stocks.id` · `updated_by` → `users.id` · `vehicle_id` → `vehicles.id`

### preferences

_108 linhas · 20 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
inventory_volume_min                       int
inventory_volume_max                       int
inventory_turnover_min                     int
inventory_turnover_max                     int
average_stock_ticket_min                   double(8,2)
average_stock_ticket_max                   double(8,2)
km_per_year_min                            int
km_per_year_max                            int
start_year                                 int
finish_year                                int
min_price                                  double(8,2)
max_price                                  double(8,2)
armored                                    tinyint
imported                                   tinyint
alert                                      tinyint
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id`

**Referenciada por (5):** `bodywork_preferences` · `interest_region_preference` · `model_preference` · `purchase_origin_preference` · `report_status_preference`

### publishing_channel_client_groups

_232 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
publishing_channel_id                      bigint unsigned NOT NULL
default_cg_id                              bigint unsigned
direct_transfer_cg_id                      bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `default_cg_id` → `client_groups.id` · `direct_transfer_cg_id` → `client_groups.id` · `publishing_channel_id` → `publishing_channels.id`

### publishing_channel_whitelabels

_442 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
publishing_channel_id                      bigint unsigned NOT NULL
whitelabel_id                              bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `publishing_channel_id` → `publishing_channels.id` · `whitelabel_id` → `whitelabels.id`

### publishing_channels

_76 linhas · 9 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned NOT NULL
default_client_group_status                tinyint(1) NOT NULL
direct_transfer_client_group_status        tinyint(1) NOT NULL
enable_default_client_group_selection_edit tinyint(1) NOT NULL
enable_direct_transfer_client_group_selection_edit tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `shop_id` → `shops.id`

**Referenciada por (2):** `publishing_channel_client_groups` · `publishing_channel_whitelabels`

### purchase_origin_preference

_38 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
preference_id                              bigint unsigned NOT NULL
purchase_origin_id                         bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `preference_id` → `preferences.id` · `purchase_origin_id` → `purchase_origins.id`

### purchase_origins

_5 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(45) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Referenciada por (1):** `purchase_origin_preference`

### reason_withdraws

_1 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
description                                text
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

### registration_logs

_3.466 linhas · 13 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
name                                       varchar(255)
email                                      varchar(255)
phone                                      varchar(35)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
company_name                               varchar(255)
notification_message                       text NOT NULL
origin                                     varchar(255)
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `whitelabel_id` → `whitelabels.id`

### regulation_acceptances

_0 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
event_id                                   bigint unsigned NOT NULL
regulation_id                              bigint unsigned NOT NULL
ip_address                                 varchar(255) NOT NULL
accepted_at                                timestamp NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `event_id` → `events.id` · `regulation_id` → `contents.id` · `user_id` → `users.id`

### report_status_preference

_32 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
preference_id                              bigint unsigned NOT NULL
report_status_id                           bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `preference_id` → `preferences.id` · `report_status_id` → `report_statuses.id`

### report_statuses

_3 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(45) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Referenciada por (1):** `report_status_preference`

### reports

_13.103 linhas · 13 colunas_

```
id                                         char(36) NOT NULL PK
user_id                                    bigint unsigned NOT NULL
model                                      varchar(255) NOT NULL
status                                     enum('pendente','processando','concluido','falha') NOT NULL
format                                     varchar(255) NOT NULL
filters                                    json
sorts                                      json
file_path                                  varchar(255)
download_url                               varchar(255)
error                                      text
completed_at                               timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id`

### review_negotiations

_1 linhas · 17 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
type                                       varchar(255) NOT NULL
finish_date_offer                          datetime
initial_price_reference                    double(8,2)
receive_proposal_above_from                double(8,2)
price_buyer                                double(8,2)
situation_precautionary_report             varchar(255)
client_accepted_negotiation                varchar(255)
account_id                                 bigint unsigned
payment_method_id                          bigint unsigned
content_id                                 bigint unsigned
advertisement_id                           bigint unsigned
review_id                                  bigint unsigned
situation                                  int NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `account_id` → `accounts.id` · `advertisement_id` → `advertisements.id` · `content_id` → `contents.id` · `payment_method_id` → `payment_methods.id` · `review_id` → `reviews.id`

### reviews

_3 linhas · 19 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
email                                      varchar(255) NOT NULL
phone                                      varchar(255) NOT NULL
···                                        (coluna sensível — nome omitido)
shop_id                                    bigint unsigned NOT NULL
shop_stock_id                              bigint unsigned NOT NULL
···                                        (coluna sensível — nome omitido)
origin_lead                                varchar(255) NOT NULL
code                                       varchar(255) NOT NULL
situation                                  int NOT NULL
observation_client                         text
observation_shop                           text
vehicle_id                                 bigint unsigned
advertisement_id                           bigint unsigned
inspection_id                              bigint unsigned
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `inspection_id` → `inspection.id` · `shop_id` → `shops.id` · `shop_stock_id` → `shop_stocks.id` · `vehicle_id` → `vehicles.id`

**Referenciada por (1):** `review_negotiations`

### role_has_permissions

_2.227 linhas · 2 colunas_

```
permission_id                              bigint unsigned NOT NULL PK
role_id                                    bigint unsigned NOT NULL PK
```

**Aponta para:** `permission_id` → `permissions.id` · `role_id` → `roles.id`

### roles

_28 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
guard_name                                 varchar(255) NOT NULL
description                                varchar(255)
enable_relationship_shop_user              tinyint(1) NOT NULL
status                                     tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (2):** `model_has_roles` · `role_has_permissions`

### sale_networks

_563 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

### schedules

_976 linhas · 14 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned NOT NULL
stock_id                                   bigint unsigned
client_id                                  bigint unsigned NOT NULL
advertisement_id                           bigint unsigned NOT NULL
schedule_date                              date NOT NULL
schedule_hour                              time NOT NULL
situation                                  int NOT NULL
type                                       varchar(10) NOT NULL
reason_refusal                             text
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
···                                        (coluna sensível — nome omitido)
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `client_id` → `users.id` · `shop_id` → `shops.id` · `stock_id` → `shop_stocks.id`

**Referenciada por (1):** `pickup_authorizations`

### shop_addresses

_23.210 linhas · 15 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned NOT NULL
postal_code                                varchar(255)
district                                   varchar(255)
street                                     varchar(255)
number                                     varchar(255)
public_place                               varchar(255)
city                                       varchar(255)
state                                      varchar(255)
complement                                 varchar(255)
latitude                                   varchar(255)
longitude                                  varchar(255)
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `shop_id` → `shops.id`

### shop_api_tokens

_0 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned NOT NULL
name                                       varchar(255) NOT NULL
···                                        (coluna sensível — nome omitido)
last_used_at                               timestamp
expires_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `shop_id` → `shops.id`

### shop_automation_conditions

_0 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_automation_id                         bigint unsigned NOT NULL
condition_item                             varchar(255) NOT NULL
condition_rule                             varchar(255) NOT NULL
condition_value                            int NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `shop_automation_id` → `shop_automations.id`

### shop_automation_logs

_8.532 linhas · 11 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_automation_id                         bigint unsigned NOT NULL
advertisement_id                           bigint unsigned
result_advertisement_id                    bigint unsigned
status                                     varchar(255) NOT NULL
error_message                              text
metadata                                   json
attempts                                   int NOT NULL
processed_at                               timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `result_advertisement_id` → `advertisements.id` · `shop_automation_id` → `shop_automations.id`

### shop_automations

_4 linhas · 12 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned NOT NULL
name                                       varchar(255) NOT NULL
priority                                   int NOT NULL
description                                text
trigger_event                              varchar(255) NOT NULL
trigger_situation                          int NOT NULL
action_type                                varchar(255) NOT NULL
is_active                                  tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `shop_id` → `shops.id`

**Referenciada por (2):** `shop_automation_conditions` · `shop_automation_logs`

### shop_integrations

_0 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned NOT NULL
integration_id                             bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `integration_id` → `integrations.id` · `shop_id` → `shops.id`

### shop_signatures

_1 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned NOT NULL
started_at                                 date NOT NULL
ended_at                                   date
created_by                                 bigint unsigned
updated_by                                 bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `created_by` → `users.id` · `shop_id` → `shops.id` · `updated_by` → `users.id`

### shop_stock_schedules

_3.980 linhas · 11 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
stock_id                                   bigint unsigned NOT NULL
action                                     varchar(255) NOT NULL
weekday                                    varchar(255) NOT NULL
morning_period_start                       varchar(255)
morning_period_end                         varchar(255)
afternoon_period_start                     varchar(255)
afternoon_period_end                       varchar(255)
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `stock_id` → `shop_stocks.id`

### shop_stocks

_2.505 linhas · 33 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned NOT NULL
situation                                  int NOT NULL
name                                       varchar(255) NOT NULL
slug                                       varchar(255) NOT NULL
whatsapp                                   varchar(45)
comercial_phone                            varchar(45)
privative_phone                            varchar(45)
comercial_email                            varchar(255)
privative_email                            varchar(255)
interval_between_service                   int
interval_between_service_pickup            int
number_of_services_per_interval            int
minimum_visit_schedule_hours               int
number_of_services_per_interval_pickup     int
minimum_pickup_schedule_hours              int
deadline_for_pickingup_vehicle             varchar(255)
garage_type                                varchar(255)
enable_visit_scheduling                    tinyint(1) NOT NULL
enable_pickup_schedule                     tinyint(1) NOT NULL
postal_code                                varchar(255)
district                                   varchar(255)
street                                     varchar(255)
number                                     varchar(255)
public_place                               varchar(255)
city                                       varchar(255)
state                                      varchar(255)
complement                                 varchar(255)
latitude                                   varchar(255)
longitude                                  varchar(255)
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `shop_id` → `shops.id`

**Referenciada por (8):** `advertisements` · `inspection` · `pickup_authorizations` · `reviews` · `schedules` · `shop_stock_schedules` · `user_stocks` · `vehicles`

### shop_webhooks

_6 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned NOT NULL
enable_webhook_status                      tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `shop_id` → `shops.id`

### shops

_23.246 linhas · 50 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
situation                                  int NOT NULL
sale_networks_id                           bigint unsigned
wallet_id                                  bigint unsigned
business_unit_id                           bigint unsigned
ad_origin_id                               bigint unsigned
key_account_id                             bigint unsigned
business_consultant_id                     bigint unsigned
business_consultant_2_id                   bigint unsigned
name                                       varchar(255) NOT NULL
slug                                       varchar(255) NOT NULL
corporate_name                             varchar(255)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
address_proof_file                         varchar(255)
logo_url                                   varchar(255)
cnae                                       varchar(255)
uri                                        varchar(255)
whatsapp_number                            varchar(20)
comercial_number                           varchar(20)
privative_number                           varchar(20)
comercial_email                            varchar(255)
privative_email                            varchar(255)
work_days_for_payment                      smallint
work_days_for_buyer_counterproposal_analysis smallint
expected_sales_percentage                  smallint
extra_cost_for_inspection                  double(8,2)
···                                        (coluna sensível — nome omitido)
partner_name                               varchar(255)
revenues                                   double(16,2)
tax_form                                   varchar(255)
fundation_date                             date
customer_information                       varchar(20)
enable_payment_platform                    tinyint(1) NOT NULL
enable_payment_platform_external           int NOT NULL
enable_payment_tax_platform                varchar(255)
enable_payment_tax_platform_external       int NOT NULL
enable_complete_register                   tinyint(1) NOT NULL
enable_purchasing_customer_information     tinyint(1) NOT NULL
enable_buyer                               tinyint(1) NOT NULL
enable_advertiser                          tinyint(1) NOT NULL
observation                                text
deleted_at                                 timestamp
deleted_by                                 bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
enable_withdrawal_platform                 tinyint(1) NOT NULL
profile_type                               varchar(255)
```

**Aponta para:** `business_consultant_2_id` → `users.id` · `business_consultant_id` → `users.id` · `deleted_by` → `users.id` · `key_account_id` → `users.id` · `whitelabel_id` → `whitelabels.id`

**Referenciada por (23):** `access_logs` · `accounts` · `advertisements` · `contents` · `event_shops` · `fee_applicabilities` · `inspection` · `offers` · `offers_automatics` · `publishing_channels` · `reviews` · `schedules` · `shop_addresses` · `shop_api_tokens` · `shop_automations` · `shop_integrations` · `shop_signatures` · `shop_stocks` · `shop_webhooks` · `transactions` · `type_inspection_items` · `user_shops` · `vehicles`

### tag_applicabilities

_0 linhas · 10 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
tag_id                                     bigint unsigned NOT NULL
brand_id                                   bigint unsigned
category_id                                bigint unsigned
model_id                                   bigint unsigned
version_id                                 bigint unsigned
entrance_origin_id                         bigint unsigned
bodywork_id                                bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `bodywork_id` → `bodyworks.id` · `brand_id` → `brands.id` · `category_id` → `categories.id` · `entrance_origin_id` → `entrance_origins.id` · `model_id` → `models.id` · `tag_id` → `tags.id` · `version_id` → `versions.id`

### tag_whitelabel

_0 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
tag_id                                     bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `tag_id` → `tags.id` · `whitelabel_id` → `whitelabels.id`

### tags

_0 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
description                                text
image_url                                  varchar(255)
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (3):** `tag_applicabilities` · `tag_whitelabel` · `vehicle_tags`

### transactions

_13.754 linhas · 42 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
advertisement_id                           bigint unsigned NOT NULL
offer_id                                   bigint unsigned NOT NULL
seller_applicability_price                 double(8,2)
seller_applicability_id                    bigint unsigned
seller_applicability_situation             tinyint NOT NULL
seller_applicability_payment_file          varchar(255)
seller_shop_id                             bigint unsigned NOT NULL
buyer_applicability_price                  double(8,2)
buyer_applicability_id                     bigint unsigned
buyer_applicability_situation              tinyint NOT NULL
buyer_applicability_payment_file           varchar(255)
buyer_applicability_ticket_file            varchar(255)
buyer_advertisement_situation              tinyint
buyer_advertisement_payment_file           varchar(255)
buyer_advertisement_ticket_file            varchar(255)
buyer_shop_id                              bigint unsigned
buyer_user_id                              bigint unsigned NOT NULL
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
situation                                  smallint NOT NULL
observation                                text
created_at                                 timestamp
updated_at                                 timestamp
canceled_at                                timestamp
payment_confirmed_at                       timestamp
cancellation_reason                        text
additional_fee_amount                      double(8,2) NOT NULL
additional_fee_description                 text
discount_fee_amount                        double(8,2) NOT NULL
discount_fee_description                   text
discount_advertisement_amount              double(8,2) NOT NULL
discount_advertisement_description         text
deleted_at                                 timestamp
deleted_by                                 bigint unsigned
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `buyer_applicability_id` → `fee_applicabilities.id` · `buyer_shop_id` → `shops.id` · `buyer_user_id` → `users.id` · `deleted_by` → `users.id` · `document_delivery_user_address_id` → `user_addresses.id` · `offer_id` → `offers.id` · `seller_applicability_id` → `fee_applicabilities.id` · `seller_shop_id` → `shops.id`

### transport_contracts

_1 linhas · 11 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
advertisement_id                           bigint unsigned NOT NULL
contract_id                                varchar(255) NOT NULL
status_payment                             tinyint unsigned NOT NULL
status_carriage                            tinyint unsigned NOT NULL
gathering_date                             datetime
delivery_date                              datetime
tracking_url                               varchar(255) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `user_id` → `users.id`

### type_inspection_items

_95 linhas · 9 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
type_inspection_id                         bigint unsigned NOT NULL
category_id                                bigint unsigned NOT NULL
shop_id                                    bigint unsigned
item_inspection_id                         bigint unsigned NOT NULL
position                                   int NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `category_id` → `categories.id` · `item_inspection_id` → `item_inspections.id` · `shop_id` → `shops.id` · `type_inspection_id` → `type_inspections.id`

### type_inspections

_2 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255)
description                                text
status                                     tinyint
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `type_inspection_items`

### user_access

_481.869 linhas · 3 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
created_at                                 timestamp NOT NULL
```

**Aponta para:** `user_id` → `users.id`

### user_addresses

_69.502 linhas · 14 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
is_main                                    tinyint(1) NOT NULL
postal_code                                varchar(255)
district                                   varchar(255)
street                                     varchar(255)
public_place                               varchar(255)
number                                     varchar(255)
city                                       varchar(255)
state                                      varchar(255)
complement                                 varchar(255)
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id`

**Referenciada por (1):** `transactions`

### user_advertisement_favorites

_0 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
advertisement_id                           bigint unsigned NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `user_id` → `users.id`

### user_advertisement_financings

_0 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
advertisement_id                           bigint unsigned NOT NULL
financing_value                            decimal(15,2) NOT NULL
created_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `user_id` → `users.id`

### user_alerts

_57 linhas · 17 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
model_id                                   bigint unsigned
version_id                                 bigint unsigned
brand_id                                   bigint unsigned
year_min                                   int
year_max                                   int
price_min                                  decimal(10,2)
price_max                                  decimal(10,2)
km_min                                     int
km_max                                     int
notify_immediately                         tinyint(1) NOT NULL
notify_daily                               tinyint(1) NOT NULL
active                                     tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `brand_id` → `brands.id` · `model_id` → `models.id` · `user_id` → `users.id` · `version_id` → `versions.id`

### user_clients_group

_79.593 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
client_group_id                            bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `client_group_id` → `client_groups.id` · `user_id` → `users.id`

### user_communications

_69.502 linhas · 17 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
accept_sms_advertising                     tinyint(1) NOT NULL
accept_email_advertising                   tinyint(1) NOT NULL
accept_whatsapp_advertising                tinyint(1) NOT NULL
accept_icarros_advertising                 tinyint(1) NOT NULL
accept_sms_notification                    tinyint(1) NOT NULL
accept_email_notification                  tinyint(1) NOT NULL
accept_push_notification                   tinyint(1) NOT NULL
accept_transactional_email                 tinyint(1) NOT NULL
accept_transactional_whatsapp              tinyint(1) NOT NULL
accept_privacy_terms                       tinyint(1) NOT NULL
accept_privacy_policy                      tinyint(1) NOT NULL
origin_channel                             varchar(255)
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id`

### user_devices

_3 linhas · 14 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
···                                        (coluna sensível — nome omitido)
user_agent                                 text
browser_name                               varchar(100)
browser_version                            varchar(50)
os_name                                    varchar(100)
os_version                                 varchar(50)
device_type                                varchar(50)
is_trusted                                 tinyint(1) NOT NULL
last_used_at                               timestamp NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id`

### user_favorites

_34.597 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
advertisement_id                           bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `user_id` → `users.id`

### user_login_locations

_16.280 linhas · 14 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
ip_address                                 varchar(45) NOT NULL
country                                    varchar(100)
state                                      varchar(100)
city                                       varchar(100)
latitude                                   decimal(10,8)
longitude                                  decimal(11,8)
user_agent                                 varchar(500)
is_trusted                                 tinyint(1) NOT NULL
last_used_at                               timestamp NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id`

### user_profiles

_69.499 linhas · 15 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
wallet_id                                  bigint unsigned
business_unit_id                           bigint unsigned
phone                                      varchar(255) NOT NULL
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
how_you_meet                               varchar(255)
register_form                              varchar(255)
register_form_value                        varchar(255)
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
benefit_club_id                            int
···                                        (coluna sensível — nome omitido)
```

**Aponta para:** `business_unit_id` → `business_units.id` · `user_id` → `users.id` · `wallet_id` → `wallets.id`

### user_shops

_21.444 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
shop_id                                    bigint unsigned NOT NULL
function                                   mediumint
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `shop_id` → `shops.id` · `user_id` → `users.id`

### user_stocks

_1 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
stock_id                                   bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `stock_id` → `shop_stocks.id` · `user_id` → `users.id`

### user_whitelabels

_52.384 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
whitelabel_id                              bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id` · `whitelabel_id` → `whitelabels.id`

### users

_74.014 linhas · 26 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
uuid                                       char(36) NOT NULL UNI
full_name                                  varchar(255) NOT NULL
email                                      varchar(255) NOT NULL
email_verified_at                          timestamp
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
pin_code                                   varchar(255)
pin_code_attempt                           int
situation                                  varchar(20) NOT NULL
approved_at                                timestamp
whitelabel_origin_id                       bigint unsigned NOT NULL
code                                       varchar(255)
···                                        (coluna sensível — nome omitido)
internal_user                              tinyint(1) NOT NULL
vacation_mode                              tinyint(1) NOT NULL
enable_location_security                   tinyint(1) NOT NULL
···                                        (coluna sensível — nome omitido)
observation                                text
photo_url                                  varchar(255)
deleted_at                                 timestamp
deleted_by                                 bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `deleted_by` → `users.id` · `whitelabel_origin_id` → `whitelabels.id`

**Referenciada por (48):** `access_logs` · `advertisements` · `aliases` · `campaign_links` · `chat_messages` · `chat_participants` · `communication_item_views` · `communication_items` · `communication_responses` · `event_user_alerts` · `inspection` · `notifications` · `offers` · `offers_automatics` · `password_histories` · `password_reset_tokens` · `pending_device_authorizations` · `pending_location_authorizations` · `pickup_authorizations` · `preferences` · `regulation_acceptances` · `reports` · `schedules` · `shop_signatures` · `shops` · `transactions` · `transport_contracts` · `user_access` · `user_addresses` · `user_advertisement_favorites` · `user_advertisement_financings` · `user_alerts` · `user_clients_group` · `user_communications` · `user_devices` · `user_favorites` · `user_login_locations` · `user_profiles` · `user_shops` · `user_stocks` · `user_whitelabels` · `users` · `vehicle_documents` · `vehicles` · `vozis_inactivity_progress` · `vozis_user_contacts` · `whitelabel_permissions` · `whitelabels`

### users_restriction_actives

_0 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              int NOT NULL
restriction_base                           int NOT NULL
client_group_id                            int NOT NULL
user_id                                    int NOT NULL
responsible_user_id                        int NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

### users_restriction_job

_0 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
total_jobs                                 int NOT NULL
processed_jobs                             int NOT NULL
finished                                   tinyint(1) NOT NULL
failed                                     tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

### variables

_0 linhas · 4 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL UNI
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `contents_variables`

### vehicle_accessories

_639.521 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
vehicle_id                                 bigint unsigned NOT NULL
accessory_id                               bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `accessory_id` → `accessories.id` · `vehicle_id` → `vehicles.id`

### vehicle_advertisements

_0 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
vehicle_id                                 bigint unsigned NOT NULL
advertisement_id                           bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `advertisement_id` → `advertisements.id` · `vehicle_id` → `vehicles.id`

### vehicle_characteristics

_3 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
vehicle_id                                 bigint unsigned NOT NULL
characteristic_id                          bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `characteristic_id` → `characteristics.id` · `vehicle_id` → `vehicles.id`

### vehicle_data_cache

_25.292 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
identifier                                 varchar(255) NOT NULL
type                                       enum('placa','chassi') NOT NULL
results                                    json NOT NULL
versions_count                             int NOT NULL
cache_month                                date NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

### vehicle_documents

_452 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
···                                        (coluna sensível — nome omitido)
vehicle_id                                 bigint unsigned NOT NULL
file_url                                   varchar(255) NOT NULL
user_id                                    bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `document_type_id` → `document_types.id` · `user_id` → `users.id` · `vehicle_id` → `vehicles.id`

### vehicle_extra_fields

_121.002 linhas · 25 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
vehicle_id                                 bigint unsigned NOT NULL
entrance_origin_id                         bigint unsigned
market_price                               double(20,2)
repair_price                               double(8,2)
axle_qtd                                   int
engine_original_number                     varchar(255)
engine_actual_number                       varchar(255)
power                                      varchar(255)
cylinder_capacity                          varchar(255)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
contract_number                            varchar(150)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
quote                                      tinyint(1) NOT NULL
armored                                    tinyint(1) NOT NULL
imported                                   tinyint(1) NOT NULL
photo_tag_id                               bigint unsigned
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
reason                                     text
```

**Aponta para:** `entrance_origin_id` → `entrance_origins.id` · `photo_tag_id` → `photo_tags.id` · `vehicle_id` → `vehicles.id`

### vehicle_image_galleries

_2.754.569 linhas · 11 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
ordering                                   int
vehicle_id                                 bigint unsigned NOT NULL
name                                       varchar(255)
description                                text
image_url                                  varchar(255)
thumb_url                                  varchar(255)
visible                                    tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `vehicle_id` → `vehicles.id`

### vehicle_precautionary_reports

_90.327 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
vehicle_id                                 bigint unsigned NOT NULL
situation                                  varchar(255)
file_url                                   varchar(255)
file_origin_import                         varchar(300)
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `vehicle_id` → `vehicles.id`

### vehicle_request_logs

_11 linhas · 24 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned
whitelabel_id                              bigint unsigned
type                                       varchar(255)
···                                        (coluna sensível — nome omitido)
title                                      varchar(255)
message                                    varchar(255)
request_payload                            json
process_payload                            json
status                                     int
photos_type                                varchar(255)
photos_rows                                int
photos_errors                              longtext
videos_type                                varchar(255)
videos_rows                                int
videos_errors                              longtext
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
precautionary_report_type                  varchar(255)
precautionary_report_rows                  int
precautionary_report_errors                longtext
created_at                                 timestamp
updated_at                                 timestamp
```

### vehicle_tags

_0 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
vehicle_id                                 bigint unsigned NOT NULL
tag_id                                     bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `tag_id` → `tags.id` · `vehicle_id` → `vehicles.id`

### vehicle_video_galleries

_2.206 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
vehicle_id                                 bigint unsigned NOT NULL
video_url                                  varchar(255)
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `vehicle_id` → `vehicles.id`

### vehicles

_120.909 linhas · 29 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
shop_id                                    bigint unsigned NOT NULL
shop_stock_id                              bigint unsigned NOT NULL
category_id                                bigint unsigned NOT NULL
brand_id                                   bigint unsigned NOT NULL
model_id                                   bigint unsigned NOT NULL
version_id                                 bigint unsigned NOT NULL
alias_id                                   bigint unsigned
bodywork_id                                bigint unsigned NOT NULL
color_id                                   bigint unsigned NOT NULL
drive_shift_id                             bigint unsigned NOT NULL
cluster_id                                 bigint unsigned
fuel_id                                    bigint unsigned NOT NULL
situation                                  int
···                                        (coluna sensível — nome omitido)
···                                        (coluna sensível — nome omitido)
manufacture_year                           int
model_year                                 int
km                                         int
ports_qtd                                  int
fipe_price                                 double(20,2)
fipe_quantity_version                      int
molicar_price                              double(20,2)
retail_value                               double(20,2)
description                                text
deleted_at                                 timestamp
deleted_by                                 bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `alias_id` → `aliases.id` · `bodywork_id` → `bodyworks.id` · `brand_id` → `brands.id` · `category_id` → `categories.id` · `cluster_id` → `clusters.id` · `color_id` → `colors.id` · `deleted_by` → `users.id` · `drive_shift_id` → `driver_shifts.id` · `fuel_id` → `fuels.id` · `model_id` → `models.id` · `shop_id` → `shops.id` · `shop_stock_id` → `shop_stocks.id` · `version_id` → `versions.id`

**Referenciada por (13):** `advertisements` · `inspection` · `pickup_authorizations` · `reviews` · `vehicle_accessories` · `vehicle_advertisements` · `vehicle_characteristics` · `vehicle_documents` · `vehicle_extra_fields` · `vehicle_image_galleries` · `vehicle_precautionary_reports` · `vehicle_tags` · `vehicle_video_galleries`

### versions

_45.911 linhas · 15 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
bodywork_id                                bigint unsigned NOT NULL
category_id                                bigint unsigned NOT NULL
brand_id                                   bigint unsigned NOT NULL
model_id                                   bigint unsigned NOT NULL
name                                       varchar(255) NOT NULL
year                                       year NOT NULL
status                                     tinyint(1) NOT NULL
approved                                   tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
created_by                                 bigint unsigned
code_fipe                                  varchar(255)
code_molicar                               varchar(255)
```

**Aponta para:** `bodywork_id` → `bodyworks.id` · `brand_id` → `brands.id` · `category_id` → `categories.id` · `model_id` → `models.id`

**Referenciada por (5):** `aliases` · `inspection` · `tag_applicabilities` · `user_alerts` · `vehicles`

### vozis_inactivity_levels

_12 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
vozis_inactivity_section_id                bigint unsigned NOT NULL
level                                      tinyint unsigned NOT NULL
days                                       int
campaign_id                                varchar(255)
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `vozis_inactivity_section_id` → `vozis_inactivity_sections.id`

### vozis_inactivity_progress

_0 linhas · 9 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
whitelabel_id                              bigint unsigned NOT NULL
type                                       varchar(20) NOT NULL
current_level                              tinyint unsigned NOT NULL
reference_at                               timestamp NOT NULL
last_evaluated_at                          timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id` · `whitelabel_id` → `whitelabels.id`

### vozis_inactivity_sections

_4 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
type                                       varchar(20) NOT NULL
enabled                                    tinyint(1) NOT NULL
client_group_id                            bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `client_group_id` → `client_groups.id` · `whitelabel_id` → `whitelabels.id`

**Referenciada por (1):** `vozis_inactivity_levels`

### vozis_user_contacts

_2 linhas · 18 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
user_id                                    bigint unsigned NOT NULL
whitelabel_id                              bigint unsigned NOT NULL
trigger_type                               varchar(255) NOT NULL
activation_level                           tinyint unsigned NOT NULL
campaign_id                                varchar(255) NOT NULL
channel                                    varchar(255) NOT NULL
http_status_code                           int
message                                    varchar(255)
request_payload                            json
response_payload                           json
call_status                                varchar(255)
call_duration_sec                          int
call_id                                    varchar(255)
sent_at                                    timestamp
callback_received_at                       timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `user_id` → `users.id` · `whitelabel_id` → `whitelabels.id`

### wallets

_13 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
name                                       varchar(255) NOT NULL
description                                text
status                                     tinyint(1) NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (2):** `user_profiles` · `whitelabel_wallet`

### websockets_statistics_entries

_0 linhas · 7 colunas_

```
id                                         int unsigned NOT NULL PK auto_increment
app_id                                     varchar(255) NOT NULL
peak_connection_count                      int NOT NULL
websocket_message_count                    int NOT NULL
api_message_count                          int NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

### whatsapp_config

_0 linhas · 12 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
api_url                                    varchar(255) NOT NULL
···                                        (coluna sensível — nome omitido)
webhook_url                                varchar(255)
phone_id                                   varchar(255)
phone_number                               varchar(20)
provider                                   varchar(50) NOT NULL
status                                     tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
deleted_at                                 timestamp
```

**Aponta para:** `whitelabel_id` → `whitelabels.id`

### whatsapp_message_statuses

_0 linhas · 10 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              int unsigned NOT NULL
wamid                                      varchar(255) NOT NULL
status                                     enum('sent','delivered','read','failed','deleted') NOT NULL
recipient_id                               varchar(255)
errors                                     json
raw                                        json NOT NULL
status_timestamp                           timestamp NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

### whatsapp_messages

_0 linhas · 14 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              int unsigned NOT NULL
wamid                                      varchar(255) NOT NULL UNI
phone_number_id                            varchar(255) NOT NULL
direction                                  enum('inbound','outbound') NOT NULL
contact_wa_id                              varchar(255) NOT NULL
contact_name                               varchar(255)
type                                       varchar(255) NOT NULL
content                                    text
raw                                        json NOT NULL
webhook_event_id                           bigint unsigned
message_timestamp                          timestamp NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `webhook_event_id` → `whatsapp_webhook_events.id`

### whatsapp_webhook_events

_0 linhas · 12 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              int unsigned NOT NULL
phone_number_id                            varchar(255)
event_type                                 enum('message','status','other') NOT NULL
wamid                                      varchar(255)
payload                                    json NOT NULL
payload_hash                               varchar(64) NOT NULL UNI
processed                                  tinyint(1) NOT NULL
processing_error                           text
received_at                                timestamp NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Referenciada por (1):** `whatsapp_messages`

### whitelabel_addresses

_73 linhas · 14 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
postal_code                                varchar(255)
district                                   varchar(255)
street                                     varchar(255)
number                                     smallint
city                                       varchar(255)
state                                      varchar(255)
complement                                 varchar(255)
latitude                                   varchar(255)
longitude                                  varchar(255)
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `whitelabel_id` → `whitelabels.id`

### whitelabel_business_unit

_22 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
business_unit_id                           bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `business_unit_id` → `business_units.id` · `whitelabel_id` → `whitelabels.id`

### whitelabel_client_groups

_18 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
client_group_id                            bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `client_group_id` → `client_groups.id` · `whitelabel_id` → `whitelabels.id`

### whitelabel_email_configurations

_64 linhas · 18 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
cfg_email_driver                           varchar(255)
cfg_email_host                             varchar(255)
cfg_email_port                             varchar(255)
cfg_email_username                         varchar(255)
···                                        (coluna sensível — nome omitido)
cfg_email_encrypt                          varchar(255)
cfg_email_ses_key                          varchar(255)
···                                        (coluna sensível — nome omitido)
cfg_email_ses_region                       varchar(255)
cfg_email_from_email                       varchar(255)
cfg_email_from_name                        varchar(255)
cfg_email_reply_to                         varchar(255)
cfg_email_reply_text                       varchar(255)
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `whitelabel_id` → `whitelabels.id`

### whitelabel_financing_options

_3 linhas · 10 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
enable_lead_ad_page                        tinyint(1) NOT NULL
enable_lead_winner                         tinyint(1) NOT NULL
recipient                                  varchar(255)
recipient_winning_financing_email          varchar(255)
financing_request_message                  text
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `whitelabel_id` → `whitelabels.id`

### whitelabel_footer_links

_2 linhas · 7 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
label                                      varchar(255) NOT NULL
url                                        varchar(255) NOT NULL
active                                     tinyint(1) NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `whitelabel_id` → `whitelabels.id`

### whitelabel_images

_22 linhas · 11 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
logo                                       varchar(255)
footer_logo                                varchar(255)
favicon                                    varchar(255)
image_mail_one                             varchar(255)
image_mail_two                             varchar(255)
image_mail_three                           varchar(255)
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `whitelabel_id` → `whitelabels.id`

### whitelabel_leads

_16 linhas · 10 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
enable_wanna_sell                          tinyint
enable_C2B                                 tinyint
menu_text                                  varchar(255)
shop_id                                    bigint unsigned NOT NULL
shop_stock_id                              bigint unsigned NOT NULL
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `whitelabel_id` → `whitelabels.id`

### whitelabel_permissions

_74 linhas · 69 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
enable_privacy                             tinyint(1) NOT NULL
···                                        (coluna sensível — nome omitido)
enable_partner_name                        tinyint(1) NOT NULL
···                                        (coluna sensível — nome omitido)
enable_partner_name_required               tinyint(1) NOT NULL
enable_invoicing                           tinyint(1) NOT NULL
enable_cnae                                tinyint(1) NOT NULL
enable_form_tax                            tinyint(1) NOT NULL
enable_fundation_date                      tinyint(1) NOT NULL
enable_cnae_required                       tinyint(1) NOT NULL
enable_invoicing_required                  tinyint(1) NOT NULL
enable_form_tax_required                   tinyint(1) NOT NULL
enable_fundation_required                  tinyint(1) NOT NULL
enable_public_place                        tinyint(1) NOT NULL
enable_fipe_market_value                   tinyint(1) NOT NULL
enable_receiving_advertising_login         tinyint(1) NOT NULL
enable_social_login                        tinyint(1) NOT NULL
enable_float_contact_button                tinyint(1) NOT NULL
enable_fipe                                tinyint(1) NOT NULL
enable_consult_transport                   tinyint(1) NOT NULL
enable_home_mark                           tinyint(1) NOT NULL
enable_home_category                       tinyint(1) NOT NULL
enable_home_advertisers                    tinyint(1) NOT NULL
enable_home_highlights_of_the_day          tinyint(1) NOT NULL
enable_how_know                            tinyint(1) NOT NULL
enable_news                                tinyint(1) NOT NULL
enable_pf                                  tinyint(1) NOT NULL
enable_pj                                  tinyint(1) NOT NULL
enable_benefit_club                        tinyint(1) NOT NULL
enable_sms_validation                      tinyint(1) NOT NULL
enable_approved_automatic                  tinyint(1) NOT NULL
enable_send_docs                           tinyint(1) NOT NULL
enable_send_docs_pj                        tinyint(1) NOT NULL
enable_resend_email_pin                    tinyint(1) NOT NULL
enable_auto_approved_register              tinyint(1) NOT NULL
enable_approve_register_cnae_partner       tinyint(1) NOT NULL
approved_cnaes_list                        json
enable_confirmation_majority               tinyint(1) NOT NULL
enable_address_pf                          tinyint(1) NOT NULL
···                                        (coluna sensível — nome omitido)
enable_purchase_preference                 tinyint(1) NOT NULL
···                                        (coluna sensível — nome omitido)
enable_regulation_acceptance               tinyint(1) NOT NULL
enable_vozis_approved_registration         tinyint(1) NOT NULL
vozis_approved_registration_campaign_id    varchar(255)
enable_full_customer_data_received_schedules tinyint(1) NOT NULL
enable_what_is_your_profile                tinyint(1) NOT NULL
login_security_type                        enum('none','location','device') NOT NULL
e2e_support_enabled                        tinyint(1) NOT NULL
···                                        (coluna sensível — nome omitido)
e2e_support_regenerated_at                 timestamp
e2e_support_regenerated_by_user_id         bigint unsigned
deleted_at                                 timestamp
created_at                                 timestamp
updated_at                                 timestamp
enable_float_button_whatsapp               tinyint(1) NOT NULL
enable_footer_links                        tinyint(1) NOT NULL
enable_footer_phrase                       tinyint(1) NOT NULL
footer_phrase                              varchar(255)
enable_footer_phrase_image                 tinyint(1) NOT NULL
footer_phrase_with_image                   varchar(255)
footer_image_url                           varchar(255)
enable_footer_how_it_works                 tinyint(1) NOT NULL
enable_webhook_status                      tinyint(1) NOT NULL
webhook_status_url                         varchar(255)
···                                        (coluna sensível — nome omitido)
enable_home_events_calendar                tinyint(1) NOT NULL
```

**Aponta para:** `e2e_support_regenerated_by_user_id` → `users.id` · `whitelabel_id` → `whitelabels.id`

### whitelabel_restriction_users

_0 linhas · 6 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned
restriction_base                           int
client_group_id                            bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `client_group_id` → `client_groups.id` · `whitelabel_id` → `whitelabels.id`

### whitelabel_signatures

_1 linhas · 9 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL UNI
enabled                                    tinyint(1) NOT NULL
name                                       varchar(255)
logo                                       varchar(255)
footer_logo                                varchar(255)
favicon                                    varchar(255)
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `whitelabel_id` → `whitelabels.id`

**Referenciada por (1):** `whitelabel_themes`

### whitelabel_themes

_1.207 linhas · 8 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
signature_id                               bigint unsigned
name                                       varchar(255)
value                                      varchar(255)
type                                       varchar(255)
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `signature_id` → `whitelabel_signatures.id` · `whitelabel_id` → `whitelabels.id`

### whitelabel_wallet

_22 linhas · 5 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
whitelabel_id                              bigint unsigned NOT NULL
wallet_id                                  bigint unsigned NOT NULL
created_at                                 timestamp
updated_at                                 timestamp
```

**Aponta para:** `wallet_id` → `wallets.id` · `whitelabel_id` → `whitelabels.id`

### whitelabels

_75 linhas · 43 colunas_

```
id                                         bigint unsigned NOT NULL PK auto_increment
uuid                                       char(36) NOT NULL UNI
script_head                                text
script_body                                text
name                                       varchar(255) NOT NULL UNI
slug                                       varchar(255) NOT NULL UNI
url                                        varchar(255) NOT NULL UNI
configurated_url                           varchar(255)
status                                     tinyint NOT NULL
···                                        (coluna sensível — nome omitido)
description                                text
content_regulation_id                      bigint unsigned
privacy_terms_id                           bigint unsigned
privacy_policy_id                          bigint unsigned
public_email                               varchar(255)
facebook                                   varchar(255)
twitter                                    varchar(255)
instagram                                  varchar(255)
google_analytics                           varchar(255)
authorized_domains                         text
email_blocked_words                        varchar(255)
register_content_text                      varchar(1000)
pld_value_notification                     varchar(255)
pld_value_email_notification               varchar(255)
bid_limit_per_user                         varchar(255)
month_bid_limit_per_user                   varchar(255)
email_lead_funding                         varchar(255)
email_lead_funding_offer                   varchar(255)
message_request_funding_offer              varchar(255)
validate_sms_code                          varchar(255)
limit_max_ad_value                         varchar(255)
sync_date                                  varchar(255)
sync_url                                   varchar(255)
whatsapp_number                            varchar(45)
contact_number                             varchar(45)
sync_filesize                              varchar(255)
client_group_id                            bigint unsigned NOT NULL
deleted_at                                 timestamp
deleted_by                                 bigint unsigned
created_at                                 timestamp
updated_at                                 timestamp
url_webapp                                 varchar(255)
url_auditorium                             varchar(255)
```

**Aponta para:** `deleted_by` → `users.id`

**Referenciada por (38):** `access_logs` · `advertisement_negotiation_whitelabels` · `benefit_clubs` · `communication_item_whitelabels` · `contacts` · `content_components` · `content_whitelabel` · `event_whitelabels` · `fee_applicabilities` · `how_did_you_meet_us_whitelabel` · `leads` · `notifications` · `password_reset_tokens` · `pending_device_authorizations` · `pending_location_authorizations` · `publishing_channel_whitelabels` · `registration_logs` · `shops` · `tag_whitelabel` · `user_whitelabels` · `users` · `vozis_inactivity_progress` · `vozis_inactivity_sections` · `vozis_user_contacts` · `whatsapp_config` · `whitelabel_addresses` · `whitelabel_business_unit` · `whitelabel_client_groups` · `whitelabel_email_configurations` · `whitelabel_financing_options` · `whitelabel_footer_links` · `whitelabel_images` · `whitelabel_leads` · `whitelabel_permissions` · `whitelabel_restriction_users` · `whitelabel_signatures` · `whitelabel_themes` · `whitelabel_wallet`
