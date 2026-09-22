# 📐 Kit de Painel — Cars2You

> **Este arquivo é autossuficiente.** Ele traz o tema inteiro, o esqueleto do
> HTML e o porquê de cada decisão. Você não precisa de acesso a nenhum
> repositório para usá-lo: baixe, jogue na pasta do seu projeto, e pronto.
>
> Serve para que um painel novo nasça **parecido com os outros** sem ninguém
> precisar lembrar de nada.

---

## Como usar com o Claude

Ponha este arquivo na pasta do seu projeto e diga ao Claude:

> Leia `kit-de-painel.md` e monte o painel seguindo ele. Não invente cor,
> espaçamento nem estrutura que não estejam ali.

Se o projeto tiver `CLAUDE.md`, vale mais ainda acrescentar uma linha lá:

```markdown
Antes de mexer no visual de qualquer painel, leia `kit-de-painel.md`.
As decisões já estão tomadas — não redecida.
```

**Para o Claude que está lendo isto:** as regras abaixo são decisões já
tomadas, com o custo de cada uma registrado. Elas não são sugestões. Quando
uma delas atrapalhar o pedido do usuário, **diga qual regra atrapalha e por
quê**, em vez de contorná-la em silêncio — foi o silêncio que gerou metade
dos defeitos listados aqui.

---

## O contrato — as sete coisas inegociáveis

| | regra | por quê |
|---|---|---|
| 1 | **Zero requisição de rede.** CSS e imagem dentro do arquivo, logo em `data:` URI | o painel abre do SharePoint, de um anexo, de um pendrive e com a VPN caída |
| 2 | **Nenhuma cor solta no HTML.** Se a cor não é token, ou vira token, ou não deveria estar sendo usada | cor escrita à mão é a que ninguém acha quando o tema muda |
| 3 | **Cor nova passa pelo medidor** antes de entrar | o olho erra: `#487DEA` parece legível sobre branco e dá **3,89:1** — reprova |
| 4 | **Todo painel tem glossário**, bloco próprio, último da página | quem recebe não estava na conversa em que o termo foi definido |
| 5 | **Dois temas saem de UM arquivo** | dois arquivos irmãos divergem sempre: o mais usado fica certo, o outro apodrece calado |
| 6 | **O tema do arquivo manda** — a troca não é gravada | painel que vai por link precisa abrir igual para todo mundo |
| 7 | **Prova de layout roda em layout**, não em leitura de código | altura de caixa `inline`, colisão de rótulo e `color-scheme` ausente só aparecem no navegador |

⚠️ **Este painel não serve como corpo de e-mail.** Outlook não tem variável
CSS, `backdrop-filter` nem `color-mix`. Para distribuir: hospede e mande o
link.

---

## O esqueleto

Cole isto e preencha. A ordem dos blocos é parte do desenho — KPIs, conteúdo,
glossário, rodapé.

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nome do Painel</title>
<style>/* ← o tema inteiro, colado aqui. Ver a seção "O tema" */</style>
</head>
<body>

<header class="topo">
  <div class="topo-in">
    <!-- São DUAS larguras (regra 5a), e as duas trocam de COR com o tema.
         O <span> é obrigatório: ele é UM filho da grade de três colunas;
         soltas, as duas <img> virariam um quarto filho e o título sairia
         do centro.
         `src` nasce vazio de propósito: quem preenche é o script, porque a
         arte depende do tema. As artes da Cars2You estão no fim deste
         arquivo, prontas para colar — para outro produto, ver
         "Trocar de marca". -->
    <span class="marca">
      <img class="logo logo-extensa" id="logo" src="" alt="Cars2You">
      <img class="logo logo-curta" id="logo-curta" src="" alt="Cars2You">
    </span>
    <div class="topo-tit">
      <h1>Nome do Painel</h1>
      <p class="sub">recorte, período, base</p>
    </div>
    <div class="topo-acoes">
      <button class="ctrl so-icone" id="tema"
              aria-label="Mudar para o tema escuro" title="Mudar para o tema escuro">
        <svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
      </button>
    </div>
  </div>
