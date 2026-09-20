# 🎨 Design — identidade e modelos de painel

> **Aqui mora o visual dos painéis.** Marca, paleta e os dois modelos de
> dashboard que todo projeto novo copia em vez de inventar do zero.
>
> Criado em 18/09/2026, a partir dos arquivos que o Thomas entregou em
> `Downloads/Modelos_iniciais`.

## Por onde começar, pelo que você quer

| a tarefa é… | vá para |
|---|---|
| **saber como algo deve ficar** | 📐 [`regras-de-layout.md`](regras-de-layout.md) — o que já foi decidido |
| começar um painel novo | copie `modelos/dashboard-claro.html` (ou o escuro) pra pasta do projeto |
| mudar cor, espaçamento, cartão | [`tokens/tema.css`](tokens/tema.css) — e regere os modelos |
| subir logo de um produto | [`marca/`](marca/) — uma pasta por produto |
| registrar a paleta de um produto | [`paletas/`](paletas/) — um JSON por produto |
| saber se uma cor é legível | `node design/_contraste.js "#RRGGBB"` |
| conferir que não quebrei nada | `node design/_prova_modelos.js` |

## A pasta

```
design/
├── regras-de-layout.md    ← 📐 o que já foi decidido sobre a cara dos painéis
├── tokens/tema.css        ← FONTE ÚNICA do visual: cor, forma, os dois temas
├── modelos/
│   ├── _fonte/dashboard.html   molde (edite AQUI)
│   ├── monta-modelos.js        molde + tema → os dois arquivos
│   ├── dashboard-claro.html    ⚙️ gerado — não editar
│   └── dashboard-escuro.html   ⚙️ gerado — não editar
├── marca/<produto>/       logos e imagens, por produto
├── paletas/<produto>.json paleta e contrastes medidos, por produto
├── referencias/           o que inspirou; não entra em painel
├── _contraste.js          medidor WCAG de linha de comando
└── _prova_modelos.js      120 provas — roda antes de entregar
```

## Cinco regras

**1. Os modelos são gerados. Não edite `dashboard-claro.html`.**
Edite `modelos/_fonte/dashboard.html` ou `tokens/tema.css` e rode:

```bash
node design/modelos/monta-modelos.js && node design/_prova_modelos.js
```

Dois arquivos irmãos mantidos à mão divergem sempre do mesmo jeito: o que se
usa mais fica certo e o outro apodrece calado. Aqui a única diferença entre
eles é o `data-tema` do `<html>`.

**2. Painel é autossuficiente.** CSS embutido, logo em `data:` URI, zero
requisição de rede. Ele abre do SharePoint, de um anexo, de um pendrive e com
a VPN caída. A prova confere isso a cada execução.

**3. Todo painel tem glossário**, como bloco próprio e último da página —
nunca dentro de outro cartão. Quem recebe não estava na conversa em que o
termo foi definido.

**4. Gráfico traz rótulo de dados, e aí o eixo Y sai.** Os dois dizem a mesma
coisa. A exceção é série contínua e densa, onde o rótulo colide e o que importa
é a forma — aí volta o eixo. Detalhe em [`modelos/README.md`](modelos/README.md).

**5. Cor nova passa pelo medidor antes de entrar.** O olho erra: `#487DEA`
parece legível sobre branco e dá **3,89:1** — reprova em texto normal.

## O que vale pra QUEM VAI RECEBER o painel

- ⚠️ **Não serve como corpo de e-mail.** Outlook não tem variável CSS,
  `backdrop-filter` nem `color-mix`. O caminho é o que o IGA já faz:
  SharePoint + link. Continua em aberto no `estado-atual.md`.
- O painel imprime: há um bloco `@media print` que tira o vidro, solta o
  cabeçalho fixo e esconde os filtros.
- Responde de 360px a 1680px. Abaixo de 1100px as colunas caem para 2, abaixo
  de 620px para 1.
- Respeita quem desliga animação no sistema (`prefers-reduced-motion`).

## Em aberto

- 🔵 **Paleta por produto além da Cars2You.** Hoje só ela tem tema
  implementado. Um segundo produto com cara própria vira decisão: bloco de
  override no `tema.css`, ou gerar CSS a partir dos JSON. Não inventar antes
  de precisar.
- 🔵 **O verde não é da marca.** A paleta entregue não tem cor de "subiu", e
  painel precisa. Os três derivados estão marcados como tais em
  [`paletas/cars2you.json`](paletas/cars2you.json) — levar à equipe.
- 🟡 **Os logos são provisórios.** O Thomas vai mandar arquivos melhores. Os
  atuais são bitmap de 300×56 e escadeiam quando ampliados. Ver
  [`marca/cars2you/README.md`](marca/cars2you/README.md).
