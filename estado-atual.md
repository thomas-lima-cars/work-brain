# 📍 Estado Atual — Work Brain do Thomas

> Painel vivo. Mantido pelo `/salve` no fim de cada sessão. Lido pelo `/cerebro` no boot.
> **Última atualização:** 2026-09-18 (noite) — Radar de Estoque mudou de eixo: janela de 7 dias à frente

## 🔹 Frentes quentes agora
- **bancos (cars2you + dealers)** — 🔥 **Acesso direto ao banco das DUAS operações.**
  `automations/bancos/conexao.py`, multi-base, só leitura, guarda provada em 17 casos.
  Credenciais `bi_read_cars2you` e `bi_read_wl_dlc_prd`, fora do repo. **Depende de VPN**
  — em 18/09 as duas caíram juntas e voltaram juntas.
  🔴 **O `schema.md` documenta 149 tabelas e o banco tem 193.** Faltam 44 desde 09/09.
  Ver `context/banco-de-dados/tabelas-nao-documentadas.md`.
  ✅ Ressalva 2 fechada: as 79 colunas ocultas em 4 tabelas, lidas direto.
  ✅ Conferido: as duas bases são o MESMO esquema — 192 tabelas em comum, só
  `notifications` difere em coluna.
  📊 **Painel de precificação unificado**: `painel-precificacao.html`, 9.367 vendas
  (Cars2You 4.596 + Dealers 4.771), deságio 30,4%, duas telas, Bootstrap embutido.
  ❓ **O objetivo do acesso à Dealers segue sem ser declarado** — sem pasta em `subjects/`.
- **cars2you** — 🔥 **Estudo de precificação entregue em quatro páginas.**
  `automations/n8n-sdk/precificacao/`. Deságio = 1 − venda/FIPE, sobre as 4.582 vendas
  dos 20 modelos mais vendidos em 12 meses, sem motos e pesados.
  🔴 **O maior efeito de todos está num campo de texto:** `REPASSE` (35,7% de deságio)
  contra `TRADICIONAL` (28,7%) — 7,0 p.p., t = 40,7, maior que km, cluster ou comprador.
  É uma **coluna vivendo dentro do `TEXT` de `vehicles.description`**.
  Ranking das colunas: comprador 41,6% · km 18,1% · cluster 18,1% · versão 13,1%.
  Workflow das sondas: `a6fNNTUYYayehNIn` (leitura, inativo, sem e-mail).
  Ver `automations/n8n-sdk/precificacao/README.md`.
  Pendente antigo: Pulso de Eventos (`20LeyMLjrAKeKVeS`), alinhar com Doni.
- **Radar de Estoque** — 🔥 **Mudou de eixo em 18/09.** wf `8fiTFsjWG9RQinz8` (renomeado
  no n8n), pasta ainda `automations/n8n-sdk/rel-veiculos/`. A janela olha **para a
  frente** (eventos encerrando em 7 dias, piso à meia-noite e teto às 23:59:59) em vez
  de para trás — antes o assunto era a **sobra**, é outra pergunta. Correspondência
  mínima **desligada**: o piso agora é a barra do extrato, que nasce em 70%.
  Execução **52212** ✅ — 25 eventos, 1.096 veículos, 32.880 pares, 4,89 MB.
  🔴 **Publicou na pasta ERRADA**: o `Virar Arquivo` não foi transcrito. Ver "PENDENTE
  (segunda, 21/09)" no README do projeto.
- **c6** — 🔥 **Parado há 13 dias no mesmo ponto: falta um run que termine.**
  Lote 2 pronto e provado, gerador novo em `automations/n8n-sdk/gerador/`.
  ⚠️ Execução 48693 cancelada após 1h05 — 915 das 1.231 chamadas eram do Raio-X, oculto.
  Workflow `QImk2D4HdzIqHZe9` · sondas em `7TCmS8JFacDTmySQ`
- **bradesco** — _(estado a preencher)_

## ⚙️ Rodando em produção (sem demanda ativa minha)
- **itau** — operação **IGA**, 8 workflows 🟩 estáveis. Evento ~1x/semana, fecha 16h.
  Pendência antiga: readicionar `fernando.tuunelis` no e-mail quando o Gui aprovar.
- **lm** — Lista LM + Proposta LM 🟩. Feirões diários que reciclam estoque.
  ❓ Sigla "LM" ainda não decifrada.

## 🧊 Frentes fora do radar
- **outros** — coringa, sem movimento

## 🔥 Decisões em aberto
- 🔵 **`schema.md` e `schema-gerado.md` devem se fundir?** O gerado tem as 193
  tabelas; o escrito à mão tem as descrições em português e o agrupamento por
  domínio. Fundir exige preservar o que é humano.
- 🔴 **Para que serve o acesso à Dealers?** Sem objetivo declarado não abro pasta
  em `subjects/` e cada pedido vira avulso.
- 🔴 **`automations/bancos/` virou nome errado** — a pasta guarda o estudo das
  DUAS bases. Renomear para `automations/precificacao/`?
