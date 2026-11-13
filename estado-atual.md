# 📍 Estado Atual — Work Brain do Thomas

> Painel vivo. Mantido pelo `/salve` no fim de cada sessão. Lido pelo `/cerebro` no boot.
> **Última atualização:** 2026-11-12 (salvo na madrugada de 13/11). A **Rotina Fenauto**
> (`9CNN9FjRohxaRUZq`) está **ativa** de hora em hora, e a versão publicada é a `1b947c86`. Os três
> painéis da Fenauto mudaram em 12/11:
> - **novos lojistas pelo grupo**: 148 no IGA; 69 e 146 no C6;
> - **novos e reativados separados**;
> - **vendidos** contam a venda cuja oferta vencedora não tem loja;
> - **cada veículo conta uma vez**, mesmo em dois eventos.
>
> Em 11/11: cartão de lojistas por região no IGA, e cliente da Fenauto pela campanha de cada operação (essa regra foi substituída em 12/11).
>
> Em 09/11 os três painéis passaram a mostrar só eventos com "Fenauto" no nome. O Estudo IGA foi até out/26. Em 06/11 o **Painel de Eventos Cars2You foi ao ar** (`cRChMwAnLYGRMesM`, de hora em hora das 9h às 18h, com metas por comitente e categoria). Em 04/11 a Análise de Base do C6 Lojista veio para o repo. Em 29–30/10, a **Projeção de vendas 2027** ficou pronta e falta mandar. Radar: três mudanças de 22–23/10 continuam **sem run**. ⚠️ Vários blocos abaixo são de 30/09.

## 🔹 Frentes quentes agora
- **Projeção de vendas 2027** — 🔥 nasceu em 29/10, pedido do **Tuunelis** (ata
  `memory/inputs/meetings/2026-10-29-projecao-2027.md`), pasta `automations/projecao-vendas-2027/`.
  Excel por fórmulas a partir dos 9 fechamentos (jan–set/26, aba geral + caixa): Base consolidada e
  Projeção 2027 — comparação anual por comitente no topo (recolhe até o total) e um bloco por
  comitente no formato da origem, 2026 em cima e 2027 embaixo, premissas % / # / êxito / receita por
  venda. Regras em `memory/decisions/2026-10-29-regras-projecao-2027.md`; números no README.
  ✅ Validada (30/10). **Falta mandar ao Tuunelis** e criar o projeto no Claude com ele e o Mattera.
- **Radar de Estoque** — 🔥 wf `8fiTFsjWG9RQinz8`, pasta `automations/n8n-sdk/rel-veiculos/`.
  ✅ **Run 53433** (23/09, 16min15s), tudo transcrito e conferido byte a byte. Novidades:
  **farol de oferta** (VMV) e o filtro dele; **trava de grupo de cliente** no cruzamento
  (31.275 pares cortados); modelo/categoria de volta depois da fusão que falhou no 53385.
  Tempos por nó e números em `context/banco-de-dados/projetos/radar-de-estoque/indicadores.md`.
  🔴 **O MCP Fase 2 leva ~15 min** (banco a ~4,5s por chamada). O gargalo medido é o
  `ult_acesso` sobre `access_logs` (3,3 mi linhas, sem índice), refeito nas 27 páginas.
  Direção do Thomas: **consultas diretas, processamento no n8n, nada de fundir consulta.**
  ✅ Carteira comercial ao vivo desde 21/09 (39 lojas sem responsável).
  ✅ **22–23/10: três mudanças no `Montar HTML`, transcritas e conferidas (4 nós idênticos),
  commit `84545af`, run NÃO feito:** botão **Exportar analítico** (CSV nas duas tabelas,
  lojistas com e-mail e telefone); **publicação por score** (todos os pares ≥ 70, mínimo 30,
  teto 150 — substituiu o teto fixo de 30); **filtro de veículo** (evento, farol, busca) chega à
  tabela de lojas e ao KPI Lojas elegíveis (≥ 70 em algum veículo filtrado). Estimativa
  +0,4 MB (~5,4 MB). Detalhes e medições no README da pasta.
