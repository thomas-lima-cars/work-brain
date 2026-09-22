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
- **Uma margem esquerda só** (21/09/2026). O subtítulo de seção leva um chip
  de ícone, e o chip empurrava o *texto* do subtítulo para dentro enquanto
  termo, definição e tabela começavam colados na borda do cartão — duas
  verticais diferentes alternando a cada seção. O chip fica na margem, e todo
  o resto nasce na mesma vertical.
- **E ocupa a largura toda, em colunas** (21/09/2026). Limitar a *linha* é
  certo — linha de 200 caracteres não se lê. Errado é limitar deixando metade
  do cartão em branco, que foi o que aconteceu: 645px de texto num bloco de
  1.300. Colunas resolvem as duas coisas de uma vez.

  ```css
  .gl dl{ padding-left:44px;          /* 34 do chip + 10 do intervalo */
          columns:2 34em; column-gap:44px }
  .gl dt{ break-inside:avoid; break-after:avoid }
  .gl dd{ break-inside:avoid; break-before:avoid }
  @media(max-width:620px){ .gl dl{ padding-left:0 } }
  ```

  `columns:<contagem> <largura>` é **no máximo** N colunas, cada uma com **pelo
  menos** aquela largura: onde não cabem duas, vira uma sozinha. Sem media
  query, e a medida da linha nunca passa do legível.

  Os três `break-*` **juntos** fazem o verbete inteiro — termo, definições e
  tabela — virar um bloco que a coluna leva junto ou não leva. Só
  `break-inside` deixa o termo no pé de uma coluna e a tabela que o explica
  desgarrada na outra, 300px abaixo. Aconteceu.

**Por que obrigatório:** quem recebe o painel não estava na conversa em que o
termo foi definido, e "deságio" não quer dizer a mesma coisa para todo mundo.
Termo que aparece na tela e não está no glossário é uma pergunta que chega por
mensagem depois.

🔒 A prova é **estrutural**: conta `<section>` abertas e fechadas antes do
glossário e exige que estejam equilibradas.

## 4b. Bloco retrátil

Bloco que se abre e fecha é `<details>` **sendo** o cartão — não um cartão com
um `<details>` dentro. O `<summary>` recebe a classe do cabeçalho, e o
cabeçalho inteiro vira área de clique.

```css
.gl,.dobra{ padding:0 }
.gl>summary,.dobra>summary{ cursor:pointer; list-style:none; border-radius:var(--r-g) }
.gl>summary::-webkit-details-marker,.dobra>summary::-webkit-details-marker{ display:none }
.gl[open] .seta,.dobra[open] .seta{ transform:rotate(180deg) }
```

**As regras são compartilhadas por seletor, não copiadas.** São hoje dois
blocos — glossário e extrato — e folha duplicada significa um dos dois
apodrecendo calado na próxima mexida.

| bloco | nasce | por quê |
|---|---|---|
| glossário | **fechado** | é referência: quem precisa, abre |
| extrato / detalhe da seleção | **aberto** | é o motivo de ter clicado |

O estado **não** é guardado: o bloco é reescrito a cada render, e guardar
custaria uma variável para economizar um clique.

## 4c. Resumo mora junto do que ele resume

Caixa de contexto ("você selecionou X") a uma tela de distância do bloco que
detalha X é a mesma frase escrita duas vezes, em dois lugares que divergem na
próxima mexida. O resumo vai **dentro** do bloco, e sem repetir o que o título
do bloco já diz.

Quando a seleção **não** tem bloco de detalhe (no Radar, o veículo), aí sim a
caixa própria se justifica — e continua existindo só para esse caso.

## 5. Topo

**Fixo, em superfície — não em barra colorida de marca.**

**Três colunas, e o título fica no meio** (decidido em 21/09/2026):

| posição | o que vai |
|---|---|
| esquerda | só a logo |
| **centro** | **o título do painel, centrado, a 22px** |
| direita | as ações — troca de tema, e o ícone de ponto de atenção antes dela |

```css
.topo-in{ display:grid; grid-template-columns:1fr auto 1fr; align-items:center }
.topo-tit{ text-align:center }   .topo-tit h1{ font-size:22px }
```