</header>

<main class="area">

  <!-- 1. faixa de KPI — quatro no máximo -->
  <section class="g4">
    <div class="cartao">
      <div class="cartao-topo">
        <span class="chip"><svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 4-6"/></svg></span>
        <h2>Rótulo</h2>
      </div>
      <div class="kpi-val num">1.221</div>
      <div class="kpi-delta sobe">▲ 4,2%</div>
    </div>
    <!-- … -->
  </section>

  <!-- 2. o conteúdo: gráfico, ranking, tabela -->
  <section class="g2">
    <div class="cartao">
      <div class="cartao-topo">
        <span class="chip"><svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 4-6"/></svg></span>
        <h2>Título</h2>
        <span class="dir"><span class="tag">contagem</span></span>
      </div>
      <div class="rolo"><table>…</table></div>
    </div>
    <div class="cartao">…</div>
  </section>

  <!-- 3. glossário — SEMPRE, e sempre por último antes do rodapé -->
  <details class="cartao gloss">
    <summary class="cartao-topo">
      <span class="chip"><svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 4-6"/></svg></span>
      <h2>Glossário</h2>
      <span class="dir"><span class="seta">▼</span></span>
    </summary>
    <dl>
      <dt>Termo</dt><dd>O que quer dizer aqui.</dd>
    </dl>
  </details>

  <!-- 4. rodapé: duas coisas, e nada mais -->
  <p class="rodape">Atualizado em 22/09/2026 · descrição da base e do recorte</p>

</main>

<script>
/* As quatro artes da marca. O bloco inteiro está no fim deste arquivo,
   em "As artes da marca" — cole-o aqui. */
const LOGO = {
  claro:  { extensa: '…', curta: '…' },
  escuro: { extensa: '…', curta: '…' }
};

/* A troca de tema NÃO é gravada. Ver a regra 6 do contrato.
   Quem troca a COR da marca é aqui; quem troca a LARGURA é o CSS. */
function aplicaTema(t) {
  document.documentElement.setAttribute('data-tema', t);
  document.getElementById('logo').src = LOGO[t].extensa;
  document.getElementById('logo-curta').src = LOGO[t].curta;
  var destino = t === 'escuro' ? 'claro' : 'escuro';
  var b = document.getElementById('tema');
  b.setAttribute('aria-label', 'Mudar para o tema ' + destino);
  b.setAttribute('title', 'Tema ' + destino);
}
document.getElementById('tema').onclick = function () {
  aplicaTema(document.documentElement.getAttribute('data-tema') === 'escuro'
    ? 'claro' : 'escuro');
};
/* O tema inicial é o declarado no <html>; sem atributo, é o claro. */
aplicaTema(document.documentElement.getAttribute('data-tema') || 'claro');
</script>
</body>
</html>
```

---

## As regras, e o que cada uma custou

### 1. Cartão

Chip redondo com ícone à esquerda, título ao lado, contagem empurrada para a
direita com `margin-left:auto`.

⚠️ **Não use `justify-content:space-between` no cabeçalho** — ele separa o chip
do próprio título. `gap` + `margin-left:auto` na contagem.

⚠️ O conteúdo precisa de `position:relative` (já está em `.cartao > *`), senão
fica **debaixo** da luz do canto.

### 2. KPI não é manchete

**Teto de 26px no número** (hoje ele está em 23px), **e padding menor que o dos
outros cartões.**

O número grande chama o olho primeiro e é o dado **menos** interessante da
página: um total sem recorte. Quem explica é o gráfico e a tabela. O realce do
KPI é **peso de fonte e número tabular** (`class="num"`), não tamanho.

O aperto é **escopado** (`.g4 .cartao`). Mexer no `.cartao` global encolhe a
página inteira, que nunca é o pedido.

### 3. Gráfico: rótulo de dados por padrão, e aí o eixo Y sai

Valor no ponto e escala no eixo dizem a mesma coisa. Os dois juntos são ruído.

| situação | o que aparece |
|---|---|
| **padrão** | rótulo em cada ponto · **sem** eixo Y, sem grade |
| **série contínua e densa**, sem níveis definidos | eixo Y com grade · **sem** rótulo |

A exceção existe porque em série densa o rótulo colide, e ali o que importa é
a **forma**, não o valor de cada ponto. Decida **medindo** a largura do texto
contra o espaço por ponto, não por palpite.

**O eixo X fica nos dois casos** — ele diz *quando*, não *quanto*.

### 4. Glossário

**Peça obrigatória, bloco próprio, último da página. Nunca dentro de outro
cartão, nunca em outra tela.**

- Dentro do cartão da tabela, a posição diz "isto explica a tabela". Não
  explica: explica a página. E quem copiasse o modelo e apagasse a tabela
  levava o glossário junto.
- Como **segunda tela** também não serve: referência que exige trocar de tela
  não é consultada. E **não precisa de botão no topo** — ele abre no próprio
  lugar.
- **Nasce FECHADO.** É referência: quem precisa, abre.
- Várias seções viram **subtítulos dentro do mesmo bloco**, não cartões
  aninhados. Cartão dentro de cartão não é hierarquia, é moldura.

**Duas formas, escolha pelo volume.** As duas preenchem a largura do cartão —
o que não vale é deixar metade dele em branco.

| verbetes | forma | CSS |
|---|---|---|
| poucos, definição curta | grade de duas colunas: termo à esquerda, definição à direita | é o que vem no tema (`.gloss dl`) |
| muitos, ou com tabela dentro | fluxo em colunas, termo acima da definição | o bloco abaixo |

```css
.gloss dl{ padding-left:44px;          /* 34 do chip + 10 do intervalo */
           columns:2 34em; column-gap:44px;
           display:block }             /* desfaz a grade do tema */
