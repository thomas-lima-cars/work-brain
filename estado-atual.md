# 📍 Estado Atual — Work Brain do Thomas

> Painel vivo. Mantido pelo `/salve` no fim de cada sessão. Lido pelo `/cerebro` no boot.
> **Última atualização:** 2026-09-22 (tarde) — links do C6, kit do time e a marca em vetor

## 🔹 Frentes quentes agora
- **Radar de Estoque** — 🔥 wf `8fiTFsjWG9RQinz8`, pasta `automations/n8n-sdk/rel-veiculos/`.
  ✅ **Carteira comercial ao vivo** desde 21/09: run **52933**, `ao_vivo:true`, 692/731
  lojas por CNPJ (**94,7%**), **39 sem responsável**.
  ✅ **Extrato enxuto** + dica de indicadores na linha do veículo + filtro por responsável.
  ✅ **Tema vidro**, ✅ **link do anúncio segue o canal** (C6 → `compraveiculos.`),
  ✅ **marca em SVG, duas larguras**. Tudo transcrito e conferido byte a byte.
  🔴 **Não roda desde antes do tema vidro** — o próximo run acumula TRÊS mudanças.
- **design system** — 🔥 `design/tokens/tema.css` é fonte única; dela saem os dois modelos
  **e** o `kit-de-painel.md`, o arquivo único que vai para o time (68 KB, autossuficiente).
  172 provas. ❓ **A fonte segue em aberto** — `dashboard-teste.html` é o laboratório.
- **bancos (cars2you + dealers)** — 🔥 acesso direto, só leitura. **Depende de VPN.**
  🔴 **O `schema.md` documenta 149 tabelas e o banco tem 193.** Faltam 44 desde 09/09.
  ❓ **O objetivo do acesso à Dealers segue sem ser declarado.**
- **cars2you** — 🔥 estudo de precificação entregue em quatro páginas.
  🔴 **O maior efeito de preço vive num campo de TEXTO:** `REPASSE` (35,7%) contra
  `TRADICIONAL` (28,7%) — 7,0 p.p., t = 40,7, maior que km, cluster ou comprador.
  Pendente antigo: Pulso de Eventos (`20LeyMLjrAKeKVeS`), alinhar com Doni.
- **c6** — 🔥 **Parado há 17 dias no mesmo ponto: falta um run que termine.**
  Lote 2 pronto e provado. Execução 48693 cancelada após 1h05 — 915 das 1.231 chamadas
  eram do Raio-X, oculto. Workflow `QImk2D4HdzIqHZe9`.
- **bradesco** — _(estado a preencher)_

## ⚙️ Rodando em produção (sem demanda ativa minha)
- **Carteira Comercial** (`ksZI8cqSbexqLOre`) — 6h da manhã, ~6s. Publica
  `carteira-comercial.json`. **Falha alto de propósito**: carteira ruim substitui a boa.
- **itau** — operação IGA, 8 workflows 🟩. Evento ~1x/semana, fecha 16h.
  Pendência antiga: readicionar `fernando.tuunelis` no e-mail quando o Gui aprovar.
- **lm** — Lista LM + Proposta LM 🟩. ❓ Sigla "LM" ainda não decifrada.

## 🧊 Frentes fora do radar
- **outros** — coringa, sem movimento

## 🔥 Decisões em aberto
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
- 🔵 **`TETO_LOJAS = 30` deve subir?** É ele quem corta hoje. Sem teto, 20 MB e o
  navegador trava — a pergunta é qual teto, não se existe.
- 🔵 `schema.md` e `schema-gerado.md` se fundem? · 🔴 **`automations/bancos/` virou nome
  errado** · **As 4 lojas "internas" contam no ranking?** · **Modelo casa por id ou nome?**
- **Onde hospedar os relatórios** · **Skip/Adapta** (Caio, Gui, Daniel) ·
  **Versionar `automations/estado/*.json`?** · **Lance Fácil BTB merece pasta própria?** ·
  **Canal único de alerta de falha dos crons.**

