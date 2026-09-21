# Radar de Estoque

> Veículos em evento × lojas compradoras.
>
> **O projeto se chama Radar de Estoque desde 18/09/2026.** "Aderência"
> continua sendo o nome do **indicador** — a coluna da tabela, o score de cada
> par, o corte da barra. Projeto e métrica são coisas diferentes, e há prova
> em `prova-local.js` conferindo as duas separadamente.

Workflow n8n **`8fiTFsjWG9RQinz8`** — **"Radar de Estoque"**, renomeado pelo Thomas na
interface em 18/09/2026. Chamava-se "RELATORIO Veiculos em evento - lojas mais aderentes".
O **id não muda ao renomear**, então nada que aponte para ele quebrou.
Projeto **Cars2You** (`yAo7DiqDfz6XfXyv`, time) desde 2026-09-11 — nasceu no projeto
pessoal do Thomas e foi movido pela interface. O id não muda ao mover.

Para cada veículo em evento, ordena as lojas por **chance de comprar aquele carro**, a
partir do perfil de compra dos últimos 6 meses. E o inverso: clicando numa loja, ordena
os veículos. Saída é um HTML único, com os dados embutidos e um glossário embarcado.

## 🎨 O visual vem do modelo do brain, não daqui

Desde 18/09/2026 a folha de estilo deste relatório é
[`design/tokens/tema.css`](../../../design/tokens/tema.css) — a mesma dos
modelos em `design/modelos/`. Antes ele tinha paleta e componentes só dele
(fundo `#f4f6f9`, cartão de raio 3px, topo azul sólido, cinco KPIs numa faixa
única). Funcionava, e estava sozinho: cada relatório novo reinventava o mesmo
cartão, e contraste corrigido num não chegava no outro.

**Este nó roda dentro do n8n**, onde não existe `require`, `fs` nem pasta do
repo. Então a folha e os dois logos viajam como literal, injetados por:

```bash
node automations/n8n-sdk/rel-veiculos/_aplica-modelo.js
node automations/n8n-sdk/rel-veiculos/_prova-modelo.js   # 46 provas
```

🔴 **Não edite o bloco entre `TEMA:INICIO` e `TEMA:FIM` à mão.** Mexa em
`design/tokens/tema.css` e rode o injetor. Cópia que só um humano atualiza
vira cópia desatualizada — normalmente descoberta quando alguém pergunta por
que o relatório ficou com a cor antiga. A prova falha alto se divergirem.

### A ponte, e por que não renomeei nada

O relatório usa 24 classes próprias (`.pg`, `.card`, `.card-h`, `.kpi`,
`.wrap`, `.xk`, `.gl`…) em centenas de lugares, dentro do APP e do esqueleto.
Renomear tudo seria mexer em 86 KB de gerador para não mudar nada na tela — e
cada ponto esquecido viraria um elemento sem estilo.

A `PONTE` faz o contrário: **mantém os nomes e troca o que eles significam.**
Os tokens antigos viram apelido dos novos (`--ac` → `var(--acento)`), e como
`var()` dentro de custom property resolve na hora do uso, o tema escuro passou
a funcionar de graça em tudo que já usava eles.

As regras que esse visual segue (anatomia do cartão, tamanho do KPI, rótulo de
gráfico, lugar do glossário) estão em
[`design/regras-de-layout.md`](../../../design/regras-de-layout.md) — consulte
lá antes de ajustar qualquer coisa de visual aqui.

### O que mudou na tela

| | antes | agora |
|---|---|---|
| Topo | barra azul sólida, título centralizado | superfície **fixa**, título à esquerda |
| Cartão | raio 3px, sem sombra | raio 16px, sombra, vidro no tema escuro |
| KPIs | faixa única com 5 células divididas | 5 cartões soltos, e **menores** |
| Tema | só claro | **claro e escuro**, com botão no topo |
| Logo | ícone 26×26 branco | wordmark, trocado pelo tema |
| Cabeçalho do cartão | só texto | **chip com ícone** à esquerda, contagem à direita |
| Brilho | — | **luz azul no canto** superior esquerdo, no tema escuro |
| Filtros | `flex-wrap`, largura pelo conteúdo | **grade de colunas iguais** |
| Glossário | segunda tela, escondia o relatório | **fim da mesma página**; o botão rola até ele |

**Duas coisas NÃO seguem o modelo, de propósito:**

- **Alinhamento da tabela.** O modelo centraliza porque tem 6 colunas curtas;
  aqui são nove, quase todas número. Número se compara pela direita.
- **Corpo de 13px** em vez de 14px — tabela densa pede mais linha na tela.

O glossário já era uma **tela inteira** aqui, o que é ainda mais separado do
que o modelo pede (cartão próprio, último bloco).

## 🎯 O extrato da loja: escolher e mandar

Clicar numa loja abre o extrato. Desde 18/09 ele deixou de ser só leitura:

**1. O corte de aderência é do usuário.** Era `LIMIAR = 70`, escolhido por
mim. 70 não tem nada de especial — numa loja de perfil apertado sobra carro
demais, numa de nicho não sobra nenhum. Virou **barra deslizante** de 0 a
100%, ainda nascendo em 70 para ninguém precisar mexer. A lista se redesenha
enquanto arrasta.

**2. Caixa de seleção por veículo**, mais "selecionar todos os visíveis".

