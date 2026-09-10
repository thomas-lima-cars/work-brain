# 📍 Estado Atual — Work Brain do Thomas

> Painel vivo. Mantido pelo `/salve` no fim de cada sessão. Lido pelo `/cerebro` no boot.
> **Última atualização:** 2026-09-09 noite — banco documentado, dois relatórios novos, run 49846 conferido

## 🔹 Frentes quentes agora
- **cars2you** — 🔥 **Dia grande.** O **esquema do banco entrou no brain**
  (`context/banco-de-dados/`, 144 tabelas, 1.474 colunas, 239 FKs) — consultar antes de
  qualquer SQL. Nasceram **dois relatórios**, ambos no padrão de duas fases:
  `lojas-ofertas` (`LZL3mxfbMIz4avyx`, perfil de compra das 1.300 lojas) e `rel-veiculos`
  (`8fiTFsjWG9RQinz8`, aderência veículo × loja para eventos fechando em 48h).
  Execução **49846**: 366 veículos, 613 lojas, 60.295 pares, 8,4 min, zero falhas — e os
  60.295 pares foram recalculados um a um, batem. Ver `automations/n8n-sdk/rel-veiculos/README.md`.
  Pendente antigo: Pulso de Eventos (`20LeyMLjrAKeKVeS`) — encurtar mensagem + bolinha
  colorida, alinhar com Doni.
- **c6** — 🔥 **Parado há 5 dias no mesmo ponto: falta um run que termine.**
  Lote 2 pronto e provado localmente. Gerador NOVO em `automations/n8n-sdk/gerador/`
  (4 partes, 27 KB contra 87 KB de produção), reativo por desenho: **21 de 24 medidas**
  reagem ao filtro de whitelabel, testado em navegador. Recorte nos **6 whitelabels**
  (43, 48, 62, 65, 7, 4), aplicado no SQL.
  ⚠️ Execução 48693 cancelada após 1h05. Causa achada: 915 das 1.231 chamadas eram do
  Raio-X, que foi ocultado da tela — 74% de desperdício. Mais o `onError: continuar`,
  que fez cada timeout queimar 15s em vez de falhar rápido.
  Workflow `QImk2D4HdzIqHZe9` (sem nó de e-mail) · sondas em `7TCmS8JFacDTmySQ`
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
- **As 4 lojas "internas" contam no ranking?** — Porto Seguro, Itaú Unibanco, Teste
  Cars2you v3 e Teste Cars2You V5, todas em SP/Marketplace, elegíveis para 197 veículos
  cada. Uma chega a score 82,4 e lideram 2 dos 366 veículos. Se forem contas internas,
  excluo do universo — decisão do Thomas.
- **Tamanho do HTML de aderência** — foi a **4,4 MB** com os 60.295 pares embutidos.
  Cortar pares abaixo de um score mínimo resolve, ao custo de deixar a direção
  loja→veículos incompleta para lojas fracas.
- **Modelo casa por id ou por nome?** — o catálogo `models` tem nomes duplicados em duas
  faixas de id. Por id, "Strada" não bate com "Strada". Por nome, junta versões que talvez
  devam ficar separadas. Hoje é por id; impacto medido em 0,01% dos pares.
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
- [ ] 🔥 **Fazer o run do C6 terminar** — na ordem: (1) tirar as 8 queries `rx_*` da fila,
      915 chamadas a menos e custo zero porque as abas estão ocultas; (2) desligar
      `onError: continueRegularOutput` no nó MCP, pra falhar rápido; (3) rodar
      `QImk2D4HdzIqHZe9`, ~301 chamadas; (4) baixar o `DADOS` e montar com
      `node monta_html_de_dados.js`. Se ainda estourar, sonda de 8 chamadas comparando
      `BASE` com e sem o recorte dos 6 whitelabels.
- [ ] Rodar o `rel-veiculos` apontando `EVENTOS_IDS` para eventos específicos — é como o
      Thomas disse que vai usar ("sempre será para 1 ou alguns eventos").
