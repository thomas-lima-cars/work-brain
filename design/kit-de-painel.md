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
const LOGO = {
  claro: {
    extensa: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTMzIDE2OCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIwIiB5PSIxNCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiLz48L2NsaXBQYXRoPjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjY2xpcDApIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjAgLTE0KSI+PHBhdGggZD0iTTU0MC40MTggNjMuOTcwMyA1NDAuNDE4IDM4Ljk4NTEgNDY1LjQ2MyAzOC45ODUxIDQ2NS40NjMgMTQgNTQwLjQxOCAxNCA1NDAuNDE4IDM4Ljk4NTEgNTY1LjQwMyAzOC45ODUxIDU2NS40MDMgNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDNaTTQ2NS40NjMgMTM4LjkyNiA0NjUuNDYzIDg4Ljk1NTQgNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggMTEzLjk0MSA1NjUuNDAzIDExMy45NDEgNTY1LjQwMyAxMzguOTI2IDQ2NS40NjMgMTM4LjkyNlpNNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDMgNTQwLjQxOCA4OC45NTU0IDQ5MC40NDggODguOTU1NFoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNMzE5Ljc0OSA0My4zODI1IDMxNC43NTIgNjQuMDcwMkMzMTAuMzU1IDYxLjc3MTYgMzAzLjk1OSA2MC41NzIzIDI5OC44NjIgNjAuNTcyMyAyODUuNTcgNjAuNTcyMyAyNzYuMDc1IDY5Ljk2NjcgMjc2LjA3NSA4Ni4yNTdMMjc2LjA3NSAxMzguOTI2IDI1NS4xODggMTM4LjkyNiAyNTUuMTg4IDQzLjE4MjYgMjc1Ljg3NSA0My4xODI2IDI3NS44NzUgNTMuOTc2MkMyODIuMTcyIDQ0Ljg4MTYgMjkxLjk2NiA0MC42ODQxIDMwMy42NTkgNDAuNjg0MSAzMTUuMzUyIDQwLjY4NDEgMzE0Ljk1MiA0MS40ODM2IDMxOS43NDkgNDMuMzgyNVoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNNDA0LjE5OSA2Ny4xNjg0QzM5OC40MDIgNjMuNTcwNSAzODYuNTEgNTguOTczMiAzNzQuNjE3IDU4Ljk3MzIgMzYyLjcyNCA1OC45NzMyIDM1Ni41MjcgNjMuNTcwNSAzNTYuNTI3IDcwLjM2NjUgMzU2LjUyNyA3Ny4xNjI0IDM2My41MjMgNzguOTYxMyAzNzIuMzE4IDgwLjI2MDZMMzgyLjIxMiA4MS43NTk3QzQwMy4xIDg0Ljc1NzkgNDE1LjQ5MiA5My42NTI2IDQxNS40OTIgMTEwLjA0MyA0MTUuNDkyIDEyNi40MzMgMzk5LjUwMiAxNDEuMzI0IDM3MS45MTggMTQxLjMyNCAzNDQuMzM1IDE0MS4zMjQgMzQ0LjgzNCAxMzkuNDI1IDMzMC44NDMgMTI5LjAzMkwzNDAuNTM3IDExMy4zNDFDMzQ3LjQzMyAxMTguNjM4IDM1Ni41MjcgMTIzLjEzNSAzNzIuMTE4IDEyMy4xMzUgMzg3LjcwOSAxMjMuMTM1IDM5My45MDUgMTE4LjYzOCAzOTMuOTA1IDExMS40NDIgMzkzLjkwNSAxMDQuMjQ2IDM4OC43MDggMTAyLjQ0NyAzNzcuMzE1IDEwMC44NDhMMzY3LjMyMSA5OS41NDkxQzM0Ni4xMzQgOTYuNjUwOCAzMzQuODQgODYuODU2NiAzMzQuODQgNzEuNDY1OCAzMzQuODQgNTYuMDc1IDM1MC4wMzEgNDAuNzg0MSAzNzQuNDE3IDQwLjc4NDEgMzk4LjgwMiA0MC43ODQxIDQwMy4zIDQ0LjQ4MTkgNDEzLjE5NCA1MC44NzgxTDQwNC4xOTkgNjcuMTY4NFoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNNjQ0LjY1NiAxODIgNjIxLjQ3IDE4MiA2NTUuNzQ5IDEyMS43MzYgNjEzLjI3NSA0NS42ODExIDYzNi43NjEgNDUuNjgxMSA2NjcuNTQyIDEwMC42NDggNjk3LjIyNSA0NS42ODExIDcyMC4yMTEgNDUuNjgxMSA2NDQuNjU2IDE4MloiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNOTUyLjc3MiAxMDAuODQ4Qzk1Mi43NzIgMTMxLjMzIDkzMC43ODYgMTQzLjkyMyA5MDguMzk5IDE0My45MjMgODg2LjAxMiAxNDMuOTIzIDg2NC4wMjUgMTMxLjMzIDg2NC4wMjUgMTAwLjg0OEw4NjQuMDI1IDQ1LjY4MTEgODg1LjAxMyA0NS42ODExIDg4NS4wMTMgOTguOTQ5NEM4ODUuMDEzIDExNy40MzggODk1LjMwNyAxMjQuMjM0IDkwOC4zOTkgMTI0LjIzNCA5MjEuNDkxIDEyNC4yMzQgOTMxLjc4NSAxMTcuNDM4IDkzMS43ODUgOTguOTQ5NEw5MzEuNzg1IDQ1LjY4MTEgOTUyLjc3MiA0NS42ODExIDk1Mi43NzIgMTAwLjg0OFoiIGZpbGw9IiMzQTQ1NTIiLz48cGF0aCBkPSJNMTA2LjM3NiA1NS45NzUgOTIuOTg0MiA3MC4yNjY1Qzg2LjI4ODIgNjMuOTcwMyA3OS4xOTI0IDYwLjM3MjQgNjkuOTk3OSA2MC4zNzI0IDUzLjkwNzUgNjAuMzcyNCA0MS43MTQ4IDcyLjk2NDkgNDEuNzE0OCA5MS4wNTQxIDQxLjcxNDggMTA5LjE0MyA1My45MDc1IDEyMS43MzYgNjkuOTk3OSAxMjEuNzM2IDg2LjA4ODMgMTIxLjczNiA4Ny4zODc2IDExNy40MzggOTMuNDgzOSAxMTEuNzQyTDEwNi4zNzYgMTI2LjEzM0M5Ny42ODE0IDEzNi4yMjcgODQuODg5MSAxNDEuNDI0IDcwLjU5NzYgMTQxLjQyNCA0MC4xMTU3IDE0MS40MjQgMjAuMjI3NSAxMTkuNzM3IDIwLjIyNzUgOTEuMDU0MSAyMC4yMjc1IDYyLjM3MTIgNDAuMTE1NyA0MC42ODQxIDcwLjU5NzYgNDAuNjg0MSAxMDEuMDc5IDQwLjY4NDEgOTcuODgxMyA0NS44ODEgMTA2LjM3NiA1NS45NzVaIiBmaWxsPSIjM0E0NTUyIi8+PHBhdGggZD0iTTIyMS45MDggMTM4LjkyNiAyMDEuMDIgMTM4LjkyNiAyMDEuMDIgMTI3LjQzMkMxOTQuNDI0IDEzNS45MjcgMTg0LjUzIDE0MS40MjQgMTcwLjkzOCAxNDEuNDI0IDE0NC4xNTQgMTQxLjQyNCAxMjMuMDY2IDEyMC4zMzcgMTIzLjA2NiA5MS4wNTQxIDEyMy4wNjYgNjEuNzcxNiAxNDQuMTU0IDQwLjY4NDEgMTcwLjkzOCA0MC42ODQxIDE5Ny43MjIgNDAuNjg0MSAxOTQuNDI0IDQ2LjI4MDggMjAxLjAyIDU0Ljc3NTdMMjAxLjAyIDQzLjE4MjYgMjIxLjkwOCA0My4xODI2IDIyMS45MDggMTM4LjkyNlpNMTQ0LjU1NCA5MS4wNTQxQzE0NC41NTQgMTA3Ljg0NCAxNTUuNDQ3IDEyMS43MzYgMTczLjQzNiAxMjEuNzM2IDE5MS40MjYgMTIxLjczNiAyMDIuMzE5IDEwOC41NDQgMjAyLjMxOSA5MS4wNTQxIDIwMi4zMTkgNzMuNTY0NSAxOTAuNzI2IDYwLjM3MjQgMTczLjQzNiA2MC4zNzI0IDE1Ni4xNDcgNjAuMzcyNCAxNDQuNTU0IDc0LjI2NDEgMTQ0LjU1NCA5MS4wNTQxWiIgZmlsbD0iIzNBNDU1MiIvPjxwYXRoIGQ9Ik04MzUuMTQzIDkzLjU1MjdDODM1LjE0MyAxMjIuMjM2IDgxMy4xNTYgMTQzLjkyMyA3ODMuNTczIDE0My45MjMgNzUzLjk5MSAxNDMuOTIzIDczMi4xMDQgMTIyLjIzNiA3MzIuMTA0IDkzLjU1MjcgNzMyLjEwNCA2NC44Njk3IDc1My45OTEgNDMuMTgyNiA3ODMuNTczIDQzLjE4MjYgODEzLjE1NiA0My4xODI2IDgzNS4xNDMgNjQuODY5NyA4MzUuMTQzIDkzLjU1MjdaTTc1My41OTEgOTMuNTUyN0M3NTMuNTkxIDExMS42NDIgNzY2LjQ4MyAxMjQuMjM0IDc4My41NzMgMTI0LjIzNCA4MDAuNjYzIDEyNC4yMzQgODEzLjY1NSAxMTEuNjQyIDgxMy42NTUgOTMuNTUyNyA4MTMuNjU1IDc1LjQ2MzQgODAwLjY2MyA2Mi44NzA5IDc4My41NzMgNjIuODcwOSA3NjYuNDgzIDYyLjg3MDkgNzUzLjU5MSA3NS40NjM0IDc1My41OTEgOTMuNTUyN1oiIGZpbGw9IiMzQTQ1NTIiLz48L2c+PC9zdmc+',
    curta:   'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTkwIDQ1NCIgd2lkdGg9Ijk5MCIgaGVpZ2h0PSI0NTQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDk2IC0xOTcpIj48cGF0aCBkPSJNMjE5Ljc4IDEzOC4yNTggMTg1LjU4MyAxNzUuMjczQzE2OC41MjEgMTU4Ljk2OSAxNTAuMzc2IDE0OS42NDIgMTI2Ljk1MiAxNDkuNjQyIDg1Ljg4NzYgMTQ5LjY0MiA1NC44MDAzIDE4Mi4yNSA1NC44MDAzIDIyOS4xNzkgNTQuODAwMyAyNzYuMTA4IDg1Ljg4NzYgMzA4LjcxNiAxMjYuOTUyIDMwOC43MTYgMTUwLjQ0OCAzMDguNzE2IDE3MS4zNDEgMjk3LjU1MyAxODYuODg1IDI4Mi43OTFMMjE5Ljc4IDMyMC4wOTlDMTk3LjU4NSAzNDYuMjQ1IDE2NC45OCAzNTkuNzU4IDEyOC40NyAzNTkuNzU4IDUwLjc1MTcgMzU5LjY4NCAwIDMwMy41MDEgMCAyMjkuMTc5IDAgMTU0Ljg1NiA1MC43NTE3IDk4LjYwMDEgMTI4LjU0MiA5OC42MDAxIDE2NC45OCA5OC42MDAxIDE5OC4xNjMgMTEyLjA0IDIxOS44NTEgMTM4LjI1OEwyMTkuNzggMTM4LjI1OFoiIGZpbGw9IiMzQTQ1NTIiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEuMDAxMzEgLTk2IDE5NykiLz48cGF0aCBkPSJNNTMyLjI5MSAxNDMuODIyIDUzMi4yOTEgNzEuODcgMzQyLjQzNiA3MS44NyAzNDIuNDM2IDAgNTMyLjI5MSAwIDUzMi4yOTEgNzEuOTUxNiA1OTUuNTk5IDcxLjk1MTYgNTk1LjU5OSAxNDMuOTAzIDUzMi4yOTEgMTQzLjkwMyA1MzIuMjkxIDE0My44MjJaTTM0Mi40MzYgMzU5LjY3NiAzNDIuNDM2IDIxNS44NTUgNDA1Ljc0NCAyMTUuODU1IDQwNS43NDQgMjg3LjgwNiA1OTUuNTk5IDI4Ny44MDYgNTk1LjU5OSAzNTkuNzU4IDM0Mi40MzYgMzU5Ljc1OCAzNDIuNDM2IDM1OS42NzZaTTQwNS42NzMgMjE1Ljc3MyA0MDUuNjczIDE0My44MjIgNTMyLjIxOCAxNDMuODIyIDUzMi4yMTggMjE1Ljc3MyA0MDUuNjczIDIxNS43NzNaIiBmaWxsPSIjM0E0NTUyIiB0cmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxLjAwMTMxIC05NiAxOTcpIi8+PHBhdGggZD0iTTc5Ni45NzEgNDUzLjAyOSA3MzcuNzY4IDQ1My4wMjkgODI1LjM0NCAyOTYuMzMxIDcxNi44NSA5OC42MDAxIDc3Ni44NTEgOTguNjAwMSA4NTUuNDUxIDI0MS41MiA5MzEuMzAzIDk4LjYwMDEgOTkwIDk4LjYwMDEgNzk2Ljk3MSA0NTMuMDI5WiIgZmlsbD0iIzNBNDU1MiIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMS4wMDEzMSAtOTYgMTk3KSIvPjwvZz48L3N2Zz4='
  },
  escuro: {
    extensa: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTMzIDE2OCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2xpcDAiPjxyZWN0IHg9IjIwIiB5PSIxNCIgd2lkdGg9IjkzMyIgaGVpZ2h0PSIxNjgiLz48L2NsaXBQYXRoPjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjY2xpcDApIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjAgLTE0KSI+PHBhdGggZD0iTTU0MC40MTggNjMuOTcwMyA1NDAuNDE4IDM4Ljk4NTEgNDY1LjQ2MyAzOC45ODUxIDQ2NS40NjMgMTQgNTQwLjQxOCAxNCA1NDAuNDE4IDM4Ljk4NTEgNTY1LjQwMyAzOC45ODUxIDU2NS40MDMgNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDNaTTQ2NS40NjMgMTM4LjkyNiA0NjUuNDYzIDg4Ljk1NTQgNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggMTEzLjk0MSA1NjUuNDAzIDExMy45NDEgNTY1LjQwMyAxMzguOTI2IDQ2NS40NjMgMTM4LjkyNlpNNDkwLjQ0OCA4OC45NTU0IDQ5MC40NDggNjMuOTcwMyA1NDAuNDE4IDYzLjk3MDMgNTQwLjQxOCA4OC45NTU0IDQ5MC40NDggODguOTU1NFoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNMzE5Ljc0OSA0My4zODI1IDMxNC43NTIgNjQuMDcwMkMzMTAuMzU1IDYxLjc3MTYgMzAzLjk1OSA2MC41NzIzIDI5OC44NjIgNjAuNTcyMyAyODUuNTcgNjAuNTcyMyAyNzYuMDc1IDY5Ljk2NjcgMjc2LjA3NSA4Ni4yNTdMMjc2LjA3NSAxMzguOTI2IDI1NS4xODggMTM4LjkyNiAyNTUuMTg4IDQzLjE4MjYgMjc1Ljg3NSA0My4xODI2IDI3NS44NzUgNTMuOTc2MkMyODIuMTcyIDQ0Ljg4MTYgMjkxLjk2NiA0MC42ODQxIDMwMy42NTkgNDAuNjg0MSAzMTUuMzUyIDQwLjY4NDEgMzE0Ljk1MiA0MS40ODM2IDMxOS43NDkgNDMuMzgyNVoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNNDA0LjE5OSA2Ny4xNjg0QzM5OC40MDIgNjMuNTcwNSAzODYuNTEgNTguOTczMiAzNzQuNjE3IDU4Ljk3MzIgMzYyLjcyNCA1OC45NzMyIDM1Ni41MjcgNjMuNTcwNSAzNTYuNTI3IDcwLjM2NjUgMzU2LjUyNyA3Ny4xNjI0IDM2My41MjMgNzguOTYxMyAzNzIuMzE4IDgwLjI2MDZMMzgyLjIxMiA4MS43NTk3QzQwMy4xIDg0Ljc1NzkgNDE1LjQ5MiA5My42NTI2IDQxNS40OTIgMTEwLjA0MyA0MTUuNDkyIDEyNi40MzMgMzk5LjUwMiAxNDEuMzI0IDM3MS45MTggMTQxLjMyNCAzNDQuMzM1IDE0MS4zMjQgMzQ0LjgzNCAxMzkuNDI1IDMzMC44NDMgMTI5LjAzMkwzNDAuNTM3IDExMy4zNDFDMzQ3LjQzMyAxMTguNjM4IDM1Ni41MjcgMTIzLjEzNSAzNzIuMTE4IDEyMy4xMzUgMzg3LjcwOSAxMjMuMTM1IDM5My45MDUgMTE4LjYzOCAzOTMuOTA1IDExMS40NDIgMzkzLjkwNSAxMDQuMjQ2IDM4OC43MDggMTAyLjQ0NyAzNzcuMzE1IDEwMC44NDhMMzY3LjMyMSA5OS41NDkxQzM0Ni4xMzQgOTYuNjUwOCAzMzQuODQgODYuODU2NiAzMzQuODQgNzEuNDY1OCAzMzQuODQgNTYuMDc1IDM1MC4wMzEgNDAuNzg0MSAzNzQuNDE3IDQwLjc4NDEgMzk4LjgwMiA0MC43ODQxIDQwMy4zIDQ0LjQ4MTkgNDEzLjE5NCA1MC44NzgxTDQwNC4xOTkgNjcuMTY4NFoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNNjQ0LjY1NiAxODIgNjIxLjQ3IDE4MiA2NTUuNzQ5IDEyMS43MzYgNjEzLjI3NSA0NS42ODExIDYzNi43NjEgNDUuNjgxMSA2NjcuNTQyIDEwMC42NDggNjk3LjIyNSA0NS42ODExIDcyMC4yMTEgNDUuNjgxMSA2NDQuNjU2IDE4MloiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNOTUyLjc3MiAxMDAuODQ4Qzk1Mi43NzIgMTMxLjMzIDkzMC43ODYgMTQzLjkyMyA5MDguMzk5IDE0My45MjMgODg2LjAxMiAxNDMuOTIzIDg2NC4wMjUgMTMxLjMzIDg2NC4wMjUgMTAwLjg0OEw4NjQuMDI1IDQ1LjY4MTEgODg1LjAxMyA0NS42ODExIDg4NS4wMTMgOTguOTQ5NEM4ODUuMDEzIDExNy40MzggODk1LjMwNyAxMjQuMjM0IDkwOC4zOTkgMTI0LjIzNCA5MjEuNDkxIDEyNC4yMzQgOTMxLjc4NSAxMTcuNDM4IDkzMS43ODUgOTguOTQ5NEw5MzEuNzg1IDQ1LjY4MTEgOTUyLjc3MiA0NS42ODExIDk1Mi43NzIgMTAwLjg0OFoiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNMTA2LjM3NiA1NS45NzUgOTIuOTg0MiA3MC4yNjY1Qzg2LjI4ODIgNjMuOTcwMyA3OS4xOTI0IDYwLjM3MjQgNjkuOTk3OSA2MC4zNzI0IDUzLjkwNzUgNjAuMzcyNCA0MS43MTQ4IDcyLjk2NDkgNDEuNzE0OCA5MS4wNTQxIDQxLjcxNDggMTA5LjE0MyA1My45MDc1IDEyMS43MzYgNjkuOTk3OSAxMjEuNzM2IDg2LjA4ODMgMTIxLjczNiA4Ny4zODc2IDExNy40MzggOTMuNDgzOSAxMTEuNzQyTDEwNi4zNzYgMTI2LjEzM0M5Ny42ODE0IDEzNi4yMjcgODQuODg5MSAxNDEuNDI0IDcwLjU5NzYgMTQxLjQyNCA0MC4xMTU3IDE0MS40MjQgMjAuMjI3NSAxMTkuNzM3IDIwLjIyNzUgOTEuMDU0MSAyMC4yMjc1IDYyLjM3MTIgNDAuMTE1NyA0MC42ODQxIDcwLjU5NzYgNDAuNjg0MSAxMDEuMDc5IDQwLjY4NDEgOTcuODgxMyA0NS44ODEgMTA2LjM3NiA1NS45NzVaIiBmaWxsPSIjRkZGRkZGIi8+PHBhdGggZD0iTTIyMS45MDggMTM4LjkyNiAyMDEuMDIgMTM4LjkyNiAyMDEuMDIgMTI3LjQzMkMxOTQuNDI0IDEzNS45MjcgMTg0LjUzIDE0MS40MjQgMTcwLjkzOCAxNDEuNDI0IDE0NC4xNTQgMTQxLjQyNCAxMjMuMDY2IDEyMC4zMzcgMTIzLjA2NiA5MS4wNTQxIDEyMy4wNjYgNjEuNzcxNiAxNDQuMTU0IDQwLjY4NDEgMTcwLjkzOCA0MC42ODQxIDE5Ny43MjIgNDAuNjg0MSAxOTQuNDI0IDQ2LjI4MDggMjAxLjAyIDU0Ljc3NTdMMjAxLjAyIDQzLjE4MjYgMjIxLjkwOCA0My4xODI2IDIyMS45MDggMTM4LjkyNlpNMTQ0LjU1NCA5MS4wNTQxQzE0NC41NTQgMTA3Ljg0NCAxNTUuNDQ3IDEyMS43MzYgMTczLjQzNiAxMjEuNzM2IDE5MS40MjYgMTIxLjczNiAyMDIuMzE5IDEwOC41NDQgMjAyLjMxOSA5MS4wNTQxIDIwMi4zMTkgNzMuNTY0NSAxOTAuNzI2IDYwLjM3MjQgMTczLjQzNiA2MC4zNzI0IDE1Ni4xNDcgNjAuMzcyNCAxNDQuNTU0IDc0LjI2NDEgMTQ0LjU1NCA5MS4wNTQxWiIgZmlsbD0iI0ZGRkZGRiIvPjxwYXRoIGQ9Ik04MzUuMTQzIDkzLjU1MjdDODM1LjE0MyAxMjIuMjM2IDgxMy4xNTYgMTQzLjkyMyA3ODMuNTczIDE0My45MjMgNzUzLjk5MSAxNDMuOTIzIDczMi4xMDQgMTIyLjIzNiA3MzIuMTA0IDkzLjU1MjcgNzMyLjEwNCA2NC44Njk3IDc1My45OTEgNDMuMTgyNiA3ODMuNTczIDQzLjE4MjYgODEzLjE1NiA0My4xODI2IDgzNS4xNDMgNjQuODY5NyA4MzUuMTQzIDkzLjU1MjdaTTc1My41OTEgOTMuNTUyN0M3NTMuNTkxIDExMS42NDIgNzY2LjQ4MyAxMjQuMjM0IDc4My41NzMgMTI0LjIzNCA4MDAuNjYzIDEyNC4yMzQgODEzLjY1NSAxMTEuNjQyIDgxMy42NTUgOTMuNTUyNyA4MTMuNjU1IDc1LjQ2MzQgODAwLjY2MyA2Mi44NzA5IDc4My41NzMgNjIuODcwOSA3NjYuNDgzIDYyLjg3MDkgNzUzLjU5MSA3NS40NjM0IDc1My41OTEgOTMuNTUyN1oiIGZpbGw9IiNGRkZGRkYiLz48L2c+PC9zdmc+',
    curta:   'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgOTkwIDQ1NCIgd2lkdGg9Ijk5MCIgaGVpZ2h0PSI0NTQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIG92ZXJmbG93PSJoaWRkZW4iPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDk2IC0xOTcpIj48cGF0aCBkPSJNMjE5Ljc4IDEzOC4yNTggMTg1LjU4MyAxNzUuMjczQzE2OC41MjEgMTU4Ljk2OSAxNTAuMzc2IDE0OS42NDIgMTI2Ljk1MiAxNDkuNjQyIDg1Ljg4NzYgMTQ5LjY0MiA1NC44MDAzIDE4Mi4yNSA1NC44MDAzIDIyOS4xNzkgNTQuODAwMyAyNzYuMTA4IDg1Ljg4NzYgMzA4LjcxNiAxMjYuOTUyIDMwOC43MTYgMTUwLjQ0OCAzMDguNzE2IDE3MS4zNDEgMjk3LjU1MyAxODYuODg1IDI4Mi43OTFMMjE5Ljc4IDMyMC4wOTlDMTk3LjU4NSAzNDYuMjQ1IDE2NC45OCAzNTkuNzU4IDEyOC40NyAzNTkuNzU4IDUwLjc1MTcgMzU5LjY4NCAwIDMwMy41MDEgMCAyMjkuMTc5IDAgMTU0Ljg1NiA1MC43NTE3IDk4LjYwMDEgMTI4LjU0MiA5OC42MDAxIDE2NC45OCA5OC42MDAxIDE5OC4xNjMgMTEyLjA0IDIxOS44NTEgMTM4LjI1OEwyMTkuNzggMTM4LjI1OFoiIGZpbGw9IiNGRkZGRkYiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEuMDAxMzEgLTk2IDE5NykiLz48cGF0aCBkPSJNNTMyLjI5MSAxNDMuODIyIDUzMi4yOTEgNzEuODcgMzQyLjQzNiA3MS44NyAzNDIuNDM2IDAgNTMyLjI5MSAwIDUzMi4yOTEgNzEuOTUxNiA1OTUuNTk5IDcxLjk1MTYgNTk1LjU5OSAxNDMuOTAzIDUzMi4yOTEgMTQzLjkwMyA1MzIuMjkxIDE0My44MjJaTTM0Mi40MzYgMzU5LjY3NiAzNDIuNDM2IDIxNS44NTUgNDA1Ljc0NCAyMTUuODU1IDQwNS43NDQgMjg3LjgwNiA1OTUuNTk5IDI4Ny44MDYgNTk1LjU5OSAzNTkuNzU4IDM0Mi40MzYgMzU5Ljc1OCAzNDIuNDM2IDM1OS42NzZaTTQwNS42NzMgMjE1Ljc3MyA0MDUuNjczIDE0My44MjIgNTMyLjIxOCAxNDMuODIyIDUzMi4yMTggMjE1Ljc3MyA0MDUuNjczIDIxNS43NzNaIiBmaWxsPSIjRkZGRkZGIiB0cmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxLjAwMTMxIC05NiAxOTcpIi8+PHBhdGggZD0iTTc5Ni45NzEgNDUzLjAyOSA3MzcuNzY4IDQ1My4wMjkgODI1LjM0NCAyOTYuMzMxIDcxNi44NSA5OC42MDAxIDc3Ni44NTEgOTguNjAwMSA4NTUuNDUxIDI0MS41MiA5MzEuMzAzIDk4LjYwMDEgOTkwIDk4LjYwMDEgNzk2Ljk3MSA0NTMuMDI5WiIgZmlsbD0iI0ZGRkZGRiIgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMS4wMDEzMSAtOTYgMTk3KSIvPjwvZz48L3N2Zz4='
  }
};
```

**Para outro produto:** troque as quatro por artes do produto, mantendo a
estrutura — e meça a caixa de cada SVG antes de escrever o `viewBox`.

## O tema, inteiro

Cole o bloco abaixo dentro de `<style>` no `<head>`. Ele traz os dois temas,
todos os componentes e os comentários que explicam cada decisão.

```css
/* ==========================================================================
   Tema dos painéis — Cars2You
   --------------------------------------------------------------------------
   FONTE ÚNICA do visual. Mexeu aqui, regera os modelos:
       regere o painel a partir do kit

   Nunca escreva cor solta dentro do HTML de um painel. Se a cor não existe
   aqui, ou ela vira token, ou não deveria estar sendo usada.

   Dois temas no mesmo arquivo, de propósito: dois arquivos separados ficam
   livres pra divergir, e o claro vira o "de verdade" enquanto o escuro
   apodrece.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Paleta da marca — valores oficiais, não inventar
   -------------------------------------------------------------------------- */