A seleção é guardada **por `vehicle_id`**, não por posição na lista — ela
sobrevive a mover a barra e a trocar de filtro. Guardar por posição seria mais
simples e estaria errado: a lista se reordena, e a pessoa perderia a seleção
sem entender por quê.

**3. Botão que gera o texto para o lojista**, com os veículos marcados:

```
Olá, LOCADORA TRIANGULO!

Separamos 2 veículo(s) que combinam com o perfil de compra da sua loja:

1. Volkswagen 9-180 2024
   60.819 km | R$ 251.500 | Caminhao
   Evento: Feirão de oportunidades LM Pesados - 14/09/26
   https://cars2you.com.br/anuncio/veiculo/volkswagen/9-180/...
```

**Texto puro, sem marcação.** O mesmo bloco precisa colar limpo no corpo de um
e-mail e no WhatsApp — `*negrito*` ficaria certo num e errado no outro.

⚠️ **Nada é enviado daqui.** O botão gera e copia; quem manda é a pessoa. O
texto aparece numa caixa editável justamente para ser conferido antes.

O link do anúncio segue a mesma regra dura da tabela: **faltando um pedaço, o
link não entra** — melhor sem link que link que cai em lugar nenhum.

### Detalhes que custaram erro

- A célula da caixa tem `event.stopPropagation()`: sem isso o clique sobe para
  a linha, que tem handler de seleção, e marcar a caixa trocaria a tela.
- O texto usa `String.fromCharCode(10)` para quebrar linha, e não `
`: dentro
  da string de JS do nó o escape seria consumido ali e chegaria ao cliente como
  quebra de linha de verdade no meio de um literal. Escapar em dobro resolveria
  e acrescentaria barra invertida, que é o que este arquivo não pode ter.
- `navigator.clipboard` só existe em contexto seguro. Este relatório abre de
  arquivo local e do SharePoint, então há caminho alternativo — e, falhando os
  dois, a mensagem manda usar Ctrl+C em vez de o botão não fazer nada.

## O que entra na base

Uma linha por **veículo**, com o status da **última negociação** dele na janela.

**A ordem importa e é fácil de inverter sem perceber:** primeiro se acha a última
negociação (`MAX(an.id)` agrupado por `vehicle_id`, sem olhar status), *depois* se olha o
status dela. O contrário faria um carro vendido hoje reaparecer como disponível pela
negociação de ontem, que ficou em "Sem Ofertas". Há uma prova travando isso.

Entram cinco dos doze status (domínio completo em
[`dominios.md`](../../../context/banco-de-dados/dominios.md)):

| entra | | fica de fora | |
|---|---|---|---|
| `1` | Ativo — evento aberto | `9`, `13` | há **oferta viva na mesa** |
| `11` | Sem Ofertas | `2`, `3`, `7` | venda |
| `14` | Vendedor Rejeitou | `8`, `10` | suspenso, cancelado |
| `15` | Comprador Rejeitou | | |
| `18` | Venda Cancelada | | |

Os quatro últimos são **sobra**: o carro passou pelo evento e não foi vendido. É o
estoque que faz sentido reofertar, e vem marcado com o nome do status na tela.

### O link do anúncio

Cada veículo leva o link do anúncio na plataforma, no padrão decidido na reunião de 25/08
e conferido caractere por caractere contra os exemplos do Guilherme (o raciocínio inteiro
está em [`lista-lm-propostas.md`](../../n8n-flows/lista-lm-propostas.md)):

```
cars2you.com.br/anuncio/veiculo/{marca}/{modelo}/{versão}/{uuid}
```

Tudo minúsculo, `encodeURIComponent` em cada trecho (espaço vira `%20`, **não** hífen) e o
uuid **sem hífens**. São quatro pedaços, não um — `advertisements` não tem coluna de URL.

**Regra dura, herdada da lista LM: faltando um pedaço, o link não é entregue.** Melhor sem
botão que botão que cai em lugar nenhum. Hoje ninguém cai nesse ramo (medido: 1.879 de
1.879 anúncios têm os quatro), mas ele existe para quando cair.

⚠️ **Ter anúncio não é o mesmo que poder receber proposta.** O relatório inclui de
propósito veículo de evento encerrado e de status "Sem Ofertas", então parte dos links
abre anúncio que não aceita mais lance. Aqui isso é o certo — é relatório de aderência,
não lista de compra — e por isso o status aparece ao lado do link.

## A janela de eventos, e a armadilha do fuso

Desde **2026-09-18** o recorte olha para a frente: `PISO_FIXO = ''` (piso na **meia-noite de
hoje**, em Brasília), `HORAS_ADIANTE = 168` e `TETO_FIM_DO_DIA = true` — **os eventos que
encerram nos próximos 7 dias**, do começo de hoje ao fim do sétimo dia. Continua **sem
filtro de `e.status`**.

**Os dois lados fecham em limite de dia, e é pelo mesmo motivo.** Piso às `00:00:00`, teto
às `23:59:59`. Com o teto no relógio da coleta (`agora + 168h`), evento que encerra no
sétimo dia às 20h ficaria de fora hoje e entraria amanhã — o recorte passaria a depender da
hora em que o run roda, que é exatamente o defeito que o piso à meia-noite evita do outro
lado.