- **Painel de Eventos Cars2You** — 🔥 **no ar desde 06/11**: wf **`cRChMwAnLYGRMesM`** (projeto
  Cars2You), **ativo de hora em hora, 9h às 18h, todo dia** (fuso Brasília), histórico só de erro;
  publica `Painel de Eventos Cars2You/painel-eventos-cars2you.html` (site N8N; run 68395 ✅). Pasta
  `automations/n8n-sdk/painel-eventos-cars2you/`, frente `cars2you`. 06/11: status em **funil**
  (com oferta ⊃ VMV ⊃ vendidos; removidos 8/10), gráfico **acumulado no evento**, **aba Mensal**
  (12 meses), **metas** de % com oferta e % vendidos por comitente e categoria lidas da planilha
  `Comitente - Metas/metas-painel-eventos.xlsx` (`gera_metas.py`; travada, editável só nas metas),
  **filtro de categoria** (Leves com motos, Pesados, Equipamentos, Não informada), cores pela meta,
  indicador nasce em Com oferta. Montar Painel vai **dividido em 3 nós** (`_divide.js`). 91 provas.
  Números em `projetos/painel-eventos-cars2you/indicadores.md`.
- **Rotina Fenauto** — 🔥 **ativa**: wf **`9CNN9FjRohxaRUZq`** (projeto Cars2You), pasta
  `automations/n8n-sdk/rotina-fenauto/`.
  - Os três painéis rodam em série (C6 → IGA → Cars2You), de hora em hora das 9h às 18h, de segunda a sábado. Publicam em `Fenauto_202611/`.
  - Versão publicada: **`1b947c86`** (12/11), com o md5 dos 15 nós conferido. A rodada 69115 levou 60 s, sem erro. O histórico de versões está em `crons.md`.
  - O maior nó, `iga/pecas-tema`, tem 55.793 bytes, para um teto de 57.344.
  - **Antes de enviar pelo MCP, fechar a aba do editor**: em 12/11 um salvamento numa aba antiga desfez 7 nós.
  - A pasta de novembro está fixa no `_divide.js`.
- **Os três painéis da Fenauto** (fonte da rotina; mudou um, rodar o ciclo dele e o da rotina):
  - **Eventos Fenauto C6** (`painel-eventos-fenauto-c6/`, frente `c6`): WL 43, só eventos com
    "Fenauto" no nome, na semana; **logo C6 Auto** (`design/marca/c6-auto/`) à esquerda, título no
    centro, Fenauto à direita, botões abaixo do cabeçalho; sem representante. 295 provas;
  - **Mega Evento Fenauto (IGA)** (`painel-eventos-fenauto-iga/`, frente `itau`): só eventos do
    IGA com "Fenauto" no nome, no **mês corrente**; cartão de lojistas por região. 323 provas;
  - **Mega Evento Fenauto (Cars2You)** (`painel-eventos-fenauto-cars2you/`, frente `c6`): C6 + IGA
    com "Fenauto" no nome, na semana (em 09/11: 24368, 24384, 24377–24379). 341 provas.
  As regras de 12/11 valem para os três (sessão `memory/sessions/2026-11-12.md`):
  - **novos** = loja cadastrada a partir de 10/11 no grupo da operação; **reativados** = loja antiga sem compra nos 6 meses antes de 10/11 que voltou; ficam fora os internos, os testes e as contas do banco;
  - os vendidos contam a venda lançada por usuário interno;
  - um veículo conta uma vez.
  A data de início (`INICIO_CAMPANHA`) e os grupos estão fixos no código: trocar para 2027.
  Números em `projetos/mega-evento-fenauto/indicadores.md` e `projetos/c6/indicadores.md`.
