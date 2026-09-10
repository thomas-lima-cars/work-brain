# Esquema do banco — Cars2You

> **Gerado em 2026-09-09** cruzando duas fontes exportadas pelo Thomas:
> `Banco_cars.txt` (descrição, FKs e índices de cada tabela) e `Diagrama_cars.pdf`
> (colunas e tipos). Originais em [`_fontes/`](_fontes/).
>
> **144 tabelas · 1.474 colunas documentadas · 239 chaves estrangeiras.**
>
> ⚠️ 4 tabelas (`shops`, `whitelabels`, `whitelabel_permissions`,
> `advertisement_negotiations`) têm 49 colunas que o diagrama colapsou e que
> **não estão aqui** — o bloco delas traz o aviso `COLUNAS OCULTAS`.
>
> Leia o [README.md](README.md) antes de escrever SQL — ele tem os hubs, o mapa de
> domínios e as ressalvas (tipos reconstruídos, tabelas fora do .txt).

## Índice por domínio

**Veículo, ficha técnica e estoque** (25)
[`accessories`](#accessories) · [`accessory_groups`](#accessory_groups) · [`bodyworks`](#bodyworks) · [`brands`](#brands) · [`categories`](#categories) · [`category_groups`](#category_groups) · [`characteristics`](#characteristics) · [`clusters`](#clusters) · [`colors`](#colors) · [`fuels`](#fuels) · [`local_segments`](#local_segments) · [`models`](#models) · [`shop_stock_schedules`](#shop_stock_schedules) · [`shop_stocks`](#shop_stocks) · [`vehicle_accessories`](#vehicle_accessories) · [`vehicle_advertisements`](#vehicle_advertisements) · [`vehicle_characteristics`](#vehicle_characteristics) · [`vehicle_data_cache`](#vehicle_data_cache) · [`vehicle_extra_fields`](#vehicle_extra_fields) · [`vehicle_image_galleries`](#vehicle_image_galleries) · [`vehicle_precautionary_reports`](#vehicle_precautionary_reports) · [`vehicle_tags`](#vehicle_tags) · [`vehicle_video_galleries`](#vehicle_video_galleries) · [`vehicles`](#vehicles) · [`versions`](#versions)

**Anúncio, evento/leilão e negociação** (17)
[`advertisement_negotiation_client_groups`](#advertisement_negotiation_client_groups) · [`advertisement_negotiation_whitelabels`](#advertisement_negotiation_whitelabels) · [`advertisement_negotiations`](#advertisement_negotiations) · [`advertisement_page_views`](#advertisement_page_views) · [`advertisements`](#advertisements) · [`event_client_groups`](#event_client_groups) · [`event_shops`](#event_shops) · [`event_whitelabels`](#event_whitelabels) · [`events`](#events) · [`offers`](#offers) · [`offers_automatics`](#offers_automatics) · [`publishing_channel_client_groups`](#publishing_channel_client_groups) · [`publishing_channel_whitelabels`](#publishing_channel_whitelabels) · [`publishing_channels`](#publishing_channels) · [`reason_withdraws`](#reason_withdraws) · [`review_negotiations`](#review_negotiations) · [`reviews`](#reviews)

**Usuário, acesso e permissão** (24)
[`access_logs`](#access_logs) · [`audits`](#audits) · [`model_has_permissions`](#model_has_permissions) · [`model_has_roles`](#model_has_roles) · [`password_reset_tokens`](#password_reset_tokens) · [`permissions`](#permissions) · [`personal_access_tokens`](#personal_access_tokens) · [`registration_logs`](#registration_logs) · [`role_has_permissions`](#role_has_permissions) · [`roles`](#roles) · [`user_access`](#user_access) · [`user_addresses`](#user_addresses) · [`user_advertisement_favorites`](#user_advertisement_favorites) · [`user_advertisement_financings`](#user_advertisement_financings) · [`user_alerts`](#user_alerts) · [`user_clients_group`](#user_clients_group) · [`user_communications`](#user_communications) · [`user_favorites`](#user_favorites) · [`user_profiles`](#user_profiles) · [`user_shops`](#user_shops) · [`user_whitelabels`](#user_whitelabels) · [`users`](#users) · [`users_restriction_actives`](#users_restriction_actives) · [`users_restriction_job`](#users_restriction_job)

**Whitelabel / multi-tenant** (16)
[`business_units`](#business_units) · [`client_groups`](#client_groups) · [`sale_networks`](#sale_networks) · [`whitelabel_addresses`](#whitelabel_addresses) · [`whitelabel_business_unit`](#whitelabel_business_unit) · [`whitelabel_client_groups`](#whitelabel_client_groups) · [`whitelabel_email_configurations`](#whitelabel_email_configurations) · [`whitelabel_financing_options`](#whitelabel_financing_options) · [`whitelabel_footer_links`](#whitelabel_footer_links) · [`whitelabel_images`](#whitelabel_images) · [`whitelabel_leads`](#whitelabel_leads) · [`whitelabel_permissions`](#whitelabel_permissions) · [`whitelabel_restriction_users`](#whitelabel_restriction_users) · [`whitelabel_themes`](#whitelabel_themes) · [`whitelabel_wallet`](#whitelabel_wallet) · [`whitelabels`](#whitelabels)

**Loja, parceiro e integração** (8)
[`accounts`](#accounts) · [`banks`](#banks) · [`contact_c2b_requests`](#contact_c2b_requests) · [`contacts`](#contacts) · [`integrations`](#integrations) · [`shop_addresses`](#shop_addresses) · [`shop_integrations`](#shop_integrations) · [`shops`](#shops)

**Financeiro e logística** (7)
[`fee_applicabilities`](#fee_applicabilities) · [`fees`](#fees) · [`freight_quotes`](#freight_quotes) · [`payment_methods`](#payment_methods) · [`transactions`](#transactions) · [`transport_contracts`](#transport_contracts) · [`wallets`](#wallets)

**Vistoria / inspeção** (6)
[`inspection`](#inspection) · [`inspection_extras`](#inspection_extras) · [`inspection_media`](#inspection_media) · [`item_inspections`](#item_inspections) · [`type_inspection_items`](#type_inspection_items) · [`type_inspections`](#type_inspections)

**CRM, marketing, conteúdo e comunicação** (21)
[`benefit_club_client_groups`](#benefit_club_client_groups) · [`benefit_club_users`](#benefit_club_users) · [`benefit_clubs`](#benefit_clubs) · [`campaign_client_groups`](#campaign_client_groups) · [`campaign_links`](#campaign_links) · [`campaigns`](#campaigns) · [`chat_messages`](#chat_messages) · [`chat_participants`](#chat_participants) · [`chats`](#chats) · [`content_components`](#content_components) · [`content_components_group_clients`](#content_components_group_clients) · [`content_components_items`](#content_components_items) · [`content_whitelabel`](#content_whitelabel) · [`contents`](#contents) · [`contents_variables`](#contents_variables) · [`leads`](#leads) · [`notifications`](#notifications) · [`schedules`](#schedules) · [`tag_applicabilities`](#tag_applicabilities) · [`tag_whitelabel`](#tag_whitelabel) · [`tags`](#tags)

**Preferências e taxonomias de busca** (11)
[`bodywork_preferences`](#bodywork_preferences) · [`driver_shifts`](#driver_shifts) · [`entrance_origins`](#entrance_origins) · [`interest_region_preference`](#interest_region_preference) · [`interest_regions`](#interest_regions) · [`model_preference`](#model_preference) · [`preferences`](#preferences) · [`purchase_origin_preference`](#purchase_origin_preference) · [`purchase_origins`](#purchase_origins) · [`report_status_preference`](#report_status_preference) · [`report_statuses`](#report_statuses)

**Relatórios, importação e infraestrutura** (9)
[`failed_jobs`](#failed_jobs) · [`health_check_result_history_items`](#health_check_result_history_items) · [`import_logs`](#import_logs) · [`import_row_logs`](#import_row_logs) · [`migration_legacy`](#migration_legacy) · [`migrations`](#migrations) · [`reports`](#reports) · [`variables`](#variables) · [`websockets_statistics_entries`](#websockets_statistics_entries)

**Só no diagrama, ausentes do .txt** (5) — OAuth do Laravel Passport
`oauth_access_toke` · `oauth_auth_cod` · `oauth_clients` · `oauth_personal_access_clie` · `oauth_refresh_toke`

---

## access_logs

_Usuário, acesso e permissão_

Registra os acessos dos usuários às rotas do sistema, útil para auditoria, rastreamento de atividades e análise de tráfego.

```
id                                         BIGINT
whitelabel_id                              BIGINT
advertisement_id                           BIGINT
event_id                                   BIGINT
route                                      VARCHAR(255)
user_id                                    BIGINT
shop_id                                    BIGINT
created_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)` · `advertisement_id` → `advertisements(id)` · `event_id` → `events(id)` · `user_id` → `users(id)` · `shop_id` → `shops(id)`

**Índices:** `PRIMARY KEY: id` · `access_logs_advertisement_id_foreign: (advertisement_id)` · `access_logs_event_id_foreign: (event_id)` · `access_logs_shop_id_foreign: (shop_id)` · `access_logs_user_id_foreign: (user_id)` · `access_logs_whitelabel_id_foreign: (whitelabel_id)`

---

## accessories

_Veículo, ficha técnica e estoque_

Armazena os acessórios individuais de um veículo (ex: "Ar Condicionado", "Vidros Elétricos"), agrupados por tipo.

```
id                                         BIGINT
accessory_group_id                         BIGINT
name                                       VARCHAR(255)
image_url                                  VARCHAR(255)
status                                     TINYINT(1)
approved                                   TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `accessory_group_id` → `accessory_groups(id)`

**Referenciada por (1):** `vehicle_accessories.accessory_id`

**Índices:** `PRIMARY KEY: id` · `accessories_accessory_group_id_foreign: (accessory_group_id)`

---

## accessory_groups

_Veículo, ficha técnica e estoque_

Agrupa os acessórios em categorias (ex: "Conforto", "Segurança").

```
id                                         BIGINT
name                                       VARCHAR(255)
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (1):** `accessories.accessory_group_id`

**Índices:** `PRIMARY KEY: id`

---

## accounts

_Loja, parceiro e integração_

Gerencia as contas bancárias associadas às lojas para transações financeiras.

```
id                                         BIGINT
shop_id                                    BIGINT
bank_id                                    BIGINT
client_name                                VARCHAR(255)
agency                                     VARCHAR(30)
account                                    VARCHAR(50)
beneficiary                                VARCHAR(255)
beneficiary_document                       VARCHAR(255)
description                                TEXT
status                                     TINYINT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `shop_id` → `shops(id)` · `bank_id` → `banks(id)`

**Referenciada por (3):** `advertisement_negotiations.account_id`, `fee_applicabilities.account_id`, `review_negotiations.account_id`

**Índices:** `PRIMARY KEY: id` · `accounts_bank_id_foreign: (bank_id)` · `accounts_shop_id_foreign: (shop_id)`

---

## advertisement_negotiation_client_groups

_Anúncio, evento/leilão e negociação_

Tabela de ligação que associa uma negociação de anúncio a grupos específicos de clientes.

```
id                                         BIGINT
ads_negoti_id                              BIGINT
client_group_id                            BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `ads_negoti_id` → `advertisement_negotiations(id)` · `client_group_id` → `client_groups(id)`

**Índices:** `PRIMARY KEY: id` · `advertisement_negotiation_client_groups_client_group_id_foreign: (client_group_id)` · `idx_ancg_adsnegoti_client: (ads_negoti_id, client_group_id)`

---

## advertisement_negotiation_whitelabels

_Anúncio, evento/leilão e negociação_

Tabela de ligação que associa uma negociação de anúncio a whitelabels específicos.

```
id                                         BIGINT
ads_negoti_id                              BIGINT
whitelabel_id                              BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `ads_negoti_id` → `advertisement_negotiations(id)` · `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `advertisement_negotiation_whitelabels_ads_negoti_id_foreign: (ads_negoti_id)` · `advertisement_negotiation_whitelabels_whitelabel_id_foreign: (whitelabel_id)`

---

## advertisement_negotiations

_Anúncio, evento/leilão e negociação_

Controla os parâmetros e o estado das negociações de um anúncio, como leilões ou vendas diretas.

```
id                                         BIGINT
advertisement_id                           BIGINT
event_id                                   BIGINT
account_id                                 BIGINT
payment_method_id                          BIGINT
content_id                                 BIGINT
status                                     INT
situation_counterproposal                  INT
start_date_display                         DATETIME
start_date_offer                           DATETIME
finish_date_offer                          DATETIME
finish_date_display                        DATETIME
price_reference_advertiser                 DOUBLE(20,2)
enable_buy_now                             TINYINT(1)
enable_available_until_sold                TINYINT(1)
immediate_sale_price                       DOUBLE(20,2)
value_actual                               DOUBLE(20,2)
offer_actual_id                            INT
percent_disable                            VARCHAR(45)
enable_final_dispute_time                  TINYINT(1)
close_seller_analysis_even_if_vmv_reached  TINYINT(1)
initial_price_dispute                      DOUBLE(20,2)
min_sale_price                             DOUBLE(20,2)
increment                                  DOUBLE(20,2)
enable_accept_proposal_below_initial       TINYINT(1)
receive_proposal_above_from_realtime       DOUBLE(20,2)
enable_proposal                            TINYINT(1)
initial_price_reference                    DOUBLE(20,2)
receive_proposal_above_from                DOUBLE(20,2)
show_client_name                           TINYINT(1)
⚠️ 5 COLUNAS OCULTAS — o diagrama colapsou o resto da caixa; não estão documentadas aqui
```

**FK saindo:** `advertisement_id` → `advertisements(id)` · `event_id` → `events(id)` · `account_id` → `accounts(id)` · `payment_method_id` → `payment_methods(id)` · `content_id` → `contents(id)`

**Referenciada por (3):** `advertisement_negotiation_client_groups.ads_negoti_id`, `advertisement_negotiation_whitelabels.ads_negoti_id`, `offers.advs_negotiation_id`

**Índices:** `PRIMARY KEY: id` · `advertisement_negotiations_account_id_foreign: (account_id)` · `advertisement_negotiations_content_id_foreign: (content_id)` · `advertisement_negotiations_event_id_foreign: (event_id)` · `advertisement_negotiations_payment_method_id_foreign: (payment_method_id)` · `idx_adv_neg_status: (status)` · `idx_an_advertisement_deleted: (advertisement_id, deleted_at)`

---

## advertisement_page_views

_Anúncio, evento/leilão e negociação_

Contabiliza as visualizações de página para cada anúncio.

```
id                                         BIGINT
advertisement_id                           BIGINT
views                                      BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `advertisement_id` → `advertisements(id)`

**Índices:** `PRIMARY KEY: id` · `apv_ad_views_idx: (advertisement_id, views)`

---

## advertisements

_Anúncio, evento/leilão e negociação_

Tabela central para os anúncios de veículos. Contém informações sobre o veículo, a loja e preços de referência.

```
id                                         BIGINT
uuid                                       CHAR(36)
shop_id                                    BIGINT
shop_stock_id                              BIGINT
vehicle_id                                 BIGINT
fipe_price                                 DOUBLE(20,2)
molicar_price                              DOUBLE(20,2)
retail_value                               DOUBLE(20,2)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `shop_id` → `shops(id)` · `shop_stock_id` → `shop_stocks(id)` · `vehicle_id` → `vehicles(id)`

**Referenciada por (17):** `access_logs.advertisement_id`, `advertisement_negotiations.advertisement_id`, `advertisement_page_views.advertisement_id`, `chats.advertisement_id`, `fee_applicabilities.advertisement_id`, `freight_quotes.advertisement_id`, `offers.advertisement_id`, `offers_automatics.advertisement_id`, `review_negotiations.advertisement_id`, `reviews.advertisement_id`, `schedules.advertisement_id`, `transactions.advertisement_id`, `transport_contracts.advertisement_id`, `user_advertisement_favorites.advertisement_id`, `user_advertisement_financings.advertisement_id`, `user_favorites.advertisement_id`, `vehicle_advertisements.advertisement_id`

**Índices:** `PRIMARY KEY: id` · `ads_shop_deleted_created_idx: (shop_id, deleted_at, created_at)` · `ads_vehicle_idx: (vehicle_id)` · `advertisements_shop_stock_id_foreign: (shop_stock_id)` · `idx_advs_shop_id: (shop_id)` · `idx_advs_vehicle_deleted: (vehicle_id, deleted_at)`

---

## audits

_Usuário, acesso e permissão_

Registra um log de auditoria detalhado das alterações feitas em vários modelos do sistema.

```
id                                         BIGINT
user_type                                  VARCHAR(255)
user_id                                    BIGINT
event                                      VARCHAR(255)
auditable_type                             VARCHAR(255)*
auditable_id                               BIGINT
old_values                                 TEXT
new_values                                 TEXT
url                                        TEXT
ip_address                                 VARCHAR(45)
user_agent                                 VARCHAR(1023)
tags                                       VARCHAR(255)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Índices:** `PRIMARY KEY: id` · `audits_auditable_type_auditable_id_index: (auditable_type, auditable_id)` · `audits_user_id_user_type_index: (user_id, user_type)`

---

## banks

_Loja, parceiro e integração_

Catálogo de bancos disponíveis para uso no sistema.

```
id                                         BIGINT
name                                       VARCHAR(255)
code                                       VARCHAR(32)
description                                TEXT
status                                     TINYINT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (1):** `accounts.bank_id`

**Índices:** `PRIMARY KEY: id`

---

## benefit_club_client_groups

_CRM, marketing, conteúdo e comunicação_

Associa um clube de benefícios a grupos de clientes específicos.

```
id                                         BIGINT
benefit_club_id                            BIGINT
client_group_id                            BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `benefit_club_id` → `benefit_clubs(id)` · `client_group_id` → `client_groups(id)`

**Índices:** `PRIMARY KEY: id` · `benefit_club_client_groups_benefit_club_id_foreign: (benefit_club_id)` · `benefit_club_client_groups_client_group_id_foreign: (client_group_id)`

---

## benefit_club_users

_CRM, marketing, conteúdo e comunicação_

Armazena os usuários (identificados por documento) que pertencem a um clube de benefícios.

```
id                                         BIGINT
benefit_club_id                            BIGINT
document                                   VARCHAR(255)
name                                       VARCHAR(255)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `benefit_club_id` → `benefit_clubs(id)`

**Índices:** `PRIMARY KEY: id` · `benefit_club_users_benefit_club_id_foreign: (benefit_club_id)`

---

## benefit_clubs

_CRM, marketing, conteúdo e comunicação_

Gerencia os clubes de benefícios, suas regras de validação e configurações.

```
id                                         BIGINT
whitelabel_id                              BIGINT
file_url                                   VARCHAR(255)
name                                       VARCHAR(255)
validation_method                          VARCHAR(255)
validation_document                        VARCHAR(255)
support_text                               VARCHAR(255)
total_registration                         VARCHAR(255)
status                                     TINYINT(1)
validation_field                           VARCHAR(255)
validation_field_min_size                  VARCHAR(255)
validation_field_max_size                  VARCHAR(255)*
api_url                                    VARCHAR(255)
headers                                    VARCHAR(255)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)`

**Referenciada por (2):** `benefit_club_client_groups.benefit_club_id`, `benefit_club_users.benefit_club_id`

**Índices:** `PRIMARY KEY: id` · `benefit_clubs_whitelabel_id_foreign: (whitelabel_id)`

---

## bodywork_preferences

_Preferências e taxonomias de busca_

Associa as preferências de um usuário a tipos específicos de carroceria de veículo.

```
id                                         BIGINT
preference_id                              BIGINT
bodywork_id                                BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**FK saindo:** `preference_id` → `preferences(id)` · `bodywork_id` → `bodyworks(id)`

**Índices:** `PRIMARY KEY: id` · `bodywork_preference_bodywork_id_foreign: (bodywork_id)` · `bodywork_preference_preference_id_foreign: (preference_id)`

---

## bodyworks

_Veículo, ficha técnica e estoque_

Catálogo de tipos de carroceria (ex: "Sedan", "Hatch", "SUV").

```
id                                         BIGINT
category_id                                BIGINT
name                                       VARCHAR(255)
image_url                                  VARCHAR(255)*
status                                     TINYINT(1)
approved                                   TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
integration_category                       INT
```

**FK saindo:** `category_id` → `categories(id)`

**Referenciada por (5):** `bodywork_preferences.bodywork_id`, `inspection.bodywork_id`, `tag_applicabilities.bodywork_id`, `vehicles.bodywork_id`, `versions.bodywork_id`

**Índices:** `PRIMARY KEY: id` · `bodyworks_category_id_foreign: (category_id)`

---

## brands

_Veículo, ficha técnica e estoque_

Catálogo de marcas de veículos (ex: "Fiat", "Ford", "Chevrolet").

```
id                                         BIGINT
category_id                                BIGINT
name                                       VARCHAR(255)
image_url                                  VARCHAR(255)*
status                                     TINYINT(1)
approved                                   TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
created_by                                 BIGINT
```

**FK saindo:** `category_id` → `categories(id)`

**Referenciada por (6):** `inspection.brand_id`, `models.brand_id`, `tag_applicabilities.brand_id`, `user_alerts.brand_id`, `vehicles.brand_id`, `versions.brand_id`

**Índices:** `PRIMARY KEY: id` · `brands_category_id_foreign: (category_id)`

---

## business_units

_Whitelabel / multi-tenant_

Armazena as unidades de negócio da empresa.

```
id                                         BIGINT
name                                       VARCHAR(255)
description                                TEXT
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (3):** `shops.business_unit_id`, `user_profiles.business_unit_id`, `whitelabel_business_unit.business_unit_id`

**Índices:** `PRIMARY KEY: id`

---

## campaign_client_groups

_CRM, marketing, conteúdo e comunicação_

Associa campanhas de marketing a grupos de clientes específicos.

```
id                                         BIGINT
campaign_id                                BIGINT
client_group_id                            BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `campaign_id` → `campaigns(id)` · `client_group_id` → `client_groups(id)`

**Índices:** `PRIMARY KEY: id` · `campaign_client_groups_campaign_id_foreign: (campaign_id)` · `campaign_client_groups_client_group_id_foreign: (client_group_id)`

---

## campaign_links

_CRM, marketing, conteúdo e comunicação_

Gerencia os links de rastreamento para campanhas, associados a consultores.

```
id                                         BIGINT
campaign_id                                BIGINT
key_account_id                             BIGINT
business_consultant_id                     BIGINT
link                                       TEXT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `campaign_id` → `campaigns(id)` · `key_account_id` → `users(id)` · `business_consultant_id` → `users(id)`

**Índices:** `PRIMARY KEY: id` · `campaign_links_business_consultant_id_foreign: (business_consultant_id)` · `campaign_links_campaign_id_foreign: (campaign_id)` · `campaign_links_key_account_id_foreign: (key_account_id)`

---

## campaigns

_CRM, marketing, conteúdo e comunicação_

Armazena informações sobre campanhas de marketing.

```
id                                         BIGINT
name                                       VARCHAR(255)
slug                                       VARCHAR(255)
url                                        VARCHAR(255)
status                                     TINYINT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (2):** `campaign_client_groups.campaign_id`, `campaign_links.campaign_id`

**Índices:** `PRIMARY KEY: id`

---

## categories

_Veículo, ficha técnica e estoque_

Define as categorias de veículos (ex: "Carros", "Motos", "Caminhões").

```
id                                         BIGINT
category_group_id                          BIGINT
name                                       VARCHAR(255)
description                                TEXT
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `category_group_id` → `category_groups(id)`

**Referenciada por (9):** `bodyworks.category_id`, `brands.category_id`, `fee_applicabilities.category_id`, `inspection.category_id`, `models.category_id`, `tag_applicabilities.category_id`, `type_inspection_items.category_id`, `vehicles.category_id`, `versions.category_id`

**Índices:** `PRIMARY KEY: id` · `categories_category_group_id_foreign: (category_group_id)`

---

## category_groups

_Veículo, ficha técnica e estoque_

Agrupa as categorias de veículos.

```
id                                         BIGINT
name                                       VARCHAR(255)
description                                TEXT
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (2):** `categories.category_group_id`, `fee_applicabilities.category_group_id`

**Índices:** `PRIMARY KEY: id`

---

## characteristics

_Veículo, ficha técnica e estoque_

Catálogo de características diversas que um veículo pode ter.

```
id                                         BIGINT
name                                       VARCHAR(255)
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (1):** `vehicle_characteristics.characteristic_id`

**Índices:** `PRIMARY KEY: id`

---

## chat_messages

_CRM, marketing, conteúdo e comunicação_

Armazena as mensagens trocadas dentro de um chat.

```
id                                         BIGINT
chat_id                                    BIGINT
sender_id                                  BIGINT
message                                    TEXT
read_at                                    TIMESTAMP
type                                       ENUM(...)
metadata                                   JSON
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `chat_id` → `chats(id)` · `sender_id` → `users(id)`

**Índices:** `PRIMARY KEY: id` · `chat_messages_chat_id_created_at_index: (chat_id, created_at)` · `chat_messages_sender_id_foreign: (sender_id)`

---

## chat_participants

_CRM, marketing, conteúdo e comunicação_

Gerencia os usuários que participam de uma sala de chat.

```
id                                         BIGINT
chat_id                                    BIGINT
user_id                                    BIGINT
joined_at                                  TIMESTAMP
left_at                                    TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**FK saindo:** `chat_id` → `chats(id)` · `user_id` → `users(id)`

**Índices:** `PRIMARY KEY: id` · `UNIQUE: (chat_id, user_id)` · `chat_participants_user_id_foreign: (user_id)`

---

## chats

_CRM, marketing, conteúdo e comunicação_

Representa uma sala de chat, geralmente associada a um anúncio.

```
id                                         BIGINT
advertisement_id                           BIGINT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `advertisement_id` → `advertisements(id)`

**Referenciada por (2):** `chat_messages.chat_id`, `chat_participants.chat_id`

**Índices:** `PRIMARY KEY: id` · `chats_advertisement_id_foreign: (advertisement_id)`

---

## client_groups

_Whitelabel / multi-tenant_

Define grupos de clientes para segmentação.

```
id                                         BIGINT
name                                       VARCHAR(255)
description                                VARCHAR(255)*
status                                     TINYINT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (12):** `advertisement_negotiation_client_groups.client_group_id`, `benefit_club_client_groups.client_group_id`, `campaign_client_groups.client_group_id`, `content_components_group_clients.client_group_id`, `event_client_groups.client_group_id`, `fee_applicabilities.client_group_id`, `publishing_channel_client_groups.default_cg_id`, `publishing_channel_client_groups.direct_transfer_cg_id`, `user_clients_group.client_group_id`, `whitelabel_client_groups.client_group_id`, `whitelabel_restriction_users.client_group_id`, `whitelabels.client_group_id`

**Índices:** `PRIMARY KEY: id`

---

## clusters

_Veículo, ficha técnica e estoque_

Define clusters ou agrupamentos lógicos de veículos.

```
id                                         BIGINT
name                                       VARCHAR(255)
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (1):** `vehicles.cluster_id`

**Índices:** `PRIMARY KEY: id`

---

## colors

_Veículo, ficha técnica e estoque_

Catálogo de cores de veículos.

```
id                                         BIGINT
name                                       VARCHAR(255)
hexadecimal                                VARCHAR(255)*
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (2):** `inspection.color_id`, `vehicles.color_id`

**Índices:** `PRIMARY KEY: id`

---

## contact_c2b_requests

_Loja, parceiro e integração_

Armazena os leads e solicitações de contato do tipo "Consumer-to-Business" (C2B).

```
id                                         BIGINT
whitelabel_id                              BIGINT
name                                       VARCHAR(255)
email                                      VARCHAR(255)
phone                                      VARCHAR(255)
plate                                      VARCHAR(255)
your_vehicle                               VARCHAR(255)
interested_vehicle                         VARCHAR(255)*
how_to_contact                             VARCHAR(255)
contact_hours                              VARCHAR(255)
greater_interest                           VARCHAR(255)
state                                      VARCHAR(255)
city                                       VARCHAR(255)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**Índices:** `PRIMARY KEY: id`

---

## contacts

_Loja, parceiro e integração_

Armazena mensagens de contato enviadas através do site, associadas a um whitelabel.

```
id                                         BIGINT
whitelabel_id                              BIGINT
name                                       VARCHAR(255)
email                                      VARCHAR(255)
phone                                      VARCHAR(255)
subject                                    VARCHAR(255)
message                                    TEXT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `contacts_whitelabel_id_foreign: (whitelabel_id)`

---

## content_components

_CRM, marketing, conteúdo e comunicação_

Armazena componentes de conteúdo (como banners, seções de texto) para páginas do site.

```
id                                         BIGINT
template                                   VARCHAR(255)
component                                  VARCHAR(255)
title                                      VARCHAR(255)
subtitle                                   VARCHAR(255)
description                                TEXT
button_label                               VARCHAR(255)
button_url                                 VARCHAR(255)
order                                      VARCHAR(255)
image_url                                  VARCHAR(255)
image_mobile_url                           VARCHAR(255)*
video_url                                  VARCHAR(255)
whitelabel_id                              BIGINT
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)`

**Referenciada por (1):** `content_components_items.component_id`

**Índices:** `PRIMARY KEY: id` · `content_components_whitelabel_id_foreign: (whitelabel_id)`

---

## content_components_group_clients

_CRM, marketing, conteúdo e comunicação_

Associa itens de componentes de conteúdo a grupos de clientes.

```
id                                         BIGINT
component_item_id                          BIGINT
client_group_id                            BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `component_item_id` → `content_components_items(id)` · `client_group_id` → `client_groups(id)`

**Índices:** `PRIMARY KEY: id` · `content_components_group_clients_client_group_id_foreign: (client_group_id)` · `content_components_group_clients_component_item_id_foreign: (component_item_id)`

---

## content_components_items

_CRM, marketing, conteúdo e comunicação_

Itens individuais que compõem um content_component (ex: um slide em um carrossel).

```
id                                         BIGINT
component_id                               BIGINT
title                                      VARCHAR(255)
subtitle                                   VARCHAR(255)
description                                TEXT
button_label                               VARCHAR(255)
button_url                                 VARCHAR(255)
order                                      VARCHAR(255)
image_url                                  VARCHAR(255)
image_mobile_url                           VARCHAR(255)
video_url                                  VARCHAR(255)
icon                                       VARCHAR(255)
type                                       VARCHAR(255)
status                                     TINYINT(1)
is_auth                                    TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `component_id` → `content_components(id)`

**Referenciada por (1):** `content_components_group_clients.component_item_id`

**Índices:** `PRIMARY KEY: id` · `content_components_items_component_id_foreign: (component_id)`

---

## content_whitelabel

_CRM, marketing, conteúdo e comunicação_

Associa um conteúdo genérico a um ou mais whitelabels.

```
id                                         BIGINT
content_id                                 BIGINT
whitelabel_id                              BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `content_id` → `contents(id)` · `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `content_whitelabel_content_id_foreign: (content_id)` · `content_whitelabel_whitelabel_id_foreign: (whitelabel_id)`

---

## contents

_CRM, marketing, conteúdo e comunicação_

Tabela central para gerenciamento de conteúdo, como páginas, posts de blog, emails e regulamentos.

```
id                                         BIGINT
shop_id                                    BIGINT
title                                      VARCHAR(255)
subtitle                                   VARCHAR(255)
slug                                       VARCHAR(255)
content_type                               VARCHAR(50)
description                                LONGTEXT
image_url                                  VARCHAR(255)
status                                     TINYINT
email_type                                 VARCHAR(100)
send_to                                    VARCHAR(255)
main_news                                  TINYINT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `shop_id` → `shops(id)`

**Referenciada por (8):** `advertisement_negotiations.content_id`, `content_whitelabel.content_id`, `contents_variables.content_id`, `events.content_regulation_id`, `review_negotiations.content_id`, `whitelabels.content_regulation_id`, `whitelabels.privacy_policy_id`, `whitelabels.privacy_terms_id`

**Índices:** `PRIMARY KEY: id` · `contents_shop_id_foreign: (shop_id)`

---

## contents_variables

_CRM, marketing, conteúdo e comunicação_

Associa variáveis dinâmicas (ex: [NOME_CLIENTE]) a um conteúdo, para personalização.

```
id                                         BIGINT
content_id                                 BIGINT
variable_id                                BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `content_id` → `contents(id)` · `variable_id` → `variables(id)`

**Índices:** `PRIMARY KEY: id` · `contents_variables_content_id_foreign: (content_id)` · `contents_variables_variable_id_foreign: (variable_id)`

---

## driver_shifts

_Preferências e taxonomias de busca_

Catálogo de tipos de câmbio (ex: "Manual", "Automático").

```
id                                         BIGINT
name                                       VARCHAR(255)
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (2):** `inspection.driver_shift_id`, `vehicles.drive_shift_id`

**Índices:** `PRIMARY KEY: id`

---

## entrance_origins

_Preferências e taxonomias de busca_

Define a origem de entrada de um veículo no estoque (ex: "Troca", "Compra Direta").

```
id                                         BIGINT
name                                       VARCHAR(255)
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (2):** `tag_applicabilities.entrance_origin_id`, `vehicle_extra_fields.entrance_origin_id`

**Índices:** `PRIMARY KEY: id`

---

## event_client_groups

_Anúncio, evento/leilão e negociação_

Associa um evento a grupos de clientes específicos.

```
id                                         BIGINT
event_id                                   BIGINT
client_group_id                            BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `event_id` → `events(id)` · `client_group_id` → `client_groups(id)`

**Índices:** `PRIMARY KEY: id` · `event_client_groups_client_group_id_foreign: (client_group_id)` · `event_client_groups_event_id_foreign: (event_id)`

---

## event_shops

_Anúncio, evento/leilão e negociação_

Associa um evento a lojas específicas que podem participar.

```
id                                         BIGINT
event_id                                   BIGINT
shop_id                                    BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `event_id` → `events(id)` · `shop_id` → `shops(id)`

**Índices:** `PRIMARY KEY: id` · `es_shop_event_idx: (shop_id, event_id)` · `event_shops_event_id_foreign: (event_id)`

---

## event_whitelabels

_Anúncio, evento/leilão e negociação_

Associa um evento a whitelabels específicos.

```
id                                         BIGINT
event_id                                   BIGINT
whitelabel_id                              BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `event_id` → `events(id)` · `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `event_whitelabels_event_id_foreign: (event_id)` · `event_whitelabels_whitelabel_id_foreign: (whitelabel_id)`

---

## events

_Anúncio, evento/leilão e negociação_

Gerencia eventos da plataforma, como leilões ou feirões.

```
id                                         BIGINT
situation                                  INT
type                                       VARCHAR(45)
name                                       VARCHAR(255)
priority                                   INT
event_tag                                  INT
description                                TEXT
status                                     TINYINT(1)
home_highlight                             TINYINT(1)
content_regulation_id                      BIGINT
start_date_display                         DATETIME
start_date_offer                           DATETIME
finish_date_event                          DATETIME
finish_date_display                        DATETIME
seconds_between_ads                        INT
finish_type                                VARCHAR(45)
min_seconds_for_more_time                  INT
extra_seconds                              INT
image_url                                  TEXT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `content_regulation_id` → `contents(id)`

**Referenciada por (6):** `access_logs.event_id`, `advertisement_negotiations.event_id`, `event_client_groups.event_id`, `event_shops.event_id`, `event_whitelabels.event_id`, `fee_applicabilities.event_id`

**Índices:** `PRIMARY KEY: id` · `events_content_regulation_id_foreign: (content_regulation_id)`

---

## failed_jobs

_Relatórios, importação e infraestrutura_

Tabela padrão do Laravel para registrar jobs (tarefas em fila) que falharam.

```
id                                         BIGINT
uuid                                       VARCHAR(255)
connection                                 TEXT
queue                                      TEXT
payload                                    LONGTEXT
exception                                  LONGTEXT
failed_at                                  TIMESTAMP
```

**Índices:** `PRIMARY KEY: id` · `UNIQUE: uuid`

---

## fee_applicabilities

_Financeiro e logística_

Define as regras de aplicabilidade das taxas, com base em diversos critérios.

```
id                                         BIGINT
fee_id                                     BIGINT
payment_method_id                          BIGINT
account_id                                 BIGINT
whitelabel_id                              BIGINT
category_group_id                          BIGINT
category_id                                BIGINT
shop_id                                    BIGINT
client_group_id                            BIGINT
advertisement_id                           BIGINT
event_id                                   BIGINT
charge_from                                VARCHAR(255)
priority                                   INT
billing_method                             VARCHAR(255)
application_method                         VARCHAR(255)*
value                                      DOUBLE
recipient                                  VARCHAR(255)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `fee_id` → `fees(id)` · `payment_method_id` → `payment_methods(id)` · `account_id` → `accounts(id)` · `whitelabel_id` → `whitelabels(id)` · `category_group_id` → `category_groups(id)` · `category_id` → `categories(id)` · `shop_id` → `shops(id)` · `client_group_id` → `client_groups(id)` · `advertisement_id` → `advertisements(id)` · `event_id` → `events(id)`

**Referenciada por (2):** `transactions.buyer_applicability_id`, `transactions.seller_applicability_id`

**Índices:** `PRIMARY KEY: id` · `fee_applicabilities_account_id_foreign: (account_id)` · `fee_applicabilities_advertisement_id_foreign: (advertisement_id)` · `fee_applicabilities_category_group_id_foreign: (category_group_id)` · `fee_applicabilities_category_id_foreign: (category_id)` · `fee_applicabilities_client_group_id_foreign: (client_group_id)` · `fee_applicabilities_event_id_foreign: (event_id)` · `fee_applicabilities_fee_id_foreign: (fee_id)` · `fee_applicabilities_payment_method_id_foreign: (payment_method_id)` · `fee_applicabilities_shop_id_foreign: (shop_id)` · `fee_applicabilities_whitelabel_id_foreign: (whitelabel_id)`

---

## fees

_Financeiro e logística_

Armazena as taxas cobradas pela plataforma.

```
id                                         BIGINT
name                                       VARCHAR(255)
name_site                                  VARCHAR(255)
date_init                                  DATE
date_end                                   DATE
priority                                   INT
description                                TEXT
status                                     TINYINT(1)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (1):** `fee_applicabilities.fee_id`

**Índices:** `PRIMARY KEY: id`

---

## freight_quotes

_Financeiro e logística_

Armazena as cotações de frete para o transporte de veículos.

```
id                                         BIGINT
advertisement_id                           BIGINT
vehicles_count                             INT
total_value                                DECIMAL(10,2)
unit_value                                 DECIMAL(10,2)
modals                                     JSON
transit_time                               JSON
requested_route                            JSON
production_mode                            TINYINT(1)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `advertisement_id` → `advertisements(id)`

**Índices:** `PRIMARY KEY: id` · `freight_quotes_advertisement_id_foreign: (advertisement_id)`

---

## fuels

_Veículo, ficha técnica e estoque_

Catálogo de tipos de combustível (ex: "Gasolina", "Etanol", "Diesel").

```
id                                         BIGINT
name                                       VARCHAR(255)
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (2):** `inspection.fuel_id`, `vehicles.fuel_id`

**Índices:** `PRIMARY KEY: id`

---

## health_check_result_history_items

_Relatórios, importação e infraestrutura_

Armazena o histórico de resultados de verificações de saúde do sistema (health checks).

```
id                                         BIGINT
check_name                                 VARCHAR(255)
check_label                                VARCHAR(255)
status                                     VARCHAR(255)
notification_message                       TEXT
short_summary                              VARCHAR(255)
meta                                       JSON
ended_at                                   TIMESTAMP
batch                                      CHAR(36)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Índices:** `PRIMARY KEY: id` · `health_check_result_history_items_batch_index: (batch)` · `health_check_result_history_items_created_at_index: (created_at)`

---

## import_logs

_Relatórios, importação e infraestrutura_

Registra o status e o progresso de importações de dados em lote.

```
id                                         BIGINT
file_path                                  VARCHAR(255)
file_name                                  VARCHAR(255)
model_type                                 VARCHAR(255)*
model_id                                   BIGINT
total_rows                                 INT
processed_rows                             INT
success_rows                               INT
error_rows                                 INT
errors                                     TEXT
status                                     VARCHAR(255)
started_at                                 TIMESTAMP
completed_at                               TIMESTAMP
header_row                                 INT
created_by                                 BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (1):** `import_row_logs.import_log_id`

**Índices:** `PRIMARY KEY: id` · `import_logs_created_by_index: (created_by)` · `import_logs_model_type_model_id_index: (model_type, model_id)` · `import_logs_status_index: (status)`

---

## import_row_logs

_Relatórios, importação e infraestrutura_

Registra o status de cada linha individual dentro de um processo de importação.

```
id                                         BIGINT
import_log_id                              BIGINT
row_number                                 INT
status                                     VARCHAR(255)
error_message                              TEXT
data                                       JSON
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `import_log_id` → `import_logs(id)`

**Índices:** `PRIMARY KEY: id` · `import_row_logs_import_log_id_status_index: (import_log_id, status)` · `import_row_logs_row_number_index: (row_number)`

---

## inspection

_Vistoria / inspeção_

Armazena os dados de uma inspeção veicular.

```
id                                         BIGINT
uuid                                       CHAR(36)
user_id                                    BIGINT
shop_id                                    BIGINT
shop_stock_id                              BIGINT
brand_id                                   BIGINT
model_id                                   BIGINT
version_id                                 BIGINT
driver_shift_id                            BIGINT
bodywork_id                                BIGINT
category_id                                BIGINT
fuel_id                                    BIGINT
color_id                                   BIGINT
quote_id                                   BIGINT
status                                     TINYINT
year                                       VARCHAR(255)
manufacturing_year                         VARCHAR(255)
description                                VARCHAR(255)
license_plate                              VARCHAR(255)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
elapsed_time_in_seconds                    VARCHAR(255)*
```

**FK saindo:** `user_id` → `users(id)` · `shop_id` → `shops(id)` · `shop_stock_id` → `shop_stocks(id)` · `brand_id` → `brands(id)` · `model_id` → `models(id)` · `version_id` → `versions(id)` · `driver_shift_id` → `driver_shifts(id)` · `bodywork_id` → `bodyworks(id)` · `category_id` → `categories(id)` · `fuel_id` → `fuels(id)` · `color_id` → `colors(id)`

**Referenciada por (3):** `inspection_extras.inspection_id`, `inspection_media.inspection_id`, `reviews.inspection_id`

**Índices:** `PRIMARY KEY: id` · `UNIQUE: uuid` · `inspection_bodywork_id_foreign: (bodywork_id)` · `inspection_brand_id_foreign: (brand_id)` · `inspection_category_id_foreign: (category_id)` · `inspection_color_id_foreign: (color_id)` · `inspection_driver_shift_id_foreign: (driver_shift_id)` · `inspection_fuel_id_foreign: (fuel_id)` · `inspection_model_id_foreign: (model_id)` · `inspection_shop_id_foreign: (shop_id)` · `inspection_shop_stock_id_foreign: (shop_stock_id)` · `inspection_user_id_foreign: (user_id)` · `inspection_version_id_foreign: (version_id)`

---

## inspection_extras

_Vistoria / inspeção_

Campos extras e valores associados a uma inspeção.

```
id                                         BIGINT
inspection_id                              BIGINT
inspection_name                            VARCHAR(255)
value                                      VARCHAR(255)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `inspection_id` → `inspection(id)`

**Índices:** `PRIMARY KEY: id` · `inspection_extras_inspection_id_foreign: (inspection_id)`

---

## inspection_media

_Vistoria / inspeção_

Armazena mídias (fotos, vídeos) de uma inspeção.

```
id                                         BIGINT
inspection_id                              BIGINT
media_url                                  VARCHAR(255)
description                                VARCHAR(255)
type                                       VARCHAR(255)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `inspection_id` → `inspection(id)`

**Índices:** `PRIMARY KEY: id` · `inspection_media_inspection_id_foreign: (inspection_id)`

---

## integrations

_Loja, parceiro e integração_

Gerencia as integrações com sistemas de terceiros (ex: laudos).

```
id                                         BIGINT
type                                       VARCHAR(255)
name                                       VARCHAR(255)
status                                     TINYINT(1)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**Referenciada por (1):** `shop_integrations.integration_id`

**Índices:** `PRIMARY KEY: id`

---

## interest_region_preference

_Preferências e taxonomias de busca_

Associa as preferências de um usuário a regiões de interesse.

```
id                                         BIGINT
preference_id                              BIGINT
interest_region_id                         BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**FK saindo:** `preference_id` → `preferences(id)` · `interest_region_id` → `interest_regions(id)`

**Índices:** `PRIMARY KEY: id` · `interest_region_preference_interest_region_id_foreign: (interest_region_id)` · `interest_region_preference_preference_id_foreign: (preference_id)`

---

## interest_regions

_Preferências e taxonomias de busca_

Catálogo de regiões de interesse.

```
id                                         BIGINT
name                                       VARCHAR(45)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**Referenciada por (1):** `interest_region_preference.interest_region_id`

**Índices:** `PRIMARY KEY: id`

---

## item_inspections

_Vistoria / inspeção_

Define os itens que podem ser verificados em uma inspeção veicular.

```
id                                         BIGINT
internal_name                              VARCHAR(255)
inspection_name                            VARCHAR(255)
type                                       VARCHAR(255)
description                                VARCHAR(255)
enable_only_quotation                      TINYINT(1)
required                                   TINYINT(1)
updated_bem                                TINYINT(1)
field                                      VARCHAR(255)
site_name                                  VARCHAR(255)
site_description                           VARCHAR(255)
image_url                                  VARCHAR(255)
enable_send_extra_photo                    TINYINT(1)
enable_send_extra_video                    TINYINT(1)
enable_estimated_deadline                  TINYINT(1)
enable_estimated_cost                      TINYINT(1)
enable_send_comments                       TINYINT(1)
enable_hotspot                             TINYINT(1)
enable_required_estimated_deadline         TINYINT(1)
enable_required_estimated_cost             TINYINT(1)
enable_required_hotspot                    TINYINT(1)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
status                                     TINYINT(1)
type_items                                 TEXT
```

**Referenciada por (1):** `type_inspection_items.item_inspection_id`

**Índices:** `PRIMARY KEY: id`

---

## leads

_CRM, marketing, conteúdo e comunicação_

Armazena os leads capturados através da plataforma.

```
id                                         BIGINT
name                                       VARCHAR(255)
email                                      VARCHAR(255)
phone                                      VARCHAR(255)
state                                      VARCHAR(255)
document                                   VARCHAR(255)*
whitelabel_id                              BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `leads_whitelabel_id_foreign: (whitelabel_id)`

---

## local_segments

_Veículo, ficha técnica e estoque_

Armazena segmentos de mercado ou locais.

```
id                                         BIGINT
name                                       VARCHAR(255)
description                                TEXT
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Índices:** `PRIMARY KEY: id`

---

## migration_legacy

_Relatórios, importação e infraestrutura_

Tabela auxiliar para controlar a migração de dados de um sistema legado.

```
id                                         BIGINT
name                                       VARCHAR(255)
last_id                                    INT
whitelabel_id                              INT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Índices:** `PRIMARY KEY: id` · `UNIQUE: (name, whitelabel_id)`

---

## migrations

_Relatórios, importação e infraestrutura_

Tabela padrão do Laravel para controlar as migrações do banco de dados.

```
id                                         INT
migration                                  VARCHAR(255)
batch                                      INT
```

**Índices:** `PRIMARY KEY: id`

---

## model_has_permissions

_Usuário, acesso e permissão_

Tabela padrão do Spatie/laravel-permission, associando permissões a modelos específicos.

```
permission_id                              BIGINT
model_type                                 VARCHAR(255)
model_id                                   BIGINT
```

**FK saindo:** `permission_id` → `permissions(id)`

**Índices:** `PRIMARY KEY: (permission_id, model_id, model_type)` · `model_has_permissions_model_id_model_type_index: (model_id, model_type)`

---

## model_has_roles

_Usuário, acesso e permissão_

Tabela padrão do Spatie/laravel-permission, associando perfis (roles) a modelos.

```
role_id                                    BIGINT
model_type                                 VARCHAR(255)*
model_id                                   BIGINT
```

**FK saindo:** `role_id` → `roles(id)`

**Índices:** `PRIMARY KEY: (role_id, model_id, model_type)` · `model_has_roles_model_id_model_type_index: (model_id, model_type)`

---

## model_preference

_Preferências e taxonomias de busca_

Associa as preferências de um usuário a modelos de veículos.

```
id                                         BIGINT
preference_id                              BIGINT
models_id                                  BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**FK saindo:** `preference_id` → `preferences(id)` · `models_id` → `models(id)`

**Índices:** `PRIMARY KEY: id` · `model_preference_models_id_foreign: (models_id)` · `model_preference_preference_id_foreign: (preference_id)`

---

## models

_Veículo, ficha técnica e estoque_

Catálogo de modelos de veículos (ex: "Uno", "Mustang", "Onix").

```
id                                         BIGINT
brand_id                                   BIGINT
category_id                                BIGINT
name                                       VARCHAR(255)
status                                     TINYINT(1)
approved                                   TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
created_by                                 BIGINT
```

**FK saindo:** `brand_id` → `brands(id)` · `category_id` → `categories(id)`

**Referenciada por (6):** `inspection.model_id`, `model_preference.models_id`, `tag_applicabilities.model_id`, `user_alerts.model_id`, `vehicles.model_id`, `versions.model_id`

**Índices:** `PRIMARY KEY: id` · `models_brand_id_foreign: (brand_id)` · `models_category_id_foreign: (category_id)`

---

## notifications

_CRM, marketing, conteúdo e comunicação_

Gerencia o envio de notificações (email, etc) para os usuários.

```
id                                         BIGINT
whitelabel_id                              BIGINT
type                                       VARCHAR(255)
title                                      VARCHAR(255)
user_id                                    BIGINT
class_name                                 VARCHAR(255)*
mail_to                                    VARCHAR(255)
content_id                                 INT
body                                       TEXT
sent                                       TINYINT(1)
sent_at                                    DATETIME
response_api                               JSON
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)` · `user_id` → `users(id)`

**Índices:** `PRIMARY KEY: id` · `notifications_user_id_foreign: (user_id)` · `notifications_whitelabel_id_foreign: (whitelabel_id)`

---

## offers

_Anúncio, evento/leilão e negociação_

Registra as ofertas e lances feitos nos anúncios.

```
id                                         BIGINT
internal_user_id                           BIGINT
seller_shop_id                             BIGINT
seller_user_id                             BIGINT
advertisement_id                           BIGINT
buyer_user_id                              BIGINT
buyer_shop_id                              BIGINT
advs_negotiation_id                        BIGINT
negotiation_type                           INT
price                                      DOUBLE(10,2)
situation                                  INT
type_offer                                 TEXT
counter_proposal                           TINYINT(1)
message_buyer                              TEXT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
negotiation_type_filtered                  INT
```

**FK saindo:** `internal_user_id` → `users(id)` · `seller_shop_id` → `shops(id)` · `seller_user_id` → `users(id)` · `advertisement_id` → `advertisements(id)` · `buyer_user_id` → `users(id)` · `buyer_shop_id` → `shops(id)` · `advs_negotiation_id` → `advertisement_negotiations(id)`

**Referenciada por (1):** `transactions.offer_id`

**Índices:** `PRIMARY KEY: id` · `UNIQUE: (advertisement_id, price, negotiation_type_filtered)` · `offers_ad_shop_user_idx: (advertisement_id, buyer_shop_id, buyer_user_id)` · `offers_advs_negotiation_id_foreign: (advs_negotiation_id)` · `offers_buyer_shop_id_foreign: (buyer_shop_id)` · `offers_seller_user_id_foreign: (seller_user_id)` · `offers_shop_id_foreign: (seller_shop_id)` · `offers_user_id_foreign: (internal_user_id)` · `offers_user_offer_id_foreign: (buyer_user_id)`

---

## offers_automatics

_Anúncio, evento/leilão e negociação_

Gerencia ofertas automáticas (lances automáticos) configuradas pelos usuários.

```
id                                         BIGINT
shop_id                                    BIGINT
user_id                                    BIGINT
advertisement_id                           BIGINT
price_registered                           DECIMAL(15,2)
price_incremented                          DECIMAL(15,2)
accept_tiebreaker                          TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `shop_id` → `shops(id)` · `user_id` → `users(id)` · `advertisement_id` → `advertisements(id)`

**Índices:** `PRIMARY KEY: id` · `offers_automatics_advertisement_id_foreign: (advertisement_id)` · `offers_automatics_shop_id_foreign: (shop_id)` · `offers_automatics_user_id_foreign: (user_id)`

---

## password_reset_tokens

_Usuário, acesso e permissão_

Tabela padrão do Laravel para armazenar tokens de redefinição de senha.

```
email                                      VARCHAR(255)
token                                      VARCHAR(255)
user_id                                    BIGINT
whitelabel_id                              BIGINT
resend_token                               VARCHAR(255)
created_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)` · `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: email` · `password_reset_tokens_user_id_foreign: (user_id)` · `password_reset_tokens_whitelabel_id_foreign: (whitelabel_id)`

---

## payment_methods

_Financeiro e logística_

Catálogo de métodos de pagamento (ex: "Boleto", "Cartão de Crédito").

```
id                                         BIGINT
name                                       VARCHAR(255)
description                                TEXT
status                                     TINYINT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (3):** `advertisement_negotiations.payment_method_id`, `fee_applicabilities.payment_method_id`, `review_negotiations.payment_method_id`

**Índices:** `PRIMARY KEY: id`

---

## permissions

_Usuário, acesso e permissão_

Tabela padrão do Spatie/laravel-permission, armazena as permissões de acesso do sistema.

```
id                                         BIGINT
name                                       VARCHAR(255)
alias                                      VARCHAR(255)
guard_name                                 VARCHAR(255)*
module                                     VARCHAR(255)
is_menu                                    TINYINT(1)
icon                                       VARCHAR(255)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (2):** `model_has_permissions.permission_id`, `role_has_permissions.permission_id`

**Índices:** `PRIMARY KEY: id` · `UNIQUE: (name, guard_name)`

---

## personal_access_tokens

_Usuário, acesso e permissão_

Tabela padrão do Laravel para armazenar tokens de acesso pessoal para APIs.

```
id                                         BIGINT
tokenable_type                             VARCHAR(255)
tokenable_id                               BIGINT
name                                       VARCHAR(255)
token                                      VARCHAR(64)
abilities                                  TEXT
last_used_at                               TIMESTAMP
expires_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Índices:** `PRIMARY KEY: id` · `UNIQUE: token` · `personal_access_tokens_tokenable_type_tokenable_id_index: (tokenable_type, tokenable_id)`

---

## preferences

_Preferências e taxonomias de busca_

Armazena as preferências de busca e de compra de um usuário.

```
id                                         BIGINT
user_id                                    BIGINT
inventory_volume_min                       INT
inventory_volume_max                       INT
inventory_turnover_min                     INT
inventory_turnover_max                     INT
average_stock_ticket_min                   DOUBLE(8,2)
average_stock_ticket_max                   DOUBLE(8,2)
km_per_year_min                            INT
km_per_year_max                            INT
start_year                                 INT
finish_year                                INT
min_price                                  DOUBLE(8,2)
max_price                                  DOUBLE(8,2)
armored                                    TINYINT
imported                                   TINYINT
alert                                      TINYINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)`

**Referenciada por (5):** `bodywork_preferences.preference_id`, `interest_region_preference.preference_id`, `model_preference.preference_id`, `purchase_origin_preference.preference_id`, `report_status_preference.preference_id`

**Índices:** `PRIMARY KEY: id` · `preferences_user_id_foreign: (user_id)`

---

## publishing_channel_client_groups

_Anúncio, evento/leilão e negociação_

Define os grupos de clientes para um canal de publicação.

```
id                                         BIGINT
publishing_channel_id                      BIGINT
default_cg_id                              BIGINT
direct_transfer_cg_id                      BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `publishing_channel_id` → `publishing_channels(id)` · `default_cg_id` → `client_groups(id)` · `direct_transfer_cg_id` → `client_groups(id)`

**Índices:** `PRIMARY KEY: id` · `publishing_channel_client_groups_default_cg_id_foreign: (default_cg_id)` · `publishing_channel_client_groups_direct_transfer_cg_id_foreign: (direct_transfer_cg_id)` · `publishing_channel_client_groups_publishing_channel_id_foreign: (publishing_channel_id)`

---

## publishing_channel_whitelabels

_Anúncio, evento/leilão e negociação_

Associa um canal de publicação a um whitelabel.

```
id                                         BIGINT
publishing_channel_id                      BIGINT
whitelabel_id                              BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `publishing_channel_id` → `publishing_channels(id)` · `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `idx_pcw_channel_whitelabel: (publishing_channel_id, whitelabel_id)` · `idx_pcw_whitelabel_id: (whitelabel_id)` · `pcw_channel_white_idx: (publishing_channel_id, whitelabel_id)`

---

## publishing_channels

_Anúncio, evento/leilão e negociação_

Configura os canais de publicação de anúncios para uma loja.

```
id                                         BIGINT
shop_id                                    BIGINT
default_client_group_status                TINYINT(1)
direct_transfer_client_group_status        TINYINT(1)
enable_default_client_group_selection_edit TINYINT(1)
enable_direct_transfer_client_group_selection_edit TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `shop_id` → `shops(id)`

**Referenciada por (2):** `publishing_channel_client_groups.publishing_channel_id`, `publishing_channel_whitelabels.publishing_channel_id`

**Índices:** `PRIMARY KEY: id` · `idx_pc_shop: (shop_id)` · `pc_shop_idx: (shop_id)`

---

## purchase_origin_preference

_Preferências e taxonomias de busca_

Associa as preferências de um usuário à origem de compra dos veículos.

```
id                                         BIGINT
preference_id                              BIGINT
purchase_origin_id                         BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**FK saindo:** `preference_id` → `preferences(id)` · `purchase_origin_id` → `purchase_origins(id)`

**Índices:** `PRIMARY KEY: id` · `purchase_origin_preference_preference_id_foreign: (preference_id)` · `purchase_origin_preference_purchase_origin_id_foreign: (purchase_origin_id)`

---

## purchase_origins

_Preferências e taxonomias de busca_

Catálogo de origens de compra de veículos.

```
id                                         BIGINT
name                                       VARCHAR(45)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**Referenciada por (1):** `purchase_origin_preference.purchase_origin_id`

**Índices:** `PRIMARY KEY: id`

---

## reason_withdraws

_Anúncio, evento/leilão e negociação_

Armazena os motivos pelos quais um anúncio ou oferta pode ser retirado.

```
id                                         BIGINT
name                                       VARCHAR(255)
description                                TEXT
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Índices:** `PRIMARY KEY: id`

---

## registration_logs

_Usuário, acesso e permissão_

Registra logs de tentativas de cadastro de novos usuários ou lojas.

```
id                                         BIGINT
whitelabel_id                              BIGINT
name                                       VARCHAR(255)
email                                      VARCHAR(255)
phone                                      VARCHAR(35)
document                                   VARCHAR(45)
cnpj                                       VARCHAR(45)
company_name                               VARCHAR(255)*
notification_message                       TEXT
origin                                     VARCHAR(255)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `registration_logs_whitelabel_id_foreign: (whitelabel_id)`

---

## report_status_preference

_Preferências e taxonomias de busca_

Associa as preferências de um usuário ao status do laudo do veículo.

```
id                                         BIGINT
preference_id                              BIGINT
report_status_id                           BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**FK saindo:** `preference_id` → `preferences(id)` · `report_status_id` → `report_statuses(id)`

**Índices:** `PRIMARY KEY: id` · `report_status_preference_preference_id_foreign: (preference_id)` · `report_status_preference_report_status_id_foreign: (report_status_id)`

---

## report_statuses

_Preferências e taxonomias de busca_

Catálogo de status para laudos ou relatórios.

```
id                                         BIGINT
name                                       VARCHAR(45)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**Referenciada por (1):** `report_status_preference.report_status_id`

**Índices:** `PRIMARY KEY: id`

---

## reports

_Relatórios, importação e infraestrutura_

Gerencia a geração de relatórios assíncronos, armazenando filtros, status e o link para download.

```
id                                         CHAR(36)
user_id                                    BIGINT
model                                      VARCHAR(255)
status                                     ENUM(...)
format                                     VARCHAR(255)
filters                                    JSON
sorts                                      JSON
file_path                                  VARCHAR(255)
download_url                               VARCHAR(255)*
error                                      TEXT
completed_at                               TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)`

**Índices:** `PRIMARY KEY: id` · `reports_user_id_foreign: (user_id)`

---

## review_negotiations

_Anúncio, evento/leilão e negociação_

Armazena os detalhes da negociação de um veículo em processo de avaliação (review).

```
id                                         BIGINT
type                                       VARCHAR(255)
finish_date_offer                          DATETIME
initial_price_reference                    DOUBLE(8,2)
receive_proposal_above_from                DOUBLE(8,2)
price_buyer                                DOUBLE(8,2)
situation_precautionary_report             VARCHAR(255)*
client_accepted_negotiation                VARCHAR(255)
account_id                                 BIGINT
payment_method_id                          BIGINT
content_id                                 BIGINT
advertisement_id                           BIGINT
review_id                                  BIGINT
situation                                  INT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `account_id` → `accounts(id)` · `payment_method_id` → `payment_methods(id)` · `content_id` → `contents(id)` · `advertisement_id` → `advertisements(id)` · `review_id` → `reviews(id)`

**Índices:** `PRIMARY KEY: id` · `review_negotiations_account_id_foreign: (account_id)` · `review_negotiations_advertisement_id_foreign: (advertisement_id)` · `review_negotiations_content_id_foreign: (content_id)` · `review_negotiations_payment_method_id_foreign: (payment_method_id)` · `review_negotiations_review_id_foreign: (review_id)`

---

## reviews

_Anúncio, evento/leilão e negociação_

Armazena o processo de avaliação (review) de um veículo, geralmente para C2B.

```
id                                         BIGINT
name                                       VARCHAR(255)
email                                      VARCHAR(255)
phone                                      VARCHAR(255)
document                                   VARCHAR(255)
shop_id                                    BIGINT
shop_stock_id                              BIGINT
plate                                      VARCHAR(255)
origin_lead                                VARCHAR(255)*
code                                       VARCHAR(255)
situation                                  INT
observation_client                         TEXT
observation_shop                           TEXT
vehicle_id                                 BIGINT
advertisement_id                           BIGINT
inspection_id                              BIGINT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `shop_id` → `shops(id)` · `shop_stock_id` → `shop_stocks(id)` · `vehicle_id` → `vehicles(id)` · `advertisement_id` → `advertisements(id)` · `inspection_id` → `inspection(id)`

**Referenciada por (1):** `review_negotiations.review_id`

**Índices:** `PRIMARY KEY: id` · `reviews_advertisement_id_foreign: (advertisement_id)` · `reviews_inspection_id_foreign: (inspection_id)` · `reviews_shop_id_foreign: (shop_id)` · `reviews_shop_stock_id_foreign: (shop_stock_id)` · `reviews_vehicle_id_foreign: (vehicle_id)`

---

## role_has_permissions

_Usuário, acesso e permissão_

Tabela padrão do Spatie/laravel-permission, associando permissões a perfis (roles).

```
permission_id                              BIGINT
role_id                                    BIGINT
```

**FK saindo:** `permission_id` → `permissions(id)` · `role_id` → `roles(id)`

**Índices:** `PRIMARY KEY: (permission_id, role_id)` · `role_has_permissions_role_id_foreign: (role_id)`

---

## roles

_Usuário, acesso e permissão_

Tabela padrão do Spatie/laravel-permission, armazena os perfis de usuário (ex: "Admin", "Lojista").

```
id                                         BIGINT
name                                       VARCHAR(255)
guard_name                                 VARCHAR(255)
description                                VARCHAR(255)
enable_relationship_shop_user              TINYINT(1)
status                                     TINYINT(1)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (2):** `model_has_roles.role_id`, `role_has_permissions.role_id`

**Índices:** `PRIMARY KEY: id` · `UNIQUE: (name, guard_name)`

---

## sale_networks

_Whitelabel / multi-tenant_

Catálogo de redes de vendas ou grupos de concessionárias.

```
id                                         BIGINT
name                                       VARCHAR(255)
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (1):** `shops.sale_networks_id`

**Índices:** `PRIMARY KEY: id`

---

## schedules

_CRM, marketing, conteúdo e comunicação_

Gerencia agendamentos de visitas ou retiradas de veículos.

```
id                                         BIGINT
shop_id                                    BIGINT
client_id                                  BIGINT
advertisement_id                           BIGINT
schedule_date                              DATE
schedule_hour                              TIME
situation                                  INT
type                                       VARCHAR(10)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
document                                   VARCHAR(255)*
```

**FK saindo:** `shop_id` → `shops(id)` · `client_id` → `users(id)` · `advertisement_id` → `advertisements(id)`

**Índices:** `PRIMARY KEY: id` · `schedules_advertisement_id_foreign: (advertisement_id)` · `schedules_client_id_foreign: (client_id)` · `schedules_shop_id_foreign: (shop_id)`

---

## shop_addresses

_Loja, parceiro e integração_

Armazena os endereços físicos das lojas.

```
id                                         BIGINT
shop_id                                    BIGINT
postal_code                                VARCHAR(255)
district                                   VARCHAR(255)
street                                     VARCHAR(255)
number                                     VARCHAR(255)
public_place                               VARCHAR(255)*
city                                       VARCHAR(255)
state                                      VARCHAR(255)
complement                                 VARCHAR(255)*
latitude                                   VARCHAR(255)
longitude                                  VARCHAR(255)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `shop_id` → `shops(id)`

**Índices:** `PRIMARY KEY: id` · `shop_addresses_shop_id_foreign: (shop_id)`

---

## shop_integrations

_Loja, parceiro e integração_

Associa uma loja a integrações de sistemas de terceiros.

```
id                                         BIGINT
shop_id                                    BIGINT
integration_id                             BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**FK saindo:** `shop_id` → `shops(id)` · `integration_id` → `integrations(id)`

**Índices:** `PRIMARY KEY: id` · `shop_integrations_integration_id_foreign: (integration_id)` · `shop_integrations_shop_id_foreign: (shop_id)`

---

## shop_stock_schedules

_Veículo, ficha técnica e estoque_

Define os horários de funcionamento e agendamento para um estoque específico.

```
id                                         BIGINT
stock_id                                   BIGINT
action                                     VARCHAR(255)
weekday                                    VARCHAR(255)
morning_period_start                       VARCHAR(255)
morning_period_end                         VARCHAR(255)
afternoon_period_start                     VARCHAR(255)*
afternoon_period_end                       VARCHAR(255)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `stock_id` → `shop_stocks(id)`

**Índices:** `PRIMARY KEY: id` · `shop_stock_schedules_stock_id_foreign: (stock_id)`

---

## shop_stocks

_Veículo, ficha técnica e estoque_

Gerencia os estoques de uma loja, que podem ser locais físicos diferentes.

```
id                                         BIGINT
shop_id                                    BIGINT
situation                                  INT
name                                       VARCHAR(255)
slug                                       VARCHAR(255)
whatsapp                                   VARCHAR(45)
comercial_phone                            VARCHAR(45)
privative_phone                            VARCHAR(45)
comercial_email                            VARCHAR(255)
privative_email                            VARCHAR(255)
interval_between_service                   INT
number_of_services_per_interval            INT
deadline_for_pickingup_vehicle             VARCHAR(255)*
garage_type                                VARCHAR(255)
enable_visit_scheduling                    TINYINT(1)
enable_pickup_schedule                     TINYINT(1)
postal_code                                VARCHAR(255)
district                                   VARCHAR(255)
street                                     VARCHAR(255)
number                                     VARCHAR(255)
public_place                               VARCHAR(255)
city                                       VARCHAR(255)
state                                      VARCHAR(255)
complement                                 VARCHAR(255)
latitude                                   VARCHAR(255)
longitude                                  VARCHAR(255)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `shop_id` → `shops(id)`

**Referenciada por (6):** `advertisements.shop_stock_id`, `inspection.shop_stock_id`, `reviews.shop_stock_id`, `shop_stock_schedules.stock_id`, `vehicles.shop_stock_id`, `whitelabel_leads.shop_stock_id`

**Índices:** `PRIMARY KEY: id` · `shop_stocks_shop_id_foreign: (shop_id)`

---

## shops

_Loja, parceiro e integração_

Armazena as informações das lojas (concessionárias), incluindo dados comerciais e de contato.

```
id                                         BIGINT
whitelabel_id                              BIGINT
situation                                  INT
sale_networks_id                           BIGINT
wallet_id                                  BIGINT
business_unit_id                           BIGINT
ad_origin_id                               BIGINT
key_account_id                             BIGINT
business_consultant_id                     BIGINT
name                                       VARCHAR(255)
slug                                       VARCHAR(255)
corporate_name                             VARCHAR(255)
cnpj                                       VARCHAR(25)
cnpj_file                                  VARCHAR(255)
logo_url                                   VARCHAR(255)
cnae                                       VARCHAR(255)
uri                                        VARCHAR(255)
whatsapp_number                            VARCHAR(20)
comercial_number                           VARCHAR(20)
privative_number                           VARCHAR(20)
comercial_email                            VARCHAR(255)
privative_email                            VARCHAR(255)
work_days_for_payment                      SMALLINT
expected_sales_percentage                  SMALLINT
extra_cost_for_inspection                  DOUBLE(8,2)
partner_cpf                                VARCHAR(45)
partner_name                               VARCHAR(255)
revenues                                   DOUBLE(16,2)
tax_form                                   VARCHAR(255)
fundation_date                             DATE
⚠️ 13 COLUNAS OCULTAS — o diagrama colapsou o resto da caixa; não estão documentadas aqui
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)` · `sale_networks_id` → `sale_networks(id)` · `wallet_id` → `wallets(id)` · `business_unit_id` → `business_units(id)` · `key_account_id` → `users(id)` · `business_consultant_id` → `users(id)`

**Referenciada por (22):** `access_logs.shop_id`, `accounts.shop_id`, `advertisements.shop_id`, `contents.shop_id`, `event_shops.shop_id`, `fee_applicabilities.shop_id`, `inspection.shop_id`, `offers.buyer_shop_id`, `offers.seller_shop_id`, `offers_automatics.shop_id`, `publishing_channels.shop_id`, `reviews.shop_id`, `schedules.shop_id`, `shop_addresses.shop_id`, `shop_integrations.shop_id`, `shop_stocks.shop_id`, `transactions.buyer_shop_id`, `transactions.seller_shop_id`, `type_inspection_items.shop_id`, `user_shops.shop_id`, `vehicles.shop_id`, `whitelabel_leads.shop_id`

**Índices:** `PRIMARY KEY: id` · `shops_business_consultant_id_foreign: (business_consultant_id)` · `shops_business_unit_id_foreign: (business_unit_id)` · `shops_id_deleted_idx: (id, deleted_at)` · `shops_key_account_id_foreign: (key_account_id)` · `shops_sale_networks_id_foreign: (sale_networks_id)` · `shops_wallet_id_foreign: (wallet_id)` · `shops_whitelabel_id_foreign: (whitelabel_id)`

---

## tag_applicabilities

_CRM, marketing, conteúdo e comunicação_

Define as regras de aplicação de tags, com base em atributos do veículo.

```
id                                         BIGINT
tag_id                                     BIGINT
brand_id                                   BIGINT
category_id                                BIGINT
model_id                                   BIGINT
version_id                                 BIGINT
entrance_origin_id                         BIGINT
bodywork_id                                BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `tag_id` → `tags(id)` · `brand_id` → `brands(id)` · `category_id` → `categories(id)` · `model_id` → `models(id)` · `version_id` → `versions(id)` · `entrance_origin_id` → `entrance_origins(id)` · `bodywork_id` → `bodyworks(id)`

**Índices:** `PRIMARY KEY: id` · `tag_applicabilities_bodywork_id_foreign: (bodywork_id)` · `tag_applicabilities_brand_id_foreign: (brand_id)` · `tag_applicabilities_category_id_foreign: (category_id)` · `tag_applicabilities_entrance_origin_id_foreign: (entrance_origin_id)` · `tag_applicabilities_model_id_foreign: (model_id)` · `tag_applicabilities_tag_id_foreign: (tag_id)` · `tag_applicabilities_version_id_foreign: (version_id)`

---

## tag_whitelabel

_CRM, marketing, conteúdo e comunicação_

Associa tags a um whitelabel específico.

```
id                                         BIGINT
whitelabel_id                              BIGINT
tag_id                                     BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)` · `tag_id` → `tags(id)`

**Índices:** `PRIMARY KEY: id` · `tag_whitelabel_tag_id_foreign: (tag_id)` · `tag_whitelabel_whitelabel_id_foreign: (whitelabel_id)`

---

## tags

_CRM, marketing, conteúdo e comunicação_

Catálogo de tags (selos) que podem ser aplicados a veículos (ex: "Destaque", "Oferta").

```
id                                         BIGINT
name                                       VARCHAR(255)
description                                TEXT
image_url                                  VARCHAR(255)*
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (3):** `tag_applicabilities.tag_id`, `tag_whitelabel.tag_id`, `vehicle_tags.tag_id`

**Índices:** `PRIMARY KEY: id`

---

## transactions

_Financeiro e logística_

Registra as transações financeiras concluídas, associando comprador, vendedor e taxas.

```
id                                         BIGINT
advertisement_id                           BIGINT
offer_id                                   BIGINT
seller_applicability_price                 DOUBLE(8,2)
seller_applicability_id                    BIGINT
seller_applicability_situation             TINYINT
seller_applicability_payment_file          VARCHAR(255)
seller_shop_id                             BIGINT
buyer_applicability_price                  DOUBLE(8,2)
buyer_applicability_id                     BIGINT
buyer_applicability_situation              TINYINT
buyer_applicability_payment_file           VARCHAR(255)
buyer_advertisement_situation              TINYINT
buyer_advertisement_payment_file           VARCHAR(255)
buyer_shop_id                              BIGINT
buyer_user_id                              BIGINT
situation                                  SMALLINT
observation                                TEXT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
canceled_at                                TIMESTAMP
cancellation_reason                        TEXT
additional_fee_amount                      DOUBLE(8,2)
additional_fee_description                 TEXT
discount_fee_amount                        DOUBLE(8,2)
discount_fee_description                   TEXT
discount_advertisement_amount              DOUBLE(8,2)
discount_advertisement_description         TEXT
```

**FK saindo:** `advertisement_id` → `advertisements(id)` · `offer_id` → `offers(id)` · `seller_applicability_id` → `fee_applicabilities(id)` · `seller_shop_id` → `shops(id)` · `buyer_applicability_id` → `fee_applicabilities(id)` · `buyer_shop_id` → `shops(id)` · `buyer_user_id` → `users(id)`

**Índices:** `PRIMARY KEY: id` · `idx_transactions_situation: (situation)` · `transactions_advertisement_id_foreign: (advertisement_id)` · `transactions_buyer_applicability_id_foreign: (buyer_applicability_id)` · `transactions_buyer_shop_id_foreign: (buyer_shop_id)` · `transactions_buyer_user_id_foreign: (buyer_user_id)` · `transactions_offer_id_foreign: (offer_id)` · `transactions_seller_applicability_id_foreign: (seller_applicability_id)` · `transactions_seller_shop_id_foreign: (seller_shop_id)`

---

## transport_contracts

_Financeiro e logística_

Armazena informações sobre contratos de transporte de veículos.

```
id                                         BIGINT
user_id                                    BIGINT
advertisement_id                           BIGINT
contract_id                                VARCHAR(255)
status_payment                             TINYINT
status_carriage                            TINYINT
gathering_date                             DATETIME
delivery_date                              DATETIME
tracking_url                               VARCHAR(255)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)` · `advertisement_id` → `advertisements(id)`

**Índices:** `PRIMARY KEY: id` · `transport_contracts_advertisement_id_foreign: (advertisement_id)` · `transport_contracts_user_id_foreign: (user_id)`

---

## type_inspection_items

_Vistoria / inspeção_

Associa itens de inspeção a um tipo de inspeção.

```
id                                         BIGINT
type_inspection_id                         BIGINT
category_id                                BIGINT
shop_id                                    BIGINT
item_inspection_id                         BIGINT
position                                   INT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `type_inspection_id` → `type_inspections(id)` · `category_id` → `categories(id)` · `shop_id` → `shops(id)` · `item_inspection_id` → `item_inspections(id)`

**Índices:** `PRIMARY KEY: id` · `type_inspection_items_category_id_foreign: (category_id)` · `type_inspection_items_item_inspection_id_foreign: (item_inspection_id)` · `type_inspection_items_shop_id_foreign: (shop_id)` · `type_inspection_items_type_inspection_id_foreign: (type_inspection_id)`

---

## type_inspections

_Vistoria / inspeção_

Catálogo de tipos de inspeção (ex: "Cautelar", "Checklist Básico").

```
id                                         BIGINT
name                                       VARCHAR(255)
description                                TEXT
status                                     TINYINT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (1):** `type_inspection_items.type_inspection_id`

**Índices:** `PRIMARY KEY: id`

---

## user_access

_Usuário, acesso e permissão_

Registra o timestamp de cada acesso de um usuário, provavelmente para controle de "último login".

```
id                                         BIGINT
user_id                                    BIGINT
created_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)`

**Índices:** `PRIMARY KEY: id` · `user_access_created_at_index: (created_at)` · `user_access_user_id_foreign: (user_id)`

---

## user_addresses

_Usuário, acesso e permissão_

Armazena os endereços dos usuários.

```
id                                         BIGINT
user_id                                    BIGINT
postal_code                                VARCHAR(255)
district                                   VARCHAR(255)
street                                     VARCHAR(255)
number                                     VARCHAR(255)
city                                       VARCHAR(255)
state                                      VARCHAR(255)
complement                                 VARCHAR(255)*
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)`

**Índices:** `PRIMARY KEY: id` · `user_addresses_user_id_foreign: (user_id)`

---

## user_advertisement_favorites

_Usuário, acesso e permissão_

Armazena os anúncios que um usuário marcou como favoritos.

```
id                                         BIGINT
user_id                                    BIGINT
advertisement_id                           BIGINT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)` · `advertisement_id` → `advertisements(id)`

**Índices:** `PRIMARY KEY: id` · `user_advertisement_favorites_advertisement_id_foreign: (advertisement_id)` · `user_advertisement_favorites_user_id_foreign: (user_id)`

---

## user_advertisement_financings

_Usuário, acesso e permissão_

Registra as solicitações de financiamento feitas por um usuário para um anúncio.

```
id                                         BIGINT
user_id                                    BIGINT
advertisement_id                           BIGINT
financing_value                            DECIMAL(15,2)
created_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)` · `advertisement_id` → `advertisements(id)`

**Índices:** `PRIMARY KEY: id` · `user_advertisement_financings_advertisement_id_foreign: (advertisement_id)` · `user_advertisement_financings_user_id_foreign: (user_id)`

---

## user_alerts

_Usuário, acesso e permissão_

Gerencia os alertas criados pelos usuários para serem notificados sobre novos anúncios.

```
id                                         BIGINT
user_id                                    BIGINT
model_id                                   BIGINT
version_id                                 BIGINT
brand_id                                   BIGINT
year_min                                   INT
year_max                                   INT
price_min                                  DECIMAL(10,2)
price_max                                  DECIMAL(10,2)
km_min                                     INT
km_max                                     INT
notify_immediately                         TINYINT(1)
notify_daily                               TINYINT(1)
active                                     TINYINT(1)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)` · `model_id` → `models(id)` · `version_id` → `versions(id)` · `brand_id` → `brands(id)`

**Índices:** `PRIMARY KEY: id` · `user_alerts_brand_id_foreign: (brand_id)` · `user_alerts_model_id_foreign: (model_id)` · `user_alerts_user_id_foreign: (user_id)` · `user_alerts_version_id_foreign: (version_id)`

---

## user_clients_group

_Usuário, acesso e permissão_

Associa um usuário a um ou mais grupos de clientes.

```
id                                         BIGINT
user_id                                    BIGINT
client_group_id                            BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)` · `client_group_id` → `client_groups(id)`

**Índices:** `PRIMARY KEY: id` · `idx_ucg_client_user: (client_group_id, user_id)` · `user_clients_group_user_id_foreign: (user_id)`

---

## user_communications

_Usuário, acesso e permissão_

Gerencia as preferências de comunicação de um usuário (aceite de emails, SMS, etc).

```
id                                         BIGINT
user_id                                    BIGINT
accept_sms_advertising                     TINYINT(1)
accept_email_advertising                   TINYINT(1)
accept_whatsapp_advertising                TINYINT(1)
accept_icarros_advertising                 TINYINT(1)
accept_sms_notification                    TINYINT(1)
accept_email_notification                  TINYINT(1)
accept_push_notification                   TINYINT(1)
accept_transactional_email                 TINYINT(1)
accept_privacy_terms                       TINYINT(1)
accept_privacy_policy                      TINYINT(1)
origin_channel                             VARCHAR(255)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)`

**Índices:** `PRIMARY KEY: id` · `user_communications_user_id_foreign: (user_id)`

---

## user_favorites

_Usuário, acesso e permissão_

Tabela para armazenar anúncios favoritados por usuários.

```
id                                         BIGINT
user_id                                    BIGINT
advertisement_id                           BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
deleted_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)` · `advertisement_id` → `advertisements(id)`

**Índices:** `PRIMARY KEY: id` · `user_favorites_advertisement_id_foreign: (advertisement_id)` · `user_favorites_user_id_foreign: (user_id)`

---

## user_profiles

_Usuário, acesso e permissão_

Armazena informações adicionais do perfil do usuário, como telefone e documento.

```
id                                         BIGINT
user_id                                    BIGINT
wallet_id                                  BIGINT
business_unit_id                           BIGINT
phone                                      VARCHAR(255)
document                                   VARCHAR(255)
document_file_url                          VARCHAR(255)
how_you_meet                               VARCHAR(255)
register_form                              VARCHAR(255)
register_form_value                        VARCHAR(255)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
benefit_club_id                            INT
benefit_club_document                      VARCHAR(255)*
```

**FK saindo:** `user_id` → `users(id)` · `wallet_id` → `wallets(id)` · `business_unit_id` → `business_units(id)`

**Índices:** `PRIMARY KEY: id` · `user_profiles_business_unit_id_foreign: (business_unit_id)` · `user_profiles_user_id_foreign: (user_id)` · `user_profiles_wallet_id_foreign: (wallet_id)`

---

## user_shops

_Usuário, acesso e permissão_

Associa um usuário a uma ou mais lojas, definindo seu vínculo de trabalho.

```
id                                         BIGINT
user_id                                    BIGINT
shop_id                                    BIGINT
function                                   MEDIUMINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)` · `shop_id` → `shops(id)`

**Índices:** `PRIMARY KEY: id` · `idx_us_user_shop: (user_id, shop_id)` · `user_shops_shop_id_foreign: (shop_id)`

---

## user_whitelabels

_Usuário, acesso e permissão_

Associa um usuário a um ou mais whitelabels.

```
id                                         BIGINT
user_id                                    BIGINT
whitelabel_id                              BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `user_id` → `users(id)` · `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `idx_uw_whitelabel_user: (whitelabel_id, user_id)` · `user_whitelabels_user_id_foreign: (user_id)`

---

## users

_Usuário, acesso e permissão_

Tabela central de usuários, com informações de login, status e identificação.

```
id                                         BIGINT
uuid                                       CHAR(36)
full_name                                  VARCHAR(255)
email                                      VARCHAR(255)
email_verified_at                          TIMESTAMP
password                                   VARCHAR(255)
pin_code                                   VARCHAR(255)
situation                                  VARCHAR(20)
whitelabel_origin_id                       BIGINT
code                                       VARCHAR(255)
check_first_login_password                 TINYINT(1)
internal_user                              TINYINT(1)
remember_token                             VARCHAR(100)
observation                                TEXT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_origin_id` → `whitelabels(id)`

**Referenciada por (30):** `access_logs.user_id`, `campaign_links.business_consultant_id`, `campaign_links.key_account_id`, `chat_messages.sender_id`, `chat_participants.user_id`, `inspection.user_id`, `notifications.user_id`, `offers.buyer_user_id`, `offers.internal_user_id`, `offers.seller_user_id`, `offers_automatics.user_id`, `password_reset_tokens.user_id`, `preferences.user_id`, `reports.user_id`, `schedules.client_id`, `shops.business_consultant_id`, `shops.key_account_id`, `transactions.buyer_user_id`, `transport_contracts.user_id`, `user_access.user_id`, `user_addresses.user_id`, `user_advertisement_favorites.user_id`, `user_advertisement_financings.user_id`, `user_alerts.user_id`, `user_clients_group.user_id`, `user_communications.user_id`, `user_favorites.user_id`, `user_profiles.user_id`, `user_shops.user_id`, `user_whitelabels.user_id`

**Índices:** `PRIMARY KEY: id` · `UNIQUE: uuid` · `users_whitelabel_origin_id_foreign: (whitelabel_origin_id)`

---

## users_restriction_actives

_Usuário, acesso e permissão_

Gerencia restrições ativas aplicadas a usuários.

```
id                                         BIGINT
whitelabel_id                              INT
restriction_base                           INT
client_group_id                            INT
user_id                                    INT
responsible_user_id                        INT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Índices:** `PRIMARY KEY: id`

