# Modelos de painel

Dois arquivos, mesmo molde, uma linha de diferença: o `data-tema` do `<html>`.

| arquivo | tema | quando usar |
|---|---|---|
| `dashboard-claro.html` | claro | **padrão.** A paleta foi pensada pra ele. Imprime melhor, e é o que a maioria abre no trabalho |
| `dashboard-escuro.html` | escuro, com vidro | tela grande, painel de parede, apresentação |

Os dois trazem um botão que troca o tema ao vivo — dá pra mostrar as duas
opções numa reunião sem abrir outro arquivo.

## ⚙️ São gerados. Não edite.

```bash
node design/modelos/monta-modelos.js    # molde + tema.css + logos → os dois
node design/_prova_modelos.js           # 120 provas
```

Edite **`_fonte/dashboard.html`** (estrutura e conteúdo) ou
**`../tokens/tema.css`** (cor, forma, espaçamento).

## Começar um painel novo

1. Copie `dashboard-claro.html` pra pasta do projeto, com nome que diga o que é.
2. Troque o bloco `const DADOS = {...}` no `<script>`. **Nada abaixo dele
   precisa mudar** — KPI, gráfico, ranking, tabela e glossário se redesenham
   sozinhos.
3. Troque título e subtítulo.
4. Tire as seções que não usar. Cartão é independente — **menos o glossário**.

## 📖 O glossário é peça fixa

**Todo painel tem um.** É o último bloco, cartão próprio, alimentado por
`DADOS.glossario`:

```js
glossario: [
  ["Deságio", "1 − (valor de venda ÷ FIPE do anúncio)."],
  ["Venda",   "Veículo cuja última negociação válida está em status de venda."]
]
```

Ele vivia **dentro** do cartão da tabela, e essa posição dizia "isto explica a
tabela". Não explica: explica a página. Além disso, quem copiasse o modelo e
apagasse a tabela levava o glossário junto sem perceber. Agora é bloco irmão
dos outros, e há prova conferindo que ele está fora de qualquer `<section>`.

**Por que obrigatório:** quem recebe o painel não estava na conversa em que o
termo foi definido, e "deságio" não quer dizer a mesma coisa pra todo mundo.
Termo que aparece na tela e não está no glossário é uma pergunta que vai
chegar por mensagem depois.

Nasce **fechado** (72px), abre em 162px. Para nascer aberto, basta
`<details class="cartao gloss" id="gloss" open>` no molde.

Em painel de verdade, quem escreve o `DADOS` é o gerador do projeto — o mesmo
padrão de `automations/n8n-sdk/precificacao/monta-painel.js`, que injeta o
JSON já agregado.

## O que o molde já resolve

- **Abre offline** — CSS e logos dentro do arquivo, zero rede.
- **Cabeçalho fixo** com os filtros, que não somem ao rolar.
- **Responsivo** de 360px a 1680px, sem rolagem horizontal.
- **Contraste AA conferido** nos dois temas, a cada execução da prova.
- **Números tabulares** — coluna de valor não dança ao trocar o dado.
- **`@media print`** — sai o vidro, solta o cabeçalho, somem os filtros.
- **Gráfico sem biblioteca** — SVG montado à mão, porque `chart.js` via CDN
  quebra o offline e vendorizar 200 KB pra uma série não se paga.
- **Rótulo de dados por padrão, e aí o eixo Y sai** — ver a regra abaixo.

## 📊 A regra de leitura dos gráficos

**Valor no ponto e escala no eixo dizem a mesma coisa.** Mostrar os dois é
ruído, e ruído come a atenção de quem lê. Então:

| situação | o que aparece |
|---|---|
| **padrão** | rótulo em cada ponto · **sem** eixo Y, sem linha de grade |
| **série contínua e densa**, sem níveis bem definidos | eixo Y com grade · **sem** rótulo |

A exceção existe porque em série densa o rótulo colide, e o que importa ali é
a **forma**, não o valor de cada ponto.

`rotulos:'auto'` (o padrão) **decide por medição**: estima a largura do texto
e compara com o espaço disponível por ponto. Não coube, trata como série
contínua. Para mandar na mão:

```js
desenhaLinha($('#graf-linha'), DADOS.serie, {rotulos:true});   // força rótulo
desenhaLinha($('#graf-linha'), DADOS.serie, {rotulos:false});  // força eixo
```

O **eixo X fica nos dois casos** — ele diz *quando*, não *quanto*.

O ranking já segue a mesma regra por construção: o valor vai no fim da barra,
e não há escala nenhuma.

## O que ele NÃO resolve

- **Não é e-mail.** Outlook não tem variável CSS, `backdrop-filter` nem
  `color-mix`. Pra distribuir, SharePoint + link.
- **Não tem tabela grande.** Acima de ~2 mil linhas, precisa de paginação ou
  virtualização — não está aqui.
- **Não tem estado compartilhado.** Filtro do topo é enfeite no molde; ligar
  ele nos dados é trabalho de cada painel.
