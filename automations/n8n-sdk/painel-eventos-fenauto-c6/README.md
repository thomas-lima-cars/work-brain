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
**Loja nova é diferente** (Thomas, 26/10): grupo 146, desde 01/10, **e
cadastrada num dos dias do evento**.

**Estado em 2026-11-09:** logo, topo e recorte novos; HTML, 253 provas e o
`.wf.ts` regerados, local.
**Workflow ainda não criado no n8n** — espera o ok final do Thomas.

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
| Loja nova | grupo 146, cadastro desde 01/10 — entrava quem se cadastrou antes de o evento abrir | grupo 146, desde 01/10 **e num dos dias do evento**, do dia do início ao do fim, o dia inteiro (Thomas, 26/10). Com Data, só naquele dia. Quanto isso tira em relação à regra do C6: [`projetos/c6/indicadores.md`](../../../context/banco-de-dados/projetos/c6/indicadores.md#eventos-fenauto-c6--coleta-de-2026-10-26-2057) |
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
python coleta_local.py               # a semana de hoje (VPN) -> dados-local.json; --semana AAAA-MM-DD troca a semana
python coleta_local.py --prova       # 01/09 a 27/10/2026 SEM a trava do nome (dado variado) -> dados-prova.json
node _aplica-modelo.js               # tema + logo do C6 + Fenauto inline para dentro do Montar Painel
for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
node prova-local.js                  # 253 provas
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
| `coleta_local.py` | igual ao do C6 — roda o SQL do Montar Consultas desta pasta pela conexão direta (VPN) |
| `monta_local.js` | regera a tela sem n8n e sem banco |
| `prova-local.js` | 231 provas, portadas das do C6: saiu a seção do representante, os filtros GP/GN e a pontuação; entraram a logo da Fenauto (inline, no centro do topo, C6 sozinho à esquerda, branca no escuro, compactada sem mexer na escala da Cars2You), nove provas de que nada de representante sobrou, a loja nova pelos dias do evento (com duas lojas plantadas: 23:59 do último dia entra, 00:01 do dia seguinte não), a Data nos botões fora do cartão do funil (funil e compradores do dia refeitos do cru, os botões não somem com o dia escolhido, gaveta sem Data), a logo preta no claro com a azul guardada, o tema escuro ao abrir, a ordem dos cartões e o ranking sem pontos |
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
  nome some calado. A loja nova segue a regra de 26/10 (grupo 146, desde 01/10,
  num dia do evento) — não passou para a campanha da Fenauto, como no Mega Evento.
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
