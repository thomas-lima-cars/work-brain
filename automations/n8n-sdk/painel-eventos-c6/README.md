# Painel de Eventos C6

> Eventos do Canal de vendas C6 Auto: o que foi publicado, o que recebeu
> oferta, o que vendeu, quem acessou, ofertou e arrematou, e como as lojas
> novas estão ativando. Rankings de representantes e de lojas, funil de
> ativação, acessos por dia e por hora, pátios e score de veículo, com
> filtros numa gaveta lateral.

Workflow n8n **`0Ndif0UK2UjTfaIN`** — "Painel de Eventos C6", no projeto
**Cars2You** (30/09, versão 5: é onde moram as duas tabelas de dados que ele
lê). Ficaram para arquivar, pela interface (o modo automático barra o
arquivamento): `6o9MSr1CriZ1VUBa` (versão 4, 30/09, nunca rodou) e
`53RGtYzUzMoVtxpJ` (29/09, pessoal). O `VelPJDX8USP9WIeT` (24/09) e o
`8051egvfncc3unuT` (28/09) já estão **arquivados**. Gatilho manual. Publica em
`Painel de Eventos C6/painel-eventos-c6.html` no site N8N do SharePoint.

```
Rodar → Ler Representantes → Ler Nomes → Montar Consultas → MCP Consultas
      → Montar Painel → Virar Arquivo → Subir no SharePoint
```

✅ **Primeira publicação: run 55191 (30/09, 15 s).** 732.180 bytes em
`Painel de Eventos C6/painel-eventos-c6.html`. Antes dele, o 55187 caiu por
falta de memória: o Ler Nomes rodava uma vez por linha da carteira (280 ×
30.719 itens) — agora tem `executeOnce`.

## As regras (decididas pelo Thomas)

| | |
|---|---|
| **Recorte** (24/09; outubro em 02/10) | Eventos que alvejam o **whitelabel 43** (Canal de vendas C6 Auto) e **encerram a partir de 01/10/2026** — a seleção de outubro, sem teto. Até 02/10 era fim de 30 dias atrás em diante. Em 02/10: 24055 (Treinamento, até 01/10) e 24052 (Outubro, 31/10) |
| **Período** (28/09) | Do **menor início ao maior fim** dos eventos filtrados. Acesso e cadastro fora dele **não contam** |
| **Vendido / arremate** (24/09) | Negociação em status **2, 3 ou 7**. Arrematante = loja da oferta vencedora (`offer_actual_id`) |
| **Pontuação da loja** (28/09) | **Só loja nova pontua**: 10 por arremate + 1 por dia com acesso no período. As outras aparecem com "—". Substituiu o "1 por veículo ofertado + 10 por arremate" de 24/09 |
| **Score do veículo** (28/09; 30/09) | Lojas distintas que abriram o anúncio no horário do evento × 1 + lances × 5 + **100** se alguma oferta alcançou o VMV, levado a **0–100 sobre o maior score da coleta** (fixo: filtro nenhum muda a nota), com uma casa decimal — no inteiro, 25 veículos com 1 ou 2 acessos empatariam em 0 com os 44 parados (maior bruto 353, 30/09) |
| **Performance financeira** (30/09) | Valor vendido ÷ soma do VMV de **todos** os publicados do recorte, vendidos ou não. No pé: soma dos arremates ÷ soma da FIPE, só dos vendidos com FIPE; e ÷ soma do VMV, só dos vendidos com VMV |
| **% FIPE do veículo** (06/10; antes arremate ÷ FIPE, 30/09) | **Maior oferta** ÷ FIPE, de todo veículo com oferta e FIPE; os demais "—". A performance financeira (Recuperação / FIPE) continua sobre o arremate |
| **Loja nova** (02/10) | Cadastrada **a partir de 01/10/2026** E no **grupo de cliente 146** ("Parceiros C6 - Exclusivo SP"), e dentro da janela do filtro. O grupo mora no usuário (`user_shops` → `user_clients_group`): a loja está no grupo quando algum usuário dela está. Antes: loja do WL 43 cadastrada no período. Em 02/10 dá **0** — o grupo foi montado em 30/09 e as 15 lojas do WL 43 cadastradas desde 01/10 não estão nele |
| **Aprovada** (28/09) | `shops.situation = 3` |
| **Engajamento** (28/09) | Lojas novas que acessaram o canal no período ÷ cadastradas |
| **Participações/lojista** (28/09) | Pares (loja, veículo) com lance ÷ ofertantes |
| **% conversão / % VMV do pátio** | Sobre os veículos do pátio (escolha minha, a confirmar) |
| **% VMV do veículo** | Maior oferta ÷ VMV (escolha minha, a confirmar) |
| **Representante** | `GP_Usuario` e `GN_Usuario` da carteira de lojas do C6 (tabela de dados do n8n, 30/09), cruzada pelo CNPJ, mostrados pelo nome. Fora da carteira ou vazio na coluna → **"Sem Representante"**. O botão Usuário GN / Usuário GP saiu em 30/09: cada coluna tem o seu ranking e o seu filtro |
| **Rankings** (29/09; 30/09) | Um ranking de **usuários GP** e um de **usuários GN**, lado a lado, só com quem tem loja nova. Lojas: só quem acessou no período, na linha inteira, com GP, GN, **primeiro e último acesso** (no período, na hora cheia). Padrão: **Todos lojistas** |
| **Acessos únicos por dia** (02/10) | O mesmo indicador da coluna **Acessos** do ranking de lojas, dia a dia: lojas **do ranking** (ofertaram ou são novas) que acessaram o canal no dia. A soma das colunas do gráfico é a soma da coluna Acessos. Antes contava toda loja que acessou o canal (213 em outubro, contra 6 no ranking) |
| **Acessos por hora** (02/10) | A mesma medida dos acessos únicos por dia, contada por hora: lojas do ranking que acessaram o canal naquela hora, cada loja uma vez por hora em cada dia. O título deixou de ser "Acessos por hora do dia" |