.gloss dt{ break-inside:avoid; break-after:avoid }
.gloss dd{ break-inside:avoid; break-before:avoid }
@media(max-width:620px){ .gloss dl{ padding-left:0 } }
```

`columns:<contagem> <largura>` é **no máximo** N colunas, cada uma com **pelo
menos** aquela largura: onde não cabem duas, vira uma sozinha. Sem media
query, e a medida da linha nunca passa do legível.

Os três `break-*` **juntos** fazem o verbete inteiro — termo, definições e
tabela — virar um bloco que a coluna leva junto ou não leva. Só `break-inside`
deixa o termo no pé de uma coluna e a tabela que o explica desgarrada na
outra, 300px abaixo. **Aconteceu.**

**Uma margem esquerda só.** O subtítulo de seção leva um chip de ícone, e o
chip empurrava o *texto* do subtítulo para dentro enquanto termo, definição e
tabela começavam colados na borda — duas verticais diferentes alternando a
cada seção. O chip fica na margem, e todo o resto nasce na mesma vertical.

**Por que obrigatório:** quem recebe o painel não estava na conversa em que o
termo foi definido, e "deságio" não quer dizer a mesma coisa para todo mundo.
Termo que aparece na tela e não está no glossário é uma pergunta que chega por
mensagem depois.

### 4b. Bloco retrátil

Bloco que se abre e fecha é `<details>` **sendo** o cartão — não um cartão com
um `<details>` dentro. O `<summary>` recebe a classe do cabeçalho, e o
cabeçalho inteiro vira área de clique.

```css
.gloss,.dobra{ padding:0 }
.gloss>summary,.dobra>summary{ cursor:pointer; list-style:none;
                               padding:18px; border-radius:var(--r-g) }