:root{
  --marca-azul:       #1523A0;  /* primária   */
  --marca-azul-claro: #487DEA;  /* acento     */
  --marca-cinza:      #E4E6E6;  /* divisória  */
  --marca-vinho:      #6F4047;  /* atenção    */
  --marca-vermelho:   #7F1112;  /* negativo   */

  /* Derivados — NÃO estão na paleta oficial. A paleta não tem verde, e um
     painel precisa de "subiu / desceu". Ver "Trocar de marca", no kit. */
  --d-verde:          #0E7C55;
  --d-verde-vivo:     #35C08A;
  --d-vermelho-vivo:  #EF5B60;

  /* --- forma e ritmo ---
     Arredondado em 22/09, junto com o tema claro novo: 16/12/10 → 22/14/11.
     Fica aqui, no bloco COMUM, e não só no claro: dois raios diferentes nos
     dois temas do mesmo sistema é a divergência que ninguém percebe até ver
     os dois lado a lado. Forma é uma só; cor é que muda com o tema. */
  --r-g: 22px;   /* raio do cartão    */
  --r-m: 14px;   /* raio de bloco     */
  --r-p: 11px;   /* raio de controle  */
  --gap: 16px;
  --topo-h: 68px;

  --fonte: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
           "Helvetica Neue", Arial, "Noto Sans", sans-serif;
}

