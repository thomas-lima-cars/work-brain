# Painel de Eventos Cars2You

> Os eventos da Cars2You como um todo, nos seis canais principais: o que
> está ativo hoje e em que status, quantos veículos estiveram ativos a cada
> dia (e quantos estrearam), quanto deles teve acesso, oferta e venda, quantos
> lojistas logaram, acessaram, ofertaram e compraram, e a tabela de veículos.

Pedido do Thomas em **28/10/2026**. Nasceu do Painel de Eventos C6: mesmo jeito
de empacotar consulta, mesma gaveta, mesma tabela ordenável. O recorte e a tela
são outros.

**Estado em 2026-11-06 (noite):** **no ar no n8n** — workflow
**`cRChMwAnLYGRMesM`** no projeto **Cars2You**, raiz, **ativo**: **de hora em
hora, das 9h às 18h, todo dia** (`0 9-18 * * *`, fuso America/Sao_Paulo; pedido
do Thomas em 06/11), e o gatilho manual para rodada avulsa. O histórico do
n8n guarda **só as execuções com erro** (cada run tem ~16 MB, as respostas
das 70 consultas; Thomas, 06/11) — run com sucesso não fica para inspecionar. Run **68395** (06/11 21:43, 2 min 40 s):
sucesso, publicou `Painel de Eventos Cars2You/painel-eventos-cars2you.html`
(2,8 MB) no site N8N, com as metas da planilha (39 no mensal, 32 no diário —
o diário só leva os comitentes da janela de 30 dias). O run 68394 parou no
banco: o MCP recusa `WITH ROLLUP` (corrigido). Status do cartão em funil,
gráfico acumulado no evento, aba Mensal de 12 meses, metas por comitente e
categoria, filtro de categoria. 91 provas.

```
Rodar → Peças do Tema → Peças da Página → Ler Carteira → Ler Metas Mensais → Metas Mensais
      → Ler Metas Diárias → Metas Diárias → Montar Consultas → MCP Consultas → Montar Painel
      → Virar Arquivo → Subir no SharePoint
```

**Como foi ao n8n** (06/11): o workflow inteiro tem 164 KB (~97 mil tokens),
e nenhuma chamada da API o carrega de uma vez sem trocar caractere. Então:
`_divide.js` parte o Montar Painel em três nós; cria-se o **esqueleto**
(`.esqueleto.wf.ts`, 24 KB) com `create_workflow_from_code`; cada nó grande
entra num `update_workflow` (`n8n/_envio/*.json`); e `_confere_n8n.py` confere
o md5 dos 5 nós Code contra `n8n/*.js` (idênticos em 06/11). **Mudou um nó?**
Regerar, mandar só o `_envio` dele por `update_workflow` e conferir o md5.

Publicaria em `Painel de Eventos Cars2You/painel-eventos-cars2you.html` no
site N8N. Gatilho manual (cron só com o ok).

## O pedido, e onde cada parte está

