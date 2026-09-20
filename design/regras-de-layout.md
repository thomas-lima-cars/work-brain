# 📐 Regras de layout

> **O que já foi decidido sobre a cara dos painéis.** Escrito para não ter que
> redecidir a cada pedido, e para que um painel novo nasça parecido com os
> outros sem ninguém precisar lembrar.
>
> Cada regra traz o **porquê** — regra sem motivo é a primeira a ser revertida
> por engano. Onde há prova automática, está dito qual.
>
> Última atualização: **2026-09-18**.

---

## 1. Cartão

**Chip redondo com ícone no canto superior esquerdo, título ao lado, contagem
empurrada para a direita.** No tema escuro o cartão ganha uma **luz azul
radial no mesmo canto** (`--brilho`), que é o que dá profundidade ao vidro.

```html
<div class="cartao">
  <div class="cartao-topo">
    <span class="chip"><svg …></svg></span>
    <h2>Título</h2>
    <span class="dir"><span class="tag">contagem</span></span>
  </div>
  …
</div>
```

- O brilho é `none` no tema claro — lá ele viraria sujeira.
- O conteúdo precisa de `position:relative`, senão fica **debaixo** da luz.
- Raio 16px, sombra, `backdrop-filter` só no escuro.

⚠️ `justify-content:space-between` no cabeçalho separa o chip do próprio
título. O certo é `gap` + `margin-left:auto` na contagem.

## 2. KPI não é manchete

**Teto de 26px no número. Padding menor que o dos outros cartões.**

O número grande chama o olho primeiro e é o dado **menos** interessante da
página: um total sem recorte. Quem explica é o gráfico e a tabela. O realce do
KPI é **peso de fonte e número tabular**, não tamanho.

O aperto é **escopado** (`.g4 .cartao`, `.kpi`): cartão de gráfico, ranking e
tabela mantêm o respiro de 18px. Mexer no cartão global encolhe a página
inteira, que nunca é o pedido.

🔒 Provado em `design/_prova_modelos.js` e em `_prova-modelo.js` do
Radar de Estoque.

## 3. Gráfico: rótulo de dados por padrão, e aí o eixo Y sai

Valor no ponto e escala no eixo dizem a mesma coisa. Os dois juntos são ruído.

| situação | o que aparece |
|---|---|
| **padrão** | rótulo em cada ponto · **sem** eixo Y, sem linha de grade |
| **série contínua e densa**, sem níveis bem definidos | eixo Y com grade · **sem** rótulo |

A exceção existe porque em série densa o rótulo colide, e ali o que importa é
a **forma**, não o valor de cada ponto.

A escolha é **por medição**, não por palpite: estima-se a largura do texto
contra o espaço por ponto. `{rotulos:true|false}` força na mão e vence a
decisão automática.

**O eixo X fica nos dois casos** — ele diz *quando*, não *quanto*.

## 4. Glossário

**Peça obrigatória, bloco próprio, último da página. Nunca dentro de outro
cartão, nunca em outra tela.**

- Dentro do cartão da tabela, a posição diz "isto explica a tabela". Não
  explica: explica a página. E quem copiasse o modelo e apagasse a tabela
  levava o glossário junto.
- Como **segunda tela** (era assim no Radar de Estoque até 18/09) também não
  serve: referência que exige trocar de tela não é consultada. E **não precisa
  de botão no topo** — ele abre no próprio lugar. O endereço próprio
  (`#pg_gloss`) continua valendo: abrir o link nele já deixa o bloco aberto.
- Conteúdo vem do dado (`DADOS.glossario`), não do HTML.
- **Nasce FECHADO.** É referência: quem precisa, abre. Um `<details>` cujo
  cabeçalho inteiro é a área de clique — o cartão *é* o `<details>`.
- Quando tem várias seções, elas viram **subtítulos dentro do mesmo bloco**
  (`.gl-sub`), não cartões aninhados. Cartão dentro de cartão não é hierarquia,
  é moldura.

**Por que obrigatório:** quem recebe o painel não estava na conversa em que o
termo foi definido, e "deságio" não quer dizer a mesma coisa para todo mundo.
Termo que aparece na tela e não está no glossário é uma pergunta que chega por
mensagem depois.