---

## users_restriction_job

_Usuário, acesso e permissão_

Controla o status de jobs relacionados à aplicação de restrições em usuários.

```
id                                         BIGINT
total_jobs                                 INT
processed_jobs                             INT
finished                                   TINYINT(1)
failed                                     TINYINT(1)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Índices:** `PRIMARY KEY: id`

---

## variables

_Relatórios, importação e infraestrutura_

Catálogo de variáveis dinâmicas para uso em conteúdos.

```
id                                         BIGINT
name                                       VARCHAR(255)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (1):** `contents_variables.variable_id`

**Índices:** `PRIMARY KEY: id` · `UNIQUE: name`

---

## vehicle_accessories

_Veículo, ficha técnica e estoque_

Associa um veículo aos seus acessórios.

```
id                                         BIGINT
vehicle_id                                 BIGINT
accessory_id                               BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `vehicle_id` → `vehicles(id)` · `accessory_id` → `accessories(id)`

**Índices:** `PRIMARY KEY: id` · `vehicle_accessories_accessory_id_foreign: (accessory_id)` · `vehicle_accessories_vehicle_id_foreign: (vehicle_id)`

---

## vehicle_advertisements

_Veículo, ficha técnica e estoque_

Associa um veículo a um ou mais anúncios.

```
id                                         BIGINT
vehicle_id                                 BIGINT
advertisement_id                           BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `vehicle_id` → `vehicles(id)` · `advertisement_id` → `advertisements(id)`

