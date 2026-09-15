# Regressão simples — o que move o deságio

**Execução 51076** · 2026-09-14 · amostra `top10-codigos-12m` · 49 segundos

Coleta conferida contra o gabarito: **1.302 esperadas, 1.302 colhidas, 0 duplicadas,
0 truncadas**. Período real: 15/09/2025 a 11/09/2026.

**Deságio médio: 32,46%** · desvio 9,84 p.p. · 10 códigos FIPE

## Método

Uma regressão por coluna, uma variável de cada vez:

- **numérica** → OLS `deságio = a + b·x`, R² = r²
- **categórica** → OLS sobre dummies, R² = SS_entre / SS_total

As duas dão R² na mesma escala, então ranqueiam juntas.

Três correções sobre o R² cru:

1. **R² ajustado** — `1 − (1−R²)(n−1)/(n−k−1)`. Categórica com 445 níveis explica muito
   por contagem de parâmetros. Ajustado negativo = pior que o acaso.
2. **Controle pelo código FIPE** — a mesma regressão sobre o resíduo (deságio menos a
   média do próprio código). É esta coluna que vale.
3. **Degeneradas** — `veiculo_id` e `negociacao_id` dão R² = 1 sempre. Separadas, não
   apagadas.

## Ranking

| coluna | tipo | níveis | R² cru | R² aj | R² ctl | **R² ctl aj** |
|---|---|---:|---:|---:|---:|---:|
| comprador_loja_id | cat | 445 | 68,6% | 52,3% | 64,6% | **46,2%** |
| cluster | cat | 20 | 20,8% | 19,0% | 16,7% | **14,7%** |
| patio | cat | 162 | 23,1% | 12,2% | 19,8% | **8,5%** |
| loja_id / loja | cat | 13 | 12,3% | 11,5% | 6,2% | **5,3%** |
| portas ⚠️ | num | — | 6,7% | −3,7% | 14,1% | **4,6%** |
| patio_cidade | cat | 69 | 7,7% | 2,6% | 7,1% | **2,0%** |
| km | num | — | 5,4% | 5,4% | 1,5% | **1,4%** |
| valor_ref_vendedor | num | — | 1,8% | 1,7% | 1,3% | **1,2%** |
| whitelabel_id | cat | 5 | 6,8% | 6,5% | 1,4% | **1,1%** |
| cor | cat | 20 | 3,8% | 2,3% | 2,3% | **0,9%** |
| patio_uf | cat | 21 | 2,8% | 1,3% | 2,3% | **0,8%** |
| combustivel | cat | 4 | 7,3% | 7,1% | 1,0% | **0,7%** |
| situacao_codigo | cat | 5 | 1,8% | 1,5% | 0,9% | **0,6%** |
| veiculo_criado_em | data | — | 1,0% | 1,0% | 0,7% | **0,6%** |
| ano_fabricacao | num | — | 0,8% | 0,7% | 0,6% | **0,5%** |
| ano_modelo | num | — | 0,5% | 0,4% | 0,5% | **0,5%** |
| status_negociacao | cat | 3 | 0,3% | 0,2% | 0,5% | **0,4%** |
| data_venda | data | — | 0,5% | 0,4% | 0,4% | **0,3%** |
| cambio | cat | 3 | 3,4% | 3,2% | 0,2% | **0,1%** |
| valor_molicar_anuncio | num | — | 6,2% | 6,1% | 0,1% | **0,0%** |
| **vmv** | num | — | 0,8% | 0,7% | 0,0% | **−0,1%** |
| valor_fipe_anuncio | num | — | 5,1% | 5,0% | 0,0% | **−0,1%** |
| valor_fipe_veiculo | num | — | 7,0% | 6,9% | 0,0% | **−0,1%** |
| categoria | cat | 3 | 6,6% | 6,5% | 0,0% | **−0,2%** |
| carroceria | cat | 8 | 4,9% | 4,4% | 0,4% | **−0,2%** |
| codigo_molicar | cat | 13 | 22,7% | 21,9% | 0,7% | **−0,3%** |
| marca | cat | 6 | 9,8% | 9,4% | 0,0% | **−0,4%** |
| versao | cat | 23 | 23,1% | 21,8% | 1,0% | **−0,7%** |
| modelo | cat | 10 | 21,2% | 20,7% | 0,0% | **−0,7%** |
| codigo_fipe | cat | 10 | 22,3% | 21,8% | 0,0% | **−0,7%** |