- 🔴 **`REPASSE`/`TRADICIONAL` deve virar coluna?** Hoje vive no texto livre e carrega
  o maior efeito de preço do estudo. Decisão de modelo de dados, não minha.
- 🔴 **O que são as 39 vendas do Agile (004362-1)?** `km NULL`, `ano_modelo 2010`, VMV
  igual ao preço de venda, até R$ 503 mil para FIPE de R$ 28 mil, em poucos compradores.
  Lote? Teste? Lançamento manual? Não é ruído estatístico.
- 🔵 **`TETO_LOJAS = 30` deve subir?** Agora é ele quem corta: **986.559 pares** fora dele
  na 52212, contra zero pelo mínimo. Sem teto, 20 MB e o navegador trava — a pergunta é
  qual teto, não se existe.
- **Distribuição dos relatórios** — o HTML do Radar de Estoque foi a **4,89 MB** (52212); o analítico da
  precificação, a 1,7 MB. Anexo diário desse tamanho é arriscado; SharePoint + link é o
  que o IGA já faz.
- **As 4 lojas "internas" contam no ranking?** Porto Seguro, Itaú Unibanco e duas "Teste".
- **Modelo casa por id ou por nome?** — agora com dado novo: `models` tem **≥50 nomes**
  repartidos em ids diferentes, não os 3 conhecidos. O estudo agrupou por nome.
- **Onde hospedar os relatórios** — hoje na cloud/máquina do Caio.
- **Skip / Adapta** — Caio, Gui e Daniel avaliam. Thomas não é decisor.
- **Versionar `automations/estado/*.json`?**
- **Lance Fácil BTB merece pasta própria?**
- **Canal único de alerta de falha dos crons.**

## 📌 Cobranças minhas (preciso agir)
- [ ] 🔥 **Fazer o run do C6 terminar** — (1) tirar as 8 queries `rx_*`; (2) desligar
      `onError: continueRegularOutput` no nó MCP; (3) rodar `QImk2D4HdzIqHZe9`;
      (4) montar com `node monta_html_de_dados.js`.
- [ ] 🔥 **Radar de Estoque, segunda 21/09:** transcrever o `Virar Arquivo`, rodar de
      novo (aí a pasta `Radar de Estoque` nasce) e apagar as 2 pastas antigas + o
      arquivo de 18/09 que caiu na pasta #2
- [ ] Revisar e enviar o `email-precificacao.md` — destinatários em aberto
- [ ] Levar o **VMV-sentinela da Dealers** (`999000` em 98,1%) a quem cuida daquela operação
- [ ] Preencher `context/banco-de-dados/projetos/c6/` e `.../radar-de-estoque/` — medindo, não copiando
- [ ] Modelo multivariado: só com o que se sabe ANTES da venda (o comprador não vale)
- [ ] Incluir `laudo` na sonda 10 da Cars2You — rendeu 11,3% na Dealers e aqui não é extraída
- [ ] Alinhar o controle dos dois analisadores do estudo (`no-analisar.js` usa `grupo`,
      `analisa-drivers.js` usa `codigo_fipe`) — ou marcar em cada um qual é o seu
- [ ] Levar o achado `REPASSE`/`TRADICIONAL` a quem decide o modelo de dados
- [ ] Confirmar `motor nao funciona` numa amostra nova — t = 4,1, abaixo do corte de
      Bonferroni (4,8) que 32 mil testes exigem
- [ ] Entender por que `ipva pago` aparece com **mais** deságio (+2,5 p.p.)
- [ ] Modelo multivariado da precificação — km, idade e versão andam juntas
- [ ] Sonda da assinatura do Agile (`km NULL` + VMV = venda) no resto da base
- [ ] Tabela de ativação por safra do C6 (adiada a pedido do Thomas)
- [ ] 4 rankings por whitelabel do C6 sem solução
- [ ] Decodificar `situation`/`status` de `advertisements`, `offers`, `vehicles`, `shop_stocks`
- [ ] Higiene n8n: arquivar `a6fNNTUYYayehNIn` + os 3 TEMP do C6 + o "Testes"
- [ ] Validar `automations/crons.md` contra o n8n ao vivo
- [ ] Descrever o estado atual de `bradesco`
- [ ] Esclarecer a sigla **LM**
- [ ] Confirmar os cargos inferidos em `context/stakeholders.md`
- [ ] Preencher `01-contexto.md` de `itau` e `lm`

## ⏳ Esperando outros
- **Thomas** — objetivo do acesso à Dealers? · REPASSE/TRADICIONAL vira coluna? · o que são as vendas do Agile? ·
  as 4 lojas do ranking são contas internas?
- **Gui** — aprovação pra readicionar `fernando.tuunelis` no e-mail do IGA
- **Caio / Gui / Daniel** — avaliação do Skip/Adapta
- **Doni** — alinhamento do formato do Pulso de Eventos

