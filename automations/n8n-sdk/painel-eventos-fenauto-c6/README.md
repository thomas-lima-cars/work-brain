# Eventos Fenauto C6

> Irmão do [Painel de Eventos C6](../painel-eventos-c6/README.md), **sem o
> representante comercial**: nada de GN, GP, carteira de lojas ou tabela de
> gerentes. No topo, a logo do C6 sozinha à esquerda e a da Fenauto (com a
> Cars2You embaixo) no centro, no lugar do título e do subtítulo.

**Recorte = o do C6** (Thomas, 26/10): eventos do **WL 43** que encerram a
partir de 01/10/2026. As consultas são as do painel do C6, menos o CNPJ.
**Loja nova é diferente** (Thomas, 26/10): grupo 146, desde 01/10, **e
cadastrada num dos dias do evento**.

**Estado em 2026-10-26:** HTML, 231 provas e o `.wf.ts` prontos, local.
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
| Topo, à esquerda | logo do C6 | logo do C6 (igual) |
| Topo, no centro | título "Mega evento exclusivo C6" + subtítulo (evento, período, "com filtros") | **logo da Fenauto** dentro do h1, 44 px (30 no telefone). Sem título nem subtítulo (Thomas, 26/10). O nome do h1 é o do SVG |
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
python coleta_local.py --prova       # coleta de prova própria (VPN); sem ela, as provas usam a do C6
node _aplica-modelo.js               # tema + logo do C6 + Fenauto inline para dentro do Montar Painel
for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
node prova-local.js                  # 231 provas
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
| `_aplica-modelo.js` | injeta `tema.css` + `tema-c6.css`, a logo do C6 (base64) e a da Fenauto (SVG inline, compactado) |
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

- 🛑 **Criar o workflow no n8n** — `.wf.ts` pronto, espera o ok.
- ✅ Coleta própria feita em 26/10 20:57, com VPN: `dados-local.json` (a tela)
  e `dados-prova.json` (as provas) desta pasta. As 231 provas passam sobre ela.
  Ficam fora do git, com nome real de loja. Os números dela moram em
  [`projetos/c6/indicadores.md`](../../../context/banco-de-dados/projetos/c6/indicadores.md#eventos-fenauto-c6--coleta-de-2026-10-26-2057) — inclusive o aviso de que a
  coleta de prova (25 eventos) passa dos ~130 KB por pacote.
- 🔵 Sem cron, como o do C6.