| pedido | na tela |
|---|---|
| Cartões dos eventos ativos no dia, com veículos por status; **em 06/11 os status viraram com oferta, VMV atingido, vendidos e removidos, em funil, e o cartão de sem oferta saiu** | cinco cartões: **Eventos ativos** (veículos e comitentes), **Com oferta** e **VMV atingido** (abertos, em análise, encerrados), **Vendidos** (aguardando pagamento, vendido, valor), **Removidos** (cancelados, suspensos). Vendidos ⊂ VMV atingido ⊂ Com oferta; sem oferta (o resto) não tem cartão |
| **Aba com o painel mensal, 12 meses** (06/11) | abas **Diário · Mensal** no canto direito do cabeçalho (06/11: no lugar do botão de tema, que desceu para o canto direito da barra do indicador, com Indicador e Veículos à esquerda; o ícone de avisos saiu da página, e os avisos seguem só no resumo do run). O Mensal é o espelho do diário em meses: cinco cartões do mês escolhido (com o mês anterior no pé), cartões por comitente (rosca do mês, área dos 12 meses, Δ contra o mês anterior, clique filtra), **Veículos ativos por mês** (já em evento antes + novos no mês, linha do indicador) e **Lojistas por mês**. Sem lista de eventos e sem tabela de veículos. Filtros próprios na gaveta: whitelabel, comitente e mês |
| Cartões de infográfico por comitente, com os indicadores do dia, abaixo dos big numbers, servindo de filtro (03/11) | **um cartão por comitente com evento ativo no dia**, **três por linha**, do maior para o menor: nome e eventos em cima; **parte dos gráficos (60% da largura)**: o nome do indicador centralizado em cima, sem rótulo embaixo de cada gráfico; uma **rosca com o % do indicador** no centro e, ao lado, **um gráfico de área dos últimos 7 dias**, um ponto por dia, com a **meta tracejada** como referência (06/11), e centralizados embaixo o "x de y" e a **diferença em p.p. para o dia anterior** (▲ ▼, sem cor desde 06/11); **parte da tabela (40%)**: a tabela de status (veículos, ativos, em análise, vendidos, removidos); no pé, o valor vendido. **A luz do cartão** (o véu do canto, o `--brilho` do tema) fica **verde na meta ou acima e vermelha abaixo** (06/11; antes, pela diferença para ontem), e **a rosca e a área ganham a mesma cor**; sem meta, a luz normal e os gráficos em azul. **Clique filtra** o painel inteiro pelo comitente (o mesmo filtro da gaveta), clique de novo solta; o escolhido fica com contorno e os outros apagados. No telefone viram uma fileira que corre de lado |
| Lista por evento abaixo (03/11) | **Retrátil** (o `<details>` é o cartão, como o glossário): **nasce fechada**, abre ao escolher um comitente e fecha ao soltá-lo, ou abre e fecha no clique do título — quem abriu ou fechou com a mão manda até o comitente mudar de novo. **Eventos ativos hoje**: uma linha por evento ativo no dia — nome, comitente e fim; os mesmos status; termômetro do indicador com o Δ p.p., **coluna de largura fixa** (barra, % e diferença alinhados em toda linha; o "vs ontem" mora só no cabeçalho) e **a mesma luz dos cartões por linha** (verde subiu, vermelha caiu), com **o termômetro na mesma cor**. **Clique filtra pelo evento.** Segue o comitente escolhido (com a LM marcada, só os 14 eventos dela). Evento aberto sem veículo aparece com zeros, para bater com o big number |
| Barras de veículos ativos por dia, separando os novos, com a linha do % com acesso, oferta e venda | **Veículos ativos por dia**: barra empilhada (já em evento + novos do dia), linha do indicador com eixo próprio à direita |
| Botões do KPI à esquerda, novos/todos à direita; depois, **filtros de indicador no topo** (03/11) | `Com acesso · Com oferta · Vendidos` numa barra **no topo da página**, antes dos big numbers: valem para a rosca, a lista de eventos e a linha do gráfico. **`Todos · Novos` subiu também** (03/11), à direita na mesma barra: com Novos, a rosca, o termômetro e o gráfico contam só os veículos que estrearam no dia |
| Tabela de veículos como a do painel de eventos | um veículo por linha: farol, link do anúncio, ano, km, estreia, evento mais recente e comitente, acessos, ofertas, maior oferta, FIPE, % FIPE, VMV, % VMV, resultado e comprador. Busca e "mostrar mais" de 100 em 100 |
| Curva de lojistas que logaram, acessaram, ofertaram e compraram por dia; depois **sem o Logaram, com rótulos** (03/11) | **Lojistas por dia**, três linhas — acessaram (branco), ofertaram (azul), compraram (verde) — e o total do período embaixo. Logaram saiu da tela (o cálculo segue, as provas usam). **Rótulo em cada ponto**: pílula com o fundo transparente (28%) na cor da linha, sem contorno, número na cor do texto (AA nos dois temas, de 4,99 a 11,63:1); com rótulo, sem eixo Y. Rótulos do mesmo dia que encostariam são afastados na vertical (31 dias: 93 rótulos, 0 sobrepostos). Se o rótulo não cabe no espaço de um dia (telefone com 31 dias), volta o eixo e o valor fica no balão |
| Filtros: whitelabel, comitente, evento, responsável da carteira comercial, data | gaveta, nessa ordem. Data = De / Até |
| **Meta diária e mensal do % com oferta e do % vendidos**, numa planilha com a média mensal numa aba e a diária noutra, **por comitente e categoria** (06/11) | Ver **As metas**, abaixo. Na tela: linha "Meta X% · Δ p.p." e traço no trilho dos cartões **Com oferta** e **Vendidos** (diário e mensal); **linha tracejada** no gráfico de veículos ativos (dia e mês) com o indicador Com oferta ou Vendidos; **traço na rosca** e "· meta X%" no cartão de cada comitente. Com acesso não tem meta |

## As regras

As marcadas **(minha)** são escolhas minhas, a confirmar com o Thomas.

