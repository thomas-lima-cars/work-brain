# Mega Evento Fenauto (Cars2You)

> Irmão do [Eventos Fenauto C6](../painel-eventos-fenauto-c6/README.md), nascido
> em **03/11** a pedido do Thomas: a **identidade da Cars2You**, a logo da
> Fenauto (com a Cars2You embaixo) **à esquerda** e o **título e o subtítulo
> no centro**, os eventos do **C6 e do IGA** da semana e um **filtro de
> evento em botões à vista**. Sem representante, como o irmão.

**Estado em 2026-11-12:** novos lojistas pelos **grupos de clientes** da
campanha (Thomas, 12/11, abaixo), por operação, **separados em novos e
reativados** (12/11, tarde), e filtro de **Operação** (11/11); HTML, 339
provas e o `.wf.ts` regerados, local. Desde 09/11, só os
eventos com **Fenauto no nome**. Nada disso foi ao n8n: o painel vai ao n8n
pela [Rotina Fenauto](../rotina-fenauto/README.md), que precisa ser
regerada (`_divide.js`) depois desta mudança e espera o ok final do Thomas.

### 12/11 (tarde): novos e reativados separados; vendidos com a vencedora sem loja

As duas mudanças do irmão [IGA](../painel-eventos-fenauto-iga/README.md),
trazidas para cá (Thomas: "separe clientes novos de reativados"; o cartão de
Vendidos dava 3 com 4 na tabela).
- **Novos lojistas** = só as lojas cadastradas de 10/11 em diante.
  **Reativados** = as antigas sem compra que voltaram, num **sexto cartão**
  (grade `.g4.g5` em 6 colunas), com engajamento, acessaram, ofertaram e
  compraram. O tipo sai do Montar Painel: `reativada` = tem entrada em alguma
  operação (`fenauto_c6` ou `fenauto_iga`) e a loja é de antes de
  `inicio_campanha`. O início é um só e o cadastro é da loja, então o tipo é o
  mesmo nas duas operações; a regra por operação (cliente do C6 só em evento
  do C6, do IGA só no do IGA) não mudou. SQL e Montar Consultas intactos.