**Índices:** `PRIMARY KEY: id` · `vehicle_advertisements_advertisement_id_foreign: (advertisement_id)` · `vehicle_advertisements_vehicle_id_foreign: (vehicle_id)`

---

## vehicle_characteristics

_Veículo, ficha técnica e estoque_

Associa um veículo às suas características.

```
id                                         BIGINT
vehicle_id                                 BIGINT
characteristic_id                          BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `vehicle_id` → `vehicles(id)` · `characteristic_id` → `characteristics(id)`

**Índices:** `PRIMARY KEY: id` · `vehicle_characteristics_characteristic_id_foreign: (characteristic_id)` · `vehicle_characteristics_vehicle_id_foreign: (vehicle_id)`

---

## vehicle_data_cache

_Veículo, ficha técnica e estoque_

Armazena em cache os dados de veículos consultados por placa ou chassi para otimizar consultas.

```
id                                         BIGINT
identifier                                 VARCHAR(255)
type                                       ENUM(...)
results                                    JSON
versions_count                             INT
cache_month                                DATE
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Índices:** `PRIMARY KEY: id` · `UNIQUE: (identifier, type, cache_month)` · `vehicle_data_cache_cache_month_index: (cache_month)` · `vehicle_data_cache_identifier_index: (identifier)` · `vehicle_data_cache_type_index: (type)`

