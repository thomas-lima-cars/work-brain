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

## 2026-10-08 a 13 (sem `/salve` na época)
- Nasce o **Estudo de Vendas IGA** (`automations/estudo-vendas-iga/`): HTML estático, sem
  n8n. Pergunta: a venda do IGA caiu por deságio baixo, e os compradores mudaram? Resposta da v2:
  o êxito se move pela demanda, não pelo pedido. Números em
  `context/banco-de-dados/projetos/vendas-iga/indicadores.md`.

## 2026-10-15
- Tabela de compradores do estudo: ordena pela coluna clicada, mostra todas as lojas com compra
  em 12 meses (não só as 50 maiores) e o gráfico mês a mês soma todas elas sem seleção.
- Re-extraído do banco: manchetes iguais às de 08/10 (série segue até set/26).

## 2026-11-05
- Nasce o **Mega Evento Fenauto (IGA)** (`automations/n8n-sdk/painel-eventos-fenauto-iga/`): o
  painel da Fenauto com a identidade do IGA e **só os eventos do IGA** (vendedores 594, 598 e
  16036; o que alveja o WL 43 fica fora). Na semana da Fenauto 2025, 7 eventos; na de 02 a
  08/11/2026, 2 (24350 e 24363). Números em
  `context/banco-de-dados/projetos/mega-evento-fenauto/indicadores.md`. Local, 287 provas;
  **workflow não criado** (espera ok).

## 2026-11-09
- **Mega Evento Fenauto (IGA)**: só eventos do IGA com "Fenauto" no nome, abertos no mês
  corrente (pedido do Thomas). Entra na **Rotina Fenauto** (`9CNN9FjRohxaRUZq`, criada, inativa),
  publicando em `Fenauto_202611/IGA/`.
- **Estudo de Vendas IGA** atualizado até out/26: êxito 12 meses 46,7%, out/26 33%, 53 de 148
  recorrentes pararam (números em `projetos/vendas-iga/indicadores.md`). Bug da janela-base
  ("dia 31" em junho) corrigido; a última janela fixa anda sozinha.