- **design system** — 🔥 `design/tokens/tema.css` é fonte única (produto com cara própria = camada de cor `tema-<produto>.css`, o C6 foi o primeiro); dela saem os dois modelos
  **e** o `kit-de-painel.md`, o arquivo único que vai para o time (68 KB, autossuficiente).
  172 provas. ❓ **A fonte segue em aberto** — `dashboard-teste.html` é o laboratório.
  **26/10: painel novo abre no ESCURO** (regra 7) — o kit ainda diz o contrário, regerar.
  Marca nova: `design/marca/fenauto/` (preta, branca e a **azul guardada**) + `paletas/fenauto.json`.
- **bancos (cars2you + dealers)** — 🔥 acesso direto, só leitura. **Depende de VPN.**
  🔴 **O `schema.md` documenta 149 tabelas e o banco tem 193.** Faltam 44 desde 09/09.
  ❓ **O objetivo do acesso à Dealers segue sem ser declarado.**
- **Painel de Precificação** — 🔥 nasceu em 14/10. wf `gzc0zOKMF4vCbXGH` (projeto Cars2You),
  pasta `automations/n8n-sdk/painel-precificacao/`. Não vendidos dos últimos 30 dias: preço do
  **modelo preditivo** (`automations/precificacao/preditivo/`) × VMV do cliente. Execução 61975 ✅
  publicada; fuso em Brasília; **agendamento 7h desligado, espera ok**. VMV = R$ 100.000 tratado
  como provisório (`plataforma/dominios.md`). Re-treino mensal fora do n8n (README da pasta).
- **cars2you** — 🔥 estudo de precificação entregue em quatro páginas, mais duas de laudo (14/10).
  🔴 **O maior efeito de preço vive num campo de TEXTO:** `REPASSE` (35,7%) contra
  `TRADICIONAL` (28,7%) — 7,0 p.p., t = 40,7, maior que km, cluster ou comprador.
  Pendente antigo: Pulso de Eventos (`20LeyMLjrAKeKVeS`), alinhar com Doni.
- **Painel de Eventos C6** — ✅ **publicado** (run 55191, 30/09, 15 s) no wf
  `0Ndif0UK2UjTfaIN`, **projeto Cars2You**. Versão 5: cinco KPIs (com Performance
  financeira), rankings de usuários GP e GN + lojas com primeiro/último acesso, score 0–100,
  filtros Usuário GP/GN. Representantes pelas **tabelas de dados** "Carteira C6 - Lojas" e
  "- Gerentes" (nome no lugar do login). 237 provas. Falta **mandar o link ao C6**.
  Números em `projetos/c6/indicadores.md`; regras no README da pasta.
- **c6 (relatório de base)** — 🔥 **Parado há 18 dias no mesmo ponto: falta um run que termine.**
  Lote 2 pronto e provado. Execução 48693 cancelada após 1h05 — 915 das 1.231 chamadas
  eram do Raio-X, oculto. Workflow `QImk2D4HdzIqHZe9`.
- **Estudo de Vendas IGA** — 🔥 HTML estático (sem n8n), pasta `automations/estudo-vendas-iga/`,
  frente `itau`. **Atualizado em 09/11 até out/26**: êxito 12 meses 46,7%, out/26 33% (menor desde
  dez/24), 53 de 148 recorrentes pararam. A última janela fixa (abr/26 → último mês) anda sozinha.
  Bug corrigido: fim da janela-base "dia 31" zerava as ofertas quando caía em junho.
  Números em `projetos/vendas-iga/indicadores.md`. ❓ Incluir quem parou há mais de 12 meses?
- **Análise de Base de Clientes, 6 canais** — 🔥 **v3 no n8n desde 16/10.** Wf
  `XkRFB5dYc1EFWZkN` (projeto **pessoal** do Thomas), pasta
  `automations/n8n-sdk/analise-base-geral/`. A v2 trouxe o Raio-X e o filtro de período. A v3
  trouxe a coorte por faixa, o top 100 e o filtro de comitente. Números e provas estão no
  README da pasta.
  ✅ **Ativo desde 20/10: diário às 8h** (fuso `America/Sao_Paulo`), e-mail para Thomas, Caio,
  Tuunelis, Everton e Guilherme. ✅ 1ª execução agendada OK em 21/10 (exec `64522`, 6min04s,
  148 chamadas, base total 22553, e-mail enviado sem erro).
