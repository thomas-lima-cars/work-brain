# 📍 Estado Atual — Work Brain do Thomas

> Painel vivo. Mantido pelo `/salve` no fim de cada sessão. Lido pelo `/cerebro` no boot.
> **Última atualização:** 2026-09-22 (madrugada) — tema claro virou vidro e foi pro Radar

> ⚠️ **5 commits locais NÃO enviados** desde 2026-09-18 (`14daf5b`, `a8cef9b`,
> `455fe0b`, `fac91d7` + este). O `git push` foi barrado **pelo classificador de
> permissões desta sessão**, não pela rede nem pelo git — é o mesmo bloqueio de
> 18/09, agora na quarta sessão seguida.
> **Rodar `git push` à mão** e tirar esta linha. Enquanto isso, o trabalho de
> quatro sessões existe só nesta máquina.

## 🔹 Frentes quentes agora
- **Radar de Estoque** — 🔥 wf `8fiTFsjWG9RQinz8`, pasta `automations/n8n-sdk/rel-veiculos/`.
  ✅ **Carteira comercial ao vivo** desde 21/09: o `Baixar Carteira` lê o JSON que o
  workflow irmão publica às 6h. Run **52933**: `ao_vivo:true`, 692/731 lojas casadas por
  CNPJ (**94,7%**), **39 sem responsável** (eram 44 com o literal).
  ✅ **Filtro por responsável** na tela — age só sobre as lojas, não sobre os veículos.
  ✅ **Extrato enxuto**: sobraram contato e categoria do cliente; a tabela de indicadores
  virou dica na linha do veículo, com o valor do carro ao lado da média da loja.
  ✅ **Tema vidro** aplicado (22/09), transcrito e conferido byte a byte às 01:28.
  🔴 **Não rodou depois do tema novo.** O próximo run republica o HTML no SharePoint.
- **bancos (cars2you + dealers)** — 🔥 acesso direto às duas operações,
  `automations/bancos/conexao.py`, multi-base, só leitura. **Depende de VPN.**
  🔴 **O `schema.md` documenta 149 tabelas e o banco tem 193.** Faltam 44 desde 09/09.
  📊 Painel de precificação unificado: 9.367 vendas, deságio 30,4%.
  ❓ **O objetivo do acesso à Dealers segue sem ser declarado.**
- **cars2you** — 🔥 estudo de precificação entregue em quatro páginas.
  🔴 **O maior efeito de preço vive num campo de TEXTO:** `REPASSE` (35,7%) contra
  `TRADICIONAL` (28,7%) — 7,0 p.p., t = 40,7, maior que km, cluster ou comprador.
  Ranking: comprador 41,6% · km 18,1% · cluster 18,1% · versão 13,1%.
  Pendente antigo: Pulso de Eventos (`20LeyMLjrAKeKVeS`), alinhar com Doni.
- **c6** — 🔥 **Parado há 17 dias no mesmo ponto: falta um run que termine.**
  Lote 2 pronto e provado. Execução 48693 cancelada após 1h05 — 915 das 1.231 chamadas
  eram do Raio-X, oculto. Workflow `QImk2D4HdzIqHZe9`.
- **design system** — 🔥 **O tema claro virou vidro em 22/09** e o escuro continua igual.
  `design/tokens/tema.css` é fonte única; os dois modelos e o Radar saem dele.
  ❓ **A fonte ainda está em aberto** — `design/modelos/dashboard-teste.html` é o
  laboratório, com seis candidatas e o defeito de cada uma medido na etiqueta.
- **bradesco** — _(estado a preencher)_

## ⚙️ Rodando em produção (sem demanda ativa minha)
- **Carteira Comercial** (`ksZI8cqSbexqLOre`) — 6h da manhã, ~6s. Lê a planilha da área
  comercial no SharePoint e publica `Radar de Estoque/_dados/carteira-comercial.json`.
  **Falha alto de propósito**: publicar carteira ruim substitui a boa.
- **itau** — operação IGA, 8 workflows 🟩. Evento ~1x/semana, fecha 16h.
  Pendência antiga: readicionar `fernando.tuunelis` no e-mail quando o Gui aprovar.
- **lm** — Lista LM + Proposta LM 🟩. ❓ Sigla "LM" ainda não decifrada.

## 🧊 Frentes fora do radar
- **outros** — coringa, sem movimento