## Os filtros (29/09; 30/09)

Numa gaveta com aba na lateral esquerda (regra 5c do design), nesta ordem:
Evento, Lojistas (Todos / Somente novos), **Usuário GP**, **Usuário GN**, Data,
Pátio, Status do veículo, Limpar. Os dois de usuário substituíram o botão GN/GP
e o Representante em 30/09.

| filtro | recorta | não mexe em |
|---|---|---|
| Pátio, Status do veículo | os **veículos** — e tudo que nasce deles: lances, ofertantes, compradores, rankings, pátios, degraus do funil que dependem de anúncio | acesso ao canal (dias, gráficos, "logaram") |
| Usuário GP, Usuário GN | as **lojas**, cada um pela sua coluna; os dois juntos se somam (interseção) | a lista de veículos (como o Responsável do Radar) |
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
| `acessos_p0`, `acessos_p1` | loja × dia × hora com a contagem dos acessos **ao evento** (`access_logs.event_id` = o evento, no horário dele, no minuto), **em partes** pelo resto do id da loja. Até 07/10 era o acesso ao **canal** no período (medido em 08/10 no 24052: 251 lojas no canal, 91 no evento) |

Linhas, tamanho de cada pacote e tempo estão em
[`indicadores.md`](../../../context/banco-de-dados/projetos/c6/indicadores.md).

### Por que o acesso chega assim

**Acesso = acesso ao evento (08/10, Thomas).** Os gráficos por dia e por hora, o
"Acessaram" do funil, o engajamento e o ponto "1 por dia com acesso" contam só
acesso com o `event_id` do evento. Antes contavam entrar no canal, e 64% das
lojas do canal nunca abriram o evento (novas: 51 no canal, 20 no evento). Limite
conhecido: o grão loja × dia × hora não carrega o evento, então com **mais de um
evento** no recorte o corte por evento na página não separa um do outro. Hoje o
recorte é um só (`SO_EVENTOS = 24052`); se voltar a ser vários, pôr o evento no grão.

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

Topo com a logo do C6, título, avisos e troca de tema. Cinco KPIs (5, 3+2,
2 ou 1 por linha conforme a largura), cada percentual com barra:
**Veículos publicados** (% de anúncios acessados; vendidos e com VMV
atingido), **Com ofertas** (% dos publicados; ofertantes e lances/lojista),
**Vendidos** (% dos publicados; compradores e participações/lojista — o valor
saiu em 30/09), **Performance financeira** (valor vendido, % da soma dos VMV;
arremate/FIPE e arremate/VMV, com barra), **Novos lojistas** (% de
engajamento; acessaram, ofertaram e compraram).

