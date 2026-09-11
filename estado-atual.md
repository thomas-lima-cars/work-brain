# 📍 Estado Atual — Work Brain do Thomas

> Painel vivo. Mantido pelo `/salve` no fim de cada sessão. Lido pelo `/cerebro` no boot.
> **Última atualização:** 2026-09-11 (manhã) — relatório de aderência recortado em 6 canais, com a marca aplicada

## 🔹 Frentes quentes agora
- **cars2you** — 🔥 **Relatório de aderência entregue e em evolução.** `rel-veiculos`
  (`8fiTFsjWG9RQinz8`): para cada veículo em evento, ranqueia as lojas por chance de
  compra. Base = uma linha por veículo, com o status da última negociação. Corte de 50%.
  **A base é só seis canais** (4, 7, 43, 48, 62, 65 — ids confirmados pelo Thomas), a UF
  do veículo sai do **pátio**, e cada carro leva o **link do anúncio**. Tela com a marca
  (#1523A0 + logo), filtros valendo na página inteira e glossário próprio.
  Último run fechado: **50270** — 1.200 veículos, 740 lojas, 44.095 correspondências.
  Run **50327** disparado 12:52 UTC com o acabamento de texto; conferir o resultado.
  Ver `automations/n8n-sdk/rel-veiculos/README.md`.
  Pendente antigo: Pulso de Eventos (`20LeyMLjrAKeKVeS`) — alinhar com Doni.
- **c6** — 🔥 **Parado há 7 dias no mesmo ponto: falta um run que termine.**
  Lote 2 pronto e provado. Gerador novo em `automations/n8n-sdk/gerador/`, 21 de 24
  medidas reagem ao filtro de whitelabel. ⚠️ Execução 48693 cancelada após 1h05 — 915 das
  1.231 chamadas eram do Raio-X, que está oculto na tela.
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
- **O corte de 50% deve baixar?** — 133 veículos do último run tinham loja elegível e
  nenhuma alcançou o piso. São só esses que mudam se o limiar cair; os outros sem par
  não têm loja no canal ou na UF.
- **Distribuição do relatório** — o HTML foi a ~4 MB. Anexo diário desse tamanho é
  arriscado; SharePoint + link é o que o IGA já faz.
- **As 4 lojas "internas" contam no ranking?** — Porto Seguro, Itaú Unibanco e duas
  "Teste Cars2You". Decisão do Thomas.
- **Modelo casa por id ou por nome?** — `models` tem nomes duplicados em duas faixas de
  id. Hoje é por id; impacto medido em **1 par em 33.718**.
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
- [ ] Tabela de ativação por safra (adiada a pedido do Thomas)
- [ ] 4 rankings por whitelabel sem solução — estouram o deadline mesmo no padrão PC
- [ ] Varrer o catálogo `models` atrás de mais nomes duplicados
- [ ] Medir se outras colunas de data seguem a convenção de hora local
- [ ] Decodificar `situation`/`status` de `advertisements`, `offers`, `vehicles`, `shop_stocks`
- [ ] Cosmético: `Injetar Filtros` sobreposto ao nó de e-mail no canvas
- [ ] Pedir ao Gui/Everton o diretório completo da skill
- [ ] 🚨 Achar a fonte de "aluguel" — metade da pergunta da ata, sem artefato
- [ ] Confirmar com o Everton o `versionId` limpo da cópia antes de qualquer pull
- [ ] Pulso de Eventos: encurtar mensagem + bolinha colorida — alinhar com Doni
- [ ] Higiene n8n: arquivar a sonda `a6fNNTUYYayehNIn` + os 3 TEMP do C6 + o "Testes"
- [ ] Validar `automations/crons.md` contra o n8n ao vivo
- [ ] Descrever o estado atual de `bradesco`
- [ ] Esclarecer a sigla **LM**
- [ ] Confirmar os cargos inferidos em `context/stakeholders.md`
- [ ] Preencher `01-contexto.md` de `itau` e `lm`

## ⏳ Esperando outros
- **Thomas** — as 4 lojas do ranking são contas internas? · o corte de 50% baixa? ·
  se o status de documentação existe, em que tabela?
- **Gui** — aprovação pra readicionar `fernando.tuunelis` no e-mail do IGA
- **Caio / Gui / Daniel** — avaliação do Skip/Adapta
- **Doni** — alinhamento do formato do Pulso de Eventos

## ⚠️ Alertas críticos
- 🚨 **A entrega do C6 não saiu, e já são 7 dias.** É avaliação de skill (ata 2026-09-02).
- 🕐 **O banco responde em UTC; as datas dos eventos estão em hora de Brasília.** Recorte
  de evento por data tem que ser calculado fora do SQL e ir como literal. Ver `dominios.md`.
- 🔤 **Barra invertida na transcrição: resolvido na raiz.** As 248 sequências de escape do
  `montar-html.js` foram dobradas em **duas** tentativas seguidas. A correção foi tirar o
  material (crase + caractere literal): de 320 barras para 4. E existe o
  `_confere_transcricao.py`, que compara o nó com o arquivo local **byte a byte antes de
  rodar** — foi ele que pegou as duas tentativas erradas.
- 📏 **Filtro novo numa consulta paginada exige filtrar também o gabarito que a
  dimensiona** — e vice-versa. Aconteceu duas vezes em 11/09: quatro consultas de perfil
  bateram no teto (1.300 = 26 × 50) e três lojas ficaram sem perfil. Não dá erro; dá base
  errada. As conferências de completude são o que torna isso audível.
- 🧩 **Tudo que a tela usa tem que morar DENTRO de `RENDER:INICIO`/`RENDER:FIM`** — fora
  dali quebra o `monta_html_de_dados.js`, que regenera a tela sem rodar o workflow.
- 🔗 **Cada nó Code reconstrói o próprio META.** Campo esquecido chega `undefined` em
  silêncio. Já aconteceu duas vezes.
- 🧪 **JS de navegador dentro de nó n8n não é validado por `node --check`.** Rodar o
  `_smoke_dom.js` antes de entregar — ele executa contra um DOM de mentira **e interage**.
- ⚠️ **`saida-teste-local.html` NÃO é compartilhável e NÃO serve para revisão de tela** —
  é dado 100% sintético com 6 veículos, e já foi confundido com o relatório duas vezes.
  Para revisar tela com dado real: `node monta_html_de_dados.js dados-<id>.json`.
- 🐛 **Bug no relatório de PRODUÇÃO do C6:** as 12 barras de recência saem com
  `width:30,4%`. Vírgula decimal é CSS inválido — as barras estão zeradas hoje.
- 🚨 **"Aluguel" não existe em nenhum artefato.** A ata pede "quantos já alugaram".
- **Não rodar/ativar a cópia `ZIwusfx9IK1Owpg1`** — 6 destinatários reais + cron 08h.
- Cópia `GgjVZlU04wvJzLbK` está com `MODO='producao'` e gatilho 08h. **Ativar sem trocar
  pra `'teste'` dispara e-mail pra lista completa.**

## 📅 Compromissos próximos
- _(nenhum com data marcada — o run do C6 está vencido desde 05/09)_
