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
| **Loja nova** | loja com um usuário cadastrado pela campanha da Fenauto: `user_profiles.register_form_value` contendo "fenauto", **com esse cadastro num dos dias de um evento do filtro**, o dia inteiro. Vale a data do **perfil**, não a da loja |
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

- **Data do perfil, não da loja.** 11 das 226 lojas da campanha existiam desde 2020–2023; com
  a data da loja, nenhuma delas seria nova.
- **Acesso sem trava de canal.**

## Ciclo

```bash
python coleta_local.py               # o mês de hoje (VPN) -> dados-local.json
python coleta_local.py --prova       # novembro/2025, o da Fenauto 2025 (só o 22223) -> dados-prova.json
node _aplica-modelo.js               # tema.css + Fenauto inline para dentro do Montar Painel
for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
node prova-local.js                  # 287 provas
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
| `prova-local.js` | 287 provas. Recorte (05/11): só IGA no SQL, os 7 eventos do IGA da medição independente e os 4 do C6 fora, todo vendedor do IGA, todo link no cars2you.com.br, o par no mesmo horário agora 22223 × 22235. As do topo e da identidade foram trocadas em 05/11 (camada do IGA depois do tema, cores dos dois temas, logo do IGA e da Fenauto, ordem IGA → título → Fenauto, título à direita, nenhum botão no cabeçalho, botões de tema e de avisos na linha logo abaixo, à direita, sem posição fixa). Herdadas do irmão: Novas: a semana (segunda, 7 dias, hoje dentro), o recorte C6 + IGA e o teto de 31 dias, a medição independente dos 11 eventos da semana de prova (publicados e operação) e o balde 266 fora, a loja nova pela campanha evento a evento (23:59 do último dia entra, 00:01 do seguinte não; loja antiga com perfil novo entra; cadastro em dia sem evento não), o corte por evento com o C6 e o IGA no mesmo horário, a Data com os dias do evento escolhido, os botões de Evento fora de cartão e acima da Data, a gaveta sem Evento, o topo (Fenauto à esquerda, título e subtítulo no centro), a cor da Fenauto no claro, a identidade sem a camada do C6, toda variável de cor definida, vendedor e link por operação, o lance sem loja como aviso |
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
  Se a Fenauto 2026 vier com outro nome no formulário (sem "fenauto"), a loja
  nova zera calada.
- 🔵 Sem cron, como os irmãos. Se ganhar, a semana já anda sozinha.
