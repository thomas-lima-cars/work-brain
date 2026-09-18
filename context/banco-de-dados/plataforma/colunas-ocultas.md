# As colunas que o diagrama escondeu

> ✅ **Ressalva 2 do [`README.md`](README.md) fechada em 2026-09-18.**
>
> As 4 tabelas cujas colunas o diagrama colapsou num rótulo "N more..." foram
> lidas direto no banco da **Cars2You** (`cars2you_production`), pela conexão em
> [`automations/bancos/`](../../automations/bancos/). Não é mais pista: é o
> esquema desta base.
>
> ⚠️ **Duas correções de rota, no mesmo dia.** A primeira versão deste arquivo
> leu as colunas na Dealers e mandava tratar como aproximação, porque eu afirmei
> que a Dealers era um superconjunto com versão mais nova. **Não é.** Comparados
> ao vivo: 193 tabelas cada, 192 em comum, e das 192 **apenas `notifications`
> tem colunas diferentes** (`resent_by_id` e `resent_from_id`, só na Cars2You).
> 2.075 colunas contra 2.074.
>
> 🔴 **Pendência que continua:** o `schema.md` documenta **149 de 193 tabelas**.
> As 44 que faltam nunca foram importadas. Isso é outra coisa, não esta.


## whitelabel_permissions

No `schema.md`: **30** · no banco: **69** · faltavam: **39** (a ressalva 2 estimava 20)

```
enable_home_advertisers                        tinyint(1)  NOT NULL
enable_home_highlights_of_the_day              tinyint(1)  NOT NULL
enable_approved_automatic                      tinyint(1)  NOT NULL
enable_send_docs                               tinyint(1)  NOT NULL
enable_send_docs_pj                            tinyint(1)  NOT NULL
enable_resend_email_pin                        tinyint(1)  NOT NULL
enable_auto_approved_register                  tinyint(1)  NOT NULL
enable_approve_register_cnae_partner           tinyint(1)  NOT NULL
approved_cnaes_list                            json
enable_confirmation_majority                   tinyint(1)  NOT NULL
enable_address_pf                              tinyint(1)  NOT NULL
enable_documents                               tinyint(1)  NOT NULL
enable_purchase_preference                     tinyint(1)  NOT NULL
enable_visit_document_required                 tinyint(1)  NOT NULL
enable_regulation_acceptance                   tinyint(1)  NOT NULL
enable_vozis_approved_registration             tinyint(1)  NOT NULL
vozis_approved_registration_campaign_id        varchar(255)
enable_full_customer_data_received_schedules   tinyint(1)  NOT NULL
enable_what_is_your_profile                    tinyint(1)  NOT NULL
login_security_type                            enum('none','location','device')  NOT NULL
e2e_support_enabled                            tinyint(1)  NOT NULL
e2e_support_secret_hash                        varchar(255)
e2e_support_regenerated_at                     timestamp
e2e_support_regenerated_by_user_id             bigint unsigned
deleted_at                                     timestamp
created_at                                     timestamp
updated_at                                     timestamp
enable_float_button_whatsapp                   tinyint(1)  NOT NULL
enable_footer_links                            tinyint(1)  NOT NULL
enable_footer_phrase                           tinyint(1)  NOT NULL
footer_phrase                                  varchar(255)
enable_footer_phrase_image                     tinyint(1)  NOT NULL
footer_phrase_with_image                       varchar(255)
footer_image_url                               varchar(255)
enable_footer_how_it_works                     tinyint(1)  NOT NULL
enable_webhook_status                          tinyint(1)  NOT NULL
webhook_status_url                             varchar(255)
webhook_status_token                           varchar(255)
enable_home_events_calendar                    tinyint(1)  NOT NULL
```

## shops

No `schema.md`: **30** · no banco: **50** · faltavam: **20** (a ressalva 2 estimava 13)

```
business_consultant_2_id                       bigint unsigned
cnpj_social_contract_file                      varchar(255)
address_proof_file                             varchar(255)
work_days_for_buyer_counterproposal_analysis   smallint
customer_information                           varchar(20)
enable_payment_platform                        tinyint(1)  NOT NULL
enable_payment_platform_external               int  NOT NULL
enable_payment_tax_platform                    varchar(255)
enable_payment_tax_platform_external           int  NOT NULL
enable_complete_register                       tinyint(1)  NOT NULL
enable_purchasing_customer_information         tinyint(1)  NOT NULL
enable_buyer                                   tinyint(1)  NOT NULL
enable_advertiser                              tinyint(1)  NOT NULL
observation                                    text
deleted_at                                     timestamp
deleted_by                                     bigint unsigned
created_at                                     timestamp
updated_at                                     timestamp
enable_withdrawal_platform                     tinyint(1)  NOT NULL
profile_type                                   varchar(255)
```

## whitelabels

No `schema.md`: **30** · no banco: **43** · faltavam: **13** (a ressalva 2 estimava 11)

```
api_token         varchar(255)
sync_date         varchar(255)
sync_url          varchar(255)
whatsapp_number   varchar(45)
contact_number    varchar(45)
sync_filesize     varchar(255)
client_group_id   bigint unsigned  NOT NULL
deleted_at        timestamp
deleted_by        bigint unsigned
created_at        timestamp
updated_at        timestamp
url_webapp        varchar(255)
url_auditorium    varchar(255)
```

## advertisement_negotiations

No `schema.md`: **30** · no banco: **37** · faltavam: **7** (a ressalva 2 estimava 5)

```
payment_method_signature_club_id   bigint unsigned
is_highlight_of_the_day            tinyint(1)  NOT NULL
deleted_at                         timestamp
created_at                         timestamp
updated_at                         timestamp
reason                             text
seller_at                          datetime
```

## Total

**79 colunas** recuperadas nas 4 tabelas. A ressalva 2 estimava 49 — a
estimativa vinha do rótulo "N more..." do diagrama, que subcontava.