🔒 A prova é **estrutural**: conta `<section>` abertas e fechadas antes do
glossário e exige que estejam equilibradas.

## 5. Topo

**Fixo, em superfície — não em barra colorida de marca.**

| posição | o que vai |
|---|---|
| esquerda | logo **e o título colado nela**, na mesma linha |
| direita | só a troca de tema (`margin-left:auto`) |

Barra sólida da cor da marca consome atenção o tempo todo e obriga a inverter
o contraste de tudo que está em cima dela. Superfície com `border-bottom`
resolve, e o acento sobra para o que é dado.

**O que NÃO vai no topo:**

- **Botão para o glossário.** Ele abre no próprio lugar, no fim da página.
- **"Gerado em".** Vai no rodapé, junto da descrição da base.
- **Título de seção** ("Aderência por veículo") e **subtítulo de recorte**.
  O título do painel já está no topo; repetir logo abaixo é redundância que
  come a primeira dobra.

⚠️ `display:flex` no `.topo` é obrigatório. Substituir a folha inteira e
esquecer dele faz a logo cair numa linha e o título noutra — aconteceu.

## 5b. Rodapé

**Só duas coisas, e é o último bloco da página:**

```
Atualizado em <data> · <descrição da base/recorte>
```

Nada de link, aviso ou legenda. O que precisa de explicação vai no glossário,
logo acima.

## 5c. Onde os filtros moram

| quantos filtros | onde |
|---|---|
| até ~3 controles simples | **no topo**, ao lado do título (é o caso do modelo) |
| mais que isso, ou com busca por texto | **gaveta suspensa**, com aba na lateral esquerda |

O Radar de Estoque usa a gaveta: são seis controles mais o "Limpar tudo", que
ocupavam a primeira dobra inteira e são consultados poucas vezes por sessão —
quem abre um painel quer ver o dado.

**A gaveta:** aba fixa na lateral esquerda, painel que desliza por cima, fecha
no ✕, no véu ou de novo na aba. A aba fica no **meio da altura**, que é onde a
mão já está; no topo ela brigaria com o cabeçalho fixo.

- A página e o topo reservam `padding-left` do tamanho da aba, para ela não
  cobrir conteúdo.
- Dentro da gaveta os filtros empilham numa coluna só.
- O estado mora **na própria gaveta** (`className`), não numa classe no
  `<body>` — o DOM de mentira do smoke só tem `querySelector`, e amarrar ao
  `<body>` tornaria o teste impossível sem motivo.
- Em tela estreita a aba vai para o rodapé da janela, na horizontal.

## 6. Filtros

**Grade de colunas iguais. Nunca `flex-wrap` com largura intrínseca.**

Com largura intrínseca cada `<select>` nasce do tamanho do texto mais longo da
lista: um fica gigante, outro minúsculo, e a linha quebra em lugar diferente a
cada coleta — o alinhamento passa a depender do **conteúdo**.

```css
.filtros{display:grid;gap:12px 14px;align-items:end;
         grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.fg select,.fg input,.fg button{width:100%}
```

## 7. Tema

**Dois temas saem de UM arquivo** (`design/tokens/tema.css`): `:root` para o
claro, `[data-tema="escuro"]` para o escuro. Dois arquivos irmãos divergem
sempre do mesmo jeito — o mais usado fica certo e o outro apodrece calado.

- **O tema do arquivo manda.** A troca **não** é gravada em `localStorage`:
  painel que vai por link precisa abrir igual para todo mundo, e arquivo
  chamado "claro" que abre escuro é armadilha.
- **O logo troca junto** — o azul da marca dá 1,65:1 no fundo escuro.
- **O botão é só o ícone**, quadrado, sem texto. O ícone mostra **para onde
  ele leva**, não onde você está: lua no tema claro, sol no escuro.
  - Em **SVG**, nunca `☀`/`☾` como caractere — viram emoji colorido em parte
    dos sistemas e o botão fica com a cara de outro produto.
  - **`aria-label` é obrigatório.** Sem texto visível e sem label, o leitor de
    tela anuncia apenas "botão". O rótulo descreve o destino
    (`Mudar para o tema escuro`), e o `title` dá a dica no mouse.