/* --------------------------------------------------------------------------
   2. Tema CLARO — é o padrão. Vidro, desde 2026-09-22.
   --------------------------------------------------------------------------
   Era branco chapado sobre cinza quase neutro, com borda de 1px separando
   cartão de página. Virou vidro, na mesma família do escuro: quem tem cor é o
   FUNDO, o cartão é quase branco e translúcido, e quem o separa é a SOMBRA.

   ── AS QUATRO DECISÕES, E O QUE CADA UMA CUSTOU ───────────────────────────

   1. O acento saiu do azul da marca. `--acento` era #1523A0 e é #3A4552 — o
      mesmo cinza escuro do texto. É o que dá a cara da referência, e é
      também o que tira o azul do link, do chip e da barra de título.
      O azul da marca não sumiu: `--acento-cheio` continua sendo ele, e é
      quem pinta linha de gráfico, ponto e barra de ranking. Uma cor só na
      página, e justamente na parte que é dado.
      ⚠️ Link deixou de se distinguir do texto pela cor. Ver regra 10.

   2. O texto clareou de #14161C para #3A4552. Preto de verdade sobre cartão
      claro dá 13:1 — contraste de tinta em papel, que numa tela endurece a
      página inteira. 7,9:1 no pior caso continua acima do 7:1 do AAA.

   3. O cartão ganhou DEGRADÊ, mais escuro no canto superior esquerdo. Isso
      move o piso de contraste: o pior caso deixou de ser "sobre branco" e
      passou a ser "sobre o canto escuro do cartão". Duas cores desceram um
      tom por causa disso — `--texto-3` e `--positivo`, anotadas abaixo.

   4. O campo escureceu para #D8E1E9, e aí texto SOBRE A PÁGINA (fora de
      cartão) fica abaixo de AA. Virou regra escrita — ver regra 10 em
      a regra 9 do kit: texto só sobre superfície.

   ── CONTRASTE MEDIDO (o medidor esta em "Trocar de marca", no kit) ──────────────────────────
   Os três planos onde o texto cai, com o branco translúcido já resolvido
   sobre o fundo:

                            canto esc.  canto claro    campo
                             #E3E8EC      #FDFEFE      #D8E1E9
       texto      #3A4552      7,91         9,65        7,37   ✓ AAA
       texto-2    #55626F      5,06         6,18        4,72   ✓ AA
       acento     #3A4552      7,91         9,65        7,37   ✓ AAA
       positivo   #0C6E4B      5,08         6,21        4,74   ✓ AA
       negativo   #7F1112      8,55        10,44        7,97   ✓ AA
       atenção    #6F4047      6,81         8,31        6,35   ✓ AA
       texto-3    #6F7D89      3,42         4,18        3,19   — de-ênfase

   Branco sobre o acento (ícone vazado dentro do chip): 9,75:1.
   -------------------------------------------------------------------------- */
