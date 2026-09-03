# 📍 Estado Atual — Work Brain do Thomas

> Painel vivo. Mantido pelo `/salve` no fim de cada sessão. Lido pelo `/cerebro` no boot.
> **Última atualização:** 2026-09-03 (tarde) — import do contexto n8n, ata da squad e reclassificação das frentes

## 🔹 Frentes quentes agora
- **c6** — 🔥 **prazo sexta 04/09:** evoluir o relatório C6 para 100% da base com visão de
  safra/coorte e botão de dashboard. Thomas + Everton. Base técnica: workflow `ehsqQo6hiPDRf58I`.
  Contexto: `memory/inputs/meetings/2026-09-02-squad-de-relatorios.md`
- **cars2you** — automações n8n mapeadas em `automations/`. Pendente: Pulso de Eventos
  (`20LeyMLjrAKeKVeS`) — encurtar mensagem + bolinha colorida, alinhar com Doni
- **bradesco** — _(estado a preencher na próxima sessão)_

## ⚙️ Rodando em produção (sem demanda ativa minha)
> Distinção importante: automação rodando ≠ frente quente. Aqui a máquina trabalha sozinha.
- **itau** — operação **IGA**, 8 workflows 🟩 estáveis. Evento ~1x/semana, fecha 16h.
  Pendência antiga: readicionar `fernando.tuunelis` no e-mail do Relatório quando o Gui aprovar.
- **lm** — Lista LM + Proposta LM 🟩. Estoque com movimento até 25/08. Disparo manual pelo
  time de montagem. ❓ Sigla "LM" ainda não decifrada.

## 🧊 Frentes fora do radar
- **outros** — coringa, sem movimento

## 🔥 Decisões em aberto
- **Onde hospedar os relatórios** — hoje na cloud/máquina do Caio. Sem definição.
- **Skip / Adapta** — plano Starter ~R$1.000/mês (negociando ~R$200/mês, 10 licenças).
  Caio, Gui e Daniel avaliam. Thomas não é decisor.
- **Versionar `automations/estado/*.json`?** — 86 KB de estado de execução que muda a cada run.
  Deixei versionado por ora (vale como snapshot); se sujar o histórico, entra no `.gitignore`.
- **Lance Fácil BTB merece pasta própria?** — tem 2 whitelabels (62, 65) e 2 workflows, mas
  não é frente declarada. Ou abre `subjects/lance-facil-btb/`, ou assume que vive em `outros`.
- **Canal único de alerta de falha dos crons** — nenhum dos 9 crons tem `onError` documentado,
  o que contraria o próprio princípio "falha silenciosa é proibida".

## 📌 Cobranças minhas (preciso agir)
- [ ] **ATÉ SEXTA 04/09** — relatório C6 em 100% da base com visão de safra (com Everton)
- [ ] Pulso de Eventos: encurtar mensagem + bolinha colorida — alinhar com Doni
- [ ] Higiene n8n: arquivar os 3 workflows TEMP do C6 + o "Testes"
- [ ] Validar `automations/crons.md` contra o n8n ao vivo (preenchi de memória dos docs, não da API)
- [ ] Descrever o estado atual de `bradesco` (frente quente sem parágrafo)
- [ ] Esclarecer o que é a sigla **LM** (fornecedor de estoque — nome completo desconhecido)
- [ ] Confirmar os cargos inferidos em `context/stakeholders.md`
- [ ] Preencher `01-contexto.md` de `itau` e `lm` com o que já está em `automations/` (o do `c6` foi feito)

## ⏳ Esperando outros
- **Gui** — aprovação pra readicionar `fernando.tuunelis` no e-mail do Relatório IGA
- **Caio / Gui / Daniel** — avaliação do Skip/Adapta
- **Doni** — alinhamento do formato do Pulso de Eventos

## ⚠️ Alertas críticos
- 🚨 **Prazo sexta 04/09 (amanhã) é avaliação de skill.** Se o relatório C6 não sair,
  a diretoria busca gente externa. Fonte: ata 2026-09-02.
- Cópia `GgjVZlU04wvJzLbK` (Auditoria de Estoque) está com `MODO='producao'` e gatilho 08h.
  **Ativar sem trocar pra `'teste'` dispara e-mail pra lista completa em paralelo ao original.**

## 📅 Compromissos próximos
- **2026-09-04 (sexta)** — entrega do relatório C6 (safra + 100% da base)