- `color-scheme: light|dark` é obrigatório, senão `<select>` e barra de
  rolagem seguem o modo do **sistema**, não o da página.
- **O papel da cor muda entre os temas.** `#1523A0` é texto no claro (11,8:1)
  e some no escuro; lá quem assume é `#487DEA` (4,99:1).

## 8. Tabela

O modelo **centraliza** as colunas. A exceção documentada é **tabela densa e
numérica**: número se compara pela direita, texto fica à esquerda.

O Radar de Estoque usa a exceção — nove colunas, quase todas número.

⚠️ O seletor do tema é `thead th` (especificidade 2). Sobrescrever com `th`
puro **não funciona**: o tema vence e a tabela inteira vai para o centro.

## 9. Offline

**CSS e logos dentro do arquivo. Zero requisição de rede.** O painel abre do
SharePoint, de um anexo, de um pendrive e com a VPN caída.

🔒 Provado com `performance.getEntriesByType('resource')` vazio.

⚠️ **Não serve como corpo de e-mail** — Outlook não tem variável CSS,
`backdrop-filter` nem `color-mix`. Para distribuir: SharePoint + link.

## 10. Cor

- Paleta oficial em `design/paletas/<produto>.json`, com o **papel** de cada
  cor, não só o hex.
- **Cor nova passa pelo medidor antes de entrar:**
  `node design/_contraste.js "#RRGGBB"`. AA pede 4,5:1 para texto e 3,0:1 para
  traço. O olho não dá conta: `#487DEA` sobre branco parece legível e dá 3,89.
- Cor que **você inventou** vai marcada como `derivados` no JSON, separada da
  marca, para virar pergunta à equipe em vez de virar fato por uso.

## 11. Como o arquivo é produzido

**Modelo é gerado de uma fonte só**, nunca mantido em duplicata:

```bash
node design/modelos/monta-modelos.js && node design/_prova_modelos.js
```

A prova confere **frescor**: arquivo de saída mais velho que a fonte reprova.
Já aconteceu de o gerador falhar, o HTML anterior continuar em disco e o teste
validar o arquivo errado com nota máxima.

### Nó de n8n é caso especial

Dentro do n8n não existe `require`, `fs` nem pasta do repo. A folha e os logos
**viajam como literal**, injetados por um script, e uma prova compara a cópia
com a fonte:

```bash
node automations/n8n-sdk/rel-veiculos/_aplica-modelo.js
node automations/n8n-sdk/rel-veiculos/_prova-modelo.js
```

O injetor **recusa** conteúdo com barra invertida, aspa simples ou `${` em vez
de escapar e torcer — o nó é transcrito à mão como string JSON, e foi assim
que o relatório saiu em branco em 10/09.

### Adotar o modelo num relatório que já existe

**Não renomeie as classes.** Mantenha os nomes e troque o que eles
**significam**: os tokens antigos viram apelido dos novos
(`--ac: var(--acento)`). Como `var()` dentro de custom property resolve na
hora do uso, o tema escuro passa a funcionar de graça em tudo que já usava
eles. Renomear 24 classes em 86 KB de gerador é muito risco para não mudar
nada na tela.

## 12. Prova de layout tem que rodar em layout

Três erros meus nesta sessão, todos da mesma família:

| assertiva | casou com |
|---|---|
| `/localStorage/` | o **comentário** que explica por que não usar |
| `/localStorage\s*(\.\|\[)/` | o **ponto final** da frase |
| `secTabela.includes('gloss')` | o **comentário** entre a tabela e o glossário |

Tire comentário antes de conferir código ou marcação.

E o que **só o navegador mostra**: altura em caixa `inline` não vale
(`display:block` em `<span>`), `color-scheme` ausente, colisão de rótulo,
tamanho de fonte que empata com o vizinho. Medir com `getComputedStyle` e
`getBoundingClientRect`, não olhar print reduzido.

---

## Onde cada coisa mora

| | |
|---|---|
| Tokens, componentes, os dois temas | `design/tokens/tema.css` |
| Modelos prontos | `design/modelos/` |
| Paleta e logo por produto | `design/paletas/` · `design/marca/` |
| Estas regras | este arquivo |