:root,
[data-tema="claro"]{
  /* Sem isto, <select>, scrollbar e afins seguem o modo do SISTEMA, nao o da
     pagina: o tema claro abre com os controles pretos em quem usa o SO no
     escuro. Aconteceu no primeiro print. */
  color-scheme: light;

  /* Quem tem cor é o fundo. O clarão branco no canto superior esquerdo e o
     cinza mais frio descendo para a direita são o que dá volume à página —
     sem eles o cartão translúcido não tem de que se destacar.
     ⚠️ O clarão tem que ser MENOR que a tela: 760px de branco a 95% num
     viewport de 800 lavavam a página inteira e invertiam o efeito — página
     branca com cartão acinzentado por cima. */
  --fundo:          #D8E1E9;
  --fundo-veu:      radial-gradient(420px 300px at 0% -14%,
                      rgba(255,255,255,.72), transparent 70%),
                    radial-gradient(1200px 900px at 100% 100%,
                      rgba(128,155,178,.50), transparent 66%);

  --superficie:     #FAFCFD;
  --superficie-2:   #EDF1F5;
  --borda:          #E3E9EE;
  --borda-forte:    #C9D4DD;

  /* neutros com um resto de azul: cinza puro ao lado de um campo frio
     parece sujo */
  --texto:          #3A4552;
  /* escurecido de #5B6875 em 22/09, quando o cabecalho perdeu o fundo: o
     subtitulo do topo passou a cair direto no CAMPO, e la o tom anterior
     dava 4,31:1 — abaixo de AA. Com este, 4,72. E de quebra o canto
     escuro do cartao subiu de 4,62 para 5,06. */
  --texto-2:        #55626F;
  /* de-ênfase, e escurecido por causa do degradê: no canto superior esquerdo
     do cartão o tom anterior caía para 3,1:1 */
  --texto-3:        #6F7D89;

  /* ver a decisão 1 no cabeçalho: cinza escuro no acento, azul da marca no
     preenchimento. O acento é o MESMO tom do texto de propósito — é ele que
     pinta o chip de ícone, e ícone e letra deviam ser a mesma tinta. */
  --acento:         #3A4552;
  --acento-cheio:   var(--marca-azul-claro);
  --acento-veu:     rgba(58,69,82,.07);

  /* O verde desceu um tom por causa do degradê: `--d-verde` (#0E7C55) dá
     4,22:1 no canto escuro do cartão, abaixo de AA — e é exatamente ali que
     o KPI escreve "▲ 4,2% vs. período anterior". `--d-verde` é DERIVADO, não
     paleta oficial; escurecer um derivado é ajuste de legibilidade. */
  --positivo:       #0C6E4B;
  --negativo:       var(--marca-vermelho);
  --atencao:        var(--marca-vinho);

  --grade:          rgba(23,33,43,.06);

  /* Profundidade em três camadas fracas, no lugar de uma linha. A de cima
     (`inset`) é o fio de luz na borda superior — é ela que faz a peça parecer
     levantada em vez de recortada. */
  --sombra:         0 1px 1px  rgba(23,33,43,.03),
                    0 6px 16px rgba(23,33,43,.05),
                    0 18px 44px rgba(23,33,43,.07),
                    inset 0 1px 0 rgba(255,255,255,.85);

  /* borda branca e não cinza: no vidro a borda é reflexo, não contorno */
  --cartao-borda:   1px solid rgba(255,255,255,.72);

  /* O degradê do cartão, em duas camadas que fazem coisas diferentes:
       `--cartao-fundo`  varia a OPACIDADE do branco (.82 → .95). Como o campo
                         atrás é mais escuro, menos branco = mais escuro. É a
                         rampa longa, na diagonal inteira.
       `--brilho`        um véu cinza-azulado no CANTO, e só nele. É o que dá
                         o arredondamento da sombra — degradê linear sozinho
                         parece papel dobrado, não luz.
     Medido no cartão composto: #E3E8EC no canto superior esquerdo, #FDFEFE
     no inferior direito. Rampa de ~11%: bastante para se ver, pouco para
     chamar atenção. */
  --cartao-fundo:   linear-gradient(155deg, rgba(255,255,255,.82) 0%,
                                            rgba(255,255,255,.95) 58%);
  --cartao-blur:    blur(18px) saturate(115%);
  --brilho:         radial-gradient(420px 260px at 0% 0%,
                      rgba(86,112,138,.13), transparent 72%);
}

