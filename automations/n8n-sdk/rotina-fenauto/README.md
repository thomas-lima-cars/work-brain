# Rotina Fenauto

> Os três painéis da Fenauto num workflow só, a pedido do Thomas (09/11):
> "inclua os 3 em uma rotina do n8n com a exportação dos arquivos no
> sharepoint em uma pasta Fenauto_202611 com subpasta para C6 e IGA".

**Estado em 2026-11-09:** criado no n8n, os 15 nós Code conferidos por md5
(iguais); **inativo** — o run de teste e a ativação esperam o Thomas.

Workflow **`9CNN9FjRohxaRUZq`** "Rotina Fenauto", projeto Cars2You
(`yAo7DiqDfz6XfXyv`), fuso America/Sao_Paulo. Agenda `0 9-18 * * 1-6`: de
hora em hora, das 9h às 18h, segunda a sábado (Thomas, 09/11). O gatilho
manual Rodar fica para rodada avulsa.

| painel | fonte | publica em (site N8N) |
|---|---|---|
| Eventos Fenauto C6 | [`../painel-eventos-fenauto-c6/`](../painel-eventos-fenauto-c6/README.md) | `Fenauto_202611/C6/eventos-fenauto-c6.html` |
| Mega Evento Fenauto IGA | [`../painel-eventos-fenauto-iga/`](../painel-eventos-fenauto-iga/README.md) | `Fenauto_202611/IGA/mega-evento-fenauto-iga.html` |
| Mega Evento Fenauto (Cars2You) | [`../painel-eventos-fenauto-cars2you/`](../painel-eventos-fenauto-cars2you/README.md) | `Fenauto_202611/mega-evento-fenauto.html` (na raiz, Thomas, 09/11) |

```
Agenda / Rodar
  → C6:       Peças do Tema → Peças da Página → Montar Consultas → MCP Consultas
              → Montar Painel → Virar Arquivo → Subir no SharePoint
  → IGA:      o mesmo
  → Cars2You: o mesmo
```

Os ramos vão **em série**: o Subir de um alimenta as Peças do Tema do
seguinte, que ignoram a entrada. Um erro num ramo **para o run**, e os ramos
de depois não publicam naquela hora: o painel falha alto de propósito
(pacote cortado, HTML pequeno demais), e um run verde com painel faltando
seria pior. Cada nó tem o nome do ramo (" C6", " IGA", " Cars2You"), e o
canvas tem um grupo por painel.

**A pasta é de novembro.** `Fenauto_202611` está escrita no `_divide.js`
(`PASTA_RAIZ`): não anda sozinha com o mês.

## A fonte continua nos painéis

Esta pasta **não tem regra de painel**. Ela pega o `n8n/*.js` (enxuto) de
cada painel e:

- divide o Montar Painel em três nós — **Peças do Tema** (CSS do tema, logos,
  CSS do painel, ícones: texto puro), **Peças da Página** (a função APP, que
  só entra no HTML pelo texto) e **Montar Painel** (o resto, que lê as duas
  pelo nome). Por quê: cada Montar Painel tem 100 a 115 KB e a API do n8n só
  recebe código inline; no Painel de Eventos Cars2You (06/11) 164 KB não
  passaram numa chamada sem trocar caractere, e abaixo de 56 KB passaram.
  Mesma solução, mesmo teto;
- troca os `$('Montar Consultas')` e `$('MCP Consultas')` pelos nomes do ramo;
- troca a pasta do Virar Arquivo pela da rotina, com cada parte do caminho
  codificada à parte (a barra da subpasta não pode virar `%2F`).

**Mudou um painel?** Rodar o ciclo dele (coleta, `_aplica-modelo.js`,
`_enxuga.js`, provas), depois o daqui, e mandar ao n8n só os nós que mudaram.

## Ciclo

```bash
node _divide.js                 # n8n/<ramo>/*.js, os 15 nós Code
node prova.js                   # 64 provas
python build_wf.py              # rotina-fenauto.wf.ts, o esqueleto e n8n/_envio/<ramo>.json
python _confere_n8n.py <dump>   # md5 dos 15 nós no n8n contra n8n/<ramo>/*.js
```

`prova.js`, para cada ramo e cada coleta local do painel (`dados-local.json`
e `dados-prova.json`): o nó inteiro do painel e os três pedaços daqui dão o
**mesmo HTML e o mesmo resumo**; as peças viajam como JSON; o Montar Painel
lê os nós do ramo e só eles; o Montar Consultas é o do painel; cada pedaço
fica abaixo de 56 KB; o Virar Arquivo publica em `Fenauto_202611/<subpasta>`
e o arquivo volta inteiro do base64.

**Como foi ao n8n** (09/11): o workflow inteiro tem ~355 KB. Criou-se o
**esqueleto** (`rotina-fenauto.esqueleto.wf.ts`, 10 KB, os 15 nós Code com um
marcador) com `create_workflow_from_code`; cada nó Code entrou num
`update_workflow` próprio (`setNodeParameter /jsCode`), um ramo de cada vez —
nunca dois ao mesmo tempo no mesmo workflow; e `_confere_n8n.py` conferiu o
md5 dos 15.

| arquivo | o que é |
|---|---|
| `_divide.js` | gera `n8n/<ramo>/*.js` dos painéis |
| `prova.js` | as provas acima |
| `build_wf.py` | o `.wf.ts` inteiro (referência), o esqueleto e o `_envio` |
| `_confere_n8n.py` | md5 do n8n contra o local |
| `n8n/<ramo>/*.js` | derivado: não editar |

## Pendências

- ❓ Sem alerta de falha (como os irmãos). Um ramo que quebra para os de depois.
- ❓ Guarda as execuções? Cada run carrega três HTML de ~200 KB.
- A pasta de dezembro, se a Fenauto seguir: trocar `PASTA_RAIZ` e mandar os
  três Virar Arquivo.
