# Logo — Cars2You

> 🟡 **Provisório.** O Thomas vai mandar arquivos melhores. O que está aqui é o
> que veio em 18/09, e tem limitações conhecidas — listadas abaixo para quem
> for substituir saber o que precisa resolver.

| arquivo | usar em | o que é |
|---|---|---|
| `logo-azul.png` | **fundo claro** | 300 × 56, PNG transparente, tinta `#1E289B` |
| `logo-branca.png` | **fundo escuro** | 300 × 56, PNG transparente |
| `_original-branca-cortada.svg` | — | o arquivo branco como veio. **Não usar** |

Nos painéis o logo entra com `height:26px`, embutido em `data:` URI pelo
gerador. O botão de tema troca o arquivo junto com as cores: o azul da marca
some no fundo escuro (1,65:1).

## O que o arquivo novo precisa resolver

**1. A branca que veio está cortada.** O `logo_car2you_branca.svg` **não é
vetor**: é um PNG de 179 × 82 embrulhado numa tag `<svg>` com `<pattern>`. E o
PNG de dentro está **recortado** — só cabem `c`, o `2` quadriculado e o `y`; as
letras `ars` e `ou` ficaram fora do quadro.

A `logo-branca.png` daqui foi gerada do arquivo azul (mesma silhueta pelo canal
alfa, tinta trocada por branco) só para o tema escuro não ficar sem logo.

**2. Não é vetor, e a resolução é baixa.** A letra tem ~33px de altura. Em tela
grande, em HiDPI e na impressão a borda escadeia. `.svg` com `<path>`, `.ai` ou
`.eps` resolve de vez e permite gerar qualquer tamanho e qualquer cor.

**3. A arte encosta nos quatro lados do canvas.** O PNG foi exportado no
recorte exato: alfa cheio na borda esquerda (o `c`), na de cima (o `2`), na de
baixo (o `y`) e na direita (o `u`). Sem folga, o renderizador come o
anti-serrilhado da extremidade e a letra parece cortada. Uma margem de 1 a 2px
no arquivo novo evita isso.

**4. A tinta não bate com a paleta.** O PNG azul veio com **`#1E289B`**; a
paleta oficial diz **`#1523A0`**. Decisão atual: o logo fica como veio (mexer
nele é assunto da marca) e a interface usa o valor da paleta. Se o arquivo novo
vier no tom da paleta, esta ressalva cai.
