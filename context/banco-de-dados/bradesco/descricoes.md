# Descrição das tabelas — Bradesco (VEIC)

> Complementa o [`dicionario.md`](dicionario.md), que é só estrutura e é gerado.
> **Atenção:** as descrições abaixo são **inferidas** de nomes de tabela e coluna, chaves estrangeiras
> e da contagem de valores de status (medidos em 2026-11-10, sem ler dados pessoais). Nenhuma veio
> de documentação do sistema. Os números de linhas são estimativas do InnoDB. Confirme com quem
> opera o sistema antes de tratar qualquer item como regra de negócio.
> O arquivo é escrito à mão, então o gerador do dicionário não o sobrescreve.

## O que o banco parece ser

Uma plataforma de **remarketing de veículos retomados/sinistrados do Bradesco**: o veículo (`assets`)
é removido (`removals`), fica num pátio (`courtyards`, `stays`), é regularizado por despachantes
(`dispatch`), é vendido em eventos de leilão (`events`, `events_assets`) por leiloeiros
(`auctioneers`) e tem custos, débitos e honorários pagos (`assets_costs`, `debts`, `honoraries`,
`payment_group`, `batch_inputs` com integração SAP). A tabela central é `assets` (~1,12 milhão).

## Schemas

| schema | objetos | papel |
|---|---:|---|
| `bradescoveicweb` | 240 | banco transacional da aplicação (tabelas) e as views de BI `d_*`/`f_*` |
| `mart` | 59 | camada analítica: fotografias diárias do estoque dos despachantes e as mesmas views de BI |

## Convenções

- `d_*` = view de **dimensão**; `f_*` = view de **fato** (modelo estrela para Power BI). Existem nos dois
  schemas, com nomes iguais.
- `deleted_at` = exclusão lógica (quase toda tabela). Filtre `deleted_at IS NULL`.
- Tabelas `*_ocr`, `*_ocr_analyses` guardam resultado de leitura automática de documentos.
- Várias tabelas têm 0 linhas (funcionalidade criada e não usada): ex. `auctions`, `fipe`,
  `light_car_inspections`, `heavy_car_inspections`, `motorcycle_inspections`, `bank_account`.

## 1. Veículo (o ativo)

| tabela | linhas | o que é |
|---|---:|---|
| `assets` | 1,12 mi | **O veículo/bem.** Dados cadastrais (marca, modelo, ano, cor, combustível), banco e empresa de origem (`bank_id`, `company_id`), carteira (`portfolio_id`), leiloeiro e despachante responsáveis, valores de referência (FIPE, Molicar, sugerido) e `sell_status`. `type_assets`: VEHICLE (1,14 mi) ou MISCELLANEOUS (18 mil, bens diversos). |
| `assets_status` | 586 mil | Histórico de **etapa e status** do veículo (`stage`: Liberado, REMOÇÃO, PÁTIO, EVENTO, Trânsito, AGUARDANDO_COLETA, Bloqueio Judicial, Devolução). Uma linha por mudança. A view `current_assets_status` pega a atual. |
| `assets_status_cache` | 0 | Cache do status atual, sem uso. |
| `assets_values` | 329 mil | Histórico do **VMV** (valor mínimo de venda) do veículo, por evento e usuário. |
| `assets_miscellaneous_type` | 9 | Tipos de bem diverso. |
| `assets_inspection_photos` | 2,05 mi | Fotos de vistoria do veículo. |
| `condition_reports`, `condition_report_fields`, `condition_report_sections` | 306 mil / 101 / 32 | **Laudo de condição** do veículo: campos e seções do formulário e os valores preenchidos por vistoriador (`inspector`). |
| `inspections_time` | 45 mil | Tempos de vistoria. |
| `documents`, `document_type_templates` | 177 mil / 1 | Documentos anexados ao veículo, com tipo e caminho do arquivo. |
| `vehicle_buckets` | 121 mil | Cadastro de veículos importados em lote antes de virar `assets` (mesmos campos cadastrais). |
| `molicar`, `fipe` | 3,3 mi / 0 | Tabelas de preço de referência. Molicar é a usada (código, valor, ano, data de referência). |
| `brands`, `color_vehicles`, `fuels` | 653 / 142 / 140 | Cadastros auxiliares de marca, cor e combustível. |
| `pricing_discount`, `book_value_discount`, `asset_age_parameters` | 14 / 11 / 4 | Faixas de **desconto por ano do veículo** usadas na precificação. |
| `bradesco_nature_rules` | 14 | Regra de **natureza** (percentual e código de característica; marca se é sucata). |
| `portfolios` | 1.091 | Carteiras de origem dos veículos. |
| `relationship_between_assets` | 3 | Ligação entre bens relacionados. |

