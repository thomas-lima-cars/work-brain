# C6 — Histórico

> Linha do tempo. Base pra detectar contradição entre o que foi dito antes e agora.

## 2026-09-03
- Frente criada no onboarding do work-brain.
- Classificada como **parada** (fora do radar).

## 2026-09-03 (tarde)
- ⚠️ **Reclassificada: parada → quente.** A classificação de "parada" do onboarding
  estava errada — veio de falta de informação, não de ausência de trabalho.
- **Prazo sexta 04/09:** evoluir o relatório C6 para **100% da base**, com visão de
  safra/coorte (total do recorte + quantos já alugaram / já compraram / nunca alugaram)
  e a dinâmica de botão/dashboard que já existe. Dupla: Thomas + Everton.
  É **avaliação de skill** — se não sair, a diretoria busca gente externa.
- Base técnica candidata: `ehsqQo6hiPDRf58I` (Relatório de Evento C6 Lojistas) e
  `2ECmLRceNEgCCYyb` (Análise de base de cadastros).
- Escopo mapeado: Evento Exclusivo C6 Auto, shop 104754, whitelabels 43 e 48.
  Evento quase diário (16 em ~1 mês), fecha 16h **ou** 20h — janela diferente do IGA.
- Higiene pendente: 3 workflows `TEMP` do C6 ainda **ativos** a arquivar.
- Fonte: `memory/inputs/meetings/2026-09-02-squad-de-relatorios.md` e
  `automations/n8n-ambiente-cars2you.md`.

## 2026-09-03 (noite)
- **Importado o protótipo do Everton** → `automations/prototipo-safra/`. O trabalho da entrega
  de 04/09 **já está começado**, não começa do zero.
- **Verifiquei que é reproduzível:** rodei o `build_proto.py` num diretório limpo e o MD5 do HTML
  gerado bate com o de referência. Sem banco, sem n8n, sem internet.
- **Dados validados por dois caminhos independentes:** o volume do WL43
  (`R$ 146.746.209,69`) nos JSONs do protótipo é idêntico ao campo `volume` do nó `Montar HTML`
  da execução 48290 do workflow original.
- **Pronto:** bloco "Safra de Cadastro" (coorte por mês de cadastro, KPIs+Situação+Funil reativos),
  seletor de 58 whitelabels com cross-filter bidirecional, Recência WL-reativa.
- **Falta:** UF, Top 10 (×4), Destaques, Evolução (9 gráficos).
- ⚠️ **Correção à leitura de ontem:** as 11 execuções com erro da cópia `ZIwusfx9IK1Owpg1`
  **não eram cópia quebrada** — são o padrão *swap-run-restore*, em que o erro no `Anexar HTML`
  é esperado. O n8n é a única ponte pro banco (Cloud fora da VPC).
- 🔥 **Decisão em aberto:** continuar client-side (4 seções) ou portar pro n8n
  (parametrizar `whitelabel_id`). O próprio autor recomenda reavaliar; minha leitura é que
  portar sai mais barato.
- ❓ **`aluguel` não existe em nenhum artefato** — nem workflow, nem skill do Gui, nem protótipo.
  É metade da pergunta da ata e segue sem fonte.

## 2026-09-04 (madrugada)
- **Camada de dados portada pra multi-whitelabel.** A base do relatório sai de
  `whitelabel_id = 43` fixo (2.921 clientes) pra plataforma inteira: **29.010**,
  sem duplicar quem está em vários whitelabels.
- Sandbox próprio **`0pUtqToo0zNNibQT`** (projeto pessoal do Thomas, inativo, nó de
  e-mail desabilitado). Produção e a cópia do Everton não foram tocadas.
- **Validado contra produção** (execução 48437): R$ 2.505.966.430,56, 2.108 compradores,
  78 safras. Quatro invariantes internas fecham.
- **Filtro de safra (Ano/Mês) funciona** — recalcula 18 valores ao vivo. Testado local.
- ⚠️ **Filtro de whitelabel ainda não funciona**: o dado por WL não existe. Falta 1 query
  (coorte por whitelabel, 516 linhas, 11 páginas) — já provada pelo protótipo.
- Decisão do Thomas: **manter os 58 whitelabels** no seletor, inclusive os vazios.
- Descoberto que o `Montar HTML` de 87 KB **não passa pela API do MCP**. Levou à
  arquitetura B (adaptadores + injetor), que deixa o gerador intocado pra sempre.
- Três timeouts no caminho, todos em queries que ficaram caras ao perder o filtro de WL.
- **03h15 — arquitetura B validada no n8n** (execução **48480**, 13min21s). Os 9 nós rodam:
  adaptadores entregam `kpi`/`situacao` sintetizados da coorte, o `Montar HTML` consome sem
  saber que algo mudou, e o injetor acrescenta os filtros. **Filtro de safra funcionando.**
- ❌ **`coorte_wl` estourou o deadline** (execução 48476, 67s) — 4º timeout da noite.
  Agrupar por whitelabel sobre a tabela derivada `BEXT` é caro: derivada não tem índice, então
  o join com `user_whitelabels` materializa os 29 mil usuários. A coorte simples escapa porque
  agrupa direto por `ym`, sem join novo.
  **Revertido pro lote 1d.** O seletor de WL fica presente e desabilitado.
- 💡 **Hipótese pra próxima sessão:** paginar `coorte_wl` **por whitelabel** em vez de por
  `OFFSET` (o OFFSET recalcula tudo e descarta). Complicação conhecida: o WL 7 sozinho tem 78
  meses, estourando o teto de 50 linhas de uma fatia por WL — precisa de sub-paginação.
  **NÃO chutar**: dois dos quatro timeouts de hoje vieram de hipótese tratada como conclusão.
- **05h00 — ✅ SELETOR DE WHITELABEL FUNCIONANDO** (execução **48492**, 13min32s).
  Dropdown com os 58 whitelabels, 516 linhas por WL. Recorte do WL43 reproduz produção:
  **2.922 clientes / 240 compradores**. O relatório antigo virou uma fatia do novo.
- **Correção (lote 1f):** `coorte_wl` fatiada por **ano de cadastro** em vez de `LIMIT/OFFSET`.
  O recorte entra como `u.created_at >= 'YYYY-01-01'` **dentro do `BEXT`**, coluna indexada —
  cada consulta monta 1/7 da base. Escolhido por medição (`mede_shards.py`): fatiar por faixa
  de `whitelabel_id` daria 59% das linhas numa fatia só, e filtraria depois do `BEXT` montado.
- 💡 **Padrão validado pro nível 2.** As 18 queries restantes têm a mesma forma e o mesmo
  risco; agora existe precedente medido em vez de tentativa a 14 min cada.
- **Escopo atual do filtro:** 18 valores (8 KPIs + 6 Situação + 4 Funil), por WL **e** por safra.
  Faltam 9 seções — Evolução (9 gráficos), UF, 4 Top 10, Destaques, Recência, 2 abas de Raio-X.