---

## vehicle_extra_fields

_Veículo, ficha técnica e estoque_

Armazena campos e informações adicionais de um veículo que não estão na tabela principal.

```
id                                         BIGINT
vehicle_id                                 BIGINT
entrance_origin_id                         BIGINT
market_price                               DOUBLE(20,2)
repair_price                               DOUBLE(8,2)
axle_qtd                                   INT
engine_original_number                     VARCHAR(255)
engine_actual_number                       VARCHAR(255)
power                                      VARCHAR(255)
cylinder_capacity                          VARCHAR(255)
renavam                                    VARCHAR(50)
plate_state                                VARCHAR(150)
plate_city                                 VARCHAR(150)
contract_number                            VARCHAR(150)
last_owner_name                            VARCHAR(255)
last_owner_document                        VARCHAR(255)
last_owner_document_type                   VARCHAR(255)*
quote                                      TINYINT(1)
armored                                    TINYINT(1)
imported                                   TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
reason                                     TEXT
```

**FK saindo:** `vehicle_id` → `vehicles(id)` · `entrance_origin_id` → `entrance_origins(id)`

**Índices:** `PRIMARY KEY: id` · `vehicle_extra_fields_entrance_origin_id_foreign: (entrance_origin_id)` · `vehicle_extra_fields_vehicle_id_foreign: (vehicle_id)`

