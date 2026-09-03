# Itaú — Histórico

> Linha do tempo. Base pra detectar contradição entre o que foi dito antes e agora.

## 2026-09-03
- Frente criada no onboarding do work-brain.
- Classificada como **parada** (fora do radar).

## 2026-09-03 (tarde)
- ⚠️ **Reclassificada: parada → rodando em produção.** Descoberto que **IGA é a
  operação Itaú** — não um terceiro. O `context/produtos.md` listava IGA como "fora do
  radar", o que era duplicação da própria frente. Corrigido.
- 8 workflows 🟩 estáveis: gatilho de fim de evento, relatório, remanescentes por UF,
  planilha (Resultado VD), cockpit do comprador, análise de base, controle de cadastros.
- Evento ~1x/semana, fecha sempre 16h. Cron `0 */10 16-19 * * 1-5` + sábado 12-15h.
- Relatórios vão também pra destinatários externos @itau-unibanco.com.br.
- Esperando **Gui**: aprovação pra readicionar `fernando.tuunelis` no e-mail do Relatório.
- Doc completo: `automations/n8n-flows/cars2you-iga-automacoes.md`.
