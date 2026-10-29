# Painel de Eventos Cars2You

> Os eventos da Cars2You como um todo, nos seis canais principais: o que
> está ativo hoje e em que status, quantos veículos estiveram ativos a cada
> dia (e quantos estrearam), quanto deles teve acesso, oferta e venda, quantos
> lojistas logaram, acessaram, ofertaram e compraram, e a tabela de veículos.

Pedido do Thomas em **28/10/2026**. Nasceu do Painel de Eventos C6: mesmo jeito
de empacotar consulta, mesma gaveta, mesma tabela ordenável. O recorte e a tela
são outros.

**Estado em 2026-10-28:** HTML, 46 provas, conferência contra o banco e o
`.wf.ts` prontos, **local**. **Workflow ainda não criado no n8n** — espera o ok
final do Thomas.

```
Rodar → Ler Carteira → Montar Consultas → MCP Consultas → Montar Painel → Virar Arquivo → Subir no SharePoint
```

Publicaria em `Painel de Eventos Cars2You/painel-eventos-cars2you.html` no
site N8N. Gatilho manual (cron só com o ok).

## O pedido, e onde cada parte está

| pedido | na tela |
|---|---|
| Cartões dos eventos ativos no dia, com veículos ativos por status e os removidos (inativos não vendidos) | cinco cartões: **Eventos ativos** (veículos e comitentes), **Veículos ativos** (com acesso, com oferta), **Em análise** (comprador, vendedor), **Vendidos** (aguardando pagamento, vendido, valor), **Removidos** (cancelados, sem ofertas, rejeitados) |
| Barras de veículos ativos por dia, separando os novos, com a linha do % com acesso, oferta e venda | **Veículos ativos por dia**: barra empilhada (já em evento + novos do dia), linha do indicador com eixo próprio à direita |
| Botões do KPI à esquerda, novos/todos à direita | `Com acesso · Com oferta · Vendidos` à esquerda; `Todos · Novos` à direita. Com Novos, a barra e a linha são só dos novos do dia |
| Tabela de veículos como a do painel de eventos | um veículo por linha: farol, link do anúncio, ano, km, estreia, evento mais recente e comitente, acessos, ofertas, maior oferta, FIPE, % FIPE, VMV, % VMV, resultado e comprador. Busca e "mostrar mais" de 100 em 100 |
| Curva de lojistas que logaram, acessaram, ofertaram e compraram por dia | **Lojistas por dia**, quatro linhas, e o total do período embaixo |
| Filtros: whitelabel, comitente, evento, responsável da carteira comercial, data | gaveta, nessa ordem. Data = De / Até |

## As regras

As marcadas **(minha)** são escolhas minhas, a confirmar com o Thomas.

| | |
|---|---|
| **Recorte** | Eventos que alvejam os canais 4, 7, 43, 48, 62 ou 65, **já abriram as ofertas** e terminam a partir de 30 dias atrás (os encerrados recentes e os ativos). O agendado fica de fora **(minha)**. Em 28/10 só 4, 7 e 43 tinham evento |
| **Veículo ativo no dia** | Veículo **distinto** com negociação num evento aberto no dia, do dia do início das ofertas ao dia do fim. O carro da LM que sai de um feirão às 16h e entra no seguinte às 18h conta uma vez |
| **Novo no dia** **(minha)** | O dia em que o veículo **estreou**: o início das ofertas do primeiro evento da vida dele, em qualquer canal. O pedido diz "cadastrados no dia"; o motivo da troca está abaixo |
| **Status nos cartões** | Dos veículos dos eventos ativos no dia, o status da negociação no evento **mais recente**. Ativo = 1; Em análise = 9, 13; Vendido = 2, 3, 7; **Removido = todo o resto** (8, 10, 11, 14, 15, 18) — "inativo não vendido", a definição do pedido |
| **Cartões num dia passado** | Com Até antes de hoje, os cartões mostram os eventos ativos naquele dia com o status **de hoje** — o banco não guarda o status de cada dia |
| **% com acesso / oferta / venda** | Dos veículos ativos no dia, quantos tiveram o anúncio aberto por alguma loja, receberam lance ou venderam **naquele dia**. Venda pela data da oferta vencedora |
| **Logou** | Qualquer linha de `access_logs` da loja no canal (`dominios.md`, rota `/bem-vindo` e afins) |
| **Acessou** **(minha)** | Abriu algum **anúncio** dos eventos filtrados. Entrar só na página do evento não conta |
| **Comprou** | Tem a oferta vencedora de uma venda (2, 3, 7), no dia dela. Oferta vencedora sem loja (existe no Marketplace) conta como venda do veículo e fica fora dos lojistas |
| **Responsável** | O consultor da carteira comercial, pelo **CNPJ** da loja (o nome não entra: o Radar mediu que ele resgata 0,1%). Recorta as **lojas**, nunca os veículos, como no Radar |

