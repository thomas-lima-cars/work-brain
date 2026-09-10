# Relatório de aderência — veículos em evento × lojas compradoras

Workflow n8n **`8fiTFsjWG9RQinz8`** — "RELATORIO Veiculos em evento - lojas mais aderentes".

Para cada veículo em evento que está fechando, ordena as lojas por **chance de comprar
aquele carro**, a partir do perfil de compra dos últimos 6 meses. E o inverso: clicando
numa loja, ordena os veículos. Saída é um HTML único, com os dados embutidos.

## A regra de elegibilidade — leia isto primeiro

Um par (veículo, loja) **só existe** se as duas condições valerem:

1. **Mesma UF** — a do veículo vem da loja vendedora; a da compradora, do endereço dela.
2. **Whitelabel do evento** — a loja compradora precisa pertencer a um dos whitelabels que
   o evento alveja. `event_whitelabels` é 1:N, então é `loja.whitelabel_id ∈ conjunto`,
   não igualdade simples.

Fora disso não existe aderência baixa: **o par não existe**. É por isso que o ranking de
cada veículo é curto — ele só disputa dentro da própria praça e do próprio canal.

## A fórmula

Cinco componentes, cada um com uma **aderência** (0..1) e um **peso** (0..1):

| componente | aderência | peso |
|---|---|---|
| preço, idade, km | `1 / (1 + |valor − média| / desvio)` | `1 / (1 + desvio / média)` ← o CV |
| modelo, categoria | 1 se bate com o item mais ofertado, senão 0 | o % de ofertas da loja naquele item |

```
score = Σ(peso × aderência) / Σ(peso) × confiança
```

O peso sair do coeficiente de variação é o miolo do pedido: **loja de faixa apertada é
previsível**, então acertar o número dela vale muito; loja que compra de tudo tem CV alto
e o peso cai sozinho, porque o indicador não informa nada.

**`confiança = min(1, veículos / 5)`** é adição minha, não estava no pedido — evita que
loja com 1 carro de histórico lidere por sorte. `CONFIANCA_MIN = 1` desliga. Nas tabelas,
**Aderência** é o número bruto e **Score** já é multiplicado pela confiança.

Volume de ofertas **não** entra no score. Está na tela como leitura.

## As duas fases, e por que existem

O MCP `run_query` tem três limites medidos (ver o [README do SDK](../README.md)):
sem window function, resposta cortada em 50 linhas, deadline de 60s. E `OFFSET` reexecuta
o agregado inteiro a cada página — **página vazia custa o mesmo que página cheia**.

A primeira versão chutou 60 páginas para 26 necessárias: 170 chamadas desperdiçadas,
execução 49803 rodando 18,8 min. Daí o desenho atual:

| | o que faz |
|---|---|
| **Fase 1** (`montar-fase1.js`) | uma chamada só: conta veículos e lojas, resolve os eventos |
| **Fase 2** (`montar-fase2.js`) | pagina **exatamente** `ceil(n/50)`, nem uma página a mais |
| **Montar HTML** (`montar-html.js`) | ingere, calcula os pares, compara com o gabarito e desenha |

O número da fase 1 vira **gabarito de completude**: o montador compara com o que chegou e
grita se faltar. Sem isso, coleta truncada parece coleta completa.

Parametrização fica no topo do `montar-fase1.js`: `EVENTOS_IDS = []` usa a regra das
próximas `HORAS_ADIANTE` horas; com ids, roda só aqueles eventos.

## As ferramentas, e o buraco que cada uma tapa

| script | existe porque |
|---|---|
| `prova-local.js` | 55+ provas da fórmula e da elegibilidade, sem tocar no banco |
| `_smoke_dom.js` | **o JS do navegador viaja como string dentro do nó** — `node --check` nunca olha pra ele. Dois bugs chegaram ao Thomas por essa fresta. Roda o app contra um DOM de mentira e **interage**: troca o filtro de evento em toda opção, confere que nenhuma zera a tabela e que a soma das partes fecha com o total |
| `monta_html_de_dados.js` | regera o HTML de um `dados-*.json` já coletado. Mexeu só na tela? segundos, não os 8 min do run. Recorta a seção entre `RENDER:INICIO`/`RENDER:FIM` do próprio nó, então não há cópia paralela pra desatualizar |
| `_extrai_execucao.py` | o nó devolve ~9 MB; resultado desse tamanho não cabe na conversa e o harness salva em arquivo. Este script materializa `saida-<id>.html` e `dados-<id>.json` a partir dele |
| `_confere_run.js` | **o código do nó é transcrito à mão pra dentro do n8n.** Um caractere trocado no meio da fórmula não quebra a sintaxe — só envenena os números em silêncio. Recalcula todos os pares publicados a partir de `veiculos[]` e `lojas[]`, cruza os pesos, revalida a elegibilidade |
| `build_wf.py` | gera o `.wf.ts` a partir dos `.js` |

Ciclo depois de mexer no nó:

```bash
node prova-local.js && node monta_html_de_dados.js dados-<id>.json && node _confere_run.js dados-<id>.json
```

## Estado — execução 49846 (2026-09-09)

366 veículos em 13 eventos, 613 lojas elegíveis, **60.295 pares**, 8,4 min, zero falhas.
Os 60.295 pares foram recalculados e batem; 0 fora de UF, 0 fora de whitelabel; o render
local saiu idêntico ao do n8n.

**Duas ressalvas abertas:**

- **O HTML foi a 4,4 MB.** São os 60 mil pares embutidos. Ainda abre, mas está perto do
  desconfortável. Cortar pares abaixo de um score mínimo resolve, ao custo de deixar a
  direção loja→veículos incompleta para lojas fracas.
- **Contas internas no ranking.** Porto Seguro, Itaú Unibanco, Teste Cars2you v3 e Teste
  Cars2You V5 — as quatro em SP/Marketplace, elegíveis para 197 veículos cada, uma delas
  chegando a score 82,4. Lideram o ranking de 2 dos 366 veículos. Falta o Thomas confirmar
  que são internas pra excluir do universo.

Os 8 pares que divergiram na conferência **não são bug do relatório**: é a duplicidade do
catálogo `models`, documentada em [`dominios.md`](../../../context/banco-de-dados/dominios.md).