## 🔥 Decisões em aberto
- 🔴 **Link precisa virar sublinhado.** O acento do tema claro virou cinza escuro, e link
  perdeu a cor que o distinguia do texto. Ninguém tem link em texto corrido hoje.
- 🔵 **Qual fonte?** A DM Sans é a mais parecida com a referência e **não tem algarismos
  tabulares** (medido). A Segoe UI Variable é macia, tabular e de graça, mas só existe no
  Windows 11. Terceira via: baixar Manrope/Figtree/Plus Jakarta e medir.
- 🔴 **Para que serve o acesso à Dealers?** Sem objetivo declarado não abro pasta em
  `subjects/` e cada pedido vira avulso.
- 🔴 **`REPASSE`/`TRADICIONAL` deve virar coluna?** Hoje vive no texto livre e carrega o
  maior efeito de preço do estudo. Decisão de modelo de dados.
- 🔴 **O que são as 39 vendas do Agile (004362-1)?** `km NULL`, VMV igual ao preço, até
  R$ 503 mil para FIPE de R$ 28 mil. Não é ruído estatístico.
- 🔵 **`TETO_LOJAS = 30` deve subir?** É ele quem corta hoje. Sem teto, 20 MB e o
  navegador trava — a pergunta é qual teto, não se existe.
- 🔵 **`schema.md` e `schema-gerado.md` devem se fundir?**
- 🔴 **`automations/bancos/` virou nome errado** — guarda o estudo das duas bases.
- **Distribuição dos relatórios** — o HTML do Radar passa de 4 MB. SharePoint + link é o
  que o IGA já faz.
- **As 4 lojas "internas" contam no ranking?** Porto Seguro, Itaú Unibanco e duas "Teste".
- **Modelo casa por id ou por nome?** `models` tem ≥50 nomes repartidos em ids diferentes.
- **Onde hospedar os relatórios** · **Skip/Adapta** (Caio, Gui, Daniel) ·
  **Versionar `automations/estado/*.json`?** · **Lance Fácil BTB merece pasta própria?** ·
  **Canal único de alerta de falha dos crons.**

## 📌 Cobranças minhas (preciso agir)
- [ ] 🔥 **Fazer o run do C6 terminar** — tirar as 8 queries `rx_*`, desligar
      `onError: continueRegularOutput` no nó MCP, rodar, montar o HTML
- [ ] 🔥 **Rodar o Radar** com o tema novo (~12 min, republica no SharePoint)
- [ ] 🔥 **Apagar no SharePoint** as 2 pastas antigas, o arquivo de 18/09 e o
      `radar-de-estoque-2026-09-21.html`, órfão desde que o nome perdeu a data
- [ ] **Levar as 39 lojas sem responsável ao comercial**
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
  são as vendas do Agile? · as 4 lojas do ranking são contas internas? · qual fonte?
- **Gui** — aprovação pra readicionar `fernando.tuunelis` no e-mail do IGA
- **Caio / Gui / Daniel** — avaliação do Skip/Adapta
- **Doni** — alinhamento do formato do Pulso de Eventos

## ⚠️ Alertas críticos
- 🧪 **Afirmar antes de medir foi o meu erro recorrente em 22/09.** Duas vezes: o `tnum`
  das fontes (recomendei a DM Sans por ser macia e ela não tem algarismo tabular) e uma
  comparação de seis fontes que na verdade mostrou Times New Roman seis vezes. Rótulo de
  ferramenta agora sai de medição, não de memória.
- 📤 **Não consigo empurrar o `montar-html.js` pelo MCP.** São 229 KB num único
  parâmetro, `setNodeParameter` é tudo-ou-nada, e um envio truncado gravaria um nó
  quebrado por cima do que funciona. O caminho é o Thomas colar e eu rodar o
  `_confere_transcricao.py` sobre o JSON baixado do n8n.
- 🎨 **A PONTE do Radar vem DEPOIS do TEMA e ganha no empate de especificidade.** Apagar
  uma regra só no `tema.css` pode não chegar no relatório — e não quebra nada, só não
  muda. Aconteceu com o fundo do `.topo` em 22/09.
- 📐 **Medir contraste contra branco não descreve mais a tela.** O cartão tem degradê; o
  pior plano é o canto superior esquerdo (`#E3E8EC`), e é lá que ficam o chip e o título.
  Texto direto no campo (`#D8E1E9`) só com `--texto-2` ou mais forte.
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