`assets.sell_status` (valores medidos): VENDIDO 1.065.748 · DEVOLUCAO 72.606 · VENDA_LIBERADA 7.941 ·
VENDA_BLOQUEADA 5.797 · INUTILIZADO 2.556 · EM_ANALISE_VENDA 1.016 · DOACAO 62 ·
VENDA_AGUARDANDO_BLOQUEIO 14.

## 2. Evento de venda (leilão)

| tabela | linhas | o que é |
|---|---:|---|
| `events` | 20,9 mil | **Evento de venda** (leilão online): datas de exibição e de disputa, regras (compre já, propostas, disputa em tempo real), leiloeiro, aprovação, cancelamento e finalização. `situation`: Realizado 20.647 · Cancelado 190 · Finalizado 54. |
| `events_assets` | 1,14 mi | **Veículo dentro de um evento** (lote). Guarda valor inicial, VMV, valor final, comprador (`client_id`), canal de venda, nota fiscal (`nf_*`), taxas e comissão, pagamento e `status`: VMV_ATINGIDO 1.024.640 · CONDICIONAL_ACEITA 42.230 · SEM_OFERTA 32.924 · REMOVIDO 17.651 · TRANSFERIDO 14.100 · DESISTENCIA 9.686 · CONTRAPROPOSTA_NEGADA 2.524 · A_VENDA 2.267. É a tabela de vendas. |
| `events_assets_logs_transfers` | 14,6 mil | Transferências de veículo entre eventos. |
| `events_tags`, `tags` | 30,6 mil / 18,5 mil | Etiquetas aplicadas a eventos e veículos. |
| `events_discounts`, `event_days_before`, `event_pass_attempts` | 0 | Sem uso. |
| `auctions` | 0 | Sem uso (o evento é a unidade real). |
| `sales_channels`, `assets_sales_channels`, `transfer_receipts_sales_channels` | 0 a poucos | Canais de venda e SLA por canal. |
| `sale_notification` | 27,5 mil | **Aviso de venda** ao despachante após a venda (comunicado/pesquisa, transportadora, rastreio). `status`: CONCLUIDO 26.632 · ENVIADO AO DESPACHANTE 1.874 · PENDENTE DE ENVIO 1.736 · RECEBIDO PELO DESPACHANTE 258. |
| `sale_notification_status_logs`, `sale_notification_cron_logs`, `sale_notification_days_parameterizations` | 74 mil / 0 / 1 | Histórico e parâmetros dos avisos. |
| `assets_sell_notes`, `assets_atpv`, `atpvs_notes_ocr` | 74 mil / 890 mil / 78 mil | Arquivos de **nota de venda** e **ATPV-e** (autorização de transferência) do veículo, e leitura automática. |
| `sell_note_ocr_analyses`, `atpv_ocr_analyses` | 3 mil / 2,5 mil | Resultado da análise por OCR. |
| `transfer_receipts` | 5,2 mil | **Comprovantes de pagamento do leiloeiro** por evento, com conferência de conta, agência e valor. |
| `partners_events_assets_relationship`, `partners` | 120 mil / 24 mil | Parceiros ligados a veículos em evento. |
| `clients` | 247 mil | **Compradores** (pessoa física/jurídica), com cadastro fiscal, endereço e histórico de compra (`number_buy`, `date_last_buy`). |
| `after_sales` (referência em `events_assets`) | n/d | Pós-venda; sem tabela própria nesta base. |

## 3. Regularização documental (despachante)