/* --------------------------------------------------------------------------
   3. Tema ESCURO — vidro, na linha da referência
   -------------------------------------------------------------------------- */
[data-tema="escuro"]{
  color-scheme: dark;

  --fundo:          #0B0D12;
  --fundo-veu:      radial-gradient(900px 500px at 8% -8%,
                      rgba(72,125,234,.20), transparent 62%),
                    radial-gradient(800px 500px at 96% 4%,
                      rgba(111,64,71,.16), transparent 60%);

  --superficie:     #12151D;
  --superficie-2:   #171B25;
  --borda:          rgba(255,255,255,.09);
  --borda-forte:    rgba(255,255,255,.16);

  --texto:          #EDEFF5;
  --texto-2:        #A4ABBF;
  --texto-3:        #6E7589;

  /* No escuro o azul da marca some (1,65:1). Quem assume é o azul claro,
     que dá 4,99:1 sobre o fundo. Mesma lógica pro vermelho. */
  --acento:         var(--marca-azul-claro);
  --acento-cheio:   var(--marca-azul-claro);
  --acento-veu:     rgba(72,125,234,.18);

  --positivo:       var(--d-verde-vivo);
  --negativo:       var(--d-vermelho-vivo);
  --atencao:        #C98A92;

  --grade:          rgba(255,255,255,.07);
  --sombra:         0 1px 1px rgba(0,0,0,.4), 0 16px 40px rgba(0,0,0,.45);
  --cartao-borda:   1px solid rgba(255,255,255,.08);
  --cartao-fundo:   linear-gradient(158deg, rgba(255,255,255,.075),
                                            rgba(255,255,255,.025));
  --cartao-blur:    blur(16px) saturate(140%);
  --brilho:         radial-gradient(420px 180px at 0% 0%,
                      rgba(72,125,234,.16), transparent 70%);
}