- **bradesco** — _(estado a preencher)_

## ⚙️ Rodando em produção (sem demanda ativa minha)
- **Análise de Base de Clientes, C6 Lojista** (`f6Bw2iiuaWECy9Uz`) — diário 8h, e-mail (13) +
  WhatsApp (2). Código em `automations/n8n-sdk/analise-base-c6-lojista/` desde 04/11, conferido
  com `extrai_do_n8n.py --confere` (versão `df75b54b…`, coorte em faixas). Falhou 17–19/10
  (MCP, nada saiu) e 26–28/10 (WhatsApp, o e-mail saiu). O `2ECmLRceNEgCCYyb` é legado.
- **Carteira Comercial** (`ksZI8cqSbexqLOre`) — 6h da manhã, ~6s. Publica
  `carteira-comercial.json`. **Falha alto de propósito**: carteira ruim substitui a boa.
- **itau** — operação IGA, 8 workflows 🟩. Evento ~1x/semana, fecha 16h.
  Pendência antiga: readicionar `fernando.tuunelis` no e-mail quando o Gui aprovar.
- **lm** — Lista LM + Proposta LM 🟩. ❓ Sigla "LM" ainda não decifrada.

## 🧊 Frentes fora do radar
- **outros** — coringa, sem movimento

## 🔥 Decisões em aberto
- 🔴 **Tuunelis recebe o WhatsApp da Análise de Base C6 todo dia** — o comentário do nó diz que
  ele ficaria fora (o Caio aprovou semanal), mas a linha está ativa. Trocar o gatilho, tirar ele
  ou aceitar o diário? E: falha do WhatsApp deve marcar o run como erro se o e-mail saiu?
- 🔵 **Projeção 2027 — mesclas a validar com o Mattera:** "Multifrota - Netcarros" → "Outlet Netcarros"
  e os 5 "Dealers - Venda Direta - Ajuste <mês>" numa linha (aba De-para, oculta).
- 🔵 **Painel de Eventos Cars2You — escolhas minhas** (README, marcadas "(minha)"): novo = estreia
  em evento · acessou = abriu anúncio · agendado fora · evento > 31 dias fora do mensal · cortes de
  base pequena das metas (3 meses/30 veículos; 30 dias/100 veículos-dia). E: as fontes mais claras e
  a paleta sem rosa sobem para o `tema.css`?
- 🔵 **Fenauto: os internos saem também dos acessos e dos rankings?** Hoje saem só da contagem de novos, por escolha minha (12/11), e a pergunta ficou sem resposta. E o cartão de regiões do IGA segue contando pelo formulário: deve seguir a regra do grupo?
- 🔵 **Rotina Fenauto:** guarda as execuções (três HTML de ~200 KB por run)? Ganha alerta de falha?
  E, escolhas minhas no Mega Evento IGA: barra Total no laranja do IGA, botão de avisos junto do de tema.
- 🔵 **Estudo IGA: tirar o filtro `n12 > 0`?** Hoje a tabela e o gráfico de compradores só têm
  quem comprou nos últimos 12 meses; nos meses antigos o gráfico conta menos que o total do IGA.
- 🔵 **Representante com CNPJ repartido entre filiais:** fica o mais frequente, empate →
  Sem Representante. Regra minha (35 CNPJs na planilha, nenhum no painel hoje) — confirmar.
- 🔵 **Painel de Eventos C6 ganha cron?** Hoje manual, como o Radar.
- 🔵 **Painel C6 — duas escolhas minhas:** % conversão/VMV do pátio sobre os veículos do
  pátio; % VMV do veículo pela maior oferta. Confirmar.
