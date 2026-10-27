# Logo — FENAUTO (com a Cars2You)

> Criada em 2026-10-26 a partir do PNG que o Thomas entregou (1076 × 199, fundo
> transparente, uma tinta só: `#403172`).

## Os arquivos

| arquivo | uso |
|---|---|
| `logo-fenauto-claro.svg` | **tema claro — a PRETA** (26/10): FENAUTO e Cars2You em `#242424` |
| `logo-fenauto-escuro.svg` | **tema escuro** — as duas em branco |
| `logo-fenauto-azul.svg` | 🔵 **guardada**, para usar depois (Thomas, 26/10): FENAUTO no roxo-azulado original `#403172`, Cars2You em `#3A4552`. É, byte a byte, a `logo-fenauto-claro.svg` de antes da troca |
| `logo-fenauto-original.svg` | só a FENAUTO, no roxo original — vetor do PNG |
| `_original-fenauto.png` | o PNG como chegou, fonte do traço |

Caixa das duas compostas: **1076 × 298,3** (3,61:1), `viewBox="0 8.1 1076 298.3"`.
O `y` começa em 8,1 porque o PNG tem 8 px de folga em cima — a caixa foi apertada
na tinta, medida com `getBBox`. A bbox medida bate com o `viewBox` (diferença de 0,1).

## Como foi montada

- **FENAUTO** é vetor de verdade, traçado do PNG com o `potracer` (porte do potrace em
  Python, ampliado 4× antes de traçar). Conferido contra o PNG no navegador:
  **125 pixels diferentes em 132.379 de tinta (0,09%)**, todos na borda.
- **Cars2You** é a extensa (`../cars2you/logo-cars2you-preto.svg`), com **40% da largura
  da FENAUTO** (430 de 1076), centrada, **36 de vão** abaixo da tinta da FENAUTO.
- **A preta (26/10) é `#242424` nas duas partes** — a tinta do C6 e o `--texto` do tema
  claro dele (`tema-c6.css`): no único painel que a usa (Eventos Fenauto C6) ela
  assenta na mesma tinta da logo do C6 ao lado. Uma cor só, e não o `#3A4552` da
  Cars2You, porque "logo preta" é uma tinta. Se a Fenauto for a um painel com a camada
  da Cars2You, conferir se o `#242424` ainda assenta ou se pede o `#3A4552`.
- Na azul guardada, a Cars2You fica no `#3A4552`, o "preto" da pasta dela.

## Por que a FENAUTO fica branca no escuro

O roxo `#403172` sobre o fundo escuro dos modelos (`#0B0D12`) tem **contraste 1,76**
(medido, WCAG 2.1) — some. No branco ele dá 11,05. É o mesmo caso do azul `#1523A0` da
Cars2You (1,65 no escuro). Mesma saída do IGA: tinta branca.
✅ **Decidido em 26/10 (Thomas): branca no escuro.** O roxo clareado foi considerado e
ficou de fora.

## Regerar

```
python traca.py _original-fenauto.png _traco-fenauto.txt     # precisa de: pip install potracer
node monta-logos.js _traco-fenauto.txt ../cars2you/logo-cars2you-preto.svg .
```

⚠️ O `potracer` traça o **False** do bitmap como tinta — por isso o `<= 127` no alfa.
Com `> 127` sai o negativo (fundo cheio, letras vazadas).
