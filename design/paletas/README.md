# Paletas por produto

Um JSON por produto, com as cores oficiais, o **papel** de cada uma e os
contrastes já medidos.

| arquivo | estado |
|---|---|
| [`cars2you.json`](cars2you.json) | ✅ preenchido e implementado em `../tokens/tema.css` |
| [`c6.json`](c6.json) | ✅ preenchido e implementado em `../tokens/tema-c6.css` — camada só de cor, por cima do `tema.css` (24/09) |
| `_modelo.json` | molde — copie pra criar um produto novo |
| `itau` · `dealers` · `lm` · `bradesco` | ⬜ sem paleta declarada |

## Por que JSON e não só CSS

O `tema.css` é a **implementação**: tem token semântico (`--negativo`), não cor
de marca. O JSON é o **registro**: diz de onde a cor veio, quem entregou,
quando, que papel ela tem e quanto ela mede de contraste.

Quando alguém perguntar "de onde saiu esse vermelho?", a resposta está no JSON.
Quando o painel precisar de um vermelho, ele usa o token.

## O papel importa mais que a cor

Repare que no `cars2you.json` o azul da marca tem papel **diferente em cada
tema**:

- no claro, `#1523A0` é o texto de acento (11,80:1) e `#487DEA` só preenche;
- no escuro, `#1523A0` some (1,65:1) e quem assume o acento é o `#487DEA`.

É por isso que o JSON guarda `papel` e não só `hex`. Trocar a cor sem olhar o
papel quebra a legibilidade num dos dois temas, e quase sempre no que a pessoa
não abriu.

## 🔵 Os derivados não são da marca

A paleta entregue **não tem verde**, e um painel precisa de "subiu / desceu".
Três cores foram inventadas e estão marcadas como `derivados` no JSON:

| cor | papel | por que existe |
|---|---|---|
| `#0E7C55` | positivo, tema claro | a paleta não tem cor de alta |
| `#35C08A` | positivo, tema escuro | o verde escuro some no fundo escuro |
| `#EF5B60` | negativo, tema escuro | `#7F1112` dá 1,8:1 no escuro — ilegível |

**Isso é decisão de marca, não minha.** Estão separados de propósito para
virarem pergunta à equipe em vez de virarem fato por uso.

## Medir antes de fixar

```bash
node design/_contraste.js "#487DEA"              # contra os dois fundos
node design/_contraste.js "#487DEA" "#FFFFFF"    # contra um fundo específico
```

AA pede **4,5:1** para texto normal e **3,0:1** para texto grande e traço de
interface. O olho não dá conta dessa conta: `#487DEA` sobre branco parece
perfeitamente legível e dá **3,89:1**.