.gloss>summary::-webkit-details-marker,
.dobra>summary::-webkit-details-marker{ display:none }
.gloss[open] .seta,.dobra[open] .seta{ transform:rotate(180deg) }
```

**As regras são compartilhadas por seletor, não copiadas.** Folha duplicada
significa um dos dois blocos apodrecendo calado na próxima mexida.

| bloco | nasce | por quê |
|---|---|---|
| glossário | **fechado** | é referência: quem precisa, abre |
| detalhe da seleção | **aberto** | é o motivo de ter clicado |

O estado **não** é guardado: o bloco é reescrito a cada render, e guardar
custaria uma variável para economizar um clique.

### 4c. Resumo mora junto do que ele resume

Caixa de contexto ("você selecionou X") a uma tela de distância do bloco que
detalha X é a mesma frase escrita duas vezes, em dois lugares que divergem na
próxima mexida. O resumo vai **dentro** do bloco, e sem repetir o que o título
do bloco já diz.

Quando a seleção **não** tem bloco de detalhe, aí sim a caixa própria se
justifica — e só para esse caso.

### 5. Topo

**Três colunas, e o título fica no meio.**

| posição | o que vai |
|---|---|
| esquerda | só a logo |
| **centro** | **o título do painel, centrado, a 22px** |
| direita | as ações — troca de tema, e o ícone de aviso antes dela |

**Por que grade e não flex:** com flex o centro do título depende da largura da
logo e de quantas ações houver na direita — basta um botão a mais para ele
escorregar. `1fr auto 1fr` prende o meio no meio da barra.

**Por que 22px:** o nome do painel é a primeira coisa que se lê. Em 17px ele
perdia para o número do KPI logo abaixo, que é o dado **menos** interessante
da página (regra 2). Hierarquia invertida.

**O topo não tem fundo nenhum** — nem cor, nem borda, nos dois temas. O fundo
da página passa por ele inteiro. Barra sólida da cor da marca consome atenção
o tempo todo e obriga a inverter o contraste de tudo que está em cima dela.

⚠️ **O `backdrop-filter` fica, e não é enfeite.** O topo é `sticky`: rolando a
página, o conteúdo passa por baixo dele. Sem fundo e sem blur, o título
ficaria por cima de texto nítido em movimento.

⚠️ **Um `display` explícito no `.topo-in` é obrigatório.** Substituir a folha
inteira e esquecer dele faz a logo cair numa linha e o título noutra —
aconteceu.

**O que NÃO vai no topo:** botão para o glossário (ele abre no próprio lugar) ·
"gerado em" (vai no rodapé) · título de seção e subtítulo de recorte (o título
do painel já está ali; repetir logo abaixo come a primeira dobra).

### 5a. A marca tem duas larguras

**Extensa na web, curta no telefone** — artes diferentes, não a mesma
encolhida. Encolher não resolve: a 18px de altura a extensa ainda ocupa
**100px de uma barra de 360**, e o título quebra em uma palavra por linha. A
curta, na mesma altura, ocupa 39 — e por isso pode ser **mais alta** e ainda
assim caber melhor.

🔴 **As duas vivem dentro de UM invólucro.** Soltas, seriam dois filhos do
`.topo-in`, e a grade de três colunas viraria de quatro: o título sai do
centro.

**Quem troca a arte é o CSS; quem troca a cor é o JS.** A largura é `@media`,
então sobrevive a imprimir, a redimensionar e a rodar sem script, e não pisca
na carga. A cor depende do tema, que é estado do documento.

A escondida sai da árvore de acessibilidade com o `display:none`, então as duas
podem levar o mesmo `alt` sem repetir no leitor de tela.

⚠️ **SVG sem `viewBox` não escala.** Num `<img>` com `height:26px` a arte é
**cortada**, não reduzida. Cinco de seis arquivos de marca chegaram assim.
Meça a caixa com `getBBox` no navegador e escreva o `viewBox` — não estime.

**Aviso de coleta vira ícone, não cartão.** Query que falhou, registro
descartado, teto batido: tudo isso vive num ícone no topo, antes da troca de
tema, e conta o resto numa dica. Um cartão de largura inteira cobrava a
primeira dobra **todos os dias** para dizer, quase sempre, a mesma coisa. O
ícone nasce escondido e no dia limpo não ocupa nada.

### 5b. Rodapé

**Só duas coisas, e é o último bloco:**

```
Atualizado em <data> · <descrição da base/recorte>
```

Nada de link, aviso ou legenda. O que precisa de explicação vai no glossário,
logo acima.

### 5c. Onde os filtros moram

| quantos filtros | onde |
|---|---|
| até ~3 controles simples | **no topo**, ao lado do título |
| mais que isso, ou com busca por texto | **gaveta suspensa**, com aba na lateral esquerda |

Seis controles ocupavam a primeira dobra inteira e eram consultados poucas
vezes por sessão — quem abre um painel quer ver o dado.

**A gaveta:** aba fixa na lateral esquerda, painel que desliza por cima, fecha
no ✕, no véu ou de novo na aba. A aba fica no **meio da altura**, que é onde a
mão já está; no topo ela brigaria com o cabeçalho fixo. A página reserva
`padding-left` do tamanho da aba, para ela não cobrir conteúdo.

### 6. Filtros

**Grade de colunas iguais. Nunca `flex-wrap` com largura intrínseca.**

Com largura intrínseca cada `<select>` nasce do tamanho do texto mais longo da
lista: um fica gigante, outro minúsculo, e a linha quebra em lugar diferente a
cada carga — o alinhamento passa a depender do **conteúdo**.

```css
.filtros{ display:grid; gap:12px 14px; align-items:end;
          grid-template-columns:repeat(auto-fit,minmax(200px,1fr)) }