🚨 **O eixo do relatório mudou aqui, não é a mesma base menor.** Até 17/09 a janela era
aberta para trás (piso fixo em 09/09, sem teto) e a pergunta era *"o que passou pelo evento
e não vendeu"* — a sobra. Agora é *"o que vai encerrar e ainda dá pra empurrar"*. Medido
sobre o run 50406 **antes** de valer:

| | janela aberta | janela de 7 dias |
|---|---|---|
| eventos | 50 | **18** |
| veículos | 1.221 | **493** |
| pares | 33.503 | **13.195** |
| HTML | 4,98 MB | ~2,2 MB |

Saem os **726 veículos de evento já encerrado, dos quais 723 eram sobra** (717 em *Sem
Ofertas*). Comparar contagem com run anterior a 18/09 não faz sentido.

**Piso na meia-noite, não no instante — e isso vale 51% da base.** No run 50406, às 17:24,
nove eventos tinham encerrado entre 14h e 16h do **mesmo dia**, com **625 veículos**. Com o
piso no relógio, o relatório encolheria conforme a hora em que roda. Quem faz isso é
`INCLUI_ENCERRADOS_HOJE = true`.

**Por que não entrou filtro de `e.status = 1`** (decidido junto, em 18/09): ele não remove
nada que a janela já não remova — **zero** eventos com `status ≠ 1` têm fim no futuro,
medido no 50406 — e o status **atrasa**: aqueles mesmos nove eventos ainda estavam com
`status = 1` horas depois de encerrados. Seria um jeito silencioso de perder evento.

**A cauda longa saiu junto**, e era o efeito colateral da janela sem teto: Mega Feirão da
Virada (fim 12/12), Banco GM, OMNI, VWFS, Apeop, Clube FMP, e um "Em preparação Net Carros"
que terminava em **2027**. Com teto de 7 dias eles não entram mais.