- O funil é só dos novos cadastros; o dos reativados vai só para o cartão.
  Gráficos por dia e por hora com a série **Reativados** em **laranja**
  (`--serie-3`: #C2570C no claro, #D9692B no escuro, no CSS do painel). O
  verde do IGA reprovava aqui: contra o cinza `--serie-2` da Cars2You o
  validador de paleta dava ΔE 2,2 em deuteranopia. O laranja passa CVD,
  visão normal e contraste contra o cinza e o azul nos dois temas (só falha o
  piso de croma do próprio cinza, que já existia).
- Ranking com o selo nova/reativada e os botões Todos lojistas / Novos /
  Reativados; Resultado do veículo com novo/reativado; CSV com a coluna Tipo.
  Glossário com Novos lojistas e Reativados separados, pelos grupos das duas
  operações.
- **Vendidos**: a venda conta pela própria negociação (com Data, pelo dia da
  oferta vencedora, o `vq` do veículo), e não pela lista de ofertas, que
  descarta oferta sem loja. A vencedora da 516768 (evento 24377 do IGA,
  11/11) foi lançada por usuário interno: entra nos vendidos e no valor, não
  nos compradores nem no ranking. O aviso de lance sem loja diz isso.
- Na prova (semana da Fenauto 2025): 212 novas e 199 reativadas (C6 5 + 132,
  IGA 207 + 67). 341 provas (eram 332): a separação refeita do cru em todo
  recorte (total, evento, operação, Data, por dia e por hora, funil, cartão),
  o tipo nas plantas, a venda com a vencedora sem loja plantada, a tela
  (cartão, série, selo, botões, CSV, glossário).

### 12/11: novos lojistas pelos grupos

Pedido do Thomas: "clientes novos: quem se cadastrou a partir de 10/11 e
está no grupo VD Itaú – Fenauto 2026 (ou equivalente no C6)" e "antigos sem
compra que voltaram". Cliente da operação = loja com usuário **externo** num
grupo dela: IGA, **148** "VD Itaú - Fenauto 2026"; C6, **69** "Parceiros C6 -
Geral" e **146** "Parceiros C6 - Exclusivo SP". Fora: interno
(@cars2you.com.br), conta do banco (@itau, @c6bank), teste (no e-mail ou no
nome da loja) e loja apagada. Cada loja ganha uma **entrada** por operação
(`fenauto_c6`, `fenauto_iga`): o cadastro da loja, se a partir de 10/11; senão,
se **não comprou** em [10/05, 10/11) (oferta vencedora de negociação vendida),
o **primeiro acesso** à plataforma a partir de 10/11; senão nada (comprador
dos últimos 6 meses aparece só nos acessos). Novas e antigas que voltaram
somam no número de **Novos lojistas** que já existia. Nova num evento = a
entrada da operação dele até o **dia do fim** do evento, sem piso no início
(quem entrou em 10/11 conta no evento de 11/11); com vários eventos, nova em
algum; com **Data**, só a entrada daquele dia, num dia do evento — quem entrou
antes do primeiro dia conta no total e em nenhum botão de Data. A consulta de
lojas faz **uma passada só** no `access_logs` (o universo já carrega as duas
entradas): 22,8 s na coleta de 12/11. A campanha do formulário
(`register_form_value`, a regra de 11/11) saiu. Na coleta de 12/11 (11h20):
C6 76 (7 novas + 69 que voltaram), IGA 122 (84 + 38), 198 no total. Na
prova, `coleta_local.py --prova` troca o início (10/11/2025), a janela sem
compra (10/05/2025) e o grupo do IGA 148 → **133** "VD Itaú - Fenauto 2025"
(375 usuários), conferindo cada troca no SQL; os do C6 ficam. 332 provas
(eram 316), com entradas plantadas.

**12/11 (fim da tarde): um veículo só** (Thomas: "cada veículo deve aparecer somente uma vez, mesmo que esteja em 2 eventos"). O carro que não vendeu num evento volta no seguinte com outra negociação. Nos números de veículos (publicados, com ofertas, VMV atingido, vendidos, acessados, pátios, participações) e na lista, ele conta uma vez: com oferta, VMV atingido, acessado ou vendido se foi em algum evento do recorte. Na lista, uma linha com o status da negociação que vendeu (ou da mais recente), as ofertas somadas, a maior e a última de todas, o melhor % VMV/FIPE e farol, as lojas distintas que abriram os anúncios, e "em N eventos". Filtrando um evento, nada muda. Lances seguem todos. Coleta de 12/11: 159 negociações, 138 carros. **341 provas** (com o carro plantado em duas negociações).

```
Rodar → Montar Consultas → MCP Consultas → Montar Painel → Virar Arquivo → Subir no SharePoint
```

Publicaria em `Mega Evento Fenauto/mega-evento-fenauto.html` no site N8N.
Gatilho manual. Projeto previsto: Cars2You (`yAo7DiqDfz6XfXyv`), o mesmo dos
irmãos — sem tabela de dados, nada obriga.

Números das duas coletas: [`projetos/mega-evento-fenauto/indicadores.md`](../../../context/banco-de-dados/projetos/mega-evento-fenauto/indicadores.md).

### 11/11: cliente por operação e filtro de Operação

Pedido do Thomas: "filtrar somente clientes da C6 quando filtrar eventos ou
whitelabel do C6 e somente IGA quando filtrar ITAÚ". A loja nova passa a ser
pela **campanha da operação do evento**: `"fenauto <ano> c6"` nos eventos do
C6 e `"fenauto <ano> iga"` nos do IGA (o ano da semana; a consulta de lojas
traz `fenauto_c6` e `fenauto_iga` no lugar de `fenauto`). Nova num evento =
o cadastro daquela campanha cai num dia dele, o dia inteiro; com vários
eventos, nova em algum. Novo filtro **Operação** (Todas / C6 / Itaú), uma
linha de botões logo acima da de Evento: C6 ou Itaú é como escolher todos os
eventos da operação (o corte é da `calcula()`, `F.op`), os botões de Evento
ficam só com os dela, evento de outra operação volta a Todos e o Limpar volta
a Todas; o subtítulo abre com a operação. "Fenauto 2026 C6" ainda não existe
(medido em 11/11), então o C6 mostra 0 cliente. 316 provas (eram 273), com
cadastros do C6 plantados.

## As regras (Thomas, 03/11)

| | |
|---|---|
| **Recorte** | os eventos do **C6** e do **IGA** com **"fenauto" no nome** (09/11), abertos em algum momento da **semana corrente**, de segunda 00:00 a domingo 23:59, hora de Brasília. A semana anda sozinha: o nó calcula a segunda de hoje. Em 09/11: C6 24368 e 24384, IGA 24377 a 24379 — os mesmos dos painéis Fenauto C6 e Fenauto IGA; ficam fora as vendas diretas do IGA (24364 e 24382). Até 08/11 entrava todo evento do C6 e do IGA da semana |
| C6 | evento que alveja o whitelabel 43 — o critério do Painel de Eventos C6 |
| IGA | evento com veículo dos vendedores 594, 598 ou 16036 — o critério do Estudo de Vendas IGA. Os eventos do IGA alvejam os whitelabels 5 e 7, então o canal não acha eles |
| **Loja nova** | (12/11) cliente da **operação do evento** — usuário externo no grupo 148 (IGA) ou nos 69 e 146 (C6) — com **entrada** (cadastro a partir de 10/11, ou o primeiro acesso a partir de 10/11 de quem não comprou nos 6 meses antes) **até o dia do fim** daquele evento; com vários eventos, nova em algum; com Data, a entrada daquele dia. Até 11/11: o cadastro do perfil pela campanha do formulário ("fenauto <ano> c6/iga") num dia do evento; até 10/11, qualquer "fenauto" |
| Filtro de operação | (11/11) **botões Todas / C6 / Itaú numa linha logo acima da de Evento**: C6 ou Itaú = todos os eventos daquela operação; os botões de Evento ficam só com os dela; evento de outra operação volta a Todos; Limpar volta a Todas |
| Filtro de evento | **botões numa linha própria logo acima da Data**: Todos e um por evento, na ordem de início, com a operação (C6/IGA) e o estado. Saiu da gaveta |
| Título | "Mega evento Fenauto", no centro do topo (na primeira versão do dia, à direita). Subtítulo: a operação escolhida (11/11), o evento escolhido (período e estado) ou "C6 e IGA · N eventos na semana de … a …" e o período, mais "com filtros" — o do painel do C6 |

## O que mudou em relação ao Eventos Fenauto C6

| | Fenauto C6 | Mega Evento Fenauto |
|---|---|---|
| Tema | `tema.css` + `tema-c6.css` (amarelo no escuro) | **`tema.css` sozinho** — a identidade da Cars2You |
| Topo | C6 à esquerda, Fenauto no centro, sem título | **Fenauto à esquerda**, título e subtítulo **no centro** (a grade do tema, `1fr auto 1fr`); no telefone, uma linha cada, com reticências |
| Cor da Fenauto no claro | `#242424` (a tinta do C6) | **`#3A4552`**, o `--texto` do tema claro e o preto da marca Cars2You (o README da marca pedia essa conferência). Branca no escuro, igual |
| Recorte | WL 43 com Fenauto no nome, da semana | C6 + IGA com Fenauto no nome, da semana, teto de 31 dias de duração |
| Acesso ao evento | `al.whitelabel_id = 43` | **sem trava de canal**: o `event_id` já diz de que evento é |
| Pacote de acessos | loja × dia × hora | **evento** × loja × dia × hora — sem o evento, escolher o C6 contaria os acessos do IGA que corria na mesma hora |
| Loja nova | grupo 146, cadastro da loja num dia do evento | grupos da campanha **da operação** (12/11), cadastro ou volta até o fim do evento |
| Filtro de evento | select na gaveta | botões à vista, acima da Data |
| Avisos | vendedor ≠ 104754 | vendedor fora da operação do evento; **lance sem loja compradora** (2 na semana de prova) |
| Link do anúncio | vitrine do C6 | vitrine do C6 nos eventos do C6, cars2you.com.br nos do IGA (sem aviso) |
| Cores sem dono | `--serie-2` e `--farol-abaixo` vinham da camada do C6 | definidas no painel, as mesmas do Painel de Eventos Cars2You. Sem elas a barra Total e o farol amarelo ficavam **invisíveis** — achado pela prova nova "toda variável usada está definida" |

Todo o resto — score, venda, performance financeira, funil, gráficos, pátios,
veículos, filtros de Lojistas, Pátio e Status e o cálculo da Data — é **o
mesmo código** dos irmãos.

### O teto de 31 dias

Existe por causa do evento **266 "Anúncios cancelados"**: aberto de 2021 a
2025, com 10 mil negociações do IGA. É um balde de anúncio, não um evento, e
qualquer semana até dez/2025 o pegaria.

### Escolhas minhas, para o Thomas confirmar

- ~~**Loja nova vale para os dois.**~~ Resolvida em 11/11: cada operação com a
  campanha dela. Na semana de prova, o 22231 (C6) caiu de 221 lojas novas
  para 0 e o 22223 (IGA) ficou com as 221 da "Fenauto 2025 IGA".
- ~~**Data do perfil, não da loja.**~~ Saiu em 12/11 com a campanha do
  formulário: a entrada agora é o cadastro da loja ou a volta.
- **Acesso sem trava de canal.**

## Ciclo

```bash
python coleta_local.py               # a semana de hoje (VPN) -> dados-local.json
python coleta_local.py --prova       # a semana da Fenauto 2025 (17/11/2025): o 22231 (C6) e o 22223 (IGA) -> dados-prova.json
node _aplica-modelo.js               # tema.css + Fenauto inline para dentro do Montar Painel
for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
node prova-local.js                  # 341 provas
node monta_local.js                  # saida-local.html (a semana de hoje)
node monta_local.js dados-prova.json saida-prova.html
python build_wf.py                   # mega-evento-fenauto.wf.ts
```

`--semana 2026-11-09` coleta outra semana (a segunda-feira).

Para ver: `previa-radar` em `.claude/launch.json`, em
`http://localhost:8777/automations/n8n-sdk/painel-eventos-fenauto-cars2you/saida-local.html`
(e `saida-prova.html`).

**Nada vai ao n8n sem a aprovação final do Thomas.** Depois de criar, antes de
rodar: `python _confere_transcricao.py <dump-do-get_workflow_details>`.

| arquivo | o que é |
|---|---|
| `montar-consultas.js`, `montar-painel.js`, `virar-arquivo.js` | os três nós Code, **com** comentário — a fonte |
| `n8n/*.js` | os mesmos, **sem** comentário de bloco (`_enxuga.js`). Derivado: não editar |
| `_aplica-modelo.js` | injeta o `tema.css` e a logo da Fenauto (SVG inline, compactado) |
| `_roda_no.js`, `_enxuga.js` | iguais aos dos irmãos |
| `coleta_local.py` | roda o SQL do Montar Consultas pela conexão direta (VPN); `--prova` e `--semana` trocam a semana; `--prova` troca também o início da campanha, a janela sem compra e o grupo do IGA (148 → 133), conferindo cada troca no SQL e o nome do grupo no banco (12/11) |
| `monta_local.js` | regera a tela sem n8n e sem banco |
| `prova-local.js` | 341 provas. Em 12/11 (tarde): novos e reativados separados, refeitos do cru em todo recorte, o tipo das plantas, a venda com a vencedora sem loja, cartão, série, selo, botões, CSV e glossário. Em 12/11: o SQL dos novos lojistas (os grupos, o usuário externo, a loja sem teste, a janela de compra antes do início, a entrada, uma passada só no access_logs, o universo com as duas entradas, nada do formulário), a recontagem das novas por outro caminho (último dia e dias de evento de cada operação: total, evento a evento, por operação, cada botão de Data), a entrada antes do 1º dia no total e em nenhum botão de Data, o cliente de uma operação fora do evento da outra, entradas plantadas (23:59 do último dia entra, 00:01 do seguinte não, dia do início da campanha, antes do 1º dia, loja apagada, Data num dia só da outra operação). Em 11/11: a campanha por operação na consulta e na coleta, a loja nova refeita por conjunto de dias por operação, cadastros plantados (C6 só no evento do C6 e IGA só no do IGA nos mesmos dias, 23:59 entra e 00:01 não nas duas, as duas campanhas, loja apagada), o filtro de Operação na `calcula()` (eventos, KPIs, lances, acessos, novas, Data) e na página (linha acima do Evento, evento fora da operação volta a Todos, Limpar). De 03/11: a semana (segunda, 7 dias, hoje dentro), o recorte C6 + IGA e o teto de 31 dias, a medição independente dos 11 eventos da semana de prova (publicados e operação) e o balde 266 fora, a loja nova pela campanha evento a evento (23:59 do último dia entra, 00:01 do seguinte não; loja antiga com perfil novo entra; cadastro em dia sem evento não), o corte por evento com o C6 e o IGA no mesmo horário, a Data com os dias do evento escolhido, os botões de Evento fora de cartão e acima da Data, a gaveta sem Evento, o topo (Fenauto à esquerda, título e subtítulo no centro), a cor da Fenauto no claro, a identidade sem a camada do C6, toda variável de cor definida, vendedor e link por operação, o lance sem loja como aviso |
| `_confere_transcricao.py` | compara o código no n8n com `n8n/*.js` byte a byte, e reprova se aparecer nó de representante ou a cadeia mudar |
| `build_wf.py` | gera o `.wf.ts` (6 nós, sem tabela de dados, sem cron, sem e-mail) |

`dados-*.json` e `saida-*.html` ficam fora do git (`.gitignore`): têm nome real de loja.

## Pendências

- 🛑 **Criar o workflow no n8n** — `.wf.ts` pronto, espera o ok.
- ❓ As três escolhas acima.
- ~~❓ "Fenauto 2026 C6" no formulário~~ — resolvida em 12/11: o cliente vem dos
  grupos (148; 69 e 146), não do formulário.
- 🔵 Os grupos e o início da campanha (10/11/2026) são constantes do
  `montar-consultas.js`: a Fenauto 2027 vai pedir grupo e data novos.
- 🔵 Sem cron, como os irmãos. Se ganhar, a semana já anda sozinha.
