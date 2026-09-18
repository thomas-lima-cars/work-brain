# Tabelas que existem no banco e NÃO estão no `schema.md`

> 🔴 **44 tabelas**, levantadas em 2026-09-18 no banco da **Cars2You**
> (`cars2you_production`). O `schema.md` documenta 149; o banco tem 193.
>
> O import de 09/09 veio de um `.txt` e de um diagrama exportados à mão — estas
> não estavam em nenhum dos dois. Não é erro do cruzamento: é fonte incompleta.
>
> As mesmas 44 existem na Dealers. Os dois bancos têm 193 tabelas e, das 192 em
> comum, só `notifications` difere em coluna.
>
> **Como fechar:** reexportar o esquema, ou gerar o `schema.md` direto do
> `information_schema` agora que existe conexão — ver `automations/bancos/`.


| tabela | linhas | colunas |
|---|---:|---:|
| `advertisement_request_status_logs` | 40.464 | 12 |
| `base_cars2you` | 20.070 | 45 |
| `user_login_locations` | 16.280 | 14 |
| `shop_automation_logs` | 8.532 | 11 |
| `password_histories` | 3.722 | 4 |
| `pickup_authorizations` | 618 | 14 |
| `vehicle_documents` | 450 | 7 |
| `event_user_alerts` | 156 | 6 |
| `photo_tags` | 41 | 8 |
| `aliases` | 23 | 7 |
| `pending_location_authorizations` | 18 | 15 |
| `event_tags` | 12 | 5 |
| `how_did_you_meet_us_whitelabel` | 12 | 5 |
| `vozis_inactivity_levels` | 12 | 7 |
| `vehicle_request_logs` | 11 | 24 |
| `how_did_you_meet_us` | 6 | 7 |
| `shop_webhooks` | 6 | 5 |
| `shop_automations` | 4 | 12 |
| `vozis_inactivity_sections` | 4 | 7 |
| `user_devices` | 3 | 14 |
| `document_types` | 2 | 6 |
| `vozis_user_contacts` | 2 | 18 |
| `shop_signatures` | 1 | 8 |
| `user_stocks` | 1 | 5 |
| `whitelabel_signatures` | 1 | 9 |
| `advertisement_request_logs` | 0 | 12 |
| `advertisement_set_items` | 0 | 7 |
| `advertisement_sets` | 0 | 8 |
| `communication_item_client_groups` | 0 | 5 |
| `communication_item_views` | 0 | 9 |
| `communication_item_whitelabels` | 0 | 5 |
| `communication_items` | 0 | 13 |
| `communication_question_options` | 0 | 7 |
| `communication_questions` | 0 | 8 |
| `communication_responses` | 0 | 8 |
| `pending_device_authorizations` | 0 | 15 |
| `regulation_acceptances` | 0 | 8 |
| `shop_api_tokens` | 0 | 8 |
| `shop_automation_conditions` | 0 | 7 |
| `vozis_inactivity_progress` | 0 | 9 |
| `whatsapp_config` | 0 | 12 |
| `whatsapp_message_statuses` | 0 | 10 |
| `whatsapp_messages` | 0 | 14 |
| `whatsapp_webhook_events` | 0 | 12 |

**19 das 44 estão vazias** — funcionalidade entregue e não ligada. Contado com `COUNT(*)`, não com a estimativa do InnoDB, que erra.
