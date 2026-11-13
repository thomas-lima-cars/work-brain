# Mega Evento Fenauto (IGA)

> Irmão do [Mega Evento Fenauto (Cars2You)](../painel-eventos-fenauto-cars2you/README.md),
> nascido em **05/11** a pedido do Thomas: o mesmo painel (mesmas regras,
> mesmo código de cálculo) com a **identidade do IGA** e **só os eventos do
> IGA** — os do C6 saíram. A logo do IGA fica **à esquerda**, o título e o
> subtítulo **no centro** e a logo da Fenauto (com a Cars2You) **à direita**.
> O **botão de tema** (e o de avisos) desceu para uma linha logo abaixo do
> cabeçalho.

**Estado em 2026-11-09:** o recorte virou **os eventos do IGA com "Fenauto" no
nome, abertos no mês corrente** (pedido do Thomas). Em novembro/2026: 24377,
24378 e 24379, "VD IGA exclusivo Fenauto – 11, 12 e 13/11/26", os três abrindo
11/11 09:00, 32 veículos. HTML, 289 provas e o `.wf.ts` regerados, local.
**Workflow ainda não criado no n8n** — espera o ok final do Thomas.

**11/11: cartão Lojistas Fenauto 2026 por região**, entre o funil e os
acessos únicos por dia (pedido do Thomas: primeiro um mapa, depois "gráfico de
barras por região com legenda das UFs" e, na mesma tarde, "considere somente
Fenauto 2026"). Uma barra horizontal por região, do maior para o menor, com o
total e o % sobre todos; dentro, um pedaço por UF (vão de 2px, sigla quando
cabe); embaixo, a legenda das UFs com o número; a dica de cada pedaço traz
quantos acessaram, ofertaram e compraram no recorte.

- **Quem conta:** só as lojas cadastradas pela **campanha do ano**
  (`register_form_value` com "fenauto <ano>", o ano do mês do recorte; em
  nov/2026, "Fenauto 2026 IGA"), em qualquer data, menos as apagadas. Com
  Data, só os cadastros daquele dia; o **Evento não recorta** (a campanha é da
  feira, não de um evento — escolha minha). A loja nova virou o grupo em
  12/11. A consulta de lojas traz a coluna `fenauto_ano` e põe toda loja da
  campanha do ano no universo; `coleta_local.py --prova/--mes` troca o ano junto
  com o mês.
- **A UF:** a de `shop_addresses` — o endereço do cadastro da loja, não o do
  pátio —, com a normalização da Análise de Base (`UF_CASE`). Cada loja tem um
  endereço só (medido). Sem UF válida: "Não identificada", sempre por último.
- **Grade:** a linha virou `.g3i` — três colunas na tela larga, funil e regiões
  lado a lado com os acessos na linha inteira até 1400px, uma coluna até 860px.

305 provas (16 do cartão, a conta refeita sobre UF e cadastro plantados, o
recorte por Data e o Evento que não recorta). Coleta de 11/11: **18 lojistas
em 9 UFs**, conferidos loja a loja contra o banco; números em
[`indicadores.md`](../../../context/banco-de-dados/projetos/mega-evento-fenauto/indicadores.md),
semântica em `plataforma/dominios.md`. Rotina Fenauto regerada (64 provas, só o
ramo IGA muda); **nada foi ao n8n**.

**12/11: novos lojistas pelo grupo** (pedido do Thomas; substitui a regra do
formulário de cadastro, "Fenauto <ano> IGA"). Novos lojistas = **clientes
novos + antigos sem compra que voltaram**, somados no cartão e no funil que já
existiam. Cliente = loja com algum usuário **externo** no grupo **148 "VD Itaú -
Fenauto 2026"** (fora usuário apagado ou com e-mail @cars2you.com.br, @itau,
@c6bank ou "teste"; fora loja apagada ou com "teste" no nome). A **entrada** da
loja é o cadastro dela, se é de **10/11** em diante; senão, se ela não comprou
nada nos **6 meses antes de 10/11** (oferta vencedora de negociação em status 2,
3 ou 7, com a oferta em [10/05, 10/11)), o **primeiro acesso** à plataforma de
10/11 em diante; senão nada (comprador dos 6 meses, que aparece só nos acessos,
ou antigo que não voltou). No painel, a loja é nova em todo evento que
**termina no dia da entrada ou depois** — sem o piso do início do evento: quem
entrou em 10/11 conta nos eventos de 11/11, no total, mas em nenhum botão de
Data; com Data, só quem entrou naquele dia. A consulta de lojas carrega a
entrada no próprio universo (coluna `fenauto`, uma passada agrupada no
`access_logs`, 17,7 s na coleta de 12/11); a união dos perfis da campanha desde
o evento saiu. O cartão de regiões **não muda** (coluna `fenauto_ano`, campanha
do formulário). `coleta_local.py --prova/--mes` troca junto com o ano o início
(10/11/2025), a janela sem compra (10/05/2025) e o grupo (133, "VD Itaú - Fenauto
2025"). Coleta de 12/11: **121 novos lojistas** (84 lojas novas + 37 que
voltaram; 109 no evento de 11/11, 121 nos de 12 e 13/11); na prova de nov/2025,
274. **319 provas** (as da regra do formulário trocadas pelas do grupo: SQL
pedaço a pedaço, entrada refeita da coluna crua no total, evento a evento e com
Data, entrada plantada antes do evento, no fim e depois dele). Nada foi ao n8n.

