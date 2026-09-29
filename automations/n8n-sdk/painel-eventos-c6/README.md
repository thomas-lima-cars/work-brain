# Painel de Eventos C6

> Eventos do Canal de vendas C6 Auto: o que foi publicado, o que recebeu
> oferta, o que vendeu, quem acessou, ofertou e arrematou, e como as lojas
> novas estão ativando. Rankings de representantes e de lojas, funil de
> ativação, acessos por dia e por hora, pátios e score de veículo, com
> filtros numa gaveta lateral.

Workflow n8n **`53RGtYzUzMoVtxpJ`** — "Painel de Eventos C6", no projeto
**pessoal do Thomas** (a pedido, "pessoal por enquanto"). Criado em
2026-09-29 com a versão 3; o `VelPJDX8USP9WIeT` (24/09) e o
`8051egvfncc3unuT` (28/09) foram **arquivados**. Gatilho manual. Publica em
`Painel de Eventos C6/painel-eventos-c6.html` no site N8N do SharePoint.

```
Rodar → Baixar Representantes → Ler Representantes → Montar Consultas → MCP Consultas
      → Montar Painel → Virar Arquivo → Subir no SharePoint
```

🔴 **Ainda não publicou.** O run 54794 (29/09) caiu no Baixar Representantes
com 404: a planilha não está no SharePoint. Ver Pendências.

## As regras (decididas pelo Thomas)

| | |
|---|---|
| **Recorte** (24/09) | Eventos que alvejam o **whitelabel 43** (Canal de vendas C6 Auto) com fim de **30 dias atrás em diante** — abertos, agendados e encerrados recentes |
| **Período** (28/09) | Do **menor início ao maior fim** dos eventos filtrados. Acesso e cadastro fora dele **não contam** |
| **Vendido / arremate** (24/09) | Negociação em status **2, 3 ou 7**. Arrematante = loja da oferta vencedora (`offer_actual_id`) |
| **Pontuação da loja** (28/09) | **Só loja nova pontua**: 10 por arremate + 1 por dia com acesso no período. As outras aparecem com "—". Substituiu o "1 por veículo ofertado + 10 por arremate" de 24/09 |
| **Score do veículo** (28/09) | Lojas distintas que abriram o anúncio no horário do evento × 1 + lances × 5 + 10 se alguma oferta alcançou o VMV |
| **Loja nova** | Loja do WL 43 com `shops.created_at` dentro do período |
| **Aprovada** (28/09) | `shops.situation = 3` |
| **Engajamento** (28/09) | Lojas novas que acessaram o canal no período ÷ cadastradas |
| **Participações/lojista** (28/09) | Pares (loja, veículo) com lance ÷ ofertantes |
| **% conversão / % VMV do pátio** | Sobre os veículos do pátio (escolha minha, a confirmar) |
| **% VMV do veículo** | Maior oferta ÷ VMV (escolha minha, a confirmar) |
| **Representante** | `USUARIO_GN` ou `USUARIO_GP` da planilha de lojas ativas do C6, cruzada pelo CNPJ. Fora da planilha ou vazio na coluna → **"Sem Representante"**. Padrão da tela: **Usuário GN** (29/09) |
| **Rankings** (29/09) | Representantes: só quem tem loja nova. Lojas: só quem acessou no período. Padrão: **Todos lojistas** |

## Os filtros (29/09)

Numa gaveta com aba na lateral esquerda (regra 5c do design), nesta ordem:
Evento, Lojistas (Todos / Somente novos), Coluna do representante (GN / GP),
Representante, Data, Pátio, Status do veículo, Limpar.

| filtro | recorta | não mexe em |
|---|---|---|
| Pátio, Status do veículo | os **veículos** — e tudo que nasce deles: lances, ofertantes, compradores, rankings, pátios, degraus do funil que dependem de anúncio | acesso ao canal (dias, gráficos, "logaram") |
| Representante | as **lojas**, pela coluna ativa | a lista de veículos (como o Responsável do Radar) |
| Data | o **período**, para aquele dia: acessos, cadastros, lances e vendas pela data da oferta vencedora | a lista de veículos |
| clique num dia do gráfico | só o gráfico de acessos por hora | o resto |

Nenhum filtro recalcula score, ofertas ou farol de um veículo: são do
veículo inteiro, calculados no nó.

## Consultar o mínimo: sete chamadas, uma linha cada

Cada consulta devolve **uma linha só**, com a tabela inteira empacotada:

```sql
SELECT COUNT(*) AS total, JSON_ARRAYAGG(JSON_ARRAY(<colunas>)) AS linhas FROM ...
```

O teto de 50 linhas do MCP deixa de existir e não há paginação. O `total`
sai da mesma varredura: se o pacote chegar menor, o Montar Painel **derruba o
run** em vez de publicar meia tabela (há prova sabotando uma linha).