---

## vehicle_image_galleries

_Veículo, ficha técnica e estoque_

Armazena a galeria de imagens de um veículo.

```
id                                         BIGINT
ordering                                   INT
vehicle_id                                 BIGINT
name                                       VARCHAR(255)
description                                TEXT
image_url                                  VARCHAR(255)
thumb_url                                  VARCHAR(255)
visible                                    TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `vehicle_id` → `vehicles(id)`

**Índices:** `PRIMARY KEY: id` · `vehicle_image_galleries_vehicle_id_foreign: (vehicle_id)`

---

## vehicle_precautionary_reports

_Veículo, ficha técnica e estoque_

Armazena os laudos cautelares associados a um veículo.

```
id                                         BIGINT
vehicle_id                                 BIGINT
situation                                  VARCHAR(255)
file_url                                   VARCHAR(255)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `vehicle_id` → `vehicles(id)`

**Índices:** `PRIMARY KEY: id` · `vehicle_precautionary_reports_vehicle_id_foreign: (vehicle_id)`

---

## vehicle_tags

_Veículo, ficha técnica e estoque_

Associa um veículo a tags (selos).

```
id                                         BIGINT
vehicle_id                                 BIGINT
tag_id                                     BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `vehicle_id` → `vehicles(id)` · `tag_id` → `tags(id)`

**Índices:** `PRIMARY KEY: id` · `vehicle_tags_tag_id_foreign: (tag_id)` · `vehicle_tags_vehicle_id_foreign: (vehicle_id)`

---

## vehicle_video_galleries

_Veículo, ficha técnica e estoque_

Armazena os vídeos de um veículo.

```
id                                         BIGINT
vehicle_id                                 BIGINT
video_url                                  VARCHAR(255)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `vehicle_id` → `vehicles(id)`

