# Logo — C6 Auto

> Criada em 2026-11-09 a partir do PNG que o Thomas mandou (250 × 250, a marca
> pequena no meio de um quadro branco, tinta preta). Pedido: "recorte somente a logo".

## Os arquivos

| arquivo | uso |
|---|---|
| `logo-c6-auto-preto.svg` | **tema claro**: `#242424`, a tinta do C6 (`tema-c6.css`) |
| `logo-c6-auto-branco.svg` | **tema escuro**: branca |
| `_original-c6-auto.png` | o PNG como chegou |
| `_recorte-c6-auto.png` | só a logo (116 × 27), com a tinta virada em alfa: a fonte do traço |
| `_traco-c6-auto.txt` | o caminho que o `potracer` devolveu |

Caixa: **112,2 × 22,9** (4,9:1), `viewBox="2.1 1.5 112.2 22.9"`. Medida com
`getBBox` no navegador (2,64 · 2,00 · 111,12 × 21,92) e apertada com meio
ponto de folga.

## Como foi montada

- **Recorte:** a tinta é `alfa × (1 − luminância)`, cortada onde passa de 8/255,
  com 2 px de folga. A tinta ocupa 116 × 27 px do PNG de 250.
- **Vetor:** `../fenauto/traca.py` (o `potracer`, ampliado 4× antes de traçar).
  Saem 9 contornos: C, 6 (com o furo), A (com o furo), u, t, o (com o furo).
  Conferido contra o PNG no navegador, ampliado: mesmo desenho. O PNG tem só
  27 px de altura, então curva fina (o "t", o "o") é a leitura do potrace, não a
  arte original. **Se o C6 mandar a logo em vetor, ela substitui esta.**
- **No painel** (Eventos Fenauto C6) ela vai inline, numa cópia só, sem `fill`:
  a cor de cada tema é CSS, como a Fenauto.

## Regerar

```
python ../fenauto/traca.py _recorte-c6-auto.png _traco-c6-auto.txt
```

e montar os dois SVG com o caminho, `fill-rule="evenodd"` e o `viewBox` acima.