.fg select,.fg input,.fg button{ width:100% }
```

### 7. Tema

- **O tema do arquivo manda.** A troca **não** vai para `localStorage`: painel
  que vai por link precisa abrir igual para todo mundo, e arquivo chamado
  "claro" que abre escuro é armadilha.
- **O logo troca junto** — o azul da marca dá 1,65:1 no fundo escuro.
- **O botão é só o ícone**, quadrado, sem texto. O ícone mostra **para onde ele
  leva**, não onde você está: lua no claro, sol no escuro.
  - Em **SVG**, nunca `☀`/`☾` como caractere — viram emoji colorido em parte
    dos sistemas e o botão fica com a cara de outro produto.
  - **`aria-label` é obrigatório.** Sem texto visível e sem label, o leitor de
    tela anuncia apenas "botão".
- **`color-scheme` é obrigatório**, senão `<select>` e barra de rolagem seguem
  o modo do **sistema**, não o da página.
- **A forma é uma só nos dois temas.** Os raios ficam no bloco comum. Dois
  raios diferentes nos dois temas do mesmo sistema é a divergência que ninguém
  vê até pôr os dois lado a lado.

🔴 **Regra escrita à mão escolhe o tema pelo NEGATIVO.** O claro é o padrão e
vale também quando não há `data-tema` nenhum:

```css
:root:not([data-tema="escuro"]) .topo{ … }   /* ✅ pega o claro e o sem-atributo */
[data-tema="claro"] .topo{ … }               /* ❌ documento sem atributo fica de fora */
```

Com o seletor do atributo, um documento sem `data-tema` ficaria com os
**tokens** do claro e as **regras** do escuro — meio tema, e ninguém percebe.

### 8. Tabela

O tema **centraliza** as colunas. A exceção documentada é **tabela densa e
numérica**: número se compara pela direita, texto fica à esquerda.

⚠️ O seletor do tema é `thead th` (especificidade 2). Sobrescrever com `th`
puro **não funciona**: o tema vence e a tabela inteira vai para o centro.

### 8b. Dica (tooltip)

Detalhe que só interessa a uma linha de cada vez mora numa **dica**, não numa
tabela fixa em cima. Um bloco de referência longe de onde se usa obriga a
decorar o número e descer comparando de memória.

**Um balão só para a página inteira**, preenchido na hora. Um balão por alvo,
escondido no HTML, multiplica o peso da página por cada linha.

```css
.dica{ position:fixed; pointer-events:none;
       width:max-content; max-width:min(700px,94vw) }