⚠️ **`q_eventos` truncava calada, e ninguém via.** Ela rodava com uma página só, e o teto de
50 linhas do MCP cortava a lista. Na janela aberta havia mais de 50 eventos: o **21746** ("Em
preparação Net Carros") tinha veículo no relatório e **não estava na lista** — some do filtro
de evento da página e do cabeçalho, sem erro nenhum. Corrigido em 18/09: `q_ev_total` virou
gabarito, `q_eventos` ganhou 4 páginas e a fase 2 **mata o run** se faltar página. A janela de
7 dias esconde o sintoma (são ~18 eventos), não a causa.

Os outros modos continuam de pé e provados: `PISO_FIXO = 'AAAA-MM-DD'` prega o piso num dia
e ignora hoje; `HORAS_ADIANTE = 0` faz o teto sumir e volta a janela aberta. E preenchendo
`EVENTOS_IDS` o recorte vira uma lista fixa, as datas não valem, e o cabeçalho passa a
dizer isso em vez de anunciar uma janela que não vale.

⚠️ **O piso e o teto são calculados no nó e viajam como literal.** O banco responde
`NOW()`/`CURDATE()` em UTC mas grava as datas dos eventos em hora de Brasília, então às
21h daqui o banco já aponta para o dia seguinte e "hoje" perde o dia inteiro. Não troque
por `NOW()`. O detalhe está em [`dominios.md`](../../../context/banco-de-dados/dominios.md).

Também **não** há filtro de `e.status`: evento encerrado fica com `status = 0`, e exigir
`1` excluiria justamente o que a janela quer trazer. Quem protege é o status da
negociação — evento cancelado deixa as suas em `10`, que não está na lista.

## Os canais que entram (recorte de 2026-09-11)

A base **não** é a plataforma inteira. Só entram eventos e lojas destes seis whitelabels:

| id | canal |
|---|---|
| 4 | Trucks2you |
| 7 | Marketplace Cars2You |
| 43 | Canal de vendas C6 Auto |
| 48 | Colaboradores C6 |
| 62 | Lance Fácil BTB |
| 65 | Lance Fácil BTB Associados |

**Por id, não por nome** — renomear um canal no banco quebraria um filtro por nome em
silêncio. Os seis ids foram **confirmados pelo Thomas em 2026-09-11**; antes disso, 48 e 65
vinham da documentação do brain, que os declara inferidos, e não apareciam na janela para
conferir pelo dado.

🚨 **Id errado não dá erro de SQL.** `IN (4,7,43,99,62,65)` roda liso e devolve uma base
menor, com um canal faltando — e o relatório fica plausível, que é o pior tipo de defeito.
Por isso a fase 1 pergunta ao banco o nome de cada id (`q_wl_nomes`) e o `Montar HTML`
confere contra o nome esperado, declarando falha na tela se divergir.

O filtro vale em **quatro** lugares, e faltar um não dá erro — dá base errada:

1. `SELECAO` — só entra evento que alveja ao menos um dos seis
2. `q_evento_wl` — o veículo só carrega canais permitidos
3. `q_evwl_total` — o gabarito conta a mesma coisa que a consulta, senão a conferência de
   completude acusa falso positivo
4. `q_lojas_total` **e** `q_lojas` — com o **mesmo** filtro, porque um dimensiona a
   paginação do outro; divergir gera página vazia (que custa um agregado inteiro) ou
   coleta incompleta

`WHITELABELS = []` desliga o recorte.

## A regra de elegibilidade

Um par (veículo, loja) **só existe** se as duas condições valerem:

1. **Mesma UF** — a do veículo é a do **pátio** onde ele está (`shop_stocks`), não a do
   endereço da loja vendedora; a da compradora vem do endereço dela.
2. **Whitelabel do evento** — `event_whitelabels` é 1:N, então é `loja.whitelabel_id ∈
   conjunto`, não igualdade simples.

🚨 **A UF do veículo mudou de fonte em 2026-09-10, e não é cosmético: 68% dos veículos têm
pátio numa UF diferente da UF cadastral de quem vende** (sonda 50068, cobertura de 100%
pelos dois caminhos até `shop_stocks`). Como UF é metade desta regra, a base de pares é
**outra** — comparar um run novo com o 49984 não faz sentido.

Fora disso não existe aderência baixa: **o par não existe**. É por isso que o ranking de
cada veículo é curto — ele só disputa dentro da própria praça e do próprio canal.

## A fórmula

Cinco componentes, cada um com uma **aderência** (0..1) e um **peso** (0..1):

| componente | aderência | peso |
|---|---|---|
| preço, idade, km | `1 / (1 + |valor − média| / desvio)` | `1 / (1 + desvio / média)` ← o CV |
| modelo, categoria | 1 se bate com o item mais ofertado | o % de ofertas da loja naquele item |

```
score = Σ(peso × aderência) / Σ(peso) × confiança
```

O peso sair do coeficiente de variação é o miolo do pedido: **loja de faixa apertada é
previsível**, então acertar o número dela vale muito; loja que compra de tudo tem CV alto
e o peso cai sozinho.

**`confiança = min(1, veículos / 5)`** é adição minha, não estava no pedido — evita que
loja com 1 carro de histórico lidere por sorte. **`CORRESP_MIN = 0` desde 18/09 — o corte está desligado.** Era 50. Desligar mexe menos do
que o nome sugere, e medir antes evitou a surpresa: no run 50406 o mínimo zerava apenas
**10 veículos dos 1.221**, e os pares iam de 33.503 para no máximo **36.409 (+8,7%)**. Quem
corta de verdade é o **`TETO_LOJAS = 30`**: 110.006 pares por run. Se um dia o pedido for
"ver mais loja por veículo", a alavanca é o teto, não este número.

Em troca, o piso passa a ser de quem lê — a **barra deslizante** do extrato, que nasce em
70% — e a cauda dos veículos com poucas lojas boas passa a exibir par de score baixo. O KPI
**Sem correspondência** tende a zero: sobra só quem não tem contraparte possível.

Se voltar a valer: o corte é sobre o **score**, não sobre a aderência bruta, senão passaria
justamente a loja que a confiança existe para segurar.

## As duas fases, e por que existem

O MCP `run_query` tem três limites medidos (ver o [README do SDK](../README.md)): sem
window function, resposta cortada em 50 linhas, deadline de 60s. E `OFFSET` reexecuta o
agregado inteiro — **página vazia custa o mesmo que página cheia**.

A primeira versão chutou 60 páginas para 26 necessárias: 170 chamadas desperdiçadas.
Daí o desenho atual:

| | o que faz |
|---|---|
| **Fase 1** (`montar-fase1.js`) | uma chamada: conta veículos e lojas, resolve os eventos, calcula a janela |
| **Fase 2** (`montar-fase2.js`) | pagina **exatamente** `ceil(n/50)`, nem uma página a mais |
| **Montar HTML** (`montar-html.js`) | ingere, calcula os pares, compara com o gabarito e desenha |

⚠️ Cada nó **reconstrói o seu `META`**. Campo que a fase 1 publica e a fase 2 esquece de
repassar chega `undefined` no fim — em silêncio. Já aconteceu duas vezes; hoje há prova
travando a ponte.

## A tela

Duas telas no mesmo arquivo, alternadas pelo botão do cabeçalho:

- **Relatório** — barra de filtros acima de tudo, faixa de seis KPIs, e as duas tabelas
  lado a lado com filtro cruzado. Clicar num veículo reordena as lojas; clicar numa loja
  reordena os veículos e abre o **extrato** dela.
- **Glossário** (`#glossario`) — 17 verbetes. A tabela de status é gerada a partir do
  dicionário publicado no dado, então mudar `STATUS_OK` muda a documentação junto.

**Whitelabel, UF e evento** valem para a página inteira, KPIs inclusive, e os três
dropdowns se recontam entre si. As duas **buscas** só filtram a tabela onde estão.

O que o filtro **não** alcança, e está escrito na tela: o perfil de compra da loja e o
fator de confiança vêm do histórico de 6 meses da loja inteira. Como a aderência é
calculada contra esse perfil, o score de cada par também não muda com o filtro — o filtro
escolhe quais pares aparecem, não os recalcula.

### 👤 O filtro de responsável (2026-09-21)

Um quarto dropdown: o **consultor dono da loja na carteira comercial**. Ele responde
"destas lojas que o carro alcança, quais são minhas?" — a pergunta que transforma o
relatório inteiro numa lista de trabalho de uma pessoa só.

**É o único filtro que age só sobre as lojas.** Whitelabel, UF e evento existem dos dois
lados e entram no `passaV` e no `passaL`. Carteira não: um veículo não tem responsável.
Então ele filtra as lojas e, por consequência, os pares — **a lista de veículos continua
inteira**. Botar o responsável no `passaV` esconderia carro do evento porque nenhuma loja
da carteira o quer, que é o contrário do que o relatório serve. O smoke test prova isso:
a soma dos veículos ao longo das opções tem que ser o total multiplicado pelo número de
opções, e não o total.

Por isso também a contagem ao lado de cada nome conta **lojas**, e não veículos como nos
três de cima. Não há escolha honesta: contar quantos carros "são da Gabriela" só faria
sentido somando os pares dela — número que mudaria com o corte de aderência e não caberia
num rótulo.

#### A carteira não está no banco

Ela é uma **planilha que a área comercial mantém** (`carteiras-cars2you-2026-09.xlsx`:
uma aba por consultor mais a aba `Todos os Clientes`, 1.436 clientes em 7 carteiras). Do
banco vem só o CNPJ da loja. Então a planilha viaja para dentro do nó como literal, igual
ao tema e aos logos:

```bash
python automations/n8n-sdk/rel-veiculos/gera-carteiras.py <planilha.xlsx>
node   automations/n8n-sdk/rel-veiculos/_aplica-carteiras.js
node   automations/n8n-sdk/rel-veiculos/_prova-carteiras.js   # 24 provas
```

🔴 **Não edite o bloco entre `CARTEIRAS:INICIO` e `CARTEIRAS:FIM` à mão.** É cópia, e
cópia que só um humano atualiza desatualiza — aqui de um jeito **mudo**: o consultor que
trocou de carteira continua respondendo pela loja antiga e a tela não tem como saber. Não
dá erro, não dá vazio: dá o nome errado. A prova falha alto se divergirem.

O `gera-carteiras.py` **confere as abas por consultor contra a consolidada** e se recusa a
gerar se não baterem. Divergência entre as duas visões colocaria loja na carteira errada.

#### A chave é o CNPJ, e o nome é só o segundo recurso

`shops.cnpj` casa exato e não discute — por isso o `q_lojas` ganhou `MAX(s.cnpj)`.

O **nome casa 65,2%** (medido em 2026-09-21, com a `normNome` que foi pro nó, contra as
715 lojas do run 50406) e erra dos dois lados: `R2 AUTOMOVEIS CONCEITO` no banco contra
`R2 AUTOMOVEIS CONCEITO COMERCIO E SERVICOS LT` na planilha — que corta a razão social em
45 caracteres, e o "LTDA" chega pela metade. Por isso o nome só vale quando é
**inequívoco**: nome normalizado que na planilha leva a dois consultores fica de fora do
mapa (10 casos). Atribuir a loja ao consultor errado é pior que deixar em
**Não Distribuído** — a mesma regra do link do anúncio, que não entra quando falta um
pedaço.

A normalização é **uma implementação só**: ela mora no `montar-html.js` (bloco
`NORMNOME`), e o `_aplica-carteiras.js` **lê a função de lá** para normalizar as chaves do
mapa. Reimplementá-la no injetor criaria duas versões escritas juntas, que erram juntas — e
a divergência só apareceria como loja sem responsável, sem erro nenhum.

#### O que declara que deu errado

`resumo.carteira` publica `por_cnpj`, `por_nome`, `nao_distribuidas` e
`lojas_sem_cnpj_no_banco`. Sem isso, duas situações muito diferentes dão a mesma tela:
"a planilha não tem essa loja" e "**o `Montar Fase 2` não foi transcrito e não veio CNPJ
nenhum**" — nesta segunda, a coluna inteira cai em Não Distribuído e o filtro parece só
estar vazio.

#### Medido: o CNPJ casa 93,8% (run 52794, 2026-09-21)

O primeiro run com o SQL novo respondeu a pergunta que estava aberta:

| | lojas | |
|---|---:|---|
| casaram por **CNPJ** | 675 | 93,8% |
| casaram por **nome** | 1 | 0,1% |
| **Não Distribuído** | 44 | 6,1% |
| total de lojas elegíveis | **720** | |

E `lojas_sem_cnpj_no_banco` veio **0**: toda loja do relatório tem CNPJ em `shops`, então
o cruzamento não perde ninguém por falta da chave. Contra os **65,2%** que o nome sozinho
alcançaria, o CNPJ vale 28,6 pontos — foi a decisão certa.

O nome resgatou **uma** loja. Ele fica porque o custo é zero e o caso existe (CNPJ trocado
entre matriz e filial), mas não é ele que sustenta o filtro, e não se deve confiar nele
como se fosse rede de segurança.

Distribuição das 720: Isabella 138 · Gabriela 134 · Larissa 125 · Patricia 107 · Renata 84
· Bianca 76 · Rodrigo Azevedo 12 · Não Distribuído 44.

⚠️ **As 44 "Não Distribuído" não são erro do cruzamento** — são lojas que ofertaram nos
últimos 6 meses e não estão na planilha de carteiras. Quem decide se elas deviam estar é a
área comercial, não este relatório.

⚠️ **O CNPJ não entra no array publicado.** Ele é chave de cruzamento, não dado de tela, e
o HTML sobe para o SharePoint. Há prova conferindo isso.

## As ferramentas, e o buraco que cada uma tapa

| script | existe porque |
|---|---|
| `prova-local.js` | 70+ provas da fórmula, da elegibilidade, do corte, do fuso e da ponte entre fases — sem tocar no banco |
| `_smoke_dom.js` | **o JS do navegador viaja como string dentro do nó** — `node --check` nunca olha pra ele. Dois bugs chegaram ao Thomas por essa fresta. Roda o app contra um DOM de mentira e **interage**: percorre os três dropdowns, cruza um com o outro, abre o glossário, clica em limpar |
| `monta_html_de_dados.js` | regera o HTML de um `dados-*.json` já coletado. Mexeu só na tela? segundos, não os 9 min do run. Recorta a seção entre `RENDER:INICIO`/`RENDER:FIM` do próprio nó, então não há cópia paralela pra desatualizar |
| `_extrai_execucao.py` | o nó devolve ~9 MB; resultado desse tamanho não cabe na conversa e o harness salva em arquivo. Materializa `saida-<id>.html` e `dados-<id>.json` |
| `_confere_run.js` | **o código do nó é transcrito à mão pra dentro do n8n.** Um caractere trocado não quebra a sintaxe — envenena os números. Recalcula todos os pares publicados e revalida a elegibilidade |
| `_previa_corte.js` | aplica o corte de correspondência num JSON já coletado, pra ver a tela nova sem gastar um run |
| `monta_html_de_dados.js` | ⚠️ Tudo o que a tela usa tem que morar **dentro** de `RENDER:INICIO`/`RENDER:FIM`. Em 2026-09-11 a `descreveRecorte()` nasceu fora e quebrou a regeneração — o trecho extraído não a enxergava. Se algo estourar aqui, é quase sempre isso |
| `_confere_transcricao.py` | compara **byte a byte** o que está no n8n com o arquivo local. Existe porque em 2026-09-10 as 248 sequências de escape de aspa do `montar-html.js` foram **dobradas em duas transcrições seguidas** — 568 barras invertidas em vez de 320, JS do cliente sem compilar, mesma classe de erro que derrubou a execução 49963. Achar isso depois de um run de nove minutos é caro; achar antes custa uma chamada |
| `build_wf.py` | gera o `.wf.ts` a partir dos `.js` |
| `gera-carteiras.py` | lê a planilha de carteiras da área comercial e escreve `carteiras.json` — só CNPJ, razão social e consultor. Confere as abas por consultor contra a consolidada e **se recusa a gerar** se não baterem |
| `_aplica-carteiras.js` | injeta o mapa no bloco `CARTEIRAS` do nó. Lê a `normNome` **de dentro do próprio alvo**, pra não haver duas normalizações |
| `_prova-carteiras.js` | 24 provas: a cópia bate com a fonte, o mapa tem forma de mapa, a normalização é a mesma dos dois lados, o CNPJ vem antes do nome, e o CNPJ **não** vaza pro HTML |

Ciclo depois de mexer:

```bash
node prova-local.js && node monta_html_de_dados.js dados-<id>.json && node _confere_run.js dados-<id>.json
```

E **depois de sincronizar com o n8n, antes de rodar** — a etapa que faltava:

```bash
python _confere_transcricao.py <dump-do-get_workflow_details.txt>
```

### A logo no cabeçalho

Cabeçalho em **#1523A0** (a cor da marca), com o tom também nos detalhes — barra de score,
links, a barra do título e o KPI de veículos. O token é `--mar`; `--ac` passou a ser ele.

A logo entra como **data URI**: o relatório é arquivo único, e referenciar um arquivo
externo quebraria assim que alguém encaminhasse o HTML. Mas **não** como o `.jpg` original
de 6.216 bytes — viraria ~8.300 caracteres de base64 transcritos à mão para o nó, e base64
longo é exatamente o tipo de coisa que se transcreve errado.

Como a logo é de **duas cores por desenho** e aparece a 26px, ela vai como PNG paletizado
de 128px construído por limiar de luminância: **570 bytes, 760 caracteres**. Treze vezes
menor, sem artefato de JPEG na borda do glifo, e conferível por sha1.

⚠️ A quantização automática do Pillow (`quantize(colors=2)`) escolheu **dois azuis e perdeu
o branco**. Por isso a paleta é construída à mão. Ver `_marca_c2y.py`.

O fundo da logo é `#1523A0` medido pixel a pixel — idêntico ao do cabeçalho, então ela
encaixa sem emenda e o que se vê é só o wordmark.

### Por que o `montar-html.js` não tem mais barra invertida

O JS do navegador viaja como **string** dentro do nó, e o nó viaja pro n8n como **string
JSON transcrita à mão**. Barra invertida é onde este projeto erra. A correção não foi
"transcrever com mais cuidado" — foi tirar o material: elemento de array que emitia aspa
simples de atributo HTML passou a usar **crase** (dentro de template literal a aspa não
precisa de escape), e `·`/`—`/`↗` viraram os caracteres `·`, `—` e `↗`.

Sobraram **4 barras** no arquivo inteiro, que dá para conferir no olho. A prova local mede
isso e falha se subir. Provado equivalente: o HTML gerado antes e depois é idêntico byte a
byte, normalizando só os relógios e essa troca de escape.

Os arquivos `_*.py` são os patches aplicados, um por mudança. Ficam versionados porque
cada um explica **por que** a mudança foi feita — é o registro do raciocínio, não código
que roda de novo.

## A publicação no SharePoint

Dois nós no fim da cadeia: `Montar HTML` → **`Virar Arquivo`** → **`Subir no SharePoint`**.

```
Radar de Estoque/radar-de-estoque-AAAA-MM-DD.html
```

### 🔴 Já foram três nomes — e trocar o nome NÃO move nada

O upload é por **path**, e path **cria** a pasta. Trocar `PASTA`/`PREFIXO` abre
pasta nova e deixa a antiga parada, com tudo que já estava publicado:

| # | pasta | período |
|---|---|---|
| 1 | `Relatorios Aderencia Veiculos` | 11/09 até a correção de acento — eu escrevi em ASCII por hábito de nome de arquivo |
| 2 | `Relatórios Aderência Veículos` | 15/09 em diante |
| 3 | **`Radar de Estoque`** | 🔜 ainda não existe — ver abaixo |

### ✅ RESOLVIDO em 2026-09-21: a pasta nova nasceu (run 52794)

O `Virar Arquivo` foi transcrito e a execução **52794** publicou em
`Radar de Estoque/radar-de-estoque-2026-09-21.html` — 4.544.250 bytes, 11min45,
pela conta `powerbi@cars2you.com.br`. 1.001 veículos, 720 lojas elegíveis,
30.030 pares, 25 eventos.

🔜 **Ainda falta, e é operação no SharePoint do time, não do workflow:** apagar as
**duas pastas antigas** e o arquivo de 18/09 que caiu na pasta #2.

O registro do que deu errado fica abaixo, porque a causa vale mais que o conserto.

### O que tinha acontecido (18/09)

A execução **52212** (18/09) publicou na pasta **#2**, não na #3:
`Relatórios Aderência Veículos/relatório-aderência-veículos-2026-09-18.html`.

**Causa:** os `PASTA`/`PREFIXO` novos moram no `virar-arquivo.js`, e esse nó
**não foi transcrito** para o n8n — a lista de nós a transcrever saiu errada,
dizendo que ele não tinha mudado. Os três nós de cálculo foram, o de publicação
não. O run inteiro está correto; só o destino do arquivo está errado.

**O que falta, nesta ordem:**

1. Transcrever o **`Virar Arquivo`** para o n8n (`-Encoding UTF8` no clipboard,
   senão os acentos viram mojibake — medido em 18/09).
2. Rodar de novo. Aí a pasta `Radar de Estoque` nasce.
3. Apagar as **duas pastas antigas** e o arquivo de 18/09 que caiu na #2.

🔴 **O filtro de responsável (21/09) somou dois nós a essa lista:** o
**`Montar Fase 2`** (ganhou `MAX(s.cnpj)` no `q_lojas`) e o **`Montar HTML`**
(o cruzamento, o filtro e o literal da carteira). São três nós no total, e a
ordem importa: sem o Fase 2, o Montar HTML roda sem CNPJ nenhum e a coluna
inteira cai em "Não Distribuído" **sem dar erro** — `resumo.carteira
.lojas_sem_cnpj_no_banco` é o número que denuncia.

⚠️ Conferir com `python _confere_transcricao.py <json-do-workflow>` **antes** de
rodar: ele compara os quatro nós byte a byte, e é o que teria pego isto.

As duas primeiras pastas foram marcadas para **exclusão** pelo Thomas em 18/09 —
o acervo recomeça do zero na pasta nova, e não fica repartido em três.

⚠️ **Se este nome mudar de novo, o problema volta.** A troca só fica completa
quando o conteúdo antigo é movido e a pasta velha, removida — e isso é
operação no SharePoint do time, não coisa que o workflow faça.

Site **N8N**, drive `b!WIoPIE-…`, credencial `AOTm9J6pFcF0DS6g`
(Conta PowerBI/Automações) — a mesma do IGA, do C6 e da Lista LM.

💡 **Endereçado por path, e path CRIA a pasta.**
`PUT /drives/{id}/root:/Pasta/arquivo.html:/content` cria "Pasta" se ela não existir —
medido nos fluxos C6. Dispensa descobrir `folderId` e sobrevive a alguém recriar a pasta.

🔴 **Host tem que ser `automakers.sharepoint.com/sites/N8N/_api/v2.0`.**
`graph.microsoft.com` dá **401 invalid-audience** com essa credencial. Já custou depuração
no IGA e na LM; está escrito na `notes` do nó.

⚠️ **A credencial tem que ser vinculada na interface.** O MCP do n8n não anexa credencial
predefinida em nó HTTP — ele avisa (`were skipped during credential auto-assignment`).
Mesma pendência que o `Listar Relatórios` do IGA e o `Subir no SharePoint` da LM tiveram.

### Por que `Virar Arquivo` é um Code node

🔴 **O `Convert to File` em modo `toBinary` espera base64**, e recebendo HTML em texto puro
gera um arquivo de **14 bytes com `status: success`**. Foi o que aconteceu na Lista LM em
25/08: o anexo saiu quebrado e sem erro nenhum.

Aqui o binário é montado à mão e conferido por duas guardas que **falham de verdade**:

| guarda | pega |
|---|---|
| `html` existe e tem ≥ 100 KB | `Montar HTML` que devolveu erro em vez de relatório |
| o base64 decodifica para os **mesmos bytes** da fonte | conversão que comeu conteúdo |

A segunda não é limiar chutado, é igualdade — e `_prova_virar_arquivo.js` **sabota o
`Buffer`** para provar que ela morde. 18 provas, sem tocar no banco nem no SharePoint.

⚠️ **O nome do arquivo é datado em hora de Brasília**, com o mesmo `FUSO_MIN = -180` do
`Montar Fase 1`. `new Date()` no nó responde em UTC: às 21h daqui o arquivo sairia datado
de amanhã. Três provas travam isso, uma delas exatamente às 23h.

### Um arquivo por dia, e o PUT substitui

Dois runs no mesmo dia geram **um arquivo só**, o do último. É de propósito: a pasta não
acumula lixo de teste. O custo é não haver histórico intradiário — se fizer falta,
acrescentar a hora ao `PREFIXO`.

💡 **Mexendo só na tela?** Desabilite o `Subir no SharePoint` no canvas, ou use o
`monta_html_de_dados.js`, que nem roda o workflow.

### Subir ≠ aparecer embutido numa página

O que estes dois nós entregam é **arquivo na pasta + link**. Renderizar o relatório
*dentro* de uma página do SharePoint é outro problema, e não está resolvido:

- o SharePoint Online moderno **não executa HTML de biblioteca de documentos** — o `.html`
  clicado baixa, não abre. O *custom script* que permitia isso foi aposentado pela
  Microsoft;
- a web part **Incorporar** aceita `<iframe>` de domínio em lista de permissão, não um
  bloco de 4 MB inline.

Para embutir, o HTML precisaria ser **servido** com `Content-Type: text/html` por um
domínio permitido — um `Respond to Webhook` do n8n, ou hospedagem estática.
🚨 **A rota do webhook esbarra em autenticação:** iframe não manda header, então a URL
ficaria pública para quem tivesse o link, com 732 nomes de loja reais dentro. Não fazer sem
decisão explícita do Thomas.

📐 **Medição que decide isso, e só o Thomas pode fazer:** abrir um
`relatorio_evento_IGA_*.html` pelo link do SharePoint. Se abrir no navegador, o tenant
ainda permite render e a conversa muda inteira; se baixar, está confirmado o acima.

## Estado

Última execução: **50106** (2026-09-10), janela aberta desde 09/09. **8min33s.**

| | 49984 (nove eventos) | 50106 (janela aberta) |
|---|---|---|
| eventos | 9 | **50** |
| veículos | 735 | **1.123** |
| lojas elegíveis | 251 | **728** |
| correspondências | 14.507 | **33.718** |
| UFs distintas dos veículos | 2 | **25** |
| veículos sem par | 21 | **259** |
| HTML | 1,4 MB | **3,3 MB** |

Coletados 1.123 de 1.123 esperados — completude fechada. Todos os 1.123 com link.

### "Sem correspondência" são três coisas, não uma

O run 50106 mostrou 259 veículos (23%) sem par, e o relatório declarava isso numa frase
só — "ou não há loja na mesma UF e whitelabel, ou nenhuma passou da correspondência
mínima". São **três populações com causas opostas**:

| causa | o que significa | baixar o corte resolve? |
|---|---|---|
| **canal sem loja** | o evento alveja um **canal de pessoa física** (colaborador, associado, clube). Não existe loja compradora como categoria — o par é impossível por construção. | **não** |
| **sem loja na UF** | há loja no canal, mas nenhuma na UF do pátio | **não** |
| **cortado pelo mínimo** | havia loja elegível e nenhuma alcançou os 50% | **sim** |

Para o primeiro grupo a frase antiga **enganava**: sugeria que se procurou e não se achou
nada bom, quando a busca era impossível. E quem lia "23% sem correspondência" concluía que
o corte estava alto — mas o corte só alcança o terceiro grupo.

Agora cada veículo publica `elegiveis` (lojas que passaram na regra **antes** do corte) e
`canal_sem_loja`; as falhas declaram as três separadamente; o KPI **sem correspondência**
conta só quem *podia* ter par, e os impossíveis ganham KPI próprio, em cinza — número que
não é culpa de ninguém não deve aparecer em vermelho ao lado dos que são.

🚨 **As duas colunas não são comparáveis.** A UF do veículo mudou de fonte (loja → pátio),
e 68% dos veículos mudam de UF com isso: o salto de 2 para **25 UFs distintas** é essa
mudança aparecendo. Não é "o relatório cresceu"; é outra base de pares.

⚠️ **O HTML foi a 4,1 MB.** Anexo de e-mail desse tamanho é arriscado — mesma questão já
aberta no C6 (que estava em 1,27 MB). **Resolvido em 2026-09-11: o relatório sobe no
SharePoint** (seção abaixo), como o IGA já faz.

**Ressalvas abertas:**

- **Contas internas no ranking.** Porto Seguro, Itaú Unibanco e duas "Teste Cars2you",
  todas em SP/Marketplace. Falta o Thomas confirmar que são internas pra excluir.
- **Duplicidade no catálogo `models`.** Nomes iguais em faixas de id diferentes fazem
  "Strada × Strada" dar aderência zero no componente de modelo. Impacto medido: 4 pares
  em 14.507. Documentado em [`dominios.md`](../../../context/banco-de-dados/dominios.md).