**Por que grade e não flex:** com flex o centro do título depende da largura da
logo e de quantas ações houver na direita — basta um botão a mais para ele
escorregar. `1fr auto 1fr` prende o meio no meio da barra, aconteça o que
acontecer nos lados.

**Por que 22px:** o nome do painel é a primeira coisa que se lê. Em 17px ele
perdia para o número do KPI logo abaixo, que é o dado **menos** interessante da
página (regra 2). Hierarquia invertida.

Barra sólida da cor da marca consome atenção o tempo todo e obriga a inverter
o contraste de tudo que está em cima dela. Superfície com `border-bottom`
resolve, e o acento sobra para o que é dado.

**No telefone** as colunas viram `auto 1fr auto` e a logo encolhe para 18px:
com `1fr auto 1fr` as laterais reservam largura igual e quem espreme é o
título, que é o maior dos três.

**O que NÃO vai no topo:**

- **Botão para o glossário.** Ele abre no próprio lugar, no fim da página.
- **"Gerado em".** Vai no rodapé, junto da descrição da base.
- **Título de seção** ("Aderência por veículo") e **subtítulo de recorte**.
  O título do painel já está no topo; repetir logo abaixo é redundância que
  come a primeira dobra.

⚠️ Um `display` explícito no `.topo` é obrigatório (`grid` hoje, `flex` até
20/09). Substituir a folha inteira e esquecer dele faz a logo cair numa linha
e o título noutra — aconteceu.

### O topo não tem fundo (22/09/2026)

**Nem cor, nem borda, nos dois temas.** O fundo da página passa por ele
inteiro: no alto da página não há barra nenhuma, só a página continuando até a
borda de cima. Tirar a `border-bottom` é parte da mesma decisão — linha
atravessando a tela é o que faz uma barra parecer barra.

```css
.topo{ position:sticky; top:0; background:transparent;
       backdrop-filter:var(--cartao-blur) }
```

⚠️ **O `backdrop-filter` fica, e não é enfeite.** O topo é `sticky`: rolando a
página, o conteúdo passa por baixo dele. Sem fundo e sem blur, o título
ficaria por cima de texto nítido em movimento. Com o blur, o que passa vira um
borrão claro e o título continua legível.

⚠️ **Consequência:** o subtítulo do painel deixou de estar sobre uma superfície
e passou a cair no campo. Ele usa `--texto-2`, não `--texto-3` — ver regra 10c.

### 5a. A marca tem duas larguras (22/09/2026)

**Extensa na web, curta no telefone.** São artes diferentes, não a mesma
encolhida.

| arte | caixa | na barra, a 26px |
|---|---|---|
| extensa — a marca por extenso | 933 × 168 (5,55:1) | 144px |
| curta — o `c2y` | 990 × 454 (2,18:1) | 57px |

Encolher não resolvia: a 18px de altura a extensa ainda ocupava **100px de uma
barra de 360**, e o título quebrava em uma palavra por linha. A curta, na mesma
altura, ocupa 39 — e por isso pode ser **mais alta** (22px) e ainda assim caber
melhor.

🔴 **As duas vivem dentro de UM invólucro** (`.marca` no modelo, `.esq` no
Radar). Soltas, seriam dois filhos do `.topo-in`, e a grade de três colunas
viraria de quatro: o título sai do centro. Mesma família da armadilha que o
`display` explícito do `.topo` já registra.

**Quem troca a arte é o CSS; quem troca a cor é o JS.** A largura é
`@media`, então sobrevive a imprimir, a redimensionar e a rodar sem script, e
não pisca na carga. A cor depende do tema, que é estado do documento.

```css
.marca{ justify-self:start; min-width:0; display:block; line-height:0 }
.logo{ height:26px; width:auto; display:block }
.logo-curta{ display:none }
@media(max-width:620px){
  .logo-extensa{ display:none }
  .logo-curta{ display:block; height:22px }
}
```

A escondida sai da árvore de acessibilidade com o `display:none`, então as duas
podem levar o mesmo `alt` sem repetir no leitor de tela.