| | |
|---|---|
| **Recorte** | Eventos que alvejam os canais 4, 7, 43, 48, 62 ou 65, **já abriram as ofertas** e terminam a partir de 30 dias atrás (os encerrados recentes e os ativos). O agendado fica de fora **(minha)**. Em 28/10 só 4, 7 e 43 tinham evento |
| **Veículo ativo no dia** | Veículo **distinto** com negociação num evento aberto no dia, do dia do início das ofertas ao dia do fim. O carro da LM que sai de um feirão às 16h e entra no seguinte às 18h conta uma vez |
| **Novo no dia** **(minha)** | O dia em que o veículo **estreou**: o início das ofertas do primeiro evento da vida dele, em qualquer canal. O pedido diz "cadastrados no dia"; o motivo da troca está abaixo |
| **Status nos cartões** (06/11) | Os veículos dos eventos ativos no dia, pela negociação no evento **mais recente**, em **funil** (Thomas: "Com oferta e VMV atingido acumulativos em relação aos status posteriores"): **Com oferta** = teve lance até o dia ou vendeu até ele; **VMV atingido** = maior lance ≥ VMV ou vendeu; **Vendidos** (2, 3, 7, pela data da oferta vencedora) cabe em VMV, que cabe em Com oferta; **Removidos** = 8, 10 (suspenso, cancelado), à parte — confirmado pelo Thomas em 06/11. **Sem oferta não tem cartão** (pedido do Thomas, 06/11). Com oferta e Vendidos do cartão = o último ponto do gráfico, em todo dia (prova). Num dia passado, removido e a fase (aberto, em análise, encerrado) são os de hoje. O 11 ("sem ofertas") não é Removido: num dia passado ele é o status de quase todo carro de evento já fechado (1.618 de 1.862 em 24/10, coleta de 03/11) |
| **Gráfico, rosca e termômetro** (06/11) | **Acumulados no evento**: de cada veículo ativo no dia, a negociação do evento mais recente ativo nele (a do cartão) e se ela teve acesso, lance ou venda do começo do evento até o dia. Venda conta como lance. Antes era o que aconteceu NO dia, e não batia com o cartão (05/11: 311 × 531 com acesso, 11 × 21 com lance). Desempate de evento com o mesmo fim: o id maior — as negociações são ordenadas por id na entrada |
| **Cartões por comitente** (03/11) | A mesma conta dos cartões do topo (`cartoes()` no `calcula`, uma função só), uma vez por comitente: o cartão do comitente é, por construção, o topo com aquele comitente filtrado — a prova confere campo a campo, hoje, num dia passado e com filtro de canal. Seguem canal, evento e data; **ignoram o próprio filtro de comitente**, para o escolhido não sumir com os outros |
| **Rosca, termômetro e Δ p.p.** (03/11) | O indicador do topo no dia, para os veículos do comitente ou do evento **ativos no dia** (a base pode ser maior que a coluna Ativos, que é o status agora): é a conta do gráfico com o comitente ou o evento filtrado, no dia e no dia anterior — a prova confere campo a campo em quatro recortes. Δ = % do dia − % do dia anterior, em pontos percentuais; sem veículo ativo num dos dois dias, "—". O modelo em lista no lugar dos cartões foi feito e descartado no mesmo dia: ficaram os cartões |
| **Cartões num dia passado** | Com Até antes de hoje, os cartões mostram os eventos ativos naquele dia com o status **de hoje** — o banco não guarda o status de cada dia |
| **Mensal: recorte** (06/11) | O mês corrente (até agora) e os 11 anteriores. Evento dos seis canais, já aberto, **ativo em algum dia do mês**. **Evento com mais de 31 dias de ofertas fica fora (minha)**: é depósito, não evento — "Anúncios cancelados" (id 266, de 2021 a 16/12/2025, 10.127 negociações) sozinho levava dezembro de 2,2 mil para 11,7 mil veículos |
| **Mensal: veículo, novo e status** | Veículo distinto com negociação num evento ativo no mês. Novo no mês = estreou no mês (nenhuma negociação em evento aberto antes do mês, de qualquer canal). Status e comitente: os da negociação no evento mais recente do mês, no funil do diário — nos meses fechados, é o desfecho |
| **Mensal: % e lojistas** | % com acesso / oferta / venda: dos veículos ativos no mês, **acumulado no evento** como no diário — a negociação mais recente do mês teve anúncio aberto, lance ou venda; com oferta e vendidos são os do cartão (06/11; antes era só o que aconteceu dentro do mês). Lojistas: lojas distintas no mês |
| **Mensal: filtros** | Whitelabel e comitente recortam veículos e lojas; Mês escolhe o mês dos cartões (os gráficos mostram sempre os 12). Canal: um veículo entra no canal se esteve num evento dele no mês, e conta pela negociação mais recente dele no mês, mesmo que seja de outro canal **(minha)**. Não há filtro de evento, responsável nem data |
| **% com acesso / oferta / venda** | Dos veículos ativos no dia, quantos tiveram o anúncio aberto por alguma loja, receberam lance ou venderam **naquele dia**. Venda pela data da oferta vencedora |
| **Logou** | Qualquer linha de `access_logs` da loja no canal (`dominios.md`, rota `/bem-vindo` e afins) |
| **Acessou** **(minha)** | Abriu algum **anúncio** dos eventos filtrados. Entrar só na página do evento não conta |
| **Comprou** | Tem a oferta vencedora de uma venda (2, 3, 7), no dia dela. Oferta vencedora sem loja (existe no Marketplace) conta como venda do veículo e fica fora dos lojistas |
| **Responsável** | O consultor da carteira comercial, pelo **CNPJ** da loja (o nome não entra: o Radar mediu que ele resgata 0,1%). Recorta as **lojas**, nunca os veículos, como no Radar |