/* --------------------------------------------------------------------------
   4. Base
   -------------------------------------------------------------------------- */
*,*::before,*::after{ box-sizing:border-box }

html{ -webkit-text-size-adjust:100% }

body{
  margin:0;
  font-family:var(--fonte);
  font-size:14px;
  line-height:1.45;
  color:var(--texto);
  background-color:var(--fundo);
  background-image:var(--fundo-veu);
  background-attachment:fixed;
  background-repeat:no-repeat;
  -webkit-font-smoothing:antialiased;
}

h1,h2,h3{ margin:0; font-weight:650; letter-spacing:-.01em }
p{ margin:0 }

.num{ font-variant-numeric:tabular-nums; font-feature-settings:"tnum" 1 }

/* --------------------------------------------------------------------------
   5. Topo — fixo, com o filtro dentro
   -------------------------------------------------------------------------- */
/* SEM FUNDO E SEM BORDA (22/09), nos DOIS temas.
   --------------------------------------------------------------------------
   O topo era uma superfície própria — `--cartao-fundo` com uma cor sólida por
   baixo e uma linha embaixo. Virou vidro sem tinta: o fundo da página passa
   por ele inteiro, e no alto da página não há barra nenhuma, só a página
   continuando até a borda de cima.

   Tirar a `border-bottom` é parte da mesma decisão: linha atravessando a tela
   é justamente o que faz uma barra parecer barra.

   ⚠️ O `backdrop-filter` FICA, e é ele que segura a legibilidade. O topo é
   `sticky`: quando a página rola, o conteúdo passa por baixo dele. Sem fundo
   e sem blur, o título do painel ficaria por cima de texto nítido em
   movimento. Com o blur, o que passa vira um borrão claro e o título continua
   legível — vidro de verdade, que é o que este tema imita.

   Conferido nos dois estados: no alto da página o topo some no campo; rolado,
   o cartão de baixo aparece como mancha suave e nada colide. */
.topo{
  position:sticky; top:0; z-index:30;
  background:transparent;
  backdrop-filter:var(--cartao-blur);
  -webkit-backdrop-filter:var(--cartao-blur);
}
/* Três colunas, e não flex (21/09): o título do painel fica CENTRADO, e com
   flex o centro dele dependeria da largura da logo e de quantas ações houvesse
   na direita — bastaria um botão a mais para o título escorregar. Com
   `1fr auto 1fr` o meio é o meio da barra, custe o que custar aos lados. */
.topo-in{
  max-width:1680px; margin:0 auto;
  min-height:var(--topo-h);
  padding:10px 20px;
  display:grid; grid-template-columns:1fr auto 1fr;
  align-items:center; gap:16px;
}
/* ── A MARCA É UM FILHO SÓ DA GRADE (22/09) ────────────────────────────────
   São duas artes — a extensa e a curta — e as duas moram dentro do `.marca`.
   Soltas, seriam DOIS filhos do `.topo-in`, e a grade de três colunas viraria
   de quatro: o título sairia do centro. Mesma família da armadilha que o
   `display` explícito do `.topo` já registra.

   Quem troca uma pela outra é CSS, não JS. Assim a escolha sobrevive a
   imprimir, a redimensionar a janela e a rodar com o script desligado — e não
   pisca na carga. O JS só decide a COR, que depende do tema. */
.marca{ justify-self:start; min-width:0; display:block; line-height:0 }
.logo{ height:26px; width:auto; display:block; flex:none }

/* A extensa é a marca escrita por extenso (933 × 168, 5,55:1). A curta é o
   "c2y" (990 × 454, 2,18:1) — medido com `getBBox`, não estimado. Na barra,
   a 26px de altura, uma dá 144px de largura e a outra 57px. */