## 📌 Cobranças minhas (preciso agir)
- [ ] 🔥 **Rodar o Radar** — acumula tema vidro + links do C6 + logos novas. ~12 min,
      republica no SharePoint. No run, conferir o evento **Exclusivo C6 Auto** e o bloco
      de avisos (caso misto = decisão pendente)
- [ ] 🔥 **Fazer o run do C6 terminar** — tirar as 8 queries `rx_*`, desligar
      `onError: continueRegularOutput` no nó MCP, rodar, montar o HTML
- [ ] 🔥 **Apagar no SharePoint** as 2 pastas antigas, o arquivo de 18/09 e o
      `radar-de-estoque-2026-09-21.html`, órfão desde que o nome perdeu a data
- [ ] **Levar as 39 lojas sem responsável ao comercial**
- [ ] **Distribuir o `design/kit-de-painel.md` ao time** — 68 KB, autossuficiente
- [ ] Conferir a transcrição do `tratar-carteira.js` contra o workflow Carteira
      Comercial — só os 4 nós do Radar têm essa prova
- [ ] Revisar e enviar o `email-precificacao.md` — destinatários em aberto
- [ ] Levar o **VMV-sentinela da Dealers** (`999000` em 98,1%) a quem cuida daquela operação
- [ ] Preencher `context/banco-de-dados/projetos/c6/` e `.../radar-de-estoque/`
- [ ] Modelo multivariado: só com o que se sabe ANTES da venda (o comprador não vale)
- [ ] Incluir `laudo` na sonda 10 da Cars2You — rendeu 11,3% na Dealers
- [ ] Alinhar o controle dos dois analisadores do estudo (`grupo` × `codigo_fipe`)
- [ ] Levar o achado `REPASSE`/`TRADICIONAL` a quem decide o modelo de dados
- [ ] Confirmar `motor nao funciona` numa amostra nova — t = 4,1, abaixo do corte de
      Bonferroni (4,8) que 32 mil testes exigem
- [ ] Entender por que `ipva pago` aparece com **mais** deságio (+2,5 p.p.)
- [ ] Sonda da assinatura do Agile (`km NULL` + VMV = venda) no resto da base
- [ ] Tabela de ativação por safra do C6 · 4 rankings por whitelabel sem solução
- [ ] Decodificar `situation`/`status` de `advertisements`, `offers`, `vehicles`, `shop_stocks`
- [ ] Higiene n8n: arquivar `a6fNNTUYYayehNIn` + os 3 TEMP do C6 + o "Testes"
- [ ] Validar `automations/crons.md` contra o n8n ao vivo
- [ ] Descrever o estado de `bradesco` · esclarecer a sigla **LM** · confirmar os cargos
      em `context/stakeholders.md` · preencher `01-contexto.md` de `itau` e `lm`

## ⏳ Esperando outros
- **Thomas** — objetivo do acesso à Dealers? · REPASSE/TRADICIONAL vira coluna? · o que
  são as vendas do Agile? · as 4 lojas do ranking são contas internas? · qual fonte? ·
  a logo azul entra em uso? · o cabeçalho do modelo vai pra gaveta?
- **Gui** — aprovação pra readicionar `fernando.tuunelis` no e-mail do IGA
- **Caio / Gui / Daniel** — avaliação do Skip/Adapta
- **Doni** — alinhamento do formato do Pulso de Eventos

## ⚠️ Alertas críticos
- 🧪 **"Afirmar antes de medir" é O erro recorrente desta semana — TRÊS vezes em 22/09.**
  O `tnum` das fontes; uma comparação de logos olhando só o fim do base64; e, a pior,
  eu repeti quatro vezes que havia 5 commits presos nesta máquina quando
  `git log origin/main..HEAD` já voltava vazio. **Medir custa uma linha.**
- 🔑 **`git push` liberado em `.claude/settings.local.json`** (`Bash(git push:*)`).
  O arquivo é **ignorado pelo git**, então noutra máquina ele não existe e o push
  volta a pedir prompt. O conteúdo está em `memory/sessions/2026-09-22.md`.