| tabela | linhas | o que é |
|---|---:|---|
| `dispatch` | 1,09 mi | **Processo de regularização** de um veículo com um despachante. Guarda documentos recebidos, débitos altos, liberação antecipada, reversão e `status`: REGULARIZADO 1.097.396 · CANCELADO 8.463 · EM_REGULARIZACAO 3.292 · PENDENTE_DOCUMENTACAO 225 · DOCUMENTACAO_OK 138. |
| `dispatchers` | 35 | **Despachantes** (empresas), com contrato, centro de custo e endereço. |
| `dispatch_services`, `service_slas` | 10,7 mil / 217 | Serviços do despachante com custo e SLA por UF. |
| `dispatch_services_sla_follow_ups` | 1,02 mi | Acompanhamento do SLA por serviço. |
| `dispatchers_distributions_*`, `dispatchers_regionalizations_ufs` | 101 / 12 / 81 | Regras de **distribuição de processos** entre despachantes por região/UF. |
| `dispatch_documents`, `dispatch_status_follow_up*`, `dispatch_status_logs`, `dispatch_substatus_follow_up` | 689 / 0 | Documentos e acompanhamento de status do processo (os de status estão vazios). |
| `pendencies` | 52 mil | **Pendências** do processo. `type`: ECV 14.405 · GRAVAME 11.639 · Outras 11.333 · Restrição administrativa 5.961 · Bloqueio 5.869 · Documentação pendente 2.799 · Gravame expirado 1.993 · Laudo ECV 384. |
| `pendency_slas` | 0 | Sem uso. |
| `debts` | 278 mil | **Débitos do veículo** (`type`: Multas 82 mil · IPVA 64 mil · Licenciamento 45 mil · Taxa de certificado 23 mil · Taxa de transferência 19 mil · Atualização monetária 10 mil · Taxa DETRAN 5 mil · DARE 3,7 mil). Com status de OCR e validação. |
| `debts_ocr`, `debt_receipts`, `debts_files_ocr`, `debts_vehicles`, `doc_debts` | 129 mil / 123 mil / 0 | Comprovantes de débito e leitura automática. |
| `high_debts`, `evidence_high_debts` | 0 / 5 | **Débitos altos** que precisam de aprovação. |
| `regularization_documents`, `regularization_files_ocr` | 3,2 mil / 31 | Documentos de regularização e OCR. |
| `registration_documents` | 0 | Sem uso. |
| `blockings` | 19,7 mil | **Bloqueios** de venda. `block_type`: judicial 11.843 · devolução 4.223 · bloqueio de advogado 2.946 · adulteração 1.152 · administrativo 807 · siderúrgica 306. `status`: APROVADO 11.352 · VENDA_LIBERADA 8.371 · REPROVADO 1.529 · AGUARDANDO_APROVACAO 19. |
| `blocking_documents`, `blocking_asset_documents` | 19,7 mil / 0 | Documentos do bloqueio. |
| `honoraries`, `report_company_honoraries`, `costs_per_assets_type` | 53 mil / 6,7 mil / 239 | **Honorários** por serviço e tipo de custo. |
| `jurisdictions`, `counties`, `regions`, `regions_cities_states`, `empf_cr_codes` | 75 / 0 / 42 / 5,8 mil / 5 mil | Jurisdição, comarca, região e códigos de municípios/CR. |

## 4. Remoção, pátio e devolução

| tabela | linhas | o que é |
|---|---:|---|
| `removals` | 276 mil | **Remoção** (guincho) do veículo de um local a um destino, com datas previstas e reais, valor, SLA, distância. `status_code`: REALIZADO 273.344 · REMOÇÃO FRUSTRADA 6.973 · EM_TRANSITO 564 · AGUARDANDO_COLETA 222. |
| `removal_locals`, `removals_slas`, `removal_parameterization` | 63 mil / 29 / 0 | Locais de origem e destino, SLAs e parâmetros. |
| `courtyards` | 110 | **Pátios** (nome, capacidade, endereço, contato, forma de pagamento). |
| `stays` | 309 mil | **Permanência** do veículo em pátio (entrada, saída, motivo, quem retirou). |
| `devolutions` | 73 mil | **Devolução** do veículo ao banco/origem, com distância e custo. `status`: DEVOLVIDO 72.246 · CANCELADA 672 · AGUARDANDO_DEVOLUCAO 180. |
| `assets_repurchases`, `repurchases_follow_up`, `repurchases_follow_up_documents` | 963 / 7 mil / 4,5 mil | **Recompra** do veículo (pedido, aprovação, desconto). `status`: APROVADO 605 · REPROVADO 256 · PENDENTE 102. |
| `scrap_requests`, `scrap_request_photos`, `scrap_request_approvers`, `scrap_clients_authorizations`, `scrap_write_off_pricing_parameter` | 984 / 3,5 mil / 1,9 mil / 6,3 mil / 0 | **Pedido de venda como sucata/baixa**, com fluxo de aprovação. `status`: APROVADO 599 · REPROVADO 171 · INDICACAO_LEILOEIRO 102 · AGUARDANDO_APROVACAO 90 · CANCELADO 22. |
| `ex_use_assets`, `ex_use_asset_events/_bids/_documents/_photos` | 1,5 mil / 324 / 618 / 2,2 mil / 1,5 mil | Bens **fora de uso** (mobiliário, equipamentos) vendidos em evento próprio, com lances. |
| `inventory_assets`, `inventory_uploads`, `inventory_assets_files` | 3,5 mil / 3 / 0 | **Inventário**: conferência de planilha contra o sistema e contra o Bradesco Seguros. |