⚠️ **SVG sem `viewBox` não escala.** Cinco dos seis arquivos entregues vieram
só com `width`/`height`: num `<img>` com `height:26px` a arte é **cortada**, não
reduzida. O `viewBox` que está neles saiu de medir a caixa com `getBBox` — não
de ler o atributo, que era justamente o que faltava.

**O "preto" da marca é `#3A4552`** — o mesmo `--texto`/`--acento` do tema
claro. Marca e letra da página são a mesma tinta, e é por isso que ela assenta
em vez de saltar.

### Ponto de atenção: ícone, não cartão

Aviso de coleta (query que falhou, par descartado, teto batido) vive num
**ícone no topo, antes da troca de tema**, e conta o resto numa dica. Não num
cartão de largura inteira acima do conteúdo.

O cartão cobrava a primeira dobra **todos os dias** para dizer, quase sempre,
a mesma coisa. O ícone nasce escondido, aparece só quando há algo, traz a
contagem no canto — e no dia limpo não ocupa nada.

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
- **O papel da cor muda entre os temas.** Desde 22/09 o claro também é vidro,
  então os dois compartilham a forma (`--r-g/--r-m/--r-p` ficam no bloco
  comum) e divergem só na cor. Um raio por tema seria a divergência que
  ninguém vê até pôr os dois lado a lado.
- **Regra escrita à mão precisa escolher o tema pelo NEGATIVO.** O claro é o
  padrão e vale também quando não há `data-tema` nenhum no `<html>`:

  ```css
  :root:not([data-tema="escuro"]) .topo{ … }   /* ✅ pega o claro e o sem-atributo */
  [data-tema="claro"] .topo{ … }               /* ❌ documento sem atributo fica de fora */
  ```

  Com o seletor do atributo, um documento sem `data-tema` ficaria com os
  **tokens** do claro e as **regras** do escuro — meio tema, e ninguém percebe.

## 8. Tabela

O modelo **centraliza** as colunas. A exceção documentada é **tabela densa e
numérica**: número se compara pela direita, texto fica à esquerda.

O Radar de Estoque usa a exceção — nove colunas, quase todas número.

⚠️ O seletor do tema é `thead th` (especificidade 2). Sobrescrever com `th`
puro **não funciona**: o tema vence e a tabela inteira vai para o centro.

## 8b. Dica (tooltip)

Detalhe que só interessa a uma linha de cada vez mora numa **dica**, não numa
tabela fixa em cima. Um bloco de referência que fica longe de onde se usa
obriga a decorar o número e descer comparando de memória.

**Um balão só para a página inteira** (`#dica`), preenchido na hora. Um balão
por alvo, escondido no HTML, multiplica o peso da página por cada linha — e
elas são reescritas a cada mexida num filtro.

```css
.dica{ position:fixed; pointer-events:none; width:max-content; max-width:min(700px,94vw) }
```

- **`fixed`, nunca `absolute`.** Tabela longa mora dentro de caixa com
  `overflow:auto`, e balão absoluto dentro dela é cortado na borda — nasce
  pela metade ou invisível. Quem posiciona é o JS, por `getBoundingClientRect`.
- **`pointer-events:none`.** O balão costuma nascer por cima do que o abriu:
  sem isso ele rouba o mouse do alvo, o alvo recebe `mouseleave`, o balão some,
  o mouse volta — e a tela pisca sozinha.
- **`width:max-content`.** Com largura fixa a coluna de texto quebra em quatro
  linhas por item e o balão sai pela base da tela.
- **Abre por `hover`, por `focus` e por clique.** Só hover deixa de fora quem
  abre no telefone e quem navega por teclado.

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

### 10b. Mede contra o pior plano, não contra branco (22/09/2026)

O cartão do tema claro tem **degradê**, mais escuro no canto superior
esquerdo. Isso moveu o piso: medir contra `#FFFFFF` deixou de descrever
qualquer lugar real da tela.

```
cartão    #E3E8EC (canto sup. esq.)  →  #FDFEFE (canto inf. dir.)
cabeçalho #ECF0F4                    →  #F3F5F8
campo     #D8E1E9
```

