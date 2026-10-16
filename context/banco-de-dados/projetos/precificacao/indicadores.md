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

## Laudo cautelar lido do PDF — 2026-10-14

Sorteio de 1.500 vendas por base (semente 20261014) dentro da amostra de
17/09. Texto extraído com `pdftotext`, indicadores por dicionário
(`automations/precificacao/laudo_sinais.py`). Efeito = p.p. de deságio contra
a média do (base, modelo), comparando "o laudo aponta" com as **outras vendas
de laudo lido**. `*` = |t| ≥ 3,3. Entre parênteses, vendas.

| | Cars2You | Dealers |
|---|---:|---:|
| Laudos lidos | 1.498 | 1.500 |
| Com texto | 1.335 (89%) | 1.190 (79%) |
| Escaneados (precisam de OCR) | 163 | 310 |

| o laudo aponta | Juntas | Cars2You | Dealers |
|---|---:|---:|---:|
| Coluna | +5,6* (95) | +6,4* (61) | +4,0 (34) |
| Ar-condicionado não funciona | +5,5* (100) | +5,8* (94) | < 30 |
| Motor não funciona / não liga | +5,0* (210) | +5,9* (191) | < 30 |
| Farol, lanterna ou vidro elétrico não funciona | +5,0* (231) | +5,4* (231) | < 30 |
| Gravação de vidro não original | +4,3* (153) | +4,4* (115) | +4,1 (38) |
| Assoalho / painel / corta-fogo | +4,0* (695) | +5,0* (496) | +2,7* (199) |
| Longarina | +4,0* (356) | +3,8* (201) | +4,2* (155) |
| Dano estrutural (qualquer peça) | +3,8* (1.071) | +4,2* (678) | +3,4* (393) |
| Sem chave | +3,5* (147) | +3,9* (123) | < 30 |
| Caixa de ar | +3,5* (503) | +4,2* (364) | +2,3 (139) |
| Interior ruim ou sujo | +2,9* (411) | +4,4* (305) | −0,3 (106) |
| Pneus para trocar | +1,5* (839) | +2,5* (688) | −0,3 (151) |
| Repintura com massa | +0,7 (123) | −0,5 (71) | +2,3 (52) |

Peças de lataria com dano (juntas): nenhuma −1,0* (1.313) · 1 a 2 0,0 (452) ·
3 a 5 +1,6* (597) · 6 a 9 +4,3* (163).

### Laudo item a item — 2026-10-14

`laudo_itens.py`: 26 itens, cada um em **presente / ausente / danificado**,
mesmas 2.525 vendas de laudo legível. Efeito contra as outras vendas de laudo
lido, resíduo do (base, modelo). Confiança: alta = |t| ≥ 3,3 · média = |t| ≥ 2.
Juntas; entre parênteses, vendas.

| item | presente | ausente | danificado |
|---|---:|---:|---:|
| Rodas | −2,9 alta (134) | +2,5 baixa (33) | **+5,8 alta** (39) |
| Motor (funcionamento) | −0,8 baixa (672) | poucos | **+5,5 alta** (188) |
| Ar-condicionado | −0,7 baixa (592) | poucos | **+5,4 alta** (101) |
| Vidros elétricos | −0,5 baixa (401) | +0,6 baixa (332) | **+5,2 alta** (132) |
| Faróis | 0,0 baixa (495) | poucos | **+4,7 alta** (250) |
| Lanternas | −0,2 baixa (498) | poucos | **+4,7 alta** (226) |
| Chave de roda | +0,1 baixa (757) | **+4,2 alta** (152) | — |
| Chave principal | +0,2 baixa (707) | **+4,1 alta** (128) | poucos |
| Macaco | +0,1 baixa (796) | **+4,0 alta** (140) | poucos |
| Documento (CRLV) | **−4,1 alta** (125) | −0,2 baixa (127) | — |
| Capô | −2,0 alta (458) | poucos | +3,6 alta (441) |
| Portas | **−3,6 alta** (306) | poucos | +2,6 alta (784) |
| Estepe | −1,5 alta (511) | +2,9 média (94) | +3,2 alta (344) |
| Pneus | −2,1 alta (422) | poucos | +2,6 alta (556) |

Tabela completa no painel (aba "Laudo item a item"). Na Dealers, só 3 estados
com confiança alta: menos laudos, e o da Natus sai embaralhado.

⚠️ Os sinais de **funcionamento** quase não aparecem na Dealers: os laudos de
lá raramente testam o carro, e o da Natus vem em grade que o `pdftotext`
embaralha. "Não consta" ali é falta de leitura, não carro bom.

## Modelo preditivo de preço — 2026-10-14

`automations/precificacao/preditivo/modelo-preco.py`. Prevê a razão venda/FIPE;
re-treinado mês a mês e cobrado em julho, agosto e setembro de 2026.
Erro = (previsto − vendido) ÷ vendido. Trecho gerado por `resumo-indicadores.py`.

**Amostra:** os 100 modelos mais vendidos de cada base em 12 meses (`roda-estudo.py
--top 100 --sufixo amplo`), mais a amostra do estudo (20 modelos). 99 modelos na
Cars2You e 101 na Dealers.