Degeneradas (1 linha por nível, R² = 1 trivial): `veiculo_id`, `negociacao_id`.

## Leitura

**Quem compra explica mais do que tudo que o carro é.** `comprador_loja_id` sozinho
responde por 46% da variação do deságio depois de controlado o modelo. Entre os
compradores com 20+ compras, o deságio médio vai de **42,2% a 31,0%** — 11 pontos
percentuais separando comprador de comprador, no mesmo carro.

**O segundo é `cluster`, e ele é limpo:** 20 níveis, 14,7% controlado. G15 compra a
39,9% de deságio, G1 a 20,2%. ⚠️ Só 848 das 1.302 linhas têm cluster preenchido, e 382
delas são "Não informado".

**Onde o carro está pesa mais que quase todo atributo técnico.** `patio` (162 níveis)
dá 8,5%, e `patio_cidade` 2,0% — acima de cor, câmbio, ano e combustível.

**Quem vende importa, e pouco:** 5,3%. Banco Volkswagen vende a 38,2% de deságio, Creditas
a 26,9%.

**Atributos do carro: praticamente zero depois do controle.** `km` sobrevive com 1,4% —
estatisticamente sólido (t = 8,38) mas pequeno: o coeficiente dá **+1,2 p.p. de deságio a
cada 100 mil km**. `ano_modelo` fica em 0,5%.

### O colapso é a prova de que o método funciona

`modelo` cai de 21,2% para −0,7%. `versao`, de 23,1% para −0,7%. `marca`, de 9,8% para
−0,4%. Isso é esperado e é o ponto: **essas colunas são quase constantes dentro de um
código FIPE**, então o R² cru delas era o R² do próprio código, emprestado.

⚠️ Consequência direta: **esta amostra não consegue testar atributo de modelo.** Para
saber se marca ou categoria importam, é preciso ampliar o recorte em `amostra.config.json`
para os 229 códigos com n≥10.

## Achados de qualidade de dado

| coluna | problema |
|---|---|
| `portas` | preenchida em **11 de 1.302** linhas. O R² de 4,6% é sobre 11 casos — ignorar |
| `fipe_qtd_versoes` | preenchida em 58 linhas |
| `valor_molicar_veiculo` | 327 linhas · `valor_molicar_anuncio` 714 · `valor_fipe_veiculo` 869 · `valor_ref_vendedor` 814 |
| `cor` | catálogo duplicado: **"Branco" (735) e "Branca" (53)** são níveis separados |
| `carroceria` | "Não Informado" em 427 (33%); caixa inconsistente ("CABINE ESTENDIDA" vs "Cavalo Mecânico") |
| `cambio` | "Não informado" em 506 (39%) |
| `cluster` | "Não informado" em 382 de 848 preenchidas |
| `codigo_molicar` | **traz o mesmo valor de `code_fipe`** na maioria das linhas — não é código Molicar |
| `vmv` | R² controlado = −0,1%. Somado aos valores implausíveis da execução 51072, está confirmado como inutilizável |

## O que isto derruba

Na etapa 1 eu escrevi que **VMV/FIPE seria provavelmente o driver mais forte**, "e em
parte tautológico". Era suposição minha. O dado diz que **o VMV não explica nada**:
R² controlado ajustado de −0,1%, ou seja, pior que o acaso. A hipótese estava errada.

## Reprodução

- amostra: `amostra.config.json` → `node monta-sonda-04.js` → sobe o nó gerado
- análise: nó `Analisar` do workflow `a6fNNTUYYayehNIn`, fonte em `no-analisar.js`
- a mesma lógica roda local em `analisa-drivers.js` sobre o JSON exportado —
  os dois caminhos têm de dar o mesmo número