## 5. Financeiro e integração SAP

| tabela | linhas | o que é |
|---|---:|---|
| `assets_costs` | 1,39 mi | **Custos por veículo** (remoção, despachante, débitos), com aprovação e pagamento. `status`: PAGAMENTO_EFETUADO 1.068.317 · APROVADO 294.724 · AGUARDANDO_APROVAÇÃO 7.984 · REPROVADO 260. |
| `assets_costs_legacy` | 2,27 mi | Custos da versão anterior do sistema (legado). |
| `assets_costs_receipts`, `assets_costs_batches` | 3,6 mil / 0 | Comprovantes e lotes de custo. |
| `payment_group` | 9 mil | **Agrupamento de pagamento** a um fornecedor (despachante, leiloeiro etc.) com aprovação. |
| `batch_inputs`, `batch_input_items_sap` | 1,1 mil / 3,8 mil | **Lotes enviados ao SAP** (MIRO, MIGO, pagamento). Colunas de status por etapa. |
| `sap_fixed_assets`, `sap_fixed_low_assets`, `sap_requester`, `sap_emails`, `sap_tax_reform_parameters` | 112 / 95 / 2 / 0 / 1 | Dados do imobilizado e parâmetros SAP (reforma tributária). |
| `banks`, `banks_mapping`, `bank_account`, `budget_bank_monthly` | 12 / 0 | Bancos de origem e orçamento mensal por banco. |
| `companies` | 284 | **Empresas** (do grupo) ligadas a um banco, com código. |
| `reports`, `report_batches`, `report_values`, `reports_companies` | 161 mil / 10 mil / 4 / 2 | **Laudos/relatórios** por veículo e empresas emissoras, com faturamento. |

## 6. Atores e acesso

| tabela | linhas | o que é |
|---|---:|---|
| `users` | 912 | **Usuários** do sistema. `type`: ADVISORY 331 · AUCTIONEER 271 · BACKOFFICE 218 · DISPATCHER 74 · SPECIAL_ADVISORY 13 · BACKOFFICE_ADMIN 2 · REPORT_COMPANY 1. |
| `auctioneers` | 124 | **Leiloeiros**, com endereço, contrato, SLA e flags (`is_poc`, `execute_own_report`). |
| `advisories`, `special_advisories` | 194 / 14 | **Assessorias** do Bradesco e assessorias especiais (com percentual e marca RCB). |
| `auctioneers_distributions`, `auctioneers_users*`, `auctioneers_poc_costs` | 10,7 mil / 0 | Distribuição de veículos entre leiloeiros e custos de POC. |
| `special_advisory_cases`, `special_advisory_frequency_automatic_distribution` | 2,7 mil / 0 | Casos e distribuição automática das assessorias especiais. |
| `approval_rules_parametrization_group*`, `assets_approvers` | 13 / 31 / 148 | Regras e grupos de **aprovadores**. |
| `impersonation_sessions` | 210 | Sessões em que um usuário assumiu outro (suporte). |
| `user_alert_preferences`, `alert_types`, `alert_categories` | 288 / 19 / 9 | Preferências de alerta. |
| `email_groups`, `email_group_user`, `email_actions`, `email_action_group`, `email_send_logs` | 3 / 2 / 4 / 1 / 164 mil | Grupos e envio de e-mail do sistema. |
| `notifications`, `announcements` | 1,88 mi / 10 | Notificações e avisos na tela. |
| `doorman`, `sessions` | 0 | Sem uso. |