### Os filtros

| filtro | recorta | não mexe em |
|---|---|---|
| Whitelabel | eventos que alvejam o canal, e o **logou** naquele canal | — |
| Comitente, Evento | as negociações, e tudo que nasce delas | o "logaram" (login não é de evento) |
| Responsável | acessos, ofertas, vendas e logins das lojas da carteira | cartões e barras (veículo não tem responsável) |
| Data (De, Até) | os **dias** dos gráficos e da tabela; os cartões mostram o dia do Até | — |

A Data corta **dias**, não negociações: a loja que abriu no dia D o anúncio de
um evento que só abre em D+1 acessou em D com período de um dia ou de trinta.
A primeira versão cortava as negociações e dava "acessaram em 20/10" = 487
com De = Até = 20/10 contra 532 no período inteiro — o `_confere_banco.py`
pegou.

### Por que "novo" é a estreia, e não `vehicles.created_at`

Medido em 28/10 (números em
[`indicadores.md`](../../../context/banco-de-dados/projetos/painel-eventos-cars2you/indicadores.md)):

- `vehicles.created_at` é o dia da **primeira negociação** do veículo (4.936
  de 4.940) — o cadastro acontece quando o evento é montado, **dias antes** de
  ele abrir. Fora da LM, dos 2.159 veículos, só 376 foram cadastrados no
  mesmo dia em que abriu o primeiro evento deles na janela. Com o cadastro, a maior parte dos "novos"
  não estaria ativa no dia em que é nova, e a barra de novos não caberia
  dentro da barra de ativos.
- O anúncio também não serve: a **LM recria o anúncio a cada feirão** (23.495
  anúncios de 2.781 veículos em 30 dias). Por ele, todo carro da LM seria
  novo todo dia.

Se o Thomas quiser o cadastro mesmo assim, o dado já vem (`cadastro` na
consulta de veículos): trocar `estreia` por `cadastro` no Montar Painel.

## As metas

Pedido do Thomas em 06/11: meta diária e mensal do % de veículos com oferta e
do % vendidos, por comitente e **categoria**. Escolhas dele, na mesma
conversa: a planilha é **editável** (nasce com a média e uma coluna Meta), mora
no **SharePoint**, as categorias são **Leves, Pesados, Motos** (mais o que o
banco tem fora delas) e a média é dos **12 meses fechados**. Na rodada
seguinte (06/11): **motos em Leves** e **comitente inativo nos últimos 3
meses fora da planilha**.