| consulta | o que traz |
|---|---|
| `eventos` | id, nome, status, início, fim, canais |
| `veiculos` | uma linha por negociação: status, vencedora, VMV, FIPE, marca/modelo/versão, anos, km, **pátio**. Placa, chassi e laudo **saíram da consulta** em 28/09 |
| `ofertas` | todo lance das negociações do recorte |
| `lojas` | quem ofertou ∪ lojas do WL 43 cadastradas na janela, com situação e CNPJ (chave do cruzamento — não chega ao HTML) |
| `acessos_anuncio` | (evento, anúncio, loja), cortado no horário do **próprio evento**, com a **máscara dos dias** do evento em que abriu (`BIT_OR(1 << DATEDIFF)`) — é o que deixa o filtro de Data cortar o acesso a anúncio |
| `acessos_p0`, `acessos_p1` | loja × dia × hora com a contagem, dentro do período do recorte, **em partes** pelo resto do id da loja |

Linhas, tamanho de cada pacote e tempo estão em
[`indicadores.md`](../../../context/banco-de-dados/projetos/c6/indicadores.md).

### Por que o acesso chega assim

O bruto da janela são ~35 mil linhas de `access_logs` — não passa pelo MCP.
O filtro de Representante precisa saber **de quem** é cada acesso por hora,
então o grão é loja × dia × hora; inteiro ele passa de 200 KB, e em duas
partes cada uma fica abaixo dos 130 KB que o MCP já provou passar. Se uma
parte engordar, é subir `PARTES_ACESSO` no Montar Consultas — o Montar Painel
junta quantas vierem, e parte que faltar derruba o run.

O corte do período é **por hora cheia**: num evento que começa às 17:13, o
acesso das 17:05 entra (está no glossário). O acesso a anúncio é cortado no
minuto, no SQL, porque o join é por igualdade no `event_id`; cruzar cada
acesso com cada evento por faixa de data passou de 5 minutos e foi abandonado.

### O cálculo mora numa função só

`calcula(D, sel, F)` monta KPIs, rankings, gráficos, funil e tabelas para o
evento escolhido e os filtros. Ela roda **no nó** — para o `resumo` que as
provas conferem — e **na página**, pelo `toString()`. Não há uma conta no
servidor e outra no navegador para divergirem. As ofertas viajam cruas para a
página porque os filtros recortam ofertas, e recorte de agregado não fecha.

## A tela

Topo com a logo do C6, título, avisos e troca de tema. Quatro KPIs, cada
percentual com barra: **Veículos publicados** (% de anúncios acessados;
vendidos e com VMV atingido), **Com ofertas** (% dos publicados; ofertantes e
lances/lojista), **Vendidos** (quantidade e valor na mesma linha, % dos
publicados; compradores e participações/lojista), **Novos lojistas** (% de
engajamento; ofertaram e compraram).

Depois: ranking de representantes e de lojas (tabelas ordenáveis, pontuação
decrescente); funil de ativação (regra 3b do design) ao lado dos **acessos
únicos por dia**, que preenche a altura do cartão; acessos por hora na linha
inteira, do primeiro ao último horário com acesso; pátios na linha inteira;
veículos (score crescente, % VMV com barra, e no Resultado o arrematante com
o selo "novo" e o representante); glossário e rodapé. A tabela de eventos e
as tabelas de lojas saíram em 28/09.

### Design

O tema é o do brain (`design/tokens/tema.css`) com a **camada do C6** por cima
(`design/tokens/tema-c6.css`): no claro, cinzas com base no `#242424`; no
escuro, detalhes em **amarelo #FFC000**, só em cor chapada (sem degradê). O
funil é cinza no escuro. O farol "oferta abaixo do VMV" é amarelo
(`--farol-abaixo`). Modelo avulso: `design/modelos/dashboard-escuro-c6.html`.

## O representante comercial

| | |
|---|---|
| Onde mora | `Painel de Eventos C6/_dados/LojasAtivas_C6.xlsx`, site N8N. Quem atualiza **substitui o arquivo no mesmo caminho** |
| Como é lida | `Baixar Representantes` (HTTP, arquivo) → `Ler Representantes` (Extract from File, **primeira aba**, tudo como texto). Em série, antes das consultas: em ramo paralelo o nó roda tarde demais (Radar, run 52930) |
| Chave | CNPJ, só dígitos, completado a 14. `shops.cnpj` entra na consulta de lojas e **não chega ao HTML** |
| Colunas | `USUARIO_GN` e `USUARIO_GP` — as duas obrigatórias. O GN vem vazio em 63% das linhas (dado, não defeito) |
| CNPJ com mais de um representante | fica o que aparece em **mais linhas**; empate → "Sem Representante". Os dois viram aviso |
| Planilha ausente, truncada ou sem as colunas | **o run cai** — publicar todo mundo "Sem Representante" seria uma tela plausível e errada |

