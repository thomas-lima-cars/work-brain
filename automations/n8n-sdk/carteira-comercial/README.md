# Carteira Comercial

> Quem responde por cada loja.

Workflow n8n **`ksZI8cqSbexqLOre`** — roda **às 6h**, leva ~6 segundos.

Lê a planilha da área comercial no SharePoint e publica
`Radar de Estoque/_dados/carteira-comercial.json`, que o
[Radar de Estoque](../rel-veiculos/README.md) consome no nó `Baixar Carteira`.

```
6h  Carteira Comercial ──> _dados/carteira-comercial.json  (1.458 CNPJ)
                                        │  (lê)
    Radar ─ Baixar Carteira ─ Fase 1 ─ … ─ Montar HTML
```

## Por que é um workflow separado

A planilha muda toda semana e o Radar roda 12 minutos. Juntar as duas coisas
punha **um download de terceiro no caminho crítico de um job longo**, e prendia
o relatório ao espaço pessoal de uma pessoa.

Separado, a dependência frágil fica isolada aqui: se a planilha sumir, quem
falha é este workflow — pequeno, roda em segundos, e pode falhar de manhã sem
ninguém perder relatório. O Radar segue consumindo o **último arquivo bom
conhecido**, e **declara** na tela que está fazendo isso.

## 🔴 Este workflow falha de propósito

**Toda validação no `tratar-carteira.js` é `throw`, não aviso.** É o contrário
do que o Radar faz, e é deliberado.

| | o que o erro custa | então |
|---|---|---|
| **Radar** | um relatório desatualizado | degrada e **declara** (`ao_vivo:false`, origem dizendo por quê) |
| **aqui** | destruir o único bom estado que existe | **falha alto** e deixa o arquivo anterior intacto |

Lá o produto é um relatório: melhor sair com carteira velha e dizer isso do que
não sair. Aqui o produto **é** a carteira — publicar uma ruim SUBSTITUI a boa, e
a próxima leitura de todo mundo passa a ser a ruim.

As guardas, em ordem: veio alguma linha? · a linha é um `{error:…}` do HTTP? ·
as colunas obrigatórias existem (varrendo **todas** as linhas, porque o Extract
from File descarta célula vazia)? · passou do piso de **500 linhas**? · alguma
linha sem consultor? · sobrou algum CNPJ válido?

O piso de 500 é generoso de propósito: em 2026-09 a planilha tinha 1.436
clientes em 7 carteiras. Um dia com 40 linhas não é "semana fraca", é leitura
truncada ou aba trocada.

## Os arquivos

| arquivo | o que é |
|---|---|
| `tratar-carteira.js` | nó Code: as linhas da aba `Todos os Clientes` viram o mapa `cnpj → índice` e `nome normalizado → índice` |
| `virar-arquivo.js` | nó Code: o JSON vira binário para o PUT no SharePoint |
| `_prova-carteira.js` | 17 provas, incluindo a comparação byte a byte da `normNome` com a do Radar |

## ⚠️ A `normNome` existe em DOIS lugares e tem que ser idêntica

O mapa é construído aqui e consumido no `montar-html.js`. Se a normalização
divergir, os dois discordam sobre o que é "o mesmo nome" — e o efeito é **loja
sem responsável, sem erro nenhum**.

O `_prova-carteira.js` compara as duas byte a byte e falha alto. Ele pegou uma
divergência na primeira execução: dois comentários internos que eu havia
omitido.

## Duas armadilhas que custaram execução

**Ordenar depois de indexar.** Os mapas guardam **índice**; reordenar o array de
consultores sem remapear faz cada loja apontar para o consultor errado.
Silencioso e catastrófico. Por isso há um `de[]` remapeando.

**`new Date()` no nó responde em UTC.** O `gerado_em` é hora de Brasília e é um
texto **sem fuso**, então `Date.parse` o lê como hora local de quem consome — no
n8n, que roda em UTC, a carteira parecia 3h mais nova. Medido em 21/09: uma
carteira de 12 dias era calculada como 11. Por isso saem **dois carimbos**, e é
o `gerado_em_utc` que conta idade.

## Nome só vale quando é inequívoco

Nome normalizado que leva a dois consultores **não entra** no mapa. Atribuir a
loja à metade errada da carteira é pior que deixá-la como "Não Distribuído" —
mesma regra do link do anúncio no Radar, que não sai quando falta um pedaço.

Medido em 21/09: **94,7%** das lojas casam por CNPJ; o nome não resgatou
nenhuma.

## 🔴 Pendente

- [ ] **A transcrição destes nós nunca foi conferida byte a byte.** O
      `_confere_transcricao.py` cobre só os 4 nós do Radar. Baixar o JSON deste
      workflow e estender a lista `PARES`.
