# 📍 Estado Atual — Work Brain do Thomas

> Painel vivo. Mantido pelo `/salve` no fim de cada sessão. Lido pelo `/cerebro` no boot.
> **Última atualização:** 2026-09-04 (madrugada) — port do relatório C6 pra multi-whitelabel

## 🔹 Frentes quentes agora
- **c6** — 🔥 **ENTREGA HOJE.** Camada de dados **portada e validada**: o relatório sai de
  2.921 (só C6) pra **29.010 clientes** da plataforma. Filtro de **safra Ano/Mês funciona**.
  Filtro de **whitelabel ainda não** — falta 1 query (coorte por WL, 11 páginas, já provada).
  Sandbox `0pUtqToo0zNNibQT` · código e provas em `automations/n8n-sdk/`
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
- **Nível 2 do lote 2 vale a pena?** Fazer o whitelabel filtrar **todas** as seções e abas custa
  18 queries por WL + `rx_buyer_wl`, uma `renderX()` por seção e Chart.js recriado a cada troca.
  É frente própria, com prazo próprio — decidir junto com o Everton, que fez o caminho client-side.
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
- [ ] **HOJE 04/09** — nível 1 do lote 2: coorte por whitelabel (1 query) destrava o seletor de WL
- [ ] **HOJE 04/09** — subir a arquitetura B: renomear 2 nós, criar 3, refazer conexões
- [ ] Pedir ao Gui/Everton o diretório **completo** da skill (faltam BC-01..BC-18 e o template)
- [ ] 🚨 **Achar a fonte de "aluguel"** — metade da pergunta da ata e não existe em artefato nenhum
- [ ] Confirmar com o Everton o `versionId` limpo da cópia antes de qualquer pull
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
- 🚨 **A ENTREGA É HOJE e é avaliação de skill.** Se o relatório C6 não sair, a diretoria
  busca gente externa. Fonte: ata 2026-09-02.
- **`Montar HTML` (87 KB) não pode ser editado pela API do MCP** — o literal passa de 50 mil
  tokens. Qualquer mudança nele vai pela UI ou pela arquitetura B. Não esbarrar nisso de novo.
- 🚨 **"Aluguel" não existe em nenhum artefato.** A ata pede "quantos já alugaram"; workflow,
  skill do Gui e protótipo só têm login/oferta/compra. Entrega fica pela metade se não resolver.
- **Não rodar/ativar a cópia `ZIwusfx9IK1Owpg1`** — 6 destinatários reais + cron 08h. Hoje o nó de
  e-mail está `disabled: true`; **manter assim**. Erro no `Anexar HTML` durante sonda é esperado.
- Cópia `GgjVZlU04wvJzLbK` (Auditoria de Estoque) está com `MODO='producao'` e gatilho 08h.
  **Ativar sem trocar pra `'teste'` dispara e-mail pra lista completa em paralelo ao original.**

## 📅 Compromissos próximos
- **HOJE, 2026-09-04 (sexta)** — entrega do relatório C6 (safra + 100% da base)
