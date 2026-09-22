# Fontes embutidas

Arquivos de fonte que viajam **dentro** do HTML, em base64.

## Por que embutir, e não puxar do Google Fonts

Regra 9 do [`../regras-de-layout.md`](../regras-de-layout.md): **zero requisição
de rede**. O painel abre do SharePoint, de um anexo, de um pendrive e com a VPN
caída. Um `<link>` para `fonts.googleapis.com` quebra nos quatro casos — e
quebra do pior jeito: a página abre, o texto aparece, e ninguém percebe que
está vendo a fonte errada.

Mesmo arranjo dos logos em `../marca/cars2you/`: o arquivo mora aqui, e o
`../modelos/monta-modelos.js` o converte para `data:` na hora de gerar.

## O que tem aqui

| arquivo | o que é | tamanho |
|---|---|---|
| `dm-sans-latin-variavel.woff2` | DM Sans, eixo de peso 100–1000, subconjunto **latino**, upright | 36.932 bytes (~48 KB em base64) |
| `DM-Sans-OFL.txt` | a licença, que a OFL exige que acompanhe a fonte | 4.502 bytes |

Baixado de `cdn.jsdelivr.net/npm/@fontsource-variable/dm-sans@5` em
2026-09-22. Assinatura `wOF2` conferida no download.

**Variável, e não um arquivo por peso.** O painel usa 400, 600, 650 e 700; em
arquivos separados seriam quatro downloads de ~25 KB cada. Um eixo contínuo num
arquivo só sai menor que dois pesos estáticos, e ainda cobre peso que ainda não
foi usado.

**Só o latino, e só o upright.** O subconjunto latino corta o cirílico, o grego
e o vietnamita, que este painel nunca vai escrever. Itálico ficou de fora
porque o modelo não usa: onde há `<i>`, o CSS declara `font-style:normal`. Se
um dia precisar de itálico de verdade, ele vem num segundo arquivo — o
navegador inclina a fonte sozinho, e o resultado é feio.

## 🔴 Medido depois de baixar: a DM Sans não tem algarismos tabulares

Eu a recomendei como a mais próxima da referência, e ela é. Mas medida na
tela, com `tabular-nums` e `font-feature-settings:"tnum"` ligados:

```
"1111" → 49,9 px        "8888" → 97,3 px
```

O `1` é metade da largura do `8`, e **nenhum dos dois recursos muda isso** —
o `tnum` não existe neste arquivo. Numa coluna de R$ e de km, o número dança
linha a linha.

Isso contradiz o que eu tinha afirmado antes ("todas têm algarismos
tabulares"), e a afirmação era de cabeça, não de medição. Fica aqui porque a
próxima pessoa que olhar a DM Sans vai fazer a mesma pergunta.

Existe conserto possível — servir só os algarismos de outra fonte por
`unicode-range`, ou aceitar números proporcionais em painel que não tenha
tabela. Nenhum dos dois foi feito.

## Onde ela é usada hoje

**Só no modelo de teste**, como uma das opções do seletor de fonte, e com o
defeito acima na etiqueta. Ela é candidata junto com o tema `vidro`; se os
dois forem aprovados, o `@font-face` sai do bloco temporário do
`monta-modelos.js` e passa a valer para os dois modelos de verdade.

O seletor **mede** cada fonte em vez de repetir rótulo escrito à mão — largura
de `1111` contra `8888` no DOM (com as mesmas opções que o painel usa) e a
descida do `3` no canvas. Etiqueta que sai de medição não envelhece nem mente.

## Licença

SIL Open Font License 1.1 — livre para embutir e redistribuir, inclusive em
material comercial. A licença **tem** que acompanhar a fonte, e é por isso que
o `.txt` está versionado aqui em vez de virar um link.