- [ ] **Tabela de ativação por safra** (pedida em 04/09, adiada a pedido do Thomas):
      % que logou / ofertou / comprou dentro de 30-60-90-180 dias do cadastro.
      Queries `ativacao` e `ativacao_wl` já escritas; `sonda-ativacao.js` pronta, 15
      chamadas. Falta a tabela no HTML — e marcar safra imatura em vez de mostrar 0%.
- [ ] **4 rankings por whitelabel sem solução** — estouram o deadline mesmo reescritos
      no padrão PC (medido em 48644 e 48645). Hoje caem no ranking global com selo.
      Não tentado ainda: derivar o ranking da coorte, que já tem compradores por WL.
- [ ] Decidir a distribuição do relatório C6: o HTML foi a **1,27 MB**; anexo diário desse
      tamanho é arriscado. Alternativa que já existe na casa: SharePoint + link, como o IGA faz.
- [ ] Varrer o catálogo `models` inteiro atrás de mais nomes duplicados — os 3 que achei
      (Amarok, Fiorino, Strada) só apareceram por estarem no relatório de hoje.
- [ ] Terminar de decodificar `situation`/`status` de `advertisements`, `offers`,
      `vehicles`, `shop_stocks` e `events` — o método que funcionou está em `dominios.md`.
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
- [ ] Preencher `01-contexto.md` de `itau` e `lm` com o que já está em `automations/` (o do `c6` foi feito)

## ⏳ Esperando outros
- **Thomas** — confirmar se as 4 lojas do ranking são contas internas
- **Gui** — aprovação pra readicionar `fernando.tuunelis` no e-mail do Relatório IGA
- **Caio / Gui / Daniel** — avaliação do Skip/Adapta
- **Doni** — alinhamento do formato do Pulso de Eventos

## ⚠️ Alertas críticos
- 🚨 **A entrega do C6 não saiu, e já são 5 dias.** O relatório está pronto e provado, mas
  nenhum run terminou. É avaliação de skill (ata 2026-09-02).
- 🧪 **JS de navegador dentro de nó n8n não é validado por `node --check`.** O código do
  cliente viaja como string. Dois bugs chegaram ao Thomas por essa fresta. Antes de
  entregar HTML gerado por nó, rodar o `_smoke_dom.js` — ele executa contra um DOM de
  mentira **e interage** com os controles, que é onde o segundo bug se escondia.
- 🔤 **Código de nó transcrito à mão não quebra: envenena.** Um caractere trocado no meio
  de uma fórmula passa pela sintaxe e só aparece nos números. Depois de sincronizar um nó
  grande, conferir o resultado contra a fórmula (`_confere_run.js` faz isso).
- 🐛 **Bug no relatório de PRODUÇÃO do C6:** as 12 barras de recência saem com `width:30,4%`.
  Vírgula decimal é CSS inválido — o navegador descarta e **as barras estão zeradas
  hoje**. O gerador novo emite com ponto. Vale corrigir no de produção também.
- ⚠️ **`saida-teste-local.html` NÃO é compartilhável.** Só `coorte` e `coorteWl` são
  dado real; as outras 32 fontes são sintéticas, incluindo nomes de loja e CNPJs.
- **Nó grande não passa pela API do MCP** (o `Montar HTML` de 87 KB não passava). Resolvido
  partindo em nós: CSS (12 KB), App (46 KB) e o que evolui (27 KB). Guardar app como
  FUNÇÃO e usar `toString()` evita escape duplo — string escapada em 45 KB é onde se erra.
- 🚨 **"Aluguel" não existe em nenhum artefato.** A ata pede "quantos já alugaram"; workflow,
  skill do Gui e protótipo só têm login/oferta/compra. Entrega fica pela metade se não resolver.
- **Não rodar/ativar a cópia `ZIwusfx9IK1Owpg1`** — 6 destinatários reais + cron 08h. Hoje o nó de
  e-mail está `disabled: true`; **manter assim**. Erro no `Anexar HTML` durante sonda é esperado.
- Cópia `GgjVZlU04wvJzLbK` (Auditoria de Estoque) está com `MODO='producao'` e gatilho 08h.
  **Ativar sem trocar pra `'teste'` dispara e-mail pra lista completa em paralelo ao original.**

## 📅 Compromissos próximos
- _(nenhum com data marcada — o run do C6 está vencido desde 05/09)_