| | |
|---|---|
| **A planilha** | `metas-painel-eventos.xlsx`, gerada por `gera_metas.py` (VPN, ~10 s). Duas abas, **Média mensal** e **Média diária**, uma linha por comitente, **a categoria vira coluna** (06/11). Desenho (06/11): **linha 1 e coluna A são margem**; na **linha 2**, **% Com Oferta** (D2:G2) e **% Vendido** (H2:K2) **mesclados**; na **linha 3**, ID comitente, Comitente e as quatro categorias duas vezes (Leves, Pesados, Equipamentos, Não informada); os dados da linha 4. Célula vazia = o comitente não teve veículo da categoria nos 12 meses: sem meta. **Células das metas pintadas** no tom claro da medida (verde com oferta, azul vendido; o cabeçalho no tom cheio), **sem linhas internas** — só o contorno do bloco — e sem linhas de grade. O nome da categoria se repete, e a Tabela do Excel não aceita nome repetido: é um intervalo formatado com **filtro** |
| **A trava** (06/11) | A aba é **protegida, sem senha** (Revisar › Desproteger planilha abre): só o **valor das metas** fica destravado, e mais **100 linhas vazias formatadas no fim**, inteiras destravadas, para **comitente novo** (ID, nome e metas). **Inserir linha** e **filtrar** ficam liberados; formatar, apagar coluna e mexer no cabeçalho, no ID e no nome dos existentes, não. Linha inserida no meio herda o ID e o nome travados da de cima: comitente novo vai nas linhas do fim. **Validação**: meta só de 0% a 100%, ID só inteiro |
| **Como o n8n lê** (06/11) | **Sem cabeçalho** (`headerRow: false`): cada item é `{ row: [células da área usada] }`. O Montar Painel **acha a linha do "ID comitente"**, tira a categoria de cada coluna dela e a medida da linha de cima (a mesclada só tem valor na primeira célula, e vale até a próxima). Margem a mais, coluna movida ou linha nova no fim não quebram a leitura; aba sem a linha do ID ou sem as medidas avisa e sai sem meta |
| **Comitente inativo** (06/11) | Sem veículo em evento nos **3 últimos meses fechados** (ago a out/26): fora da planilha. Em 06/11, C6 Bank - CSixer e Repasse Itaú. Ele continua nas médias de categoria (são do comportamento da categoria nos 12 meses) |
| **A Meta, revisada** (Thomas, 06/11: "Sim, revise") | **Comitente de teste** (nome com "teste": Teste Cars2you v3, Teste Concessionária A) **fica fora** — da planilha e das médias de categoria; os veículos dele saem sem meta. **Grupo com base pequena** — mensal: menos de 3 meses com veículo ou menos de 30 veículos somados; diário: menos de 30 dias ou menos de 100 veículos-dia — leva a média do **comitente** (todas as categorias dele), se a base dele bastar, senão a da **categoria** (todos os comitentes). Com 1 mês e 1 veículo a média é 0% ou 100%: sorteio, não meta. Comitente antes de categoria porque em Não informada a categoria é quase só a LM (14% com oferta no mês) e o Itaú, com 57% nela, levaria 14%. Nos grupos com base, Meta = média |
| **Onde mora** | `Comitente - Metas/metas-painel-eventos.xlsx`, na raiz do site N8N (subida pelo Thomas em 06/11). Mudou a meta? Edita a planilha lá; o próximo run lê |
| **Média mensal** | O % do mês da aba Mensal (veículo ativo no mês, negociação mais recente, com oferta = lance ou venda, vendido = 2, 3, 7), média simples dos meses em que o grupo teve veículo |
| **Média diária** | O % do dia do Diário (acumulado no evento, até o fim do dia), média simples dos dias em que o grupo teve veículo |
| **Grupo** | Comitente da negociação escolhida × categoria do veículo. Evento com no máximo 31 dias de ofertas nas duas médias (o corte do Mensal; o Diário de hoje não tem nenhum mais longo) |
| **Categoria** (medida em 06/11) | `categories` + `category_groups`: **Pesados** = grupo 2 e o "Caminhao" 23 (que caiu no grupo 1); **Leves** = o grupo 10, **motos inclusive** (Automóvel, Utilitário, Motocicleta — "agrupe motos em leves", 06/11); **Equipamentos** = grupo 8; o resto, **Não informada**. O mesmo `CASE` em `gera_metas.py` e `montar-consultas.js` (`CATEGORIA`) |
| **Meta de um recorte** | A média das metas **dos veículos** dele: cada veículo leva a meta do seu comitente e categoria. Então o total, um canal, um evento ou um comitente com duas categorias têm meta própria, e ela muda com o perfil dos veículos do dia (por isso a linha do gráfico não é reta). Mensal: cada grupo do `mes_veic` pesa pelos veículos dele |
| **Sem meta** | Veículo de comitente ou categoria fora da planilha (os de teste e os inativos) fica fora da média; o balão do cartão e do gráfico diz "meta de X dos Y veículos". Em 06/11 20:07, 1.776 de 1.777 hoje e 2.206 de 2.264 em nov/26 |
| **Filtro de categoria** (06/11) | Na gaveta, depois do comitente, nas duas abas: Leves (motos inclusive), Pesados, Equipamentos, Não informada. Recorta as negociações pelo veículo — cartões, comitentes, lista de eventos, gráficos, lojistas do dia e tabela —, e a meta acompanha (é a dos veículos que ficam). O evento da gaveta só lista os que têm veículo da categoria. No Mensal, eventos e lojistas do mês vêm do banco sem categoria e não a seguem; a página avisa embaixo dos lojistas |
| **Cores** (06/11: "olhar para a meta") | A luz do cartão do comitente, a cor da rosca e da linha, e a cor da linha da lista de eventos: **verde** com o indicador do dia (ou do mês) **na meta ou acima**, **vermelha abaixo**; sem meta (Com acesso, ou grupo fora da planilha), a cor normal. A diferença para o dia anterior fica com a seta e sem cor |
| **Linha do cartão** (06/11) | **O indicador de cada dia** nos últimos 7 dias ("a linha deve ser o indicador por dia"; por umas horas foi a média móvel de 7 dias), e a **linha de referência é a meta** ("deve ser = meta", 06/11): reta, tracejada, na mesma meta do título do cartão e do traço da rosca. A rosca continua o dia. No Mensal, a linha são os 12 meses com a meta de cada mês |
| **Indicador padrão** (06/11) | **Com oferta** — o que tem meta |
| **Planilha ausente ou ilegível** | O painel sai sem a meta daquele recorte e avisa no resumo do run — também se a aba vier fora do desenho (sem a linha do ID comitente, as categorias e as medidas em cima). Lê fração (0,25), "25%", "25,5" e 25 (= 25%); meta ilegível, ou só uma das duas de uma categoria, fica sem meta e conta no aviso |
| **No n8n** | O Extract From File lê **uma aba** e não devolve o arquivo: a planilha é baixada duas vezes (`Ler Metas Mensais`, `Ler Metas Diárias`), em série antes das consultas, como a carteira. `executeOnce` no segundo download; `onError` + `alwaysOutputData` nos quatro, para a cadeia seguir sem a planilha |
| **Conferência** (06/11; a planilha larga foi convertida da longa sem VPN — mesmas metas, conferidas no painel: hoje 11,8% / 4,8%, nov/26 45,0% / 28,0% — e o `gera_metas.py` novo testado com dado de mentira; **rodar de novo com VPN antes de subir**) | O gerador refaz o painel: os totais de 11 meses (dez/25 a out/26) e dos dias 15/10 e 29/10 batem com o painel, exceto 1 vendido a mais no painel em out/26 (coleta das 14:27, o banco andou) |

