# Eventos Fenauto C6

> Irmão do [Painel de Eventos C6](../painel-eventos-c6/README.md), **sem o
> representante comercial**: nada de GN, GP, carteira de lojas ou tabela de
> gerentes. No topo (09/11), a logo **C6 Auto** à esquerda, o título "Mega
> evento Fenauto" e o subtítulo no centro e a Fenauto (com a Cars2You) à
> direita; os botões de tema e de avisos numa linha logo abaixo do cabeçalho.

**Recorte (Thomas, 09/11): os eventos do WL 43 com "fenauto" no nome, abertos
na semana corrente** (segunda 00:00 a domingo 23:59, hora de Brasília; a
semana anda sozinha). Em 09/11: 24384 "Evento Exclusivo C6 Fenauto – 13/11/26"
(06 a 13/11) e 24368 "Esquenta Fenauto C6 - 10/11/26" (09 a 10/11), 91
veículos, nenhum lance ainda. Os da Fenauto do IGA (24377 a 24379) não alvejam
o 43. Antes: só o 24052 (05/10), fim desde 01/10/2026 (26/10).
As consultas são as do painel do C6, menos o CNPJ.
**Loja nova é diferente**: desde 12/11, a loja cliente dos **grupos 69 e 146**
com entrada na campanha a partir de 10/11 (abaixo).

**12/11 (tarde): novos e reativados separados; vendidos com a vencedora sem
loja** (Thomas: "separe clientes novos de reativados"; as duas mudanças do
Mega Evento Fenauto (IGA) replicadas aqui).
- **Novos lojistas** = só as lojas cadastradas de 10/11 em diante.
  **Reativados** = as antigas sem compra que voltaram, num **sexto cartão**
  (logo depois de Novos lojistas), com engajamento, acessaram, ofertaram e
  compraram. O tipo sai do Montar Painel (`reativada` = tem entrada e a loja é
  de antes de `meta.inicio_campanha`); o SQL e o Montar Consultas não mudaram.
  O funil continua sendo dos novos cadastros. Os gráficos por dia e por hora
  ganham a série Reativados em **azul**, #2563EB no claro e #4C8DFF no escuro,
  definida no CSS do painel (o verde do IGA reprovou no validador de paleta
  contra o cinza #7A7A7A do C6: ΔE 1,3 no deuteranope; o azul passa CVD,
  visão normal e contraste contra o grafite e o cinza no claro e o amarelo e o
  cinza no escuro). Ranking com o selo nova/reativada e os botões Todos
  lojistas / Novos / Reativados; Resultado dos veículos com novo/reativado; o
  CSV ganha a coluna Tipo; o glossário separa Novos lojistas e Reativados.
  Na coleta da semana (12/11): **7 novos e 69 reativados** (eram 76 somados).
- **Vendidos**: a venda conta pela própria negociação, com Data pelo dia da
  oferta vencedora (`vq`), e não mais pela lista de ofertas — no IGA, a
  vencedora da 516768 foi lançada por usuário interno, sem loja, e o cartão
  dava 3 com 4 na tabela. Ela entra nos vendidos e no valor vendido, não nos
  compradores. O C6 não tinha o aviso de lance sem loja: entrou, com o texto do
  IGA. A coleta da semana e a de prova não têm lance sem loja; a prova planta um.
- As provas plantam reativadas (loja antiga) em todo dia com acesso e, nos
  seis últimos dias, novas (loja livre cadastrada desde o início da campanha),
  para as provas de separação não passarem vazias. **295 provas** (eram 287).