- 🔴 **Tirar `ult_oferta`/`ult_acesso` de dentro da `q_lojas` (Radar)?** Como subconsulta
  custa ~30s por passada, como consulta direta ~19s. Proposta de 23/09, sem resposta.
- 🔴 **Link precisa virar sublinhado.** O acento do tema claro é cinza escuro, e link
  perdeu a cor que o distinguia do texto. Ninguém tem link em texto corrido hoje.
- 🔵 **Qual fonte?** A DM Sans é a mais parecida com a referência e **não tem algarismos
  tabulares** (medido). A Segoe UI Variable é macia e tabular, mas só existe no Windows 11.
- 🟡 **O cabeçalho do MODELO quebra a 375px** — dois `<select>` ocupam 304 dos 375 e o
  título sai uma palavra por linha. **O modelo viola a própria regra 5c**: mais de três
  controles pedem gaveta, que é o que o Radar faz. Mover ou aceitar?
- 🔵 **A logo azul entra em uso?** Hoje só branco e preto. Ela traz um TERCEIRO valor de
  azul (`#1D279A`) contra `#1523A0` da paleta e `#1E289B` dos PNG antigos.
- 🔴 **Para que serve o acesso à Dealers?** Sem objetivo declarado não abro pasta.
- 🔴 **`REPASSE`/`TRADICIONAL` deve virar coluna?** Hoje vive no texto livre e carrega o
  maior efeito de preço do estudo. Decisão de modelo de dados.
- 🔴 **O que são as 39 vendas do Agile (004362-1)?** `km NULL`, VMV igual ao preço, até
  R$ 503 mil para FIPE de R$ 28 mil. Não é ruído estatístico.
- 🔵 `schema.md` e `schema-gerado.md` se fundem? · 🔴 **`automations/bancos/` virou nome
  errado** · **As 4 lojas "internas" contam no ranking?** · **Modelo casa por id ou nome?**
- **Onde hospedar os relatórios** · **Skip/Adapta** (Caio, Gui, Daniel) ·
  **Versionar `automations/estado/*.json`?** · **Lance Fácil BTB merece pasta própria?** ·
  **Canal único de alerta de falha dos crons.**

## 📌 Cobranças minhas (preciso agir)
- [ ] Republicar o **catálogo** (artifact 6PcahstRhTsxXVfUm4eXXZ): o `relatorios.json` foi corrigido
      em 04/11 (C6 base diário, e-mail e WhatsApp) e a página só foi regerada no local
- [ ] 🔥 **Mandar a Projeção 2027 ao Tuunelis** (`automations/projecao-vendas-2027/projecao-vendas-2027.xlsx`)
      — o prazo era sexta 30/10; confirmar se já foi
- [ ] Projeção 2027: criar o **projeto no Claude** e compartilhar com Tuunelis e Mattera (pedido da reunião)
- [ ] Projeção 2027: quando chegarem os fechamentos de out–dez/26, rodar `monta_projecao.py` de novo
- [ ] 🔥 **Painel de Eventos Cars2You:** conferir a 1ª rodada agendada (07/11 9h) no SharePoint — o
      histórico do n8n só guarda erro — e mandar o link a quem vai usar
- [ ] 🔥 **Rotina Fenauto:** abrir os três arquivos em `Fenauto_202611/` no SharePoint e conferir a tela
      com as regras de 12/11 (novos e reativados, vendidos, um veículo só)
- [ ] Rotina Fenauto em dezembro: trocar `PASTA_RAIZ` no `_divide.js` se a Fenauto seguir. Fenauto 2027:
      trocar `INICIO_CAMPANHA` e os grupos no `montar-consultas.js` dos três painéis
- [ ] Estudo IGA: refazer a decomposição pedido × demanda (ficou com o número de 08/10) e mandar o
      HTML atualizado a quem usa
- [ ] 🔥 **Rodar o Radar pela interface** com a versão nova (22–23/10) e conferir
      `resumo.cortados_pelo_teto` = 0, `resumo.fora_do_piso` e o tamanho (~5,4 MB esperado)