O pior plano é o **canto escuro do cartão** — e não por acaso: é ali que ficam
o chip e o título de cada cartão. Foi assim que o `--positivo` antigo passou a
reprovar: 5,16:1 sobre branco, **4,22:1 no canto**, exatamente onde o KPI
escreve "▲ 4,2% vs. período anterior".

🔒 O `_prova_modelos.js` mede contra `#E3E8EC`, não contra branco.

### 10c. Texto sobre o campo passa pelo medidor

O campo do tema claro é `#D8E1E9` — tem cor, então já não é papel em branco.
Quase todo texto mora dentro de cartão e a pergunta não aparece. **O
cabeçalho é a exceção**: desde 22/09 ele não tem fundo nenhum (regra 5), e o
subtítulo do painel é o único texto que cai direto no campo.

Isso custou um tom: `--texto-2` desceu de `#5B6875` para `#55626F`, porque o
anterior dava **4,31:1** sobre o campo. Agora:

```
sobre o campo #D8E1E9    texto 7,37   texto-2 4,72   positivo 4,74   ✓ AA
                         texto-3 3,19  ✗ — de-ênfase NÃO vai no campo
```

🔒 O `_prova_modelos.js` mede o secundário contra o campo nu, além do canto do
cartão. Escurecer o campo ou clarear o secundário reprova ali.

**A de-ênfase (`--texto-3`) continua sendo só de superfície.** Ela existe para
apagar o que está perto do que importa — no campo, sem nada por perto, ela só
fica ilegível.

### 10d. O acento do claro não é mais o azul da marca (22/09/2026)

`--acento` é `#3A4552`, o mesmo cinza escuro do texto. O azul da marca
(`--marca-azul-claro`) ficou em `--acento-cheio` e pinta **só o dado**: linha
de gráfico, ponto, barra de ranking. Uma cor por página, na parte que importa.

⚠️ **Consequência ainda não resolvida:** link perdeu a cor que o distinguia do
texto corrido. Onde houver link em texto, ele precisa se anunciar por
**sublinhado** — não há mais diferença de cor para carregar esse trabalho.

## 11. Como o arquivo é produzido

**Modelo é gerado de uma fonte só**, nunca mantido em duplicata:

```bash
node design/modelos/monta-modelos.js && node design/monta-kit.js && node design/_prova_modelos.js
```

São **três** alvos saindo do `tema.css`: os dois modelos e o
[`kit-de-painel.md`](kit-de-painel.md), o arquivo único que vai para quem não
tem este repositório. O kit carrega a folha inteira dentro de si — a prova
reaplica a tabela de trocas de caminho do `monta-kit.js` sobre o `tema.css` e
exige igualdade, então **nada além dos comentários que apontam para pastas
daqui pode divergir**.

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

⚠️ **Seletor descendente onde cabia filho** é a armadilha desta família.
`.xk span{display:block}` foi escrito para o rótulo do bloco e passou a pegar
todo `<span>` de dentro dele — inclusive os que rotulam cada telefone, que
viraram uma coluna em vez de uma lista horizontal. `>` quando o alvo é o filho
direto, e a prova confere o **texto da folha**: a regra certa tem que estar lá,
a larga não pode voltar.

**Como abrir qualquer HTML do repo no navegador:** `.claude/launch.json` traz o
alvo `previa-radar`, um servidor estático de 20 linhas
(`.claude/servidor-previa.js`) servindo a raiz do repo em `localhost:8777`.
Existe porque `file://` não abre da ferramenta, e porque medir alinhamento em
print reduzido foi exatamente o erro que esta regra 12 registra — o desencontro
de 8px no glossário (21/09) só apareceu no `getBoundingClientRect`.

---

## Onde cada coisa mora

| | |
|---|---|
| Tokens, componentes, os dois temas | `design/tokens/tema.css` |
| Modelos prontos | `design/modelos/` |
| O padrão para quem é de fora | `design/kit-de-painel.md` (gerado) |
| Paleta e logo por produto | `design/paletas/` · `design/marca/` |
| Estas regras | este arquivo |