.logo-curta{ display:none }
.topo-tit{ text-align:center; min-width:0 }
/* 22px: o nome do painel é a primeira coisa que se lê. Em 17px ele perdia
   para o número do KPI logo abaixo, que é o dado MENOS interessante da
   página (ver a regra 2 do kit: KPI nao e manchete). */
.topo-tit h1{ font-size:22px; letter-spacing:-.01em }
/* `--texto-2` e não `--texto-3`: sem fundo no topo, este subtítulo é o ÚNICO
   texto do painel que fica direto sobre o campo, e lá a de-ênfase cai para
   3,19:1. Ver a regra 9 do kit. */
.topo-tit .sub{ font-size:12.5px; color:var(--texto-2); margin-top:1px }
.topo-acoes{ display:flex; align-items:center; justify-content:flex-end;
  gap:8px; flex-wrap:wrap; justify-self:end }

/* --------------------------------------------------------------------------
   5b. Vidro — as três regras que token nenhum alcança
   --------------------------------------------------------------------------
   Token muda valor, não forma de pintar. Estas três completam o tema claro
   novo e não tocam em posição, tamanho de caixa nem fluxo.

   O escopo é `:root:not([data-tema="escuro"])` e não `[data-tema="claro"]`:
   o claro é o padrão e vale também quando não há atributo nenhum no <html>.
   Com o seletor do atributo, um documento sem `data-tema` ficaria com os
   tokens do claro e as regras do escuro — meio tema, e ninguém percebe.
   -------------------------------------------------------------------------- */

/* (O cabeçalho já não está aqui: ele não tem fundo nenhum, nos dois temas.
    Ver o comentário no `.topo`, na seção 5.) */

/* 1. Controle afundado. Era uma caixa com borda; agora é um sulco, e quem o
      desenha é a sombra interna. O foco continua sendo o `outline` de baixo,
      de propósito: sombra não aparece no modo de alto contraste do sistema. */
:root:not([data-tema="escuro"]) .ctrl{
  background:rgba(255,255,255,.55);
  border-color:rgba(255,255,255,.7);
  box-shadow:inset 0 1px 2px rgba(23,33,43,.06),
             0 1px 0 rgba(255,255,255,.9);
}

/* 2. O chip do cabeçalho de cartão é a única peça de tinta cheia da página, e
      é o que marca "você está aqui". O SVG dentro dele usa `currentColor`,
      então o ícone vira branco junto. */
:root:not([data-tema="escuro"]) .chip{
  background:var(--acento);
  color:#FFFFFF;
}

/* 3. A faixa de KPI deita sobre a página em vez de flutuar: sombra menor,
      porque a peça é menor. Mesma família da regra que já a deixa mais
      apertada que os outros cartões. */
:root:not([data-tema="escuro"]) .g4 .cartao{
  box-shadow:0 1px 1px rgba(23,33,43,.03),
             0 4px 12px rgba(23,33,43,.05),
             inset 0 1px 0 rgba(255,255,255,.85);
}

.ctrl{
  font:inherit; font-size:13px; color:var(--texto);
  background:var(--superficie-2);
  border:1px solid var(--borda);
  border-radius:var(--r-p);
  padding:7px 11px;
  cursor:pointer;
  transition:border-color .15s, background .15s;
}
.ctrl:hover{ border-color:var(--borda-forte) }
.ctrl:focus-visible{ outline:2px solid var(--acento); outline-offset:1px }
select.ctrl{ padding-right:26px }

/* Botão só de ícone. O nome acessível vem do `aria-label` — sem texto
   visível e sem label, o leitor de tela anuncia apenas "botão".
   Ícone em SVG e não em caractere: ☀ e ☾ viram emoji colorido em parte
   dos sistemas, e aí o botão fica com a cara de outro produto. */
.ctrl.so-icone{ padding:7px; display:inline-flex; align-items:center }
.ctrl.so-icone svg{ width:16px; height:16px; display:block; stroke:currentColor;
                    fill:none; stroke-width:1.9; stroke-linecap:round;
                    stroke-linejoin:round }

/* --------------------------------------------------------------------------
   6. Área e grades
   -------------------------------------------------------------------------- */
.area{
  max-width:1680px; margin:0 auto;
  padding:var(--gap) 20px 48px;
  display:flex; flex-direction:column; gap:var(--gap);
}
.g4{ display:grid; gap:var(--gap); grid-template-columns:repeat(4,1fr) }
.g2{ display:grid; gap:var(--gap); grid-template-columns:2fr 1fr }

@media (max-width:1100px){
  .g4{ grid-template-columns:repeat(2,1fr) }
  .g2{ grid-template-columns:1fr }
}
@media (max-width:620px){
  .g4{ grid-template-columns:1fr }
  .area{ padding:12px 12px 40px }
  /* `auto 1fr auto` no telefone: com `1fr auto 1fr` as duas laterais reservam
     largura igual e quem espreme é o título, que é o maior dos três. A logo
     encolhe junto — ela é a marca escrita por extenso e comia meia barra. */
  .topo-in{ padding:10px 12px; grid-template-columns:auto 1fr auto; gap:8px }
  /* A marca extensa sai e entra a curta. Não é encolher: a 18px de altura a
     extensa ainda ocupa 100px de uma barra de 360, e o que ela tem de largura
     o título perde de espaço. A curta, na mesma altura, ocupa 39px.
     Por isso ela pode ser mais alta — 22px — e ainda assim cabe melhor. */
  .logo-extensa{ display:none }
  .logo-curta{ display:block; height:22px }
  .topo-tit h1{ font-size:16px }
}

/* --------------------------------------------------------------------------
   7. Cartão
   -------------------------------------------------------------------------- */
.cartao{
  position:relative;
  background:var(--cartao-fundo);
  border:var(--cartao-borda);
  border-radius:var(--r-g);
  box-shadow:var(--sombra);
  backdrop-filter:var(--cartao-blur);
  -webkit-backdrop-filter:var(--cartao-blur);
  padding:18px;
  overflow:hidden;
}
/* o brilho do canto, que no claro é `none` */
.cartao::before{
  content:""; position:absolute; inset:0;
  background:var(--brilho);
  pointer-events:none;
}
.cartao > *{ position:relative }

.cartao-topo{
  display:flex; align-items:center; gap:10px;
  margin-bottom:14px;
}
.cartao-topo h2{ font-size:14.5px; font-weight:650 }
.cartao-topo .dir{ margin-left:auto; display:flex; gap:6px; align-items:center }

.chip{
  flex:none; width:34px; height:34px; border-radius:50%;
  display:grid; place-items:center;
  background:var(--acento-veu);
  color:var(--acento);
}
.chip svg{ width:17px; height:17px; stroke:currentColor; fill:none;
           stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round }

/* --------------------------------------------------------------------------
   8. KPI
   -------------------------------------------------------------------------- */
/* KPI é resumo, não manchete.
   ---------------------------------------------------------------------------
   O número grande chama o olho primeiro, e ele é o dado MENOS interessante da
   página: um total sem recorte. Quem explica é o gráfico e a tabela. Por isso
   a faixa de KPI é deliberadamente contida — o realce aqui é o peso da fonte
   e a tabulação, não o tamanho.

   O aperto é ESCOPADO em `.g4` de propósito: cartão de gráfico, ranking e
   tabela seguem com o respiro de 18px. Mexer no `.cartao` global encolheria
   a página inteira, que não é o pedido. */