### Os filtros

| filtro | recorta | não mexe em |
|---|---|---|
| Whitelabel | eventos que alvejam o canal, e o **logou** naquele canal | — |
| Comitente, Evento | as negociações, e tudo que nasce delas | o "logaram" (login não é de evento) |
| Responsável | acessos, ofertas, vendas e logins das lojas da carteira | cartões e barras (veículo não tem responsável) |
| Data (De, Até) | os **dias** dos gráficos e da tabela; os cartões mostram o dia do Até | — |

A Data corta **dias**, não negociações: a loja que abriu no dia D o anúncio de
um evento que só abre em D+1 acessou em D com período de um dia ou de trinta.
A primeira versão cortava as negociações e dava "acessaram em 20/10" = 487
com De = Até = 20/10 contra 532 no período inteiro — o `_confere_banco.py`
pegou.

### Por que "novo" é a estreia, e não `vehicles.created_at`

Medido em 28/10 (números em
[`indicadores.md`](../../../context/banco-de-dados/projetos/painel-eventos-cars2you/indicadores.md)):

- `vehicles.created_at` é o dia da **primeira negociação** do veículo (4.936
  de 4.940) — o cadastro acontece quando o evento é montado, **dias antes** de
  ele abrir. Fora da LM, dos 2.159 veículos, só 376 foram cadastrados no
  mesmo dia em que abriu o primeiro evento deles na janela. Com o cadastro, a maior parte dos "novos"
  não estaria ativa no dia em que é nova, e a barra de novos não caberia
  dentro da barra de ativos.
- O anúncio também não serve: a **LM recria o anúncio a cada feirão** (23.495
  anúncios de 2.781 veículos em 30 dias). Por ele, todo carro da LM seria
  novo todo dia.

Se o Thomas quiser o cadastro mesmo assim, o dado já vem (`cadastro` na
consulta de veículos): trocar `estreia` por `cadastro` no Montar Painel.

## As consultas

Cada uma devolve **uma linha só** (`COUNT(*)` + `JSON_ARRAYAGG`), como no
Painel C6: o teto de 50 linhas do MCP não corta nada, e pacote menor que o
total derruba o run. As tabelas grandes saem **em partes** pelo resto do id,
cada pacote abaixo dos ~130 KB que o MCP já provou passar. Parte que faltar
derruba o run.

| tabela | partes | o que traz |
|---|---:|---|
| `canais`, `eventos`, `comitentes` | 1 | nomes e datas |
| `negs` | 14 | uma linha por negociação: evento, veículo, comitente, status, VMV, FIPE |
| `veiculos` | 7 | marca, modelo, versão, ano, km, cadastro, **estreia**, uuid do anúncio mais recente |
| `vendas` | 1 | a oferta vencedora das vendas: loja, valor, quando |
| `ofertas` | 3 | (negociação, loja): lances, maior lance, **máscara dos dias** |
| `acessos` | 12 | (negociação, loja) com a máscara dos dias em que abriu o anúncio |
| `logins` | 1 | (loja, canal) com a máscara dos dias com acesso ao canal |
| `lojas` | 2 | nome, canal e **CNPJ** — o CNPJ vira responsável no nó e não chega ao HTML |

**43 chamadas, ~50 s no banco** (coleta de 28/10). A máscara de dias (bit k =
k dias depois do piso) é o que deixa a página contar "no dia" com qualquer
filtro sem levar o acesso cru: são 31 dias, bits 0 a 30, que cabem no inteiro
de 32 bits do JavaScript. `DIAS` acima de 30 é recusado no Montar Consultas.

## A carteira comercial

O nó `Ler Carteira` lê `Radar de Estoque/_dados/carteira-comercial.json`, o
arquivo que o workflow **Carteira Comercial** (`ksZI8cqSbexqLOre`) publica às
6h e que o Radar já consome. Em série, antes das consultas (lição do Radar,
run 52930).

| situação | o painel |
|---|---|
| veio, com ≥ 500 CNPJ | filtro de responsável, pelo CNPJ |
| não veio, fora do formato, ou truncada (< 500) | sai **sem o filtro** de responsável, com aviso. Todo mundo em "Não distribuído" seria tela plausível e errada; derrubar o painel por um filtro, caro demais |
| mais de 7 dias | sai e avisa a idade |

