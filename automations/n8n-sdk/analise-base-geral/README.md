# `analise-base-geral/` — Análise de Base de Clientes, 6 canais

Reconstrução do HTML "Analise_base_geral_clientes - Versão A" (gerado em
04/09/2026, 21.772 clientes em 6 canais) como workflow n8n no projeto pessoal
do Thomas. Envio por e-mail para a lista `DESTINOS` do `gen_wf.py`.

**Origem:** o gerador original deste HTML não está no repo nem no n8n. O
template é o próprio HTML (dado trocado por marcador); as consultas vêm do
relatório do C6 Lojista (`f6Bw2iiuaWECy9Uz`), parametrizadas por canal.

| Arquivo | O quê |
|---|---|
| `extrai_template.py` | Tira `template.html` e `constantes.json` (SITU, TIPS) do HTML original |
| `montar-queries.js` | Nó Code: 14 consultas × 6 canais = 84 chamadas ao MCP |
| `montar-html.js` | Nó Code: respostas do MCP → objeto `D` → HTML |
| `gen_wf.py` | Gera `analise-base-geral.wf.ts` (nós Code embutidos). Desde a versão 2 o template vai em dois nós próprios, **Template Topo** (18 KB) e **Template Script** (41 KB): o `jsCode` viaja inteiro pela API, nó de 87 KB já não passou e o Montar HTML com o template dentro daria 74 KB |
| `prova-local.js` | Prova sem banco: remonta o `D` a partir da Versão A e compara (só as 14 consultas originais) |
| `coleta_local.py` | Roda o SQL exato do Montar Queries pela conexão direta (VPN) → `dados-local.json` (fora do git) |
| `monta_local.js` | Roda o Montar HTML com esse dado → `saida-local.html` (fora do git) + prova cruzada |
| `_roda_no.js` | Roda um nó Code fora do n8n |

## Versão 2 (16/10/2026): o que veio do C6 Lojista

Pedido do Thomas: trazer as duas abas de Raio-X e os gráficos que o relatório do
C6 Lojista (`f6Bw2iiuaWECy9Uz`, anexo `Analise_Base_Clientes_C6_Lojista`) tem e
este não tinha, mais um filtro de ano/mês com seleção múltipla.

- **Abas:** Visão Geral · Raio-X de Compradores (matriz ordenável, com busca) ·
  Raio-X Individual (lista de compradores + perfil). Mesmas métricas do C6: êxito,
  ticket, faixa, Rec. FIPE/Molicar, modelo, laudo e local dominantes.
- **Gráficos novos na Visão Geral:** usuários únicos por etapa; ofertas e compras
  novos × recorrentes; base acumulada (pessoas / %); cadastros por dia (30 dias,
  com tendência); anúncios das lojas do canal (ofertas por veículo, êxito de venda,
  publicações por veículo); compras por estado; rankings do período (compras, dias
  ativos, lances). Ficaram de fora do C6: os "Destaques" (texto gerado) e a tabela de
  UF em 3 colunas (aqui já era gráfico).
- **Filtro de período:** anos e meses da janela de 12 meses, seleção múltipla,
  nenhum marcado = todos. Segue o filtro (marca "período"): atividade no período,
  todos os gráficos mensais, coorte, rankings do período e as duas abas de Raio-X.
  Não segue: panorama, funil, situação, recência, UF e top 10 histórico (são o
  histórico inteiro ou medidos a partir de hoje) e cadastros por dia.

**Como o filtro conta pessoa sem somar errado:** os pacotes `usuarios`, `atv` e
`rx_*` rodam uma vez sobre a **união** das 6 bases, e cada cliente leva a máscara
dos canais a que pertence. O navegador filtra canal pela máscara e mês pelo índice
(0 = mais antigo). No "todos os canais" a pessoa conta uma vez — o bloco "Atividade
no Período" não tem a dupla contagem que o panorama avisa.

**Pacotes medidos em 16/10/2026** (`coleta_local.py`, conexão direta, janela nov/25–out/26):
6.851 clientes com atividade na janela; 24.537 pares cliente×mês com acesso, 7.239
com lance, 3.752 com compra. Maior parte: `rx_faixa` 2/2 com 92 KB (o MCP já provou
130 KB). Nenhuma consulta nova passa de 11 s (`base_acum` do Marketplace). Total:
140 chamadas (84 de antes + 24 por canal + 32 partes de pacote).

