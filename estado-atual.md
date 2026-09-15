# 📍 Estado Atual — Work Brain do Thomas

> Painel vivo. Mantido pelo `/salve` no fim de cada sessão. Lido pelo `/cerebro` no boot.
> **Última atualização:** 2026-09-15 (tarde) — estudo de precificação por modelo, e o achado do texto

## 🔹 Frentes quentes agora
- **cars2you** — 🔥 **Estudo de precificação entregue em quatro páginas.**
  `automations/n8n-sdk/precificacao/`. Deságio = 1 − venda/FIPE, sobre as 4.582 vendas
  dos 20 modelos mais vendidos em 12 meses, sem motos e pesados.
  🔴 **O maior efeito de todos está num campo de texto:** `REPASSE` (35,7% de deságio)
  contra `TRADICIONAL` (28,7%) — 7,0 p.p., t = 40,7, maior que km, cluster ou comprador.
  É uma **coluna vivendo dentro do `TEXT` de `vehicles.description`**.
  Ranking das colunas: comprador 41,6% · km 18,1% · cluster 18,1% · versão 13,1%.
  Workflow das sondas: `a6fNNTUYYayehNIn` (leitura, inativo, sem e-mail).
  Ver `automations/n8n-sdk/precificacao/README.md`.
  Pendente antigo: **`rel-veiculos`** (`8fiTFsjWG9RQinz8`) — conferir o run **50327**;
  e o Pulso de Eventos (`20LeyMLjrAKeKVeS`), alinhar com Doni.
- **c6** — 🔥 **Parado há 11 dias no mesmo ponto: falta um run que termine.**
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
- 🔴 **`REPASSE`/`TRADICIONAL` deve virar coluna?** Hoje vive no texto livre e carrega
  o maior efeito de preço do estudo. Decisão de modelo de dados, não minha.
- 🔴 **O que são as 39 vendas do Agile (004362-1)?** `km NULL`, `ano_modelo 2010`, VMV
  igual ao preço de venda, até R$ 503 mil para FIPE de R$ 28 mil, em poucos compradores.
  Lote? Teste? Lançamento manual? Não é ruído estatístico.
- **O corte de 50% do `rel-veiculos` deve baixar?** 133 veículos mudam.
- **Distribuição dos relatórios** — o HTML do `rel-veiculos` foi a ~4 MB; o analítico da
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
- [ ] Conferir o run **50327** do `rel-veiculos`
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
- **Thomas** — REPASSE/TRADICIONAL vira coluna? · o que são as vendas do Agile? ·
  as 4 lojas do ranking são contas internas? · o corte de 50% baixa?
- **Gui** — aprovação pra readicionar `fernando.tuunelis` no e-mail do IGA
- **Caio / Gui / Daniel** — avaliação do Skip/Adapta
- **Doni** — alinhamento do formato do Pulso de Eventos

## ⚠️ Alertas críticos
- 🚨 **A entrega do C6 não saiu, e já são 11 dias.** É avaliação de skill (ata 2026-09-02).
- 🕐 **O banco responde em UTC; as datas dos eventos estão em hora de Brasília.** Recorte
  de evento por data tem que ser calculado fora do SQL e ir como literal.
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