- 📤 **Não consigo empurrar o `montar-html.js` pelo MCP.** São 236 KB num único
  parâmetro, `setNodeParameter` é tudo-ou-nada, e um envio truncado gravaria um nó
  quebrado por cima do que funciona. O caminho é o Thomas colar e eu conferir.
- 📏 **Caractere ≠ byte.** O `_confere_transcricao.py` conta CARACTERES (232.868); o
  Node conta BYTES UTF-8 (236.373). O mesmo arquivo, duas réguas.
- 🎨 **A PONTE do Radar vem DEPOIS do TEMA e ganha no empate de especificidade.** Apagar
  uma regra só no `tema.css` pode não chegar no relatório — e não quebra nada, só não
  muda. Aconteceu com o fundo do `.topo`.
- 🖼️ **SVG sem `viewBox` não escala** — a arte é CORTADA, não reduzida. Cinco dos seis
  arquivos da marca chegaram assim. Medir a caixa com `getBBox`, nunca estimar.
- 📐 **Medir contraste contra branco não descreve mais a tela.** O cartão tem degradê; o
  pior plano é o canto superior esquerdo (`#E3E8EC`). Texto direto no campo (`#D8E1E9`)
  só com `--texto-2` ou mais forte.
- 📚 **Antes de abrir o banco, leia `context/banco-de-dados/README.md`.** Número medido
  tem fonte única em `projetos/<projeto>/indicadores.md` — não recalcular.
- 🔒 **Guarda de tamanho no `/salve`:** arquivo acima de 1 MB no stage para o commit. E
  conferir o que está sendo APAGADO, não só o que entra.
- 🔑 **A credencial da Dealers está em `~/.dealers-dlc.env`, FORA do repo.** Não mover.
- 🧪 **Achado de uma base não é achado da outra.** `REPASSE` não existe na Dealers.
- 🔌 **O acesso direto ao banco depende de VPN.** Se as duas falham juntas, é rede.
- 📄 **`node --check` não valida JS de navegador, e o smoke pode validar o arquivo
  ANTIGO** se o gerador falhar e o HTML anterior continuar em disco.
- 🕐 **O banco responde em UTC; as datas dos eventos estão em hora de Brasília.** E
  `Date.parse` de texto sem fuso lê como hora local — uma carteira de 12 dias virou 11.
- 📋 **A lista de nós a transcrever sai do `git diff`, NUNCA da memória** — e confira com
  `_confere_transcricao.py` ANTES de rodar.
- 🔤 **`Get-Content` sem `-Encoding UTF8` lê UTF-8 como ANSI**, sem erro nenhum.
- 🔒 **Microsoft 365 conecta mas cai em Conditional Access** (`AADSTS53003`).
- 📏 **Duas sondas da mesma amostra precisam do MESMO `WHERE`** — cada uma acerta o
  próprio gabarito, com o seu número errado. Aconteceu em 15/09: 4.127 contra 4.582.
- 🔢 **`table_rows` do InnoDB é estimativa e erra.** Contar com `COUNT(*)`.
- 🚨 **A entrega do C6 não saiu, e já são 17 dias.** É avaliação de skill (ata 2026-09-02).
- 🐛 **Bug no relatório de PRODUÇÃO do C6:** 12 barras com `width:30,4%` — vírgula
  decimal é CSS inválido, as barras estão zeradas hoje.
- ⚠️ **`saida-teste-local.html` NÃO é compartilhável** — dado 100% sintético.
- ⚠️ **As páginas do estudo têm nome real de loja e dado comercial.** Repo privado.
- **Não rodar/ativar `ZIwusfx9IK1Owpg1`** (6 destinatários reais + cron 08h) nem
  `GgjVZlU04wvJzLbK` (`MODO='producao'`, gatilho 08h).

## 📅 Compromissos próximos
- _(nenhum com data marcada — o run do C6 está vencido desde 05/09)_