⚠️ **O mês corrente fica abaixo da meta mensal até fechar**: a meta é do mês
inteiro e o mês corrente é parcial (o mesmo vale para o Δ contra o mês
anterior).

## As consultas

Cada uma devolve **uma linha só** (`COUNT(*)` + `JSON_ARRAYAGG`), como no
Painel C6: o teto de 50 linhas do MCP não corta nada, e pacote menor que o
total derruba o run. As tabelas grandes saem **em partes** pelo resto do id,
cada pacote abaixo dos ~130 KB que o MCP já provou passar. Parte que faltar
derruba o run.

| tabela | partes | o que traz |
|---|---:|---|
| `canais`, `eventos`, `comitentes` | 1 | nomes e datas |
| `negs` | 14 | uma linha por negociação: evento, veículo, comitente, status, VMV, FIPE |
| `veiculos` | 7 | marca, modelo, versão, ano, km, cadastro, **estreia**, uuid do anúncio mais recente, **categoria** (L, P, M, E, N) |
| `vendas` | 1 | a oferta vencedora das vendas: loja, valor, quando |
| `ofertas` | 3 | (negociação, loja): lances, maior lance, **máscara dos dias** |
| `acessos` | 12 | (negociação, loja) com a máscara dos dias em que abriu o anúncio |
| `logins` | 1 | (loja, canal) com a máscara dos dias com acesso ao canal |
| `lojas` | 2 | nome, canal e **CNPJ** — o CNPJ vira responsável no nó e não chega ao HTML |
| `mes_veic` | 12, **uma por mês** | o mês já agregado por (comitente, máscara de canais): veículos, novos, com acesso / oferta / venda acumulados no evento (e dos novos), o funil dos status, valor. Cada veículo num grupo só: a soma é a contagem distinta com qualquer filtro de canal ou comitente |
| `mes_loj` | 12, uma por mês | lojas distintas que acessaram, ofertaram e compraram, por (canal, comitente) com o `ROLLUP`, mais um bloco por comitente sem canal: cada recorte da tela vem contado pronto |
| `mes_eventos` | 1 | os eventos dos 12 meses: abre, fecha, canais e comitentes (82 KB) |
| `mes_dias_acesso` | 1 | dias com registro no `access_logs` por mês — o buraco de 06/02 a 11/03/2026 vira aviso |
| `mes_comitentes` | 1 | os comitentes dos 12 meses |

**70 chamadas, ~135–157 s no banco** (coletas de 06/11; eram 43 e ~50 s antes do
mensal). Nenhuma passa de 18 s, abaixo dos 60 s do MCP. ⚠️ O `mes_loj` usa
`GROUP BY ... WITH ROLLUP`: a conexão direta aceita, **o validador do MCP não
foi testado** — se recusar, trocar por `UNION ALL` de três `GROUP BY`. A máscara de dias (bit k =
k dias depois do piso) é o que deixa a página contar "no dia" com qualquer
filtro sem levar o acesso cru: são 31 dias, bits 0 a 30, que cabem no inteiro
de 32 bits do JavaScript. `DIAS` acima de 30 é recusado no Montar Consultas.

## A carteira comercial

O nó `Ler Carteira` lê `Radar de Estoque/_dados/carteira-comercial.json`, o
arquivo que o workflow **Carteira Comercial** (`ksZI8cqSbexqLOre`) publica às
6h e que o Radar já consome. Em série, antes das consultas (lição do Radar,
run 52930).

| situação | o painel |
|---|---|
| veio, com ≥ 500 CNPJ | filtro de responsável, pelo CNPJ |
| não veio, fora do formato, ou truncada (< 500) | sai **sem o filtro** de responsável, com aviso. Todo mundo em "Não distribuído" seria tela plausível e errada; derrubar o painel por um filtro, caro demais |
| mais de 7 dias | sai e avisa a idade |

⚠️ O brain registra (22/10) que a Carteira Comercial aparece `active: false`
no n8n. Se estiver mesmo parada, este painel vai avisar "carteira de N dias".

Localmente não há SharePoint: o `coleta_local.py` usa o literal do Radar
(`CARTEIRAS` em `rel-veiculos/montar-html.js`, de 21/09), e por isso a tela
local mostra o aviso de 37 dias.

## Design