**Índices:** `PRIMARY KEY: id` · `vehicle_video_galleries_vehicle_id_foreign: (vehicle_id)`

---

## vehicles

_Veículo, ficha técnica e estoque_

Contém os detalhes técnicos e específicos de cada veículo cadastrado na plataforma.

```
id                                         BIGINT
shop_id                                    BIGINT
shop_stock_id                              BIGINT
category_id                                BIGINT
brand_id                                   BIGINT
model_id                                   BIGINT
version_id                                 BIGINT
bodywork_id                                BIGINT
color_id                                   BIGINT
drive_shift_id                             BIGINT
cluster_id                                 BIGINT
fuel_id                                    BIGINT
situation                                  INT
plate                                      VARCHAR(50)
chassi                                     VARCHAR(255)
manufacture_year                           INT
model_year                                 INT
km                                         INT
ports_qtd                                  INT
fipe_price                                 DOUBLE(20,2)
fipe_quantity_version                      INT
molicar_price                              DOUBLE(20,2)
retail_value                               DOUBLE(20,2)
description                                TEXT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `shop_id` → `shops(id)` · `shop_stock_id` → `shop_stocks(id)` · `category_id` → `categories(id)` · `brand_id` → `brands(id)` · `model_id` → `models(id)` · `version_id` → `versions(id)` · `bodywork_id` → `bodyworks(id)` · `color_id` → `colors(id)` · `drive_shift_id` → `driver_shifts(id)` · `cluster_id` → `clusters(id)` · `fuel_id` → `fuels(id)`

**Referenciada por (10):** `advertisements.vehicle_id`, `reviews.vehicle_id`, `vehicle_accessories.vehicle_id`, `vehicle_advertisements.vehicle_id`, `vehicle_characteristics.vehicle_id`, `vehicle_extra_fields.vehicle_id`, `vehicle_image_galleries.vehicle_id`, `vehicle_precautionary_reports.vehicle_id`, `vehicle_tags.vehicle_id`, `vehicle_video_galleries.vehicle_id`

**Índices:** `PRIMARY KEY: id` · `idx_vehicle_created_at: (created_at)` · `idx_vehicles_situation: (situation)` · `vehicles_bodywork_id_foreign: (bodywork_id)` · `vehicles_brand_id_foreign: (brand_id)` · `vehicles_category_id_foreign: (category_id)` · `vehicles_cluster_id_foreign: (cluster_id)` · `vehicles_color_id_foreign: (color_id)` · `vehicles_drive_shift_id_foreign: (drive_shift_id)` · `vehicles_fuel_id_foreign: (fuel_id)` · `vehicles_model_id_foreign: (model_id)` · `vehicles_shop_id_foreign: (shop_id)` · `vehicles_shop_stock_id_foreign: (shop_stock_id)` · `vehicles_version_id_foreign: (version_id)`

---

## versions

_Veículo, ficha técnica e estoque_

Catálogo de versões específicas de um modelo de veículo (ex: "Onix 1.0 Turbo LTZ").

```
id                                         BIGINT
bodywork_id                                BIGINT
category_id                                BIGINT
brand_id                                   BIGINT
model_id                                   BIGINT
name                                       VARCHAR(255)
year                                       YEAR
status                                     TINYINT(1)
approved                                   TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
created_by                                 BIGINT
code_fipe                                  VARCHAR(255)
code_molicar                               VARCHAR(255)*
```

**FK saindo:** `bodywork_id` → `bodyworks(id)` · `category_id` → `categories(id)` · `brand_id` → `brands(id)` · `model_id` → `models(id)`

**Referenciada por (4):** `inspection.version_id`, `tag_applicabilities.version_id`, `user_alerts.version_id`, `vehicles.version_id`

**Índices:** `PRIMARY KEY: id` · `versions_bodywork_id_foreign: (bodywork_id)` · `versions_brand_id_foreign: (brand_id)` · `versions_category_id_foreign: (category_id)` · `versions_model_id_foreign: (model_id)`

---

## wallets

_Financeiro e logística_

Define "carteiras" ou grupos de lojas, possivelmente para fins organizacionais ou comerciais.

```
id                                         BIGINT
name                                       VARCHAR(255)
description                                TEXT
status                                     TINYINT(1)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Referenciada por (3):** `shops.wallet_id`, `user_profiles.wallet_id`, `whitelabel_wallet.wallet_id`