**12/11 (tarde): novos e reativados separados; vendidos com a vencedora sem
loja** (Thomas: "separe clientes novos de reativados, e ajuste o cartão de
vendidos, consta 3 sendo que existem 4 na tabela").
- **Novos lojistas** = só as lojas cadastradas de 10/11 em diante. **Reativados**
  = as antigas que voltaram, num **sexto cartão**, com engajamento, acessaram,
  ofertaram e compraram. O tipo sai do Montar Painel (`reativada` = tem entrada e
  a loja é de antes de `inicio_campanha`); o SQL não mudou. O funil continua
  sendo dos novos cadastros. Os gráficos por dia e por hora ganham a série
  Reativados (verde #00937F no claro, #3CC7B4 no escuro, conferidos no
  validador de paleta). O ranking ganha o selo reativada e os botões Todos
  lojistas / Novos / Reativados, e o CSV ganha a coluna Tipo.
- **Vendidos**: a venda conta pela própria negociação, com Data pelo dia da
  oferta vencedora, e não mais pela lista de ofertas. A vencedora da 516768
  (evento 24377) foi lançada por um usuário interno, sem loja, e o cartão dava 3
  com 4 na tabela. Ela entra nos vendidos e no valor vendido, mas não nos
  compradores nem nos lances. Em 2026 já são 93 vencedoras sem loja (medido em
  12/11).
- Coleta de 12/11, 12:43: **103 novos + 45 reativados**, 4 vendidos (3
  compradores), R$ 398.200. **323 provas**.

**12/11 (fim da tarde): um veículo só** (Thomas: "cada veículo deve aparecer somente uma vez, mesmo que esteja em 2 eventos"). O carro que não vendeu num evento volta no seguinte com outra negociação. Nos números de veículos (publicados, com ofertas, VMV atingido, vendidos, acessados, pátios, participações) e na lista, ele conta uma vez: com oferta, VMV atingido, acessado ou vendido se foi em algum evento do recorte. Na lista, uma linha com o status da negociação que vendeu (ou da mais recente), as ofertas somadas, a maior e a última de todas, o melhor % VMV/FIPE e farol, as lojas distintas que abriram os anúncios, e "em N eventos". Filtrando um evento, nada muda. Lances seguem todos. Coleta de 12/11: 39 negociações, 32 carros (7 voltaram do 24377 no 24378). **323 provas** (com o carro plantado em duas negociações).

```
Rodar → Montar Consultas → MCP Consultas → Montar Painel → Virar Arquivo → Subir no SharePoint
```

Publicaria em `Mega Evento Fenauto IGA/mega-evento-fenauto-iga.html` no site N8N
(pasta própria, para não sobrescrever o da Cars2You). Workflow
`Mega Evento Fenauto (IGA)`, gatilho manual, projeto previsto Cars2You
(`yAo7DiqDfz6XfXyv`).

## O que mudou em relação ao Mega Evento Fenauto (Cars2You)

A cara e o recorte. A `calcula()` do `montar-painel.js` não mudou; no
`APP()` mudaram só textos (subtítulo, rodapé) e o selo C6/IGA dos botões de
evento, que saiu.

| | Cars2You | IGA |
|---|---|---|
| **Recorte** | eventos do C6 (alvejam o WL 43) **ou** do IGA (vendedores 594, 598, 16036) | **só do IGA, e nunca um que alveje o 43** (`EH_IGA AND NOT EH_C6`, 05/11). Na semana de prova: 7 eventos, os 4 do C6 fora |
| Textos | "C6 e IGA · N eventos…", rodapé e glossário com as duas operações, link pela operação | "IGA · N eventos…", rodapé e glossário só do IGA, link sempre no cars2you.com.br |
| Botões de evento | selo C6/IGA antes do nome | sem selo: seria IGA em todos |
| Tema | `tema.css` sozinho | **`tema.css` + `tema-iga.css`**, nessa ordem (a camada do Estudo de Vendas IGA, 08/10) |
| Topo | Fenauto à esquerda, título e subtítulo no centro (`1fr auto 1fr`), botões à direita | **IGA à esquerda**, título e subtítulo **no centro** (a mesma grade `1fr auto 1fr`), **Fenauto à direita**. Nenhum botão no cabeçalho. Numa primeira versão do dia o título ficava à direita, encostado na Fenauto |
| Botões de tema e de avisos | dentro do cabeçalho | **numa linha logo abaixo dele**, à direita, alinhada com a área. Rola com a página (não é fixa como o cabeçalho) |
| Logo do IGA | — | SVG inline de `design/marca/iga/logo-iga-claro.svg`: a tinta `#000D3C` e a barra `#001FBD` viram classe e a cor de cada tema é CSS (branca e `#7C93FF` no escuro, como a `logo-iga-escuro.svg`); o laranja fica. Coordenadas com duas casas (16 → 12 KB) |
| Cor da Fenauto no claro | `#3A4552` (o texto da Cars2You) | **`#000D3C`**, a tinta do IGA. Branca no escuro, igual |
| Barra Total (2ª série) | cinza `#748290` / `#646E86`, definido no painel | **o laranja da camada do IGA**: `#C94E00` no claro, `#FF6200` no escuro. O painel não repõe mais o cinza |
| Farol amarelo | definido no painel | igual (a camada do IGA não tem) |
| Publicação | `Mega Evento Fenauto/mega-evento-fenauto.html` | `Mega Evento Fenauto IGA/mega-evento-fenauto-iga.html` |

⚠️ **O `.topo-acoes` do tema tem `justify-self:end`.** Fora da grade do cabeçalho,
o Chrome aplica isso a bloco e a linha encolhe ao tamanho dos botões. Com
`margin:0 auto`, ela fica no meio da página. A linha nova leva
`justify-self:stretch` (achado na tela em 05/11).

No escuro, o acento do IGA é o próprio laranja: os chips, os botões ativos
e a barra Total são laranja, e a série Novos é o azul `#7C93FF`.

Números das duas coletas (as do IGA na seção própria): [`projetos/mega-evento-fenauto/indicadores.md`](../../../context/banco-de-dados/projetos/mega-evento-fenauto/indicadores.md).

## As regras (Thomas, 03/11)

| | |
|---|---|
| **Recorte** | os eventos do **IGA** com **"fenauto" no nome** (sem caixa) abertos em algum momento do **mês corrente**, do dia 1 00:00 ao último dia 23:59, hora de Brasília. O mês anda sozinho (09/11; até 08/11 era todo evento do IGA da semana, de segunda a domingo; 05/11: os do C6 saíram). Os do C6 com Fenauto no nome (24384, 24368 em nov/26) caem pela trava do 43 |
| IGA | evento com veículo dos vendedores 594, 598 ou 16036 — o critério do Estudo de Vendas IGA. Os eventos do IGA alvejam os whitelabels 5 e 7, então o canal não acha eles |
| C6, fora | evento que alveja o whitelabel 43 (o critério do Painel de Eventos C6) não entra, nem se tiver veículo do IGA |
| **Loja nova** | desde **12/11**: cliente do grupo 148 da Fenauto do IGA com entrada (cadastro da loja de 10/11 em diante, ou primeiro acesso de 10/11 em diante de quem não comprou nos 6 meses antes), nova em todo evento que termina no dia da entrada ou depois — ver o parágrafo de 12/11 acima. Até 11/11: `user_profiles.register_form_value` com "fenauto", cadastro do perfil num dos dias de um evento do filtro |
| Filtro de evento | **botões numa linha própria logo acima da Data**: Todos e um por evento, na ordem de início, com o estado. Saiu da gaveta |
| Título | "Mega evento Fenauto", no centro do topo, entre a logo do IGA e a da Fenauto. Subtítulo: o evento escolhido (período e estado) ou "IGA · N eventos na semana de … a …" e o período, mais "com filtros" — o do painel do C6 |

## Herança: o que o Mega Evento (Cars2You) mudou em relação ao Eventos Fenauto C6

| | Fenauto C6 | Mega Evento Fenauto |
|---|---|---|
| Tema | `tema.css` + `tema-c6.css` (amarelo no escuro) | `tema.css` sozinho — a identidade da Cars2You (aqui, + `tema-iga.css`) |
| Topo | C6 à esquerda, Fenauto no centro, sem título | **Fenauto à esquerda**, título e subtítulo **no centro** (a grade do tema, `1fr auto 1fr`); no telefone, uma linha cada, com reticências |
| Cor da Fenauto no claro | `#242424` (a tinta do C6) | **`#3A4552`**, o `--texto` do tema claro e o preto da marca Cars2You (o README da marca pedia essa conferência). Branca no escuro, igual |
| Recorte | WL 43, fim desde 01/10, só o 24052 | C6 + IGA da semana, teto de 31 dias de duração |
| Acesso ao evento | `al.whitelabel_id = 43` | **sem trava de canal**: o `event_id` já diz de que evento é |
| Pacote de acessos | loja × dia × hora | **evento** × loja × dia × hora — sem o evento, escolher o C6 contaria os acessos do IGA que corria na mesma hora |
| Loja nova | grupo 146, cadastro da loja num dia do evento | campanha da Fenauto, cadastro do perfil num dia do evento |
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

- ~~**Data do perfil, não da loja.**~~ Saiu em 12/11 com a regra do grupo: a
  loja antiga entra pela data da volta (primeiro acesso), não pela do perfil.
- **Acesso sem trava de canal.**

## Ciclo

```bash
python coleta_local.py               # o mês de hoje (VPN) -> dados-local.json
python coleta_local.py --prova       # novembro/2025, o da Fenauto 2025 (só o 22223) -> dados-prova.json
node _aplica-modelo.js               # tema.css + Fenauto inline para dentro do Montar Painel
for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
node prova-local.js                  # 323 provas
node monta_local.js                  # saida-local.html (a semana de hoje)
node monta_local.js dados-prova.json saida-prova.html
python build_wf.py                   # mega-evento-fenauto-iga.wf.ts
```

`--mes 2026-12` coleta outro mês.

Para ver: `previa-radar` em `.claude/launch.json`, em
`http://localhost:8777/automations/n8n-sdk/painel-eventos-fenauto-iga/saida-local.html`
(e `saida-prova.html`).

**Nada vai ao n8n sem a aprovação final do Thomas.** Depois de criar, antes de
rodar: `python _confere_transcricao.py <dump-do-get_workflow_details>`.

| arquivo | o que é |
|---|---|
| `montar-consultas.js`, `montar-painel.js`, `virar-arquivo.js` | os três nós Code, **com** comentário — a fonte |
| `n8n/*.js` | os mesmos, **sem** comentário de bloco (`_enxuga.js`). Derivado: não editar |
| `_aplica-modelo.js` | injeta o `tema.css` + `tema-iga.css` e as logos do IGA e da Fenauto (SVG inline, compactados) |
| `_roda_no.js`, `_enxuga.js` | iguais aos dos irmãos |
| `coleta_local.py` | roda o SQL do Montar Consultas pela conexão direta (VPN); `--prova` e `--semana` trocam a semana |
| `monta_local.js` | regera a tela sem n8n e sem banco |
| `prova-local.js` | 323 provas. Novos e reativados separados e a venda com a vencedora sem loja (12/11, tarde). Loja nova (12/11): o SQL do grupo, do usuário externo, da janela sem compra e da volta numa passada só; a entrada refeita da coluna crua no total, evento a evento e com Data; entrada antes do evento conta no total e em nenhum botão de Data. Recorte (05/11): só IGA no SQL, os 7 eventos do IGA da medição independente e os 4 do C6 fora, todo vendedor do IGA, todo link no cars2you.com.br, o par no mesmo horário agora 22223 × 22235. As do topo e da identidade foram trocadas em 05/11 (camada do IGA depois do tema, cores dos dois temas, logo do IGA e da Fenauto, ordem IGA → título → Fenauto, título à direita, nenhum botão no cabeçalho, botões de tema e de avisos na linha logo abaixo, à direita, sem posição fixa). Herdadas do irmão: Novas: a semana (segunda, 7 dias, hoje dentro), o recorte C6 + IGA e o teto de 31 dias, a medição independente dos 11 eventos da semana de prova (publicados e operação) e o balde 266 fora, a loja nova pela campanha evento a evento (23:59 do último dia entra, 00:01 do seguinte não; loja antiga com perfil novo entra; cadastro em dia sem evento não), o corte por evento com o C6 e o IGA no mesmo horário, a Data com os dias do evento escolhido, os botões de Evento fora de cartão e acima da Data, a gaveta sem Evento, o topo (Fenauto à esquerda, título e subtítulo no centro), a cor da Fenauto no claro, a identidade sem a camada do C6, toda variável de cor definida, vendedor e link por operação, o lance sem loja como aviso |
| `_confere_transcricao.py` | compara o código no n8n com `n8n/*.js` byte a byte, e reprova se aparecer nó de representante ou a cadeia mudar |
| `build_wf.py` | gera o `.wf.ts` (6 nós, sem tabela de dados, sem cron, sem e-mail) |

`dados-*.json` e `saida-*.html` ficam fora do git (`.gitignore`): têm nome real de loja.

## Pendências

- ❓ **A prova de dois eventos no mesmo horário saiu (09/11).** Com o recorte da
  Fenauto, novembro/2025 tem um evento só (o 22223) e ela ficou sem dado real.
  Os 3 de novembro/2026 abrem juntos em 11/11: depois que tiverem acesso,
  trazer a prova de volta sobre eles (coleta `--mes 2026-11`).
- ❓ A trava é o **nome** do evento: um evento da Fenauto cadastrado sem
  "Fenauto" no nome some calado.

- 🛑 **Criar o workflow no n8n** — `.wf.ts` pronto, espera o ok.
- ❓ **Este substitui o da Cars2You ou os dois convivem?** Hoje cada um publica num caminho.
- ❓ A barra Total em laranja (a 2ª série do IGA) — escolha minha na leitura do pedido.
- ❓ As duas escolhas acima (a terceira do irmão, "loja nova vale para o C6 também", saiu com o C6).
- ❓ A semana de 02 a 08/11/2026 tem, em 05/11, **dois eventos do IGA** (05 e 06/11)
  e **nenhum cadastro da campanha em 2026** (o único valor é "Fenauto 2025 IGA").
  Se a Fenauto 2026 vier com outro nome no formulário (sem "fenauto"), o
  cartão de regiões zera calado (a loja nova saiu do formulário em 12/11).
- ❓ **A loja nova depende do grupo 148 e do início fixo em 10/11/2026**
  (`INICIO_CAMPANHA`, `GRUPOS_IGA`): não andam sozinhos com o mês. Na
  Fenauto 2027, trocar os dois (e o `GRUPOS_DO_ANO` do `coleta_local.py`).
- 🔵 Sem cron, como os irmãos. Se ganhar, a semana já anda sozinha.