🔴 **Só vendas disputadas — 3 ou mais lojas distintas deram lance** (Thomas, 14/10:
"o VMV impacta diretamente no valor da venda"). Medido na Cars2You, % de vendas que
fecharam a até 2% do VMV: 1 loja **67%** · 2 lojas **33%** · 3 lojas 10% · 4+ lojas 5 a 6%.
Saíram 4.543 da Cars2You e 1.770 da Dealers; ficam **10.388**, das quais **2.007** no teste.

| modelo | erro mediano | ±10% | erro médio R$ | viés |
|---|---:|---:|---:|---:|
| A · Só a média da base | 9,3% | 53% | 5.460 | +5,1% |
| B · + modelo do carro | 8,4% | 60% | 4.722 | +4,8% |
| C · + km, idade, UF, canal, categoria, FIPE e laudo do banco | 6,6% | 68% | 4.025 | +4,2% |
| D · + sinais do texto do anúncio | 6,5% | 69% | 3.894 | +3,1% |
| E · + indicadores do laudo em PDF | 6,5% | 69% | 3.891 | +3,1% |
| F · Mesmo conjunto do E, com gradient boosting | 6,3% | 70% | 3.732 | +2,8% |
| **G · + calendário do evento, acabamento (cor, câmbio, combustível, carroceria), vendedor (gradient boosting)** | **6,0%** | **72%** | **3.566** | **+2,7%** |

Por base (G): Cars2You 5,8% (745 vendas) · Dealers 6,1% (1.262 vendas). Por mês: julho 6,0% (viés +2,8%), agosto 5,9% (viés +3,1%), setembro 5,9% (viés +2,0%).

**Blocos do G**, escolhidos em três janelas de validação (jan–fev, mar–abr, mai–jun),
cada um só entra se reduzir o erro médio em mais de 0,05 p.p.: calendário do evento (9,00% → 8,87%), acabamento (8,87% → 8,75%), vendedor (8,75% → 8,69%).
Testados e recusados: os demais de `CANDIDATOS` (versão, itens do laudo, pátio, Molicar,
idade contínua, tamanho e alcance do evento...).

**Antes × depois, nas mesmas 1.091 vendas do teste anterior** (20 modelos): erro mediano
5,9% → **5,6%** · ±10% 73,2% → **74,2%** · erro médio por carro R$ 3.350 → **R$ 3.153**. No teste
ampliado (2.007 vendas), o modelo anterior fazia 6,6%, 68,0% e R$ 4.011.

**Índice de confiança** (chance de ficar a até 10% do previsto; calibrado em maio–junho):

| confiança | vendas | anunciado | observado | erro mediano | dentro da faixa provável |
|---|---:|---:|---:|---:|---:|
| baixa (< 70%) | 815 | 62% | 60% | 8,0% | 79% |
| média (70–80%) | 709 | 75% | 78% | 5,5% | 82% |
| alta (≥ 80%) | 483 | 86% | 85% | 4,9% | 75% |

### Ofensores dos outliers — 2026-10-14

`preditivo/outliers.py`. Outlier = previsto mais de 20% acima do vendido: **121 de 2.007**
(6,0%). O lado oposto tem 15. Comparação contra as 1.455 bem previstas (erro ≤ 10%).

| indicador | nos outliers | nas bem previstas | vezes mais comum | vira outlier |
|---|---:|---:|---:|---:|
| vendedor: BANCO C6 S.A. | 50% | 20% | 2,6× | 12% |
| idade: 10 a 14 anos (Dealers) | 38% | 16% | 2,4× | 12% |
| laudo no banco: reprovado | 37% | 16% | 2,3× | 12% |
| anúncio: Motor não funciona | 22% | 8% | 2,7× | 13% |
| anúncio: Chave ausente ou não funciona | 23% | 10% | 2,3× | 12% |
| km: não informado | 12% | 4% | 3,3× | 14% |
| idade: 8 a 9 anos (Dealers) | 17% | 7% | 2,4× | 12% |
| anúncio: Retrovisor | 23% | 12% | 2,0× | 11% |

Perfil ofensor (retomado por banco, sem chave/motor, sem km lido, laudo reprovado):
**83%** dos outliers, 45% dos bem previstos.

### Modelo × VMV × venda — 2026-10-14

🔴 **Regra do projeto (Thomas, 14/10): VMV e valor da venda nunca entram no modelo** —
ele existe para ser confrontado com os dois. Há trava (`PROIBIDO`) no `modelo-preco.py`.

VMV válido = 20% a 150% da FIPE. Teste: **761 vendas disputadas com VMV** (Cars2You 741, Dealers 20). Erro mediano:
modelo **5,7%**, VMV **8,9%**. O modelo chega mais perto da venda em **65%**.

| VMV, comparado ao modelo | vendas | venda ÷ modelo | venda ÷ VMV | modelo mais perto | vendeu abaixo do VMV |
|---|---:|---:|---:|---:|---:|
| mais de 15% abaixo | 158 | 0,948 | 1,188 | 75% | 1% |
| 5% a 15% abaixo | 266 | 0,981 | 1,079 | 65% | 12% |
| dentro de ±5% | 250 | 0,996 | 1,006 | 57% | 47% |
| 5% a 15% acima | 66 | 1,003 | 0,922 | 65% | 77% |
| mais de 15% acima | 21 | 0,991 | 0,788 | 95% | 100% |

⚠️ Com todas as vendas (sem o corte de disputa) a conclusão era outra — VMV 5,7% contra
modelo 6,0%, quase empate. Era artefato: sem disputa a venda **é** o VMV.

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