**Índices:** `PRIMARY KEY: id`

---

## websockets_statistics_entries

_Relatórios, importação e infraestrutura_

Registra estatísticas de uso do servidor de WebSocket.

```
id                                         INT
app_id                                     VARCHAR(255)
peak_connection_count                      INT
websocket_message_count                    INT
api_message_count                          INT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**Índices:** `PRIMARY KEY: id`

---

## whitelabel_addresses

_Whitelabel / multi-tenant_

Armazena os endereços associados a um whitelabel.

```
id                                         BIGINT
whitelabel_id                              BIGINT
postal_code                                VARCHAR(255)
district                                   VARCHAR(255)
street                                     VARCHAR(255)
number                                     SMALLINT
city                                       VARCHAR(255)
state                                      VARCHAR(255)
complement                                 VARCHAR(255)
latitude                                   VARCHAR(255)
longitude                                  VARCHAR(255)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `whitelabel_addresses_whitelabel_id_foreign: (whitelabel_id)`

---

## whitelabel_business_unit

_Whitelabel / multi-tenant_

Associa um whitelabel a unidades de negócio.

```
id                                         BIGINT
whitelabel_id                              BIGINT
business_unit_id                           BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)` · `business_unit_id` → `business_units(id)`

**Índices:** `PRIMARY KEY: id` · `whitelabel_business_unit_business_unit_id_foreign: (business_unit_id)` · `whitelabel_business_unit_whitelabel_id_foreign: (whitelabel_id)`