⚠️ O brain registra (22/10) que a Carteira Comercial aparece `active: false`
no n8n. Se estiver mesmo parada, este painel vai avisar "carteira de N dias".

Localmente não há SharePoint: o `coleta_local.py` usa o literal do Radar
(`CARTEIRAS` em `rel-veiculos/montar-html.js`, de 21/09), e por isso a tela
local mostra o aviso de 37 dias.

## Design

Tema do brain (`design/tokens/tema.css`), sem camada de produto — é da própria
Cars2You. Logo extensa e curta, preta no claro e branca no escuro. **Abre no
escuro** (regra 7). Três cores derivadas, que o `tema.css` não tem, medidas no
`design/_contraste.js` contra o pior plano (AA de traço, 3,0):

| token | claro | escuro | para quê |
|---|---|---|---|
| `--serie-2` | `#748290` (3,19 no canto do cartão) | `#646E86` (3,18 no cartão) | barra "já em evento" |
| `--farol-abaixo` | `#946200` (4,25) | `#E3B341` (9,38) | farol de oferta abaixo do VMV |

A linha do indicador usa `--atencao`; as quatro linhas de lojistas usam
`--texto-3`, `--acento-cheio`, `--atencao` e `--positivo`.

Os gráficos são séries de até 31 dias com duas medidas no mesmo desenho: a
exceção da regra 3 — eixo com grade, sem rótulo em cada ponto, valor de cada
dia no balão. O SVG é desenhado na **largura real da caixa** (viewBox em
pixels), para o texto do eixo sair legível também no telefone.

## Ciclo

```bash
python coleta_local.py               # coleta real (VPN) + carteira local → dados-local.json
node _aplica-modelo.js               # tema + logos para dentro do Montar Painel
for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
node prova-local.js                  # 46 provas
python _confere_banco.py 22          # o dia 22 da janela contra SQL escrito de novo (VPN)
node monta_local.js                  # saida-local.html
python build_wf.py                   # painel-eventos-cars2you.wf.ts
```

Para ver: `previa-radar` em `.claude/launch.json`, em
`http://localhost:8777/automations/n8n-sdk/painel-eventos-cars2you/saida-local.html`
(2,6 MB: o navegador interno não abre o arquivo direto).

**Nada vai ao n8n sem a aprovação final do Thomas.**

| arquivo | o que é |
|---|---|
| `montar-consultas.js`, `montar-painel.js`, `virar-arquivo.js` | os três nós Code, **com** comentário — a fonte |
| `n8n/*.js` | os mesmos sem comentário de bloco (`_enxuga.js`). Derivado: não editar |
| `_aplica-modelo.js` | injeta `tema.css` e as quatro logos da Cars2You |
| `_roda_no.js`, `_enxuga.js` | iguais aos do Painel C6 |
| `coleta_local.py` | roda o SQL exato do Montar Consultas pela conexão direta e mede cada pacote; avisa o que passar de 130 KB |
| `monta_local.js` | regera a tela sem n8n e sem banco |
| `prova-local.js` | 46 provas: fonte (sem barra invertida, blocos injetados iguais ao injetor, enxuto = original), consultas (uma por parte, pacote único, sem NOW), o que derruba o run (pacote cortado, parte faltando, resposta a menos), carteira ausente/com erro/truncada/velha, HTML (escuro, offline, CNPJ que não vaza, ordem dos blocos e da gaveta, glossário), e as contas refeitas do cru sem máscara: ativos e novos de cada dia, cartões, responsável repartindo as lojas, De = Até, evento, canal e comitente, tabela |
| `_confere_banco.py` | o dia escolhido e o período contra SQL de contagem distinta, escrito de novo, sem máscara e sem o `calcula()`; os cartões de hoje por um terceiro caminho |
| `build_wf.py` | gera o `.wf.ts` (7 nós, sem cron, sem e-mail) |

`dados-*.json` e `saida-*.html` ficam fora do git (`.gitignore`): têm nome real
de loja.

## Pendências

- 🛑 **Criar o workflow no n8n** — `.wf.ts` pronto, espera o ok.
- ❓ Confirmar as escolhas marcadas **(minha)**: novo = estreia; acessou =
  abriu anúncio; agendado fora do recorte.
- ❓ Cron? Hoje manual.
- 🔵 Os canais 48, 62 e 65 não tinham evento em 28/10: aparecem no filtro só
  pelo login.