A aba não é fixada pelo nome porque o nome é o de um job do BigQuery
(`bquxjob_…`) e muda a cada exportação. `resumo.representantes`, na saída do
Montar Painel, conta por qual caminho cada loja passou, por coluna.

## Ciclo de trabalho

```bash
python coleta_local.py                     # coleta real pela conexão direta (VPN) → dados-local.json
node _aplica-modelo.js                     # tema + logos para dentro do Montar Painel
for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
python _planilha_local.py                  # planilha no formato do n8n → dados-planilha-local.json
node prova-local.js                        # 205 provas
node monta_local.js                        # regera saida-local.html sem n8n
python build_wf.py                         # painel-eventos-c6.wf.ts
```

Para olhar a página: o `saida-local.html` passou de 600 KB e o navegador
interno não abre mais o arquivo direto — use o servidor de prévia
(`previa-radar` em `.claude/launch.json`) em
`http://localhost:8777/automations/n8n-sdk/painel-eventos-c6/saida-local.html`.

**Nada vai ao n8n sem a aprovação final do Thomas.** Depois de sincronizar,
antes de rodar:

```bash
python _confere_transcricao.py <dump-do-get_workflow_details>
```

| arquivo | o que é |
|---|---|
| `montar-consultas.js`, `montar-painel.js`, `virar-arquivo.js` | os três nós Code, **com** comentário — a fonte |
| `n8n/*.js` | os mesmos, **sem** comentário de bloco (`_enxuga.js`). É o que vai pro n8n. Derivado: não editar |
| `_aplica-modelo.js` | injeta `tema.css` + `tema-c6.css` e as duas logos nos blocos `TEMA`/`LOGOS` |
| `_roda_no.js` | roda um nó Code fora do n8n, com `$()` de mentira |
| `coleta_local.py` | roda o SQL exato do nó pela conexão direta e grava no formato do MCP |
| `_planilha_local.py` | converte a planilha no que o nó Ler Representantes entrega |
| `prova-local.js` | 205 provas: consultas, pacotes, período e dias refeitos do cru, pontuação e score de toda loja e todo veículo refeitos do cru, funil, pátios, cada filtro refeito do cru, representante caso a caso, CNPJ que não vaza, planilha ausente/truncada derrubando o run, layout (ordem dos cartões e da gaveta), nó enxuto = nó original |
| `_confere_transcricao.py` | compara o código no n8n com `n8n/*.js`, byte a byte |
| `build_wf.py` | gera o `.wf.ts` (em LF) |

`dados-*.json` e `saida-*.html` ficam fora do git (`.gitignore`): têm nome real
de loja.

### Fim de linha

O repo tem `core.autocrlf=true`: o checkout grava CRLF. O injetor, o
`_enxuga.js` e as provas normalizam para LF ao ler — sem isso a prova "bloco
TEMA igual ao do injetor" cai só por fim de linha (aconteceu em 28/09).

### Por que o código vai cru e sem comentário

O nó do painel tem 87 KB enxuto e é transmitido à API **por extenso**. Pela
`update_workflow` ele iria dentro de JSON, com cada aspa dupla escapada à mão
— centenas de atributos HTML. Pela criação a partir de código ele vai cru,
dentro de um literal de template, e o gerador barra as três coisas que
quebrariam o literal (barra invertida, crase, `${`). Por isso cada versão
nova é um workflow novo, e o anterior é arquivado.

Sincronizações: 24/09, 28/09 e 29/09 — as três **idênticas byte a byte**.

## Pendências

- 🔴 **Subir a planilha no SharePoint.** O workflow lê
  `Painel de Eventos C6/_dados/LojasAtivas_C6.xlsx` no site N8N. Sem ela o run
  cai no primeiro nó — de propósito (run 54794, 29/09, 404).
- 🔵 **Primeira publicação** — logo depois da planilha: rodar o
  `53RGtYzUzMoVtxpJ` (upload ligado) e mandar o link ao C6.
- ❓ Confirmar: % do pátio sobre os veículos do pátio; % VMV pela maior
  oferta; desempate de representante por maioria.
- 🔵 **Sem cron.** Manual. Se for rodar sozinho, o C6 fecha 16h ou 20h com
  prorrogação de até ~1h20 depois do fim oficial.
- 🔵 O `catalogo-relatorios/relatorios.json` (de outra sessão, ainda fora do
  git) cita o workflow antigo `VelPJDX8USP9WIeT`.
- 🔵 Mudar a pasta ou o nome do arquivo depois **abre pasta nova** e deixa a
  antiga órfã (upload por path).