```

- **`fixed`, nunca `absolute`.** Tabela longa mora dentro de caixa com
  `overflow:auto`, e balão absoluto dentro dela é cortado na borda — nasce
  pela metade ou invisível. Quem posiciona é o JS, por `getBoundingClientRect`.
- **`pointer-events:none`.** O balão nasce por cima do que o abriu: sem isso
  ele rouba o mouse do alvo, o alvo recebe `mouseleave`, o balão some, o mouse
  volta — e a tela **pisca sozinha**.
- **`width:max-content`.** Com largura fixa a coluna de texto quebra em quatro
  linhas por item e o balão sai pela base da tela.
- **Abre por `hover`, por `focus` e por clique.** Só hover deixa de fora quem
  abre no telefone e quem navega por teclado.

### 9. Cor

**Cor nova passa pelo medidor antes de entrar.** AA pede **4,5:1** para texto
normal e **3,0:1** para traço de interface e texto grande.

**Mede contra o pior plano, não contra branco.** O cartão tem degradê, mais
escuro no canto superior esquerdo — e é ali que ficam o chip e o título de
cada cartão. Os três planos reais:

```
cartão  #E3E8EC (canto sup. esq.)  →  #FDFEFE (canto inf. dir.)
campo   #D8E1E9  (a página, fora de cartão)
```

Foi assim que o verde antigo passou a reprovar: **5,16:1 sobre branco**,
**4,22:1 no canto** — exatamente onde o KPI escreve "▲ 4,2%".

**Texto sobre o campo também passa pelo medidor.** Quase todo texto mora dentro
de cartão e a pergunta não aparece. O subtítulo do topo é a exceção: desde que
o cabeçalho perdeu o fundo, ele cai direto no campo. Use `--texto-2`, nunca
`--texto-3` — a de-ênfase dá 3,19:1 ali.

**O acento não é o azul da marca.** `--acento` é o mesmo cinza escuro do texto
— é ele que pinta chip, ícone e barra de título. O azul da marca vive em
`--acento-cheio` e pinta **só o dado**: linha de gráfico, ponto, barra de
ranking. Uma cor por página, na parte que importa.

⚠️ **Consequência em aberto:** link perdeu a cor que o distinguia do texto
corrido. Onde houver link em texto, ele precisa se anunciar por
**sublinhado** — não há mais diferença de cor para carregar esse trabalho.

### 10. Prova de layout tem que rodar em layout

Três erros da mesma família, todos em provas que liam **código** em vez de
**tela**:

| a assertiva | casou com |
|---|---|
| `/localStorage/` | o **comentário** que explicava por que não usar |
| `/localStorage\s*(\.\|\[)/` | o **ponto final** da frase |
| `secao.includes('gloss')` | o **comentário** entre a tabela e o glossário |

**Tire comentário antes de conferir código ou marcação.**

E o que **só o navegador mostra**: altura em caixa `inline` não vale
(`display:block` em `<span>`), `color-scheme` ausente, colisão de rótulo,
tamanho de fonte que empata com o vizinho. Meça com `getComputedStyle` e
`getBoundingClientRect` — **não olhe print reduzido**.

⚠️ **Seletor descendente onde cabia filho** é a armadilha desta família.
`.xk span{display:block}` foi escrito para o rótulo do bloco e passou a pegar
todo `<span>` de dentro dele — inclusive os que rotulam cada telefone, que
viraram uma coluna em vez de uma lista horizontal. Use `>` quando o alvo é o
filho direto.

---

## Trocar de marca

O tema vem com a paleta Cars2You. Para outro produto, **troque só o bloco 1**
(a paleta da marca) e meça de novo — o resto dos tokens é derivado e continua
valendo.

```css
:root{
  --marca-azul:       #1523A0;  /* primária  */
  --marca-azul-claro: #487DEA;  /* acento    */
  --marca-cinza:      #E4E6E6;  /* divisória */
  --marca-vinho:      #6F4047;  /* atenção   */
  --marca-vermelho:   #7F1112;  /* negativo  */
}
```

**Cor que você inventou vai marcada como derivada**, separada da marca, para
virar pergunta à equipe em vez de virar fato por uso. A paleta Cars2You não
tem verde, e painel precisa de "subiu/desceu" — por isso `--d-verde` e os
outros dois estão marcados como derivados, não como marca.

### O medidor, para colar onde precisar

Salve como `contraste.js` e rode `node contraste.js "#RRGGBB" "#E3E8EC"`:

```js
/* Contraste WCAG 2.1 entre duas cores.
   Existe para medir ANTES de fixar a cor: #487DEA parece legível sobre
   branco e dá 3,89:1 — reprova. */
const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255)
    .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contraste = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const [, , cor, fundo] = process.argv;