- [ ] **Carteira Comercial (`ksZI8cqSbexqLOre`) aparece `active: false` no n8n** (22/10) — o brain
      diz que roda às 6h. Conferir pela interface; sem ela o Radar usa carteira velha
- [ ] Lista de compradores do **Premium BMW** incompleta em 5 de 8 veículos (30 lojas por carro no
      arquivo). Completar pelo banco com a VPN ligada
- [ ] 🔥 **Ligar o agendamento do Painel de Precificação** (com ok) e rodar para publicar a
      versão com o VMV provisório — o SharePoint ainda mostra a execução 61975
- [ ] Confirmar com quem cadastra que VMV = R$ 100.000 é provisório (maioria C6 Bank Lojista)
- [ ] 🔥 **Mandar o link do Painel C6 ao C6** — `Painel de Eventos C6/painel-eventos-c6.html`, site N8N
- [ ] **Arquivar pela interface** `6o9MSr1CriZ1VUBa` e `53RGtYzUzMoVtxpJ` (versões velhas do
      painel) — o modo automático barra o `archive_workflow`
- [ ] Linhas de teste do Caio nas duas tabelas da carteira C6 ("apagar antes de produção") —
      o painel já as ignora; apagar é com o Caio
- [ ] Atualizar o id do Painel C6 (`0Ndif0UK2UjTfaIN`) no `catalogo-relatorios/relatorios.json`
      (pasta de outra sessão, fora do git)
- [ ] Levar a regra 3b (funil) ao `kit-de-painel.md` do time
- [ ] **Conferir o Radar publicado (run 53433)** — o evento 23995 deve mostrar só 1 loja
- [ ] Ajustar a guarda "sem cron" do `build_wf.py` (confunde "cronológica" com cron)
- [ ] Ver se o **veículo duplicado** do run 53433 se repete (`q_veiculos` não mudou)
- [ ] 🔥 **Fazer o run do C6 terminar** — tirar as 8 queries `rx_*`, desligar
      `onError: continueRegularOutput` no nó MCP, rodar, montar o HTML
- [ ] 🔥 **Apagar no SharePoint** as 2 pastas antigas, o arquivo de 18/09 e o
      `radar-de-estoque-2026-09-21.html`, órfão desde que o nome perdeu a data
- [ ] **Levar as 39 lojas sem responsável ao comercial**
- [ ] **Distribuir o `design/kit-de-painel.md` ao time** — 68 KB, autossuficiente. Antes, regerar
      (`design/monta-kit.js`): ele ainda diz que o claro é o padrão
- [ ] Conferir a transcrição do `tratar-carteira.js` contra o workflow Carteira
      Comercial — só os 4 nós do Radar têm essa prova
- [ ] Destino do `WorkBrain.zip` (raiz, de 21/10) e do `context/banco-de-dados/dicionario_bradesco.zip`, soltos fora do git. Os `fenauto_*.html` dos três
      painéis (cópias do `saida-local`, nome real de loja) entraram no `.gitignore` em 09/11
- [ ] Revisar e enviar o `email-precificacao.md` — destinatários em aberto
- [ ] Levar o **VMV-sentinela da Dealers** (`999000` em 98,1%) a quem cuida daquela operação
- [ ] **Estudo de precificação:** multivariado só com o que se sabe antes da venda · `laudo`
      na sonda 10 (rendeu 11,3% na Dealers) · alinhar os analisadores (`grupo` × `codigo_fipe`)
      · levar `REPASSE`/`TRADICIONAL` a quem decide o modelo · `motor nao funciona` numa
      amostra nova (t = 4,1 < 4,8 de Bonferroni) · por que `ipva pago` tem +2,5 p.p. · a
      assinatura do Agile no resto da base
