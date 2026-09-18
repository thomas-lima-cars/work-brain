# Indicadores — os números medidos, em um lugar só

> 🔴 **Fonte única.** Número medido sobre as bases mora AQUI. Os outros
> arquivos **linkam**, não repetem.
>
> A regra existe por causa de 17/09: escrevi "a Dealers é um superconjunto com
> versão mais nova" em **cinco arquivos**. Quando a medição mostrou que estava
> errado, corrigir exigiu caçar com `grep` — e teria bastado esquecer um para o
> brain seguir afirmando o falso.
>
> **Toda linha traz a data e como foi medida.** Número sem data não serve:
> a base se move.

## Tamanho das bases — 2026-09-18

| | Cars2You | Dealers |
|---|---:|---:|
| Tabelas | **193** | **193** |
| Colunas | 2.075 | 2.074 |
| Veículos (não deletados) | 118.669 | 54.070 |
| Anúncios | 252.566 | 125.133 |
| Ofertas | 754.334 | 979.185 |
| Lojas | 21.873 | 13.451 |
| Usuários | 48.107 | 16.864 |
| Whitelabels | 73 | 4 |
| **Vendas** (status 2/3/7, última linha) | **47.415** | **21.405** |
| Registros em `models` | 2.876 | 3.099 |
| Nomes distintos em `models` | 2.390 | 2.568 |

Medido por `COUNT(*)` com `deleted_at IS NULL`, via `automations/bancos/`.
Definição de venda em [`definicoes.md`](definicoes.md).

**As duas bases são o mesmo esquema.** 192 tabelas em comum; só
`base_cars2you` × `base_dealersclub` diferem. Das 192, apenas `notifications`
tem colunas diferentes (`resent_by_id` e `resent_from_id`, só na Cars2You).

⚠️ A Dealers tem **menos da metade** dos veículos da Cars2You e **mais**
ofertas. Não é erro: são operações com dinâmica de disputa diferente.

## Estudo de precificação — extração de 2026-09-17

Amostra: 20 modelos mais vendidos de cada base, 12 meses, sem motos e pesados,
razão entre 0,20 e 1,20.

| | Cars2You | Dealers | Juntas |
|---|---:|---:|---:|
| Vendas na amostra | 4.596 | 4.771 | **9.367** |
| **Deságio médio** | **31,1%** | **29,6%** | **30,4%** |
| Elegíveis antes do top-20 | 9.149 | 8.944 | — |
| Cobertura do top-20 | 50,2% | 53,3% | — |
| FIPE do anúncio preenchida | 85,6% | 73,8% | — |

### Amplitude do efeito, dentro do mesmo modelo

| dimensão | Cars2You | Dealers | Juntas |
|---|---:|---:|---:|
| Quilometragem | 15,2 p.p. | 14,8 p.p. | **15,0 p.p.** |
| Idade | 9,1 p.p. | **13,7 p.p.** | 10,5 p.p. |
| Laudo cautelar | 5,2 p.p. | 7,8 p.p. | 7,2 p.p. |
| UF do pátio | 7,8 p.p. | 5,4 p.p. | 5,7 p.p. |

### Os maiores sinais do texto livre (juntas)

| sinal | vendas | efeito |
|---|---:|---:|
| Motor não funciona | 748 | +5,8 p.p. |
| Chave ausente ou não funciona | 907 | +4,7 p.p. |
| Sem estepe | 472 | +4,5 p.p. |
| Faróis avariados | 111 | +7,0 p.p. |

**24 de 51 sinais** passam no corte de Bonferroni. Dicionário em
[`palavras-chave.md`](palavras-chave.md).

## Medições mais antigas — conferir antes de usar

| número | quando | o que era |
|---|---|---|
| Conversão 46,8% | 14/09 | 47.165 vendas em 100.716 veículos, Cars2You. **A contagem de veículos mudou desde então** — ver a tabela do topo |
| Comprador explica 41,6% | 15/09 | R² controlado por modelo, só Cars2You, extração 51358 |
| `REPASSE` 35,7% × `TRADICIONAL` 28,7% | 15/09 | 7,0 p.p., t = 40,7. **Só existe na Cars2You** |
| 34% das vendas fecham abaixo do VMV | 15/09 | Cars2You. Ver [`qualidade.md`](qualidade.md) |

## Como atualizar

```bash
python automations/precificacao/roda-estudo.py --base cars2you
python automations/precificacao/roda-estudo.py --base dealers
python automations/precificacao/monta-painel-dados.py
```

⚠️ **A amostra se move durante o dia** — o status vira "vendido" horas depois
do fim das ofertas. Em 14/09, duas extrações com 35 minutos de diferença deram
1.302 e 1.306. Todo número aqui é o retrato de uma execução.