Depois: rankings de usuários GP e GN lado a lado e o de lojas na linha
inteira (tabelas ordenáveis, pontuação decrescente); funil de ativação (regra 3b do design) ao lado dos **acessos
únicos por dia**, que preenche a altura do cartão; acessos por hora na linha
inteira, do primeiro ao último horário com acesso; pátios na linha inteira;
veículos (score crescente, % FIPE e % VMV com barra, e no Resultado o
arrematante com o selo "novo" e os usuários GP e GN); o pátio chama a última
coluna de "% C/ VMV atingido" (30/09); glossário e rodapé. A tabela de eventos e
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
| Onde mora | Tabela de dados **"Carteira C6 - Lojas (base 17-08-2026)"**, id `3CErbnlGy2b5sFT5`, projeto **Cars2You** do n8n (30/09). Até 29/09 era a planilha `LojasAtivas_C6.xlsx` no SharePoint, que nunca chegou a subir. Quem atualiza troca as **linhas** da tabela; tabela nova pede trocar o id no `build_wf.py` |
| Como é lida | `Ler Representantes` (Data table, `get`, `returnAll`, `alwaysOutputData`). Em série, antes das consultas: em ramo paralelo o nó roda tarde demais (Radar, run 52930). Tabela vazia segue como item vazio e o Montar Painel derruba o run — sem o `alwaysOutputData` a cadeia pararia calada |
| Chave | CNPJ, só dígitos, completado a 14. `shops.cnpj` entra na consulta de lojas e **não chega ao HTML** |
| Colunas | `CNPJ`, `GN_Usuario`, `GP_Usuario` e `Base_Data` — as quatro obrigatórias. O GN vem vazio em 63% das linhas (19.321 de 30.718, dado, não defeito) |
| Linha sem `Base_Data` em forma de data | **fica de fora** e, desde 05/10, não vira mais aviso na tela (só `resumo.representantes.linhas_fora`). Em 30/09 a tabela tinha uma: "LOJA TESTE CAIO", `Base_Data` = "TESTE - apagar antes de produção", GN = CAIO.LEDESMA — daria representante a um CNPJ real |
| Nome na tela (30/09) | Da tabela **"Carteira C6 - Gerentes"**, id `2yD9cWG0J98sFFll` (Usuario, Papel, Nome), pelo nó `Ler Nomes`. RAFAEL.CONTESSOTO → "Rafael Contessoto". Em 30/09 cobria os 249 GN e os 30 GP da carteira. Usuário sem nome aparece pelo usuário e vira aviso; tabela vazia também — o run **não** cai (nome é cosmético). Dois usuários com o mesmo nome no mesmo papel levam o usuário entre parênteses |
| Data da carteira | a `Base_Data` mais recente entre as linhas válidas, no rodapé da tela ("carteira de representantes de 17/08/2026") |
| CNPJ com mais de um representante | fica o que aparece em **mais linhas**; empate → "Sem Representante". Os dois viram aviso |
| Carteira ausente, vazia, truncada, sem as colunas ou sem data válida | **o run cai** — publicar todo mundo "Sem Representante" seria uma tela plausível e errada |

A tabela é a mesma base da planilha (conferido em 30/09: 30.718 linhas iguais,
GN vazio em 19.321 e GP vazio em 1.189 nas duas) mais a linha de teste.
`resumo.representantes`, na saída do Montar Painel, conta por qual caminho
cada loja passou, por coluna, e quantas linhas ficaram fora.

## Ciclo de trabalho

```bash
python coleta_local.py                     # coleta real pela conexão direta (VPN) → dados-local.json (a tela)
python coleta_local.py --prova             # o mesmo SQL com recorte e loja nova desde 01/09 → dados-prova.json (as provas)
node _aplica-modelo.js                     # tema + logos para dentro do Montar Painel
for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
node _carteira_local.js                    # planilha local no formato da tabela do n8n → dados-carteira-local.json
node _gerentes_local.js                    # nomes dos representantes, pela regra da tabela → dados-gerentes-local.json
node prova-local.js                        # 245 provas, sobre dados-prova.json
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
| `_planilha_local.py` | converte o xlsx em `dados-planilha-local.json` (formato do antigo Extract from File) — entrada do `_carteira_local.js` |
| `_carteira_local.js` | converte `dados-planilha-local.json` no que o nó Ler Representantes entrega hoje (tabela de dados), com a linha de teste no fim |
| `_gerentes_local.js` | gera o que o nó Ler Nomes entrega, pela regra da tabela (nome = usuário com inicial maiúscula) |
| `prova-local.js` | 245 provas, sobre a coleta de prova (outubro abriu quase vazio: conta refeita sobre zero não prova nada): consultas, pacotes, período e dias refeitos do cru, pontuação e score (0–100) de toda loja e todo veículo refeitos do cru, performance financeira e % FIPE refeitos do cru, primeiro e último acesso refeitos do cru, funil, pátios, cada filtro refeito do cru, representante caso a caso, linha de teste da carteira ignorada, nome no lugar do usuário (e sem nome, tabela vazia, nome repetido), CNPJ que não vaza, carteira ausente/vazia/truncada/sem coluna derrubando o run, layout (ordem dos cartões e da gaveta), nó enxuto = nó original |
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

Sincronizações: 24/09, 28/09, 29/09 e duas em 30/09 — todas **idênticas byte a byte**. Mudança só de configuração de nó (como o `executeOnce`) vai pela `update_workflow`, que não toca no código.

## Pendências

- 🔵 **Mandar o link ao C6** (publicado no run 55191).
- 🔵 **Arquivar o `6o9MSr1CriZ1VUBa` e o `53RGtYzUzMoVtxpJ`** — o modo
  automático barrou em 30/09; fica com o Thomas, pela interface.
- 🔵 A linha de teste "LOJA TESTE CAIO" (id 30719) está na tabela com o aviso
  "apagar antes de produção". O painel já a ignora; apagar é com o Caio.
- ❓ Confirmar: % do pátio sobre os veículos do pátio; % VMV pela maior
  oferta; desempate de representante por maioria.
- 🔵 **Sem cron.** Manual. Se for rodar sozinho, o C6 fecha 16h ou 20h com
  prorrogação de até ~1h20 depois do fim oficial.
- 🔵 O `catalogo-relatorios/relatorios.json` (de outra sessão, ainda fora do
  git) cita o workflow antigo `VelPJDX8USP9WIeT`.
- 🔵 Mudar a pasta ou o nome do arquivo depois **abre pasta nova** e deixa a
  antiga órfã (upload por path).