## 7. Bradesco Seguros

| tabela | linhas | o que é |
|---|---:|---|
| `bradesco_seguros_processes` | 56,6 mil | Processo do veículo **vindo do Bradesco Seguros** (aviso de sinistro, monta, sucata, restrição administrativa, inconsistências). |
| `bradesco_seguros_resources`, `bradesco_seguros_resource_imports`, `bradesco_seguros_imports` | 464 mil / 28 / 1,7 mil | Carga dos dados recebidos do Bradesco Seguros. |
| `bradesco_seguros_process_attempts` | 77 mil | Tentativas de processamento (reprocessos). |
| `gran_responses`, `logs_checkauto`, `rest_api_codes` | 70 mil / 68 mil / 15 | Respostas de consulta a bases externas (Gran, CheckAuto, restrições). |

## 8. Infraestrutura (Laravel e logs)

`logs` (113 mi) e `log_rest` (4,3 mi) são **auditoria e logs de chamadas**, as maiores tabelas do banco.
`integration_health_logs`, `backoffice_logs_ai_summaries` (resumos de IA do backoffice), `jobs`,
`job_batches`, `failed_jobs`, `migrations`, `scheduled_job_toggles`, `bi_dashboard_parameter`,
`conditional_parameters`, `minimum_sample_percentage_parameter`, `cut_date`, `vehicle_watch_terms`,
`ad_groups`, `inspector` são filas do Laravel, controle de migração e parâmetros de sistema.

## 9. Schema `mart` (camada analítica)

| objeto | linhas | o que é |
|---|---:|---|
| `f_estoque_new_fotografia` | 1,15 mi | **Fotografia periódica do estoque** por veículo (modelo de estoque no tempo). |
| `veiculos_pri_ult_entrada` | 1,09 mi | Primeira e última entrada de cada veículo no estoque. |
| `fotografia_despachante_estoque`, `_enviados`, `_regularizados` | 638 mil / 105 mil / 96 mil | Fotografias do que está **no estoque do despachante**, do que foi **enviado** e do que foi **regularizado**. |
| `despachante_estoque_fechamento`, `despachante_processos_enviados_fechamento`, `despachante_regularizado_fechamento` | 86 mil / 60 mil / 76 mil | **Fechamento mensal** das três visões acima. |
| `despachante_meta_fechamento`, `despachante_meta_teste` | 109 / 60 | **Metas** por despachante. |
| `dm_painel_despachantes_depara` | 95 | De-para de despachantes para o painel. |
| `Logins_c2y` | 8,7 mil | Registro de logins (c2y = Cars2You) no sistema. |
| 49 views `d_*`, `f_*` e outras | n/d | Modelo estrela para os painéis: dimensões (bancos, empresas, eventos, leiloeiros, pátio, despachante, documentos, veículos) e fatos (vendas, entradas, estoque, remoções, pendências, regularizados, assessoria, leilão operacional). `tabelao_validador`, `Valida_Duplicidade_Estoque` e `Veiculos_em_berto` são views de conferência. |

## 10. Vistoria e laudo (tabelas sem uso)

Estas tabelas pertencem a um módulo de vistoria que **não está em uso** (0 linhas). O laudo em uso
é `condition_reports`.

| tabela | linhas | o que é |
|---|---:|---|
| `light_car_inspections`, `light_car_photos_inspections` | 0 | Vistoria de **carro leve**: um campo por item (chave, motor, lataria, para-choques, ar-condicionado, airbag etc.) e as fotos com legenda. |
| `heavy_car_inspections`, `heavy_car_inspections_photos` | 0 | O mesmo para **veículo pesado** (inclui cabine, tacógrafo, eixos). |
| `motorcycle_inspections`, `motorcycle_inspection_photos` | 0 | O mesmo para **moto** (carenagem, tanque, corrente, discos de freio, bateria). |
| `condition_report`, `condition_reports_photos`, `condition_reports_tires`, `condition_equipments` | 0 | Versão anterior do laudo de condição (carroceria, portas, estofamento, quilometragem, chaves), com fotos e pneus. Substituída por `condition_reports`. |

