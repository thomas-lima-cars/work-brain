# 📍 Estado Atual — Work Brain do Thomas

> Painel vivo. Mantido pelo `/salve` no fim de cada sessão. Lido pelo `/cerebro` no boot.
> **Última atualização:** 2026-09-10 madrugada — relatório de aderência fechado; duas armadilhas do banco documentadas

## 🔹 Frentes quentes agora
- **cars2you** — 🔥 **Relatório de aderência pronto e em uso.** `rel-veiculos`
  (`8fiTFsjWG9RQinz8`): para cada veículo em evento, ranqueia as lojas por chance de
  compra. A base é **uma linha por veículo, com o status da última negociação** —
  acha a última primeiro, olha o status depois. Corte de **50%** de correspondência.
  Tela clara com filtros de whitelabel, UF e evento valendo na página inteira, e
  **glossário** em tela própria. Último run: **49984**, apontado para os nove eventos de
  09/09 — 735 veículos de sobra, 251 lojas, 14.507 correspondências, 1,4 MB.
  Ver `automations/n8n-sdk/rel-veiculos/README.md`.
  Pendente antigo: Pulso de Eventos (`20LeyMLjrAKeKVeS`) — encurtar mensagem + bolinha
  colorida, alinhar com Doni.
- **c6** — 🔥 **Parado há 6 dias no mesmo ponto: falta um run que termine.**
  Lote 2 pronto e provado localmente. Gerador NOVO em `automations/n8n-sdk/gerador/`
  (4 partes, 27 KB contra 87 KB de produção), reativo por desenho: **21 de 24 medidas**
  reagem ao filtro de whitelabel. Recorte nos 6 whitelabels (43, 48, 62, 65, 7, 4).
  ⚠️ Execução 48693 cancelada após 1h05. Causa achada: 915 das 1.231 chamadas eram do
  Raio-X, que foi ocultado da tela — 74% de desperdício. Mais o `onError: continuar`,
  que fez cada timeout queimar 15s em vez de falhar rápido.
  Workflow `QImk2D4HdzIqHZe9` (sem nó de e-mail) · sondas em `7TCmS8JFacDTmySQ`
- **bradesco** — _(estado a preencher na próxima sessão)_

## ⚙️ Rodando em produção (sem demanda ativa minha)
> Distinção importante: automação rodando ≠ frente quente. Aqui a máquina trabalha sozinha.
- **itau** — operação **IGA**, 8 workflows 🟩 estáveis. Evento ~1x/semana, fecha 16h.
  Pendência antiga: readicionar `fernando.tuunelis` no e-mail do Relatório quando o Gui aprovar.
- **lm** — Lista LM + Proposta LM 🟩. Feirões diários que reciclam estoque — foi isso que
  motivou a deduplicação por veículo no relatório de aderência.
  ❓ Sigla "LM" ainda não decifrada.

## 🧊 Frentes fora do radar
- **outros** — coringa, sem movimento

## 🔥 Decisões em aberto
- **As 4 lojas "internas" contam no ranking?** — Porto Seguro, Itaú Unibanco, Teste
  Cars2you v3 e Teste Cars2You V5, todas em SP/Marketplace. Se forem contas internas,
  excluo do universo — decisão do Thomas.
- **Modelo casa por id ou por nome?** — o catálogo `models` tem nomes duplicados em duas
  faixas de id. Por id, "Strada" não bate com "Strada". Hoje é por id; impacto medido em
  4 de 14.507 pares.
- **Onde hospedar os relatórios** — hoje na cloud/máquina do Caio. Sem definição.
- **Skip / Adapta** — plano Starter ~R$1.000/mês (negociando ~R$200/mês, 10 licenças).
  Caio, Gui e Daniel avaliam. Thomas não é decisor.
- **Versionar `automations/estado/*.json`?** — 86 KB de estado de execução que muda a cada run.
- **Lance Fácil BTB merece pasta própria?** — tem 2 whitelabels (62, 65) e 2 workflows, mas
  não é frente declarada.
- **Canal único de alerta de falha dos crons** — nenhum dos 9 crons tem `onError` documentado,
  o que contraria o próprio princípio "falha silenciosa é proibida".

## 📌 Cobranças minhas (preciso agir)
- [ ] 🔥 **Fazer o run do C6 terminar** — na ordem: (1) tirar as 8 queries `rx_*` da fila,
      915 chamadas a menos e custo zero porque as abas estão ocultas; (2) desligar
      `onError: continueRegularOutput` no nó MCP, pra falhar rápido; (3) rodar
      `QImk2D4HdzIqHZe9`, ~301 chamadas; (4) baixar o `DADOS` e montar com
      `node monta_html_de_dados.js`. Se ainda estourar, sonda de 8 chamadas comparando
      `BASE` com e sem o recorte dos 6 whitelabels.
- [ ] **Esvaziar `EVENTOS_IDS` no `rel-veiculos`** — enquanto estiver preenchido, rodar
      devolve sempre o recorte dos nove eventos de 09/09, não a janela móvel de 48h.