Tema do brain (`design/tokens/tema.css`), sem camada de produto — é da própria
Cars2You. Logo extensa e curta, preta no claro e branca no escuro. **Abre no
escuro** (regra 7). Três cores derivadas, que o `tema.css` não tem, medidas no
`design/_contraste.js` contra o pior plano (AA de traço, 3,0):

| token | claro | escuro | para quê |
|---|---|---|---|
| `--serie-2` | `#748290` (3,19 no canto do cartão) | `#646E86` (3,18 no cartão) | barra "já em evento" |
| `--farol-abaixo` | `#946200` (4,25) | `#E3B341` (9,38) | farol de oferta abaixo do VMV |

**Sem rosa nem vinho (Thomas, 03/11).** O `--atencao` do `tema.css` (vinho
no claro, rosa `#C98A92` no escuro) é redefinido no painel para o amarelo do
farol, e nada desenha com ele de propósito. A linha do indicador usa
`--texto` (branca no escuro). Lojistas: Logaram `--texto-3` (cinza),
**Acessaram `--texto` (branco no escuro, grafite no claro)**, **Ofertaram
`--acento-cheio` (azul)**, Compraram `--positivo` (verde). Varredura no
navegador, nos dois temas, de toda cor computada: nenhum rosa ou vinho.

**Fontes mais claras no escuro (Thomas, 03/11)**, só neste painel — o
`tema.css` segue igual. Medidas sobre o cartão `#12151D`:

| token | era | ficou |
|---|---|---|
| `--texto` | `#EDEFF5` | `#F3F5FA` (16,7:1) |
| `--texto-2` | `#A4ABBF` (8,0:1) | `#C0C6D4` (10,7:1) |
| `--texto-3` | `#6E7589` (**4,0:1, abaixo de AA**) | `#8E95A8` (6,1:1) |

Os gráficos são séries de até 31 dias com duas medidas no mesmo desenho: a
exceção da regra 3 — eixo com grade, sem rótulo em cada ponto, valor de cada
dia no balão. O SVG é desenhado na **largura real da caixa** (viewBox em
pixels), para o texto do eixo sair legível também no telefone.

## Ciclo

```bash
python coleta_local.py               # coleta real (VPN) + carteira local → dados-local.json
python gera_metas.py                 # a planilha de metas (VPN) → metas-painel-eventos.xlsx
python le_metas.py                   # a planilha como o n8n lê → metas-local.json
node _aplica-modelo.js               # tema + logos para dentro do Montar Painel
for f in montar-consultas.js montar-painel.js virar-arquivo.js; do node _enxuga.js $f; done
node _divide.js                      # o Montar Painel em 3 nós para o n8n
node prova-local.js                  # 89 provas
python _confere_banco.py 22          # o dia 22 da janela contra SQL escrito de novo (VPN)
python _confere_mes.py 10            # o mês 10 (0 = o mais antigo) pelas linhas cruas (VPN)
node monta_local.js                  # saida-local.html
python build_wf.py                   # painel-eventos-cars2you.wf.ts
```

Para ver: `previa-radar` em `.claude/launch.json`, em
`http://localhost:8777/automations/n8n-sdk/painel-eventos-cars2you/saida-local.html`
(2,6 MB: o navegador interno não abre o arquivo direto).

**Nada vai ao n8n sem a aprovação final do Thomas.**