- [ ] Tabela de ativação por safra do C6 · 4 rankings por whitelabel sem solução
- [ ] Decodificar `situation`/`status` de `advertisements`, `offers`, `vehicles`, `shop_stocks`
- [ ] Higiene n8n: arquivar `a6fNNTUYYayehNIn` + os 3 TEMP do C6 + o "Testes"
- [ ] Validar `automations/crons.md` contra o n8n ao vivo
- [ ] Descrever o estado de `bradesco` · esclarecer a sigla **LM** · confirmar os cargos
      em `context/stakeholders.md` · preencher `01-contexto.md` de `itau` e `lm`

## ⏳ Esperando outros
- **Tuunelis** — premissas da projeção 2027 por comitente (ele preenche) · **Mattera** — fechamentos de out–dez/26
- **Thomas** — objetivo do acesso à Dealers? · REPASSE/TRADICIONAL vira coluna? · o que
  são as vendas do Agile? · as 4 lojas do ranking são contas internas? · qual fonte? ·
  a logo azul entra em uso? · o cabeçalho do modelo vai pra gaveta?
- **Gui** — aprovação pra readicionar `fernando.tuunelis` no e-mail do IGA
- **Caio / Gui / Daniel** — avaliação do Skip/Adapta
- **Doni** — alinhamento do formato do Pulso de Eventos

## ⚠️ Alertas críticos
- 🛑 **Nada vai ao n8n sem a aprovação final do Thomas** (28/09) — criar, atualizar ou rodar.
  Preparar local, mostrar a tela, perguntar.
- 🌙 **Painel novo abre no tema ESCURO** (Thomas, 26/10) — `data-tema="escuro"` no gerador.
  Os publicados não mudam sem pedido. Regra 7 de `design/regras-de-layout.md`.
- 🔁 **Nó de tabela de dados (e todo nó de leitura) roda uma vez POR ITEM de entrada.** Em
  série depois da carteira (30.719 itens), o Ler Nomes derrubou o run 55187 por memória.
  `executeOnce: true`. Configuração de nó muda pela `update_workflow`, sem tocar no código.
- ↩️ **`core.autocrlf=true`: o checkout grava CRLF.** Script que compara texto exato (injetor,
  provas) tem que normalizar — a prova do tema caiu só por fim de linha em 28/09. E
  `open(..., "w")` do Python no Windows grava CRLF: usar `newline=chr(10)`.
- 🖥️ **O navegador interno não abre HTML local acima de ~600 KB** — usar o servidor
  `previa-radar` (`.claude/launch.json`, porta 8777), que serve qualquer arquivo do repo.
- 🕐 **`access_logs.created_at` também é hora de Brasília** (medido 28/09). E cruzar cada
  acesso com cada evento por faixa de data passou de 5 min — cortar por `event_id`.
- 📦 **O teto de 50 linhas do MCP tem saída:** `COUNT(*)` + `JSON_ARRAYAGG` numa linha só
  (130 KB provados no run 53605). Antes de montar fase 1/fase 2 paginada, medir se cabe assim.
- 🧪 **"Afirmar antes de medir" é O erro recorrente da semana — três vezes em 22/09, mais
  duas em 23/09.** A fusão `q_moda` foi ao ar sem medir e derrubou o run 53385; estimei
  10 a 13 min para o MCP Fase 2 e foram mais de 15. **Com VPN, medir no banco direto antes.**
- 🧬 **Fundir consultas no MCP pode dobrar o custo em vez de cortar.** Duas agregações
  independentes numa query só não compartilham a varredura. E subconsulta correlacionada
  por loja é mais cara que consulta direta. Cada página `OFFSET` refaz tudo.
- 🔌 **O conector de banco `e34110a1…` NÃO é o cars2you** (tem `removals`, `dispatch`). Para
  o cars2you, usar `automations/bancos/consulta.py`.
- 🔒 **Dado pessoal no histórico do git** (contato de loja, commits antigos do Radar).
- 🚦 **Disparar o Radar pelo MCP é barrado pelo modo automático** (publica no SharePoint).
  Quem dispara é o Thomas, pela interface.