## 11. Bens fora de uso e dados diversos

| tabela | linhas | o que é |
|---|---:|---|
| `ex_use_asset_events` | 324 | **Evento de venda de bens fora de uso**: local, vendedor, valor de venda, de aquisição e depreciação, motivo, se vendeu e cancelamento. |
| `ex_use_asset_bids` | 618 | **Lances** recebidos para o bem fora de uso, com o vencedor. |
| `ex_use_asset_documents`, `ex_use_asset_photos` | 2,2 mil / 1,5 mil | Documentos e fotos do bem fora de uso. |
| `clients_files` | 0 | Arquivos anexados ao cliente comprador. Sem uso. |
| `advisory_vehicle_removals` | 0 | Pedido de remoção feito por uma assessoria, com os dados do veículo e do endereço. Sem uso. |
| `dispatchers_distributions` | 0 | Regras de distribuição de processos por atributo do veículo. Sem uso. |
| `atpv_note_slas` | 0 | SLA da nota de ATPV. Sem uso. |
| `cut_date` | 0 | Data/hora de corte para rotinas mensais. Sem uso. |
| `conditional_parameters`, `minimum_sample_percentage_parameter` | 0 | Parâmetros de venda condicional e de amostra mínima. Sem uso. |
| `ad_groups` | 879 | Grupos de anúncio e quem os criou. |
| `inspector` | 265 | **Vistoriadores**, ligados a um pátio. |

## 12. Monitoramento e infraestrutura

| tabela | linhas | o que é |
|---|---:|---|
| `logs` | 39 a 113 mi (a estimativa varia entre consultas) | **Auditoria de ações**: quem (usuário, leiloeiro, despachante, IP), em qual tabela e recurso, com qual método e URI. Registra também quando um usuário assumiu outro. A maior tabela do banco. |
| `log_rest` | 4,1 mi | **Consultas de restrição** de um veículo (origem, código de restrição, se pode vender, data da consulta), ligadas ao evento. |
| `integration_health_logs` | 38,6 mil | Teste periódico de **saúde das integrações**: status, latência, sucessos, erros e última mensagem. |
| `backoffice_logs_ai_summaries` | 26 | Resumo escrito por IA do histórico de veículos para o backoffice. |
| `bi_dashboard_parameter` | 4 | Endereços dos painéis de BI mostrados no sistema. |
| `scheduled_job_toggles` | 123 | Liga/desliga e cron de cada **rotina agendada**, por ambiente. |
| `vehicle_watch_terms` | 2 | Termos monitorados nos veículos e quem recebe o alerta. |
| `jobs`, `job_batches`, `failed_jobs` | 0 / 2,6 mil / 1,8 mil | Fila de tarefas do Laravel, lotes e falhas. |
| `migrations` | 492 | Controle das versões da estrutura do banco. |

## 13. Fotografias do despachante (schema `mart`)

| tabela | linhas | o que é |
|---|---:|---|
| `fotografia_despachante_enviados` | 104 mil | Fotografia diária dos processos **enviados ao despachante**, com prazo de retorno, data prevista e real, tempo utilizado e eficiência do prazo. |
| `fotografia_despachante_regularizados` | 96 mil | Fotografia dos processos **regularizados**, com o mesmo controle de prazo e se houve liberação antecipada. |

## Pontos de atenção

- **Colunas sensíveis** (placa, chassi, renavam, CPF/CNPJ, documentos) existem em `assets`, `clients`,
  `vehicle_buckets` e outras: não estão nomeadas no dicionário. Trate com cuidado em qualquer extração.
- `assets_costs_legacy` e `assets_costs` coexistem: não some as duas sem checar sobreposição.
- `events.type_event` está **nulo em todas as 21.035 linhas**; não serve para classificar evento.
- Alguns valores têm grafias duplicadas (`REALIZADO`/`REALIZADA` em remoções; `is_block_lawyer`/`is_block_lawye` em
  bloqueios): conte as duas.
- As views dos dois schemas têm nomes iguais, e `bradescoveicweb` ainda tem views antigas (ex.
  `vendidos_2025_jan_mai`, `baixados_2025`). Prefira as de `mart` para análise.