| arquivo | o que é |
|---|---|
| `montar-consultas.js`, `montar-painel.js`, `virar-arquivo.js` | os três nós Code, **com** comentário — a fonte |
| `n8n/*.js` | os mesmos sem comentário de bloco (`_enxuga.js`). Derivado: não editar |
| `_aplica-modelo.js` | injeta `tema.css` e as quatro logos da Cars2You |
| `_roda_no.js`, `_enxuga.js` | iguais aos do Painel C6 |
| `coleta_local.py` | roda o SQL exato do Montar Consultas pela conexão direta e mede cada pacote; avisa o que passar de 130 KB |
| `monta_local.js` | regera a tela sem n8n e sem banco |
| `gera_metas.py` | a planilha de metas: médias mensal e diária dos 12 meses fechados por comitente e categoria, das linhas cruas (VPN). `--confere` imprime os totais de cada mês e de dois dias, para bater com o painel |
| `metas-painel-eventos.xlsx` | a planilha gerada — a que sobe para o SharePoint |
| `le_metas.py` | lê a planilha (ou outra, como a baixada do SharePoint) como o Extract From File e grava `metas-local.json`, que os scripts locais passam como os nós de metas (`nosLocais` no `_roda_no.js`) |
| `prova-local.js` | 89 provas — a linha do cartão = os dias do gráfico filtrado; as quatro categorias somam o total (dia, cartões e mês); o filtro só deixa veículos dela; o indicador nasce em Com oferta. As 11 das metas: a revisão (sem teste, Meta = média só no grupo com base, origem em toda linha), planilha inteira na página no comitente e categoria certos, toda categoria válida, meta do dia e do mês refeitas do cru, rosca = gráfico filtrado, sem planilha sai com aviso, leitura de "25%" / "25,5" / 25 e linha ilegível, os blocos na página. As demais: as 13 do mensal: 12 meses seguidos, uma consulta por mês, evento de mais de 31 dias fora, status somando em todo mês, soma do cru, comitentes e canais somando, cartão do comitente = mês filtrado, eventos e lojistas refeitos, o que derruba o run e o aviso do access_logs. As demais: fonte (sem barra invertida, blocos injetados iguais ao injetor, enxuto = original), consultas (uma por parte, pacote único, sem NOW), o que derruba o run (pacote cortado, parte faltando, resposta a menos), carteira ausente/com erro/truncada/velha, HTML (escuro, offline, CNPJ que não vaza, ordem dos blocos e da gaveta, glossário), e as contas refeitas do cru sem máscara: ativos e novos de cada dia, cartões, responsável repartindo as lojas, De = Até, evento, canal e comitente, tabela |
| `_confere_mes.py` | um mês do mensal pelas linhas cruas (negociação, lances, acessos) e a conta em Python, sem o SQL do Montar Consultas, contra o `calculaMes()` da página. Em 06/11: out/26, fev/26 e dez/25 exatos |
| `_confere_banco.py` | o dia escolhido e o período contra SQL de contagem distinta, escrito de novo, sem máscara e sem o `calcula()`; os cartões de hoje por um terceiro caminho |
| `_divide.js` | divide o Montar Painel enxuto em **Peças do Tema** (CSS, logos, ícones), **Peças da Página** (a função APP) e **Montar Painel** (o resto, que lê as duas pelo nome), cada um abaixo de 56 KB. Por quê: o workflow inteiro tem 164 KB (~97 mil tokens) e nenhuma chamada da API do n8n o carrega de uma vez sem trocar caractere (06/11, a primeira tentativa parou aí). A prova exige o mesmo HTML e resumo do nó inteiro |
| `build_wf.py` | gera o `.wf.ts` (13 nós, sem cron, sem e-mail), o **esqueleto** (`.esqueleto.wf.ts`, os três nós grandes com um marcador — é o que se cria) e `n8n/_envio/*.json` (o jsCode de cada nó grande em JSON, para o `update_workflow`) |
| `_confere_n8n.py` | confere por md5 o código dos 5 nós Code do n8n contra `n8n/*.js` (a resposta do `get_workflow_details` salva em arquivo) |

`dados-*.json` e `saida-*.html` ficam fora do git (`.gitignore`): têm nome real
de loja.

## Pendências

- ✅ (06/11) **Workflow criado e rodado** — `cRChMwAnLYGRMesM`, projeto
  Cars2You. O MCP **recusou o `WITH ROLLUP`** do `mes_loj` (run 68394,
  "syntax error near 'with'"); virou quatro `GROUP BY` unidos, e o Montar
  Consultas recusa `WITH ROLLUP` desde a montagem. No run 68395 os lojistas
  de dez/25 a out/26 saíram **idênticos** aos da coleta local com o ROLLUP.
- ✅ (06/11) Agendado: de hora em hora, 9h às 18h, todo dia (`crons.md`).
- ✅ (06/11) Planilha subida pelo Thomas em `Comitente - Metas/` no site
  N8N — sem ela o painel sai sem meta (e avisa). ✅ No run 68395 o Extract From File sem cabeçalho
  entregou `{ row: [...] }` por linha e o % como fração, como o painel lê.
- ✅ (06/11) `gera_metas.py` rodado com VPN no desenho final: as metas são
  iguais, uma a uma, às da planilha montada sem banco.
- ✅ (06/11) Coluna Meta revisada: comitentes de teste fora, grupo de base
  pequena com a meta do comitente ou da categoria (ver **As metas**). Os
  cortes de base pequena (3 meses / 30 veículos; 30 dias / 100 veículos-dia)
  são **(minha)**.
- ✅ (06/11) Removido = só 8 e 10, o 11 virou sem oferta — **confirmado pelo
  Thomas em 06/11**.
- ❓ (06/11) Evento de mais de 31 dias fora do mensal (minha) · o mês dos cartões nasce no corrente,
  parcial, e o Δ compara com o mês anterior inteiro · com filtro de canal, o
  mensal conta o veículo pela negociação mais recente dele no mês, mesmo de
  outro canal (minha).
- ✅ (06/11) O indicador "Com oferta" e o cartão "Com oferta" agora são a
  mesma conta (funil e gráfico acumulado).
- ❓ Confirmar as escolhas marcadas **(minha)**: novo = estreia; acessou =
  abriu anúncio; agendado fora do recorte.

- 🔵 Os canais 48, 62 e 65 não tinham evento em 28/10: aparecem no filtro só
  pelo login.
