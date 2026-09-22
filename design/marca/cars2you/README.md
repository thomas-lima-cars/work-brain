# Logo — Cars2You

> ✅ **Arquivos definitivos desde 2026-09-22.** São SVG de verdade — `<path>`,
> uma cor sólida por arquivo, nenhum raster embutido. Os PNG provisórios de
> 18/09 saíram, e com eles as três limitações que este arquivo listava.

## As seis artes

Duas larguras × três cores.

| | preto (`#3A4552`) | branco (`#FFFFFF`) | azul (`#1D279A`) |
|---|---|---|---|
| **extensa** — 933 × 168 (5,55:1) | `logo-cars2you-preto.svg` | `logo-cars2you-branco.svg` | `logo-cars2you-azul.svg` |
| **curta** — 990 × 454 (2,18:1) | `logo-c2y-preto.svg` | `logo-c2y-branco.svg` | `logo-c2y-azul.svg` |

**Extensa** é a marca escrita por extenso, para a web. **Curta** é o `c2y`,
para o telefone: na barra ela ocupa um terço da largura da outra.

As duas caixas foram **medidas** com `getBBox` no navegador, não lidas do
atributo — ver a ressalva do `viewBox` abaixo.

## Quais estão em uso, e por quê

| tema | extensa | curta |
|---|---|---|
| claro | `logo-cars2you-preto.svg` | `logo-c2y-preto.svg` |
| escuro | `logo-cars2you-branco.svg` | `logo-c2y-branco.svg` |

**O "preto" não é preto: é `#3A4552`** — exatamente o `--texto` e o `--acento`
do tema claro. A marca e a letra da página são a mesma tinta, e é por isso que
ela assenta em vez de saltar.

🔵 **A azul está guardada, não descartada.** Decisão de 22/09 foi usar só
branco e preto. Ela volta se o painel precisar da cor da marca no cabeçalho —
mas aí é outra decisão, porque hoje o azul pinta **só o dado** (regra 10d).

⚠️ **A azul tem `#1D279A`, e a paleta oficial diz `#1523A0`.** Não é o mesmo
tom. Os PNG antigos vinham com `#1E289B` — um terceiro valor. Se a azul entrar
em uso, isso precisa ser resolvido com a marca, não no CSS.

## ⚠️ Cinco dos seis vieram sem `viewBox`

Só `logo-cars2you-azul.svg` (exportado do Illustrator) tinha. Os outros cinco
traziam `width`/`height` e mais nada — e **sem `viewBox` o SVG não escala**:
posto num `<img>` com `height:26px`, a arte é cortada em vez de encolher.

O `viewBox` que está neles hoje foi acrescentado aqui, a partir da medição:

```
logo-c2y-*       viewBox="0 0 990 454"     bbox medida: 0,0 → 990 × 453,62
logo-cars2you-*  viewBox="0 0 933 168"     bbox medida: 0,23,0 → 932,54 × 168
```

**Arquivo novo que chegar sem `viewBox` precisa do mesmo tratamento** — e da
mesma medição, não do meu chute.

## Como entram no painel

Base64, em `data:` URI, pelo gerador — regra 1: zero requisição de rede. O
`<img>` recebe `height` e `width:auto`, e o `viewBox` faz o resto.

Quem troca a **cor** é o JS, junto com o tema. Quem troca a **arte** é o CSS,
por largura de tela. As duas vivem dentro de um `<span class="marca">`, que é
um filho só da grade de três colunas do topo — soltas, virariam quatro filhos
e o título sairia do centro.

## O que ficou para trás

`_original-branca-cortada.svg` e os dois PNG saíram em 22/09. Ficam registrados
só porque explicam uma cicatriz: a "branca" original não era vetor — era um PNG
de 179 × 82 embrulhado numa tag `<svg>` com `<pattern>`, e **recortado**: só
cabiam o `c`, o `2` e o `y`; as letras `ars` e `ou` ficavam fora do quadro. A
branca que usamos até 21/09 foi gerada do arquivo azul, com a tinta trocada,
só para o tema escuro não ficar sem marca.
