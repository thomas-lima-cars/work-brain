# C6 — Contexto

## O que é
**Evento Exclusivo C6 Auto** — leilão/evento de veículos para lojistas, operado pela
Cars2You para o C6. Shop `104754`. Whitelabels **43** (Canal de vendas C6 Auto) e
**48** (Colaboradores C6).

## Por que existe
_(a preencher — origem comercial da parceria não mapeada)_

## Fase atual
🔥 **Quente.** Relatório de evento já em produção; a demanda ativa é evoluí-lo para
cobrir **100% da base** com visão de safra/coorte — prazo 04/09/2026. Ver `04-cards.md`.

## Regras de negócio / integrações
- **Cadência:** evento quase todo dia — 16 eventos em ~1 mês (contra ~1/semana do IGA).
- **Fechamento: 16h OU 20h.** Diferente do IGA, que fecha sempre 16h. Por isso o cron do
  gatilho é mais largo: `0 */10 16-23 * * 1-6`.
- **Escopo de loja:** `enable_advertiser = 1`, excluindo `name LIKE 'Teste%'`.
- **5 workflows 🟩** em produção: gatilho de fim de evento, relatório, planilha
  (2 `.xlsx` — completo com comprador e versão banco sem comprador), remanescentes,
  e análise semanal de base de cadastros (grupo 10, loja 594).
- **Dedup:** o controle de "evento já processado" é a existência do arquivo do relatório
  na pasta Relatórios do SharePoint — o banco é read-only.
- Detalhe técnico: `automations/n8n-flows/cars2you-c6-automacoes.md`.