- [ ] **Tabela de ativação por safra** (pedida em 04/09, adiada a pedido do Thomas):
      queries `ativacao` e `ativacao_wl` já escritas; falta a tabela no HTML e marcar
      safra imatura em vez de mostrar 0%.
- [ ] **4 rankings por whitelabel sem solução** — estouram o deadline mesmo no padrão PC.
      Não tentado: derivar o ranking da coorte, que já tem compradores por WL.
- [ ] Decidir a distribuição do relatório C6: o HTML foi a **1,27 MB**; anexo diário desse
      tamanho é arriscado. Alternativa que já existe na casa: SharePoint + link, como o IGA faz.
- [ ] Varrer o catálogo `models` inteiro atrás de mais nomes duplicados.
- [ ] Medir se **outras** colunas de data seguem a convenção de hora local — só as duas de
      `events` estão confirmadas.
- [ ] Terminar de decodificar `situation`/`status` de `advertisements`, `offers`,
      `vehicles`, `shop_stocks` — o método que funcionou está em `dominios.md`.
- [ ] Cosmético: `Injetar Filtros` está em [1120,0], sobreposto ao nó de e-mail no canvas
- [ ] Pedir ao Gui/Everton o diretório **completo** da skill (faltam BC-01..BC-18 e o template)
- [ ] 🚨 **Achar a fonte de "aluguel"** — metade da pergunta da ata e não existe em artefato nenhum
- [ ] Confirmar com o Everton o `versionId` limpo da cópia antes de qualquer pull
- [ ] Pulso de Eventos: encurtar mensagem + bolinha colorida — alinhar com Doni
- [ ] Higiene n8n: arquivar a sonda `a6fNNTUYYayehNIn` + os 3 workflows TEMP do C6 + o "Testes"
- [ ] Validar `automations/crons.md` contra o n8n ao vivo (preenchi de memória dos docs, não da API)
- [ ] Descrever o estado atual de `bradesco` (frente quente sem parágrafo)
- [ ] Esclarecer o que é a sigla **LM** (fornecedor de estoque — nome completo desconhecido)
- [ ] Confirmar os cargos inferidos em `context/stakeholders.md`
- [ ] Preencher `01-contexto.md` de `itau` e `lm` com o que já está em `automations/`

## ⏳ Esperando outros
- **Thomas** — confirmar se as 4 lojas do ranking são contas internas
- **Gui** — aprovação pra readicionar `fernando.tuunelis` no e-mail do Relatório IGA
- **Caio / Gui / Daniel** — avaliação do Skip/Adapta
- **Doni** — alinhamento do formato do Pulso de Eventos

## ⚠️ Alertas críticos
- 🚨 **A entrega do C6 não saiu, e já são 6 dias.** O relatório está pronto e provado, mas
  nenhum run terminou. É avaliação de skill (ata 2026-09-02).
- 🕐 **O banco responde em UTC; as datas dos eventos estão em hora de Brasília.** Às 21h
  daqui o banco já virou o dia, então `CURDATE()` perde o dia inteiro. Recorte de evento
  por data tem que ser calculado fora do SQL e ir como literal. Ver `dominios.md`.
- 🔤 **Transcrever nó grande pro n8n: a barra invertida é onde se erra.** Escapar uma vez
  a mais derruba o run (execução 49963). Prefira `indexOf` a regex, e meça a forma
  escapada antes de mandar. Heredoc do bash come barra — patch vai em arquivo.
- 🔗 **Cada nó Code reconstrói o próprio META.** Campo que a fase anterior publica e a
  seguinte esquece de repassar chega `undefined` em silêncio. Já aconteceu duas vezes.
- 🧪 **JS de navegador dentro de nó n8n não é validado por `node --check`.** O código do
  cliente viaja como string. Rodar o `_smoke_dom.js` antes de entregar — ele executa
  contra um DOM de mentira **e interage** com os controles.
- 🐛 **Bug no relatório de PRODUÇÃO do C6:** as 12 barras de recência saem com `width:30,4%`.
  Vírgula decimal é CSS inválido — as barras estão zeradas hoje. O gerador novo emite com ponto.
- ⚠️ **`saida-teste-local.html` NÃO é compartilhável** — 32 das 34 fontes são sintéticas,
  incluindo nomes de loja e CNPJs.
- 🚨 **"Aluguel" não existe em nenhum artefato.** A ata pede "quantos já alugaram"; workflow,
  skill do Gui e protótipo só têm login/oferta/compra.
- **Não rodar/ativar a cópia `ZIwusfx9IK1Owpg1`** — 6 destinatários reais + cron 08h; manter
  o nó de e-mail `disabled`.
- Cópia `GgjVZlU04wvJzLbK` (Auditoria de Estoque) está com `MODO='producao'` e gatilho 08h.
  **Ativar sem trocar pra `'teste'` dispara e-mail pra lista completa.**

## 📅 Compromissos próximos
- _(nenhum com data marcada — o run do C6 está vencido desde 05/09)_