**12/11: novos lojistas pelos grupos 69 e 146** (Thomas: clientes novos =
"quem se cadastrou a partir de 10/11 e está no grupo ... (ou equivalente no
C6)", mais os "antigos sem compra que voltaram"; somados no número de Novos
lojistas que já existe, sem cartão novo). Loja cliente do C6 = algum usuário
**externo** da loja (não apagado, e-mail fora de `@cars2you.com.br`, `@itau*`,
`@c6bank*` e "teste") nos grupos 69 "Parceiros C6 - Geral" ou 146 "Parceiros C6
- Exclusivo SP" (os que os eventos 24368 e 24384 alvejam; Thomas: "usa os 2"),
loja não apagada e sem "teste" no nome. A **entrada** é o cadastro da loja, se
é de 10/11/2026 em diante; senão, se a loja não comprou (oferta vencedora de
negociação 2, 3 ou 7) em [10/05/2026, 10/11/2026), o primeiro `access_logs`
dela de 10/11 em diante; senão nula — compradora dos 6 meses antes (aparece só
nos acessos) ou antiga que não voltou. A janela sem compra é a de **antes** da
campanha: quem voltou e comprou no evento continua contando. As constantes
`INICIO_CAMPANHA`, `MESES_SEM_COMPRA` (o `SEM_COMPRA_DESDE` sai do JS) e
`GRUPOS_C6` ficam no topo do `montar-consultas.js` e vão no meta de toda
consulta (sai `campanha_novas`). A consulta `lojas` traz universo e entrada da
**mesma derivada** (a coluna `fenauto` = `ids.fen`, MAX por loja), para a
passada agrupada no `access_logs` (sem índice por data) rodar uma vez só;
**22,8 s** na coleta de 12/11. No painel: nova = entrada até o **dia do fim**
de algum evento do filtro, **sem piso** — quem entrou em 10/11 conta nos
eventos de 11/11, e quem entrou antes do primeiro dia conta no total e em
nenhum botão de Data; com Data, só quem entrou naquele dia. Os outros números
(acessos, ofertas, rankings) não mudam. A coleta de prova troca as datas para
10/11/2025 e 10/05/2025 (com conferência de contagem no SQL; os grupos ficam),
e por isso já chega com entradas reais; as provas plantam mais entradas (uma
por dia com acesso, uma antes do primeiro dia) e sete casos (23:59 do último
dia, 00:00 do primeiro, um ano antes e o dia seguinte ao fim do evento que
fecha primeiro entram no total; 00:01 depois do fim, loja apagada e loja
cadastrada no período sem entrada não). **287 provas** (eram 274).