const planos = fundo ? { [fundo]: fundo } : {
  'canto escuro do cartão': '#E3E8EC',
  'canto claro do cartão':  '#FDFEFE',
  'campo (fora de cartão)': '#D8E1E9',
  'fundo do tema escuro':   '#0B0D12',
};
for (const [nome, f] of Object.entries(planos)) {
  const r = contraste(cor.toUpperCase(), f.toUpperCase());
  console.log('  %s sobre %s  %s:1  %s', cor, nome.padEnd(24),
    r.toFixed(2).padStart(6),
    r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'só traço/texto grande' : 'REPROVA');
}
```

---

## Checklist antes de entregar

- [ ] Abre **sem rede**? (`performance.getEntriesByType('resource')` vazio)
- [ ] Os **dois temas** abrem certos, e a troca não grava nada?
- [ ] Toda cor nova **passou pelo medidor**, contra o canto escuro do cartão?
- [ ] Tem **glossário**, como bloco próprio e último antes do rodapé?
- [ ] O **título está no centro, a 22px**, e o número do KPI **não passa de
      26px**? (os dois são próximos de propósito — o que não pode é o KPI
      disparar e virar manchete)
- [ ] O rodapé tem **só** data e descrição da base?
- [ ] Testou em **360px** de largura? (as colunas caem em 1100 e em 620)
- [ ] A marca tem as **duas larguras**, dentro de um invólucro só, e o
      `viewBox` de cada SVG saiu de medição?
- [ ] `aria-label` no botão de tema e em todo botão só de ícone?
- [ ] Mediu com `getComputedStyle` — **não** olhando print?
- [ ] Imprime? (há um `@media print` que tira o vidro e solta o cabeçalho)

---

## O que este kit NÃO resolve

- **E-mail.** Outlook não tem variável CSS, `backdrop-filter` nem
  `color-mix`. Hospede e mande o link.
- **Paleta de um segundo produto.** Só a Cars2You tem tema implementado.
  Produto com cara própria vira decisão — não invente antes de precisar.
- **Link em texto corrido.** Está em aberto: com o acento cinza, link precisa
  de sublinhado, e ainda não há regra escrita para isso.
- **Fonte.** O tema usa a fonte do sistema. Uma fonte própria precisa vir
  embutida em base64 (regra 1) e **ter algarismos tabulares medidos**, não
  presumidos — foi assim que uma candidata boa foi recusada: `"1111"` media
  49,9px e `"8888"` media 97,3px, e nem `tabular-nums` nem
  `font-feature-settings:"tnum"` mudavam isso.

---

## As artes da marca — Cars2You

Quatro artes, **duas larguras × duas cores**, em `data:` URI. Cole o bloco
inteiro no lugar do `const LOGO` do esqueleto.

| | claro | escuro |
|---|---|---|
| **extensa** — 933 × 168 (5,55:1) | `#3A4552` | `#FFFFFF` |
| **curta** (`c2y`) — 990 × 454 (2,18:1) | `#3A4552` | `#FFFFFF` |

O **`#3A4552` não é preto**: é exatamente o `--texto` e o `--acento` do tema
claro. Marca e letra da página são a mesma tinta, e é por isso que ela assenta
em vez de saltar.

São SVG, e cada um já traz o `viewBox` — sem ele a arte seria **cortada** em
vez de reduzida (regra 5a). São ~13 KB no total, e viajam dentro do arquivo
porque a regra 1 não admite requisição de rede.

```js
__LOGOS__
```

**Para outro produto:** troque as quatro por artes do produto, mantendo a
estrutura — e meça a caixa de cada SVG antes de escrever o `viewBox`.

## O tema, inteiro

Cole o bloco abaixo dentro de `<style>` no `<head>`. Ele traz os dois temas,
todos os componentes e os comentários que explicam cada decisão.

```css
__TEMA_CSS__
```