---

## whitelabel_client_groups

_Whitelabel / multi-tenant_

Associa um whitelabel a grupos de clientes.

```
id                                         BIGINT
whitelabel_id                              BIGINT
client_group_id                            BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)` · `client_group_id` → `client_groups(id)`

**Índices:** `PRIMARY KEY: id` · `whitelabel_client_groups_client_group_id_foreign: (client_group_id)` · `whitelabel_client_groups_whitelabel_id_foreign: (whitelabel_id)`

---

## whitelabel_email_configurations

_Whitelabel / multi-tenant_

Armazena as configurações de envio de email específicas para cada whitelabel.

```
id                                         BIGINT
whitelabel_id                              BIGINT
cfg_email_driver                           VARCHAR(255)
cfg_email_host                             VARCHAR(255)
cfg_email_port                             VARCHAR(255)
cfg_email_username                         VARCHAR(255)
cfg_email_password                         VARCHAR(255)
cfg_email_encrypt                          VARCHAR(255)
cfg_email_ses_key                          VARCHAR(255)
cfg_email_ses_secret                       VARCHAR(255)
cfg_email_ses_region                       VARCHAR(255)
cfg_email_from_email                       VARCHAR(255)
cfg_email_from_name                        VARCHAR(255)
cfg_email_reply_to                         VARCHAR(255)
cfg_email_reply_text                       VARCHAR(255)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `whitelabel_email_configurations_whitelabel_id_foreign: (whitelabel_id)`

---

## whitelabel_financing_options

_Whitelabel / multi-tenant_

Configura as opções de financiamento para um whitelabel.

```
id                                         BIGINT
whitelabel_id                              BIGINT
enable_lead_ad_page                        TINYINT(1)
enable_lead_winner                         TINYINT(1)
recipient                                  VARCHAR(255)
recipient_winning_financing_email          VARCHAR(255)
financing_request_message                  TEXT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `whitelabel_financing_options_whitelabel_id_foreign: (whitelabel_id)`

---

## whitelabel_footer_links

_Whitelabel / multi-tenant_

Gerencia os links exibidos no rodapé de um whitelabel.

```
id                                         BIGINT
whitelabel_id                              BIGINT
label                                      VARCHAR(255)
url                                        VARCHAR(255)
active                                     TINYINT(1)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `whitelabel_footer_links_whitelabel_id_foreign: (whitelabel_id)`

---

## whitelabel_images

_Whitelabel / multi-tenant_

Armazena as imagens de personalização de um whitelabel (logos, favicon, etc).

```
id                                         BIGINT
whitelabel_id                              BIGINT
logo                                       VARCHAR(255)
footer_logo                                VARCHAR(255)
favicon                                    VARCHAR(255)
image_mail_one                             VARCHAR(255)
image_mail_two                             VARCHAR(255)
image_mail_three                           VARCHAR(255)
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `whitelabel_images_whitelabel_id_foreign: (whitelabel_id)`

---

## whitelabel_leads

_Whitelabel / multi-tenant_

Configura as opções de captura de leads para um whitelabel.

```
id                                         BIGINT
whitelabel_id                              BIGINT
enable_wanna_sell                          TINYINT(1)*
enable_C2B                                 TINYINT
menu_text                                  VARCHAR(255)
shop_id                                    BIGINT
shop_stock_id                              BIGINT
deleted_at                                 TIMESTAMP
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)` · `shop_id` → `shops(id)` · `shop_stock_id` → `shop_stocks(id)`

**Índices:** `PRIMARY KEY: id` · `whitelabel_leads_shop_id_foreign: (shop_id)` · `whitelabel_leads_shop_stock_id_foreign: (shop_stock_id)` · `whitelabel_leads_whitelabel_id_foreign: (whitelabel_id)`

---

## whitelabel_permissions

_Whitelabel / multi-tenant_

Controla as permissões e funcionalidades ativas para cada whitelabel.

```
id                                         BIGINT
whitelabel_id                              BIGINT
enable_privacy                             TINYINT(1)
enable_partner_cpf                         TINYINT(1)
enable_partner_name                        TINYINT(1)
enable_partner_cpf_required                TINYINT(1)
enable_partner_name_required               TINYINT(1)
enable_invoicing                           TINYINT(1)
enable_cnae                                TINYINT(1)
enable_form_tax                            TINYINT(1)
enable_fundation_date                      TINYINT(1)
enable_cnae_required                       TINYINT(1)
enable_invoicing_required                  TINYINT(1)
enable_form_tax_required                   TINYINT(1)
enable_fundation_required                  TINYINT(1)
enable_public_place                        TINYINT(1)
enable_fipe_market_value                   TINYINT(1)
enable_receiving_advertising_login         TINYINT(1)
enable_social_login                        TINYINT(1)
enable_float_contact_button                TINYINT(1)
enable_fipe                                TINYINT(1)
enable_consult_transport                   TINYINT(1)
enable_home_mark                           TINYINT(1)
enable_home_category                       TINYINT(1)
enable_how_know                            TINYINT(1)
enable_news                                TINYINT(1)
enable_pf                                  TINYINT(1)
enable_pj                                  TINYINT(1)
enable_benefit_club                        TINYINT(1)
enable_sms_validation                      TINYINT(1)
⚠️ 20 COLUNAS OCULTAS — o diagrama colapsou o resto da caixa; não estão documentadas aqui
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `whitelabel_permissions_whitelabel_id_foreign: (whitelabel_id)`

---

## whitelabel_restriction_users

_Whitelabel / multi-tenant_

Define as regras de restrição de usuários para um whitelabel.

```
id                                         BIGINT
whitelabel_id                              BIGINT
restriction_base                           INT
client_group_id                            BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)` · `client_group_id` → `client_groups(id)`

**Índices:** `PRIMARY KEY: id` · `whitelabel_restriction_users_client_group_id_foreign: (client_group_id)` · `whitelabel_restriction_users_whitelabel_id_foreign: (whitelabel_id)`

---

## whitelabel_themes

_Whitelabel / multi-tenant_

Armazena as configurações de tema e aparência para cada whitelabel.

```
id                                         BIGINT
whitelabel_id                              BIGINT
name                                       VARCHAR(255)
value                                      VARCHAR(255)
type                                       VARCHAR(255)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)`

**Índices:** `PRIMARY KEY: id` · `whitelabel_themes_whitelabel_id_foreign: (whitelabel_id)`

---

## whitelabel_wallet

_Whitelabel / multi-tenant_

Associa um whitelabel a uma carteira de lojas.

```
id                                         BIGINT
whitelabel_id                              BIGINT
wallet_id                                  BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

**FK saindo:** `whitelabel_id` → `whitelabels(id)` · `wallet_id` → `wallets(id)`

**Índices:** `PRIMARY KEY: id` · `whitelabel_wallet_wallet_id_foreign: (wallet_id)` · `whitelabel_wallet_whitelabel_id_foreign: (whitelabel_id)`

---

## whitelabels

_Whitelabel / multi-tenant_

Tabela principal que define cada instância "whitelabel" da plataforma, com suas próprias URLs, nomes e configurações.

```
id                                         BIGINT
uuid                                       CHAR(36)
script_head                                TEXT
script_body                                TEXT
name                                       VARCHAR(255)
slug                                       VARCHAR(255)
url                                        VARCHAR(255)
configurated_url                           VARCHAR(255)
status                                     TINYINT
description                                TEXT
content_regulation_id                      BIGINT
privacy_terms_id                           BIGINT
privacy_policy_id                          BIGINT
public_email                               VARCHAR(255)
facebook                                   VARCHAR(255)
twitter                                    VARCHAR(255)
instagram                                  VARCHAR(255)
google_analytics                           VARCHAR(255)
authorized_domains                         VARCHAR(255)
email_blocked_words                        VARCHAR(255)
register_content_text                      VARCHAR(1000)
pld_value_notification                     VARCHAR(255)
pld_value_email_notification               VARCHAR(255)
bid_limit_per_user                         VARCHAR(255)
month_bid_limit_per_user                   VARCHAR(255)
email_lead_funding                         VARCHAR(255)
email_lead_funding_offer                   VARCHAR(255)
message_request_funding_offer              VARCHAR(255)*
validate_sms_code                          VARCHAR(255)
limit_max_ad_value                         VARCHAR(255)
⚠️ 11 COLUNAS OCULTAS — o diagrama colapsou o resto da caixa; não estão documentadas aqui
```

**FK saindo:** `content_regulation_id` → `contents(id)` · `privacy_terms_id` → `contents(id)` · `privacy_policy_id` → `contents(id)` · `client_group_id` → `client_groups(id)`

**Referenciada por (29):** `access_logs.whitelabel_id`, `advertisement_negotiation_whitelabels.whitelabel_id`, `benefit_clubs.whitelabel_id`, `contacts.whitelabel_id`, `content_components.whitelabel_id`, `content_whitelabel.whitelabel_id`, `event_whitelabels.whitelabel_id`, `fee_applicabilities.whitelabel_id`, `leads.whitelabel_id`, `notifications.whitelabel_id`, `password_reset_tokens.whitelabel_id`, `publishing_channel_whitelabels.whitelabel_id`, `registration_logs.whitelabel_id`, `shops.whitelabel_id`, `tag_whitelabel.whitelabel_id`, `user_whitelabels.whitelabel_id`, `users.whitelabel_origin_id`, `whitelabel_addresses.whitelabel_id`, `whitelabel_business_unit.whitelabel_id`, `whitelabel_client_groups.whitelabel_id`, `whitelabel_email_configurations.whitelabel_id`, `whitelabel_financing_options.whitelabel_id`, `whitelabel_footer_links.whitelabel_id`, `whitelabel_images.whitelabel_id`, `whitelabel_leads.whitelabel_id`, `whitelabel_permissions.whitelabel_id`, `whitelabel_restriction_users.whitelabel_id`, `whitelabel_themes.whitelabel_id`, `whitelabel_wallet.whitelabel_id`

**Índices:** `PRIMARY KEY: id` · `UNIQUE: uuid, name, slug, url` · `whitelabels_client_group_id_foreign: (client_group_id)` · `whitelabels_content_regulation_id_foreign: (content_regulation_id)` · `whitelabels_privacy_policy_id_foreign: (privacy_policy_id)` · `whitelabels_privacy_terms_id_foreign: (privacy_terms_id)`

---

## oauth_access_toke

> ⚠️ Presente apenas no `Diagrama_cars.pdf`; sem descrição, FKs ou índices no `.txt`.
> Nome pode estar truncado pelo diagrama.

```
id                                         VARCHAR(100)
user_id                                    BIGINT
client_id                                  BIGINT
name                                       VARCHAR(255)
scopes                                     TEXT
revoked                                    TINYINT(1)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
expires_at                                 DATETIME
```

---

## oauth_auth_cod

> ⚠️ Presente apenas no `Diagrama_cars.pdf`; sem descrição, FKs ou índices no `.txt`.
> Nome pode estar truncado pelo diagrama.

```
id                                         VARCHAR(100)
user_id                                    BIGINT
client_id                                  BIGINT
scopes                                     TEXT
revoked                                    TINYINT(1)
expires_at                                 DATETIME
```

---

## oauth_clients

> ⚠️ Presente apenas no `Diagrama_cars.pdf`; sem descrição, FKs ou índices no `.txt`.
> Nome pode estar truncado pelo diagrama.

```
id                                         BIGINT
user_id                                    BIGINT
name                                       VARCHAR(255)
secret                                     VARCHAR(100)
provider                                   VARCHAR(255)
redirect                                   TEXT
personal_access_client                     TINYINT(1)
password_client                            TINYINT(1)
revoked                                    TINYINT(1)
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

---

## oauth_personal_access_clie

> ⚠️ Presente apenas no `Diagrama_cars.pdf`; sem descrição, FKs ou índices no `.txt`.
> Nome pode estar truncado pelo diagrama.

```
id                                         BIGINT
client_id                                  BIGINT
created_at                                 TIMESTAMP
updated_at                                 TIMESTAMP
```

---

## oauth_refresh_toke

> ⚠️ Presente apenas no `Diagrama_cars.pdf`; sem descrição, FKs ou índices no `.txt`.
> Nome pode estar truncado pelo diagrama.

```
id                                         VARCHAR(100)
access_token_id                            VARCHAR(100)
revoked                                    TINYINT(1)
expires_at                                 DATETIME
```

---

