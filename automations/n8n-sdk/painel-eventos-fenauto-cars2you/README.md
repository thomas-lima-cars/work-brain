# Mega Evento Fenauto (Cars2You)

> Irmão do [Eventos Fenauto C6](../painel-eventos-fenauto-c6/README.md), nascido
> em **03/11** a pedido do Thomas: a **identidade da Cars2You**, a logo da
> Fenauto (com a Cars2You embaixo) **à esquerda** e o **título e o subtítulo
> no centro**, os eventos do **C6 e do IGA** da semana e um **filtro de
> evento em botões à vista**. Sem representante, como o irmão.

**Estado em 2026-11-09:** só os eventos com **Fenauto no nome** (Thomas, 09/11);
HTML, 273 provas e o `.wf.ts` regerados, local.
**Workflow ainda não criado no n8n** — espera o ok final do Thomas.

```
Rodar → Montar Consultas → MCP Consultas → Montar Painel → Virar Arquivo → Subir no SharePoint
```

Publicaria em `Mega Evento Fenauto/mega-evento-fenauto.html` no site N8N.
Gatilho manual. Projeto previsto: Cars2You (`yAo7DiqDfz6XfXyv`), o mesmo dos
irmãos — sem tabela de dados, nada obriga.

Números das duas coletas: [`projetos/mega-evento-fenauto/indicadores.md`](../../../context/banco-de-dados/projetos/mega-evento-fenauto/indicadores.md).

## As regras (Thomas, 03/11)

| | |
|---|---|
| **Recorte** | os eventos do **C6** e do **IGA** com **"fenauto" no nome** (09/11), abertos em algum momento da **semana corrente**, de segunda 00:00 a domingo 23:59, hora de Brasília. A semana anda sozinha: o nó calcula a segunda de hoje. Em 09/11: C6 24368 e 24384, IGA 24377 a 24379 — os mesmos dos painéis Fenauto C6 e Fenauto IGA; ficam fora as vendas diretas do IGA (24364 e 24382). Até 08/11 entrava todo evento do C6 e do IGA da semana |
| C6 | evento que alveja o whitelabel 43 — o critério do Painel de Eventos C6 |
| IGA | evento com veículo dos vendedores 594, 598 ou 16036 — o critério do Estudo de Vendas IGA. Os eventos do IGA alvejam os whitelabels 5 e 7, então o canal não acha eles |
| **Loja nova** | loja com um usuário cadastrado pela campanha da Fenauto: `user_profiles.register_form_value` contendo "fenauto", **com esse cadastro num dos dias de um evento do filtro**, o dia inteiro. Vale a data do **perfil**, não a da loja |
| Filtro de evento | **botões numa linha própria logo acima da Data**: Todos e um por evento, na ordem de início, com a operação (C6/IGA) e o estado. Saiu da gaveta |
| Título | "Mega evento Fenauto", no centro do topo (na primeira versão do dia, à direita). Subtítulo: o evento escolhido (período e estado) ou "C6 e IGA · N eventos na semana de … a …" e o período, mais "com filtros" — o do painel do C6 |

## O que mudou em relação ao Eventos Fenauto C6

| | Fenauto C6 | Mega Evento Fenauto |
|---|---|---|
| Tema | `tema.css` + `tema-c6.css` (amarelo no escuro) | **`tema.css` sozinho** — a identidade da Cars2You |
| Topo | C6 à esquerda, Fenauto no centro, sem título | **Fenauto à esquerda**, título e subtítulo **no centro** (a grade do tema, `1fr auto 1fr`); no telefone, uma linha cada, com reticências |
| Cor da Fenauto no claro | `#242424` (a tinta do C6) | **`#3A4552`**, o `--texto` do tema claro e o preto da marca Cars2You (o README da marca pedia essa conferência). Branca no escuro, igual |
| Recorte | WL 43 com Fenauto no nome, da semana | C6 + IGA com Fenauto no nome, da semana, teto de 31 dias de duração |
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

- **Loja nova vale para os dois.** A regra da campanha conta no evento do C6 também: na
  semana de prova, o 22231 (C6) e o 22223 (IGA) correm de 19 a 21/11/2025, e
  os dois têm 221 lojas novas, todas da campanha "Fenauto 2025 IGA".
- **Data do perfil, não da loja.** 11 das 226 lojas da campanha existiam desde 2020–2023; com
  a data da loja, nenhuma delas seria nova.
- **Acesso sem trava de canal.**

## Ciclo

```bash
python coleta_local.py               # a semana de hoje (VPN) -> dados-local.json
python coleta_local.py --prova       # a semana da Fenauto 2025 (17/11/2025): o 22231 (C6) e o 22223 (IGA) -> dados-prova.json
node _aplica-modelo.js               # tema.css + Fenauto inline para dentro do Montar Painel
for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
node prova-local.js                  # 273 provas
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
| `coleta_local.py` | roda o SQL do Montar Consultas pela conexão direta (VPN); `--prova` e `--semana` trocam a semana |
| `monta_local.js` | regera a tela sem n8n e sem banco |
| `prova-local.js` | 273 provas. Novas: a semana (segunda, 7 dias, hoje dentro), o recorte C6 + IGA e o teto de 31 dias, a medição independente dos 11 eventos da semana de prova (publicados e operação) e o balde 266 fora, a loja nova pela campanha evento a evento (23:59 do último dia entra, 00:01 do seguinte não; loja antiga com perfil novo entra; cadastro em dia sem evento não), o corte por evento com o C6 e o IGA no mesmo horário, a Data com os dias do evento escolhido, os botões de Evento fora de cartão e acima da Data, a gaveta sem Evento, o topo (Fenauto à esquerda, título e subtítulo no centro), a cor da Fenauto no claro, a identidade sem a camada do C6, toda variável de cor definida, vendedor e link por operação, o lance sem loja como aviso |
| `_confere_transcricao.py` | compara o código no n8n com `n8n/*.js` byte a byte, e reprova se aparecer nó de representante ou a cadeia mudar |
| `build_wf.py` | gera o `.wf.ts` (6 nós, sem tabela de dados, sem cron, sem e-mail) |

`dados-*.json` e `saida-*.html` ficam fora do git (`.gitignore`): têm nome real de loja.

## Pendências

- 🛑 **Criar o workflow no n8n** — `.wf.ts` pronto, espera o ok.
- ❓ As três escolhas acima.
- ❓ A semana de 02 a 08/11/2026 tem, em 03/11, **só dois eventos do C6 e nenhum do IGA**,
  e **nenhum cadastro da campanha em 2026** (o único valor é "Fenauto 2025 IGA").
  Se a Fenauto 2026 vier com outro nome no formulário (sem "fenauto"), a loja
  nova zera calada.
- 🔵 Sem cron, como os irmãos. Se ganhar, a semana já anda sozinha.
