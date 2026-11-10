# Dicionário de dados — Bradesco (VEIC)

> Gerado em 2026-11-10 direto do `information_schema` do cluster `db-veic-production` (réplica de leitura), sessão somente leitura.
> Schemas: `bradescoveicweb` (240 objetos) e `mart` (59 objetos). Total: **299 objetos, 5907 colunas**.
> Linhas são estimativas do InnoDB (podem errar bastante). Descrições de negócio não existem no banco: só há os comentários que o próprio banco traz.
> 🔒 330 colunas de nome sensível (placa, chassi, renavam, cpf/cnpj, documento, senha, token) foram contadas e não nomeadas, como na política do `qualidade.md`.
> Nenhuma credencial vive neste arquivo.

## Schema `bradescoveicweb` — 240 objetos

| objeto | tipo | linhas (estim.) | colunas |
|---|---|---:|---:|
| [`Perfomance_Bancos`](#bradescoveicweb.Perfomance_Bancos) | view | 0 | 55 |
| [`Performance_BARE`](#bradescoveicweb.Performance_BARE) | view | 0 | 49 |
| [`Valida_Duplicidade_Estoque`](#bradescoveicweb.Valida_Duplicidade_Estoque) | view | 0 | 7 |
| [`Veiculos_em_berto`](#bradescoveicweb.Veiculos_em_berto) | view | 0 | 56 |
| [`ad_groups`](#bradescoveicweb.ad_groups) | tabela | 879 | 7 |
| [`advisories`](#bradescoveicweb.advisories) | tabela | 194 | 7 |
| [`advisory_vehicle_removals`](#bradescoveicweb.advisory_vehicle_removals) | tabela | 0 | 40 |
| [`alert_categories`](#bradescoveicweb.alert_categories) | tabela | 9 | 9 |
| [`alert_types`](#bradescoveicweb.alert_types) | tabela | 19 | 12 |
| [`analitio_leiloes`](#bradescoveicweb.analitio_leiloes) | view | 0 | 67 |
| [`announcements`](#bradescoveicweb.announcements) | tabela | 10 | 11 |
| [`approval_rules_parametrization_group`](#bradescoveicweb.approval_rules_parametrization_group) | tabela | 13 | 11 |
| [`approval_rules_parametrization_group_users`](#bradescoveicweb.approval_rules_parametrization_group_users) | tabela | 31 | 6 |
| [`asset_age_parameters`](#bradescoveicweb.asset_age_parameters) | tabela | 4 | 7 |
| [`assets`](#bradescoveicweb.assets) | tabela | 1.123.712 | 146 |
| [`assets_approvers`](#bradescoveicweb.assets_approvers) | tabela | 148 | 11 |
| [`assets_atpv`](#bradescoveicweb.assets_atpv) | tabela | 889.570 | 8 |
| [`assets_costs`](#bradescoveicweb.assets_costs) | tabela | 1.386.076 | 19 |
| [`assets_costs_batches`](#bradescoveicweb.assets_costs_batches) | tabela | 0 | 7 |
| [`assets_costs_legacy`](#bradescoveicweb.assets_costs_legacy) | tabela | 2.273.408 | 19 |
| [`assets_costs_receipts`](#bradescoveicweb.assets_costs_receipts) | tabela | 3.590 | 6 |
| [`assets_inspection_photos`](#bradescoveicweb.assets_inspection_photos) | tabela | 2.050.757 | 8 |
| [`assets_miscellaneous_type`](#bradescoveicweb.assets_miscellaneous_type) | tabela | 9 | 4 |
| [`assets_repurchases`](#bradescoveicweb.assets_repurchases) | tabela | 963 | 13 |
| [`assets_sales_channels`](#bradescoveicweb.assets_sales_channels) | tabela | 0 | 11 |
| [`assets_sell_notes`](#bradescoveicweb.assets_sell_notes) | tabela | 74.481 | 8 |
| [`assets_status`](#bradescoveicweb.assets_status) | tabela | 586.192 | 8 |
| [`assets_status_cache`](#bradescoveicweb.assets_status_cache) | tabela | 0 | 13 |
| [`assets_status_view`](#bradescoveicweb.assets_status_view) | view | 0 | 10 |
| [`assets_status_view_beta`](#bradescoveicweb.assets_status_view_beta) | view | 0 | 10 |
| [`assets_values`](#bradescoveicweb.assets_values) | tabela | 328.608 | 7 |
| [`atpv_note_slas`](#bradescoveicweb.atpv_note_slas) | tabela | 0 | 5 |
| [`atpv_ocr_analyses`](#bradescoveicweb.atpv_ocr_analyses) | tabela | 2.463 | 12 |
| [`atpvs_notes_ocr`](#bradescoveicweb.atpvs_notes_ocr) | tabela | 78.201 | 21 |
| [`auctioneers`](#bradescoveicweb.auctioneers) | tabela | 124 | 35 |
| [`auctioneers_distributions`](#bradescoveicweb.auctioneers_distributions) | tabela | 10.725 | 11 |
| [`auctioneers_poc_costs`](#bradescoveicweb.auctioneers_poc_costs) | tabela | 0 | 13 |
| [`auctioneers_users`](#bradescoveicweb.auctioneers_users) | tabela | 0 | 8 |
| [`auctioneers_users_relationship`](#bradescoveicweb.auctioneers_users_relationship) | tabela | 0 | 6 |
| [`auctions`](#bradescoveicweb.auctions) | tabela | 0 | 8 |
| [`backoffice_logs_ai_summaries`](#bradescoveicweb.backoffice_logs_ai_summaries) | tabela | 26 | 7 |
| [`baixados_2025`](#bradescoveicweb.baixados_2025) | view | 0 | 55 |
| [`bank_account`](#bradescoveicweb.bank_account) | tabela | 0 | 35 |
| [`banks`](#bradescoveicweb.banks) | tabela | 12 | 16 |
| [`banks_mapping`](#bradescoveicweb.banks_mapping) | tabela | 0 | 6 |
| [`batch_input_items_sap`](#bradescoveicweb.batch_input_items_sap) | tabela | 3.771 | 22 |
| [`batch_inputs`](#bradescoveicweb.batch_inputs) | tabela | 1.097 | 23 |
| [`bi_dashboard_parameter`](#bradescoveicweb.bi_dashboard_parameter) | tabela | 4 | 7 |
| [`blocking_asset_documents`](#bradescoveicweb.blocking_asset_documents) | tabela | 0 | 7 |
| [`blocking_documents`](#bradescoveicweb.blocking_documents) | tabela | 19.651 | 8 |
| [`blockings`](#bradescoveicweb.blockings) | tabela | 19.715 | 20 |
| [`book_value_discount`](#bradescoveicweb.book_value_discount) | tabela | 11 | 7 |
| [`bradesco_nature_rules`](#bradescoveicweb.bradesco_nature_rules) | tabela | 14 | 8 |
| [`bradesco_seguros_imports`](#bradescoveicweb.bradesco_seguros_imports) | tabela | 1.670 | 9 |
| [`bradesco_seguros_process_attempts`](#bradescoveicweb.bradesco_seguros_process_attempts) | tabela | 77.476 | 15 |
| [`bradesco_seguros_processes`](#bradescoveicweb.bradesco_seguros_processes) | tabela | 56.623 | 28 |
| [`bradesco_seguros_resource_imports`](#bradescoveicweb.bradesco_seguros_resource_imports) | tabela | 28 | 3 |
| [`bradesco_seguros_resources`](#bradescoveicweb.bradesco_seguros_resources) | tabela | 463.704 | 15 |
| [`brands`](#bradescoveicweb.brands) | tabela | 653 | 6 |
| [`budget_bank_monthly`](#bradescoveicweb.budget_bank_monthly) | tabela | 0 | 12 |
| [`clients`](#bradescoveicweb.clients) | tabela | 247.457 | 43 |
| [`clients_files`](#bradescoveicweb.clients_files) | tabela | 0 | 7 |
| [`color_vehicles`](#bradescoveicweb.color_vehicles) | tabela | 142 | 5 |
| [`companies`](#bradescoveicweb.companies) | tabela | 284 | 7 |
| [`condition_equipments`](#bradescoveicweb.condition_equipments) | tabela | 0 | 6 |
| [`condition_report`](#bradescoveicweb.condition_report) | tabela | 0 | 22 |
| [`condition_report_fields`](#bradescoveicweb.condition_report_fields) | tabela | 101 | 15 |
| [`condition_report_sections`](#bradescoveicweb.condition_report_sections) | tabela | 32 | 9 |
| [`condition_reports`](#bradescoveicweb.condition_reports) | tabela | 306.209 | 9 |
| [`condition_reports_photos`](#bradescoveicweb.condition_reports_photos) | tabela | 0 | 9 |
| [`condition_reports_tires`](#bradescoveicweb.condition_reports_tires) | tabela | 0 | 8 |
| [`conditional_parameters`](#bradescoveicweb.conditional_parameters) | tabela | 0 | 4 |
| [`consulta_molicar`](#bradescoveicweb.consulta_molicar) | view | 0 | 7 |
| [`costs_per_assets_type`](#bradescoveicweb.costs_per_assets_type) | tabela | 239 | 7 |
| [`counties`](#bradescoveicweb.counties) | tabela | 0 | 8 |
| [`courtyards`](#bradescoveicweb.courtyards) | tabela | 110 | 32 |
| [`current_assets_status`](#bradescoveicweb.current_assets_status) | view | 0 | 7 |
| [`cut_date`](#bradescoveicweb.cut_date) | tabela | 0 | 9 |
| [`d_assessoria`](#bradescoveicweb.d_assessoria) | view | 0 | 7 |
| [`d_bancos`](#bradescoveicweb.d_bancos) | view | 0 | 11 |
| [`d_despachante`](#bradescoveicweb.d_despachante) | view | 0 | 22 |
| [`d_documentos`](#bradescoveicweb.d_documentos) | view | 0 | 7 |
| [`d_empresas`](#bradescoveicweb.d_empresas) | view | 0 | 6 |
| [`d_eventos`](#bradescoveicweb.d_eventos) | view | 0 | 42 |
| [`d_leiloeiros`](#bradescoveicweb.d_leiloeiros) | view | 0 | 27 |
| [`d_molicar`](#bradescoveicweb.d_molicar) | view | 0 | 8 |
| [`d_patio`](#bradescoveicweb.d_patio) | view | 0 | 31 |
| [`d_status_regularizao_despachante`](#bradescoveicweb.d_status_regularizao_despachante) | view | 0 | 11 |
| [`d_veiculos_bens`](#bradescoveicweb.d_veiculos_bens) | view | 0 | 29 |
| [`debt_receipts`](#bradescoveicweb.debt_receipts) | tabela | 122.583 | 7 |
| [`debts`](#bradescoveicweb.debts) | tabela | 277.810 | 13 |
| [`debts_files_ocr`](#bradescoveicweb.debts_files_ocr) | tabela | 0 | 11 |
| [`debts_ocr`](#bradescoveicweb.debts_ocr) | tabela | 128.862 | 13 |
| [`debts_vehicles`](#bradescoveicweb.debts_vehicles) | tabela | 0 | 11 |
| [`devolutions`](#bradescoveicweb.devolutions) | tabela | 73.300 | 20 |
| [`dispatch`](#bradescoveicweb.dispatch) | tabela | 1.089.651 | 42 |
| [`dispatch_documents`](#bradescoveicweb.dispatch_documents) | tabela | 689 | 7 |
| [`dispatch_services`](#bradescoveicweb.dispatch_services) | tabela | 10.673 | 10 |
| [`dispatch_services_sla_follow_ups`](#bradescoveicweb.dispatch_services_sla_follow_ups) | tabela | 1.024.580 | 11 |
| [`dispatch_status_follow_up`](#bradescoveicweb.dispatch_status_follow_up) | tabela | 0 | 6 |
| [`dispatch_status_follow_up_uf`](#bradescoveicweb.dispatch_status_follow_up_uf) | tabela | 0 | 7 |
| [`dispatch_status_logs`](#bradescoveicweb.dispatch_status_logs) | tabela | 0 | 11 |
| [`dispatch_substatus_follow_up`](#bradescoveicweb.dispatch_substatus_follow_up) | tabela | 0 | 6 |
| [`dispatchers`](#bradescoveicweb.dispatchers) | tabela | 35 | 22 |
| [`dispatchers_distributions`](#bradescoveicweb.dispatchers_distributions) | tabela | 0 | 7 |
| [`dispatchers_distributions_regionalizations`](#bradescoveicweb.dispatchers_distributions_regionalizations) | tabela | 12 | 5 |
| [`dispatchers_distributions_rules`](#bradescoveicweb.dispatchers_distributions_rules) | tabela | 101 | 7 |
| [`dispatchers_regionalizations_ufs`](#bradescoveicweb.dispatchers_regionalizations_ufs) | tabela | 81 | 5 |
| [`doc_debts`](#bradescoveicweb.doc_debts) | tabela | 0 | 19 |
| [`document_type_templates`](#bradescoveicweb.document_type_templates) | tabela | 1 | 8 |
| [`documents`](#bradescoveicweb.documents) | tabela | 176.537 | 7 |
| [`doorman`](#bradescoveicweb.doorman) | tabela | 0 | 8 |
| [`email_action_group`](#bradescoveicweb.email_action_group) | tabela | 1 | 6 |
| [`email_actions`](#bradescoveicweb.email_actions) | tabela | 4 | 6 |
| [`email_group_user`](#bradescoveicweb.email_group_user) | tabela | 2 | 6 |
| [`email_groups`](#bradescoveicweb.email_groups) | tabela | 3 | 5 |
| [`email_send_logs`](#bradescoveicweb.email_send_logs) | tabela | 164.393 | 12 |
| [`empf_cr_codes`](#bradescoveicweb.empf_cr_codes) | tabela | 4.998 | 9 |
| [`event_days_before`](#bradescoveicweb.event_days_before) | tabela | 0 | 4 |
| [`event_pass_attempts`](#bradescoveicweb.event_pass_attempts) | tabela | 0 | 4 |
| [`events`](#bradescoveicweb.events) | tabela | 20.892 | 49 |
| [`events_assets`](#bradescoveicweb.events_assets) | tabela | 1.140.868 | 70 |
| [`events_assets_logs_transfers`](#bradescoveicweb.events_assets_logs_transfers) | tabela | 14.588 | 12 |
| [`events_discounts`](#bradescoveicweb.events_discounts) | tabela | 0 | 4 |
| [`events_tags`](#bradescoveicweb.events_tags) | tabela | 30.562 | 6 |
| [`evidence_high_debts`](#bradescoveicweb.evidence_high_debts) | tabela | 5 | 6 |
| [`ex_use_asset_bids`](#bradescoveicweb.ex_use_asset_bids) | tabela | 618 | 9 |
| [`ex_use_asset_documents`](#bradescoveicweb.ex_use_asset_documents) | tabela | 2.226 | 6 |
| [`ex_use_asset_events`](#bradescoveicweb.ex_use_asset_events) | tabela | 324 | 21 |
| [`ex_use_asset_photos`](#bradescoveicweb.ex_use_asset_photos) | tabela | 1.472 | 6 |
| [`ex_use_assets`](#bradescoveicweb.ex_use_assets) | tabela | 1.535 | 8 |
| [`f_assessoria`](#bradescoveicweb.f_assessoria) | view | 0 | 115 |
| [`f_consolidado_dispatch_pendencies`](#bradescoveicweb.f_consolidado_dispatch_pendencies) | view | 0 | 20 |
| [`f_consulta_documentos_vendas`](#bradescoveicweb.f_consulta_documentos_vendas) | view | 0 | 19 |
| [`f_despachante`](#bradescoveicweb.f_despachante) | view | 0 | 12 |
| [`f_despachante2`](#bradescoveicweb.f_despachante2) | view | 0 | 33 |
| [`f_entradas`](#bradescoveicweb.f_entradas) | view | 0 | 26 |
| [`f_enviados_despachantes`](#bradescoveicweb.f_enviados_despachantes) | view | 0 | 48 |
| [`f_estoque_despachante`](#bradescoveicweb.f_estoque_despachante) | view | 0 | 47 |
| [`f_estoquenew`](#bradescoveicweb.f_estoquenew) | view | 0 | 34 |
| [`f_eventos`](#bradescoveicweb.f_eventos) | view | 0 | 63 |
| [`f_patio`](#bradescoveicweb.f_patio) | view | 0 | 22 |
| [`f_pendencias`](#bradescoveicweb.f_pendencias) | view | 0 | 12 |
| [`f_regularizados`](#bradescoveicweb.f_regularizados) | view | 0 | 47 |
| [`f_regularizados_despachante`](#bradescoveicweb.f_regularizados_despachante) | view | 0 | 48 |
| [`f_remocoes`](#bradescoveicweb.f_remocoes) | view | 0 | 33 |
| [`f_status_ativos`](#bradescoveicweb.f_status_ativos) | view | 0 | 7 |
| [`f_users`](#bradescoveicweb.f_users) | view | 0 | 16 |
| [`f_vendas`](#bradescoveicweb.f_vendas) | view | 0 | 62 |
| [`failed_jobs`](#bradescoveicweb.failed_jobs) | tabela | 1.903 | 8 |
| [`fipe`](#bradescoveicweb.fipe) | tabela | 0 | 7 |
| [`fuels`](#bradescoveicweb.fuels) | tabela | 140 | 5 |
| [`gran_responses`](#bradescoveicweb.gran_responses) | tabela | 69.626 | 8 |
| [`heavy_car_inspections`](#bradescoveicweb.heavy_car_inspections) | tabela | 0 | 109 |
| [`heavy_car_inspections_photos`](#bradescoveicweb.heavy_car_inspections_photos) | tabela | 0 | 9 |
| [`high_debts`](#bradescoveicweb.high_debts) | tabela | 0 | 10 |
| [`honoraries`](#bradescoveicweb.honoraries) | tabela | 52.990 | 12 |
| [`impersonation_sessions`](#bradescoveicweb.impersonation_sessions) | tabela | 210 | 9 |
| [`inspections_time`](#bradescoveicweb.inspections_time) | tabela | 45.308 | 6 |
| [`inspector`](#bradescoveicweb.inspector) | tabela | 265 | 10 |
| [`integration_health_logs`](#bradescoveicweb.integration_health_logs) | tabela | 39.320 | 11 |
| [`inventory_assets`](#bradescoveicweb.inventory_assets) | tabela | 3.510 | 18 |
| [`inventory_assets_files`](#bradescoveicweb.inventory_assets_files) | tabela | 0 | 6 |
| [`inventory_uploads`](#bradescoveicweb.inventory_uploads) | tabela | 3 | 8 |
| [`job_batches`](#bradescoveicweb.job_batches) | tabela | 2.704 | 10 |
| [`jobs`](#bradescoveicweb.jobs) | tabela | 0 | 7 |
| [`jurisdictions`](#bradescoveicweb.jurisdictions) | tabela | 75 | 11 |
| [`light_car_inspections`](#bradescoveicweb.light_car_inspections) | tabela | 0 | 102 |
| [`light_car_photos_inspections`](#bradescoveicweb.light_car_photos_inspections) | tabela | 0 | 9 |
| [`log_rest`](#bradescoveicweb.log_rest) | tabela | 4.298.056 | 12 |
| [`logs`](#bradescoveicweb.logs) | tabela | 113.228.604 | 17 |
| [`logs_checkauto`](#bradescoveicweb.logs_checkauto) | tabela | 67.768 | 6 |
| [`migrations`](#bradescoveicweb.migrations) | tabela | 492 | 4 |
| [`minimum_sample_percentage_parameter`](#bradescoveicweb.minimum_sample_percentage_parameter) | tabela | 0 | 4 |
| [`molicar`](#bradescoveicweb.molicar) | tabela | 3.336.515 | 8 |
| [`motorcycle_inspection_photos`](#bradescoveicweb.motorcycle_inspection_photos) | tabela | 0 | 9 |
| [`motorcycle_inspections`](#bradescoveicweb.motorcycle_inspections) | tabela | 0 | 68 |
| [`new_view`](#bradescoveicweb.new_view) | view | 0 | 47 |
| [`notifications`](#bradescoveicweb.notifications) | tabela | 1.880.382 | 9 |
| [`partners`](#bradescoveicweb.partners) | tabela | 23.946 | 18 |
| [`partners_events_assets_relationship`](#bradescoveicweb.partners_events_assets_relationship) | tabela | 119.987 | 5 |
| [`payment_group`](#bradescoveicweb.payment_group) | tabela | 8.988 | 23 |
| [`pendencies`](#bradescoveicweb.pendencies) | tabela | 52.336 | 16 |
| [`pendency_slas`](#bradescoveicweb.pendency_slas) | tabela | 0 | 9 |
| [`portfolios`](#bradescoveicweb.portfolios) | tabela | 1.091 | 4 |
| [`pricing_discount`](#bradescoveicweb.pricing_discount) | tabela | 14 | 7 |
| [`regions`](#bradescoveicweb.regions) | tabela | 42 | 5 |
| [`regions_cities_states`](#bradescoveicweb.regions_cities_states) | tabela | 5.773 | 7 |
| [`registration_documents`](#bradescoveicweb.registration_documents) | tabela | 0 | 9 |
| [`regularization_documents`](#bradescoveicweb.regularization_documents) | tabela | 3.215 | 8 |
| [`regularization_files_ocr`](#bradescoveicweb.regularization_files_ocr) | tabela | 31 | 11 |
| [`relationship_between_assets`](#bradescoveicweb.relationship_between_assets) | tabela | 3 | 6 |
| [`removal_locals`](#bradescoveicweb.removal_locals) | tabela | 63.402 | 23 |
| [`removal_parameterization`](#bradescoveicweb.removal_parameterization) | tabela | 0 | 5 |
| [`removals`](#bradescoveicweb.removals) | tabela | 276.044 | 29 |
| [`removals_slas`](#bradescoveicweb.removals_slas) | tabela | 29 | 10 |
| [`report_batches`](#bradescoveicweb.report_batches) | tabela | 10.175 | 12 |
| [`report_company_honoraries`](#bradescoveicweb.report_company_honoraries) | tabela | 6.740 | 9 |
| [`report_values`](#bradescoveicweb.report_values) | tabela | 4 | 9 |
| [`reports`](#bradescoveicweb.reports) | tabela | 160.672 | 16 |
| [`reports_companies`](#bradescoveicweb.reports_companies) | tabela | 2 | 8 |
| [`repurchases_follow_up`](#bradescoveicweb.repurchases_follow_up) | tabela | 7.183 | 7 |
| [`repurchases_follow_up_documents`](#bradescoveicweb.repurchases_follow_up_documents) | tabela | 4.517 | 7 |
| [`rest_api_codes`](#bradescoveicweb.rest_api_codes) | tabela | 15 | 6 |
| [`sale_notification`](#bradescoveicweb.sale_notification) | tabela | 27.549 | 18 |
| [`sale_notification_cron_logs`](#bradescoveicweb.sale_notification_cron_logs) | tabela | 0 | 7 |
| [`sale_notification_days_parameterizations`](#bradescoveicweb.sale_notification_days_parameterizations) | tabela | 1 | 5 |
| [`sale_notification_status_logs`](#bradescoveicweb.sale_notification_status_logs) | tabela | 74.325 | 7 |
| [`sales_channels`](#bradescoveicweb.sales_channels) | tabela | 0 | 7 |
| [`sap_emails`](#bradescoveicweb.sap_emails) | tabela | 0 | 5 |
| [`sap_fixed_assets`](#bradescoveicweb.sap_fixed_assets) | tabela | 112 | 15 |
| [`sap_fixed_low_assets`](#bradescoveicweb.sap_fixed_low_assets) | tabela | 95 | 15 |
| [`sap_requester`](#bradescoveicweb.sap_requester) | tabela | 2 | 5 |
| [`sap_tax_reform_parameters`](#bradescoveicweb.sap_tax_reform_parameters) | tabela | 1 | 5 |
| [`scheduled_job_toggles`](#bradescoveicweb.scheduled_job_toggles) | tabela | 123 | 12 |
| [`scrap_clients_authorizations`](#bradescoveicweb.scrap_clients_authorizations) | tabela | 6.250 | 8 |
| [`scrap_request_approvers`](#bradescoveicweb.scrap_request_approvers) | tabela | 1.895 | 8 |
| [`scrap_request_photos`](#bradescoveicweb.scrap_request_photos) | tabela | 3.549 | 6 |
| [`scrap_requests`](#bradescoveicweb.scrap_requests) | tabela | 984 | 12 |
| [`scrap_write_off_pricing_parameter`](#bradescoveicweb.scrap_write_off_pricing_parameter) | tabela | 0 | 5 |
| [`sell_note_ocr_analyses`](#bradescoveicweb.sell_note_ocr_analyses) | tabela | 3.092 | 12 |
| [`service_slas`](#bradescoveicweb.service_slas) | tabela | 217 | 7 |
| [`sessions`](#bradescoveicweb.sessions) | tabela | 0 | 6 |
| [`special_advisories`](#bradescoveicweb.special_advisories) | tabela | 14 | 9 |
| [`special_advisory_cases`](#bradescoveicweb.special_advisory_cases) | tabela | 2.722 | 14 |
| [`special_advisory_frequency_automatic_distribution`](#bradescoveicweb.special_advisory_frequency_automatic_distribution) | tabela | 0 | 9 |
| [`stays`](#bradescoveicweb.stays) | tabela | 309.099 | 19 |
| [`tabela_operacional_leilao`](#bradescoveicweb.tabela_operacional_leilao) | view | 0 | 76 |
| [`tabela_vendas`](#bradescoveicweb.tabela_vendas) | view | 0 | 13 |
| [`tabelao_validador`](#bradescoveicweb.tabelao_validador) | view | 0 | 46 |
| [`tags`](#bradescoveicweb.tags) | tabela | 18.493 | 7 |
| [`transfer_receipts`](#bradescoveicweb.transfer_receipts) | tabela | 5.247 | 18 |
| [`transfer_receipts_sales_channels`](#bradescoveicweb.transfer_receipts_sales_channels) | tabela | 0 | 15 |
| [`user_alert_preferences`](#bradescoveicweb.user_alert_preferences) | tabela | 288 | 7 |
| [`users`](#bradescoveicweb.users) | tabela | 912 | 19 |
| [`vehicle_buckets`](#bradescoveicweb.vehicle_buckets) | tabela | 120.520 | 35 |
| [`vehicle_watch_terms`](#bradescoveicweb.vehicle_watch_terms) | tabela | 2 | 9 |
| [`vendas_completa`](#bradescoveicweb.vendas_completa) | view | 0 | 55 |
| [`vendas_qtde`](#bradescoveicweb.vendas_qtde) | view | 0 | 14 |
| [`vendidos_2025_jan_mai`](#bradescoveicweb.vendidos_2025_jan_mai) | view | 0 | 57 |

### <a id="bradescoveicweb.Perfomance_Bancos"></a>bradescoveicweb.Perfomance_Bancos

_View · ~0 linhas (estimativa do InnoDB) · 55 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |
| `custo_veiculo` | double | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.Performance_BARE"></a>bradescoveicweb.Performance_BARE

_View · ~0 linhas (estimativa do InnoDB) · 49 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status_evento` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.Valida_Duplicidade_Estoque"></a>bradescoveicweb.Valida_Duplicidade_Estoque

_View · ~0 linhas (estimativa do InnoDB) · 7 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `contratct_identification` | varchar(255) | sim |  |  |  |  |
| `car_plate` | varchar(255) | sim |  |  |  |  |
| `imported` | tinyint(1) | sim |  |  |  |  |
| `sell_status` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `quantidade` | bigint | não |  |  | 0 |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.Veiculos_em_berto"></a>bradescoveicweb.Veiculos_em_berto

_View · ~0 linhas (estimativa do InnoDB) · 56 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `valor_da_contraproposta` | decimal(12,2) | sim |  |  |  |  |
| `data_inicio_leilao` | datetime | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.ad_groups"></a>bradescoveicweb.ad_groups

_Tabela · ~879 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `group_id` | varchar(255) | não |  |  |  |  |
| `description` | text | sim |  |  |  |  |
| `user_id` | bigint unsigned | não | MUL |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `user_id` → `users.id`

**Índices:** `ad_groups_user_id_foreign`: (user_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.advisories"></a>bradescoveicweb.advisories

_Tabela · ~194 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `phone` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim |  |  |  |  |
| `user` | varchar(255) | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.advisory_vehicle_removals"></a>bradescoveicweb.advisory_vehicle_removals

_Tabela · ~0 linhas (estimativa do InnoDB) · 40 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `car_plate` | varchar(255) | não |  |  |  |  |
| `engine_number_curent` | varchar(255) | sim |  |  |  |  |
| `engine_number_default` | varchar(255) | sim |  |  |  |  |
| `engine_power` | varchar(255) | sim |  |  |  |  |
| `cylinders` | varchar(255) | sim |  |  |  |  |
| `place_uf` | varchar(255) | sim |  |  |  |  |
| `place_city` | varchar(255) | sim |  |  |  |  |
| `automaker` | varchar(255) | não |  |  |  |  |
| `version` | varchar(255) | não |  |  |  |  |
| `year_manufacture` | int | sim |  |  |  |  |
| `year_model` | int | sim |  |  |  |  |
| `color` | varchar(255) | sim |  |  |  |  |
| `fuel` | varchar(255) | sim |  |  |  |  |
| `date_crv_crlv` | date | sim |  |  |  |  |
| `licensing_date` | date | sim |  |  |  |  |
| `name_financed_insured` | varchar(255) | sim |  |  |  |  |
| `contratct_identification` | varchar(255) | sim |  |  |  |  |
| `casualty_identification` | varchar(255) | sim |  |  |  |  |
| `current_owner_name` | varchar(255) | sim |  |  |  |  |
| `auctioneer_id` | int | não |  |  |  |  |
| `advisory_id` | int | não |  |  |  |  |
| `cep` | varchar(255) | não |  |  |  |  |
| `street` | varchar(255) | não |  |  |  |  |
| `number` | varchar(255) | não |  |  |  |  |
| `complement` | varchar(255) | sim |  |  |  |  |
| `district` | varchar(255) | não |  |  |  |  |
| `city` | varchar(255) | não |  |  |  |  |
| `state` | varchar(255) | não |  |  |  |  |
| `references` | varchar(255) | sim |  |  |  |  |
| `information` | varchar(255) | sim |  |  |  |  |
| `status` | enum('PENDING','DONE') | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 4 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.alert_categories"></a>bradescoveicweb.alert_categories

_Tabela · ~9 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `code` | varchar(255) | não | UNI |  |  |  |
| `description` | text | sim |  |  |  |  |
| `active` | tinyint(1) | não |  |  | 1 |  |
| `order` | int | não |  |  | 0 |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `alert_categories_code_unique` (único): (code) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.alert_types"></a>bradescoveicweb.alert_types

_Tabela · ~19 linhas (estimativa do InnoDB) · 12 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `alert_category_id` | bigint unsigned | não | MUL |  |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `code` | varchar(255) | não | UNI |  |  |  |
| `description` | text | sim |  |  |  |  |
| `active` | tinyint(1) | não |  |  | 1 |  |
| `default_enabled` | tinyint(1) | não |  |  | 0 |  |
| `order` | int | não |  |  | 0 |  |
| `user_types` | json | sim |  |  |  | Tipos de usuários que podem receber este alerta (BACKOFFICE, AUCTIONEER, ADVISORY, SPECIAL_ADVISORY, DISPATCHER) |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `alert_category_id` → `alert_categories.id`

**Índices:** `alert_types_alert_category_id_index`: (alert_category_id) · `alert_types_code_unique` (único): (code) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.analitio_leiloes"></a>bradescoveicweb.analitio_leiloes

_View · ~0 linhas (estimativa do InnoDB) · 67 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `valor_sugerido` | decimal(10,2) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `tag_id` | int | sim |  |  |  |  |
| `passagens_nos_eventos` | int | sim |  |  |  |  |
| `molicar_valor_mais_recente` | int | sim |  |  |  |  |
| `data_referencia_molicar` | date | sim |  |  |  |  |
| `molicar_ano_base` | int | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `valor_da_contraproposta` | decimal(12,2) | sim |  |  |  |  |
| `id_evento` | int | sim |  |  |  |  |
| `id_cliente` | int unsigned | sim |  |  |  |  |
| `data_inicio_leilao` | datetime | sim |  |  |  |  |
| `aprovacao_leilao` | tinyint(1) | sim |  |  | 0 |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao_estadia` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |
| `nome_cliente` | varchar(255) | sim |  |  |  |  |

🔒 6 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.announcements"></a>bradescoveicweb.announcements

_Tabela · ~10 linhas (estimativa do InnoDB) · 11 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `title` | varchar(255) | não |  |  |  |  |
| `body` | longtext | não |  |  |  |  |
| `target_type` | varchar(255) | não |  |  |  |  |
| `target_id` | bigint unsigned | sim |  |  |  |  |
| `target_ids` | json | sim |  |  |  |  |
| `sent_by` | bigint unsigned | sim | MUL |  |  |  |
| `sent_at` | timestamp | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `sent_by` → `users.id`

**Índices:** `announcements_sent_by_foreign`: (sent_by) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.approval_rules_parametrization_group"></a>bradescoveicweb.approval_rules_parametrization_group

_Tabela · ~13 linhas (estimativa do InnoDB) · 11 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `group` | varchar(255) | sim |  |  |  |  |
| `minimum_value` | decimal(12,2) | sim |  |  |  |  |
| `max_value` | decimal(12,2) | sim |  |  |  |  |
| `order` | int | sim |  |  |  |  |
| `role` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `type_value` | varchar(255) | sim |  |  |  |  |
| `minimum_cut` | decimal(12,2) | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.approval_rules_parametrization_group_users"></a>bradescoveicweb.approval_rules_parametrization_group_users

_Tabela · ~31 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `group_id` | int | sim |  |  |  |  |
| `user_id` | int | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.asset_age_parameters"></a>bradescoveicweb.asset_age_parameters

_Tabela · ~4 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `category` | varchar(255) | não |  |  |  |  |
| `min_age` | int | não |  |  |  |  |
| `max_age` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets"></a>bradescoveicweb.assets

_Tabela · ~1.123.712 linhas (estimativa do InnoDB) · 146 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `auctioneer_id` | int | sim | MUL |  |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `car_plate` | varchar(255) | sim | MUL |  |  |  |
| `engine_number_curent` | varchar(255) | sim |  |  |  |  |
| `engine_number_default` | varchar(255) | sim |  |  |  |  |
| `engine_power` | varchar(255) | sim |  |  |  |  |
| `cylinders` | varchar(255) | sim |  |  |  |  |
| `plate_uf` | varchar(255) | sim | MUL |  |  |  |
| `plate_city` | varchar(255) | sim |  |  |  |  |
| `brand_id` | varchar(255) | sim |  |  |  |  |
| `version` | varchar(255) | sim |  |  |  |  |
| `model_detram` | varchar(255) | sim |  |  |  |  |
| `engine` | varchar(255) | sim |  |  |  |  |
| `year_manufacture` | varchar(255) | sim |  |  |  |  |
| `year_model` | varchar(255) | sim | MUL |  |  |  |
| `color_id` | varchar(255) | sim |  |  |  |  |
| `body_type` | varchar(255) | sim |  |  |  |  |
| `fuel_id` | varchar(255) | sim |  |  |  |  |
| `country_origin` | varchar(255) | sim |  |  |  |  |
| `region` | varchar(255) | sim |  |  |  |  |
| `shaft_quantity` | varchar(255) | sim |  |  |  |  |
| `date_crv_crlv` | date | sim |  |  |  |  |
| `licensing_date` | date | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `name_financed_insured` | varchar(255) | sim |  |  |  |  |
| `contratct_identification` | varchar(255) | sim | MUL |  |  |  |
| `casualty_identification` | varchar(255) | sim |  |  |  |  |
| `received_by` | varchar(255) | sim |  |  |  |  |
| `previous_owner_name` | varchar(255) | sim |  |  |  |  |
| `current_owner_name` | varchar(255) | sim |  |  |  |  |
| `portfolio` | varchar(255) | sim |  |  |  |  |
| `type_removal` | varchar(255) | sim |  |  |  |  |
| `advisory_id` | int | sim |  |  |  |  |
| `molicar_value` | varchar(255) | sim |  |  |  |  |
| `sell_status_updated_at` | datetime | sim | MUL |  |  |  |
| `sell_status` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `crivo` | tinyint(1) | sim |  |  |  |  |
| `fipe_code` | varchar(255) | sim |  |  |  |  |
| `car_scrap` | tinyint(1) | sim |  |  | 0 |  |
| `fipe_value` | decimal(12,2) | sim |  |  |  |  |
| `molicar_code` | varchar(255) | sim |  |  |  |  |
| `transmission` | enum('automatico','manual','automatizado') | sim |  |  |  |  |
| `type_vehicle` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `type_assets` | enum('VEHICLE','MISCELLANEOUS') | sim | MUL |  |  |  |
| `description` | varchar(255) | sim |  |  |  |  |
| `serial_number` | varchar(255) | sim |  |  |  |  |
| `assets_id` | int | sim |  |  |  |  |
| `gcpj` | varchar(255) | sim |  |  |  |  |
| `portfolio_id` | varchar(255) | sim |  |  |  |  |
| `bank_id` | varchar(255) | sim |  |  |  |  |
| `company_id` | varchar(255) | sim |  |  |  |  |
| `account` | varchar(255) | sim |  |  |  |  |
| `agency` | varchar(255) | sim |  |  |  |  |
| `financed` | varchar(255) | sim |  |  |  |  |
| `tag_id` | int | sim |  |  |  |  |
| `deleted_at` | timestamp | sim | MUL |  |  |  |
| `event_counter` | int | sim |  |  |  |  |
| `notes` | mediumtext | sim |  |  |  |  |
| `dispatcher_id` | int | sim | MUL |  |  |  |
| `category` | enum('rented','private') | não |  |  | private |  |
| `suggested_value` | decimal(10,2) | sim |  |  |  |  |
| `observation_block` | varchar(1000) | sim |  |  |  |  |
| `date_block_request` | date | sim |  |  |  |  |
| `date_block` | date | sim |  |  |  |  |
| `special_advisory_id` | int | sim |  |  |  |  |
| `is_judicial` | tinyint(1) | não |  |  | 0 |  |
| `cost_center` | varchar(50) | sim |  |  |  |  |
| `cdEmpresaA` | varchar(20) | sim |  |  |  |  |
| `cdAgenciaA` | varchar(20) | sim |  |  |  |  |
| `dtApreensao` | varchar(10) | sim |  |  |  |  |
| `nuParcelas` | varchar(5) | sim |  |  |  |  |
| `nuParcelasPagas` | varchar(5) | sim |  |  |  |  |
| `nuParcelasAtraso` | varchar(5) | sim |  |  |  |  |
| `dtBase` | varchar(10) | sim |  |  |  |  |
| `nuVlrOperacao` | varchar(15) | sim |  |  |  |  |
| `dtContabil` | varchar(10) | sim |  |  |  |  |
| `nuVlrContabil` | varchar(15) | sim |  |  |  |  |
| `dtBndu` | varchar(10) | sim |  |  |  |  |
| `inTrocaGarantia` | varchar(3) | sim |  |  |  |  |
| `inLiquida` | varchar(3) | sim |  |  |  |  |
| `inTroca` | varchar(3) | sim |  |  |  |  |
| `is_administrative` | tinyint(1) | não |  |  | 0 |  |
| `is_return` | tinyint(1) | não |  |  | 0 |  |
| `is_pj` | tinyint(1) | não |  |  | 0 |  |
| `is_consortium` | tinyint(1) | não |  |  | 0 |  |
| `consortium_observation` | text | sim |  |  |  |  |
| `consortium_released` | timestamp | sim |  |  |  |  |
| `gravame_released` | tinyint(1) | sim |  |  | 0 |  |
| `is_restitution` | tinyint(1) | não |  |  | 0 |  |
| `imported` | tinyint(1) | sim |  |  |  |  |
| `historical_average_value` | decimal(8,2) | sim |  |  |  |  |
| `saved` | text | sim |  |  |  |  |
| `nature` | text | sim |  |  |  |  |
| `compensated` | tinyint(1) | sim |  |  |  |  |
| `contract_status` | enum('REATIVADO','QUITADO') | sim |  |  |  |  |
| `motivation_status` | enum('DETERMINACAO_JUDICIAL','PURGA_DA_MORA','ACORDO','APREENSAO_INDEVIDA') | sim |  |  |  |  |
| `company_name` | varchar(100) | sim |  |  |  |  |
| `full_address` | varchar(150) | sim |  |  |  |  |
| `cep` | varchar(9) | sim |  |  |  |  |
| `vehicle_status_type` | varchar(50) | sim |  |  |  |  |
| `ipva_debit_amount` | varchar(50) | sim |  |  |  |  |
| `licensing_debit_amount` | varchar(50) | sim |  |  |  |  |
| `debit_amount_fines` | varchar(50) | sim |  |  |  |  |
| `dpvat_debit_amount` | varchar(50) | sim |  |  |  |  |
| `tax_restriction_deadline` | varchar(50) | sim |  |  |  |  |
| `blocked_regularization` | int | não |  |  | 0 |  |
| `rcb` | tinyint(1) | não |  |  | 0 |  |
| `assets_miscellaneous_type_id` | bigint unsigned | sim | MUL |  |  |  |
| `valuation` | varchar(255) | sim |  |  |  |  |
| `warning_number` | varchar(255) | sim |  |  |  |  |
| `pre_assessment` | decimal(12,2) | sim |  |  |  |  |
| `book_value` | decimal(12,2) | sim |  |  |  |  |
| `is_repurchase` | tinyint(1) | não |  |  | 0 |  |
| `coupling_principal` | tinyint(1) | sim |  |  |  |  |
| `asset_coupling_id` | int | sim |  |  |  |  |
| `exclude_from_auction` | tinyint(1) | sim |  |  |  |  |
| `number_sap` | varchar(255) | sim |  |  |  |  |
| `status_observation_sap` | varchar(50) | sim |  |  |  |  |
| `status_code_sap` | varchar(5) | sim |  |  |  |  |
| `number_tric_input` | varchar(255) | sim |  |  |  |  |
| `date_created_sap` | date | sim |  |  |  |  |
| `value_bndu` | decimal(12,2) | sim |  |  |  |  |
| `value_low` | decimal(12,2) | sim |  |  |  |  |
| `main_fixed_asset_number` | varchar(50) | sim |  |  |  |  |
| `user_id_created_sap` | int | sim |  |  |  |  |
| `number_tric_output` | varchar(50) | sim |  |  |  |  |
| `status_observation_sap_low` | varchar(50) | sim |  |  |  |  |
| `status_code_sap_low` | varchar(5) | sim |  |  |  |  |
| `number_sap_low` | varchar(30) | sim |  |  |  |  |
| `exercise_sap` | varchar(20) | sim |  |  |  |  |
| `market_valuation` | decimal(12,2) | sim |  |  |  |  |
| `invoice_amount` | decimal(12,2) | sim |  |  |  |  |
| `main_fixed_observation_wf` | text | sim |  |  |  |  |
| `low_observation_wf` | text | sim |  |  |  |  |
| `semi_trailer` | tinyint(1) | sim |  |  | 0 |  |

🔒 9 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Aponta para:** `assets_miscellaneous_type_id` → `assets_miscellaneous_type.id`

**Índices:** `assets_assets_miscellaneous_type_id_foreign`: (assets_miscellaneous_type_id) · `assets_auctioneer_id_index`: (auctioneer_id) · `assets_auctioneer_sell_status_created_at_idx`: (auctioneer_id,sell_status,created_at) · `assets_car_plate_index`: (car_plate) · `assets_chassis_index`: (chassis) · `assets_contratct_identification_index`: (contratct_identification) · `assets_dispatcher_id_index`: (dispatcher_id) · `idx_assets_auctioneer_tag_id`: (auctioneer_id,tag_id) · `idx_assets_date`: (sell_status_updated_at,deleted_at) · `idx_assets_deleted_bank`: (deleted_at,bank_id) · `idx_assets_deleted_company`: (deleted_at,company_id) · `idx_assets_deleted_created`: (deleted_at,created_at) · `idx_assets_deleted_id`: (deleted_at,id) · `idx_assets_id`: (id) · `idx_assets_id_deleted`: (id,deleted_at) · `idx_assets_sell_status`: (deleted_at,sell_status,sell_status_updated_at) · `idx_assets_type_assets_id`: (type_assets,id) · `idx_assets_uf_molicar`: (plate_uf,molicar_code) · `idx_assets_year_model`: (year_model) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets_approvers"></a>bradescoveicweb.assets_approvers

_Tabela · ~148 linhas (estimativa do InnoDB) · 11 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `dispatch_id` | int | sim |  |  |  |  |
| `group_id` | int | sim |  |  |  |  |
| `pendency_id` | int | sim |  |  |  |  |
| `user_id` | int | sim |  |  |  |  |
| `status` | varchar(255) | sim |  |  |  |  |
| `type_group` | varchar(255) | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets_atpv"></a>bradescoveicweb.assets_atpv

_Tabela · ~889.570 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | não | MUL |  |  |  |
| `path_file` | varchar(255) | não |  |  |  |  |
| `auctioneer_id` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `event_id` | int | sim | MUL |  |  |  |
| `analyzed` | tinyint(1) | sim |  |  | 0 |  |

**Índices:** `assets_atpv_asset_id_index`: (asset_id) · `assets_atpv_event_id_index`: (event_id) · `idx_assets_atpv_asset_event`: (asset_id,event_id,id) · `idx_assets_atpv_asset_id`: (asset_id) · `idx_assets_atpv_event_created`: (event_id,created_at) · `idx_assets_atpv_event_id_created_at`: (event_id,created_at) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets_costs"></a>bradescoveicweb.assets_costs

_Tabela · ~1.386.076 linhas (estimativa do InnoDB) · 19 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `cost` | double | não |  |  |  |  |
| `asset_id` | int unsigned | não | MUL |  |  |  |
| `release_date` | date | sim |  |  |  |  |
| `payment_date` | date | sim |  |  |  |  |
| `type_of_costs_id` | int unsigned | sim | MUL |  |  |  |
| `note` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `batch_id` | int | sim |  |  |  |  |
| `auctioneer_id` | int | sim | MUL |  |  |  |
| `dispatcher_id` | int | sim |  |  |  |  |
| `observation` | longtext | sim |  |  |  |  |
| `status` | enum('AGUARDANDO_APROVAÇÃO','APROVADO','REPROVADO','PAGAMENTO_EFETUADO','REPROVADO_SAP') | sim |  |  | AGUARDANDO_APROVAÇÃO |  |
| `dispatch_id` | int | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `payment_number_group` | int | sim |  |  |  |  |
| `rejection_reason` | text | sim |  |  |  |  |
| `item_batch_input_id` | int | sim |  |  |  |  |

**Aponta para:** `type_of_costs_id` → `costs_per_assets_type.id` · `asset_id` → `assets.id`

**Índices:** `costs_per_vehicles_type_of_costs_id_foreign`: (type_of_costs_id) · `costs_per_vehicles_vehicle_id_foreign`: (asset_id) · `idx_assets_costs_asset_id`: (asset_id) · `idx_assets_costs_auctioneer_deleted`: (auctioneer_id,deleted_at) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets_costs_batches"></a>bradescoveicweb.assets_costs_batches

_Tabela · ~0 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `doc_upload` | varchar(255) | sim |  |  |  |  |
| `note_upload` | varchar(255) | sim |  |  |  |  |
| `note_number` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets_costs_legacy"></a>bradescoveicweb.assets_costs_legacy

_Tabela · ~2.273.408 linhas (estimativa do InnoDB) · 19 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `cost` | double | não |  |  |  |  |
| `asset_id` | int unsigned | não | MUL |  |  |  |
| `release_date` | date | sim |  |  |  |  |
| `payment_date` | date | sim |  |  |  |  |
| `type_of_costs_id` | int unsigned | sim | MUL |  |  |  |
| `note` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `batch_id` | int | sim |  |  |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `dispatcher_id` | int | sim |  |  |  |  |
| `observation` | longtext | sim |  |  |  |  |
| `status` | enum('AGUARDANDO_APROVAÇÃO','APROVADO','REPROVADO','PAGAMENTO_EFETUADO','REPROVADO_SAP') | sim |  |  | AGUARDANDO_APROVAÇÃO |  |
| `dispatch_id` | int | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `payment_number_group` | int | sim |  |  |  |  |
| `rejection_reason` | varchar(255) | sim |  |  |  |  |
| `item_batch_input_id` | int | sim |  |  |  |  |

**Índices:** `costs_per_vehicles_type_of_costs_id_foreign`: (type_of_costs_id) · `costs_per_vehicles_vehicle_id_foreign`: (asset_id) · `idx_assets_costs_asset_id`: (asset_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets_costs_receipts"></a>bradescoveicweb.assets_costs_receipts

_Tabela · ~3.590 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `assets_cost_id` | int | sim |  |  |  |  |
| `file` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets_inspection_photos"></a>bradescoveicweb.assets_inspection_photos

_Tabela · ~2.050.757 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | sim | MUL |  |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `type` | varchar(255) | sim |  |  |  |  |
| `photo` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `idx_aip_asset_deleted_created`: (asset_id,deleted_at,created_at) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets_miscellaneous_type"></a>bradescoveicweb.assets_miscellaneous_type

_Tabela · ~9 linhas (estimativa do InnoDB) · 4 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets_repurchases"></a>bradescoveicweb.assets_repurchases

_Tabela · ~963 linhas (estimativa do InnoDB) · 13 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | não |  |  |  |  |
| `request_date` | date | sim |  |  |  |  |
| `approval_date` | date | sim |  |  |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `discount` | decimal(12,2) | sim |  |  |  |  |
| `status` | enum('PENDENTE','APROVADO','REPROVADO','PENDENTE_JUDICIAL') | não |  |  | PENDENTE |  |
| `resolution` | enum('RECOMPRA','DESCONTO','RESTRICAO_JUDICIAL') | sim |  |  |  |  |
| `dispatcher_id` | int | sim |  |  |  |  |
| `special_advisory_id` | int | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets_sales_channels"></a>bradescoveicweb.assets_sales_channels

_Tabela · ~0 linhas (estimativa do InnoDB) · 11 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `sales_channel_id` | int | sim |  |  |  |  |
| `client_id` | int | sim |  |  |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `status` | enum('PENDENTE','A_VENDA','VENDIDO') | sim |  |  |  |  |
| `sale_value` | decimal(12,2) | sim |  |  |  |  |
| `sale_date` | date | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets_sell_notes"></a>bradescoveicweb.assets_sell_notes

_Tabela · ~74.481 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | não | MUL |  |  |  |
| `path_file` | varchar(255) | não |  |  |  |  |
| `auctioneer_id` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `event_id` | int | sim | MUL |  |  |  |
| `analyzed` | tinyint(1) | sim |  |  | 0 |  |

**Índices:** `idx_assets_sell_notes_asset_id`: (asset_id) · `idx_assets_sell_notes_event_created`: (event_id,created_at) · `idx_assets_sell_notes_event_id_created_at`: (event_id,created_at) · `idx_sell_notes_asset_event`: (asset_id,event_id,id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets_status"></a>bradescoveicweb.assets_status

_Tabela · ~586.192 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `stage` | varchar(255) | não |  |  |  |  |
| `status` | varchar(255) | não |  |  |  |  |
| `user_id` | int | sim |  |  |  |  |
| `asset_id` | int unsigned | não | MUL |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `asset_id` → `assets.id`

**Índices:** `PRIMARY` (único): (id) · `vehicles_status_vehicle_id_foreign`: (asset_id)

### <a id="bradescoveicweb.assets_status_cache"></a>bradescoveicweb.assets_status_cache

_Tabela · ~0 linhas (estimativa do InnoDB) · 13 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | sim | MUL |  |  |  |
| `car_plate` | varchar(255) | sim |  |  |  |  |
| `sell_status` | varchar(255) | sim |  |  |  |  |
| `removal_id` | int | sim |  |  |  |  |
| `situation_stock` | varchar(255) | sim |  |  |  |  |
| `block_type` | varchar(255) | sim |  |  |  |  |
| `block_status` | varchar(255) | sim |  |  |  |  |
| `detailing` | varchar(255) | sim | MUL |  |  |  |
| `situation` | varchar(255) | sim | MUL |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `idx_assets_status_cache_asset_id`: (asset_id) · `idx_assets_status_cache_detailing`: (detailing) · `idx_assets_status_cache_situation`: (situation) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.assets_status_view"></a>bradescoveicweb.assets_status_view

_View · ~0 linhas (estimativa do InnoDB) · 10 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `asset_id` | int unsigned | não |  |  | 0 |  |
| `car_plate` | varchar(255) | sim |  |  |  |  |
| `sell_status` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `removal_id` | int unsigned | sim |  |  | 0 |  |
| `situation_stock` | varchar(255) | sim |  |  |  |  |
| `block_type` | varchar(255) | sim |  |  |  |  |
| `block_status` | enum('AGUARDANDO_APROVACAO','APROVADO','REPROVADO','CANCELADO','VENDA_LIBERADA','AGUARDANDO_DEFINICAO_LEILAO') | sim |  |  |  |  |
| `situation` | varchar(21) | sim |  |  |  |  |
| `detailing` | varchar(255) | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.assets_status_view_beta"></a>bradescoveicweb.assets_status_view_beta

_View · ~0 linhas (estimativa do InnoDB) · 10 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `asset_id` | int unsigned | não |  |  | 0 |  |
| `car_plate` | varchar(255) | sim |  |  |  |  |
| `sell_status` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `removal_id` | int unsigned | sim |  |  | 0 |  |
| `situation_stock` | varchar(255) | sim |  |  |  |  |
| `block_type` | varchar(255) | sim |  |  |  |  |
| `block_status` | enum('AGUARDANDO_APROVACAO','APROVADO','REPROVADO','CANCELADO','VENDA_LIBERADA','AGUARDANDO_DEFINICAO_LEILAO') | sim |  |  |  |  |
| `situation` | varchar(21) | sim |  |  |  |  |
| `detailing` | varchar(255) | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.assets_values"></a>bradescoveicweb.assets_values

_Tabela · ~328.608 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | não |  |  |  |  |
| `vmv` | decimal(12,2) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `user_id` | int | sim |  |  |  |  |
| `event_id` | int | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.atpv_note_slas"></a>bradescoveicweb.atpv_note_slas

_Tabela · ~0 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `sla` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.atpv_ocr_analyses"></a>bradescoveicweb.atpv_ocr_analyses

_Tabela · ~2.463 linhas (estimativa do InnoDB) · 12 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `event_id` | int | não | MUL |  |  |  |
| `asset_id` | int | não |  |  |  |  |
| `atpv_id` | int | sim |  |  |  |  |
| `percentage` | decimal(12,2) | sim |  |  |  |  |
| `result` | json | sim |  |  |  |  |
| `status` | enum('APROVADO','REPROVADO','APROVADO_MANUAL','REPROVADO_MANUAL') | sim |  |  |  |  |
| `user_id_checked` | int | sim |  |  |  |  |
| `date_user_checked` | datetime | sim |  |  |  |  |
| `observation_user_checked` | text | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `atpv_ocr_analyses_event_id_asset_id_unique` (único): (event_id,asset_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.atpvs_notes_ocr"></a>bradescoveicweb.atpvs_notes_ocr

_Tabela · ~78.201 linhas (estimativa do InnoDB) · 21 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `sell_note_id` | int | sim |  |  |  |  |
| `atpv_id` | int | sim |  |  |  |  |
| `percentage_correct` | decimal(12,2) | sim |  |  |  |  |
| `description` | json | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `event_id` | int | sim |  |  |  |  |
| `percentage_bd_atpv` | decimal(12,2) | sim |  |  |  |  |
| `percentage_bd_note` | decimal(12,2) | sim |  |  |  |  |
| `result_bd_atpv` | json | sim |  |  |  |  |
| `result_bd_note` | json | sim |  |  |  |  |
| `atpv_user_id_checked` | int | sim |  |  |  |  |
| `atpv_date_user_checked` | datetime | sim |  |  |  |  |
| `atpv_observation_user_checked` | text | sim |  |  |  |  |
| `atpv_user_status_checked` | enum('APROVADO','REPROVADO') | sim |  |  |  |  |
| `note_user_id_checked` | int | sim |  |  |  |  |
| `note_date_user_checked` | datetime | sim |  |  |  |  |
| `note_observation_user_checked` | text | sim |  |  |  |  |
| `note_user_status_checked` | enum('APROVADO','REPROVADO') | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.auctioneers"></a>bradescoveicweb.auctioneers

_Tabela · ~124 linhas (estimativa do InnoDB) · 35 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `active` | int | sim |  |  |  |  |
| `cep` | varchar(255) | sim |  |  |  |  |
| `public_place` | varchar(255) | sim |  |  |  |  |
| `number` | varchar(255) | sim |  |  |  |  |
| `complement` | varchar(255) | sim |  |  |  |  |
| `district` | varchar(255) | sim |  |  |  |  |
| `city` | varchar(255) | sim |  |  |  |  |
| `state` | varchar(255) | sim |  |  |  |  |
| `references` | varchar(255) | sim |  |  |  |  |
| `number_contact` | varchar(255) | sim |  |  |  |  |
| `number_contact_2` | varchar(255) | sim |  |  |  |  |
| `email_contact` | varchar(255) | sim |  |  |  |  |
| `contact_description` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `import_name` | varchar(255) | sim |  |  |  |  |
| `name_contact` | varchar(255) | sim |  |  |  |  |
| `sla_id` | int | sim |  |  |  |  |
| `doc_sla` | int | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `client_id` | varchar(255) | sim |  |  |  |  |
| `dispatcher_id` | int | sim |  |  |  |  |
| `provider_code` | varchar(255) | sim |  |  |  |  |
| `dispatcher_lawyer_id` | int unsigned | sim | MUL |  |  |  |
| `is_poc` | tinyint(1) | não |  |  | 0 |  |
| `shopkeepers_sales` | int | não |  |  | 0 |  |
| `execute_own_report` | tinyint(1) | não |  |  | 0 |  |
| `bank_agency` | varchar(255) | sim |  |  |  |  |
| `bank_account` | varchar(255) | sim |  |  |  |  |
| `has_extended_access` | tinyint(1) | não |  |  | 0 |  |

🔒 3 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Aponta para:** `dispatcher_lawyer_id` → `dispatchers.id`

**Índices:** `auctioneers_dispatcher_lawyer_id_foreign`: (dispatcher_lawyer_id) · `idx_auctioneers_id`: (id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.auctioneers_distributions"></a>bradescoveicweb.auctioneers_distributions

_Tabela · ~10.725 linhas (estimativa do InnoDB) · 11 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `auctioneer_id` | int | sim | MUL |  |  |  |
| `final_plate` | char(1) | sim |  |  |  |  |
| `used` | tinyint(1) | sim |  |  | 0 |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `region_id` | int | sim | MUL |  |  |  |
| `asset_age_id` | int | sim |  |  |  |  |
| `type_vehicle` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `auctioneers_distributions_auctioneer_id_index`: (auctioneer_id) · `auctioneers_distributions_region_id_index`: (region_id) · `idx_dist_lookup`: (auctioneer_id,final_plate,type_vehicle,asset_age_id,deleted_at) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.auctioneers_poc_costs"></a>bradescoveicweb.auctioneers_poc_costs

_Tabela · ~0 linhas (estimativa do InnoDB) · 13 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `auctioneer_id` | int | não |  |  |  |  |
| `honoraries` | decimal(7,2) | não |  |  |  |  |
| `ecv_report_cost` | decimal(7,2) | não |  |  |  |  |
| `adm_fee` | decimal(7,2) | não |  |  | 1350.00 |  |
| `repair_cost` | decimal(7,2) | não |  |  |  |  |
| `commission` | decimal(7,2) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `light_value` | decimal(12,2) | sim |  |  |  |  |
| `heavy_value` | decimal(12,2) | sim |  |  |  |  |
| `motorcycle_value` | decimal(12,2) | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.auctioneers_users"></a>bradescoveicweb.auctioneers_users

_Tabela · ~0 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim | UNI |  |  |  |
| `active` | int | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `auctioneers_users_email_unique` (único): (email) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.auctioneers_users_relationship"></a>bradescoveicweb.auctioneers_users_relationship

_Tabela · ~0 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `auctioneer_user_id` | int | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.auctions"></a>bradescoveicweb.auctions

_Tabela · ~0 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `start_date` | date | sim |  |  |  |  |
| `end_date` | date | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.backoffice_logs_ai_summaries"></a>bradescoveicweb.backoffice_logs_ai_summaries

_Tabela · ~26 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `search_key` | varchar(64) | não | MUL |  |  |  |
| `vehicle_ids` | json | não |  |  |  |  |
| `ai_story` | json | não |  |  |  |  |
| `user_id` | bigint unsigned | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `backoffice_logs_ai_summaries_search_key_index`: (search_key) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.baixados_2025"></a>bradescoveicweb.baixados_2025

_View · ~0 linhas (estimativa do InnoDB) · 55 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `valor_da_contraproposta` | decimal(12,2) | sim |  |  |  |  |
| `data_inicio_leilao` | datetime | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.bank_account"></a>bradescoveicweb.bank_account

_Tabela · ~0 linhas (estimativa do InnoDB) · 35 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name_account` | varchar(255) | sim |  |  |  |  |
| `bank` | varchar(255) | sim |  |  |  |  |
| `code_bank` | int | sim |  |  |  |  |
| `agency` | int | sim |  |  |  |  |
| `account` | int | sim |  |  |  |  |
| `digit_account` | int | sim |  |  |  |  |
| `phone_first` | varchar(255) | sim |  |  |  |  |
| `phone_second` | varchar(255) | sim |  |  |  |  |
| `holder` | varchar(255) | sim |  |  |  |  |
| `manager` | varchar(255) | sim |  |  |  |  |
| `priority` | int | sim |  |  |  |  |
| `contract` | varchar(255) | sim |  |  |  |  |
| `wallet` | int | sim |  |  |  |  |
| `observation` | longtext | sim |  |  |  |  |
| `instruction_first` | varchar(255) | sim |  |  |  |  |
| `instruction_second` | varchar(255) | sim |  |  |  |  |
| `instruction_third` | varchar(255) | sim |  |  |  |  |
| `demonstrative_first` | varchar(255) | sim |  |  |  |  |
| `demonstrative_second` | varchar(255) | sim |  |  |  |  |
| `demonstrative_third` | varchar(255) | sim |  |  |  |  |
| `cep` | varchar(255) | sim |  |  |  |  |
| `public_place` | varchar(255) | sim |  |  |  |  |
| `number` | varchar(255) | sim |  |  |  |  |
| `complement` | varchar(255) | sim |  |  |  |  |
| `district` | varchar(255) | sim |  |  |  |  |
| `city` | varchar(255) | sim |  |  |  |  |
| `state` | varchar(255) | sim |  |  |  |  |
| `reference` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `pix_key` | varchar(255) | sim |  |  |  |  |
| `pix_account` | tinyint(1) | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.banks"></a>bradescoveicweb.banks

_Tabela · ~12 linhas (estimativa do InnoDB) · 16 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `code` | varchar(255) | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `agency` | varchar(255) | sim |  |  |  |  |
| `account` | varchar(255) | sim |  |  |  |  |
| `transfer_type` | enum('Tric Web','Depósito em conta','Boleto Bancário','Depósito Identificado') | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `days_to_regularize` | int | não |  |  | 0 |  |
| `gran_code` | enum('BRAD','CONS','LEAS','BBFN') | sim |  |  |  |  |
| `sap_code` | varchar(255) | sim |  |  |  |  |
| `sap_center` | varchar(255) | sim |  |  |  |  |
| `sap_center_cost` | varchar(255) | sim |  |  |  |  |
| `sap_localization_code` | varchar(255) | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.banks_mapping"></a>bradescoveicweb.banks_mapping

_Tabela · ~0 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `bank` | varchar(255) | não | UNI |  |  |  |
| `subgroup_bank` | varchar(255) | não |  |  |  |  |
| `subgroup_bank2` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `banks_mapping_bank_unique` (único): (bank) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.batch_input_items_sap"></a>bradescoveicweb.batch_input_items_sap

_Tabela · ~3.771 linhas (estimativa do InnoDB) · 22 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `batch_input_id` | int | sim |  |  |  |  |
| `payment_group_id` | int | sim |  |  |  |  |
| `cost_id` | int | sim |  |  |  |  |
| `status_code` | varchar(255) | sim |  |  |  |  |
| `number_sap` | varchar(255) | sim |  |  |  |  |
| `status` | varchar(255) | sim |  |  |  |  |
| `observation` | varchar(255) | sim |  |  |  |  |
| `data_miro` | date | sim |  |  |  |  |
| `status_miro` | varchar(255) | sim |  |  |  |  |
| `date_migo` | date | sim |  |  |  |  |
| `status_migo` | varchar(255) | sim |  |  |  |  |
| `data_pagamento` | date | sim |  |  |  |  |
| `sequential` | varchar(255) | sim |  |  |  |  |
| `status_pagto` | varchar(255) | sim |  |  |  |  |
| `send_email` | tinyint(1) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `quantidade` | int | sim |  |  |  |  |
| `numero_pedido` | varchar(255) | sim |  |  |  |  |
| `observation_wf` | text | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.batch_inputs"></a>bradescoveicweb.batch_inputs

_Tabela · ~1.097 linhas (estimativa do InnoDB) · 23 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `status` | varchar(255) | não |  |  |  |  |
| `type` | varchar(255) | não |  |  |  |  |
| `amount_of_groupings` | int | não |  |  |  |  |
| `file` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `data_miro` | date | sim |  |  |  |  |
| `status_miro` | varchar(255) | sim |  |  |  |  |
| `data_migo` | date | sim |  |  |  |  |
| `status_migo` | varchar(255) | sim |  |  |  |  |
| `data_pagto` | date | sim |  |  |  |  |
| `status_pagto` | varchar(255) | sim |  |  |  |  |
| `observations_sap` | text | sim |  |  |  |  |
| `status_veic_web` | varchar(255) | sim |  |  |  |  |
| `send_email` | tinyint(1) | sim |  |  |  |  |
| `number_sap` | varchar(255) | sim |  |  |  |  |
| `user_id_created_sap` | int | sim |  |  |  |  |
| `alert_email_xlsx` | tinyint(1) | sim |  |  |  |  |
| `quantidade` | varchar(255) | sim |  |  |  |  |
| `numero_pedido` | varchar(255) | sim |  |  |  |  |
| `observation_wf` | text | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.bi_dashboard_parameter"></a>bradescoveicweb.bi_dashboard_parameter

_Tabela · ~4 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `url` | varchar(255) | não |  |  |  |  |
| `position` | int unsigned | não |  |  | 0 |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.blocking_asset_documents"></a>bradescoveicweb.blocking_asset_documents

_Tabela · ~0 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | não |  |  |  |  |
| `path` | varchar(255) | não |  |  |  |  |
| `type` | enum('PADRAO','COMPROVANTE_DE_DEVOLUÇÃO','RESTITUICAO','CONTRATO_SOCIAL_DA_EMPRESA','ACORDO_DO_CONSORCIO','EVIDENCIA_DO_BLOQUEIO','TERMO_DE_RETIRADA') | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.blocking_documents"></a>bradescoveicweb.blocking_documents

_Tabela · ~19.651 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `blocking_id` | int | sim |  |  |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `path` | varchar(255) | sim |  |  |  |  |
| `type` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.blockings"></a>bradescoveicweb.blockings

_Tabela · ~19.715 linhas (estimativa do InnoDB) · 20 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | sim | MUL |  |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `advisory_id` | int | sim |  |  |  |  |
| `dispatcher_id` | int | sim |  |  |  |  |
| `responsible_id` | int | sim |  |  |  |  |
| `responsible_type` | enum('ADVISORY','BACKOFFICE','SPECIAL_ADVISORY') | sim |  |  |  |  |
| `origin` | enum('ADVISORY','BACKOFFICE','DISPATCHER','AFTER_SALE','AUCTIONEER') | sim |  |  |  |  |
| `status` | enum('AGUARDANDO_APROVACAO','APROVADO','REPROVADO','CANCELADO','VENDA_LIBERADA','AGUARDANDO_DEFINICAO_LEILAO') | sim |  |  |  |  |
| `status_judicial` | enum('PENDING','CLOSED','OWN_ACTION','THIRDPARTY','CANCELLED') | sim |  |  |  |  |
| `block_type` | varchar(255) | sim |  |  |  |  |
| `is_consortium` | tinyint(1) | sim |  |  | 0 |  |
| `observations` | text | sim |  |  |  |  |
| `observations_deny` | text | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim | MUL |  |  |  |
| `substatus` | varchar(255) | sim |  |  |  |  |
| `reason_for_exclusion` | text | sim |  |  |  |  |
| `devolution_id` | bigint unsigned | sim | MUL |  |  | The ID of the devolution that created this blocking |

**Aponta para:** `devolution_id` → `devolutions.id`

**Índices:** `blockings_asset_id_index`: (asset_id) · `blockings_devolution_id_foreign`: (devolution_id) · `idx_blockings_asset_blocktype`: (asset_id,block_type) · `idx_blockings_asset_id_status`: (asset_id,status) · `idx_blockings_asset_maxid`: (asset_id,id) · `idx_blockings_deleted_status_asset`: (deleted_at,status,asset_id,id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.book_value_discount"></a>bradescoveicweb.book_value_discount

_Tabela · ~11 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `year_start` | int | não |  |  |  |  |
| `year_end` | int | não |  |  |  |  |
| `discount_percentage` | double(5,2) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.bradesco_nature_rules"></a>bradescoveicweb.bradesco_nature_rules

_Tabela · ~14 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `is_scrap` | tinyint unsigned | não | MUL |  |  | 0 = recuperavel, 1 = irrecuperavel/sucata |
| `natureza` | varchar(255) | não |  |  |  |  |
| `percentual` | decimal(5,2) | sim |  |  |  |  |
| `codigo_caracteristica` | int unsigned | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `bradesco_nature_rules_is_scrap_idx`: (is_scrap) · `bradesco_nature_rules_unique` (único): (is_scrap,natureza) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.bradesco_seguros_imports"></a>bradescoveicweb.bradesco_seguros_imports

_Tabela · ~1.670 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `dispatcher_id` | int unsigned | sim | MUL |  |  |  |
| `user_id` | bigint unsigned | sim | MUL |  |  |  |
| `type` | varchar(20) | não | MUL |  |  |  |
| `result` | json | não |  |  |  |  |
| `total_count` | int unsigned | não |  |  | 0 |  |
| `original_file` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `dispatcher_id` → `dispatchers.id` · `user_id` → `users.id`

**Índices:** `bradesco_seguros_imports_dispatcher_id_created_at_index`: (dispatcher_id,created_at) · `bradesco_seguros_imports_type_created_at_index`: (type,created_at) · `bradesco_seguros_imports_user_id_foreign`: (user_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.bradesco_seguros_process_attempts"></a>bradescoveicweb.bradesco_seguros_process_attempts

_Tabela · ~77.476 linhas (estimativa do InnoDB) · 15 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `bradesco_seguros_process_id` | bigint unsigned | não | MUL |  |  |  |
| `trigger` | varchar(255) | não |  |  | manual |  |
| `trigger_user_id` | bigint unsigned | sim | MUL |  |  |  |
| `status` | varchar(255) | não |  |  | running |  |
| `reason` | text | sim |  |  |  |  |
| `meta` | json | sim |  |  |  |  |
| `inconsistencies_before` | json | sim |  |  |  |  |
| `inconsistencies_after` | json | sim |  |  |  |  |
| `error_message` | text | sim |  |  |  |  |
| `error_trace` | longtext | sim |  |  |  |  |
| `started_at` | timestamp | sim |  |  |  |  |
| `finished_at` | timestamp | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `bradesco_seguros_process_id` → `bradesco_seguros_processes.id`

**Índices:** `bradesco_seguros_process_attempts_trigger_user_id_index`: (trigger_user_id) · `bs_proc_attempts_proc_id_idx`: (bradesco_seguros_process_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.bradesco_seguros_processes"></a>bradescoveicweb.bradesco_seguros_processes

_Tabela · ~56.623 linhas (estimativa do InnoDB) · 28 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int unsigned | sim | MUL |  |  |  |
| `dispatcher_id` | int unsigned | sim | MUL |  |  |  |
| `dispatch_id` | int unsigned | sim | MUL |  |  |  |
| `auctioneer_id` | int unsigned | sim | MUL |  |  |  |
| `crlv_observation` | longtext | sim |  |  |  |  |
| `monta` | enum('P','M','G') | sim |  |  |  |  |
| `sucata` | tinyint(1) | não |  |  | 0 |  |
| `engine_restamped` | tinyint(1) | sim |  |  |  |  |
| `administrative_restriction` | tinyint(1) | sim |  |  |  |  |
| `report_observation` | longtext | sim |  |  |  |  |
| `bradesco_seguro_asset` | tinyint(1) | não |  |  | 0 |  |
| `status` | enum('Aguardando','Aprovado','Reprovado','Reprovado_falta_oficio','PreCadastro') | sim |  |  | Aguardando |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim | MUL |  |  |  |
| `pmg_observations` | longtext | sim |  |  |  |  |
| `car_plate` | varchar(255) | sim |  |  |  |  |
| `warning_number` | varchar(255) | sim |  |  |  |  |
| `start_date_stay` | date | sim |  |  |  |  |
| `courtyard_id` | int unsigned | sim | MUL |  |  |  |
| `reboque` | tinyint(1) | não |  |  | 0 |  |
| `has_inconsistency` | tinyint(1) | não |  |  | 0 |  |
| `inconsistencies` | json | sim |  |  |  |  |

🔒 4 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Aponta para:** `asset_id` → `assets.id` · `auctioneer_id` → `auctioneers.id` · `courtyard_id` → `courtyards.id` · `dispatcher_id` → `dispatchers.id` · `dispatch_id` → `dispatch.id`

**Índices:** `bradesco_seguros_processes_auctioneer_id_foreign`: (auctioneer_id) · `bradesco_seguros_processes_courtyard_id_foreign`: (courtyard_id) · `bradesco_seguros_processes_dispatch_id_foreign`: (dispatch_id) · `bradesco_seguros_processes_dispatcher_id_foreign`: (dispatcher_id) · `idx_brd_seguros_asset_id`: (asset_id) · `idx_brd_seguros_deleted_asset`: (deleted_at,asset_id,id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.bradesco_seguros_resource_imports"></a>bradescoveicweb.bradesco_seguros_resource_imports

_Tabela · ~28 linhas (estimativa do InnoDB) · 3 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.bradesco_seguros_resources"></a>bradescoveicweb.bradesco_seguros_resources

_Tabela · ~463.704 linhas (estimativa do InnoDB) · 15 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `car_plate` | varchar(255) | sim |  |  |  |  |
| `saved` | varchar(255) | sim |  |  |  |  |
| `warning_number` | varchar(255) | sim |  |  |  |  |
| `nature` | varchar(255) | sim |  |  |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `courtyard_id` | int | sim |  |  |  |  |
| `valuation` | varchar(255) | sim |  |  |  |  |
| `start_date_stay` | date | sim |  |  |  |  |
| `bradesco_seguros_id` | int | sim |  |  |  |  |
| `resource_import_id` | bigint unsigned | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.brands"></a>bradescoveicweb.brands

_Tabela · ~653 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `type` | enum('VEHICLE','EQUIPMENT_MACHINERY') | não |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.budget_bank_monthly"></a>bradescoveicweb.budget_bank_monthly

_Tabela · ~0 linhas (estimativa do InnoDB) · 12 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `bank_id` | int | sim |  |  |  |  |
| `reference_year` | year | sim |  |  |  |  |
| `reference_month` | tinyint unsigned | sim |  |  |  |  |
| `planned_amount` | decimal(12,2) | sim |  |  |  |  |
| `account` | varchar(255) | sim |  |  |  |  |
| `contract` | varchar(255) | sim |  |  |  |  |
| `justification` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.clients"></a>bradescoveicweb.clients

_Tabela · ~247.457 linhas (estimativa do InnoDB) · 43 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `company_id` | int | sim |  |  |  |  |
| `rg` | varchar(255) | sim |  |  |  |  |
| `birth_date` | date | sim |  |  |  |  |
| `dispatching_agency` | varchar(255) | sim |  |  |  |  |
| `corporate_name` | varchar(255) | sim |  |  |  |  |
| `fantasy_name` | varchar(255) | sim |  |  |  |  |
| `situation` | enum('ATIVO','INATIVO') | sim |  |  |  |  |
| `type_person` | enum('PJ','PF') | sim |  |  |  |  |
| `commercial_representative` | varchar(255) | sim |  |  |  |  |
| `public_place` | varchar(255) | sim |  |  |  |  |
| `number` | varchar(255) | sim |  |  |  |  |
| `district` | varchar(255) | sim |  |  |  |  |
| `city` | varchar(255) | sim |  |  |  |  |
| `state` | varchar(255) | sim |  |  |  |  |
| `initials` | varchar(255) | sim |  |  |  |  |
| `cep` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim |  |  |  |  |
| `state_registration` | varchar(60) | sim |  |  |  |  |
| `municipal_registration` | varchar(60) | sim |  |  |  |  |
| `cnae` | varchar(7) | sim |  |  |  |  |
| `crt` | tinyint unsigned | sim |  |  |  |  |
| `legal_nature` | varchar(2) | sim |  |  |  |  |
| `ibs_cbs_indicator` | tinyint unsigned | sim |  |  |  |  |
| `ibge_city_code` | varchar(15) | sim |  |  |  |  |
| `phone_1` | varchar(255) | sim |  |  |  |  |
| `phone_2` | varchar(255) | sim |  |  |  |  |
| `complement` | varchar(255) | sim |  |  |  |  |
| `observation` | longtext | sim |  |  |  |  |
| `number_buy` | varchar(255) | sim |  |  |  |  |
| `date_last_buy` | date | sim |  |  |  |  |
| `date_last_status` | date | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `ddd_phone_1` | int | sim |  |  |  |  |
| `ddd_phone_2` | int | sim |  |  |  |  |
| `street_type` | varchar(255) | sim |  |  |  |  |
| `company_partner` | tinyint(1) | sim |  |  |  |  |
| `company_partner_id` | int | sim | MUL |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `idx_clients_company_partner`: (company_partner_id) · `idx_clients_id_cpf_cnpj`: (id,cpf,cnpj) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.clients_files"></a>bradescoveicweb.clients_files

_Tabela · ~0 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `client_id` | int | sim |  |  |  |  |
| `file` | varchar(255) | sim |  |  |  |  |
| `type` | enum('RG','CPF','CNH','TERMO','COMPROVANTE DE ENDEREÇO','CARTAO CNPJ','QUADRO SOCIETARIO') | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.color_vehicles"></a>bradescoveicweb.color_vehicles

_Tabela · ~142 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.companies"></a>bradescoveicweb.companies

_Tabela · ~284 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `bank_id` | int | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `code` | varchar(50) | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.condition_equipments"></a>bradescoveicweb.condition_equipments

_Tabela · ~0 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `condition_id` | int | sim |  |  |  |  |
| `equipment_id` | int | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.condition_report"></a>bradescoveicweb.condition_report

_Tabela · ~0 linhas (estimativa do InnoDB) · 22 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `vehicle_id` | int unsigned | sim | MUL |  |  |  |
| `courtyard_id` | int | sim |  |  |  |  |
| `bodywork` | varchar(255) | sim |  |  |  |  |
| `doors` | int | sim |  |  |  |  |
| `color_id` | int | sim |  |  |  |  |
| `upholstery` | varchar(255) | sim |  |  |  |  |
| `mileage` | int | sim |  |  |  |  |
| `engine_works` | varchar(255) | sim |  |  |  |  |
| `key` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `additional_information` | longtext | sim |  |  |  |  |
| `internal_notes` | longtext | sim |  |  |  |  |
| `comments` | longtext | sim |  |  |  |  |
| `transmission` | varchar(255) | sim |  |  |  |  |
| `seats` | int | sim |  |  |  |  |
| `tachograph` | int | sim |  |  |  |  |
| `shafts` | int | sim |  |  |  |  |
| `extra_key` | varchar(255) | sim |  |  |  |  |
| `inspector_id` | int unsigned | sim | MUL |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `vehicle_id` → `assets.id`

**Índices:** `condition_report_inspector_id_foreign`: (inspector_id) · `condition_report_vehicle_id_foreign`: (vehicle_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.condition_report_fields"></a>bradescoveicweb.condition_report_fields

_Tabela · ~101 linhas (estimativa do InnoDB) · 15 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `label` | varchar(255) | não |  |  |  |  |
| `type` | enum('text','photo','textarea','radio','check','number','select') | não |  |  |  |  |
| `options` | json | sim |  |  |  |  |
| `required` | tinyint(1) | não |  |  |  |  |
| `order_field` | int | sim |  |  |  |  |
| `placeholder` | varchar(255) | sim |  |  |  |  |
| `section_id` | int | não |  |  |  |  |
| `image_example` | varchar(255) | sim |  |  |  |  |
| `version` | int | não |  |  |  |  |
| `type_vehicle` | enum('LEVE','PESADO','MOTO','MEDIO') | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `active` | tinyint(1) | não |  |  | 1 |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.condition_report_sections"></a>bradescoveicweb.condition_report_sections

_Tabela · ~32 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `order_section` | int | sim |  |  |  |  |
| `version` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `type_vehicle` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `active` | tinyint(1) | não |  |  | 1 |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.condition_reports"></a>bradescoveicweb.condition_reports

_Tabela · ~306.209 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `assets_id` | int | não | MUL |  |  |  |
| `inspector_id` | int | não |  |  |  |  |
| `value` | longtext | não |  |  |  |  |
| `version` | int | não |  |  |  |  |
| `condition_reports_fields_id` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `idx_condition_reports_asset_field`: (assets_id,condition_reports_fields_id,id) · `idx_condition_reports_assets_id`: (assets_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.condition_reports_photos"></a>bradescoveicweb.condition_reports_photos

_Tabela · ~0 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `condition_id` | int | sim |  |  |  |  |
| `commercial` | int | sim |  |  |  |  |
| `photo` | varchar(255) | sim |  |  |  |  |
| `detail` | varchar(255) | sim |  |  |  |  |
| `type` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.condition_reports_tires"></a>bradescoveicweb.condition_reports_tires

_Tabela · ~0 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `condition_id` | int | sim |  |  |  |  |
| `wheel` | varchar(255) | sim |  |  |  |  |
| `condition` | varchar(255) | sim |  |  |  |  |
| `type` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.conditional_parameters"></a>bradescoveicweb.conditional_parameters

_Tabela · ~0 linhas (estimativa do InnoDB) · 4 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `value` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.consulta_molicar"></a>bradescoveicweb.consulta_molicar

_View · ~0 linhas (estimativa do InnoDB) · 7 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `asset_id` | int unsigned | não |  |  | 0 |  |
| `molicar_code` | varchar(255) | sim |  |  |  |  |
| `year_model` | varchar(255) | sim |  |  |  |  |
| `molicar_value` | int | sim |  |  |  |  |
| `reference_date` | date | sim |  |  |  |  |
| `molicar_year` | int | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.costs_per_assets_type"></a>bradescoveicweb.costs_per_assets_type

_Tabela · ~239 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `provider_type` | varchar(255) | sim |  |  |  |  |
| `service_code` | varchar(255) | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.counties"></a>bradescoveicweb.counties

_Tabela · ~0 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int unsigned | sim | MUL |  |  |  |
| `start_date` | date | sim |  |  |  |  |
| `end_date` | date | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `prevision_date` | date | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `asset_id` → `assets.id`

**Índices:** `counties_vehicle_id_foreign`: (asset_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.courtyards"></a>bradescoveicweb.courtyards

_Tabela · ~110 linhas (estimativa do InnoDB) · 32 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `vacancies_limit` | int | sim |  |  |  |  |
| `demonstrative_order` | int | sim |  |  |  |  |
| `active` | int | sim |  |  |  |  |
| `link_google` | varchar(255) | sim |  |  |  |  |
| `daily` | decimal(12,2) | sim |  |  |  |  |
| `photo` | varchar(255) | sim |  |  |  |  |
| `cep` | varchar(255) | sim |  |  |  |  |
| `address` | varchar(255) | sim |  |  |  |  |
| `number` | varchar(255) | sim |  |  |  |  |
| `complement` | varchar(255) | sim |  |  |  |  |
| `district` | varchar(255) | sim |  |  |  |  |
| `city` | varchar(255) | não |  |  |  |  |
| `state` | varchar(255) | não |  |  |  |  |
| `references` | varchar(255) | sim |  |  |  |  |
| `address_google` | varchar(255) | sim |  |  |  |  |
| `approximate_location` | int | sim |  |  |  |  |
| `number_contact` | varchar(255) | sim |  |  |  |  |
| `number_contact_2` | varchar(255) | sim |  |  |  |  |
| `email_contact` | varchar(255) | sim |  |  |  |  |
| `responsible` | varchar(255) | sim |  |  |  |  |
| `support` | varchar(255) | sim |  |  |  |  |
| `contact_description` | varchar(255) | sim |  |  |  |  |
| `payment_form` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `auctioneer_id` | int | sim | MUL |  |  |  |
| `deleted_at` | timestamp | sim | MUL |  |  |  |
| `longitude` | varchar(255) | sim |  |  |  |  |
| `latitude` | varchar(255) | sim |  |  |  |  |
| `report_company_id` | int | sim |  |  |  |  |

**Índices:** `idx_courtyards_auctioneer`: (auctioneer_id) · `idx_courtyards_auctioneer_id`: (auctioneer_id) · `idx_courtyards_deleted_created`: (deleted_at,created_at) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.current_assets_status"></a>bradescoveicweb.current_assets_status

_View · ~0 linhas (estimativa do InnoDB) · 7 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não |  |  | 0 |  |
| `stage` | varchar(255) | não |  |  |  |  |
| `status` | varchar(255) | não |  |  |  |  |
| `user_id` | int | sim |  |  |  |  |
| `asset_id` | int unsigned | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

### <a id="bradescoveicweb.cut_date"></a>bradescoveicweb.cut_date

_Tabela · ~0 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `cut_date` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `hour` | varchar(255) | sim |  |  |  |  |
| `day_of_month` | varchar(255) | sim |  |  |  |  |
| `day_of_week` | varchar(255) | sim |  |  |  |  |
| `is_enabled` | tinyint(1) | não |  |  | 1 |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.d_assessoria"></a>bradescoveicweb.d_assessoria

_View · ~0 linhas (estimativa do InnoDB) · 7 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `name` | varchar(255) | não |  |  |  |  |
| `phone` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim |  |  |  |  |
| `user` | varchar(255) | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.d_bancos"></a>bradescoveicweb.d_bancos

_View · ~0 linhas (estimativa do InnoDB) · 11 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `codigo` | varchar(255) | sim |  |  |  |  |
| `nome` | varchar(255) | sim |  |  |  |  |
| `agencia` | varchar(255) | sim |  |  |  |  |
| `conta` | varchar(255) | sim |  |  |  |  |
| `tipo_transferencia` | enum('Tric Web','Depósito em conta','Boleto Bancário','Depósito Identificado') | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `dias_para_regularizar` | int | não |  |  | 0 |  |
| `codigo_gran` | enum('BRAD','CONS','LEAS','BBFN') | sim |  |  |  |  |

### <a id="bradescoveicweb.d_despachante"></a>bradescoveicweb.d_despachante

_View · ~0 linhas (estimativa do InnoDB) · 22 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `nome` | varchar(255) | sim |  |  |  |  |
| `nome_contato` | varchar(255) | sim |  |  |  |  |
| `telefone` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `rua` | varchar(255) | sim |  |  |  |  |
| `numero` | varchar(255) | sim |  |  |  |  |
| `complemento` | varchar(255) | sim |  |  |  |  |
| `cidade` | varchar(255) | sim |  |  |  |  |
| `estado` | varchar(255) | sim |  |  |  |  |
| `cep` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `centro` | varchar(255) | sim |  |  |  |  |
| `centro_custo` | varchar(255) | sim |  |  |  |  |
| `localizacao` | varchar(255) | sim |  |  |  |  |
| `item_contrato` | varchar(255) | sim |  |  |  |  |
| `id_cliente` | varchar(255) | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.d_documentos"></a>bradescoveicweb.d_documentos

_View · ~0 linhas (estimativa do InnoDB) · 7 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `id_bem` | int unsigned | não |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `tipo` | enum('FOTOS','AUT','MAN','CER','TEA','CRV','CRL','CRLVB','CRLVF','VIS','DUT','DEC','CDM','ATPV','PDR','TDR','PDC','CMON','PPV','OUTROS','TERM_ENTREGA','PET_INI','SEN','NF','BAIXA_SUCATA') | sim |  |  |  |  |
| `caminho` | varchar(255) | não |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |

### <a id="bradescoveicweb.d_empresas"></a>bradescoveicweb.d_empresas

_View · ~0 linhas (estimativa do InnoDB) · 6 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `id_banco` | int | sim |  |  |  |  |
| `nome` | varchar(255) | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |

### <a id="bradescoveicweb.d_eventos"></a>bradescoveicweb.d_eventos

_View · ~0 linhas (estimativa do InnoDB) · 42 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `nome` | varchar(255) | sim |  |  |  |  |
| `ativo` | tinyint(1) | sim |  |  |  |  |
| `destacado_pagina_principal` | tinyint(1) | sim |  |  |  |  |
| `tipo_evento` | enum('Evento','Oportunidade') | sim |  |  |  |  |
| `prioridade` | int | sim |  |  |  |  |
| `situacao` | enum('Cancelado','Baixado','Realizado','Finalizado') | sim |  |  |  |  |
| `data_inicio_evento` | datetime | sim |  |  |  |  |
| `data_fim_evento` | datetime | sim |  |  |  |  |
| `data_inicio_exibicao` | datetime | sim |  |  |  |  |
| `data_fim_exibicao` | datetime | sim |  |  |  |  |
| `imediatamente_apos_fim` | tinyint(1) | sim |  |  |  |  |
| `confirmacao_regulamento_email` | tinyint(1) | sim |  |  |  |  |
| `finalizacao` | enum('Sequencial','Individual') | sim |  |  |  |  |
| `segundos_entre_eventos` | int | sim |  |  |  |  |
| `segundos_minimos` | int | sim |  |  |  |  |
| `segundos_extras` | int | sim |  |  |  |  |
| `local` | varchar(255) | sim |  |  |  |  |
| `regulamento` | varchar(255) | sim |  |  |  |  |
| `descricao_oportunidade` | varchar(255) | sim |  |  |  |  |
| `banner` | varchar(255) | sim |  |  |  |  |
| `comprar_agora` | tinyint(1) | sim |  |  |  |  |
| `disputa_tempo_real` | tinyint(1) | sim |  |  |  |  |
| `remover_site_apos_venda` | tinyint(1) | sim |  |  |  |  |
| `mostrar_cidade` | tinyint(1) | sim |  |  |  |  |
| `propostas` | tinyint(1) | sim |  |  |  |  |
| `propostas_remover_site_apos_venda` | tinyint(1) | sim |  |  |  |  |
| `propostas_mostrar_cidade` | tinyint(1) | sim |  |  |  |  |
| `comprar_agora_remover_site_apos_venda` | tinyint(1) | sim |  |  |  |  |
| `comprar_agora_mostrar_cidade` | tinyint(1) | sim |  |  |  |  |
| `grupo_cliente` | json | sim |  |  |  |  |
| `marca_personalizada` | json | sim |  |  |  |  |
| `etiquetas` | json | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `realizado` | int | sim |  |  | 0 |  |
| `aprovado` | tinyint(1) | não |  |  | 0 |  |
| `data_aprovacao` | datetime | sim |  |  |  |  |
| `aprovado_por` | int | sim |  |  |  |  |
| `cancelado` | tinyint(1) | sim |  |  | 0 |  |

### <a id="bradescoveicweb.d_leiloeiros"></a>bradescoveicweb.d_leiloeiros

_View · ~0 linhas (estimativa do InnoDB) · 27 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `nome` | varchar(255) | não |  |  |  |  |
| `ativo` | int | sim |  |  |  |  |
| `cep` | varchar(255) | sim |  |  |  |  |
| `logradouro` | varchar(255) | sim |  |  |  |  |
| `numero` | varchar(255) | sim |  |  |  |  |
| `complemento` | varchar(255) | sim |  |  |  |  |
| `bairro` | varchar(255) | sim |  |  |  |  |
| `cidade` | varchar(255) | sim |  |  |  |  |
| `estado` | varchar(255) | sim |  |  |  |  |
| `referencias` | varchar(255) | sim |  |  |  |  |
| `numero_contato` | varchar(255) | sim |  |  |  |  |
| `numero_contato_2` | varchar(255) | sim |  |  |  |  |
| `email_contato` | varchar(255) | sim |  |  |  |  |
| `descricao_contato` | varchar(255) | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `nome_importacao` | varchar(255) | sim |  |  |  |  |
| `nome_contato` | varchar(255) | sim |  |  |  |  |
| `id_sla` | int | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `id_cliente` | varchar(255) | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |

🔒 4 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.d_molicar"></a>bradescoveicweb.d_molicar

_View · ~0 linhas (estimativa do InnoDB) · 8 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `identificador` | bigint unsigned | não |  |  | 0 |  |
| `codigo_molicar` | varchar(255) | não |  |  |  |  |
| `valor_molicar` | int | não |  |  |  |  |
| `data_referencia` | date | não |  |  |  |  |
| `data_criacao` | timestamp | sim |  |  |  |  |
| `data_atualizacao` | timestamp | sim |  |  |  |  |
| `ano` | int | não |  |  |  |  |
| `novo` | tinyint(1) | não |  |  | 0 |  |

### <a id="bradescoveicweb.d_patio"></a>bradescoveicweb.d_patio

_View · ~0 linhas (estimativa do InnoDB) · 31 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `nome` | varchar(255) | não |  |  |  |  |
| `limite_vagas` | int | sim |  |  |  |  |
| `ordem_demonstrativa` | int | sim |  |  |  |  |
| `ativo` | int | sim |  |  |  |  |
| `link_google` | varchar(255) | sim |  |  |  |  |
| `diaria` | decimal(12,2) | sim |  |  |  |  |
| `foto` | varchar(255) | sim |  |  |  |  |
| `cep` | varchar(255) | sim |  |  |  |  |
| `endereco` | varchar(255) | sim |  |  |  |  |
| `numero` | varchar(255) | sim |  |  |  |  |
| `complemento` | varchar(255) | sim |  |  |  |  |
| `bairro` | varchar(255) | sim |  |  |  |  |
| `cidade` | varchar(255) | não |  |  |  |  |
| `estado` | varchar(255) | não |  |  |  |  |
| `referencias` | varchar(255) | sim |  |  |  |  |
| `endereco_google` | varchar(255) | sim |  |  |  |  |
| `localizacao_aproximada` | int | sim |  |  |  |  |
| `numero_contato` | varchar(255) | sim |  |  |  |  |
| `numero_contato_2` | varchar(255) | sim |  |  |  |  |
| `email_contato` | varchar(255) | sim |  |  |  |  |
| `responsavel` | varchar(255) | sim |  |  |  |  |
| `suporte` | varchar(255) | sim |  |  |  |  |
| `descricao_contato` | varchar(255) | sim |  |  |  |  |
| `forma_pagamento` | varchar(255) | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `longitude` | varchar(255) | sim |  |  |  |  |
| `latitude` | varchar(255) | sim |  |  |  |  |

### <a id="bradescoveicweb.d_status_regularizao_despachante"></a>bradescoveicweb.d_status_regularizao_despachante

_View · ~0 linhas (estimativa do InnoDB) · 11 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_despacho` | int unsigned | não |  |  | 0 |  |
| `id_despachante` | int | sim |  |  |  |  |
| `id_bem` | int unsigned | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `excluido_em_despacho` | timestamp | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | não |  |  |  |  |
| `observacao_despacho` | text | sim |  |  |  |  |
| `divida_alta` | tinyint(1) | não |  |  | 0 |  |
| `aprovacao_divida_alta` | enum('EM_ANALISE','APROVADO') | sim |  |  |  |  |

### <a id="bradescoveicweb.d_veiculos_bens"></a>bradescoveicweb.d_veiculos_bens

_View · ~0 linhas (estimativa do InnoDB) · 29 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `nome` | varchar(255) | não |  |  |  |  |
| `numero_motor_atual` | varchar(255) | sim |  |  |  |  |
| `numero_motor_original` | varchar(255) | sim |  |  |  |  |
| `potencia_motor` | varchar(255) | sim |  |  |  |  |
| `cilindros` | varchar(255) | sim |  |  |  |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `motor` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `pais_origem` | varchar(255) | sim |  |  |  |  |
| `regiao` | varchar(255) | sim |  |  |  |  |
| `quantidade_eixos` | varchar(255) | sim |  |  |  |  |
| `data_crv_crlv` | date | sim |  |  |  |  |
| `data_licenciamento` | date | sim |  |  |  |  |
| `id_bem` | int | sim |  |  |  |  |
| `tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_bem` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |

🔒 6 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.debt_receipts"></a>bradescoveicweb.debt_receipts

_Tabela · ~122.583 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `receipt_path` | varchar(255) | não |  |  |  |  |
| `dispatch_id` | int | não | MUL |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `contestation_status` | enum('CONTESTADO','APROVADO','REPROVADO') | sim |  |  |  |  |
| `status` | enum('PROCESSANDO','CONCLUIDO') | sim |  |  |  |  |

**Índices:** `idx_debt_receipts_dispatch_id`: (dispatch_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.debts"></a>bradescoveicweb.debts

_Tabela · ~277.810 linhas (estimativa do InnoDB) · 13 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `dispatch_id` | bigint unsigned | não | MUL |  |  |  |
| `type` | varchar(255) | não |  |  |  |  |
| `amount` | decimal(8,2) | não |  |  |  |  |
| `year` | year | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `receipts_id` | int | sim | MUL |  |  |  |
| `payment_group_id` | int | sim | MUL |  |  |  |
| `status_ocr` | enum('NAO_ANALISADO','EM_ANALISE','COMPROVANTE_ACEITO','COMPROVANTE_RECUSADO','ANALISE_CONTESTADA') | sim |  |  |  |  |
| `validation_status` | enum('NAO_VALIDADO','VALIDADO_OCR','VALIDADO_CONFERENCIA','APROVADO_SEM_CONFERENCIA') | não |  |  | NAO_VALIDADO |  |
| `validation_date` | timestamp | sim |  |  |  |  |

**Índices:** `idx_debts_dispatch`: (dispatch_id) · `idx_debts_dispatch_amount`: (dispatch_id,amount) · `idx_debts_dispatch_id`: (dispatch_id) · `idx_debts_payment_group_id`: (payment_group_id) · `idx_debts_payment_group_status_ocr`: (payment_group_id,status_ocr) · `idx_debts_receipts_id`: (receipts_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.debts_files_ocr"></a>bradescoveicweb.debts_files_ocr

_Tabela · ~0 linhas (estimativa do InnoDB) · 11 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `dispatch_id` | int | sim |  |  |  |  |
| `session` | int | sim |  |  |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `file_name` | varchar(255) | sim |  |  |  |  |
| `file_path` | varchar(255) | sim |  |  |  |  |
| `observation` | varchar(255) | sim |  |  |  |  |
| `found` | tinyint(1) | não |  |  | 0 |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.debts_ocr"></a>bradescoveicweb.debts_ocr

_Tabela · ~128.862 linhas (estimativa do InnoDB) · 13 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `dispatch_id` | int | sim |  |  |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `plate` | tinyint(1) | sim |  |  | 0 |  |
| `debts` | tinyint(1) | sim |  |  | 0 |  |
| `observations` | longtext | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `barcode` | tinyint(1) | sim |  |  |  |  |
| `manual_approval` | tinyint(1) | sim |  |  | 0 |  |
| `status` | enum('AGUARDANDO_APROVACAO','APROVADO','REPROVADO') | não |  |  | AGUARDANDO_APROVACAO |  |
| `debt_receipt_id` | int | sim | MUL |  |  |  |

**Índices:** `idx_debts_ocr_debt_receipt_id`: (debt_receipt_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.debts_vehicles"></a>bradescoveicweb.debts_vehicles

_Tabela · ~0 linhas (estimativa do InnoDB) · 11 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `dispatcher_id` | int | sim |  |  |  |  |
| `car_plate` | varchar(255) | sim |  |  |  |  |
| `debt` | varchar(255) | sim |  |  |  |  |
| `value` | decimal(12,2) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `dispatch_id` | int | não |  |  |  |  |
| `final_value` | decimal(12,2) | sim |  |  |  |  |
| `vehicle_id` | int | não |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.devolutions"></a>bradescoveicweb.devolutions

_Tabela · ~73.300 linhas (estimativa do InnoDB) · 20 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `local_origin_id` | int | sim |  |  |  |  |
| `distance_km` | int | sim |  |  |  |  |
| `cost` | decimal(8,2) | sim |  |  |  |  |
| `status` | enum('EM_TRANSITO','DEVOLVIDO','AGUARDANDO_DEVOLUCAO','CANCELADA') | sim |  |  |  |  |
| `cep` | varchar(255) | sim |  |  |  |  |
| `address` | varchar(255) | sim |  |  |  |  |
| `number` | varchar(255) | sim |  |  |  |  |
| `complement` | varchar(255) | sim |  |  |  |  |
| `city` | varchar(255) | sim |  |  |  |  |
| `state` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `in_patio` | tinyint(1) | não |  |  | 0 |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `phone` | varchar(255) | sim |  |  |  |  |
| `completion_date` | date | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.dispatch"></a>bradescoveicweb.dispatch

_Tabela · ~1.089.651 linhas (estimativa do InnoDB) · 42 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `dispatcher_id` | int | sim | MUL |  |  |  |
| `asset_id` | int unsigned | sim | MUL |  |  |  |
| `created_at` | timestamp | sim | MUL |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `finish_date` | datetime | sim | MUL |  |  |  |
| `deleted_at` | timestamp | sim | MUL |  |  |  |
| `status` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | não | MUL |  |  |  |
| `observation` | text | sim |  |  |  |  |
| `high_debt` | tinyint(1) | não |  |  | 0 |  |
| `high_debt_approval` | enum('EM_ANALISE','APROVADO') | sim |  |  |  |  |
| `attached_receipts` | tinyint(1) | sim |  |  |  |  |
| `note_number` | varchar(255) | sim |  |  |  |  |
| `analyzed_ocr` | tinyint(1) | sim |  |  | 0 |  |
| `address` | varchar(255) | sim |  |  |  |  |
| `proof_of_address` | varchar(255) | sim |  |  |  |  |
| `is_reversion` | tinyint(1) | não |  |  | 0 |  |
| `person_type` | enum('FISICA','JURIDICA') | sim |  |  |  |  |
| `proof_of_residence` | varchar(255) | sim |  |  |  |  |
| `social_contract` | varchar(255) | sim |  |  |  |  |
| `rg` | varchar(255) | sim |  |  |  |  |
| `phone_number` | varchar(255) | sim |  |  |  |  |
| `email_address` | varchar(255) | sim |  |  |  |  |
| `court_order_property_transfer` | tinyint(1) | sim |  |  |  |  |
| `vehicle_paid_off` | tinyint(1) | sim |  |  |  |  |
| `early_release` | tinyint(1) | não |  |  | 0 |  |
| `crlv_observation` | longtext | sim |  |  |  |  |
| `ocr_regularization_result` | json | sim |  |  |  |  |
| `is_scrap` | tinyint(1) | sim |  |  | 0 |  |
| `inventory` | varchar(255) | sim |  |  |  |  |
| `high_debts_approved_by` | int | sim |  |  |  |  |
| `high_debts_approval_at` | datetime | sim |  |  |  |  |
| `early_released_at` | timestamp | sim |  |  |  |  |
| `early_released_by` | bigint unsigned | sim | MUL |  |  |  |
| `parent_id` | int unsigned | sim | MUL |  |  |  |
| `repurchase_observation` | longtext | sim |  |  |  |  |
| `date_start_reversion` | timestamp | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Aponta para:** `early_released_by` → `users.id` · `parent_id` → `dispatch.id` · `asset_id` → `assets.id`

**Índices:** `dispatch_asset_id_index`: (asset_id) · `dispatch_early_released_by_foreign`: (early_released_by) · `dispatch_parent_id_foreign`: (parent_id) · `dispatch_status_index`: (status) · `dispatch_vehicle_id_foreign`: (asset_id) · `idx_dispatch_asset_deleted`: (asset_id,deleted_at,id) · `idx_dispatch_asset_id_deleted`: (asset_id,id,deleted_at) · `idx_dispatch_asset_id_id`: (asset_id,id) · `idx_dispatch_asset_maxid`: (asset_id,id) · `idx_dispatch_asset_status`: (asset_id,status) · `idx_dispatch_created_status`: (created_at,status) · `idx_dispatch_deleted_asset`: (deleted_at,asset_id,id) · `idx_dispatch_dispatcher`: (dispatcher_id) · `idx_dispatch_finish_status`: (finish_date,status) · `idx_dispatch_status_is_reversion_id`: (status,is_reversion,id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.dispatch_documents"></a>bradescoveicweb.dispatch_documents

_Tabela · ~689 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `dispatch_id` | int | sim |  |  |  |  |
| `type` | enum('DOC','NOTA','RG','CPF','CNPJ','CNH','COMPROVANTE_DE_RESIDENCIA','CONTRATO_SOCIAL','INVENTARIO') | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.dispatch_services"></a>bradescoveicweb.dispatch_services

_Tabela · ~10.673 linhas (estimativa do InnoDB) · 10 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `dispatcher_id` | int | sim |  |  |  |  |
| `service_name` | varchar(255) | sim |  |  |  |  |
| `cost` | decimal(8,2) | sim |  |  |  |  |
| `uf` | varchar(255) | sim |  |  |  |  |
| `contract` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `sla` | int | não |  |  | 0 |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.dispatch_services_sla_follow_ups"></a>bradescoveicweb.dispatch_services_sla_follow_ups

_Tabela · ~1.024.580 linhas (estimativa do InnoDB) · 11 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `dispatch_id` | int | não | MUL |  |  |  |
| `process` | varchar(255) | não |  |  |  |  |
| `start_date` | date | sim |  |  |  |  |
| `end_date` | date | sim |  |  |  |  |
| `sla` | int | não |  |  |  |  |
| `total_days` | int | sim |  |  |  |  |
| `status` | enum('EM_ANDAMENTO','PAUSADO','FINALIZADO','CANCELADO') | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `idx_dispatch_sla_follow_ups_dispatch_id_id`: (dispatch_id,id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.dispatch_status_follow_up"></a>bradescoveicweb.dispatch_status_follow_up

_Tabela · ~0 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `sla` | int | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.dispatch_status_follow_up_uf"></a>bradescoveicweb.dispatch_status_follow_up_uf

_Tabela · ~0 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `dispatch_status_id` | int unsigned | sim | MUL |  |  |  |
| `uf` | varchar(255) | sim |  |  |  |  |
| `sla` | int | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `dispatch_status_id` → `dispatch_status_follow_up.id`

**Índices:** `dispatch_status_follow_up_uf_dispatch_status_id_foreign`: (dispatch_status_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.dispatch_status_logs"></a>bradescoveicweb.dispatch_status_logs

_Tabela · ~0 linhas (estimativa do InnoDB) · 11 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `dispatch_id` | int | não |  |  |  |  |
| `status_follow_up_id` | int | não |  |  |  |  |
| `substatus_follow_up_id` | int | sim |  |  |  |  |
| `date_end` | date | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `observation` | longtext | sim |  |  |  |  |
| `status_forecast` | date | sim |  |  |  |  |
| `dispatcher_id` | int | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.dispatch_substatus_follow_up"></a>bradescoveicweb.dispatch_substatus_follow_up

_Tabela · ~0 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `status_id` | int unsigned | sim | MUL |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `status_id` → `dispatch_status_follow_up.id`

**Índices:** `PRIMARY` (único): (id) · `substatus_follow_up_status_id_foreign`: (status_id)

### <a id="bradescoveicweb.dispatchers"></a>bradescoveicweb.dispatchers

_Tabela · ~35 linhas (estimativa do InnoDB) · 22 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `contact_name` | varchar(255) | sim |  |  |  |  |
| `phone` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `street` | varchar(255) | sim |  |  |  |  |
| `number` | varchar(255) | sim |  |  |  |  |
| `complement` | varchar(255) | sim |  |  |  |  |
| `city` | varchar(255) | sim |  |  |  |  |
| `state` | varchar(255) | sim |  |  |  |  |
| `cep` | varchar(255) | sim |  |  |  |  |
| `number_contract` | varchar(255) | sim |  |  |  |  |
| `center` | varchar(255) | sim |  |  |  |  |
| `cost_center` | varchar(255) | sim |  |  |  |  |
| `localization` | varchar(255) | sim |  |  |  |  |
| `contract_item` | varchar(255) | sim |  |  |  |  |
| `client_id` | varchar(255) | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `idx_dispatchers_id`: (id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.dispatchers_distributions"></a>bradescoveicweb.dispatchers_distributions

_Tabela · ~0 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `attribute_assets` | varchar(255) | não |  |  |  |  |
| `attribute_data` | varchar(255) | não |  |  |  |  |
| `attribute_value` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.dispatchers_distributions_regionalizations"></a>bradescoveicweb.dispatchers_distributions_regionalizations

_Tabela · ~12 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.dispatchers_distributions_rules"></a>bradescoveicweb.dispatchers_distributions_rules

_Tabela · ~101 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `regionalization_id` | int | sim |  |  |  |  |
| `dispatcher_id` | int | sim |  |  |  |  |
| `percentage` | decimal(12,2) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.dispatchers_regionalizations_ufs"></a>bradescoveicweb.dispatchers_regionalizations_ufs

_Tabela · ~81 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `regionalization_id` | int | sim |  |  |  |  |
| `uf` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.doc_debts"></a>bradescoveicweb.doc_debts

_Tabela · ~0 linhas (estimativa do InnoDB) · 19 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `vehicle_id` | int unsigned | não | MUL |  |  |  |
| `dispatch_id` | int unsigned | sim | MUL |  |  |  |
| `total_ipva` | double | sim |  |  |  |  |
| `total_licensing` | double | sim |  |  |  |  |
| `total_fees` | double | sim |  |  |  |  |
| `total_traffic_tickets` | double | sim |  |  |  |  |
| `total_dpvat` | double | sim |  |  |  |  |
| `total_debts` | double | sim |  |  |  |  |
| `honoraries` | double | sim |  |  |  |  |
| `history_in_origin` | double | sim |  |  |  |  |
| `other_restrictions` | double | sim |  |  |  |  |
| `description` | varchar(255) | sim |  |  |  |  |
| `honoraries_with_restriction` | double | sim |  |  |  |  |
| `total_refundable` | double | sim |  |  |  |  |
| `bank_receipts` | int | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `dispatch_id` → `dispatch.id` · `vehicle_id` → `assets.id`

**Índices:** `doc_debts_dispatch_id_foreign`: (dispatch_id) · `doc_debts_vehicle_id_foreign`: (vehicle_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.document_type_templates"></a>bradescoveicweb.document_type_templates

_Tabela · ~1 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `type_code` | varchar(255) | não |  |  |  |  |
| `file_path` | varchar(255) | não |  |  |  |  |
| `label` | varchar(255) | sim |  |  |  |  |
| `description` | longtext | sim |  |  |  |  |
| `active` | tinyint(1) | não |  |  | 1 |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.documents"></a>bradescoveicweb.documents

_Tabela · ~176.537 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int unsigned | não | MUL |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `type` | enum('FOTOS','AUT','MAN','CER','TEA','CRV','CRL','CRLVB','CRLVF','VIS','DUT','DEC','CDM','ATPV','PDR','TDR','PDC','CMON','PPV','OUTROS','TERM_ENTREGA','PET_INI','SEN','NF','BAIXA_SUCATA') | sim |  |  |  |  |
| `path` | varchar(255) | não |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `asset_id` → `assets.id`

**Índices:** `documents_vehicle_id_foreign`: (asset_id) · `idx_documents_asset_id`: (asset_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.doorman"></a>bradescoveicweb.doorman

_Tabela · ~0 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `courtyard_id` | int | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.email_action_group"></a>bradescoveicweb.email_action_group

_Tabela · ~1 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `email_group_id` | bigint unsigned | não | MUL |  |  |  |
| `email_action_id` | bigint unsigned | não | MUL |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `email_action_id` → `email_actions.id` · `email_group_id` → `email_groups.id`

**Índices:** `email_action_group_email_action_id_foreign`: (email_action_id) · `email_action_group_email_group_id_email_action_id_unique` (único): (email_group_id,email_action_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.email_actions"></a>bradescoveicweb.email_actions

_Tabela · ~4 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `code` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.email_group_user"></a>bradescoveicweb.email_group_user

_Tabela · ~2 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `email_group_id` | bigint unsigned | não | MUL |  |  |  |
| `user_id` | bigint unsigned | não | MUL |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `email_group_id` → `email_groups.id` · `user_id` → `users.id`

**Índices:** `email_group_user_email_group_id_user_id_unique` (único): (email_group_id,user_id) · `email_group_user_user_id_foreign`: (user_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.email_groups"></a>bradescoveicweb.email_groups

_Tabela · ~3 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.email_send_logs"></a>bradescoveicweb.email_send_logs

_Tabela · ~164.393 linhas (estimativa do InnoDB) · 12 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `subject` | varchar(255) | não |  |  |  |  |
| `to_recipients` | json | não |  |  |  |  |
| `cc_recipients` | json | sim |  |  |  |  |
| `template_name` | varchar(255) | sim | MUL |  |  |  |
| `sent_at` | datetime | não | MUL |  |  |  |
| `status` | enum('SUCCESS','ERROR') | não | MUL |  |  |  |
| `error_message` | text | sim |  |  |  |  |
| `provider` | varchar(255) | sim |  |  |  |  |
| `provider_message_id` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `email_send_logs_sent_at_index`: (sent_at) · `email_send_logs_status_index`: (status) · `email_send_logs_template_name_index`: (template_name) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.empf_cr_codes"></a>bradescoveicweb.empf_cr_codes

_Tabela · ~4.998 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `group` | int | sim |  |  |  |  |
| `company` | int | sim |  |  |  |  |
| `branch` | int | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `code` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.event_days_before"></a>bradescoveicweb.event_days_before

_Tabela · ~0 linhas (estimativa do InnoDB) · 4 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `parameter` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.event_pass_attempts"></a>bradescoveicweb.event_pass_attempts

_Tabela · ~0 linhas (estimativa do InnoDB) · 4 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `parameter` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.events"></a>bradescoveicweb.events

_Tabela · ~20.892 linhas (estimativa do InnoDB) · 49 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `active` | tinyint(1) | sim |  |  |  |  |
| `featured_main_page` | tinyint(1) | sim |  |  |  |  |
| `type_event` | enum('Evento','Oportunidade') | sim |  |  |  |  |
| `priority` | int | sim |  |  |  |  |
| `situation` | enum('Cancelado','Baixado','Realizado','Finalizado') | sim |  |  |  |  |
| `legado` | tinyint(1) | não |  |  | 0 |  |
| `finalized_date` | datetime | sim |  |  |  |  |
| `finalized_by` | int | sim |  |  |  |  |
| `sale_notification_sent` | tinyint(1) | não |  |  | 0 |  |
| `event_start_date` | datetime | sim | MUL |  |  |  |
| `event_end_date` | datetime | sim |  |  |  |  |
| `exhibition_start_date` | datetime | sim |  |  |  |  |
| `exhibition_end_date` | datetime | sim |  |  |  |  |
| `immediately_after_end` | tinyint(1) | sim |  |  |  |  |
| `confirmation_regulation_email` | tinyint(1) | sim |  |  |  |  |
| `finalization` | enum('Sequencial','Individual') | sim |  |  |  |  |
| `seconds_between_events` | int | sim |  |  |  |  |
| `seconds_minimum` | int | sim |  |  |  |  |
| `seconds_extra` | int | sim |  |  |  |  |
| `local` | varchar(255) | sim |  |  |  |  |
| `regulation` | varchar(255) | sim |  |  |  |  |
| `opportunity_description` | varchar(255) | sim |  |  |  |  |
| `banner` | varchar(255) | sim |  |  |  |  |
| `buy_now` | tinyint(1) | sim |  |  |  |  |
| `dispute_real_time` | tinyint(1) | sim |  |  |  |  |
| `remove_site_after_sale` | tinyint(1) | sim |  |  |  |  |
| `show_city` | tinyint(1) | sim |  |  |  |  |
| `proposals` | tinyint(1) | sim |  |  |  |  |
| `proposals_remove_site_after_sale` | tinyint(1) | sim |  |  |  |  |
| `proposals_show_city` | tinyint(1) | sim |  |  |  |  |
| `buy_now_remove_site_after_sale` | tinyint(1) | sim |  |  |  |  |
| `buy_now_show_city` | tinyint(1) | sim |  |  |  |  |
| `client_group` | json | sim |  |  |  |  |
| `whitelabel` | json | sim |  |  |  |  |
| `tags` | json | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `auctioneer_id` | int | sim | MUL |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `realized` | int | sim | MUL |  | 0 |  |
| `approved` | tinyint(1) | não |  |  | 0 |  |
| `approval_date` | datetime | sim |  |  |  |  |
| `approved_by` | int | sim |  |  |  |  |
| `canceled` | tinyint(1) | sim |  |  | 0 |  |
| `notice` | varchar(255) | sim |  |  |  |  |
| `catalog` | varchar(255) | sim |  |  |  |  |
| `bare_send_to_financial_log` | json | sim |  |  |  | Log do envio ao financeiro via API Bare - placa, lote, status das etapas |

**Índices:** `idx_events_auctioneer_start_date`: (auctioneer_id,event_start_date) · `idx_events_id_deleted`: (id,deleted_at) · `idx_events_realized`: (realized) · `idx_events_start_date`: (event_start_date,deleted_at) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.events_assets"></a>bradescoveicweb.events_assets

_Tabela · ~1.140.868 linhas (estimativa do InnoDB) · 70 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `event_id` | int | sim | MUL |  |  |  |
| `asset_id` | int unsigned | não | MUL |  |  |  |
| `created_at` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `updated_at` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `client_id` | int unsigned | sim | MUL |  |  |  |
| `sales_channel_id` | int | sim |  |  |  |  |
| `value_fipe` | decimal(12,2) | sim |  |  |  |  |
| `grid` | varchar(255) | sim |  |  |  |  |
| `dmr` | varchar(255) | sim |  |  |  |  |
| `classification` | varchar(255) | sim |  |  |  |  |
| `value_finish` | decimal(12,2) | sim |  |  |  |  |
| `final_value_imported_at` | timestamp | sim |  |  |  |  |
| `nf_number` | varchar(255) | sim |  |  |  |  |
| `nf_serie_number` | varchar(255) | sim |  |  |  |  |
| `nf_generated_date` | date | sim |  |  |  |  |
| `nf_status` | varchar(255) | sim |  |  |  |  |
| `nf_rejection_reason` | varchar(255) | sim |  |  |  |  |
| `nf_message` | varchar(255) | sim |  |  |  |  |
| `nf_access_key` | varchar(255) | sim |  |  |  |  |
| `invoice` | varchar(255) | sim |  |  |  |  |
| `trv` | varchar(255) | sim |  |  |  |  |
| `molicar` | double | sim |  |  |  |  |
| `ad_id` | int | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim | MUL |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `batch_observation` | longtext | sim |  |  |  |  |
| `discount` | double | sim |  |  |  |  |
| `payment_voucher` | varchar(255) | sim |  |  |  |  |
| `payment_checkout` | varchar(255) | sim |  |  |  |  |
| `value_with_fees` | decimal(12,2) | sim |  |  |  |  |
| `auctioneer_classification` | varchar(255) | sim |  |  |  |  |
| `note_number` | int | sim |  |  |  |  |
| `reason_for_exclusion` | longtext | sim |  |  |  |  |
| `exclusion_doc` | varchar(255) | sim |  |  |  |  |
| `user_id_invoice` | int | sim |  |  |  |  |
| `initial_value` | decimal(12,2) | sim |  |  |  |  |
| `vehicle_pricing` | decimal(12,2) | sim |  |  |  |  |
| `after_sales_id` | int | sim |  |  |  |  |
| `payment_checkout_user_id` | int unsigned | sim |  |  |  |  |
| `type_note` | varchar(255) | sim |  |  |  |  |
| `deleted_at` | timestamp | sim | MUL |  |  |  |
| `user_id` | int | sim |  |  |  | user_id é referente ao aprovador |
| `number_batch` | varchar(255) | sim |  |  |  |  |
| `bare_lot_number` | varchar(255) | sim |  |  |  | Número do lote retornado pela API BARE |
| `last_event_id` | int | sim |  |  |  |  |
| `blocked_by_rest` | tinyint(1) | sim |  |  |  |  |
| `counter_proposal_value` | decimal(12,2) | sim |  |  |  |  |
| `historical_average_value` | decimal(8,2) | sim |  |  |  |  |
| `info` | text | sim |  |  |  |  |
| `resolved` | tinyint(1) | sim |  |  |  |  |
| `has_restriction` | tinyint(1) | sim |  |  |  |  |
| `restriction_query_date` | timestamp | sim |  |  |  |  |
| `conditional_verified_by_id` | bigint unsigned | sim | MUL |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `fee_value` | decimal(12,2) | sim |  |  |  |  |
| `commission_value` | decimal(12,2) | sim |  |  |  |  |
| `other_services_value` | decimal(12,2) | sim |  |  |  |  |
| `credited_value` | decimal(12,2) | sim |  |  |  |  |
| `credit_date` | date | sim |  |  |  |  |
| `sale_type` | enum('On-line','Presencial') | sim |  |  |  |  |
| `payment_date` | date | sim |  |  |  |  |
| `payment_method` | varchar(255) | sim |  |  |  |  |
| `counter_proposal_created_by` | bigint unsigned | sim | MUL |  |  |  |
| `counter_proposal_created_at` | datetime | sim |  |  |  |  |
| `email_sent` | tinyint(1) | não |  |  | 0 |  |
| `value_finish_poc` | decimal(9,2) | sim |  |  |  |  |
| `rest_checked` | tinyint(1) | sim |  |  |  |  |
| `repurchase` | tinyint(1) | sim |  |  |  |  |
| `motive_transfer` | text | sim |  |  |  |  |

**Aponta para:** `conditional_verified_by_id` → `users.id` · `counter_proposal_created_by` → `users.id` · `client_id` → `clients.id` · `asset_id` → `assets.id`

**Índices:** `events_assets_conditional_verified_by_id_foreign`: (conditional_verified_by_id) · `events_assets_counter_proposal_created_by_foreign`: (counter_proposal_created_by) · `events_vehicles_client_id_foreign`: (client_id) · `events_vehicles_vehicle_id_foreign`: (asset_id) · `idx_asset_client`: (asset_id,client_id) · `idx_asset_id_id`: (asset_id,id) · `idx_ea_event_asset`: (deleted_at,event_id,asset_id) · `idx_event_client`: (event_id,client_id,status) · `idx_event_status`: (event_id,status) · `idx_events_assets_asset_id`: (asset_id,id) · `idx_events_assets_asset_id_id`: (asset_id,id) · `idx_events_assets_asset_maxid`: (asset_id,id) · `idx_events_assets_asset_status`: (asset_id,status,id) · `idx_events_assets_deleted_asset`: (deleted_at,asset_id,id) · `idx_events_assets_event_asset`: (event_id,asset_id) · `idx_events_assets_event_id`: (event_id,status,deleted_at) · `idx_events_assets_event_status`: (event_id,status,deleted_at) · `idx_events_assets_sold_filter`: (status,asset_id,event_id) · `idx_events_assets_status_deleted`: (status,deleted_at) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.events_assets_logs_transfers"></a>bradescoveicweb.events_assets_logs_transfers

_Tabela · ~14.588 linhas (estimativa do InnoDB) · 12 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `new_event_id` | int | sim |  |  |  |  |
| `old_event_id` | int | sim |  |  |  |  |
| `new_event_asset_id` | int | sim |  |  |  |  |
| `old_event_asset_id` | int | sim |  |  |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `user_id` | int | sim |  |  |  |  |
| `type_user` | enum('API','USER') | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.events_discounts"></a>bradescoveicweb.events_discounts

_Tabela · ~0 linhas (estimativa do InnoDB) · 4 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `value` | decimal(12,2) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.events_tags"></a>bradescoveicweb.events_tags

_Tabela · ~30.562 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `auction_id` | int | sim |  |  |  |  |
| `tag_id` | int | sim | MUL |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `idx_events_tags_tag_id_auction_id`: (tag_id,auction_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.evidence_high_debts"></a>bradescoveicweb.evidence_high_debts

_Tabela · ~5 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `dispatch_id` | int | sim |  |  |  |  |
| `file` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.ex_use_asset_bids"></a>bradescoveicweb.ex_use_asset_bids

_Tabela · ~618 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `bid_value` | decimal(12,2) | não |  |  |  |  |
| `winning_bidder` | tinyint(1) | não |  |  |  |  |
| `ex_use_asset_event_id` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.ex_use_asset_documents"></a>bradescoveicweb.ex_use_asset_documents

_Tabela · ~2.226 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `ex_use_asset_event_id` | bigint unsigned | não | MUL |  |  |  |
| `url` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `ex_use_asset_event_id` → `ex_use_asset_events.id`

**Índices:** `ex_use_asset_documents_ex_use_asset_event_id_foreign`: (ex_use_asset_event_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.ex_use_asset_events"></a>bradescoveicweb.ex_use_asset_events

_Tabela · ~324 linhas (estimativa do InnoDB) · 21 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `junction` | varchar(255) | não |  |  |  |  |
| `assets_local` | varchar(255) | não |  |  |  |  |
| `seller_name` | varchar(255) | não |  |  |  |  |
| `sale_value` | decimal(12,2) | sim |  |  |  |  |
| `acquisition_value` | decimal(12,2) | sim |  |  |  |  |
| `depreciation_value` | decimal(12,2) | sim |  |  |  |  |
| `observation` | longtext | sim |  |  |  |  |
| `sale_reason` | varchar(255) | sim |  |  |  |  |
| `sold` | tinyint(1) | não |  |  | 0 |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `is_canceled` | tinyint(1) | não |  |  | 0 |  |
| `reason_for_cancellation` | varchar(255) | sim |  |  |  |  |
| `batch_receipt_date` | date | sim |  |  |  |  |
| `uf` | varchar(255) | sim |  |  |  |  |
| `doc_path` | varchar(255) | sim |  |  |  |  |
| `sales_process` | enum('VENDA_PATRIMONIO','VENDA_PRAÇA','LEILAO','ARIBA') | sim |  |  |  |  |
| `origin_demand` | enum('BENS_DE_DEPARTAMENTOS','BENS_DA_REDE','ORGANIZACAO','LIGADAS') | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.ex_use_asset_photos"></a>bradescoveicweb.ex_use_asset_photos

_Tabela · ~1.472 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `ex_use_asset_event_id` | int | não |  |  |  |  |
| `url` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.ex_use_assets"></a>bradescoveicweb.ex_use_assets

_Tabela · ~1.535 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `quantity` | int | não |  |  |  |  |
| `item_codes` | json | não |  |  |  |  |
| `ex_use_asset_event_id` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.f_assessoria"></a>bradescoveicweb.f_assessoria

_View · ~0 linhas (estimativa do InnoDB) · 115 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `nome` | varchar(255) | não |  |  |  |  |
| `numero_motor_atual` | varchar(255) | sim |  |  |  |  |
| `numero_motor_original` | varchar(255) | sim |  |  |  |  |
| `potencia_motor` | varchar(255) | sim |  |  |  |  |
| `cilindros` | varchar(255) | sim |  |  |  |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `motor` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `pais_origem` | varchar(255) | sim |  |  |  |  |
| `regiao` | varchar(255) | sim |  |  |  |  |
| `quantidade_eixos` | varchar(255) | sim |  |  |  |  |
| `data_crv_crlv` | date | sim |  |  |  |  |
| `data_licenciamento` | date | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `nome_financiado_segurado` | varchar(255) | sim |  |  |  |  |
| `identificacao_contrato` | varchar(255) | sim |  |  |  |  |
| `identificacao_sinistro` | varchar(255) | sim |  |  |  |  |
| `recebido_por` | varchar(255) | sim |  |  |  |  |
| `nome_proprietario_anterior` | varchar(255) | sim |  |  |  |  |
| `nome_proprietario_atual` | varchar(255) | sim |  |  |  |  |
| `carteira` | varchar(255) | sim |  |  |  |  |
| `tipo_remocao` | varchar(255) | sim |  |  |  |  |
| `id_assessoria` | int | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `crivo` | tinyint(1) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `transmissao` | enum('automatico','manual','automatizado') | sim |  |  |  |  |
| `tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `descricao` | varchar(255) | sim |  |  |  |  |
| `numero_serie` | varchar(255) | sim |  |  |  |  |
| `id_bem` | int | sim |  |  |  |  |
| `gcpj` | varchar(255) | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `conta` | varchar(255) | sim |  |  |  |  |
| `agencia` | varchar(255) | sim |  |  |  |  |
| `financiado` | varchar(255) | sim |  |  |  |  |
| `id_tag` | int | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `contador_eventos` | int | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `valor_sugerido` | decimal(10,2) | sim |  |  |  |  |
| `observacao_bloqueio` | varchar(1000) | sim |  |  |  |  |
| `data_solicitacao_bloqueio` | date | sim |  |  |  |  |
| `data_bloqueio` | date | sim |  |  |  |  |
| `id_assessoria_especial` | int | sim |  |  |  |  |
| `judicial` | tinyint(1) | não |  |  | 0 |  |
| `centro_custo` | varchar(50) | sim |  |  |  |  |
| `codigo_empresa_a` | varchar(20) | sim |  |  |  |  |
| `codigo_agencia_a` | varchar(20) | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `numero_parcelas` | varchar(5) | sim |  |  |  |  |
| `numero_parcelas_pagas` | varchar(5) | sim |  |  |  |  |
| `numero_parcelas_atraso` | varchar(5) | sim |  |  |  |  |
| `data_base` | varchar(10) | sim |  |  |  |  |
| `valor_operacao` | varchar(15) | sim |  |  |  |  |
| `data_contabil` | varchar(10) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `data_bndu` | varchar(10) | sim |  |  |  |  |
| `troca_garantia` | varchar(3) | sim |  |  |  |  |
| `liquida` | varchar(3) | sim |  |  |  |  |
| `troca` | varchar(3) | sim |  |  |  |  |
| `administrativo` | tinyint(1) | não |  |  | 0 |  |
| `retorno` | tinyint(1) | não |  |  | 0 |  |
| `pessoa_juridica` | tinyint(1) | não |  |  | 0 |  |
| `consorcio` | tinyint(1) | não |  |  | 0 |  |
| `restituicao` | tinyint(1) | não |  |  | 0 |  |
| `importado` | tinyint(1) | sim |  |  |  |  |
| `valor_medio_historico` | decimal(8,2) | sim |  |  |  |  |
| `salvo` | text | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `compensado` | tinyint(1) | sim |  |  |  |  |
| `status_contrato` | enum('REATIVADO','QUITADO') | sim |  |  |  |  |
| `status_motivacao` | enum('DETERMINACAO_JUDICIAL','PURGA_DA_MORA','ACORDO','APREENSAO_INDEVIDA') | sim |  |  |  |  |
| `nome_empresa` | varchar(100) | sim |  |  |  |  |
| `endereco_completo` | varchar(150) | sim |  |  |  |  |
| `cep` | varchar(9) | sim |  |  |  |  |
| `tipo_status_veiculo` | varchar(50) | sim |  |  |  |  |
| `valor_debito_ipva` | varchar(50) | sim |  |  |  |  |
| `valor_debito_licenciamento` | varchar(50) | sim |  |  |  |  |
| `valor_debito_multas` | varchar(50) | sim |  |  |  |  |
| `valor_debito_dpvat` | varchar(50) | sim |  |  |  |  |
| `prazo_restricao_fiscal` | varchar(50) | sim |  |  |  |  |
| `regularizacao_bloqueada` | int | não |  |  | 0 |  |
| `rcb` | tinyint(1) | não |  |  | 0 |  |
| `Importacao` | tinyint(1) | sim |  |  |  |  |

🔒 11 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_consolidado_dispatch_pendencies"></a>bradescoveicweb.f_consolidado_dispatch_pendencies

_View · ~0 linhas (estimativa do InnoDB) · 20 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_despacho` | int unsigned | não |  |  | 0 |  |
| `id_despachante` | int | sim |  |  |  |  |
| `id_bem` | int unsigned | sim |  |  |  |  |
| `criado_em_despacho` | timestamp | sim |  |  |  |  |
| `atualizado_em_despacho` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | não |  |  |  |  |
| `observacao_despacho` | text | sim |  |  |  |  |
| `divida_alta` | tinyint(1) | não |  |  | 0 |  |
| `aprovacao_divida_alta` | enum('EM_ANALISE','APROVADO') | sim |  |  |  |  |
| `id_pendencia` | bigint unsigned | sim |  |  | 0 |  |
| `tipo_pendencia` | varchar(255) | sim |  |  |  |  |
| `motivo_pendencia` | text | sim |  |  |  |  |
| `observacao_pendencia` | text | sim |  |  |  |  |
| `data_resolucao_pendencia` | date | sim |  |  |  |  |
| `resolucao_pendencia` | text | sim |  |  |  |  |
| `status_pendencia` | enum('EM_ANALISE','RESOLVIDO','CANCELADO') | sim |  |  |  |  |
| `criado_em_pendencia` | timestamp | sim |  |  |  |  |
| `atualizado_em_pendencia` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_consulta_documentos_vendas"></a>bradescoveicweb.f_consulta_documentos_vendas

_View · ~0 linhas (estimativa do InnoDB) · 19 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_evento` | int unsigned | não |  |  | 0 |  |
| `data_inicio_evento` | datetime | sim |  |  |  |  |
| `realized` | int | sim |  |  | 0 |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `nome_leilao` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | não |  |  |  |  |
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `banco` | varchar(255) | sim |  |  |  |  |
| `motivo` | varchar(255) | sim |  |  |  |  |
| `valor_venda` | decimal(12,2) | sim |  |  |  |  |
| `nome_cliente` | varchar(255) | sim |  |  |  |  |
| `atpv_enviado` | varchar(11) | não |  |  |  |  |
| `nota_venda_enviada` | varchar(11) | não |  |  |  |  |
| `status_log_rest (±3 dias do evento)` | varchar(14) | não |  |  |  |  |
| `rn` | bigint unsigned | não |  |  | 0 |  |

🔒 3 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_despachante"></a>bradescoveicweb.f_despachante

_View · ~0 linhas (estimativa do InnoDB) · 12 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_despacho` | int unsigned | não |  |  | 0 |  |
| `id_despachante` | int | sim |  |  |  |  |
| `id_bem` | int unsigned | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `excluido_em_despacho` | timestamp | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | não |  |  |  |  |
| `observacao_despacho` | text | sim |  |  |  |  |
| `divida_alta` | tinyint(1) | não |  |  | 0 |  |
| `aprovacao_divida_alta` | enum('EM_ANALISE','APROVADO') | sim |  |  |  |  |
| `lançamento_antecipado` | tinyint(1) | não |  |  | 0 |  |

### <a id="bradescoveicweb.f_despachante2"></a>bradescoveicweb.f_despachante2

_View · ~0 linhas (estimativa do InnoDB) · 33 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_despacho` | int unsigned | não |  |  | 0 |  |
| `id_despachante` | int | sim |  |  |  |  |
| `id_bem` | int unsigned | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `excluido_em_despacho` | timestamp | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | não |  |  |  |  |
| `observacao_despacho` | text | sim |  |  |  |  |
| `divida_alta` | tinyint(1) | não |  |  | 0 |  |
| `aprovacao_divida_alta` | enum('EM_ANALISE','APROVADO') | sim |  |  |  |  |
| `comprovantes_anexados` | tinyint(1) | sim |  |  |  |  |
| `numero_nota` | varchar(255) | sim |  |  |  |  |
| `ocr_analisado` | tinyint(1) | sim |  |  | 0 |  |
| `endereco` | varchar(255) | sim |  |  |  |  |
| `comprovante_endereco` | varchar(255) | sim |  |  |  |  |
| `reversao` | tinyint(1) | não |  |  | 0 |  |
| `tipo_pessoa` | enum('FISICA','JURIDICA') | sim |  |  |  |  |
| `comprovante_residencia` | varchar(255) | sim |  |  |  |  |
| `contrato_social` | varchar(255) | sim |  |  |  |  |
| `numero_telefone` | varchar(255) | sim |  |  |  |  |
| `endereco_email` | varchar(255) | sim |  |  |  |  |
| `ordem_juicial_transferencia_propriedade` | tinyint(1) | sim |  |  |  |  |
| `veiculo_pago` | tinyint(1) | sim |  |  |  |  |
| `liberacao_antecipada` | tinyint(1) | não |  |  | 0 |  |
| `observacao_crlv` | longtext | sim |  |  |  |  |
| `sucata` | tinyint(1) | sim |  |  | 0 |  |

🔒 6 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_entradas"></a>bradescoveicweb.f_entradas

_View · ~0 linhas (estimativa do InnoDB) · 26 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_assessoria` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `importado` | tinyint(1) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao` | varchar(255) | sim |  |  |  |  |
| `status_evento` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_enviados_despachantes"></a>bradescoveicweb.f_enviados_despachantes

_View · ~0 linhas (estimativa do InnoDB) · 48 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `Tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_estoque_despachante"></a>bradescoveicweb.f_estoque_despachante

_View · ~0 linhas (estimativa do InnoDB) · 47 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `Tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_estoquenew"></a>bradescoveicweb.f_estoquenew

_View · ~0 linhas (estimativa do InnoDB) · 34 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_assessoria` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `importado` | tinyint(1) | sim |  |  |  |  |
| `removal_id` | int unsigned | sim |  |  | 0 |  |
| `data_apreensao` | varchar(255) | sim |  |  |  |  |
| `origem_endereco` | varchar(255) | sim |  |  |  |  |
| `origem_cidade` | varchar(255) | sim |  |  |  |  |
| `origem_UF` | varchar(255) | sim |  |  |  |  |
| `destino_cidade` | varchar(255) | sim |  |  |  |  |
| `destino_UF` | varchar(255) | sim |  |  |  |  |
| `destino_endereco` | varchar(255) | sim |  |  |  |  |
| `destino_numero` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `status_evento` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_eventos"></a>bradescoveicweb.f_eventos

_View · ~0 linhas (estimativa do InnoDB) · 63 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `identificador` | int unsigned | não |  |  | 0 |  |
| `identificador_evento` | int | sim |  |  |  |  |
| `identificador_ativo` | int unsigned | não |  |  |  |  |
| `criado_em` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `atualizado_em` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `identificador_cliente` | int unsigned | sim |  |  |  |  |
| `identificador_canal_vendas` | int | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `grade` | varchar(255) | sim |  |  |  |  |
| `dmr` | varchar(255) | sim |  |  |  |  |
| `classificacao` | varchar(255) | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `nota_fiscal` | varchar(255) | sim |  |  |  |  |
| `trv` | varchar(255) | sim |  |  |  |  |
| `identificador_anuncio` | int | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `observacao_lote` | longtext | sim |  |  |  |  |
| `desconto` | double | sim |  |  |  |  |
| `comprovante_pagamento` | varchar(255) | sim |  |  |  |  |
| `checkout_pagamento` | varchar(255) | sim |  |  |  |  |
| `valor_com_taxas` | decimal(12,2) | sim |  |  |  |  |
| `classificacao_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `numero_nota` | int | sim |  |  |  |  |
| `motivo_exclusao` | longtext | sim |  |  |  |  |
| `identificador_usuario_nota_fiscal` | int | sim |  |  |  |  |
| `valor_inicial` | decimal(12,2) | sim |  |  |  |  |
| `precificacao_veiculo` | decimal(12,2) | sim |  |  |  |  |
| `identificador_pos_venda` | int | sim |  |  |  |  |
| `identificador_usuario_checkout` | int unsigned | sim |  |  |  |  |
| `tipo_nota` | varchar(255) | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `identificador_usuario` | int | sim |  |  |  | user_id é referente ao aprovador |
| `numero_lote` | varchar(255) | sim |  |  |  |  |
| `identificador_ultimo_evento` | int | sim |  |  |  |  |
| `bloqueado_por_restricoes` | tinyint(1) | sim |  |  |  |  |
| `valor_contra_proposta` | decimal(12,2) | sim |  |  |  |  |
| `valor_medio_historico` | decimal(8,2) | sim |  |  |  |  |
| `informacoes` | text | sim |  |  |  |  |
| `resolvido` | tinyint(1) | sim |  |  |  |  |
| `data_inicio_evento` | datetime | sim |  |  |  |  |
| `data_fim_evento` | datetime | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `identificador_banco` | int | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_molicar_tabela_molicar` | int | sim |  |  |  |  |
| `data_referencia` | date | sim |  |  |  |  |
| `ano` | int | sim |  |  |  |  |
| `novo` | tinyint(1) | sim |  |  | 0 |  |
| `id_despacho` | int unsigned | sim |  |  | 0 |  |
| `id_despachante` | int | sim |  |  |  |  |
| `id_bem` | int unsigned | sim |  |  |  |  |
| `criado_em_despacho` | timestamp | sim |  |  |  |  |
| `atualizado_em_despacho` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `excluido_em_despacho` | timestamp | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `observacao_despacho` | text | sim |  |  |  |  |
| `divida_alta` | tinyint(1) | sim |  |  | 0 |  |
| `aprovacao_divida_alta` | enum('EM_ANALISE','APROVADO') | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_patio"></a>bradescoveicweb.f_patio

_View · ~0 linhas (estimativa do InnoDB) · 22 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `id_patio` | int | não |  |  |  |  |
| `id_veiculo` | int unsigned | não |  |  |  |  |
| `id_ordem_servico` | int | sim |  |  |  |  |
| `id_remocao` | int | sim |  |  |  |  |
| `id_usuario` | int | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `veiculo` | varchar(255) | sim |  |  |  |  |
| `motivo` | varchar(255) | sim |  |  |  |  |
| `entregue_para` | varchar(255) | sim |  |  |  |  |
| `tipo_retorno` | varchar(255) | sim |  |  |  |  |
| `observacao` | varchar(255) | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `caminho_arquivo` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_pendencias"></a>bradescoveicweb.f_pendencias

_View · ~0 linhas (estimativa do InnoDB) · 12 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_pendencia` | bigint unsigned | não |  |  | 0 |  |
| `id_despacho` | bigint unsigned | não |  |  |  |  |
| `tipo_pendencia` | varchar(255) | não |  |  |  |  |
| `motivo_pendencia` | text | sim |  |  |  |  |
| `observacao_pendencia` | text | sim |  |  |  |  |
| `data_resolucao_pendencia` | date | sim |  |  |  |  |
| `resolucao_pendencia` | text | sim |  |  |  |  |
| `status_pendencia` | enum('EM_ANALISE','RESOLVIDO','CANCELADO') | sim |  |  |  |  |
| `criado_em_pendencia` | timestamp | sim |  |  |  |  |
| `atualizado_em_pendencia` | timestamp | sim |  |  |  |  |
| `excluido_em_pendencia` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_regularizados"></a>bradescoveicweb.f_regularizados

_View · ~0 linhas (estimativa do InnoDB) · 47 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `Tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_regularizados_despachante"></a>bradescoveicweb.f_regularizados_despachante

_View · ~0 linhas (estimativa do InnoDB) · 48 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `Tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `dispatcher_id` | int | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_remocoes"></a>bradescoveicweb.f_remocoes

_View · ~0 linhas (estimativa do InnoDB) · 33 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `id_local` | int | não |  |  |  |  |
| `id_destino_local` | int | não |  |  |  |  |
| `data_previsao_fim_municipio` | date | sim |  |  |  |  |
| `data_inicio_prevista` | date | sim |  |  |  |  |
| `data_fim_prevista` | date | sim |  |  |  |  |
| `data_inicio_real` | date | sim |  |  |  |  |
| `data_fim_real` | date | sim |  |  |  |  |
| `valor_remocao` | decimal(12,2) | sim |  |  |  |  |
| `informacoes` | varchar(255) | sim |  |  |  |  |
| `data_criacao` | timestamp | sim |  |  |  |  |
| `data_atualizacao` | timestamp | sim |  |  |  |  |
| `codigo_status` | varchar(255) | não |  |  | 0 |  |
| `data_apreensao` | varchar(255) | sim |  |  |  |  |
| `id_leiloeiro_responsavel` | int | sim |  |  |  |  |
| `id_assessoria_responsavel` | int | sim |  |  |  |  |
| `id_ativo` | int | não |  |  |  |  |
| `distancia_km` | decimal(5,1) | não |  |  |  |  |
| `id_sla_remocao` | int | sim |  |  |  |  |
| `nota_cancelamento` | longtext | sim |  |  |  |  |
| `data_exclusao` | timestamp | sim |  |  |  |  |
| `dias_sla` | int | sim |  |  |  |  |
| `recebido` | tinyint(1) | sim |  |  |  |  |
| `habilitacao_pedido_frustracao_remocao` | tinyint(1) | não |  |  | 0 |  |
| `id_leiloeiro_assets` | int | sim |  |  |  |  |
| `id_assessoria_assets` | int | sim |  |  |  |  |
| `origem_endereco` | varchar(255) | sim |  |  |  |  |
| `origem_cidade` | varchar(255) | sim |  |  |  |  |
| `origem_uf` | varchar(255) | sim |  |  |  |  |
| `destino_cidade` | varchar(255) | sim |  |  |  |  |
| `destino_uf` | varchar(255) | sim |  |  |  |  |
| `destino_endereco` | varchar(255) | sim |  |  |  |  |
| `destino_numero` | varchar(255) | sim |  |  |  |  |

### <a id="bradescoveicweb.f_status_ativos"></a>bradescoveicweb.f_status_ativos

_View · ~0 linhas (estimativa do InnoDB) · 7 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `identificador` | bigint unsigned | não |  |  | 0 |  |
| `etapa` | varchar(255) | não |  |  |  |  |
| `situacao` | varchar(255) | não |  |  |  |  |
| `usuario_id` | int | sim |  |  |  |  |
| `ativo_id` | int unsigned | não |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |

### <a id="bradescoveicweb.f_users"></a>bradescoveicweb.f_users

_View · ~0 linhas (estimativa do InnoDB) · 16 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não |  |  | 0 |  |
| `name` | varchar(255) | não |  |  |  |  |
| `email` | varchar(255) | não |  |  |  |  |
| `email_verified_at` | timestamp | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `signature` | varchar(255) | sim |  |  |  |  |
| `active` | tinyint(1) | não |  |  | 1 |  |
| `type` | enum('ADVISORY','SPECIAL_ADVISORY','AUCTIONEER','BACKOFFICE','DISPATCHER','BACKOFFICE_ADMIN','REPORT_COMPANY','DISPATCH_ADMIN') | sim |  |  |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `advisory_id` | int | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `dispatcher_id` | int | sim |  |  |  |  |
| `special_advisory_id` | int | sim |  |  |  |  |
| `report_company_id` | int unsigned | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.f_vendas"></a>bradescoveicweb.f_vendas

_View · ~0 linhas (estimativa do InnoDB) · 62 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `identificador` | int unsigned | não |  |  | 0 |  |
| `identificador_evento` | int | sim |  |  |  |  |
| `identificador_ativo` | int unsigned | não |  |  |  |  |
| `criado_em` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `atualizado_em` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `identificador_cliente` | int unsigned | sim |  |  |  |  |
| `identificador_canal_vendas` | int | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `grade` | varchar(255) | sim |  |  |  |  |
| `dmr` | varchar(255) | sim |  |  |  |  |
| `classificacao` | varchar(255) | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `nota_fiscal` | varchar(255) | sim |  |  |  |  |
| `trv` | varchar(255) | sim |  |  |  |  |
| `identificador_anuncio` | int | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `observacao_lote` | longtext | sim |  |  |  |  |
| `desconto` | double | sim |  |  |  |  |
| `comprovante_pagamento` | varchar(255) | sim |  |  |  |  |
| `checkout_pagamento` | varchar(255) | sim |  |  |  |  |
| `valor_com_taxas` | decimal(12,2) | sim |  |  |  |  |
| `classificacao_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `numero_nota` | int | sim |  |  |  |  |
| `motivo_exclusao` | longtext | sim |  |  |  |  |
| `identificador_usuario_nota_fiscal` | int | sim |  |  |  |  |
| `valor_inicial` | decimal(12,2) | sim |  |  |  |  |
| `precificacao_veiculo` | decimal(12,2) | sim |  |  |  |  |
| `identificador_pos_venda` | int | sim |  |  |  |  |
| `identificador_usuario_checkout` | int unsigned | sim |  |  |  |  |
| `tipo_nota` | varchar(255) | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `identificador_usuario` | int | sim |  |  |  | user_id é referente ao aprovador |
| `numero_lote` | varchar(255) | sim |  |  |  |  |
| `identificador_ultimo_evento` | int | sim |  |  |  |  |
| `bloqueado_por_restricoes` | tinyint(1) | sim |  |  |  |  |
| `valor_contra_proposta` | decimal(12,2) | sim |  |  |  |  |
| `valor_medio_historico` | decimal(8,2) | sim |  |  |  |  |
| `informacoes` | text | sim |  |  |  |  |
| `resolvido` | tinyint(1) | sim |  |  |  |  |
| `data_inicio_evento` | datetime | sim |  |  |  |  |
| `data_fim_evento` | datetime | sim |  |  |  |  |
| `identificador_banco` | int | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_molicar_tabela_molicar` | int | sim |  |  |  |  |
| `data_referencia` | date | sim |  |  |  |  |
| `ano` | int | sim |  |  |  |  |
| `novo` | tinyint(1) | sim |  |  | 0 |  |
| `id_despacho` | int unsigned | sim |  |  | 0 |  |
| `id_despachante` | int | sim |  |  |  |  |
| `id_bem` | int unsigned | sim |  |  |  |  |
| `criado_em_despacho` | timestamp | sim |  |  |  |  |
| `atualizado_em_despacho` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `excluido_em_despacho` | timestamp | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `observacao_despacho` | text | sim |  |  |  |  |
| `divida_alta` | tinyint(1) | sim |  |  | 0 |  |
| `aprovacao_divida_alta` | enum('EM_ANALISE','APROVADO') | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.failed_jobs"></a>bradescoveicweb.failed_jobs

_Tabela · ~1.903 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `uuid` | varchar(255) | não | UNI |  |  |  |
| `connection` | text | não |  |  |  |  |
| `queue` | text | não |  |  |  |  |
| `payload` | longtext | não |  |  |  |  |
| `exception` | longtext | não |  |  |  |  |
| `failed_at` | timestamp | não |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `failed_jobs_uuid_unique` (único): (uuid) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.fipe"></a>bradescoveicweb.fipe

_Tabela · ~0 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `fipe_code` | varchar(255) | não |  |  |  |  |
| `fipe_value` | int | não |  |  |  |  |
| `reference_date` | date | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `year` | int | não |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.fuels"></a>bradescoveicweb.fuels

_Tabela · ~140 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.gran_responses"></a>bradescoveicweb.gran_responses

_Tabela · ~69.626 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int unsigned | não | MUL |  |  |  |
| `type` | varchar(2) | não |  |  |  |  |
| `code` | varchar(255) | sim |  |  |  |  |
| `response` | text | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `asset_id` → `assets.id`

**Índices:** `gran_responses_asset_id_foreign`: (asset_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.heavy_car_inspections"></a>bradescoveicweb.heavy_car_inspections

_Tabela · ~0 linhas (estimativa do InnoDB) · 109 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `vehicle_id` | int unsigned | sim | MUL |  |  |  |
| `km` | int | sim |  |  |  |  |
| `grid` | int | sim |  |  |  |  |
| `inspector_id` | int | sim |  |  |  |  |
| `saved` | varchar(255) | sim |  |  |  |  |
| `inspection_code` | varchar(255) | sim |  |  |  |  |
| `crv` | int | sim |  |  |  |  |
| `crvl` | int | sim |  |  |  |  |
| `key` | int | sim |  |  |  |  |
| `key_copy` | int | sim |  |  |  |  |
| `works_engine` | int | sim |  |  |  |  |
| `body_type` | varchar(255) | sim |  |  |  |  |
| `hood` | int | sim |  |  |  |  |
| `cabin` | int | sim |  |  |  |  |
| `two_doors` | int | sim |  |  |  |  |
| `four_doors` | int | sim |  |  |  |  |
| `front_grid` | int | sim |  |  |  |  |
| `right_rear_side` | int | sim |  |  |  |  |
| `rear_left_side` | int | sim |  |  |  |  |
| `front_bumper` | int | sim |  |  |  |  |
| `rear_bumper` | int | sim |  |  |  |  |
| `right_fender` | int | sim |  |  |  |  |
| `left_fender` | int | sim |  |  |  |  |
| `painting` | int | sim |  |  |  |  |
| `cover_trunk` | int | sim |  |  |  |  |
| `roof` | int | sim |  |  |  |  |
| `sunroof` | int | sim |  |  |  |  |
| `air_conditioning` | int | sim |  |  |  |  |
| `air_conditioning_digital` | varchar(255) | sim |  |  |  |  |
| `air_bag` | int | sim |  |  |  |  |
| `air_bag_passenger` | varchar(255) | sim |  |  |  |  |
| `banks` | int | sim |  |  |  |  |
| `leather_seats` | varchar(255) | sim |  |  |  |  |
| `cd_player` | int | sim |  |  |  |  |
| `key_wheel` | int | sim |  |  |  |  |
| `belts_security` | int | sim |  |  |  |  |
| `hydraulic_steering` | int | sim |  |  |  |  |
| `diskette` | int | sim |  |  |  |  |
| `dvd_Player` | int | sim |  |  |  |  |
| `fire_extinguisher` | int | sim |  |  |  |  |
| `monkey` | int | sim |  |  |  |  |
| `radio` | int | sim |  |  |  |  |
| `radio_plays_tapes` | varchar(255) | sim |  |  |  |  |
| `rear_view_mirrors` | int | sim |  |  |  |  |
| `rear_view_mirrors_eletrics` | varchar(255) | sim |  |  |  |  |
| `eletric_lock` | int | sim |  |  |  |  |
| `triangle` | int | sim |  |  |  |  |
| `sound_module` | int | sim |  |  |  |  |
| `steppe` | int | sim |  |  |  |  |
| `steppe_mark` | varchar(255) | sim |  |  |  |  |
| `rotate` | int | sim |  |  |  |  |
| `tachograph` | int | sim |  |  |  |  |
| `trunk` | int | sim |  |  |  |  |
| `debarker` | int | sim |  |  |  |  |
| `armored` | int | sim |  |  |  |  |
| `rear_cleaner` | int | sim |  |  |  |  |
| `windshield` | int | sim |  |  |  |  |
| `doors` | int | sim |  |  |  |  |
| `windbreak` | int | sim |  |  |  |  |
| `eletrict_glass` | int | sim |  |  |  |  |
| `side_windows` | int | sim |  |  |  |  |
| `rear_windows` | int | sim |  |  |  |  |
| `battery` | int | sim |  |  |  |  |
| `battery_mark` | varchar(255) | sim |  |  |  |  |
| `horn` | int | sim |  |  |  |  |
| `onboard_computer` | int | sim |  |  |  |  |
| `lighthouses` | int | sim |  |  |  |  |
| `mile_lights` | int | sim |  |  |  |  |
| `xenon_lighthouses` | int | sim |  |  |  |  |
| `panel_instruments` | int | sim |  |  |  |  |
| `lanterns` | int | sim |  |  |  |  |
| `blinker_lens` | int | sim |  |  |  |  |
| `exchange` | int | sim |  |  |  |  |
| `exchange_automatic` | varchar(255) | sim |  |  |  |  |
| `injection_carburetor` | int | sim |  |  |  |  |
| `fuel_pump` | int | sim |  |  |  |  |
| `brakes` | int | sim |  |  |  |  |
| `brakes_abs` | varchar(255) | sim |  |  |  |  |
| `engine` | int | sim |  |  |  |  |
| `engine_ok` | varchar(255) | sim |  |  |  |  |
| `front_suspension` | int | sim |  |  |  |  |
| `rear_suspension` | int | sim |  |  |  |  |
| `air_compressor` | int | sim |  |  |  |  |
| `cardan` | int | sim |  |  |  |  |
| `turbine` | int | sim |  |  |  |  |
| `iron_wheels` | int | sim |  |  |  |  |
| `iron_wheels_amount` | int | sim |  |  |  |  |
| `alloy_wheels` | int | sim |  |  |  |  |
| `alloy_wheels_amount` | int | sim |  |  |  |  |
| `hubcaps` | int | sim |  |  |  |  |
| `hubcaps_amount` | int | sim |  |  |  |  |
| `tires` | int | sim |  |  |  |  |
| `tires_mark` | varchar(255) | sim |  |  |  |  |
| `radio_front` | int | sim |  |  |  |  |
| `radio_front_mark` | varchar(255) | sim |  |  |  |  |
| `evaluation_molicar` | decimal(12,2) | sim |  |  |  |  |
| `evaluation_apas` | decimal(12,2) | sim |  |  |  |  |
| `value_first_transfer` | decimal(12,2) | sim |  |  |  |  |
| `general_aspect` | int | sim |  |  |  |  |
| `current_fuel_level` | varchar(255) | sim |  |  |  |  |
| `comments` | longtext | sim |  |  |  |  |
| `comments_apas` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `signature` | varchar(255) | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Aponta para:** `vehicle_id` → `assets.id`

**Índices:** `heavy_car_inspections_vehicle_id_foreign`: (vehicle_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.heavy_car_inspections_photos"></a>bradescoveicweb.heavy_car_inspections_photos

_Tabela · ~0 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `inspection_id` | int unsigned | sim |  |  |  |  |
| `archive` | varchar(255) | sim |  |  |  |  |
| `subtitle` | varchar(255) | sim |  |  |  |  |
| `type` | int | sim |  |  |  |  |
| `sale` | int | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.high_debts"></a>bradescoveicweb.high_debts

_Tabela · ~0 linhas (estimativa do InnoDB) · 10 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `leve` | decimal(8,2) | não |  |  |  |  |
| `moto` | decimal(8,2) | não |  |  |  |  |
| `pesado` | decimal(8,2) | não |  |  |  |  |
| `user_group_name` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `permission_type` | enum('USUARIOS','GRUPO_DE_USUARIOS') | não |  |  | GRUPO_DE_USUARIOS |  |
| `users` | json | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.honoraries"></a>bradescoveicweb.honoraries

_Tabela · ~52.990 linhas (estimativa do InnoDB) · 12 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `dispatch_id` | int unsigned | sim |  |  |  |  |
| `sale_notification_id` | bigint unsigned | sim | MUL |  |  |  |
| `amount` | decimal(8,2) | não |  |  |  |  |
| `receipts_id` | bigint unsigned | sim |  |  |  |  |
| `payment_group_id` | bigint unsigned | sim |  |  |  |  |
| `costs_per_assets_type_id` | bigint unsigned | sim |  |  |  |  |
| `status_ocr` | enum('NAO_ANALISADO','EM_ANALISE','COMPROVANTE_ACEITO','COMPROVANTE_RECUSADO') | sim |  |  |  |  |

**Aponta para:** `sale_notification_id` → `sale_notification.id`

**Índices:** `honoraries_sale_notification_id_foreign`: (sale_notification_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.impersonation_sessions"></a>bradescoveicweb.impersonation_sessions

_Tabela · ~210 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `admin_user_id` | bigint unsigned | não | MUL |  |  |  |
| `target_user_id` | bigint unsigned | não | MUL |  |  |  |
| `ip` | varchar(45) | sim |  |  |  |  |
| `user_agent` | varchar(255) | sim |  |  |  |  |
| `started_at` | timestamp | não |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `ended_at` | timestamp | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `admin_user_id` → `users.id` · `target_user_id` → `users.id`

**Índices:** `impersonation_sessions_admin_user_id_index`: (admin_user_id) · `impersonation_sessions_target_user_id_index`: (target_user_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.inspections_time"></a>bradescoveicweb.inspections_time

_Tabela · ~45.308 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | não |  |  |  |  |
| `inspector_id` | int | não |  |  |  |  |
| `time` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.inspector"></a>bradescoveicweb.inspector

_Tabela · ~265 linhas (estimativa do InnoDB) · 10 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `courtyard_id` | int | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim |  |  |  |  |
| `phone` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `type` | enum('ADVISORY','AUCTIONEER','BACKOFFICE') | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.integration_health_logs"></a>bradescoveicweb.integration_health_logs

_Tabela · ~39.320 linhas (estimativa do InnoDB) · 11 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não | MUL |  |  |  |
| `status` | enum('ok','degraded','down','unknown') | não | MUL |  |  |  |
| `latency_ms` | int unsigned | sim |  |  |  |  |
| `success_count` | int unsigned | não |  |  | 0 |  |
| `error_count` | int unsigned | não |  |  | 0 |  |
| `last_error_message` | text | sim |  |  |  |  |
| `response_detail` | json | sim |  |  |  |  |
| `checked_at` | datetime | não | MUL |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `integration_health_logs_checked_at_index`: (checked_at) · `integration_health_logs_name_index`: (name) · `integration_health_logs_status_index`: (status) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.inventory_assets"></a>bradescoveicweb.inventory_assets

_Tabela · ~3.510 linhas (estimativa do InnoDB) · 18 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `inventory_upload_id` | int | sim |  |  |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `bradesco_seguros_resource_id` | bigint unsigned | sim |  |  |  |  |
| `car_plate_file` | varchar(255) | sim |  |  |  |  |
| `contract_file` | varchar(255) | sim |  |  |  |  |
| `warning_number_file` | varchar(255) | sim |  |  |  |  |
| `saved_file` | varchar(255) | sim |  |  |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `in_spreadsheet` | tinyint(1) | sim |  |  |  |  |
| `in_system` | tinyint(1) | sim |  |  |  |  |
| `match` | tinyint(1) | sim |  |  |  |  |
| `in_bradesco_seguros_resource` | tinyint(1) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `observations` | text | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.inventory_assets_files"></a>bradescoveicweb.inventory_assets_files

_Tabela · ~0 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `inventory_asset_id` | int | sim |  |  |  |  |
| `file` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.inventory_uploads"></a>bradescoveicweb.inventory_uploads

_Tabela · ~3 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `file` | varchar(255) | sim |  |  |  |  |
| `is_bradesco_seguros` | tinyint(1) | não |  |  | 0 |  |
| `reference_year` | year | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.job_batches"></a>bradescoveicweb.job_batches

_Tabela · ~2.704 linhas (estimativa do InnoDB) · 10 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | varchar(256) | não | PRI |  |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `total_jobs` | int | não |  |  |  |  |
| `pending_jobs` | int | não |  |  |  |  |
| `failed_jobs` | int | não |  |  |  |  |
| `failed_job_ids` | text | não |  |  |  |  |
| `options` | mediumtext | sim |  |  |  |  |
| `cancelled_at` | int | sim |  |  |  |  |
| `created_at` | int | não |  |  |  |  |
| `finished_at` | int | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.jobs"></a>bradescoveicweb.jobs

_Tabela · ~0 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `queue` | varchar(255) | não | MUL |  |  |  |
| `payload` | longtext | não |  |  |  |  |
| `attempts` | tinyint unsigned | não |  |  |  |  |
| `reserved_at` | int unsigned | sim |  |  |  |  |
| `available_at` | int unsigned | não |  |  |  |  |
| `created_at` | int unsigned | não |  |  |  |  |

**Índices:** `jobs_queue_index`: (queue) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.jurisdictions"></a>bradescoveicweb.jurisdictions

_Tabela · ~75 linhas (estimativa do InnoDB) · 11 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `value` | decimal(12,2) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `type` | enum('PAGAMENTO_DE_DEBITOS','BAIXA_DE_VEICULO_COMO_SUCATA','REMARCACAO_DE_MOTOR_E_CHASSI','DIVIDA_ATIVA','LAUDO_CSV','ABERTURA_DE_VEICULOS','DESACOPLAGEM_DE_ACESSORIOS','RECOMPRA_DE_BENS','DESCONTO_NA_ARREMATACAO','VENDAS_DE_MOBILIARIO_BDU','LAUDOS_EXTRAORDINARIOS','ALTERACAO_DO_VALOR_DE_AVALIACAO','CONDICIONAIS','APROVACAO_DE_DEBITOS_ELEVADOS') | sim |  |  |  |  |
| `param_type` | enum('PORCENTAGEM','VALOR') | não |  |  | PORCENTAGEM |  |
| `operator` | enum('MENOR','MENOR_IGUAL','MAIOR_IGUAL','MAIOR') | não |  |  | MENOR_IGUAL |  |
| `permission_type` | enum('USUARIOS','GRUPO_DE_USUARIOS') | não |  |  | GRUPO_DE_USUARIOS |  |
| `users` | json | sim |  |  |  |  |
| `user_group_name` | varchar(255) | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.light_car_inspections"></a>bradescoveicweb.light_car_inspections

_Tabela · ~0 linhas (estimativa do InnoDB) · 102 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `vehicle_id` | int unsigned | sim | MUL |  |  |  |
| `km` | int | sim |  |  |  |  |
| `grid` | int | sim |  |  |  |  |
| `inspector_id` | int | sim |  |  |  |  |
| `saved` | varchar(255) | sim |  |  |  |  |
| `inspection_code` | varchar(255) | sim |  |  |  |  |
| `crv` | int | sim |  |  |  |  |
| `crvl` | int | sim |  |  |  |  |
| `key` | int | sim |  |  |  |  |
| `key_copy` | int | sim |  |  |  |  |
| `works_engine` | int | sim |  |  |  |  |
| `hood` | int | sim |  |  |  |  |
| `cabin` | int | sim |  |  |  |  |
| `two_doors` | int | sim |  |  |  |  |
| `four_doors` | int | sim |  |  |  |  |
| `front_grid` | int | sim |  |  |  |  |
| `right_rear_side` | int | sim |  |  |  |  |
| `rear_left_side` | int | sim |  |  |  |  |
| `front_bumper` | int | sim |  |  |  |  |
| `rear_bumper` | int | sim |  |  |  |  |
| `right_fender` | int | sim |  |  |  |  |
| `left_fender` | int | sim |  |  |  |  |
| `painting` | int | sim |  |  |  |  |
| `cover_trunk` | int | sim |  |  |  |  |
| `roof` | int | sim |  |  |  |  |
| `sunroof` | int | sim |  |  |  |  |
| `air_conditioning` | int | sim |  |  |  |  |
| `air_conditioning_digital` | varchar(255) | sim |  |  |  |  |
| `air_bag` | int | sim |  |  |  |  |
| `air_bag_passenger` | varchar(255) | sim |  |  |  |  |
| `banks` | int | sim |  |  |  |  |
| `leather_seats` | varchar(255) | sim |  |  |  |  |
| `cd_player` | int | sim |  |  |  |  |
| `key_wheel` | int | sim |  |  |  |  |
| `belts_security` | int | sim |  |  |  |  |
| `hydraulic_steering` | int | sim |  |  |  |  |
| `diskette` | int | sim |  |  |  |  |
| `dvd_Player` | int | sim |  |  |  |  |
| `fire_extinguisher` | int | sim |  |  |  |  |
| `monkey` | int | sim |  |  |  |  |
| `radio` | int | sim |  |  |  |  |
| `radio_plays_tapes` | varchar(255) | sim |  |  |  |  |
| `rear_view_mirrors` | int | sim |  |  |  |  |
| `rear_view_mirrors_eletrics` | varchar(255) | sim |  |  |  |  |
| `eletric_lock` | int | sim |  |  |  |  |
| `triangle` | int | sim |  |  |  |  |
| `sound_module` | int | sim |  |  |  |  |
| `steppe` | int | sim |  |  |  |  |
| `steppe_mark` | varchar(255) | sim |  |  |  |  |
| `debarker` | int | sim |  |  |  |  |
| `armored` | int | sim |  |  |  |  |
| `rear_cleaner` | int | sim |  |  |  |  |
| `windshield` | int | sim |  |  |  |  |
| `doors` | int | sim |  |  |  |  |
| `windbreak` | int | sim |  |  |  |  |
| `eletrict_glass` | int | sim |  |  |  |  |
| `side_windows` | int | sim |  |  |  |  |
| `rear_windows` | int | sim |  |  |  |  |
| `battery` | int | sim |  |  |  |  |
| `battery_mark` | varchar(255) | sim |  |  |  |  |
| `horn` | int | sim |  |  |  |  |
| `onboard_computer` | int | sim |  |  |  |  |
| `lighthouses` | int | sim |  |  |  |  |
| `mile_lights` | int | sim |  |  |  |  |
| `xenon_lighthouses` | int | sim |  |  |  |  |
| `panel_instruments` | int | sim |  |  |  |  |
| `lanterns` | int | sim |  |  |  |  |
| `blinker_lens` | int | sim |  |  |  |  |
| `exchange` | int | sim |  |  |  |  |
| `exchange_automatic` | varchar(255) | sim |  |  |  |  |
| `injection_carburetor` | int | sim |  |  |  |  |
| `fuel_pump` | int | sim |  |  |  |  |
| `brakes` | int | sim |  |  |  |  |
| `brakes_abs` | varchar(255) | sim |  |  |  |  |
| `engine` | int | sim |  |  |  |  |
| `engine_ok` | varchar(255) | sim |  |  |  |  |
| `front_suspension` | int | sim |  |  |  |  |
| `rear_suspension` | int | sim |  |  |  |  |
| `iron_wheels` | int | sim |  |  |  |  |
| `iron_wheels_amount` | int | sim |  |  |  |  |
| `alloy_wheels` | int | sim |  |  |  |  |
| `alloy_wheels_amount` | int | sim |  |  |  |  |
| `hubcaps` | int | sim |  |  |  |  |
| `hubcaps_amount` | int | sim |  |  |  |  |
| `tires` | int | sim |  |  |  |  |
| `tires_mark` | varchar(255) | sim |  |  |  |  |
| `radio_front` | int | sim |  |  |  |  |
| `radio_front_mark` | varchar(255) | sim |  |  |  |  |
| `evaluation_molicar` | decimal(12,2) | sim |  |  |  |  |
| `evaluation_apas` | decimal(12,2) | sim |  |  |  |  |
| `value_first_transfer` | decimal(12,2) | sim |  |  |  |  |
| `general_aspect` | int | sim |  |  |  |  |
| `current_fuel_level` | varchar(255) | sim |  |  |  |  |
| `comments` | longtext | sim |  |  |  |  |
| `comments_apas` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `signature` | varchar(255) | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Aponta para:** `vehicle_id` → `assets.id`

**Índices:** `light_car_inspections_vehicle_id_foreign`: (vehicle_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.light_car_photos_inspections"></a>bradescoveicweb.light_car_photos_inspections

_Tabela · ~0 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `inspection_id` | int unsigned | sim |  |  |  |  |
| `archive` | varchar(255) | sim |  |  |  |  |
| `subtitle` | varchar(255) | sim |  |  |  |  |
| `type` | int | sim |  |  |  |  |
| `sale` | int | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.log_rest"></a>bradescoveicweb.log_rest

_Tabela · ~4.298.056 linhas (estimativa do InnoDB) · 12 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `origin` | varchar(255) | sim |  |  |  |  |
| `restriction_code` | varchar(255) | sim |  |  |  |  |
| `to_sell` | tinyint(1) | sim | MUL |  |  |  |
| `date_consult` | date | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `event_id` | int | sim | MUL |  |  |  |
| `event_asset_id` | int | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `idx_cpf_consult`: (cpf_cnpj,date_consult) · `idx_event_asset`: (event_id,asset_id) · `idx_log_rest_cpf_cnpj_created_at`: (cpf_cnpj,created_at) · `idx_log_rest_cpf_date`: (cpf_cnpj,date_consult,deleted_at) · `idx_log_rests_cpf_date`: (cpf_cnpj,created_at) · `idx_to_sell`: (to_sell) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.logs"></a>bradescoveicweb.logs

_Tabela · ~113.228.604 linhas (estimativa do InnoDB) · 17 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `department` | varchar(255) | sim |  |  |  |  |
| `user_id` | int | sim | MUL |  |  |  |
| `table` | varchar(255) | sim |  |  |  |  |
| `method` | varchar(255) | sim |  |  |  |  |
| `resource_id` | int | sim | MUL |  |  |  |
| `vehicle_id` | int | sim | MUL |  |  |  |
| `resource` | longtext | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `uri` | longtext | sim |  |  |  |  |
| `deleted_at` | timestamp | sim | MUL |  |  |  |
| `auctioneer_id` | int | sim | MUL |  |  |  |
| `dispatcher_id` | int | sim | MUL |  |  |  |
| `ip` | varchar(255) | sim |  |  |  |  |
| `impersonated_by_id` | bigint unsigned | sim | MUL |  |  |  |
| `impersonation_session_id` | bigint unsigned | sim | MUL |  |  |  |

**Índices:** `idx_logs_auctioneer_id_created_at`: (auctioneer_id,created_at) · `idx_logs_del_created_at`: (deleted_at,created_at) · `idx_logs_del_table_department_user_id_id`: (deleted_at,table,department,user_id,id) · `idx_logs_del_table_resource_id_created_at`: (deleted_at,table,resource_id,created_at) · `idx_logs_del_table_resource_id_id`: (deleted_at,table,resource_id,id) · `idx_logs_del_table_vehicle_id_id`: (deleted_at,table,vehicle_id,id) · `idx_logs_dispatcher_id_created_at`: (dispatcher_id,created_at) · `idx_logs_resource_id_id`: (resource_id,id) · `idx_logs_user_id_created_at`: (user_id,created_at) · `idx_logs_vehicle_id`: (vehicle_id,id) · `logs_impersonated_by_id_index`: (impersonated_by_id) · `logs_impersonation_session_id_index`: (impersonation_session_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.logs_checkauto"></a>bradescoveicweb.logs_checkauto

_Tabela · ~67.768 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `car_plate` | varchar(255) | não |  |  |  |  |
| `consult_id` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.migrations"></a>bradescoveicweb.migrations

_Tabela · ~492 linhas (estimativa do InnoDB) · 4 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `migration` | varchar(255) | não |  |  |  |  |
| `batch` | int | não |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.minimum_sample_percentage_parameter"></a>bradescoveicweb.minimum_sample_percentage_parameter

_Tabela · ~0 linhas (estimativa do InnoDB) · 4 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `value` | decimal(5,2) | não |  |  | 20.00 |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.molicar"></a>bradescoveicweb.molicar

_Tabela · ~3.336.515 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `molicar_code` | varchar(255) | não | MUL |  |  |  |
| `molicar_value` | int | não |  |  |  |  |
| `reference_date` | date | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `year` | int | não |  |  |  |  |
| `new` | tinyint(1) | não |  |  | 0 |  |

**Índices:** `idx_molicar_code_year`: (molicar_code,year) · `idx_molicar_code_year_id`: (molicar_code,year,id) · `molicar_molicar_code_reference_date_year_index`: (molicar_code,reference_date,year) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.motorcycle_inspection_photos"></a>bradescoveicweb.motorcycle_inspection_photos

_Tabela · ~0 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `inspection_id` | int unsigned | sim |  |  |  |  |
| `archive` | varchar(255) | sim |  |  |  |  |
| `subtitle` | varchar(255) | sim |  |  |  |  |
| `type` | int | sim |  |  |  |  |
| `sale` | int | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.motorcycle_inspections"></a>bradescoveicweb.motorcycle_inspections

_Tabela · ~0 linhas (estimativa do InnoDB) · 68 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `vehicle_id` | int unsigned | sim | MUL |  |  |  |
| `km` | int | sim |  |  |  |  |
| `grid` | int | sim |  |  |  |  |
| `inspector_id` | int | sim |  |  |  |  |
| `saved` | varchar(255) | sim |  |  |  |  |
| `inspection_code` | varchar(255) | sim |  |  |  |  |
| `crv` | int | sim |  |  |  |  |
| `crvl` | int | sim |  |  |  |  |
| `key` | int | sim |  |  |  |  |
| `key_copy` | int | sim |  |  |  |  |
| `works_engine` | int | sim |  |  |  |  |
| `fairing` | int | sim |  |  |  |  |
| `tank` | int | sim |  |  |  |  |
| `bench` | int | sim |  |  |  |  |
| `frame` | int | sim |  |  |  |  |
| `tail` | int | sim |  |  |  |  |
| `bengal` | int | sim |  |  |  |  |
| `shock_absorbers` | int | sim |  |  |  |  |
| `guidon` | int | sim |  |  |  |  |
| `gauntlet` | int | sim |  |  |  |  |
| `right_fender` | int | sim |  |  |  |  |
| `left_fender` | int | sim |  |  |  |  |
| `painting` | int | sim |  |  |  |  |
| `pedals` | int | sim |  |  |  |  |
| `rest_support` | int | sim |  |  |  |  |
| `fairing_protector` | int | sim |  |  |  |  |
| `trunk` | int | sim |  |  |  |  |
| `brake_discs` | int | sim |  |  |  |  |
| `chain` | int | sim |  |  |  |  |
| `rear_view_mirrors` | int | sim |  |  |  |  |
| `battery` | int | sim |  |  |  |  |
| `battery_mark` | varchar(255) | sim |  |  |  |  |
| `horn` | int | sim |  |  |  |  |
| `onboard_computer` | int | sim |  |  |  |  |
| `lighthouses` | int | sim |  |  |  |  |
| `panel_instruments` | int | sim |  |  |  |  |
| `lanterns` | int | sim |  |  |  |  |
| `arrows` | int | sim |  |  |  |  |
| `exchange` | int | sim |  |  |  |  |
| `exchange_automatic` | varchar(255) | sim |  |  |  |  |
| `fuel_pump` | int | sim |  |  |  |  |
| `ignition` | int | sim |  |  |  |  |
| `brakes` | int | sim |  |  |  |  |
| `brakes_abs` | varchar(255) | sim |  |  |  |  |
| `engine` | int | sim |  |  |  |  |
| `engine_ok` | varchar(255) | sim |  |  |  |  |
| `front_suspension` | int | sim |  |  |  |  |
| `rear_suspension` | int | sim |  |  |  |  |
| `iron_wheels` | int | sim |  |  |  |  |
| `iron_wheels_amount` | int | sim |  |  |  |  |
| `alloy_wheels` | int | sim |  |  |  |  |
| `alloy_wheels_amount` | int | sim |  |  |  |  |
| `tires` | int | sim |  |  |  |  |
| `tires_mark` | varchar(255) | sim |  |  |  |  |
| `evaluation_molicar` | decimal(12,2) | sim |  |  |  |  |
| `evaluation_apas` | decimal(12,2) | sim |  |  |  |  |
| `value_first_transfer` | decimal(12,2) | sim |  |  |  |  |
| `general_aspect` | int | sim |  |  |  |  |
| `current_fuel_level` | varchar(255) | sim |  |  |  |  |
| `comments` | longtext | sim |  |  |  |  |
| `comments_apas` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `signature` | varchar(255) | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Aponta para:** `vehicle_id` → `assets.id`

**Índices:** `motorcycle_inspections_vehicle_id_foreign`: (vehicle_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.new_view"></a>bradescoveicweb.new_view

_View · ~0 linhas (estimativa do InnoDB) · 47 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `Tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.notifications"></a>bradescoveicweb.notifications

_Tabela · ~1.880.382 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | char(36) | não | PRI |  |  |  |
| `type` | varchar(255) | não |  |  |  |  |
| `notifiable_type` | varchar(255) | não | MUL |  |  |  |
| `notifiable_id` | bigint unsigned | não |  |  |  |  |
| `data` | mediumtext | não |  |  |  |  |
| `read_at` | timestamp | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `data_announcement_id` | int | sim | MUL | VIRTUAL GENERATED |  |  |

**Índices:** `idx_notifications_data_announcement_id`: (data_announcement_id) · `notifications_notifiable_type_notifiable_id_index`: (notifiable_type,notifiable_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.partners"></a>bradescoveicweb.partners

_Tabela · ~23.946 linhas (estimativa do InnoDB) · 18 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `public_place` | varchar(255) | sim |  |  |  |  |
| `address` | varchar(255) | sim |  |  |  |  |
| `number` | varchar(255) | sim |  |  |  |  |
| `complement` | varchar(255) | sim |  |  |  |  |
| `district` | varchar(255) | sim |  |  |  |  |
| `city` | varchar(255) | sim |  |  |  |  |
| `uf` | varchar(255) | sim |  |  |  |  |
| `cep` | varchar(255) | sim |  |  |  |  |
| `landline` | varchar(255) | sim |  |  |  |  |
| `cell_phone` | varchar(255) | sim |  |  |  |  |
| `type_cell` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.partners_events_assets_relationship"></a>bradescoveicweb.partners_events_assets_relationship

_Tabela · ~119.987 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `event_asset_id` | int | sim |  |  |  |  |
| `partner_id` | int | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.payment_group"></a>bradescoveicweb.payment_group

_Tabela · ~8.988 linhas (estimativa do InnoDB) · 23 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `status` | enum('PENDENTE','APROVADO','REPROVADO','PROCESSADO','REPROVADO_SAP') | sim |  |  | PENDENTE |  |
| `status_date` | timestamp | sim |  |  |  |  |
| `group_type` | enum('REEMBOLSO','HONORARIO') | sim |  |  |  |  |
| `provider_type` | enum('DISPATCHER','AUCTIONEER','REPORT_COMPANY') | sim | MUL |  |  |  |
| `provider_id` | int | sim |  |  |  |  |
| `bank_id` | int | sim | MUL |  |  |  |
| `start_date` | date | sim |  |  |  |  |
| `end_date` | date | sim |  |  |  |  |
| `number` | int | sim |  |  |  |  |
| `total_cost` | decimal(12,2) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `approved` | tinyint(1) | não |  |  |  |  |
| `approved_by` | bigint unsigned | sim | MUL |  |  |  |
| `approved_date` | timestamp | sim |  |  |  |  |
| `reason` | text | sim |  |  |  |  |
| `rejected_debts` | json | sim |  |  |  |  |
| `doc_upload_date` | date | sim |  |  |  |  |
| `batch_input_id` | int | sim | MUL |  |  |  |
| `item_batch_input_id` | int | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Aponta para:** `approved_by` → `users.id`

**Índices:** `idx_payment_group_bank_id`: (bank_id) · `idx_payment_group_batch_input_id`: (batch_input_id) · `idx_payment_group_provider_type_id`: (provider_type,provider_id) · `payment_group_approved_by_foreign`: (approved_by) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.pendencies"></a>bradescoveicweb.pendencies

_Tabela · ~52.336 linhas (estimativa do InnoDB) · 16 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `dispatch_id` | bigint unsigned | não | MUL |  |  |  |
| `type` | varchar(255) | não | MUL |  |  |  |
| `reason` | text | sim |  |  |  |  |
| `observation` | text | sim |  |  |  |  |
| `resolution_date` | date | sim |  |  |  |  |
| `resolution` | text | sim |  |  |  |  |
| `status` | enum('EM_ANALISE','RESOLVIDO','CANCELADO') | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim | MUL |  |  |  |
| `suggestion` | text | sim |  |  |  |  |
| `responsible` | varchar(255) | sim |  |  |  |  |

🔒 3 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `idx_pendencies_deleted_dispatch`: (deleted_at,dispatch_id,id) · `idx_pendencies_dispatch_id`: (dispatch_id) · `pendencies_dispatch_id_index`: (dispatch_id) · `pendencies_type_index`: (type) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.pendency_slas"></a>bradescoveicweb.pendency_slas

_Tabela · ~0 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `type` | enum('ECV','Bloqueio','Restrição administrativa','Gravame expirado','Outras pendências') | não |  |  |  |  |
| `reason` | enum('Regularização de motor','ECV pendente','Diversos','Revistoria','Comunicado de venda','Restrição administrativa','Média monta','Pendência de emplacamento','Recall','ATPV-E','Transferência de jurisdição','Restrição de débito na origem','Segunda via','Processo pendente em aberto no detran','Outras pendências','Outras UFs') | não |  |  |  |  |
| `sla` | int | não |  |  |  |  |
| `uf` | varchar(2) | não |  |  |  |  |
| `dispatcher_id` | int unsigned | não | MUL |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `dispatcher_id` → `dispatchers.id`

**Índices:** `pendency_slas_dispatcher_id_foreign`: (dispatcher_id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.portfolios"></a>bradescoveicweb.portfolios

_Tabela · ~1.091 linhas (estimativa do InnoDB) · 4 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.pricing_discount"></a>bradescoveicweb.pricing_discount

_Tabela · ~14 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `year_start` | int | não |  |  |  |  |
| `year_end` | int | não |  |  |  |  |
| `discount_percentage` | double(5,2) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.regions"></a>bradescoveicweb.regions

_Tabela · ~42 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.regions_cities_states"></a>bradescoveicweb.regions_cities_states

_Tabela · ~5.773 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `uf` | varchar(255) | sim | MUL |  |  |  |
| `city` | varchar(255) | sim |  |  |  |  |
| `region_id` | int | sim | MUL |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `idx_region_id`: (region_id) · `idx_uf_city`: (uf,city) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.registration_documents"></a>bradescoveicweb.registration_documents

_Tabela · ~0 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `type` | enum('AUCTIONEER','DISPATCHER') | não |  |  |  |  |
| `auctioneer_id` | int unsigned | sim | MUL |  |  |  |
| `dispatcher_id` | int unsigned | sim | MUL |  |  |  |
| `path` | varchar(255) | não |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `auctioneer_id` → `auctioneers.id` · `dispatcher_id` → `dispatchers.id`

**Índices:** `PRIMARY` (único): (id) · `registration_documents_auctioneer_id_foreign`: (auctioneer_id) · `registration_documents_dispatcher_id_foreign`: (dispatcher_id)

### <a id="bradescoveicweb.regularization_documents"></a>bradescoveicweb.regularization_documents

_Tabela · ~3.215 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `dispatch_id` | int | não |  |  |  |  |
| `asset_id` | int | não |  |  |  |  |
| `path` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `name` | varchar(255) | não |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.regularization_files_ocr"></a>bradescoveicweb.regularization_files_ocr

_Tabela · ~31 linhas (estimativa do InnoDB) · 11 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `dispatch_id` | int | sim |  |  |  |  |
| `session` | int | sim |  |  |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `file_name` | varchar(255) | sim |  |  |  |  |
| `file_path` | varchar(255) | sim |  |  |  |  |
| `observation` | varchar(255) | sim |  |  |  |  |
| `found` | tinyint(1) | não |  |  | 0 |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.relationship_between_assets"></a>bradescoveicweb.relationship_between_assets

_Tabela · ~3 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `main_asset_id` | int unsigned | sim | MUL |  |  |  |
| `owned_asset_id` | int unsigned | sim | MUL |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `main_asset_id` → `assets.id` · `owned_asset_id` → `assets.id`

**Índices:** `PRIMARY` (único): (id) · `relationship_between_vehicles_main_vehicle_id_foreign`: (main_asset_id) · `relationship_between_vehicles_owned_vehicle_id_foreign`: (owned_asset_id)

### <a id="bradescoveicweb.removal_locals"></a>bradescoveicweb.removal_locals

_Tabela · ~63.402 linhas (estimativa do InnoDB) · 23 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `number_contact` | varchar(255) | sim |  |  |  |  |
| `active` | tinyint(1) | sim |  |  | 1 |  |
| `public` | int | sim |  |  |  |  |
| `information` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim |  |  |  |  |
| `cep` | varchar(255) | não |  |  |  |  |
| `street` | varchar(255) | sim |  |  |  |  |
| `number` | varchar(255) | não |  |  |  |  |
| `complement` | text | sim |  |  |  |  |
| `district` | varchar(255) | não |  |  |  |  |
| `city` | varchar(255) | não |  |  |  |  |
| `state` | varchar(255) | não |  |  |  |  |
| `references` | text | sim |  |  |  |  |
| `address_google` | varchar(255) | sim |  |  |  |  |
| `approximate_location` | int | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim | MUL |  |  |  |
| `responsible_name` | varchar(255) | não |  |  | 0 |  |
| `latitude` | varchar(255) | sim |  |  |  |  |
| `longitude` | varchar(255) | sim |  |  |  |  |

**Índices:** `idx_removal_locals_deleted_created`: (deleted_at,created_at) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.removal_parameterization"></a>bradescoveicweb.removal_parameterization

_Tabela · ~0 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `parameter` | varchar(255) | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.removals"></a>bradescoveicweb.removals

_Tabela · ~276.044 linhas (estimativa do InnoDB) · 29 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `local_id` | int | não | MUL |  |  |  |
| `local_destiny_id` | int | não | MUL |  |  |  |
| `date_prevision_end_county` | date | sim |  |  |  |  |
| `expected_start_date` | date | sim |  |  |  |  |
| `expected_end_date` | date | sim |  |  |  |  |
| `real_start_date` | date | sim |  |  |  |  |
| `real_end_date` | date | sim |  |  |  |  |
| `take_value` | decimal(12,2) | sim |  |  |  |  |
| `informations` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `status_code` | varchar(255) | não |  |  | 0 |  |
| `seizure_date` | varchar(255) | sim |  |  |  |  |
| `responsible_auctioneer_id` | int | sim |  |  |  |  |
| `responsible_advisory_id` | int | sim |  |  |  |  |
| `asset_id` | int | não | MUL |  |  |  |
| `distance_km` | decimal(5,1) | não |  |  |  |  |
| `removal_sla_id` | int | sim |  |  |  |  |
| `cancellation_note` | longtext | sim |  |  |  |  |
| `deleted_at` | timestamp | sim | MUL |  |  |  |
| `sla_days` | int | sim |  |  |  |  |
| `received` | tinyint(1) | sim |  |  |  |  |
| `removal_frustration_request_enabled` | tinyint(1) | não |  |  | 0 |  |
| `waterways` | tinyint(1) | sim |  |  |  |  |
| `distribution_data` | json | sim |  |  |  |  |
| `expected_end_date_collect` | timestamp | sim |  |  |  |  |
| `sla_collect` | varchar(255) | sim |  |  |  |  |
| `real_end_date_collect` | timestamp | sim |  |  |  |  |

**Índices:** `idx_removals_asset_maxid`: (asset_id,id) · `idx_removals_asset_seizure`: (asset_id,seizure_date) · `idx_removals_asset_status`: (asset_id,deleted_at,removal_frustration_request_enabled,status_code,created_at) · `idx_removals_deleted_asset`: (deleted_at,asset_id,id) · `PRIMARY` (único): (id) · `removals_asset_id_index`: (asset_id) · `removals_local_destiny_id_index`: (local_destiny_id) · `removals_local_id_index`: (local_id)

### <a id="bradescoveicweb.removals_slas"></a>bradescoveicweb.removals_slas

_Tabela · ~29 linhas (estimativa do InnoDB) · 10 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `km_start` | int | sim |  |  |  |  |
| `km_end` | int | sim |  |  |  |  |
| `days` | int | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `waterways` | tinyint(1) | sim |  |  |  |  |
| `region` | enum('NORTE','NORDESTE','CENTRO_OESTE','SUDESTE','SUL') | sim |  |  |  |  |
| `hours` | smallint unsigned | sim |  |  |  | SLA em horas para AGUARDANDO_COLETA |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.report_batches"></a>bradescoveicweb.report_batches

_Tabela · ~10.175 linhas (estimativa do InnoDB) · 12 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `batch_id` | varchar(255) | sim |  |  |  |  |
| `total_jobs` | int | sim |  |  |  |  |
| `user_id` | bigint unsigned | não | MUL |  |  |  |
| `generated_at` | timestamp | sim |  |  |  |  |
| `parameters` | json | sim |  |  |  |  |
| `status` | enum('PENDING','PROCESSING','GENERATED','FAILED') | não |  |  | PENDING |  |
| `download_link` | text | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `total_records` | int | sim |  |  |  |  |

**Aponta para:** `user_id` → `users.id`

**Índices:** `PRIMARY` (único): (id) · `report_batches_user_id_foreign`: (user_id)

### <a id="bradescoveicweb.report_company_honoraries"></a>bradescoveicweb.report_company_honoraries

_Tabela · ~6.740 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `amount` | decimal(12,2) | não |  |  |  |  |
| `report_id` | int unsigned | sim | MUL |  |  |  |
| `payment_group_id` | bigint unsigned | sim | MUL |  |  |  |
| `receipts_id` | int unsigned | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `payment_group_id` → `payment_group.id` · `report_id` → `reports.id`

**Índices:** `PRIMARY` (único): (id) · `report_company_honoraries_payment_group_id_foreign`: (payment_group_id) · `report_company_honoraries_report_id_foreign`: (report_id)

### <a id="bradescoveicweb.report_values"></a>bradescoveicweb.report_values

_Tabela · ~4 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `type_report` | enum('ecv','cautelar','mini_laudo','cautelar_monta') | não |  |  |  |  |
| `value` | decimal(8,2) | não |  |  |  |  |
| `courtyard_id` | int unsigned | não | MUL |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `report_company_id` | int unsigned | sim | MUL |  |  |  |
| `item_contract_sap` | varchar(255) | sim |  |  |  |  |

**Aponta para:** `courtyard_id` → `courtyards.id` · `report_company_id` → `reports_companies.id`

**Índices:** `PRIMARY` (único): (id) · `report_values_courtyard_id_foreign`: (courtyard_id) · `report_values_report_company_id_foreign`: (report_company_id)

### <a id="bradescoveicweb.reports"></a>bradescoveicweb.reports

_Tabela · ~160.672 linhas (estimativa do InnoDB) · 16 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int unsigned | sim | MUL |  |  |  |
| `file` | varchar(255) | sim |  |  |  |  |
| `value` | decimal(12,2) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `type_doc` | enum('ecv','cautelar','mini_laudo','cautelar_monta') | não |  |  |  |  |
| `billing_status` | enum('waiting','financial','paid_out') | sim |  |  |  |  |
| `reason` | varchar(255) | sim |  |  |  |  |
| `number_receipt` | varchar(255) | sim |  |  |  |  |
| `restricted` | enum('APROVADO','APROVADO_COM_RESTRICAO','REPROVADO','PEQUENA_MONTA','MEDIA_MONTA','GRANDE_MONTA') | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `company` | varchar(255) | sim |  |  |  |  |
| `report_company_id` | int unsigned | sim | MUL |  |  |  |
| `external_id` | varchar(100) | sim |  |  |  |  |
| `laudo_number` | varchar(50) | sim |  |  |  |  |

**Aponta para:** `report_company_id` → `reports_companies.id` · `asset_id` → `assets.id`

**Índices:** `PRIMARY` (único): (id) · `reports_report_company_id_foreign`: (report_company_id) · `reports_vehicle_id_foreign`: (asset_id)

### <a id="bradescoveicweb.reports_companies"></a>bradescoveicweb.reports_companies

_Tabela · ~2 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `contract_sap` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `idx_reports_companies_id`: (id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.repurchases_follow_up"></a>bradescoveicweb.repurchases_follow_up

_Tabela · ~7.183 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `assets_repurchase_id` | int | não |  |  |  |  |
| `observation` | longtext | sim |  |  |  |  |
| `rapporteur` | enum('LEILOEIRO','BACKOFFICE') | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.repurchases_follow_up_documents"></a>bradescoveicweb.repurchases_follow_up_documents

_Tabela · ~4.517 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `repurchases_follow_up_id` | int | não |  |  |  |  |
| `type_doc` | enum('OUTROS','SUSPEITA_ADULTERACAO_CHASSI','SUSPEITA_ADULTERACAO_MOTOR','SINISTRO_NA_ORIGEM','DIVERGENCIA_DE_MONTA','DIVERGENCIA_NA_DIVULGACAO','RENAJUD') | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.rest_api_codes"></a>bradescoveicweb.rest_api_codes

_Tabela · ~15 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `code` | varchar(255) | não |  |  |  |  |
| `sellable` | tinyint(1) | não |  |  | 0 |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.sale_notification"></a>bradescoveicweb.sale_notification

_Tabela · ~27.549 linhas (estimativa do InnoDB) · 18 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `auctioneer_id` | int unsigned | não | MUL |  |  |  |
| `dispatcher_id` | int unsigned | não | MUL |  |  |  |
| `asset_id` | int unsigned | não | MUL |  |  |  |
| `event_asset_id` | int unsigned | sim | MUL |  |  |  |
| `finalized_by` | enum('Despachante','Leiloeiro') | sim |  |  |  |  |
| `proof_file_path` | varchar(255) | sim |  |  |  |  |
| `carrier` | varchar(255) | sim |  |  |  |  |
| `tracking_code` | varchar(255) | sim |  |  |  |  |
| `type` | enum('PESQUISA','COMUNICACAO') | sim |  |  |  |  |
| `status` | enum('PENDENTE DE ENVIO','ENVIADO AO DESPACHANTE','RECEBIDO PELO DESPACHANTE','CONCLUIDO') | não |  |  | PENDENTE DE ENVIO |  |
| `sent_to_dispatcher_at` | timestamp | sim |  |  |  |  |
| `received_by_dispatcher_at` | timestamp | sim |  |  |  |  |
| `finalized_at` | timestamp | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `active_event_asset_id` | int unsigned | sim | UNI | VIRTUAL GENERATED |  |  |

**Aponta para:** `asset_id` → `assets.id` · `auctioneer_id` → `auctioneers.id` · `dispatcher_id` → `dispatchers.id` · `event_asset_id` → `events_assets.id`

**Índices:** `PRIMARY` (único): (id) · `sale_notification_active_event_asset_unique` (único): (active_event_asset_id) · `sale_notification_asset_deleted_at_idx`: (asset_id,deleted_at) · `sale_notification_auctioneer_id_foreign`: (auctioneer_id) · `sale_notification_dispatcher_id_foreign`: (dispatcher_id) · `sale_notification_event_asset_deleted_at_idx`: (event_asset_id,deleted_at)

### <a id="bradescoveicweb.sale_notification_cron_logs"></a>bradescoveicweb.sale_notification_cron_logs

_Tabela · ~0 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `event_id` | bigint unsigned | não | MUL |  |  |  |
| `asset_id` | bigint unsigned | sim |  |  |  |  |
| `car_plate` | varchar(255) | sim |  |  |  |  |
| `result` | enum('CREATED','SKIPPED_ALREADY_EXISTS','ERROR') | não |  |  |  |  |
| `message` | text | sim |  |  |  |  |
| `created_at` | timestamp | não |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |

**Índices:** `PRIMARY` (único): (id) · `sale_notification_cron_logs_event_id_index`: (event_id)

### <a id="bradescoveicweb.sale_notification_days_parameterizations"></a>bradescoveicweb.sale_notification_days_parameterizations

_Tabela · ~1 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `days` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.sale_notification_status_logs"></a>bradescoveicweb.sale_notification_status_logs

_Tabela · ~74.325 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `sale_notification_id` | bigint unsigned | não | MUL |  |  |  |
| `status` | varchar(255) | não |  |  |  |  |
| `started_at` | datetime | não |  |  |  |  |
| `ended_at` | datetime | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `sale_notification_id` → `sale_notification.id`

**Índices:** `PRIMARY` (único): (id) · `sale_notification_status_logs_lookup_idx`: (sale_notification_id,ended_at)

### <a id="bradescoveicweb.sales_channels"></a>bradescoveicweb.sales_channels

_Tabela · ~0 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `sla` | int | não |  |  |  |  |
| `auctioneer_id` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.sap_emails"></a>bradescoveicweb.sap_emails

_Tabela · ~0 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `email` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.sap_fixed_assets"></a>bradescoveicweb.sap_fixed_assets

_Tabela · ~112 linhas (estimativa do InnoDB) · 15 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `status` | enum('PENDENTE','APROVADO','REJEITADO') | não | MUL |  | PENDENTE |  |
| `number_tric_input` | varchar(255) | sim |  |  |  |  |
| `status_code_sap` | varchar(255) | sim |  |  |  |  |
| `status_observation_sap` | varchar(255) | sim |  |  |  |  |
| `value_bndu` | decimal(12,2) | sim |  |  |  |  |
| `number_sap` | varchar(255) | sim |  |  |  |  |
| `date_created_sap` | datetime | sim |  |  |  |  |
| `main_fixed_asset_number` | varchar(255) | sim |  |  |  |  |
| `user_id_created_sap` | int | sim |  |  |  |  |
| `main_fixed_observation_wf` | text | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `idx_sap_fixed_assets_status`: (status) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.sap_fixed_low_assets"></a>bradescoveicweb.sap_fixed_low_assets

_Tabela · ~95 linhas (estimativa do InnoDB) · 15 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `status` | enum('PENDENTE','APROVADO','REJEITADO') | não | MUL |  | PENDENTE |  |
| `sap_fixed_id` | int | sim |  |  |  |  |
| `value_low` | decimal(12,2) | sim |  |  |  |  |
| `number_tric_output` | varchar(255) | sim |  |  |  |  |
| `number_sap_low` | varchar(255) | sim |  |  |  |  |
| `exercise_sap` | varchar(255) | sim |  |  |  |  |
| `status_code_sap_low` | varchar(255) | sim |  |  |  |  |
| `status_observation_sap_low` | varchar(255) | sim |  |  |  |  |
| `low_observation_wf` | text | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `idx_sap_fixed_low_assets_status`: (status) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.sap_requester"></a>bradescoveicweb.sap_requester

_Tabela · ~2 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `parameter` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.sap_tax_reform_parameters"></a>bradescoveicweb.sap_tax_reform_parameters

_Tabela · ~1 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `business_place` | varchar(4) | sim |  |  |  |  |
| `material` | varchar(40) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.scheduled_job_toggles"></a>bradescoveicweb.scheduled_job_toggles

_Tabela · ~123 linhas (estimativa do InnoDB) · 12 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `type` | enum('job','setting') | não |  |  | job |  |
| `job_key` | varchar(255) | não | MUL |  |  |  |
| `label` | varchar(255) | sim |  |  |  |  |
| `description` | text | sim |  |  |  |  |
| `environment` | enum('development','staging','production') | não |  |  | production |  |
| `is_enabled` | tinyint(1) | não |  |  | 1 |  |
| `active_infra` | enum('ploi','eks') | sim |  |  |  |  |
| `cron_expression` | varchar(255) | sim |  |  |  |  |
| `updated_by` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id) · `scheduled_job_toggles_job_key_environment_unique` (único): (job_key,environment)

### <a id="bradescoveicweb.scrap_clients_authorizations"></a>bradescoveicweb.scrap_clients_authorizations

_Tabela · ~6.250 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `auctioneer_id` | int | não |  |  |  |  |
| `client_id` | int | não |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.scrap_request_approvers"></a>bradescoveicweb.scrap_request_approvers

_Tabela · ~1.895 linhas (estimativa do InnoDB) · 8 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `scrap_request_id` | int | sim |  |  |  |  |
| `group_id` | int | sim |  |  |  |  |
| `user_id` | int | sim |  |  |  |  |
| `status` | varchar(255) | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.scrap_request_photos"></a>bradescoveicweb.scrap_request_photos

_Tabela · ~3.549 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `scrap_request_id` | int | sim |  |  |  |  |
| `photo` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.scrap_requests"></a>bradescoveicweb.scrap_requests

_Tabela · ~984 linhas (estimativa do InnoDB) · 12 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | não | MUL |  |  |  |
| `status` | enum('INDICACAO_LEILOEIRO','AGUARDANDO_APROVACAO','APROVADO','REPROVADO','CANCELADO') | sim |  |  |  |  |
| `current_step` | varchar(255) | sim |  |  |  |  |
| `start_date` | date | sim |  |  |  |  |
| `end_date` | date | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `user_id` | int | sim |  |  |  |  |
| `justification` | text | sim |  |  |  |  |
| `rejection_reason` | text | sim |  |  |  |  |

**Índices:** `idx_scrap_requests_asset_id_id`: (asset_id,id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.scrap_write_off_pricing_parameter"></a>bradescoveicweb.scrap_write_off_pricing_parameter

_Tabela · ~0 linhas (estimativa do InnoDB) · 5 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `value` | decimal(5,2) | não |  |  | 0.00 |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.sell_note_ocr_analyses"></a>bradescoveicweb.sell_note_ocr_analyses

_Tabela · ~3.092 linhas (estimativa do InnoDB) · 12 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `event_id` | int | não | MUL |  |  |  |
| `asset_id` | int | não |  |  |  |  |
| `sell_note_id` | int | sim |  |  |  |  |
| `percentage` | decimal(12,2) | sim |  |  |  |  |
| `result` | json | sim |  |  |  |  |
| `status` | enum('APROVADO','REPROVADO','APROVADO_MANUAL','REPROVADO_MANUAL') | sim |  |  |  |  |
| `user_id_checked` | int | sim |  |  |  |  |
| `date_user_checked` | datetime | sim |  |  |  |  |
| `observation_user_checked` | text | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id) · `sell_note_ocr_analyses_event_id_asset_id_unique` (único): (event_id,asset_id)

### <a id="bradescoveicweb.service_slas"></a>bradescoveicweb.service_slas

_Tabela · ~217 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `uf` | varchar(255) | não |  |  |  |  |
| `sla` | int | não |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `dispatcher_id` | int | sim | MUL |  |  |  |

**Índices:** `idx_service_slas_dispatcher_uf`: (dispatcher_id,uf) · `idx_service_slas_dispatcher_uf_id`: (dispatcher_id,uf,id) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.sessions"></a>bradescoveicweb.sessions

_Tabela · ~0 linhas (estimativa do InnoDB) · 6 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `payload` | varchar(2024) | sim |  |  |  |  |
| `last_activity` | varchar(256) | sim |  |  |  |  |
| `user_id` | varchar(256) | sim |  |  |  |  |
| `user_agent` | varchar(256) | sim |  |  |  |  |
| `ip_address` | varchar(256) | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.special_advisories"></a>bradescoveicweb.special_advisories

_Tabela · ~14 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim |  |  |  |  |
| `phone` | varchar(255) | sim |  |  |  |  |
| `percentage` | decimal(8,2) | sim |  |  |  |  |
| `is_rcb` | tinyint(1) | não |  |  | 0 |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.special_advisory_cases"></a>bradescoveicweb.special_advisory_cases

_Tabela · ~2.722 linhas (estimativa do InnoDB) · 14 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int unsigned | não | MUL |  |  |  |
| `origin` | enum('DISPATCHER','AUCTIONEER','BACKOFFICE','BLOCK_BACKOFFICE','AFTER_SALE') | não |  |  |  |  |
| `special_advisory_id` | int unsigned | sim | MUL |  |  |  |
| `dispatch_id` | int unsigned | sim | MUL |  |  |  |
| `asset_repurchase_id` | int unsigned | sim | MUL |  |  |  |
| `status` | enum('PENDING','LOST','WON') | não | MUL |  |  |  |
| `completion_date` | timestamp | sim | MUL |  |  |  |
| `created_by` | bigint unsigned | não | MUL |  |  |  |
| `updated_by` | bigint unsigned | sim | MUL |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Aponta para:** `asset_id` → `assets.id` · `asset_repurchase_id` → `assets_repurchases.id` · `created_by` → `users.id` · `dispatch_id` → `dispatch.id` · `special_advisory_id` → `special_advisories.id` · `updated_by` → `users.id`

**Índices:** `PRIMARY` (único): (id) · `special_advisory_cases_asset_id_foreign`: (asset_id) · `special_advisory_cases_asset_repurchase_id_foreign`: (asset_repurchase_id) · `special_advisory_cases_completion_date_index`: (completion_date) · `special_advisory_cases_created_by_foreign`: (created_by) · `special_advisory_cases_dispatch_id_foreign`: (dispatch_id) · `special_advisory_cases_special_advisory_id_foreign`: (special_advisory_id) · `special_advisory_cases_status_index`: (status) · `special_advisory_cases_updated_by_foreign`: (updated_by)

### <a id="bradescoveicweb.special_advisory_frequency_automatic_distribution"></a>bradescoveicweb.special_advisory_frequency_automatic_distribution

_Tabela · ~0 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `expression` | varchar(255) | sim |  |  |  |  |
| `hour` | varchar(255) | sim |  |  |  |  |
| `day_of_month` | varchar(255) | sim |  |  |  |  |
| `day_of_week` | varchar(255) | sim |  |  |  |  |
| `is_enabled` | tinyint(1) | não |  |  | 1 |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.stays"></a>bradescoveicweb.stays

_Tabela · ~309.099 linhas (estimativa do InnoDB) · 19 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `courtyard_id` | int | não | MUL |  |  |  |
| `vehicle_id` | int unsigned | não | MUL |  |  |  |
| `order_service_id` | int | sim |  |  |  |  |
| `removal_id` | int | sim |  |  |  |  |
| `user_id` | int | sim |  |  |  |  |
| `start_date_stay` | date | sim | MUL |  |  |  |
| `end_date_stay` | date | sim |  |  |  |  |
| `situation` | varchar(255) | sim | MUL |  |  |  |
| `vehicle` | varchar(255) | sim |  |  |  |  |
| `motive` | varchar(255) | sim |  |  |  |  |
| `delivered_to` | varchar(255) | sim |  |  |  |  |
| `return_type` | varchar(255) | sim |  |  |  |  |
| `observation` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim | MUL |  |  |  |
| `path_file` | varchar(255) | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Aponta para:** `vehicle_id` → `assets.id`

**Índices:** `idx_stays_courtyard_id`: (courtyard_id) · `idx_stays_date`: (start_date_stay,deleted_at) · `idx_stays_deleted_vehicle`: (deleted_at,vehicle_id,id) · `idx_stays_situation_start_date`: (situation,start_date_stay) · `idx_stays_vehicle_courtyard`: (vehicle_id,deleted_at,courtyard_id,updated_at) · `idx_stays_vehicle_id`: (vehicle_id) · `idx_stays_vehicle_id_situation`: (vehicle_id,situation) · `idx_stays_vehicle_situation`: (vehicle_id,situation,id) · `idx_stays_vehicle_situation_id`: (vehicle_id,situation,id) · `idx_stays_vehicle_start_date`: (vehicle_id,start_date_stay) · `PRIMARY` (único): (id) · `stays_vehicle_id_foreign`: (vehicle_id)

### <a id="bradescoveicweb.tabela_operacional_leilao"></a>bradescoveicweb.tabela_operacional_leilao

_View · ~0 linhas (estimativa do InnoDB) · 76 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `tag_id` | int | sim |  |  |  |  |
| `passagens_nos_eventos` | int | sim |  |  |  |  |
| `nome_tag` | varchar(255) | sim |  |  |  |  |
| `molicar_valor_mais_recente` | int | sim |  |  |  |  |
| `data_referencia_molicar` | date | sim |  |  |  |  |
| `molicar_ano_base` | int | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `inicio_remocao` | date | sim |  |  |  |  |
| `fim_remocao` | date | sim |  |  |  |  |
| `distancia_km` | decimal(5,1) | sim |  |  |  |  |
| `origem_endereco` | varchar(255) | sim |  |  |  |  |
| `origem_cidade` | varchar(255) | sim |  |  |  |  |
| `origem_uf` | varchar(255) | sim |  |  |  |  |
| `destino_cidade` | varchar(255) | sim |  |  |  |  |
| `destino_uf` | varchar(255) | sim |  |  |  |  |
| `destino_endereco` | varchar(255) | sim |  |  |  |  |
| `destino_numero` | varchar(255) | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `valor_da_contraproposta` | decimal(12,2) | sim |  |  |  |  |
| `id_evento` | int | sim |  |  |  |  |
| `aprovacao_leilao` | tinyint(1) | sim |  |  | 0 |  |
| `data_inicio_leilao` | datetime | sim |  |  |  |  |
| `situacao_leilao` | int | sim |  |  | 0 |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |
| `status_bloqueio` | enum('AGUARDANDO_APROVACAO','APROVADO','REPROVADO','CANCELADO','VENDA_LIBERADA','AGUARDANDO_DEFINICAO_LEILAO') | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.tabela_vendas"></a>bradescoveicweb.tabela_vendas

_View · ~0 linhas (estimativa do InnoDB) · 13 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `identificador` | int unsigned | não |  |  | 0 |  |
| `identificador_evento` | int | sim |  |  |  |  |
| `identificador_ativo` | int unsigned | não |  |  |  |  |
| `identificador_cliente` | int unsigned | sim |  |  |  |  |
| `identificador_canal_vendas` | int | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `nota_fiscal` | varchar(255) | sim |  |  |  |  |
| `valor_com_taxas` | decimal(12,2) | sim |  |  |  |  |
| `desconto` | double | sim |  |  |  |  |
| `data_inicio_evento` | datetime | sim |  |  |  |  |
| `data_fim_evento` | datetime | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |

### <a id="bradescoveicweb.tabelao_validador"></a>bradescoveicweb.tabelao_validador

_View · ~0 linhas (estimativa do InnoDB) · 46 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `nome` | varchar(255) | não |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `identificacao_contrato` | varchar(255) | sim |  |  |  |  |
| `centro_custo` | varchar(50) | sim |  |  |  |  |
| `nome_financiado_segurado` | varchar(255) | sim |  |  |  |  |
| `carteira` | varchar(255) | sim |  |  |  |  |
| `conta` | varchar(255) | sim |  |  |  |  |
| `agencia` | varchar(255) | sim |  |  |  |  |
| `financiado` | varchar(255) | sim |  |  |  |  |
| `nome_empresa` | varchar(100) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_sugerido` | decimal(10,2) | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `Importacao` | tinyint(1) | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_inicio_real_remocacao` | date | sim |  |  |  |  |
| `data_fim_real` | date | sim |  |  |  |  |
| `id_local` | int | sim |  |  |  |  |
| `id_destino_local` | int | sim |  |  |  |  |
| `nome_origem_remocao` | varchar(255) | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `status_evento` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `data_inicio_evento` | datetime | sim |  |  |  |  |
| `tipo_de_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_de_bloqueio` | varchar(255) | sim |  |  |  |  |
| `criado_em_bloqueio` | timestamp | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.tags"></a>bradescoveicweb.tags

_Tabela · ~18.493 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `fixed` | tinyint(1) | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.transfer_receipts"></a>bradescoveicweb.transfer_receipts

_Tabela · ~5.247 linhas (estimativa do InnoDB) · 18 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `company_id` | int | não |  |  |  |  |
| `path_file` | varchar(255) | não |  |  |  |  |
| `event_id` | int | não | MUL |  |  |  |
| `auctioneer_id` | int | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `checked_account` | tinyint(1) | sim |  |  |  |  |
| `checked_agency` | tinyint(1) | sim |  |  |  |  |
| `checked_value` | tinyint(1) | sim |  |  |  |  |
| `checked_obs` | varchar(255) | sim |  |  |  |  |
| `checked_json` | text | sim |  |  |  |  |
| `value` | decimal(12,2) | sim |  |  |  |  |
| `amount_assets` | int | sim |  |  |  |  |
| `user_observation` | varchar(255) | sim |  |  |  |  |
| `user_id_checked` | int | sim |  |  |  |  |
| `date_user_checked` | datetime | sim |  |  |  |  |
| `user_status_checked` | enum('APROVADO','REPROVADO') | sim |  |  |  |  |

**Índices:** `idx_event_created`: (event_id,created_at) · `idx_transfer_receipts_event_company`: (event_id,company_id,id) · `idx_transfer_receipts_event_created`: (event_id,created_at) · `idx_transfer_receipts_event_id_created_at`: (event_id,created_at) · `PRIMARY` (único): (id)

### <a id="bradescoveicweb.transfer_receipts_sales_channels"></a>bradescoveicweb.transfer_receipts_sales_channels

_Tabela · ~0 linhas (estimativa do InnoDB) · 15 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `asset_id` | int | sim |  |  |  |  |
| `assets_sales_channel_id` | int | sim |  |  |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `company_id` | int | sim |  |  |  |  |
| `path_file` | varchar(255) | sim |  |  |  |  |
| `checked_account` | tinyint(1) | não |  |  | 0 |  |
| `checked_agency` | tinyint(1) | não |  |  | 0 |  |
| `checked_value` | tinyint(1) | não |  |  | 0 |  |
| `checked_obs` | varchar(255) | sim |  |  |  |  |
| `checked_json` | text | sim |  |  |  |  |
| `value` | decimal(12,2) | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.user_alert_preferences"></a>bradescoveicweb.user_alert_preferences

_Tabela · ~288 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `user_id` | bigint unsigned | não | MUL |  |  |  |
| `alert_type_id` | bigint unsigned | não | MUL |  |  |  |
| `enabled` | tinyint(1) | não |  |  | 1 |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `alert_type_id` → `alert_types.id` · `user_id` → `users.id`

**Índices:** `PRIMARY` (único): (id) · `user_alert_preferences_alert_type_id_index`: (alert_type_id) · `user_alert_preferences_user_id_alert_type_id_unique` (único): (user_id,alert_type_id) · `user_alert_preferences_user_id_index`: (user_id)

### <a id="bradescoveicweb.users"></a>bradescoveicweb.users

_Tabela · ~912 linhas (estimativa do InnoDB) · 19 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | não |  |  |  |  |
| `email` | varchar(255) | não | UNI |  |  |  |
| `alternative_email` | varchar(255) | sim |  |  |  |  |
| `email_verified_at` | timestamp | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `rules` | json | sim |  |  |  |  |
| `signature` | varchar(255) | sim |  |  |  |  |
| `active` | tinyint(1) | não |  |  | 1 |  |
| `type` | enum('ADVISORY','SPECIAL_ADVISORY','AUCTIONEER','BACKOFFICE','DISPATCHER','BACKOFFICE_ADMIN','REPORT_COMPANY','DISPATCH_ADMIN') | sim |  |  |  |  |
| `auctioneer_id` | int | sim |  |  |  |  |
| `advisory_id` | int | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `dispatcher_id` | int | sim |  |  |  |  |
| `special_advisory_id` | int | sim |  |  |  |  |
| `report_company_id` | int unsigned | sim | MUL |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Aponta para:** `report_company_id` → `reports_companies.id`

**Índices:** `PRIMARY` (único): (id) · `users_email_unique` (único): (email) · `users_report_company_id_foreign`: (report_company_id)

### <a id="bradescoveicweb.vehicle_buckets"></a>bradescoveicweb.vehicle_buckets

_Tabela · ~120.520 linhas (estimativa do InnoDB) · 35 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não | PRI | auto_increment |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `car_plate` | varchar(255) | sim |  |  |  |  |
| `engine_number_curent` | varchar(255) | sim |  |  |  |  |
| `engine_power` | varchar(255) | sim |  |  |  |  |
| `cylinders` | varchar(255) | sim |  |  |  |  |
| `plate_uf` | varchar(255) | sim |  |  |  |  |
| `plate_city` | varchar(255) | sim |  |  |  |  |
| `type` | varchar(255) | sim |  |  |  |  |
| `automaker_id` | int unsigned | sim |  |  |  |  |
| `version` | varchar(255) | sim |  |  |  |  |
| `model_detram` | varchar(255) | sim |  |  |  |  |
| `engine` | varchar(255) | sim |  |  |  |  |
| `year_manufacture` | int | sim |  |  |  |  |
| `year_model` | int | sim |  |  |  |  |
| `color_id` | int unsigned | sim |  |  |  |  |
| `body_type` | varchar(255) | sim |  |  |  |  |
| `fuel_id` | int | sim |  |  |  |  |
| `country_origin` | varchar(255) | sim |  |  |  |  |
| `region` | varchar(255) | sim |  |  |  |  |
| `shaft_quantity` | varchar(255) | sim |  |  |  |  |
| `date_crv_crlv` | date | sim |  |  |  |  |
| `licensing_date` | date | sim |  |  |  |  |
| `name_financed_insured` | varchar(255) | sim |  |  |  |  |
| `previous_owner_name` | varchar(255) | sim |  |  |  |  |
| `current_owner_name` | varchar(255) | sim |  |  |  |  |
| `date_validity` | date | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `list-molicar` | json | sim |  |  |  |  |

🔒 4 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (id)

### <a id="bradescoveicweb.vehicle_watch_terms"></a>bradescoveicweb.vehicle_watch_terms

_Tabela · ~2 linhas (estimativa do InnoDB) · 9 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não | PRI | auto_increment |  |  |
| `term` | varchar(255) | não | UNI |  |  |  |
| `description` | text | sim |  |  |  |  |
| `recipients` | json | sim |  |  |  |  |
| `active` | tinyint(1) | não |  |  | 1 |  |
| `created_by` | bigint unsigned | sim | MUL |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

**Aponta para:** `created_by` → `users.id`

**Índices:** `PRIMARY` (único): (id) · `vehicle_watch_terms_created_by_foreign`: (created_by) · `vehicle_watch_terms_term_unique` (único): (term)

### <a id="bradescoveicweb.vendas_completa"></a>bradescoveicweb.vendas_completa

_View · ~0 linhas (estimativa do InnoDB) · 55 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |
| `custo_veiculo` | double | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.vendas_qtde"></a>bradescoveicweb.vendas_qtde

_View · ~0 linhas (estimativa do InnoDB) · 14 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `data_evento_mais_recente` | timestamp | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="bradescoveicweb.vendidos_2025_jan_mai"></a>bradescoveicweb.vendidos_2025_jan_mai

_View · ~0 linhas (estimativa do InnoDB) · 57 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | date | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | date | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `nome_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | date | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | date | sim |  |  |  |  |
| `valor_da_contraproposta` | decimal(12,2) | sim |  |  |  |  |
| `data_inicio_leilao` | date | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | date | sim |  |  |  |  |
| `conclusao_despacho` | date | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

## Schema `mart` — 59 objetos

| objeto | tipo | linhas (estim.) | colunas |
|---|---|---:|---:|
| [`Logins_c2y`](#mart.Logins_c2y) | tabela | 8.686 | 4 |
| [`Perfomance_Bancos`](#mart.Perfomance_Bancos) | view | 0 | 55 |
| [`Performance_BARE`](#mart.Performance_BARE) | view | 0 | 50 |
| [`Valida_Duplicidade_Estoque`](#mart.Valida_Duplicidade_Estoque) | view | 0 | 7 |
| [`Veiculos_em_berto`](#mart.Veiculos_em_berto) | view | 0 | 56 |
| [`analitio_leiloes`](#mart.analitio_leiloes) | view | 0 | 67 |
| [`assets_status_view`](#mart.assets_status_view) | view | 0 | 10 |
| [`baixados_2025`](#mart.baixados_2025) | view | 0 | 55 |
| [`consulta_molicar`](#mart.consulta_molicar) | view | 0 | 7 |
| [`current_assets_status`](#mart.current_assets_status) | view | 0 | 7 |
| [`d_assessoria`](#mart.d_assessoria) | view | 0 | 7 |
| [`d_bancos`](#mart.d_bancos) | view | 0 | 11 |
| [`d_despachante`](#mart.d_despachante) | view | 0 | 22 |
| [`d_documentos`](#mart.d_documentos) | view | 0 | 7 |
| [`d_empresas`](#mart.d_empresas) | view | 0 | 6 |
| [`d_eventos`](#mart.d_eventos) | view | 0 | 42 |
| [`d_leiloeiros`](#mart.d_leiloeiros) | view | 0 | 27 |
| [`d_molicar`](#mart.d_molicar) | view | 0 | 8 |
| [`d_patio`](#mart.d_patio) | view | 0 | 31 |
| [`d_status_regularizao_despachante`](#mart.d_status_regularizao_despachante) | view | 0 | 11 |
| [`d_veiculos_bens`](#mart.d_veiculos_bens) | view | 0 | 29 |
| [`despachante_estoque_fechamento`](#mart.despachante_estoque_fechamento) | tabela | 86.163 | 26 |
| [`despachante_meta_fechamento`](#mart.despachante_meta_fechamento) | tabela | 109 | 4 |
| [`despachante_meta_teste`](#mart.despachante_meta_teste) | tabela | 60 | 4 |
| [`despachante_processos_enviados_fechamento`](#mart.despachante_processos_enviados_fechamento) | tabela | 60.354 | 25 |
| [`despachante_regularizado_fechamento`](#mart.despachante_regularizado_fechamento) | tabela | 75.857 | 24 |
| [`dm_painel_despachantes_depara`](#mart.dm_painel_despachantes_depara) | tabela | 95 | 7 |
| [`f_assessoria`](#mart.f_assessoria) | view | 0 | 115 |
| [`f_ativos_status_atual`](#mart.f_ativos_status_atual) | view | 0 | 47 |
| [`f_baixados_vendidos`](#mart.f_baixados_vendidos) | view | 0 | 66 |
| [`f_consolidado_dispatch_pendencies`](#mart.f_consolidado_dispatch_pendencies) | view | 0 | 20 |
| [`f_consulta_documentos_vendas`](#mart.f_consulta_documentos_vendas) | view | 0 | 19 |
| [`f_despachante`](#mart.f_despachante) | view | 0 | 19 |
| [`f_despachante2`](#mart.f_despachante2) | view | 0 | 33 |
| [`f_entradas`](#mart.f_entradas) | view | 0 | 30 |
| [`f_enviados_despachantes`](#mart.f_enviados_despachantes) | view | 0 | 48 |
| [`f_estoque_despachante`](#mart.f_estoque_despachante) | view | 0 | 47 |
| [`f_estoque_new_fotografia`](#mart.f_estoque_new_fotografia) | tabela | 1.151.245 | 36 |
| [`f_estoquenew`](#mart.f_estoquenew) | view | 0 | 34 |
| [`f_eventos`](#mart.f_eventos) | view | 0 | 63 |
| [`f_eventosV2`](#mart.f_eventosV2) | view | 0 | 26 |
| [`f_leilao_operacional`](#mart.f_leilao_operacional) | view | 0 | 76 |
| [`f_patio`](#mart.f_patio) | view | 0 | 22 |
| [`f_pendencias`](#mart.f_pendencias) | view | 0 | 12 |
| [`f_regularizados`](#mart.f_regularizados) | view | 0 | 47 |
| [`f_regularizados_despachante`](#mart.f_regularizados_despachante) | view | 0 | 48 |
| [`f_remocoes`](#mart.f_remocoes) | view | 0 | 34 |
| [`f_status_ativos`](#mart.f_status_ativos) | view | 0 | 7 |
| [`f_users`](#mart.f_users) | view | 0 | 15 |
| [`f_vendas`](#mart.f_vendas) | view | 0 | 62 |
| [`fotografia_despachante_enviados`](#mart.fotografia_despachante_enviados) | tabela | 104.923 | 26 |
| [`fotografia_despachante_estoque`](#mart.fotografia_despachante_estoque) | tabela | 638.147 | 27 |
| [`fotografia_despachante_regularizados`](#mart.fotografia_despachante_regularizados) | tabela | 96.119 | 25 |
| [`tabela_operacional_leilao`](#mart.tabela_operacional_leilao) | view | 0 | 76 |
| [`tabela_vendas`](#mart.tabela_vendas) | view | 0 | 13 |
| [`tabelao_validador`](#mart.tabelao_validador) | view | 0 | 46 |
| [`veiculos_pri_ult_entrada`](#mart.veiculos_pri_ult_entrada) | tabela | 1.090.537 | 4 |
| [`vendas_completa`](#mart.vendas_completa) | view | 0 | 55 |
| [`vendas_qtde`](#mart.vendas_qtde) | view | 0 | 14 |

### <a id="mart.Logins_c2y"></a>mart.Logins_c2y

_Tabela · ~8.686 linhas (estimativa do InnoDB) · 4 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `_rowid` | int | não | PRI | auto_increment |  |  |
| `id` | int | sim |  |  |  |  |
| `Primeiro Login` | datetime | sim |  |  |  |  |
| `Último Login` | datetime | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (_rowid)

### <a id="mart.Perfomance_Bancos"></a>mart.Perfomance_Bancos

_View · ~0 linhas (estimativa do InnoDB) · 55 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | date | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | decimal(19,0) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |
| `custo_veiculo` | double | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.Performance_BARE"></a>mart.Performance_BARE

_View · ~0 linhas (estimativa do InnoDB) · 50 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | sim |  |  | 0 |  |
| `atualizado_status_venda` | date | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | sim |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status_evento` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `qtde_eventos_asset` | bigint | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.Valida_Duplicidade_Estoque"></a>mart.Valida_Duplicidade_Estoque

_View · ~0 linhas (estimativa do InnoDB) · 7 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `contratct_identification` | varchar(255) | sim |  |  |  |  |
| `car_plate` | varchar(255) | sim |  |  |  |  |
| `imported` | tinyint(1) | sim |  |  |  |  |
| `sell_status` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `quantidade` | bigint | não |  |  | 0 |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.Veiculos_em_berto"></a>mart.Veiculos_em_berto

_View · ~0 linhas (estimativa do InnoDB) · 56 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `valor_da_contraproposta` | decimal(12,2) | sim |  |  |  |  |
| `data_inicio_leilao` | datetime | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.analitio_leiloes"></a>mart.analitio_leiloes

_View · ~0 linhas (estimativa do InnoDB) · 67 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `valor_sugerido` | decimal(10,2) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `tag_id` | int | sim |  |  |  |  |
| `passagens_nos_eventos` | int | sim |  |  |  |  |
| `molicar_valor_mais_recente` | int | sim |  |  |  |  |
| `data_referencia_molicar` | date | sim |  |  |  |  |
| `molicar_ano_base` | int | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `valor_da_contraproposta` | decimal(12,2) | sim |  |  |  |  |
| `id_evento` | int | sim |  |  |  |  |
| `id_cliente` | int unsigned | sim |  |  |  |  |
| `data_inicio_leilao` | datetime | sim |  |  |  |  |
| `aprovacao_leilao` | tinyint(1) | sim |  |  | 0 |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao_estadia` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |
| `nome_cliente` | varchar(255) | sim |  |  |  |  |

🔒 6 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.assets_status_view"></a>mart.assets_status_view

_View · ~0 linhas (estimativa do InnoDB) · 10 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `asset_id` | int unsigned | não |  |  | 0 |  |
| `car_plate` | varchar(255) | sim |  |  |  |  |
| `sell_status` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `removal_id` | int unsigned | sim |  |  | 0 |  |
| `situation_stock` | varchar(255) | sim |  |  |  |  |
| `block_type` | varchar(255) | sim |  |  |  |  |
| `block_status` | enum('AGUARDANDO_APROVACAO','APROVADO','REPROVADO','CANCELADO','VENDA_LIBERADA','AGUARDANDO_DEFINICAO_LEILAO') | sim |  |  |  |  |
| `situation` | varchar(21) | sim |  |  |  |  |
| `detailing` | varchar(255) | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.baixados_2025"></a>mart.baixados_2025

_View · ~0 linhas (estimativa do InnoDB) · 55 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `valor_da_contraproposta` | decimal(12,2) | sim |  |  |  |  |
| `data_inicio_leilao` | datetime | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.consulta_molicar"></a>mart.consulta_molicar

_View · ~0 linhas (estimativa do InnoDB) · 7 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `asset_id` | int unsigned | não |  |  | 0 |  |
| `molicar_code` | varchar(255) | sim |  |  |  |  |
| `year_model` | varchar(255) | sim |  |  |  |  |
| `molicar_value` | int | sim |  |  |  |  |
| `reference_date` | date | sim |  |  |  |  |
| `molicar_year` | int | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.current_assets_status"></a>mart.current_assets_status

_View · ~0 linhas (estimativa do InnoDB) · 7 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não |  |  | 0 |  |
| `stage` | varchar(255) | não |  |  |  |  |
| `status` | varchar(255) | não |  |  |  |  |
| `user_id` | int | sim |  |  |  |  |
| `asset_id` | int unsigned | não |  |  |  |  |
| `created_at` | timestamp | sim |  |  |  |  |
| `updated_at` | timestamp | sim |  |  |  |  |

### <a id="mart.d_assessoria"></a>mart.d_assessoria

_View · ~0 linhas (estimativa do InnoDB) · 7 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `name` | varchar(255) | não |  |  |  |  |
| `phone` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim |  |  |  |  |
| `user` | varchar(255) | sim |  |  |  |  |
| `deleted_at` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.d_bancos"></a>mart.d_bancos

_View · ~0 linhas (estimativa do InnoDB) · 11 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `codigo` | varchar(255) | sim |  |  |  |  |
| `nome` | varchar(255) | sim |  |  |  |  |
| `agencia` | varchar(255) | sim |  |  |  |  |
| `conta` | varchar(255) | sim |  |  |  |  |
| `tipo_transferencia` | enum('Tric Web','Depósito em conta','Boleto Bancário','Depósito Identificado') | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `dias_para_regularizar` | int | não |  |  | 0 |  |
| `codigo_gran` | enum('BRAD','CONS','LEAS','BBFN') | sim |  |  |  |  |

### <a id="mart.d_despachante"></a>mart.d_despachante

_View · ~0 linhas (estimativa do InnoDB) · 22 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `nome` | varchar(255) | sim |  |  |  |  |
| `nome_contato` | varchar(255) | sim |  |  |  |  |
| `telefone` | varchar(255) | sim |  |  |  |  |
| `email` | varchar(255) | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `rua` | varchar(255) | sim |  |  |  |  |
| `numero` | varchar(255) | sim |  |  |  |  |
| `complemento` | varchar(255) | sim |  |  |  |  |
| `cidade` | varchar(255) | sim |  |  |  |  |
| `estado` | varchar(255) | sim |  |  |  |  |
| `cep` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `centro` | varchar(255) | sim |  |  |  |  |
| `centro_custo` | varchar(255) | sim |  |  |  |  |
| `localizacao` | varchar(255) | sim |  |  |  |  |
| `item_contrato` | varchar(255) | sim |  |  |  |  |
| `id_cliente` | varchar(255) | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.d_documentos"></a>mart.d_documentos

_View · ~0 linhas (estimativa do InnoDB) · 7 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `id_bem` | int unsigned | não |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `tipo` | enum('FOTOS','AUT','MAN','CER','TEA','CRV','CRL','CRLVB','CRLVF','VIS','DUT','DEC','CDM','ATPV','PDR','TDR','PDC','CMON','PPV','OUTROS','TERM_ENTREGA','PET_INI','SEN','NF','BAIXA_SUCATA') | sim |  |  |  |  |
| `caminho` | varchar(255) | não |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |

### <a id="mart.d_empresas"></a>mart.d_empresas

_View · ~0 linhas (estimativa do InnoDB) · 6 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `id_banco` | int | sim |  |  |  |  |
| `nome` | varchar(255) | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |

### <a id="mart.d_eventos"></a>mart.d_eventos

_View · ~0 linhas (estimativa do InnoDB) · 42 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `nome` | varchar(255) | sim |  |  |  |  |
| `ativo` | tinyint(1) | sim |  |  |  |  |
| `destacado_pagina_principal` | tinyint(1) | sim |  |  |  |  |
| `tipo_evento` | enum('Evento','Oportunidade') | sim |  |  |  |  |
| `prioridade` | int | sim |  |  |  |  |
| `situacao` | enum('Cancelado','Baixado','Realizado','Finalizado') | sim |  |  |  |  |
| `data_inicio_evento` | datetime | sim |  |  |  |  |
| `data_fim_evento` | datetime | sim |  |  |  |  |
| `data_inicio_exibicao` | datetime | sim |  |  |  |  |
| `data_fim_exibicao` | datetime | sim |  |  |  |  |
| `imediatamente_apos_fim` | tinyint(1) | sim |  |  |  |  |
| `confirmacao_regulamento_email` | tinyint(1) | sim |  |  |  |  |
| `finalizacao` | enum('Sequencial','Individual') | sim |  |  |  |  |
| `segundos_entre_eventos` | int | sim |  |  |  |  |
| `segundos_minimos` | int | sim |  |  |  |  |
| `segundos_extras` | int | sim |  |  |  |  |
| `local` | varchar(255) | sim |  |  |  |  |
| `regulamento` | varchar(255) | sim |  |  |  |  |
| `descricao_oportunidade` | varchar(255) | sim |  |  |  |  |
| `banner` | varchar(255) | sim |  |  |  |  |
| `comprar_agora` | tinyint(1) | sim |  |  |  |  |
| `disputa_tempo_real` | tinyint(1) | sim |  |  |  |  |
| `remover_site_apos_venda` | tinyint(1) | sim |  |  |  |  |
| `mostrar_cidade` | tinyint(1) | sim |  |  |  |  |
| `propostas` | tinyint(1) | sim |  |  |  |  |
| `propostas_remover_site_apos_venda` | tinyint(1) | sim |  |  |  |  |
| `propostas_mostrar_cidade` | tinyint(1) | sim |  |  |  |  |
| `comprar_agora_remover_site_apos_venda` | tinyint(1) | sim |  |  |  |  |
| `comprar_agora_mostrar_cidade` | tinyint(1) | sim |  |  |  |  |
| `grupo_cliente` | json | sim |  |  |  |  |
| `marca_personalizada` | json | sim |  |  |  |  |
| `etiquetas` | json | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `realizado` | int | sim |  |  | 0 |  |
| `aprovado` | tinyint(1) | não |  |  | 0 |  |
| `data_aprovacao` | datetime | sim |  |  |  |  |
| `aprovado_por` | int | sim |  |  |  |  |
| `cancelado` | tinyint(1) | sim |  |  | 0 |  |

### <a id="mart.d_leiloeiros"></a>mart.d_leiloeiros

_View · ~0 linhas (estimativa do InnoDB) · 27 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `nome` | varchar(255) | não |  |  |  |  |
| `ativo` | int | sim |  |  |  |  |
| `cep` | varchar(255) | sim |  |  |  |  |
| `logradouro` | varchar(255) | sim |  |  |  |  |
| `numero` | varchar(255) | sim |  |  |  |  |
| `complemento` | varchar(255) | sim |  |  |  |  |
| `bairro` | varchar(255) | sim |  |  |  |  |
| `cidade` | varchar(255) | sim |  |  |  |  |
| `estado` | varchar(255) | sim |  |  |  |  |
| `referencias` | varchar(255) | sim |  |  |  |  |
| `numero_contato` | varchar(255) | sim |  |  |  |  |
| `numero_contato_2` | varchar(255) | sim |  |  |  |  |
| `email_contato` | varchar(255) | sim |  |  |  |  |
| `descricao_contato` | varchar(255) | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `nome_importacao` | varchar(255) | sim |  |  |  |  |
| `nome_contato` | varchar(255) | sim |  |  |  |  |
| `id_sla` | int | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `id_cliente` | varchar(255) | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |

🔒 4 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.d_molicar"></a>mart.d_molicar

_View · ~0 linhas (estimativa do InnoDB) · 8 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `identificador` | bigint unsigned | não |  |  | 0 |  |
| `codigo_molicar` | varchar(255) | não |  |  |  |  |
| `valor_molicar` | int | não |  |  |  |  |
| `data_referencia` | date | não |  |  |  |  |
| `data_criacao` | timestamp | sim |  |  |  |  |
| `data_atualizacao` | timestamp | sim |  |  |  |  |
| `ano` | int | não |  |  |  |  |
| `novo` | tinyint(1) | não |  |  | 0 |  |

### <a id="mart.d_patio"></a>mart.d_patio

_View · ~0 linhas (estimativa do InnoDB) · 31 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `nome` | varchar(255) | não |  |  |  |  |
| `limite_vagas` | int | sim |  |  |  |  |
| `ordem_demonstrativa` | int | sim |  |  |  |  |
| `ativo` | int | sim |  |  |  |  |
| `link_google` | varchar(255) | sim |  |  |  |  |
| `diaria` | decimal(12,2) | sim |  |  |  |  |
| `foto` | varchar(255) | sim |  |  |  |  |
| `cep` | varchar(255) | sim |  |  |  |  |
| `endereco` | varchar(255) | sim |  |  |  |  |
| `numero` | varchar(255) | sim |  |  |  |  |
| `complemento` | varchar(255) | sim |  |  |  |  |
| `bairro` | varchar(255) | sim |  |  |  |  |
| `cidade` | varchar(255) | não |  |  |  |  |
| `estado` | varchar(255) | não |  |  |  |  |
| `referencias` | varchar(255) | sim |  |  |  |  |
| `endereco_google` | varchar(255) | sim |  |  |  |  |
| `localizacao_aproximada` | int | sim |  |  |  |  |
| `numero_contato` | varchar(255) | sim |  |  |  |  |
| `numero_contato_2` | varchar(255) | sim |  |  |  |  |
| `email_contato` | varchar(255) | sim |  |  |  |  |
| `responsavel` | varchar(255) | sim |  |  |  |  |
| `suporte` | varchar(255) | sim |  |  |  |  |
| `descricao_contato` | varchar(255) | sim |  |  |  |  |
| `forma_pagamento` | varchar(255) | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `longitude` | varchar(255) | sim |  |  |  |  |
| `latitude` | varchar(255) | sim |  |  |  |  |

### <a id="mart.d_status_regularizao_despachante"></a>mart.d_status_regularizao_despachante

_View · ~0 linhas (estimativa do InnoDB) · 11 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_despacho` | int unsigned | não |  |  | 0 |  |
| `id_despachante` | int | sim |  |  |  |  |
| `id_bem` | int unsigned | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `excluido_em_despacho` | timestamp | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | não |  |  |  |  |
| `observacao_despacho` | text | sim |  |  |  |  |
| `divida_alta` | tinyint(1) | não |  |  | 0 |  |
| `aprovacao_divida_alta` | enum('EM_ANALISE','APROVADO') | sim |  |  |  |  |

### <a id="mart.d_veiculos_bens"></a>mart.d_veiculos_bens

_View · ~0 linhas (estimativa do InnoDB) · 29 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `nome` | varchar(255) | não |  |  |  |  |
| `numero_motor_atual` | varchar(255) | sim |  |  |  |  |
| `numero_motor_original` | varchar(255) | sim |  |  |  |  |
| `potencia_motor` | varchar(255) | sim |  |  |  |  |
| `cilindros` | varchar(255) | sim |  |  |  |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `motor` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `pais_origem` | varchar(255) | sim |  |  |  |  |
| `regiao` | varchar(255) | sim |  |  |  |  |
| `quantidade_eixos` | varchar(255) | sim |  |  |  |  |
| `data_crv_crlv` | date | sim |  |  |  |  |
| `data_licenciamento` | date | sim |  |  |  |  |
| `id_bem` | int | sim |  |  |  |  |
| `tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_bem` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |

🔒 6 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.despachante_estoque_fechamento"></a>mart.despachante_estoque_fechamento

_Tabela · ~86.163 linhas (estimativa do InnoDB) · 26 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `_rowid` | int | não | PRI | auto_increment |  |  |
| `numeracao` | varchar(255) | sim |  |  |  |  |
| `despachante` | varchar(255) | sim |  |  |  |  |
| `marca` | varchar(255) | sim |  |  |  |  |
| `modelo` | varchar(255) | sim |  |  |  |  |
| `data_envio` | datetime | sim |  |  |  |  |
| `uf` | varchar(255) | sim |  |  |  |  |
| `tipo_de_prazo` | varchar(255) | sim |  |  |  |  |
| `numero_de_dias_para_retorno` | varchar(255) | sim |  |  |  |  |
| `data_prevista_para_retorno` | datetime | sim |  |  |  |  |
| `data_de_retorno_do_despachante` | datetime | sim |  |  |  |  |
| `tempo_decorrido` | varchar(255) | sim |  |  |  |  |
| `tempo_utilizado` | varchar(255) | sim |  |  |  |  |
| `eficiencia_do_prazo` | varchar(255) | sim |  |  |  |  |
| `eficiencia_da_entrega` | varchar(255) | sim |  |  |  |  |
| `check` | varchar(255) | sim |  |  |  |  |
| `mes` | int | sim |  |  |  |  |
| `ano` | int | sim |  |  |  |  |
| `patrimonio` | varchar(255) | sim |  |  |  |  |
| `mes_correspondente` | datetime | sim |  |  |  |  |
| `liberacao_antecipada` | varchar(255) | sim |  |  |  |  |
| `status_venda` | varchar(255) | sim |  |  |  |  |
| `banco` | varchar(255) | sim |  |  |  |  |
| `id_banco` | int | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (_rowid)

### <a id="mart.despachante_meta_fechamento"></a>mart.despachante_meta_fechamento

_Tabela · ~109 linhas (estimativa do InnoDB) · 4 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `_rowid` | int | não | PRI | auto_increment |  |  |
| `Despachante` | varchar(255) | sim |  |  |  |  |
| `Mes` | datetime | sim |  |  |  |  |
| `Meta` | int | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (_rowid)

### <a id="mart.despachante_meta_teste"></a>mart.despachante_meta_teste

_Tabela · ~60 linhas (estimativa do InnoDB) · 4 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `_rowid` | int | não | PRI | auto_increment |  |  |
| `Despachante` | varchar(255) | sim |  |  |  |  |
| `Mes` | datetime | sim |  |  |  |  |
| `Meta` | int | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (_rowid)

### <a id="mart.despachante_processos_enviados_fechamento"></a>mart.despachante_processos_enviados_fechamento

_Tabela · ~60.354 linhas (estimativa do InnoDB) · 25 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `_rowid` | int | não | PRI | auto_increment |  |  |
| `numeracao` | varchar(255) | sim |  |  |  |  |
| `despachante` | varchar(255) | sim |  |  |  |  |
| `data_envio` | datetime | sim |  |  |  |  |
| `contar_de_data_envio` | int | sim |  |  |  |  |
| `marca` | varchar(255) | sim |  |  |  |  |
| `modelo` | varchar(255) | sim |  |  |  |  |
| `uf` | varchar(255) | sim |  |  |  |  |
| `tipo_de_prazo` | varchar(16) | sim |  |  |  |  |
| `numero_de_dias_para_retorno` | int | sim |  |  |  |  |
| `data_prevista_para_retorno` | datetime | sim |  |  |  |  |
| `data_de_retorno_do_despachante` | datetime | sim |  |  |  |  |
| `tempo_decorrido` | int | sim |  |  |  |  |
| `tempo_utilizado` | int | sim |  |  |  |  |
| `eficiencia_do_prazo` | int | sim |  |  |  |  |
| `conta_de_eficiencia_da_entrega` | int | sim |  |  |  |  |
| `percentual_retorno` | int | sim |  |  |  |  |
| `nota` | int | sim |  |  |  |  |
| `nome_mes` | varchar(255) | sim |  |  |  |  |
| `ano` | int | sim |  |  |  |  |
| `ultimo_dia_mes` | datetime | sim |  |  |  |  |
| `banco` | varchar(255) | sim |  |  |  |  |
| `id_banco` | int | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (_rowid)

### <a id="mart.despachante_regularizado_fechamento"></a>mart.despachante_regularizado_fechamento

_Tabela · ~75.857 linhas (estimativa do InnoDB) · 24 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `_rowid` | int | não | PRI | auto_increment |  |  |
| `numeracao` | varchar(255) | sim |  |  |  |  |
| `despachante` | varchar(255) | sim |  |  |  |  |
| `marca` | varchar(255) | sim |  |  |  |  |
| `modelo` | varchar(255) | sim |  |  |  |  |
| `data_envio` | datetime | sim |  |  |  |  |
| `uf` | varchar(255) | sim |  |  |  |  |
| `tipo_de_prazo` | varchar(255) | sim |  |  |  |  |
| `numero_de_dias_para_retorno` | int | sim |  |  |  |  |
| `data_prevista_para_retorno` | datetime | sim |  |  |  |  |
| `data_de_retorno_do_despachante` | datetime | sim |  |  |  |  |
| `contar_de_data_de_retorno_do_despachante` | int | sim |  |  |  |  |
| `tempo_decorrido` | int | sim |  |  |  |  |
| `tempo_utilizado` | int | sim |  |  |  |  |
| `eficiencia_prazo` | int | sim |  |  |  |  |
| `nome_mes` | varchar(255) | sim |  |  |  |  |
| `ano` | int | sim |  |  |  |  |
| `ultimo_dia_mes` | datetime | sim |  |  |  |  |
| `liberacao_antecipada` | varchar(255) | sim |  |  |  |  |
| `status_venda` | varchar(255) | sim |  |  |  |  |
| `banco` | varchar(255) | sim |  |  |  |  |
| `id_banco` | int | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (_rowid)

### <a id="mart.dm_painel_despachantes_depara"></a>mart.dm_painel_despachantes_depara

_Tabela · ~95 linhas (estimativa do InnoDB) · 7 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `_rowid` | int | não | PRI | auto_increment |  |  |
| `PATIO` | varchar(255) | sim |  |  |  |  |
| `CIDADE_DESTINO_REMOCAO` | varchar(255) | sim |  |  |  |  |
| `LEILOEIRO` | varchar(255) | sim |  |  |  |  |
| `REGIAO_PERFORMANCE` | varchar(255) | sim |  |  |  |  |
| `OBSERVACOES` | varchar(255) | sim |  |  |  |  |
| `BANCOS_CONSIDERADO` | varchar(255) | sim |  |  |  |  |

**Índices:** `PRIMARY` (único): (_rowid)

### <a id="mart.f_assessoria"></a>mart.f_assessoria

_View · ~0 linhas (estimativa do InnoDB) · 115 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `nome` | varchar(255) | não |  |  |  |  |
| `numero_motor_atual` | varchar(255) | sim |  |  |  |  |
| `numero_motor_original` | varchar(255) | sim |  |  |  |  |
| `potencia_motor` | varchar(255) | sim |  |  |  |  |
| `cilindros` | varchar(255) | sim |  |  |  |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `motor` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `pais_origem` | varchar(255) | sim |  |  |  |  |
| `regiao` | varchar(255) | sim |  |  |  |  |
| `quantidade_eixos` | varchar(255) | sim |  |  |  |  |
| `data_crv_crlv` | date | sim |  |  |  |  |
| `data_licenciamento` | date | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `nome_financiado_segurado` | varchar(255) | sim |  |  |  |  |
| `identificacao_contrato` | varchar(255) | sim |  |  |  |  |
| `identificacao_sinistro` | varchar(255) | sim |  |  |  |  |
| `recebido_por` | varchar(255) | sim |  |  |  |  |
| `nome_proprietario_anterior` | varchar(255) | sim |  |  |  |  |
| `nome_proprietario_atual` | varchar(255) | sim |  |  |  |  |
| `carteira` | varchar(255) | sim |  |  |  |  |
| `tipo_remocao` | varchar(255) | sim |  |  |  |  |
| `id_assessoria` | int | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `crivo` | tinyint(1) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `transmissao` | enum('automatico','manual','automatizado') | sim |  |  |  |  |
| `tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `descricao` | varchar(255) | sim |  |  |  |  |
| `numero_serie` | varchar(255) | sim |  |  |  |  |
| `id_bem` | int | sim |  |  |  |  |
| `gcpj` | varchar(255) | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `conta` | varchar(255) | sim |  |  |  |  |
| `agencia` | varchar(255) | sim |  |  |  |  |
| `financiado` | varchar(255) | sim |  |  |  |  |
| `id_tag` | int | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `contador_eventos` | int | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `valor_sugerido` | decimal(10,2) | sim |  |  |  |  |
| `observacao_bloqueio` | varchar(1000) | sim |  |  |  |  |
| `data_solicitacao_bloqueio` | date | sim |  |  |  |  |
| `data_bloqueio` | date | sim |  |  |  |  |
| `id_assessoria_especial` | int | sim |  |  |  |  |
| `judicial` | tinyint(1) | não |  |  | 0 |  |
| `centro_custo` | varchar(50) | sim |  |  |  |  |
| `codigo_empresa_a` | varchar(20) | sim |  |  |  |  |
| `codigo_agencia_a` | varchar(20) | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `numero_parcelas` | varchar(5) | sim |  |  |  |  |
| `numero_parcelas_pagas` | varchar(5) | sim |  |  |  |  |
| `numero_parcelas_atraso` | varchar(5) | sim |  |  |  |  |
| `data_base` | varchar(10) | sim |  |  |  |  |
| `valor_operacao` | varchar(15) | sim |  |  |  |  |
| `data_contabil` | varchar(10) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `data_bndu` | varchar(10) | sim |  |  |  |  |
| `troca_garantia` | varchar(3) | sim |  |  |  |  |
| `liquida` | varchar(3) | sim |  |  |  |  |
| `troca` | varchar(3) | sim |  |  |  |  |
| `administrativo` | tinyint(1) | não |  |  | 0 |  |
| `retorno` | tinyint(1) | não |  |  | 0 |  |
| `pessoa_juridica` | tinyint(1) | não |  |  | 0 |  |
| `consorcio` | tinyint(1) | não |  |  | 0 |  |
| `restituição` | tinyint(1) | não |  |  | 0 |  |
| `importado` | tinyint(1) | sim |  |  |  |  |
| `valor_medio_historico` | decimal(8,2) | sim |  |  |  |  |
| `salvo` | text | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `compensado` | tinyint(1) | sim |  |  |  |  |
| `status_contrato` | enum('REATIVADO','QUITADO') | sim |  |  |  |  |
| `status_motivacao` | enum('DETERMINACAO_JUDICIAL','PURGA_DA_MORA','ACORDO','APREENSAO_INDEVIDA') | sim |  |  |  |  |
| `nome_empresa` | varchar(100) | sim |  |  |  |  |
| `endereco_completo` | varchar(150) | sim |  |  |  |  |
| `cep` | varchar(9) | sim |  |  |  |  |
| `tipo_status_veiculo` | varchar(50) | sim |  |  |  |  |
| `valor_debito_ipva` | varchar(50) | sim |  |  |  |  |
| `valor_debito_licenciamento` | varchar(50) | sim |  |  |  |  |
| `valor_debito_multas` | varchar(50) | sim |  |  |  |  |
| `valor_debito_dpvat` | varchar(50) | sim |  |  |  |  |
| `prazo_restricao_fiscal` | varchar(50) | sim |  |  |  |  |
| `regularizacao_bloqueada` | int | não |  |  | 0 |  |
| `rcb` | tinyint(1) | não |  |  | 0 |  |
| `Importacao` | tinyint(1) | sim |  |  |  |  |

🔒 11 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_ativos_status_atual"></a>mart.f_ativos_status_atual

_View · ~0 linhas (estimativa do InnoDB) · 47 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao_estadia` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `subtipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_baixados_vendidos"></a>mart.f_baixados_vendidos

_View · ~0 linhas (estimativa do InnoDB) · 66 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `id_venda` | int unsigned | sim |  |  | 0 |  |
| `data_criacao` | date | sim |  |  |  |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | varchar(25) | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | date | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `sucata_carro` | varchar(3) | não |  |  |  |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | date | sim |  |  |  |  |
| `STATUS` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `nome_aprovador` | varchar(255) | sim |  |  |  |  |
| `valor_da_contraproposta` | decimal(12,2) | sim |  |  |  |  |
| `data_inicio_leilao` | datetime | sim |  |  |  |  |
| `valor_arremate_final` | decimal(12,2) | sim |  |  |  |  |
| `passagens_por_leilao` | bigint | sim |  |  | 0 |  |
| `passagens_por_leilao_Total` | bigint | sim |  |  | 0 |  |
| `passagens_valor` | decimal(34,2) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `data_lancamento_antecipado` | timestamp | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |
| `valor_mercado` | decimal(12,2) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `UF_Origem` | varchar(255) | sim |  |  |  |  |
| `Região_Origem` | varchar(12) | não |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_consolidado_dispatch_pendencies"></a>mart.f_consolidado_dispatch_pendencies

_View · ~0 linhas (estimativa do InnoDB) · 20 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_despacho` | int unsigned | não |  |  | 0 |  |
| `id_despachante` | int | sim |  |  |  |  |
| `id_bem` | int unsigned | sim |  |  |  |  |
| `criado_em_despacho` | timestamp | sim |  |  |  |  |
| `atualizado_em_despacho` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | não |  |  |  |  |
| `observacao_despacho` | text | sim |  |  |  |  |
| `divida_alta` | tinyint(1) | não |  |  | 0 |  |
| `aprovacao_divida_alta` | enum('EM_ANALISE','APROVADO') | sim |  |  |  |  |
| `id_pendencia` | bigint unsigned | sim |  |  | 0 |  |
| `tipo_pendencia` | varchar(255) | sim |  |  |  |  |
| `motivo_pendencia` | text | sim |  |  |  |  |
| `observacao_pendencia` | text | sim |  |  |  |  |
| `data_resolucao_pendencia` | date | sim |  |  |  |  |
| `resolucao_pendencia` | text | sim |  |  |  |  |
| `status_pendencia` | enum('EM_ANALISE','RESOLVIDO','CANCELADO') | sim |  |  |  |  |
| `criado_em_pendencia` | timestamp | sim |  |  |  |  |
| `atualizado_em_pendencia` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_consulta_documentos_vendas"></a>mart.f_consulta_documentos_vendas

_View · ~0 linhas (estimativa do InnoDB) · 19 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_evento` | int unsigned | não |  |  | 0 |  |
| `data_inicio_evento` | datetime | sim |  |  |  |  |
| `realized` | int | sim |  |  | 0 |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `nome_leilao` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | não |  |  |  |  |
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `banco` | varchar(255) | sim |  |  |  |  |
| `motivo` | varchar(255) | sim |  |  |  |  |
| `valor_venda` | decimal(12,2) | sim |  |  |  |  |
| `nome_cliente` | varchar(255) | sim |  |  |  |  |
| `atpv_enviado` | varchar(11) | não |  |  |  |  |
| `nota_venda_enviada` | varchar(11) | não |  |  |  |  |
| `status_log_rest_3_dias_evento` | varchar(14) | não |  |  |  |  |
| `rn` | bigint unsigned | não |  |  | 0 |  |

🔒 3 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_despachante"></a>mart.f_despachante

_View · ~0 linhas (estimativa do InnoDB) · 19 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_despacho` | int unsigned | não |  |  | 0 |  |
| `id_despachante` | int | sim |  |  |  |  |
| `id_bem` | int unsigned | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `excluido_em_despacho` | timestamp | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | não |  |  |  |  |
| `observacao_despacho` | text | sim |  |  |  |  |
| `divida_alta` | tinyint(1) | não |  |  | 0 |  |
| `aprovacao_divida_alta` | enum('EM_ANALISE','APROVADO') | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | não |  |  | 0 |  |
| `data_lancamento_antecipado` | timestamp | sim |  |  |  |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `data_leilao` | date | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

### <a id="mart.f_despachante2"></a>mart.f_despachante2

_View · ~0 linhas (estimativa do InnoDB) · 33 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_despacho` | int unsigned | não |  |  | 0 |  |
| `id_despachante` | int | sim |  |  |  |  |
| `id_bem` | int unsigned | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `excluido_em_despacho` | timestamp | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | não |  |  |  |  |
| `observacao_despacho` | text | sim |  |  |  |  |
| `divida_alta` | tinyint(1) | não |  |  | 0 |  |
| `aprovacao_divida_alta` | enum('EM_ANALISE','APROVADO') | sim |  |  |  |  |
| `comprovantes_anexados` | tinyint(1) | sim |  |  |  |  |
| `numero_nota` | varchar(255) | sim |  |  |  |  |
| `ocr_analisado` | tinyint(1) | sim |  |  | 0 |  |
| `endereco` | varchar(255) | sim |  |  |  |  |
| `comprovante_endereco` | varchar(255) | sim |  |  |  |  |
| `reversao` | tinyint(1) | não |  |  | 0 |  |
| `tipo_pessoa` | enum('FISICA','JURIDICA') | sim |  |  |  |  |
| `comprovante_residencia` | varchar(255) | sim |  |  |  |  |
| `contrato_social` | varchar(255) | sim |  |  |  |  |
| `numero_telefone` | varchar(255) | sim |  |  |  |  |
| `endereco_email` | varchar(255) | sim |  |  |  |  |
| `ordem_juicial_transferencia_propriedade` | tinyint(1) | sim |  |  |  |  |
| `veiculo_pago` | tinyint(1) | sim |  |  |  |  |
| `liberacao_antecipada` | tinyint(1) | não |  |  | 0 |  |
| `observacao_crlv` | longtext | sim |  |  |  |  |
| `sucata` | tinyint(1) | sim |  |  | 0 |  |

🔒 6 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_entradas"></a>mart.f_entradas

_View · ~0 linhas (estimativa do InnoDB) · 30 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_retomada` | varchar(255) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_assessoria` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `importado` | tinyint(1) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao` | varchar(255) | sim |  |  |  |  |
| `status_evento` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `atualizado_status_venda` | date | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_enviados_despachantes"></a>mart.f_enviados_despachantes

_View · ~0 linhas (estimativa do InnoDB) · 48 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `Tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_estoque_despachante"></a>mart.f_estoque_despachante

_View · ~0 linhas (estimativa do InnoDB) · 47 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `Tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_estoque_new_fotografia"></a>mart.f_estoque_new_fotografia

_Tabela · ~1.151.245 linhas (estimativa do InnoDB) · 36 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `_rowid` | int | não | PRI | auto_increment |  |  |
| `id_ativo` | bigint | não |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `sucata_carro` | bit(1) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `status_venda` | char(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_assessoria` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `importado` | bit(1) | sim |  |  |  |  |
| `removal_id` | bigint | sim |  |  |  |  |
| `data_apreensao` | varchar(255) | sim |  |  |  |  |
| `origem_endereco` | varchar(255) | sim |  |  |  |  |
| `origem_cidade` | varchar(255) | sim |  |  |  |  |
| `origem_UF` | varchar(255) | sim |  |  |  |  |
| `destino_cidade` | varchar(255) | sim |  |  |  |  |
| `destino_UF` | varchar(255) | sim |  |  |  |  |
| `destino_endereco` | varchar(255) | sim |  |  |  |  |
| `destino_numero` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  |  |  |
| `status_evento` | char(22) | sim |  |  |  |  |
| `vmv` | double(21,0) | sim |  |  |  |  |
| `status_despacho` | char(21) | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `dataFoto` | date | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (_rowid)

### <a id="mart.f_estoquenew"></a>mart.f_estoquenew

_View · ~0 linhas (estimativa do InnoDB) · 34 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_assessoria` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `importado` | tinyint(1) | sim |  |  |  |  |
| `removal_id` | int unsigned | sim |  |  | 0 |  |
| `data_apreensao` | varchar(255) | sim |  |  |  |  |
| `origem_endereco` | varchar(255) | sim |  |  |  |  |
| `origem_cidade` | varchar(255) | sim |  |  |  |  |
| `origem_UF` | varchar(255) | sim |  |  |  |  |
| `destino_cidade` | varchar(255) | sim |  |  |  |  |
| `destino_UF` | varchar(255) | sim |  |  |  |  |
| `destino_endereco` | varchar(255) | sim |  |  |  |  |
| `destino_numero` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `status_evento` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_eventos"></a>mart.f_eventos

_View · ~0 linhas (estimativa do InnoDB) · 63 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `identificador` | int unsigned | não |  |  | 0 |  |
| `identificador_evento` | int | sim |  |  |  |  |
| `identificador_ativo` | int unsigned | não |  |  |  |  |
| `criado_em` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `atualizado_em` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `identificador_cliente` | int unsigned | sim |  |  |  |  |
| `identificador_canal_vendas` | int | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `grade` | varchar(255) | sim |  |  |  |  |
| `dmr` | varchar(255) | sim |  |  |  |  |
| `classificacao` | varchar(255) | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `nota_fiscal` | varchar(255) | sim |  |  |  |  |
| `trv` | varchar(255) | sim |  |  |  |  |
| `identificador_anuncio` | int | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `observacao_lote` | longtext | sim |  |  |  |  |
| `desconto` | double | sim |  |  |  |  |
| `comprovante_pagamento` | varchar(255) | sim |  |  |  |  |
| `checkout_pagamento` | varchar(255) | sim |  |  |  |  |
| `valor_com_taxas` | decimal(12,2) | sim |  |  |  |  |
| `classificacao_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `numero_nota` | int | sim |  |  |  |  |
| `motivo_exclusao` | longtext | sim |  |  |  |  |
| `identificador_usuario_nota_fiscal` | int | sim |  |  |  |  |
| `valor_inicial` | decimal(12,2) | sim |  |  |  |  |
| `precificacao_veiculo` | decimal(12,2) | sim |  |  |  |  |
| `identificador_pos_venda` | int | sim |  |  |  |  |
| `identificador_usuario_checkout` | int unsigned | sim |  |  |  |  |
| `tipo_nota` | varchar(255) | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `identificador_usuario` | int | sim |  |  |  | user_id é referente ao aprovador |
| `numero_lote` | varchar(255) | sim |  |  |  |  |
| `identificador_ultimo_evento` | int | sim |  |  |  |  |
| `bloqueado_por_restricoes` | tinyint(1) | sim |  |  |  |  |
| `valor_contra_proposta` | decimal(12,2) | sim |  |  |  |  |
| `valor_medio_historico` | decimal(8,2) | sim |  |  |  |  |
| `informacoes` | text | sim |  |  |  |  |
| `resolvido` | tinyint(1) | sim |  |  |  |  |
| `data_inicio_evento` | datetime | sim |  |  |  |  |
| `data_fim_evento` | datetime | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `identificador_banco` | int | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_molicar_tabela_molicar` | int | sim |  |  |  |  |
| `data_referencia` | date | sim |  |  |  |  |
| `ano` | int | sim |  |  |  |  |
| `novo` | tinyint(1) | sim |  |  | 0 |  |
| `id_despacho` | int unsigned | sim |  |  | 0 |  |
| `id_despachante` | int | sim |  |  |  |  |
| `id_bem` | int unsigned | sim |  |  |  |  |
| `criado_em_despacho` | timestamp | sim |  |  |  |  |
| `atualizado_em_despacho` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `excluido_em_despacho` | timestamp | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `observacao_despacho` | text | sim |  |  |  |  |
| `divida_alta` | tinyint(1) | sim |  |  | 0 |  |
| `aprovacao_divida_alta` | enum('EM_ANALISE','APROVADO') | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_eventosV2"></a>mart.f_eventosV2

_View · ~0 linhas (estimativa do InnoDB) · 26 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `identificador` | int unsigned | não |  |  | 0 |  |
| `identificador_evento` | int | sim |  |  |  |  |
| `identificador_ativo` | int unsigned | não |  |  |  |  |
| `criado_em` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `atualizado_em` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `identificador_cliente` | int unsigned | sim |  |  |  |  |
| `identificador_canal_vendas` | int | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `grade` | varchar(255) | sim |  |  |  |  |
| `dmr` | varchar(255) | sim |  |  |  |  |
| `classificacao` | varchar(255) | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `nota_fiscal` | varchar(255) | sim |  |  |  |  |
| `trv` | varchar(255) | sim |  |  |  |  |
| `identificador_anuncio` | int | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `observacao_lote` | longtext | sim |  |  |  |  |
| `motivo_exclusao` | longtext | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `numero_lote` | varchar(255) | sim |  |  |  |  |
| `valor_contra_proposta` | decimal(12,2) | sim |  |  |  |  |
| `valor_medio_historico` | decimal(8,2) | sim |  |  |  |  |
| `informacoes` | text | sim |  |  |  |  |
| `resolvido` | tinyint(1) | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_leilao_operacional"></a>mart.f_leilao_operacional

_View · ~0 linhas (estimativa do InnoDB) · 76 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `tag_id` | int | sim |  |  |  |  |
| `passagens_nos_eventos` | int | sim |  |  |  |  |
| `nome_tag` | varchar(255) | sim |  |  |  |  |
| `molicar_valor_mais_recente` | int | sim |  |  |  |  |
| `data_referencia_molicar` | date | sim |  |  |  |  |
| `molicar_ano_base` | int | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `inicio_remocao` | date | sim |  |  |  |  |
| `fim_remocao` | date | sim |  |  |  |  |
| `distancia_km` | decimal(5,1) | sim |  |  |  |  |
| `origem_endereco` | varchar(255) | sim |  |  |  |  |
| `origem_cidade` | varchar(255) | sim |  |  |  |  |
| `origem_uf` | varchar(255) | sim |  |  |  |  |
| `destino_cidade` | varchar(255) | sim |  |  |  |  |
| `destino_uf` | varchar(255) | sim |  |  |  |  |
| `destino_endereco` | varchar(255) | sim |  |  |  |  |
| `destino_numero` | varchar(255) | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `valor_da_contraproposta` | decimal(12,2) | sim |  |  |  |  |
| `id_evento` | int | sim |  |  |  |  |
| `aprovacao_leilao` | tinyint(1) | sim |  |  | 0 |  |
| `data_inicio_leilao` | datetime | sim |  |  |  |  |
| `situacao_leilao` | int | sim |  |  | 0 |  |
| `nome_usuario_validou` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |
| `status_bloqueio` | enum('AGUARDANDO_APROVACAO','APROVADO','REPROVADO','CANCELADO','VENDA_LIBERADA','AGUARDANDO_DEFINICAO_LEILAO') | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_patio"></a>mart.f_patio

_View · ~0 linhas (estimativa do InnoDB) · 22 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `id_patio` | int | não |  |  |  |  |
| `id_veiculo` | int unsigned | não |  |  |  |  |
| `id_ordem_servico` | int | sim |  |  |  |  |
| `id_remocao` | int | sim |  |  |  |  |
| `id_usuario` | int | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `veiculo` | varchar(255) | sim |  |  |  |  |
| `motivo` | varchar(255) | sim |  |  |  |  |
| `entregue_para` | varchar(255) | sim |  |  |  |  |
| `tipo_retorno` | varchar(255) | sim |  |  |  |  |
| `observacao` | varchar(255) | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `caminho_arquivo` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_pendencias"></a>mart.f_pendencias

_View · ~0 linhas (estimativa do InnoDB) · 12 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_pendencia` | bigint unsigned | não |  |  | 0 |  |
| `id_despacho` | bigint unsigned | não |  |  |  |  |
| `tipo_pendencia` | varchar(255) | não |  |  |  |  |
| `motivo_pendencia` | text | sim |  |  |  |  |
| `observacao_pendencia` | text | sim |  |  |  |  |
| `data_resolucao_pendencia` | date | sim |  |  |  |  |
| `resolucao_pendencia` | text | sim |  |  |  |  |
| `status_pendencia` | enum('EM_ANALISE','RESOLVIDO','CANCELADO') | sim |  |  |  |  |
| `criado_em_pendencia` | timestamp | sim |  |  |  |  |
| `atualizado_em_pendencia` | timestamp | sim |  |  |  |  |
| `excluido_em_pendencia` | timestamp | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_regularizados"></a>mart.f_regularizados

_View · ~0 linhas (estimativa do InnoDB) · 47 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `Tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_regularizados_despachante"></a>mart.f_regularizados_despachante

_View · ~0 linhas (estimativa do InnoDB) · 48 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `Tipo_veiculo` | enum('LEVE','MEDIO','PESADO','MOTO') | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | binary(0) | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `dispatcher_id` | int | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_remocoes"></a>mart.f_remocoes

_View · ~0 linhas (estimativa do InnoDB) · 34 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | int unsigned | não |  |  | 0 |  |
| `id_local` | int | não |  |  |  |  |
| `id_destino_local` | int | não |  |  |  |  |
| `data_previsao_fim_municipio` | date | sim |  |  |  |  |
| `data_inicio_prevista` | date | sim |  |  |  |  |
| `data_fim_prevista` | date | sim |  |  |  |  |
| `data_inicio_real` | date | sim |  |  |  |  |
| `data_fim_real` | date | sim |  |  |  |  |
| `valor_remocao` | decimal(12,2) | sim |  |  |  |  |
| `informacoes` | varchar(255) | sim |  |  |  |  |
| `data_criacao` | timestamp | sim |  |  |  |  |
| `data_atualizacao` | timestamp | sim |  |  |  |  |
| `codigo_status` | varchar(255) | não |  |  | 0 |  |
| `data_apreensao` | varchar(255) | sim |  |  |  |  |
| `id_leiloeiro_responsavel` | int | sim |  |  |  |  |
| `id_assessoria_responsavel` | int | sim |  |  |  |  |
| `id_ativo` | int | não |  |  |  |  |
| `distancia_km` | decimal(5,1) | não |  |  |  |  |
| `id_sla_remocao` | int | sim |  |  |  |  |
| `nota_cancelamento` | longtext | sim |  |  |  |  |
| `data_exclusao` | timestamp | sim |  |  |  |  |
| `dias_sla` | int | sim |  |  |  |  |
| `recebido` | tinyint(1) | sim |  |  |  |  |
| `habilitacao_pedido_frustracao_remocao` | tinyint(1) | não |  |  | 0 |  |
| `id_leiloeiro_assets` | int | sim |  |  |  |  |
| `id_assessoria_assets` | int | sim |  |  |  |  |
| `origem_endereco` | varchar(255) | sim |  |  |  |  |
| `origem_cidade` | varchar(255) | sim |  |  |  |  |
| `origem_uf` | varchar(255) | sim |  |  |  |  |
| `destino_cidade` | varchar(255) | sim |  |  |  |  |
| `destino_uf` | varchar(255) | sim |  |  |  |  |
| `destino_endereco` | varchar(255) | sim |  |  |  |  |
| `destino_numero` | varchar(255) | sim |  |  |  |  |
| `rcb_flag` | tinyint(1) | sim |  |  | 0 |  |

### <a id="mart.f_status_ativos"></a>mart.f_status_ativos

_View · ~0 linhas (estimativa do InnoDB) · 7 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `identificador` | bigint unsigned | não |  |  | 0 |  |
| `etapa` | varchar(255) | não |  |  |  |  |
| `situacao` | varchar(255) | não |  |  |  |  |
| `usuario_id` | int | sim |  |  |  |  |
| `ativo_id` | int unsigned | não |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |

### <a id="mart.f_users"></a>mart.f_users

_View · ~0 linhas (estimativa do InnoDB) · 15 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id` | bigint unsigned | não |  |  | 0 |  |
| `nome` | varchar(255) | não |  |  |  |  |
| `email` | varchar(255) | não |  |  |  |  |
| `email_verificado_em` | timestamp | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `atualizado_em` | timestamp | sim |  |  |  |  |
| `assinatura` | varchar(255) | sim |  |  |  |  |
| `ativo` | tinyint(1) | não |  |  | 1 |  |
| `tipo_usuario` | enum('ADVISORY','SPECIAL_ADVISORY','AUCTIONEER','BACKOFFICE','DISPATCHER','BACKOFFICE_ADMIN','REPORT_COMPANY','DISPATCH_ADMIN') | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_assessoria` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `id_assessoria_especial` | int | sim |  |  |  |  |
| `id_empresa_relatorios` | int unsigned | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.f_vendas"></a>mart.f_vendas

_View · ~0 linhas (estimativa do InnoDB) · 62 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_venda` | int unsigned | não |  |  | 0 |  |
| `id_evento` | int | sim |  |  |  |  |
| `id_ativo` | int unsigned | não |  |  |  |  |
| `criado_em` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `atualizado_em` | timestamp | sim |  | DEFAULT_GENERATED | CURRENT_TIMESTAMP |  |
| `id_cliente` | int unsigned | sim |  |  |  |  |
| `id_canal_vendas` | int | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `grade` | varchar(255) | sim |  |  |  |  |
| `dmr` | varchar(255) | sim |  |  |  |  |
| `classificacao` | varchar(255) | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `nota_fiscal` | varchar(255) | sim |  |  |  |  |
| `trv` | varchar(255) | sim |  |  |  |  |
| `id_anuncio` | int | sim |  |  |  |  |
| `status_venda` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `observacao_lote` | longtext | sim |  |  |  |  |
| `desconto` | double | sim |  |  |  |  |
| `comprovante_pagamento` | varchar(255) | sim |  |  |  |  |
| `checkout_pagamento` | varchar(255) | sim |  |  |  |  |
| `valor_com_taxas` | decimal(12,2) | sim |  |  |  |  |
| `classificacao_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `numero_nota` | int | sim |  |  |  |  |
| `motivo_exclusao` | longtext | sim |  |  |  |  |
| `id_usuario_nota_fiscal` | int | sim |  |  |  |  |
| `valor_inicial` | decimal(12,2) | sim |  |  |  |  |
| `precificacao_veiculo` | decimal(12,2) | sim |  |  |  |  |
| `id_pos_venda` | int | sim |  |  |  |  |
| `id_usuario_checkout` | int unsigned | sim |  |  |  |  |
| `tipo_nota` | varchar(255) | sim |  |  |  |  |
| `excluido_em` | timestamp | sim |  |  |  |  |
| `id_usuario` | int | sim |  |  |  | user_id é referente ao aprovador |
| `numero_lote` | varchar(255) | sim |  |  |  |  |
| `id_ultimo_evento` | int | sim |  |  |  |  |
| `bloqueado_restricoes` | tinyint(1) | sim |  |  |  |  |
| `valor_contraproposta` | decimal(12,2) | sim |  |  |  |  |
| `valor_medio_historico` | decimal(8,2) | sim |  |  |  |  |
| `informacoes` | text | sim |  |  |  |  |
| `resolvido` | tinyint(1) | sim |  |  |  |  |
| `data_inicio_evento` | datetime | sim |  |  |  |  |
| `data_fim_evento` | datetime | sim |  |  |  |  |
| `id_banco` | int | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | int | sim |  |  |  |  |
| `data_referencia_molicar` | date | sim |  |  |  |  |
| `ano_molicar` | int | sim |  |  |  |  |
| `novo_molicar` | tinyint(1) | sim |  |  | 0 |  |
| `id_despacho` | int unsigned | sim |  |  | 0 |  |
| `id_despachante` | int | sim |  |  |  |  |
| `id_bem` | int unsigned | sim |  |  |  |  |
| `criado_em_despacho` | timestamp | sim |  |  |  |  |
| `atualizado_em_despacho` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `excluido_em_despacho` | timestamp | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `observacao_despacho` | text | sim |  |  |  |  |
| `divida_alta` | tinyint(1) | sim |  |  | 0 |  |
| `aprovacao_divida_alta` | enum('EM_ANALISE','APROVADO') | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `status_final_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.fotografia_despachante_enviados"></a>mart.fotografia_despachante_enviados

_Tabela · ~104.923 linhas (estimativa do InnoDB) · 26 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `_rowid` | int | não | PRI | auto_increment |  |  |
| `numeracao` | varchar(255) | não |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `contar_de_data_envio` | varchar(255) | não |  |  |  |  |
| `marca` | varchar(255) | não |  |  |  |  |
| `modelo` | varchar(255) | não |  |  |  |  |
| `uf` | varchar(255) | não |  |  |  |  |
| `tipo_de_prazo` | varchar(255) | não |  |  |  |  |
| `numero_de_dias_para_retorno` | varchar(255) | não |  |  |  |  |
| `data_prevista_para_retorno` | varchar(255) | não |  |  |  |  |
| `data_de_retorno_do_despachante` | date | sim |  |  |  |  |
| `tempo_decorrido` | varchar(255) | não |  |  |  |  |
| `tempo_utilizado` | varchar(255) | não |  |  |  |  |
| `eficiencia_do_prazo` | varchar(255) | não |  |  |  |  |
| `conta_de_eficiencia_da_entrega` | varchar(255) | não |  |  |  |  |
| `percentual_retorno` | varchar(255) | não |  |  |  |  |
| `nota` | varchar(255) | não |  |  |  |  |
| `nome_mes` | varchar(255) | sim |  |  |  |  |
| `ano` | bigint | sim |  |  |  |  |
| `ultimo_dia_mes` | date | sim |  |  |  |  |
| `banco` | varchar(255) | sim |  |  |  |  |
| `id` | bigint | sim |  |  |  |  |
| `dataFoto` | date | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (_rowid)

### <a id="mart.fotografia_despachante_estoque"></a>mart.fotografia_despachante_estoque

_Tabela · ~638.147 linhas (estimativa do InnoDB) · 27 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `_rowid` | int | não | PRI | auto_increment |  |  |
| `numeracao` | varchar(255) | não |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `Marca` | varchar(255) | não |  |  |  |  |
| `Modelo` | varchar(255) | não |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `UF` | varchar(255) | não |  |  |  |  |
| `TipoPrazo` | varchar(255) | não |  |  |  |  |
| `NumeroDiasparaRetorno` | varchar(255) | não |  |  |  |  |
| `DataPrevistaRetorno` | varchar(255) | não |  |  |  |  |
| `DataRetornoDespachante` | varchar(255) | não |  |  |  |  |
| `TempoDecorrido` | varchar(255) | não |  |  |  |  |
| `TempoUtilizado` | varchar(255) | não |  |  |  |  |
| `EficienciaPrazo` | varchar(255) | não |  |  |  |  |
| `EficienciaEntrega` | varchar(255) | não |  |  |  |  |
| `Check__` | varchar(255) | não |  |  |  |  |
| `Mes` | bigint | sim |  |  |  |  |
| `Ano` | bigint | sim |  |  |  |  |
| `Patrimonio` | varchar(255) | não |  |  |  |  |
| `MesCorrepondente` | date | sim |  |  |  |  |
| `LibAntecipada` | varchar(255) | não |  |  |  |  |
| `status_venda` | char(255) | sim |  |  |  |  |
| `banco` | varchar(255) | sim |  |  |  |  |
| `id_banco` | bigint | sim |  |  |  |  |
| `dataFoto` | varchar(255) | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (_rowid)

### <a id="mart.fotografia_despachante_regularizados"></a>mart.fotografia_despachante_regularizados

_Tabela · ~96.119 linhas (estimativa do InnoDB) · 25 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `_rowid` | int | não | PRI | auto_increment |  |  |
| `numeracao` | varchar(255) | sim |  |  |  |  |
| `despachante` | varchar(255) | sim |  |  |  |  |
| `marca` | varchar(255) | sim |  |  |  |  |
| `modelo` | varchar(255) | sim |  |  |  |  |
| `data_envio` | datetime | sim |  |  |  |  |
| `uf` | varchar(255) | sim |  |  |  |  |
| `tipo_de_prazo` | varchar(255) | sim |  |  |  |  |
| `numero_de_dias_para_retorno` | varchar(255) | sim |  |  |  |  |
| `data_prevista_para_retorno` | varchar(20) | sim |  |  |  |  |
| `data_de_retorno_do_despachante` | datetime | sim |  |  |  |  |
| `contar_de_data_de_retorno_do_despachante` | varchar(255) | sim |  |  |  |  |
| `tempo_decorrido` | varchar(255) | sim |  |  |  |  |
| `tempo_utilizado` | varchar(255) | sim |  |  |  |  |
| `eficiencia_prazo` | varchar(255) | sim |  |  |  |  |
| `nome_mes` | varchar(255) | sim |  |  |  |  |
| `ano` | bigint | sim |  |  |  |  |
| `ultimo_dia_mes` | datetime | sim |  |  |  |  |
| `liberacao_antecipada` | int | sim |  |  |  |  |
| `status_venda` | varchar(255) | sim |  |  |  |  |
| `banco` | varchar(255) | sim |  |  |  |  |
| `id` | bigint | sim |  |  |  |  |
| `dataFoto` | datetime | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (_rowid)

### <a id="mart.tabela_operacional_leilao"></a>mart.tabela_operacional_leilao

_View · ~0 linhas (estimativa do InnoDB) · 76 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | datetime | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | mediumtext | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `tag_id` | int | sim |  |  |  |  |
| `passagens_nos_eventos` | int | sim |  |  |  |  |
| `nome_tag` | varchar(255) | sim |  |  |  |  |
| `molicar_valor_mais_recente` | int | sim |  |  |  |  |
| `data_referencia_molicar` | date | sim |  |  |  |  |
| `molicar_ano_base` | int | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `inicio_remocao` | date | sim |  |  |  |  |
| `fim_remocao` | date | sim |  |  |  |  |
| `distancia_km` | decimal(5,1) | sim |  |  |  |  |
| `origem_endereco` | varchar(255) | sim |  |  |  |  |
| `origem_cidade` | varchar(255) | sim |  |  |  |  |
| `origem_uf` | varchar(255) | sim |  |  |  |  |
| `destino_cidade` | varchar(255) | sim |  |  |  |  |
| `destino_uf` | varchar(255) | sim |  |  |  |  |
| `destino_endereco` | varchar(255) | sim |  |  |  |  |
| `destino_numero` | varchar(255) | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `valor_da_contraproposta` | decimal(12,2) | sim |  |  |  |  |
| `id_evento` | int | sim |  |  |  |  |
| `aprovacao_leilao` | tinyint(1) | sim |  |  | 0 |  |
| `data_inicio_leilao` | datetime | sim |  |  |  |  |
| `situacao_leilao` | int | sim |  |  | 0 |  |
| `nome_usuario_validou` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |
| `status_bloqueio` | enum('AGUARDANDO_APROVACAO','APROVADO','REPROVADO','CANCELADO','VENDA_LIBERADA','AGUARDANDO_DEFINICAO_LEILAO') | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.tabela_vendas"></a>mart.tabela_vendas

_View · ~0 linhas (estimativa do InnoDB) · 13 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `identificador` | int unsigned | não |  |  | 0 |  |
| `identificador_evento` | int | sim |  |  |  |  |
| `identificador_ativo` | int unsigned | não |  |  |  |  |
| `identificador_cliente` | int unsigned | sim |  |  |  |  |
| `identificador_canal_vendas` | int | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `nota_fiscal` | varchar(255) | sim |  |  |  |  |
| `valor_com_taxas` | decimal(12,2) | sim |  |  |  |  |
| `desconto` | double | sim |  |  |  |  |
| `data_inicio_evento` | datetime | sim |  |  |  |  |
| `data_fim_evento` | datetime | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |

### <a id="mart.tabelao_validador"></a>mart.tabelao_validador

_View · ~0 linhas (estimativa do InnoDB) · 46 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `nome` | varchar(255) | não |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `identificacao_contrato` | varchar(255) | sim |  |  |  |  |
| `centro_custo` | varchar(50) | sim |  |  |  |  |
| `nome_financiado_segurado` | varchar(255) | sim |  |  |  |  |
| `carteira` | varchar(255) | sim |  |  |  |  |
| `conta` | varchar(255) | sim |  |  |  |  |
| `agencia` | varchar(255) | sim |  |  |  |  |
| `financiado` | varchar(255) | sim |  |  |  |  |
| `nome_empresa` | varchar(100) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_sugerido` | decimal(10,2) | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `Importacao` | tinyint(1) | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_inicio_real_remocacao` | date | sim |  |  |  |  |
| `data_fim_real` | date | sim |  |  |  |  |
| `id_local` | int | sim |  |  |  |  |
| `id_destino_local` | int | sim |  |  |  |  |
| `nome_origem_remocao` | varchar(255) | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `status_evento` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `data_inicio_evento` | datetime | sim |  |  |  |  |
| `tipo_de_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_de_bloqueio` | varchar(255) | sim |  |  |  |  |
| `criado_em_bloqueio` | timestamp | sim |  |  |  |  |
| `criado_em` | timestamp | sim |  |  |  |  |
| `data_conclusao` | datetime | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.veiculos_pri_ult_entrada"></a>mart.veiculos_pri_ult_entrada

_Tabela · ~1.090.537 linhas (estimativa do InnoDB) · 4 colunas_

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `_rowid` | int | não | PRI | auto_increment |  |  |
| `data_pri_entrada` | date | sim |  |  |  |  |
| `data_ult_entrada` | date | sim |  |  |  |  |

🔒 1 coluna(s) de nome sensível contada(s) e não nomeada(s).

**Índices:** `PRIMARY` (único): (_rowid)

### <a id="mart.vendas_completa"></a>mart.vendas_completa

_View · ~0 linhas (estimativa do InnoDB) · 55 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | date | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `tipo_ativo` | enum('VEHICLE','MISCELLANEOUS') | sim |  |  |  |  |
| `data_apreensao` | varchar(10) | sim |  |  |  |  |
| `codigo_fipe` | varchar(255) | sim |  |  |  |  |
| `observacoes` | binary(0) | sim |  |  |  |  |
| `sucata_carro` | tinyint(1) | sim |  |  | 0 |  |
| `id_marca` | varchar(255) | sim |  |  |  |  |
| `versao` | varchar(255) | sim |  |  |  |  |
| `modelo_detran` | varchar(255) | sim |  |  |  |  |
| `ano_fabricacao` | varchar(255) | sim |  |  |  |  |
| `categoria` | enum('rented','private') | não |  |  | private |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `id_despachante` | int | sim |  |  |  |  |
| `ano_modelo` | varchar(255) | sim |  |  |  |  |
| `id_cor` | varchar(255) | sim |  |  |  |  |
| `tipo_carroceria` | varchar(255) | sim |  |  |  |  |
| `id_combustivel` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `natureza` | text | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `valor_molicar` | varchar(255) | sim |  |  |  |  |
| `valor_fipe` | decimal(12,2) | sim |  |  |  |  |
| `valor_contabil` | varchar(15) | sim |  |  |  |  |
| `codigo_molicar` | varchar(255) | sim |  |  |  |  |
| `status_remocao` | varchar(255) | sim |  |  | 0 |  |
| `data_apreensao_remocao` | varchar(255) | sim |  |  |  |  |
| `status` | enum('REMOVIDO','REMOVIDO_OK','PRONTO_PARA_VENDA','A_VENDA','AGUARDANDO_PAGAMENTO','CONDICIONAL_ACEITA','CONDICIONAL_NEGADA','PAGO','VMV_ATINGIDO','DESISTENCIA','ANUNCIO_CANCELADO','CONDICIONAL','SEM_OFERTA','CONTRA_OFERTA','CONTRA_OFERTA_ACEITA','CONTRA_OFERTA_RECEBIDA','CONTRA_OFERTA_NEGADA','CONTRAPROPOSTA','CONTRAPROPOSTA_ACEITA','CONTRAPROPOSTA_NEGADA','VENDA_NEGADA','RECUSADO_POR_RESTRIÇÃO','TRANSFERIDO') | sim |  |  |  |  |
| `vmv` | double | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `conditional_verified_date` | datetime | sim |  |  |  |  |
| `name` | varchar(255) | sim |  |  |  |  |
| `status_despacho` | enum('EM_REGULARIZACAO','COM_PENDENCIAS','CANCELADO','REGULARIZADO','DOCUMENTACAO_OK','PENDENTE_DOCUMENTACAO') | sim |  |  |  |  |
| `inicio_despacho` | timestamp | sim |  |  |  |  |
| `conclusao_despacho` | datetime | sim |  |  |  |  |
| `lancamento_antecipado` | tinyint(1) | sim |  |  | 0 |  |
| `nome_despachante` | varchar(255) | sim |  |  |  |  |
| `situacao` | varchar(255) | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |
| `tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `sub_tipo_bloqueio` | varchar(255) | sim |  |  |  |  |
| `nome_banco` | varchar(255) | sim |  |  |  |  |
| `nome_leiloeiro` | varchar(255) | sim |  |  |  |  |
| `nome_marca` | varchar(255) | sim |  |  |  |  |
| `nome_patio` | varchar(255) | sim |  |  |  |  |
| `custo_veiculo` | double | sim |  |  |  |  |

🔒 5 coluna(s) de nome sensível contada(s) e não nomeada(s).

### <a id="mart.vendas_qtde"></a>mart.vendas_qtde

_View · ~0 linhas (estimativa do InnoDB) · 14 colunas_

**Comentário:** VIEW

| coluna | tipo | nulo | chave | extra | padrão | comentário |
|---|---|---|---|---|---|---|
| `id_ativo` | int unsigned | não |  |  | 0 |  |
| `atualizado_status_venda` | date | sim |  |  |  |  |
| `status_venda` | enum('INUTILIZADO','DEVOLUCAO','DOACAO','VENDA_AGUARDANDO_BLOQUEIO','VENDA_LIBERADA','VENDA_BLOQUEADA','VENDA_BLOQUEIO_NEGADA','EM_ANALISE_VENDA','VENDIDO','REVERSAO') | sim |  |  |  |  |
| `id_carteira` | varchar(255) | sim |  |  |  |  |
| `numero_contrato` | varchar(255) | sim |  |  |  |  |
| `id_banco` | varchar(255) | sim |  |  |  |  |
| `id_empresa` | varchar(255) | sim |  |  |  |  |
| `id_leiloeiro` | int | sim |  |  |  |  |
| `valor_final` | decimal(12,2) | sim |  |  |  |  |
| `data_evento_mais_recente` | datetime | sim |  |  |  |  |
| `data_inicio_estadia` | date | sim |  |  |  |  |
| `data_fim_estadia` | date | sim |  |  |  |  |

🔒 2 coluna(s) de nome sensível contada(s) e não nomeada(s).