.g4 .cartao{ padding:13px 14px }
.g4 .cartao-topo{ margin-bottom:6px; gap:8px }
.g4 .chip{ width:26px; height:26px }
.g4 .chip svg{ width:14px; height:14px }

.kpi-rot{ font-size:12.5px; color:var(--texto-2); font-weight:500 }
.kpi-val{
  font-size:23px; line-height:1.15; font-weight:700; letter-spacing:-.015em;
  margin:4px 0 2px;
}
.kpi-delta{ font-size:11.5px; font-weight:600; display:inline-flex; gap:4px;
            align-items:center }
.sobe{ color:var(--positivo) } .desce{ color:var(--negativo) }
.neutro{ color:var(--texto-3) }

.kpi-pe{
  display:flex; gap:16px;
  margin-top:9px; padding-top:8px;
  border-top:1px solid var(--borda);
}
.kpi-pe div{ min-width:0 }
.kpi-pe dt{ font-size:11px; color:var(--texto-3); white-space:nowrap;
            overflow:hidden; text-overflow:ellipsis }
.kpi-pe dd{ margin:1px 0 0; font-size:13.5px; font-weight:650 }

/* --------------------------------------------------------------------------
   9. Gráfico
   -------------------------------------------------------------------------- */
.graf{ width:100%; height:auto; display:block; overflow:visible }
.graf .eixo{ font-size:10.5px; fill:var(--texto-3) }
.graf .linha-grade{ stroke:var(--grade); stroke-width:1 }
.graf .serie{ fill:none; stroke:var(--acento-cheio); stroke-width:2.25;
              stroke-linecap:round; stroke-linejoin:round }
.graf .area-serie{ fill:url(#veu-serie); stroke:none }
.graf .ponto{ fill:var(--acento-cheio) }

/* Rótulo de dados — o padrão da casa. Quando ele aparece, o eixo Y sai
   inteiro: os dois dizem a mesma coisa e juntos viram ruído. Ver a regra
   no `desenhaLinha` do molde. Cor de texto normal, não de eixo: ele é
   conteúdo, não referência. */
.graf .rotulo{ font-size:11px; font-weight:650; fill:var(--texto);
               font-variant-numeric:tabular-nums }

/* --------------------------------------------------------------------------
   10. Ranking com barra
   -------------------------------------------------------------------------- */
.rank{ list-style:none; margin:0; padding:0; display:flex;
       flex-direction:column; gap:11px }
.rank li{ display:grid; grid-template-columns:22px 1fr auto; gap:10px;
          align-items:center }
.rank .pos{ font-size:12px; color:var(--texto-3); text-align:right }

/* `display:block` nos dois não é enfeite: são <span>, e em caixa inline
   `height` não vale (a barra saiu com 0px de altura, invisível) e
   `text-overflow:ellipsis` não corta. Só apareceu medindo no navegador —
   o smoke conta <li>, não mede pixel. */
.rank .nome{ display:block; font-size:13px; overflow:hidden;
             text-overflow:ellipsis; white-space:nowrap }
.rank .barra{ display:block; height:5px; border-radius:3px;
              background:var(--acento-veu); margin-top:5px; overflow:hidden }
.rank .barra i{ display:block; height:100%; border-radius:3px;
                background:var(--acento-cheio) }
.rank .val{ font-size:13px; font-weight:650 }

/* --------------------------------------------------------------------------
   11. Tabela
   -------------------------------------------------------------------------- */
.rolo{ overflow-x:auto; margin:0 -18px -18px; padding:0 18px 18px }
table{ width:100%; border-collapse:collapse; font-size:13px }
thead th{
  position:sticky; top:0;
  background:var(--superficie-2);
  color:var(--texto-2); font-weight:600; font-size:12px;
  text-align:center; white-space:nowrap;
  padding:9px 10px;
  border-bottom:1px solid var(--borda);
}
tbody td{ padding:9px 10px; text-align:center;
          border-bottom:1px solid var(--borda) }
tbody td:first-child, thead th:first-child{ text-align:left }
tbody tr:last-child td{ border-bottom:none }
tbody tr:hover td{ background:var(--acento-veu) }

.tag{
  display:inline-block; font-size:11.5px; font-weight:600;
  padding:2px 8px; border-radius:999px;
  background:var(--acento-veu); color:var(--acento);
}
.tag.ok{ background:color-mix(in srgb, var(--positivo) 16%, transparent);
         color:var(--positivo) }
.tag.ruim{ background:color-mix(in srgb, var(--negativo) 16%, transparent);
           color:var(--negativo) }
.tag.atencao{ background:color-mix(in srgb, var(--atencao) 18%, transparent);
              color:var(--atencao) }

/* --------------------------------------------------------------------------
   12. Rodapé e glossário
   -------------------------------------------------------------------------- */
.rodape{ color:var(--texto-3); font-size:12px; padding:4px 2px 0 }
.rodape a{ color:var(--acento) }

/* Glossário — cartão próprio, não rodapé da tabela.
   ---------------------------------------------------------------------------
   Ele vivia DENTRO do cartão da tabela, e essa posição dizia "isto explica a
   tabela". Não explica: explica a página inteira. Agora é bloco irmão dos
   outros, e o <details> é o cartão em si — clicar no cabeçalho abre. */
.gloss{ padding:0 }
.gloss > summary{
  cursor:pointer; padding:18px; margin:0;
  list-style:none;               /* Firefox */
  border-radius:var(--r-g);
}
.gloss > summary::-webkit-details-marker{ display:none }
.gloss > summary:focus-visible{ outline:2px solid var(--acento); outline-offset:-2px }
.gloss .seta{ color:var(--texto-3); font-size:11px; transition:transform .15s }
.gloss[open] > summary{ border-radius:var(--r-g) var(--r-g) 0 0 }
.gloss[open] .seta{ transform:rotate(180deg) }

.gloss dl{
  margin:0; padding:0 18px 18px;
  display:grid; grid-template-columns:auto 1fr; gap:9px 18px;
  font-size:12.5px;
}
.gloss dt{ font-weight:650; white-space:nowrap }
.gloss dd{ margin:0; color:var(--texto-2) }

@media (max-width:620px){
  /* Em tela estreita o termo e a definição empilham: duas colunas com termo
     longo espremem a definição em duas letras por linha. */
  .gloss dl{ grid-template-columns:1fr; gap:2px 0 }
  .gloss dt{ white-space:normal; margin-top:8px }
  .gloss dt:first-child{ margin-top:0 }
}

/* --------------------------------------------------------------------------
   13. Impressão — o painel vira PDF com alguma frequência
   -------------------------------------------------------------------------- */
@media print{
  body{ background:#fff; color:#000 }
  .topo{ position:static }
  .topo-acoes{ display:none }
  .cartao{ box-shadow:none; border:1px solid #ccc; backdrop-filter:none;
           break-inside:avoid }
  .cartao::before{ display:none }
}

/* Quem desliga animação no sistema não deve ganhar nenhuma aqui. */
@media (prefers-reduced-motion:reduce){
  *{ transition:none !important; animation:none !important }
}

```