## ⚠️ Alertas críticos
- 📚 **Antes de abrir o banco, leia `context/banco-de-dados/README.md`.** Ele é
  índice por pergunta, e a resposta já pode estar escrita. Número medido tem
  fonte única em `projetos/<projeto>/indicadores.md` — não recalcular.
- 🔒 **Guarda de tamanho no `/salve`:** arquivo acima de 1 MB no stage para o
  commit. E conferir o que está sendo APAGADO, não só o que entra — em 18/09
  uma regra de `.gitignore` sem caminho ia apagar 3 arquivos já commitados.
- 🔑 **A credencial da Dealers está em `~/.dealers-dlc.env`, FORA do repo.** Três
  barreiras: `.gitignore`, recusa do `conexao.py` a ler credencial de dentro do repo,
  e mascaramento da senha em mensagem de erro. Não mover para dentro.
- 🧪 **Achado de uma base não é achado da outra.** O estudo roda igual nas duas, mas
  `REPASSE` não existe na Dealers. O método viaja; a conclusão, não.
- 🔌 **O acesso direto ao banco depende de VPN.** Em 18/09 as duas caíram ao mesmo
  tempo. Se as duas falham juntas, é rede — não perca tempo no host.
- 📄 **`node --check` não valida JS de navegador, e o smoke pode validar o arquivo
  ANTIGO** se o gerador falhar e o HTML anterior continuar em disco. Conferir a
  saída do gerador antes de confiar no teste.
- 📐 **Os dois analisadores do estudo controlam por campos diferentes** — `grupo` no
  nó do n8n, `codigo_fipe` no script local. Comparar resultado de um com número
  publicado do outro faz a diferença de controle parecer achado.
- 🔢 **`table_rows` do InnoDB é estimativa e erra.** Contar com `COUNT(*)` antes de
  afirmar que uma tabela está vazia — errou em 2 de 44 em 17/09.
- 🚨 **A entrega do C6 não saiu, e já são 13 dias.** É avaliação de skill (ata 2026-09-02).
- 🕐 **O banco responde em UTC; as datas dos eventos estão em hora de Brasília.** Recorte
  de evento por data tem que ser calculado fora do SQL e ir como literal.
- 📋 **A lista de nós a transcrever para o n8n sai do `git diff`, NUNCA da memória** — e
  confira com `_confere_transcricao.py` ANTES de rodar (compara os 4 nós byte a byte).
  Em 18/09 afirmei que o `Virar Arquivo` não mudara; mudara, e publicou na pasta antiga.
- 🔤 **`Get-Content` sem `-Encoding UTF8` lê UTF-8 como ANSI:** "veículos" vira
  "veÃ­culos", sem erro nenhum, e o glossário sai corrompido. Medido em 18/09.
- 🔒 **Microsoft 365 conecta mas cai em Conditional Access** (`AADSTS53003`) — admin do
  tenant acha pelo trace. SharePoint, por ora, só pela interface ou pelo n8n.
- 📏 **Duas sondas que alimentam páginas da mesma amostra precisam do MESMO `WHERE`.**
  Cada uma tem o próprio gabarito, e os dois batem — cada um com o seu número errado.
  Aconteceu em 15/09: 4.127 contra 4.582.
- 📏 **Filtro novo numa consulta paginada exige filtrar também o gabarito que a
  dimensiona** — e vice-versa. Não dá erro; dá base errada.
- 🔤 **`MAX(campo_texto)` para resumir categoria por grupo está errado** — MAX em texto
  pega o alfabeticamente último, e uma linha sem categoria rotula o grupo inteiro.
- 🧩 **Alias repetido no `FROM`** é erro de SQL que nenhuma prova de JS pega. Há guarda
  em `monta-sonda-10.js`.
- 🕐 **A amostra de vendas se move durante o dia** — o status vira "vendido" horas depois
  do fim das ofertas. Todo número é o retrato de uma execução, com data e hora.
- 🧪 **JS de navegador não é validado por `node --check`.** Rodar o smoke test com DOM de
  mentira antes de entregar (`_smoke_dom.js`, `_smoke_analitico.js`).
- ⚠️ **`saida-teste-local.html` NÃO é compartilhável** — dado 100% sintético, já foi
  confundido com o relatório duas vezes.
- 🐛 **Bug no relatório de PRODUÇÃO do C6:** as 12 barras de recência saem com
  `width:30,4%`. Vírgula decimal é CSS inválido — as barras estão zeradas hoje.
- **Não rodar/ativar a cópia `ZIwusfx9IK1Owpg1`** — 6 destinatários reais + cron 08h.
- Cópia `GgjVZlU04wvJzLbK` está com `MODO='producao'` e gatilho 08h. **Ativar sem trocar
  pra `'teste'` dispara e-mail pra lista completa.**
- ⚠️ **As páginas do estudo têm nome real de loja e dado comercial.** Repo privado.

## 📅 Compromissos próximos
- _(nenhum com data marcada — o run do C6 está vencido desde 05/09)_
