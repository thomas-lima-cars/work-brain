# Estudo de precificação — o que move o deságio

Workflow hospedeiro: **`a6fNNTUYYayehNIn`** — sonda exploratória, inativa,
leitura apenas, sem e-mail e sem cron. Só o nó `Montar Queries` é trocado a cada
sonda; `Medir` ingere e `Analisar` calcula.

**Deságio** = `1 − (valor da venda ÷ valor FIPE do anúncio)`. Deságio de 31%
quer dizer que o carro saiu por 69% da tabela.

## As páginas

| arquivo | o que é |
|---|---|
| `graficos-modelo.html` | km, idade, UF do pátio e laudo cautelar, dentro do mesmo modelo |
| `colunas-desagio.html` | regressão simples de cada uma das 35 colunas |
| `analitico-veiculos.html` | as 4.582 vendas, linha a linha, com filtro e CSV |
| `termos-descricao.html` | as palavras de `vehicles.description` que mexem no deságio |

As quatro se linkam entre si. Ficam na mesma pasta — mover uma quebra os links.

## As definições, e por que cada uma é uma decisão

| | escolha | por quê |
|---|---|---|
| **Venda** | última linha válida de `advertisement_negotiations` com status 2, 3 ou 7 | correção do Thomas em 14/09. Contar qualquer negociação 2/3/7 incluía o carro que vendeu e teve a venda cancelada — 299 veículos, 2,6% |
| **"Última"** | `MAX(an.id)`, não por data | `finish_date_offer` tem lixo: um registro em 1969, outro em 2030 |
| **Valor** | `offers.price` via `an.offer_actual_id` | não `MAX(offers.price)`, não `value_actual` — este último está preenchido em 72.346 das 72.354 negociações "Sem Ofertas" |
| **FIPE** | `advertisements.fipe_price` | 85,6% preenchida contra 63,8% da de `vehicles`, e contemporânea da oferta |
| **Grupo** | marca + nome do modelo, normalizados | `models` reparte o mesmo modelo em ids diferentes — **pelo menos 50 nomes** assim |
| **Escopo** | 20 modelos mais vendidos, sem motos e pesados | 4.582 vendas, 50,4% da base elegível |
| **Corte** | `0,20 ≤ razão ≤ 1,20` | medido: 95,7% da massa entre 0,40 e 0,90, cauda até 107× a FIPE |

## Como trocar a amostra

`amostra-modelo.config.json` **é** a definição. Editar e rodar:

```bash
node monta-sonda-09.js && node monta-sonda-10.js
```

Os geradores provam a SQL localmente antes de emitir o nó, e só então o nó sobe
para o n8n. Depois da coleta:

```bash
node analisa-dimensoes.js dados-<id>.json dimensoes-<id>.json
node monta-graficos.js ; node monta-colunas.js ; node monta-analitico.js
node analisa-texto.js ; node monta-termos.js
node _smoke_analitico.js
```

## O que o estudo achou

**🔴 O maior efeito de todos está num campo de texto.** `REPASSE` (1.045 vendas,
35,7% de deságio) contra `TRADICIONAL` (1.123, 28,7%) — **7,0 p.p., t = 40,7**,
maior que quilometragem, cluster ou comprador. Não descreve o veículo:
classifica a operação. É uma coluna vivendo dentro de um `TEXT` digitado à mão.

**🔴 O status da documentação também está lá.** `Documento Pronto` contra
`DOCUMENTO EM REGULARIZAÇÃO`: 4,3 p.p.

**Ranking das colunas** (R² controlado por modelo): comprador 41,6% · km 18,1% ·
cluster 18,1% · versão 13,1% · código FIPE 12,5% · pátio 9,7% · loja vendedora
5,9% · ano 5,3%.

**Dentro do mesmo modelo:** km desloca 15,0 p.p. de ponta a ponta (monótono, de
−6,2 em "até 40k" a +8,9 em "200k+"), idade 9,2 p.p., UF 7,9 p.p., laudo
5,2 p.p.

## Armadilhas registradas

- ⚠️ **`MAX(cat.name)` para categoria por modelo está errado.** MAX em texto pega
  o alfabeticamente último — um veículo sem categoria rotula o modelo inteiro.
  Filtrar categoria **por linha**, no `WHERE`.
- ⚠️ **Duas sondas que alimentam páginas da mesma amostra precisam do MESMO
  `WHERE`.** Cada sonda tem o próprio gabarito, e os dois batem — cada um com o
  seu número errado. `monta-sonda-10.js` compara o `WHERE` com o da sonda 9.
- ⚠️ **Alias repetido no `FROM`** é erro de SQL que nenhuma prova de JS pega.
  Há guarda em `monta-sonda-10.js`.
- ⚠️ **Para comparar dois termos entre si, use a diferença dos patamares**, não a
  soma dos efeitos — cada efeito é medido contra todo o resto, que inclui o
  outro termo.
- ⚠️ **A amostra se move durante o dia.** Duas extrações com 35 minutos de
  diferença deram 1.302 e 1.306: vendas cujo status virou "vendido" no
  intervalo. Todo número é o retrato de uma execução.
- ⚠️ **`vehicles.description` não é texto livre de verdade** — 1.365 textos
  distintos para 4.582 vendas, duas frases cobrindo 44%. Analisar com n-gramas
  de 1 a 4 palavras: a negação é o que carrega o sinal (`possui chave` vs
  `não possui chave`).
- ⚠️ **Teste múltiplo.** 32.336 termos testados contra o mesmo alvo exigem
  Bonferroni (t ≥ 4,8), não |t| > 2.

## Qualidade de dado que apareceu no caminho

| achado | onde |
|---|---|
| **Agile 004362-1**: 39 de 44 vendas com `km NULL`, `ano_modelo 2010` e **VMV igual ao preço de venda** (até R$ 503 mil para FIPE de R$ 28 mil) | execução 51328 |
| **VMV**: 91% plausíveis (moda em 0,5–0,8× a FIPE, sustenta a regra "FIPE × 0,75"), mas 7,6% acima de 3× a FIPE, até 83× | 51328 |
| **34% das vendas fecham abaixo do VMV** — "atingiu o VMV" não é sinônimo de "vendeu" | 51328 |
| `models` com ≥50 nomes repartidos em ids diferentes | 51328 |
| `codigo_molicar` repete o valor de `code_fipe` | 51076 |
| `cor` com "Branco" e "Branca" como níveis separados | 51076 |
| `portas` preenchida em 11 de 1.302 linhas | 51076 |
| `vehicle_extra_fields.reason` preenchida em 1 de 4.582 | 51366 |
| `finish_date_offer` com registros em 1969 e 2030 | 51069 |

## Ressalvas do método

- **Regressão simples não separa causas.** Cada coluna foi testada sozinha. Km,
  idade e versão andam juntas; pátio, cidade e UF medem quase a mesma coisa.
- **O controle por modelo é mais frouxo que por código FIPE** — mistura
  gerações. Em troca, km e idade passam a variar dentro do grupo.
- **"Linguagem que tranquiliza" provavelmente é sobre o vendedor**, não o carro.
- ⚠️ **As páginas têm nome real de loja e dado comercial de cliente.** Repo
  privado — pensar antes de repassar.