**11/11 — loja nova pela campanha** (trocada em 12/11) (Thomas: "Na dash fenauto deve aparecer
somente clientes 'Fenauto 2026 C6'"). Loja nova = loja não apagada com um
perfil não apagado cujo `user_profiles.register_form_value` contém
`fenauto <ano> c6` (sem caixa; o ano é o da semana do recorte, anda sozinho),
pela data do **primeiro perfil da campanha** na loja — não a da loja —, num dia
da janela, o dia inteiro (com Data, só aquele dia). O padrão do Mega Evento
Fenauto (IGA). Saíram o grupo 146 e o "desde 01/10"; a consulta `lojas` traz a
coluna `fenauto` e une as lojas com perfil da campanha criado desde o início do
evento mais antigo; `meta.campanha_novas` leva o valor. Medido em 11/11 às 14h:
**ainda não existe perfil "Fenauto 2026 C6"** (só "Fenauto 2025/2026 IGA", no
WL 7), então as duas coletas saem com **0 novas** — é o pedido. As provas
plantam perfis em lojas da coleta: **274 provas** (eram 253).

**Estado em 2026-11-12:** novos lojistas pelos grupos 69 e 146; HTML, 287
provas e o `.wf.ts` regerados, local. A Rotina Fenauto (`../rotina-fenauto/`)
ainda tem a regra antiga: precisa ser regerada.
**Workflow ainda não criado no n8n** — espera o ok final do Thomas.

**12/11 (fim da tarde): um veículo só** (Thomas: "cada veículo deve aparecer somente uma vez, mesmo que esteja em 2 eventos"). O carro que não vendeu num evento volta no seguinte com outra negociação. Nos números de veículos (publicados, com ofertas, VMV atingido, vendidos, acessados, pátios, participações) e na lista, ele conta uma vez: com oferta, VMV atingido, acessado ou vendido se foi em algum evento do recorte. Na lista, uma linha com o status da negociação que vendeu (ou da mais recente), as ofertas somadas, a maior e a última de todas, o melhor % VMV/FIPE e farol, as lojas distintas que abriram os anúncios, e "em N eventos". Filtrando um evento, nada muda. Lances seguem todos. Coleta de 12/11: 120 negociações, 106 carros. **295 provas** (com o carro plantado em duas negociações).

```
Rodar → Montar Consultas → MCP Consultas → Montar Painel → Virar Arquivo → Subir no SharePoint
```

Publicaria em `Eventos Fenauto C6/eventos-fenauto-c6.html` no site N8N.
Gatilho manual, como o do C6. Projeto previsto: Cars2You (`yAo7DiqDfz6XfXyv`),
o mesmo do irmão — sem tabela de dados, nada obriga.

## O que mudou em relação ao painel do C6

| | C6 | Fenauto C6 |
|---|---|---|
| Representante (GN, GP) | carteira + tabela de gerentes, 2 rankings, 2 filtros, colunas na tabela de lojas, no Resultado do veículo e no CSV | **saiu tudo** |
| Nós | 8, com Ler Representantes e Ler Nomes | **6** — nenhuma tabela de dados |
| CNPJ na consulta `lojas` | vinha (chave da carteira) | **saiu** |
| Pontuação | loja nova: 10 por recuperação + 1 por dia com acesso; representante: + 5 por loja nova | **saiu tudo** (Thomas, 26/10). O ranking de lojas ordena por recuperações, ofertas e acessos e abre pela coluna Recuperações |
| Loja nova | grupo 146, cadastro desde 01/10 — entrava quem se cadastrou antes de o evento abrir | **desde 12/11: cliente dos grupos 69 e 146 com entrada na campanha** (cadastro desde 10/11, ou volta desde 10/11 sem compra nos 6 meses antes), até o dia do fim do evento, sem piso. Em 11/11: perfil da campanha "Fenauto <ano> C6", pela data do perfil, num dos dias do evento. De 26/10 a 10/11: grupo 146, desde 01/10 **e num dos dias do evento**, do dia do início ao do fim, o dia inteiro (Thomas, 26/10). Com Data, só naquele dia. Quanto isso tira em relação à regra do C6: [`projetos/c6/indicadores.md`](../../../context/banco-de-dados/projetos/c6/indicadores.md#eventos-fenauto-c6--coleta-de-2026-10-26-2057) |
| Filtro de Data | select na gaveta | **botões numa linha própria** entre os KPIs e o funil, fora de cartão, com o rótulo "Data": Todos e um por dia do período (Thomas, 26/10; uma versão anterior ficava dentro do cartão do funil). O mesmo filtro de antes: o dia escolhido encolhe o painel inteiro — cadastros (novos, funil), acessos (gráficos, ranking) e negociações (lances, vendas pela data da oferta vencedora, compradores). A lista de veículos não muda. Saiu da gaveta, e a aba de Filtros não conta mais a data. |
| Ordem dos cartões | KPIs → rankings → funil \| acessos por dia → por hora → pátios → veículos | KPIs → funil \| acessos por dia → por hora → **ranking de lojas** → pátios → veículos (Thomas, 26/10) |
| Topo, à esquerda | logo do C6 | **logo C6 Auto** (09/11), SVG inline traçado do PNG do Thomas (`design/marca/c6-auto/`), 24 px (15 no telefone); `#242424` no claro, branca no escuro, pelo CSS. Saiu o monograma C6 em base64 |
| Topo, no centro | título "Mega evento exclusivo C6" + subtítulo (evento, período, "com filtros") | **título "Mega evento Fenauto" e subtítulo** (09/11): o evento escolhido, ou "C6 · N eventos da Fenauto na semana de … a …" e o período, mais "com filtros". De 26/10 a 08/11 o centro era a logo da Fenauto, sem título |
| Topo, à direita | botões de avisos e de tema | **logo da Fenauto** (09/11), 44 px (26 no telefone). Os botões desceram para uma linha logo abaixo do cabeçalho, à direita (como no Mega Evento Fenauto IGA) |
| Logo da Fenauto | — | **SVG inline**, uma cópia só: a **preta** (`#242424`, a tinta do C6) no claro; no escuro o CSS pinta de branco (o mesmo da `logo-fenauto-escuro.svg`). A azul fica guardada em `design/marca/fenauto/` (Thomas, 26/10) |
| Tema ao abrir | claro | **escuro** (Thomas, 26/10 — padrão de todo projeto novo, regra 7 de `design/regras-de-layout.md`). O botão leva ao claro |
| Aba do navegador | "Mega evento exclusivo C6" | "Eventos Fenauto C6" |
| CSV de novos lojistas | `novos-lojistas-c6-*.csv`, com GP e GN | `novos-lojistas-fenauto-c6-*.csv`, sem |

Todo o resto — período, venda, score, performance financeira, gráficos,
pátios, veículos, filtros de Evento, Lojistas, Pátio e Status e o cálculo do
filtro de Data — é **o mesmo código** do painel do C6.

**Conferido em 26/10**, antes da regra nova de loja nova e da saída da
pontuação: sobre a mesma coleta, `kpi`, `funil`, `patios`, `por_evento`,
`top_lojas`, eventos, veículos, ofertas, lojas e acessos do `resumo` **iguais**
aos do painel do C6. Depois delas, o que depende de loja nova (novos, funil,
série Novos dos gráficos, selo "nova") diverge de propósito.

### Por que a logo da Fenauto é inline

Em base64, as duas artes (claro e escuro) somavam 57 KB e levavam o nó enxuto
de ~87 para **145 KB** — e o nó é transmitido à API por extenso. Inline, numa
cópia só, com o traço em uma casa decimal (0,1 numa caixa de 1076), o nó
enxuto fica em **105 KB** e o `.wf.ts` em **115 KB** (o do C6 tem 110). O HTML
da coleta local tem 217 KB, contra 218 KB do painel do C6.

O injetor (`_aplica-modelo.js`) compacta a arte do design ao injetar; o
arquivo em `design/marca/fenauto/` continua com a precisão do traço.

## Ciclo

```bash
python coleta_local.py               # a semana de hoje (VPN) -> dados-local.json; --semana AAAA-MM-DD troca a semana (a campanha é data fixa)
python coleta_local.py --prova       # 01/09 a 27/10/2026 SEM a trava do nome, campanha de 10/11/2025 -> dados-prova.json
node _aplica-modelo.js               # tema + logo do C6 + Fenauto inline para dentro do Montar Painel
for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
node prova-local.js                  # 295 provas
node monta_local.js                  # saida-local.html (dados-local.json desta pasta, ou a coleta do C6)
python build_wf.py                   # eventos-fenauto-c6.wf.ts
```

Para ver: `previa-radar` em `.claude/launch.json`, em
`http://localhost:8777/automations/n8n-sdk/painel-eventos-fenauto-c6/saida-local.html`.

**Nada vai ao n8n sem a aprovação final do Thomas.** Depois de criar, antes de
rodar: `python _confere_transcricao.py <dump-do-get_workflow_details>`.

| arquivo | o que é |
|---|---|
| `montar-consultas.js`, `montar-painel.js`, `virar-arquivo.js` | os três nós Code, **com** comentário — a fonte |
| `n8n/*.js` | os mesmos, **sem** comentário de bloco (`_enxuga.js`). Derivado: não editar |
| `_aplica-modelo.js` | injeta `tema.css` + `tema-c6.css`, a logo C6 Auto e a da Fenauto (as duas SVG inline, sem cor: a cor é CSS) |
| `_roda_no.js`, `_enxuga.js` | iguais aos do C6 |
| `coleta_local.py` | igual ao do C6 — roda o SQL do Montar Consultas desta pasta pela conexão direta (VPN). `--prova` troca também o início da campanha e o "sem compra desde" para 2025 (12/11), conferindo quantas vezes cada um aparece no SQL |
| `monta_local.js` | regera a tela sem n8n e sem banco |
| `prova-local.js` | 295 provas (12/11, tarde: novos e reativados separados — recontados do cru no total, por evento, com Data, por dia e por hora, funil só das novas —, a venda com a vencedora sem loja e o aviso de lance sem loja, o sexto cartão, a série azul, selos, botões, CSV e glossário). Antes, 287 provas (12/11). A loja nova pelos grupos 69 e 146: o SQL peça a peça (grupos, usuário externo, teste, janela de compra, uma passada só no `access_logs`, a entrada e o universo da mesma derivada), a troca de datas da coleta de prova, e a recontagem das novas a partir da coluna crua e dos eventos (total, por evento, com Data, entrada antes do primeiro dia), sobre entradas **plantadas** (uma por dia com acesso e uma antes do primeiro dia) e sete casos. Em 11/11, 274 provas da campanha do formulário (LIKE emulado e perfis plantados). Antes, 231 provas portadas das do C6: saiu a seção do representante, os filtros GP/GN e a pontuação; entraram a logo da Fenauto (inline, no centro do topo, C6 sozinho à esquerda, branca no escuro, compactada sem mexer na escala da Cars2You), nove provas de que nada de representante sobrou, a loja nova pelos dias do evento (com duas lojas plantadas: 23:59 do último dia entra, 00:01 do dia seguinte não), a Data nos botões fora do cartão do funil (funil e compradores do dia refeitos do cru, os botões não somem com o dia escolhido, gaveta sem Data), a logo preta no claro com a azul guardada, o tema escuro ao abrir, a ordem dos cartões e o ranking sem pontos |
| `_confere_transcricao.py` | compara o código no n8n com `n8n/*.js` byte a byte, e reprova se aparecer nó de representante ou a cadeia mudar |
| `build_wf.py` | gera o `.wf.ts` (6 nós, sem tabela de dados, sem cron, sem e-mail) |

`dados-*.json` e `saida-*.html` ficam fora do git (`.gitignore`).

Primeira versão do topo (26/10, mesma sessão): Fenauto à esquerda do C6, com
um fio entre as duas, e o título mantido. Trocada a pedido do Thomas.
O subtítulo levava o evento escolhido, o período e "com filtros": isso saiu da
tela. O evento continua na gaveta, e a aba de Filtros mostra quantos estão
ligados.

Os botões acima do funil tiveram uma versão anterior na mesma sessão (26/10):
dias de **cadastro**, com a contagem de cada dia, cortando só o funil. Trocada
pelo filtro de Data a pedido do Thomas.

## Pendências

- ❓ **A logo C6 Auto é traço de um PNG de 27 px de altura.** Fiel no tamanho do
  topo; se o C6 mandar o vetor, ele substitui (`design/marca/c6-auto/README.md`).
- ❓ A trava é o **nome** do evento: um evento da Fenauto do C6 sem "Fenauto" no
  nome some calado.
- ❓ O início da campanha (10/11/2026) e os grupos (69, 146) são constantes no
  `montar-consultas.js`: na próxima Fenauto, trocar à mão. Um evento C6 da
  Fenauto que alveje outro grupo fica sem novos lojistas até entrar na lista.
- ❓ A prova roda numa janela sem a trava do nome (01/09 a 27/10/2026), porque
  a semana de 09/11 ainda não tem lance. A trava é provada no SQL e na coleta da
  semana (seção 3c das provas).

- 🛑 **Criar o workflow no n8n** — `.wf.ts` pronto, espera o ok.
- ✅ Coleta própria feita em 26/10 20:57, com VPN: `dados-local.json` (a tela)
  e `dados-prova.json` (as provas) desta pasta. As 231 provas passam sobre ela.
  Ficam fora do git, com nome real de loja. Os números dela moram em
  [`projetos/c6/indicadores.md`](../../../context/banco-de-dados/projetos/c6/indicadores.md#eventos-fenauto-c6--coleta-de-2026-10-26-2057) — inclusive o aviso de que a
  coleta de prova (25 eventos) passa dos ~130 KB por pacote.
- 🔵 Sem cron, como o do C6.