- 🔑 **`git push` liberado em `.claude/settings.local.json`** (`Bash(git push:*)`).
  O arquivo é **ignorado pelo git**, então noutra máquina ele não existe e o push
  volta a pedir prompt. O conteúdo está em `memory/sessions/2026-09-22.md`.
- 📤 **Nó Code grande sobe colado pelo Thomas, não pela API** (87 KB já falhou). Caminho
  provado em 04/11 no C6: ele cola, eu confiro com o script de conferência da pasta.
  **Ou, provado em 06/11 (Painel de Eventos Cars2You, 164 KB):** partir o nó em pedaços ≤ 56 KB
  (`_divide.js`, prova de HTML idêntico), criar o esqueleto e mandar cada pedaço num
  `update_workflow` por subagente, depois md5 dos nós (`_confere_n8n.py`). Mudou nó? `publish_workflow`.
  **Feche a aba do workflow no editor antes**: em 12/11 um salvamento pelo editor desfez 7 nós enviados.
  Cada nó grande custa de 100 a 150 mil tokens; em 12/11 o limite de gasto da organização foi atingido no meio do envio.
- 🧮 **O MCP do banco recusa `GROUP BY … WITH ROLLUP`** ("syntax error near 'with'", run 68394):
  um `GROUP BY` por subtotal, unidos por `UNION ALL` (`automations/bancos/README.md`).
  **Não consigo empurrar o `montar-html.js` pelo MCP.** São 236 KB num único
  parâmetro, `setNodeParameter` é tudo-ou-nada, e um envio truncado gravaria um nó
  quebrado por cima do que funciona. O caminho é o Thomas colar e eu conferir.
- 🎨 **`.topo-acoes` do `tema.css` tem `justify-self:end`:** fora da grade do topo, a linha encolhe e
  centraliza. Botão que sair do cabeçalho precisa de `justify-self:stretch` (achado em 05/11).
- 🎨 **A PONTE do Radar vem DEPOIS do TEMA e ganha no empate de especificidade.** Apagar
  uma regra só no `tema.css` pode não chegar no relatório — e não quebra nada, só não
  muda. Aconteceu com o fundo do `.topo`.
- 📚 **Antes de abrir o banco, leia `context/banco-de-dados/README.md`**; número medido tem
  fonte única em `projetos/<projeto>/indicadores.md`. **Guarda do `/salve`:** nada acima de
  1 MB no stage, e conferir o que está sendo APAGADO.
- 🔑 **A credencial da Dealers está em `~/.dealers-dlc.env`, FORA do repo.** Não mover.
- 🚫 **VMV e valor da venda nunca entram no modelo preditivo** — ele existe para ser confrontado
  com eles. Workflow n8n novo nasce em UTC: **acertar o fuso** antes de ligar gatilho de horário.
- 📄 **`node --check` não valida JS de navegador**, e o smoke pode validar o HTML ANTIGO.
- 🕐 **O banco responde em UTC; as datas dos eventos estão em hora de Brasília.** E
  `Date.parse` de texto sem fuso lê como hora local — uma carteira de 12 dias virou 11.
- 📋 **A lista de nós a transcrever sai do `git diff`, NUNCA da memória** — e confira com
  `_confere_transcricao.py` ANTES de rodar.
- 🔒 **Microsoft 365 conecta mas cai em Conditional Access** (`AADSTS53003`).
- 🚨 **A entrega do C6 não saiu, e já são 17 dias.** É avaliação de skill (ata 2026-09-02).
- 🐛 **Bug no relatório de PRODUÇÃO do C6:** 12 barras com `width:30,4%` — vírgula
  decimal é CSS inválido, as barras estão zeradas hoje.
- **Não rodar/ativar `ZIwusfx9IK1Owpg1`** (6 destinatários reais + cron 08h) nem
  `GgjVZlU04wvJzLbK` (`MODO='producao'`, gatilho 08h).

## 📅 Compromissos próximos
- _(nenhum com data marcada — o run do C6 está vencido desde 05/09)_