| pacote | partes | itens | maior parte |
|---|---|---|---|
| `usuarios` | 8 | 6.851 | 63 KB |
| `atv` | 8 | 24.541 | 61 KB |
| `rx_totais` | 3 | 3.752 | 85 KB |
| `rx_modelo` | 5 | 9.505 | 63 KB |
| `rx_laudo` | 2 | 4.782 | 78 KB |
| `rx_uf` | 2 | 7.088 | 78 KB |
| `rx_faixa` | 2 | 5.507 | 92 KB |
| `rx_partic` | 2 | 7.221 | 57 KB |

Se uma parte crescer perto de 130 KB, subir o número de partes no `pacote(...)`.

Diferença deliberada do C6: em `uf_compra` a loja com mais de um endereço entra em
**um** estado (`MIN` da UF normalizada). No C6 ela entrava em todos, e a soma das
compras por estado passava do total.

Canais (whitelabel): 7 Marketplace Cars2You, 48 Colaboradores C6, 43 Canal de
vendas C6 Auto, 4 Trucks2you, 65 Lance Fácil BTB Associados, 62 Lance Fácil BTB.

## O que a prova local garante e o que não

- ✓ Aritmética de montagem: `kpi`, `situacao`, `recencia`, `evolucao`,
  `volume`, `uf`, `top` e as coortes saem idênticos aos da Versão A.
- ✗ **Não prova o SQL.** O banco da Cars2You só responde pelo nó MCP do n8n.
  A primeira execução confere os números contra a Versão A (a base se move
  desde 04/09, então esperar diferença pequena, não zero).
- Ponto a calibrar: o texto da Versão A diz que, onde o anunciante é dono do
  canal, o e-mail corporativo dele também sai. Só o `@c6bank.com` (fora do
  canal 48) e o `@cars2you` estão tratados; Trucks2you e Lance Fácil podem ter
  um domínio próprio a excluir. Comparar `total_base` de cada canal com
  14.747 / 3.074 / 2.922 / 782 / 156 / 91.
- A Versão A guardou a coorte de janela em formato antigo (sem `cadastrados`
  nem `mad*`); o workflow já traz os campos completos.

## Versão 3 (16/10/2026, subida sem rodar)

Pedidos do Thomas depois da v2:

- **Coorte por faixa:** a tabela "Velocidade de Ativação" deixou de ser acumulada.
  Colunas: até 30d · 31–60 · 61–90 · 91–180, cada pessoa numa faixa só (a da
  primeira vez). A consulta continua trazendo o acumulado; a diferença sai no
  navegador. Conferido na tela: 73 linhas em 7 recortes, as quatro faixas somam o
  acumulado de 180 dias.
- **Top 100:** o top histórico por canal veio de `LIMIT 10` para 100, empacotado
  (100 linhas passam do teto de 50 do MCP). No "todos os canais", quem está em dois
  canais aparece uma vez (antes podia aparecer duas). Os rankings do período também
  mostram 100. Tabelas com rolagem.
- **Filtro de comitente** = a loja que vende o veículo (`advertisements.shop_id`,
  ver `context/banco-de-dados/plataforma/dominios.md`). Segue o comitente (marca
  "comitente"): lances, compras e volume da Atividade no Período, rankings de compras
  e lances, as duas abas de Raio-X. **Não segue:** acessos (acesso não tem
  comitente), panorama, gráficos mensais por canal e top histórico. Medido em
  16/10: 24 comitentes com lance ou compra da base na janela; o seletor ordena por
  compras (Itaú Unibanco 5.058, C6 Bank Lojista 1.879, LM Transportes 1.121…).
  "Banco Volkswagen" e "Banco Volkswagen S.A." são duas lojas no banco.
  **O canal filtra o comitente:** a lista só traz quem vendeu ou recebeu lance de
  cliente daquele canal, com as compras do canal (no 48 sobra só "C6 Bank - CSixer",
  no 43 só "C6 Bank Lojista"). Comitente que some ao trocar de canal volta a "todos".
- Pacotes: `atv` só acesso; `lances` novo (cliente, mês, comitente); `rx_*` com
  comitente; `comitentes` (nomes). **148 consultas**, maior parte 92 KB, coleta
  direta em 329 s. Provas: Versão A ✓ (148) e cruzada 827/827. HTML 2,3 MB.
  Nós: Template Topo 18 KB, Template Script 43 KB, Montar Queries 21 KB, Montar HTML 16 KB.

## Estado no n8n

> **20/10/2026: ATIVO, disparo diário às 8h.** Subido e conferido nesta data: gatilho
> "Diariamente as 08h" (`scheduleTrigger` 1.3, `triggerAtHour: 8`) ligado ao Template Topo
> (o "Rodar" manual ficou); fuso do workflow `America/Sao_Paulo`; 5 destinatários de
> `DESTINOS`; publicado (versão ativa = rascunho). `confere_n8n.py` IGUAL em tudo.
> ⚠️ A v3 nunca rodou no MCP: a primeira execução real pode ser a das 8h, já com e-mail
> para os cinco. Se falhar, a trava de contagem aborta sem enviar.

> **21/10/2026: primeira execução agendada OK.** Execução `64522` (modo trigger), status
> `success`, 08h00:20 → 08h06:24 (6min04s). Montar Queries saiu com 148 itens (148 chamadas:
> sim). Montar HTML: `total` 22553 (Marketplace Cars2You 14937, C6 Auto 3468, Colaboradores C6
> 3077, Trucks2you 823, Lance Fácil BTB Associados 156, Lance Fácil BTB 92). Enviar para Thomas
> sem erro (`success: true`). Nenhum erro. Conferido só por leitura via conector n8n.

> **16/10/2026: e-mail para Thomas, Caio (`caio.ledesma@`) e Tuunelis
> (`fernando.tuunelis@`), com texto curto.** Lista em `DESTINOS` no `gen_wf.py`, que
> só aceita `@cars2you.com.br` (o anexo tem nome e CNPJ). Everton e Guilherme
> entraram na lista em 20/10 (ver o bloco PENDENTE acima). O nó segue com o nome
> "Enviar para Thomas".
>
> **16/10/2026: versão 3 subida, sem rodar.** Quatro `setNodeParameter` (Template
> Topo, Template Script, Montar Queries, Montar HTML); `confere_n8n.py` IGUAL nos 4.
> Inativo. A primeira execução no MCP ainda não aconteceu: 148 chamadas esperadas.
>
> Antes: **versão 2 subida, sem rodar.** Quatro chamadas `update_workflow`
> (Template Topo, Template Script, ligações + Montar Queries + e-mail, Montar HTML);
> `confere_n8n.py` diz IGUAL nos 4 nós Code. Inativo, disparo manual. A primeira
> execução vai conferir no MCP o que a coleta direta já mediu: 140 chamadas, pacotes
> até 92 KB. Provas locais: `prova-local.js` (o que já existia bate com a Versão A) e
> `monta_local.js` (dado real, 444/444). HTML com dado real: 1,8 MB.

- Workflow `XkRFB5dYc1EFWZkN`, projeto pessoal do Thomas, **inativo**, disparo manual.
  `confere_n8n.py` confirma que os nós Code salvos são idênticos aos arquivos daqui.
- Primeira execução (14/10/2026, execução 61787): sucesso em 2 min 52 s, 84 chamadas,
  e-mail enviado só para `thomas.lima@cars2you.com.br`.
- Base por canal, medida em 14/10/2026 com o filtro unificado de 28/09 (a Versão A, de
  04/09, entre parênteses): Marketplace 14.896 (14.747) · Canal de vendas C6 Auto 3.447
  (2.922) · Colaboradores C6 3.077 (3.074) · Trucks2you 816 (782) · Lance Fácil BTB
  Associados 156 (156) · Lance Fácil BTB 92 (91). Total 22.484 (21.772).
- **Conferido direto no banco (14/10, VPN, `consulta.py --base cars2you`):** as 6 consultas
  `kpi` rodadas direto dão os mesmos números do n8n (só Trucks2you com login 414 contra
  413, entrada nova entre as duas leituras). Refazendo a base **como estava em 04/09**
  (cadastros antes de 04/09) com o filtro de hoje: canal 43 = 2.922 e login 1.438, idênticos
  à Versão A; 48, 65 e 62 também idênticos. Logo o +525 do canal 43 é cadastro novo real
  (187 depois de 04/09 em setembro, 338 em outubro; 480 já com login), não filtro.
  Marketplace (14.705 contra 14.747) e Trucks2you (777 contra 782) ficam abaixo porque a
  Versão A é anterior ao filtro de 28/09 (grupo de clientes 7, `@netcarros`, `@dnr`
  amplo): tirando esses três, Trucks2you volta a 782 exato e Marketplace a 14.751.
