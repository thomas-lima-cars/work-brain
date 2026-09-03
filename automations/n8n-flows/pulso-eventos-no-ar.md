# n8n — Pulso de Eventos no Ar

> Fluxo `📡 Pulso de Eventos no Ar` — `20LeyMLjrAKeKVeS`
> Projeto **Cars2You** em `cars2you.app.n8n.cloud`. **Ativo desde 01/09/2026.**
> **Sem segredos aqui** — só nomes e IDs de credencial.
> Tarefa: **TAR-91**. Sem PD (decisão do Caio: é ação interna).

## Por que existe

Pedido do **Donizeti (Head de Vendas)** em 01/09/2026, na conversa gravada. Ele precisa
enxergar o resultado do evento **enquanto o pregão ainda está rolando**, para chamar o
coordenador e cobrar. A frase dele: *"não fazer HTML, não fazer tela, fazer nada. Mandar no
seu WhatsApp."*

**Uma mensagem de 2 em 2 horas, com todos os eventos.** Sem painel, sem anexo, sem e-mail.

## O que a mensagem traz

Cabeçalho enxuto + duas seções, **LEVES** e **PESADOS**, cada uma com **sua própria
conclusão**, e cada evento com semáforo:

```
📊 *Eventos no ar* — 01/09 16h
9 eventos · 5 já encerraram hoje

*── LEVES ──*
🔴 *6 eventos, 3 já fechados* · 491 carros · êxito 7% · 20 no VMV

🔴 *Evento Exclusivo C6 Auto – 02/09/26*
C6 Bank Lojista
Encerra amanhã 16:00 · faltam 23h46
10 carros · 1 com oferta · êxito 10%
1 já no VMV (10%)
Pregão R$ 59.600 · 1 lances · 1 ofertantes

🔴 *Feirão de oportunidades LM Leves - 01/09/26*
LM TRANSPORTES INTERESTADUAIS SERVICOS E COMERCIO S.A
🔒 ENCERRADO · fechou hoje 15:00
256 carros · 24 com oferta · êxito 9%
17 já no VMV (7%) · 7 com oferta abaixo do VMV
Pregão R$ 1.097.900 · 76 lances · 15 ofertantes

*── PESADOS ──*
🔴 *3 eventos, 2 já fechados* · 96 carros · êxito 3% · 2 no VMV
...
```

### A conclusão é por seção, nunca somada
Decisão do Caio em 01/09: *"elas somadas não fazem sentido."* Leve e pesado são mercados,
compradores e tíquetes diferentes — e na média um evento de 256 carros leves afoga o de 5
caminhões. Cada seção tem contagem, carros, êxito, VMV e **semáforo próprio**.

O cabeçalho ficou só com a contagem de eventos e quantos já encerraram: **sem semáforo e sem
soma de carros**, de propósito.

### Evento fechado continua na lista até virar o dia
Também pedido do Caio em 01/09. A janela do banco passou de "encerra depois de agora" para
**"encerra hoje ou depois"** (`finish_date_event >= DATE(AGORA)`), então o que fechou às 14h
segue aparecendo até a meia-noite. É o placar do dia, não só o que ainda dá para mexer.

O bloco troca a linha de tempo por **`🔒 ENCERRADO · fechou hoje 15:00`**. O cadeado diz que
não há mais o que fazer ali sem mexer no semáforo, que ali vira **resultado final**.

Encerramento em aberto aparece como `HOJE 15:00`, `amanhã 11:00` ou `03/09 16:00`; o tempo
restante vira "2 dias" quando passa de 24h.

### Ordem dentro da seção
**Aberto na frente de encerrado** — o que dá para agir vem primeiro. Entre abertos, quem
fecha antes; entre encerrados, quem fechou por último. **Seção sem evento não aparece**:
título órfão é ruído.

### Cadência: de 2 em 2 horas
8h, 10h, 12h, 14h, 16h, 18h e 20h, de segunda a sábado — sete disparos por dia. Alterado
pelo Caio em 01/09 (nasceu de hora em hora). A regra é *hora par dentro de 8h–21h*, o que na
prática encerra às 20h.

### 🚦 Destinatários — os cinco, liberados em 01/09

| Quem | Número |
|---|---|
| Donizeti | `5511941491229` |
| Caio | `5511976288713` |
| Thais Martins | `5511947619656` |
| Alexandre | `5521980043419` ⚠️ número novo no brain, único com DDD 21 — **confirmar** |
| Tuunelis | `5511942426140` |

**`LIBERADO` no `Expandir Destinos WhatsApp` é a chave de emergência.** Ficou `false`
durante toda a construção, para que só o Caio recebesse; voltar para `false` suspende o envio
aos outros quatro **sem desligar o fluxo**. Nesse estado a mensagem abre com *"Em validação —
só você está recebendo"*, para não haver dúvida se os outros receberam.

## Cadeia (11 nós + 2 anotações)

`Cada Hora Cheia` (cron) **+** `Disparo Manual` (form, path `pulso-eventos`) → `Config` →
`SQL Eventos no Ar` → `MCP Eventos` → `Montar Mensagem` → `Expandir Destinos WhatsApp` →
`Enviar WhatsApp`.

Ramo de falha, independente: `Se o Fluxo Falhar` (Error Trigger) → `Montar Aviso de Falha` →
`Avisar Caio da Falha`.

## Decisões que definem o fluxo

### Êxito é veículo com oferta, não venda
Durante o pregão **não existe venda**. O lote fica dias em análise do vendedor com
`offer_actual_id` nulo — é a mesma patologia que tirou os Pesados do IGA do automático em
17/08. Se a métrica horária usasse a regra de venda, diria 0% e R$ 0 sempre.

Então: **êxito = lote com ao menos uma oferta não deletada**. Decisão do Caio em 01/09.

### A qualidade da oferta é medida contra o VMV
`no_vmv` = lotes cuja melhor oferta já alcança `an.min_sale_price`. A linha
**"N com oferta abaixo do VMV"** é a que gera ação: é a ligação para o coordenador. "22 com
oferta" sozinho não diz se aquilo vende.

### Sem meta separada por banco e locadora — mas com semáforo
O Donizeti citou 40% para locadora e 70% para banco. O banco de dados **não sabe** quem é
banco e quem é locadora, e o Caio decidiu em 01/09 **não** montar a tabela de mapeamento:
*"só traz o número que o pessoal já sabe."*

O **semáforo 🔴🟡🟢 é essencial** (cobrança do Caio em 01/09) e abre cada bloco e o
cabeçalho. Sem tabela de comitente, as faixas usam justamente os dois números que o time
conhece de cabeça:

| Sinal | Êxito | Leitura |
|---|---|---|
| 🟢 | ≥ 70% | já bateu até o critério de banco, o mais duro |
| 🟡 | 40–69% | bateu o de locadora, não o de banco |
| 🔴 | < 40% | abaixo dos dois |

⚠️ **O semáforo é uniforme, não pondera pelo tempo restante.** Um evento que encerra daqui a
6 dias e ainda está zerado sai 🔴 — o que é normal, não problema. Quem dá a urgência é a
linha "Encerra". Se virar ruído, o ajuste é neutralizar o sinal dos eventos com 2+ dias.

### Sem evento no ar, não manda nada
`Montar Mensagem` devolve `[]` e a cadeia para. Mensagem "nada hoje" repetida 14 vezes por
dia mata o hábito de ler. **É por isso que o aviso de falha existe** — silêncio aqui não
pode ser ambíguo.

### Leves e Pesados vêm da categoria do veículo, não do nome do evento
Conferido no banco em 01/09: os eventos de pesados usam **Caminhão (5), Reboque (21) e
Semirreboque (10)**; os de leves usam **Automóvel (9)** e **Utilitário (8)**. A constante
`CAT_PESADA` no `SQL Eventos no Ar` lista todas as categorias pesadas da tabela `categories`
— `3,4,5,7,10,14,16,17,18,19,20,21,23,24`. Moto entra como leve.

**O evento é classificado pela maioria dos lotes**, não por todos: o "Pesados VWFS" tem 4
caminhões e 1 utilitário, e precisa cair em Pesados inteiro. Empate vai para Leves.

Classificar pelo **nome** seria mais fácil e estaria errado — é a mesma armadilha do C6, que
não pode ser apartado por white-label nem por nome de evento.

### Outlet Netcarros fora
Tirado pelo Caio em 01/09. É estoque de vitrine, não pregão, e sozinho respondia por **151
dos 730 carros** — distorcia o êxito consolidado e empurrava o resto da lista para baixo.

Constante `FORA = '1931'` (shop_id do Outlet Netcarros) no `SQL Eventos no Ar`. O corte é por
**maioria de lotes**, não por existência: um carro do Outlet dentro de um evento de outro
comitente não pode derrubar o evento inteiro.

⚠️ Existe também "Parceria Netcarros" (shop `8717`), que **continua dentro** — é outra coisa.

### Escopo multi-comitente, de propósito
🔴 **Este é o único fluxo nosso que cruza comitente com comitente.** Não tem trava por
`advertisements.shop_id` como o C6 e o IGA. Só é seguro porque:
- a saída são **5 números internos**, e
- a mensagem **não leva placa, comprador, CNPJ nem valor por carro** — só agregado por evento.

**Se isso um dia sair da casa, a trava por `shop_id` tem de voltar.** Está escrito em
anotação no próprio canvas.

## Armadilhas descobertas na primeira execução ao vivo (01/09)

### 🔥 O relógio do banco está em UTC e `finish_date_event` é local sem fuso
Conferido na execução **47742**: `NOW()` devolveu `15:05` quando em São Paulo eram `12:05`.
Os eventos são gravados naive (16:00 significa 16:00 de Brasília).

**Consequência antes do fix:** o tempo restante saía **3h menor** (o evento das 16h aparecia
com "faltam 54min" às 12h) e — pior — **o evento desaparecia da lista às 13h**, exatamente
nas três horas em que o Head mais precisa agir.

**Fix:** `AGORA = COALESCE(CONVERT_TZ(NOW(), 'UTC', 'America/Sao_Paulo'), DATE_SUB(NOW(), INTERVAL 3 HOUR))`,
num lugar só no `SQL Eventos no Ar`. O `COALESCE` cobre instância sem as tabelas de fuso
carregadas — nesse caso `CONVERT_TZ` devolve `NULL`, e `NULL` apagaria a lista inteira **em
silêncio**. Vale para qualquer fluxo desta instância que compare data com `NOW()`.

### 🔥 `start <= agora <= fim` não é "evento no ar"
A janela ingênua trouxe **23 eventos**, incluindo as vitrines permanentes (Banco GM, OMNI,
Apeop, Clube FMP, Bemol — todas com encerramento em 31/12), o "Mega Feirão da Virada" e
"Teste Concessionária A", que são teste na base de produção. Os três eventos que importavam
afogaram no meio.

**Fix:** horizonte de **hoje até 7 dias à frente**
(`finish_date_event < DATE_ADD(DATE(AGORA), INTERVAL 8 DAY)` — o corte é antes da meia-noite
do 8º dia, então o 7º entra inteiro). Decidido pelo Caio em 01/09; nasceu com dois dias e ele
ampliou. Rótulo `HOJE` / `amanhã` / data na mensagem. Passou a devolver 9 eventos, 5
encerrando hoje, sem nenhuma vitrine.

Sete dias continua bem longe de 31/12, então as vitrines permanentes seguem fora.

### 🔥 O agendador desta instância roda em UTC
O `scheduleTrigger` reportou `Timezone: UTC (UTC+00:00)` **mesmo com
`settings.timezone = America/Sao_Paulo` aplicado no fluxo**. Um cron `0 0 8-21 * * 1-6`
dispararia das **5h às 18h** de São Paulo.

**Fix:** o cron virou `0 0 * * * *` (toda hora cheia, todos os dias) e a janela de horário
virou **código** no `Config`, com `$now.setZone('America/Sao_Paulo')` — fora de 8h–21h, no
domingo ou em hora ímpar, devolve `[]`. Fica testável e não depende do fuso do agendador.

A cadência de 2 em 2 horas mora aqui pelo mesmo motivo: um cron `*/2` em UTC cairia nas horas
**ímpares** de São Paulo.

A trava de horário **só vale no disparo automático**. O sinal é o campo `modo_teste` estar
ausente: o `scheduleTrigger` não passa nada e o formulário sempre informa.

### 🔴 `execute_workflow` pelo MCP ignora o `formData` e entra pelo Schedule Trigger
Foi assim que a **execução 47742 disparou para os 5 números com dado errado**, mesmo tendo
sido chamada com `modo_teste = "Nao enviar"`. O `Config` não recebeu o campo, caiu em
`Producao` por desenho, e mandou.

**Para validar sem disparar:** `setNodeDisabled` no nó `Enviar WhatsApp`, rodar, conferir a
saída do `Montar Mensagem`, religar. Foi o que se fez na execução **47743**. Não confiar no
`modo_teste` via `execute_workflow`.

### 🔥 Os gatilhos ficaram DESABILITADOS sozinhos, e o fluxo constava ativo
Depois de uma sequência de `update_workflow` + `publish_workflow`, o `Cada Hora Cheia` e o
`Disparo Manual` apareceram com `disabled: true`. O fluxo seguia `active: true` no painel,
mas com **`triggerCount: 0`** — ou seja, **nunca dispararia**, e ninguém receberia nada. O
sintoma que denunciou foi o `execute_workflow` recusando com *"Only workflows with the
following trigger nodes can be executed"*, enxergando só o Error Trigger.

**Depois de qualquer publicação, conferir `triggerCount` com
`get_workflow_details detailLevel: 'execution'`.** Ativo com `triggerCount: 0` é fluxo morto
que parece vivo — a pior variante do "falha vira silêncio", porque nem execução com erro
existe para olhar.

### 🔴 `update_workflow` mexe no RASCUNHO; o formulário roda a versão PUBLICADA
Na execução **47773** o formulário devolveu a mensagem antiga — sem seções, com o Outlet
dentro — porque o `update_workflow` tinha acabado de rodar mas o `publish_workflow` não.
Levou um minuto de confusão achando que o código não tinha subido.

**Ordem certa:** `update_workflow` → `publish_workflow` → só então testar pelo formulário.
O `execute_workflow` em modo manual roda o rascunho, o formulário e o agendamento rodam a
publicada. Duas fontes de verdade diferentes na mesma sessão.

### Como testar a cadeia inteira sem incomodar ninguém
Como o `execute_workflow` descarta o `modo_teste`, o jeito de exercitar o caminho completo é
**abrir o formulário no navegador** — `https://cars2you.app.n8n.cloud/form/pulso-eventos` — e
escolher `So Caio` ou `Nao enviar`. O `Config` reconhece que veio do formulário e pula a
trava de horário, então funciona em qualquer hora do dia.

## Trava de contagem
O `SQL Eventos no Ar` devolve `JSON_OBJECT('total', COUNT(*), 'itens', JSON_ARRAYAGG(...))`.
Se `itens.length !== total`, o `Montar Mensagem` **aborta**. Cobre o cap de 50 linhas do MCP
(que corta em silêncio) e o limite de tamanho do próprio `JSON_ARRAYAGG`.

## Aviso de falha
`Error Trigger` dentro do próprio fluxo (n8n dispara sozinho, não precisa configurar fluxo de
erro). Manda WhatsApp **só para o Caio**, com nome do nó e mensagem do erro, e a linha:
*"A mensagem desta hora NÃO saiu para ninguém. Silêncio aqui nunca significa evento zerado."*

Fecha o padrão **"falha vira silêncio"** que já mordeu 7 vezes nesta instância — e que aqui
seria pior, porque mensagem que não chega é indistinguível de "não tem evento no ar".

⚠️ **O Error Trigger só dispara em execução de produção**, não em teste/manual.

## Modos de disparo

| Modo | O que faz |
|---|---|
| `Producao` | Manda para os cinco. É o que o gatilho automático usa — campo ausente cai aqui sozinho |
| `So Caio` | Manda só para o Caio, com tarja `[TESTE]` |
| `Nao enviar` | Monta a mensagem e para. Serve para conferir query e texto sem incomodar ninguém |

## Infra e credenciais

| Item | Valor |
|---|---|
| MCP banco | `https://mcp-cars2you-readonly.cars2you.com.br/sse` · cred `Cc8CxzVDwvA3EysZ` |
| Evolution (WhatsApp) | `http://52.206.207.64:8080/message/sendText/Cars2You%20Comercial` · cred `A46wz7IuxLPWqy5Z` |
| Projeto n8n | Cars2You — `yAo7DiqDfz6XfXyv` |

## Fora de escopo — a segunda camada

O Donizeti pediu **o mesmo número por carteira de vendedor** ("hoje ninguém da sua carteira
entrou no evento"). **Não foi feito, e não dá para fazer hoje:**

- não existe vínculo vendedor ↔ lojista no `cars2you_production`;
- a própria organização de carteira é **proposta dele para setembro**, não realidade.

Junto disso ele descreveu o modelo de remuneração que quer levar ao Tuunelis: ganho por venda
+ ganho por êxito da carteira que acompanha, especialista por comitente (2 pessoas em LM
revisando foto e laudo do time do Mattera), penalidade por quebra de pagamento, penalidade por
cliente que sai da carteira e ganho por cliente novo. **Nada disso é sistema ainda** — é
insumo do **PD-34 (PRM de lojistas)**.

## Pendências

- 🔴 **A execução 47742 mandou uma mensagem errada para os 5** (23 eventos, incluindo vitrines
  de 31/12, e tempo restante 3h menor). Avisar Donizeti, Thais, Alexandre e Tuunelis para
  desconsiderar. Foi o único disparo que saiu para eles.
- 🔴 **Confirmar o número do Alexandre** — ele já está recebendo desde a liberação das 18h de
  01/09, e é o único destinatário cujo número não veio de um fluxo que já rodava.
- Acompanhar o **primeiro disparo automático para os cinco** — 20h de 01/09.
- Confirmar com o Donizeti a cadência **de 2 em 2 horas, 8h–20h, seg a sáb** (domingo fica
  fora — decisão do Caio em 01/09).
- Decidir se outras **lojas de vitrine** também saem, junto com o Outlet Netcarros — hoje só
  o `1931` está na constante `FORA`.
- Avaliar se o semáforo deve **poderar pelo tempo restante** — hoje evento distante e zerado
  sai 🔴.

## Registro de validação

| Execução | Quando | O que provou |
|---|---|---|
| 47742 | 01/09 12:05 | Caminho do Evolution funciona (5 números, `PENDING`). **Disparou sem querer** e revelou os erros de fuso e de horizonte |
| 47743 | 01/09 12:10 | Query e mensagem certas com o envio desligado: fuso de São Paulo correto, 8 eventos, vitrines fora |
| 47759 | 01/09 14:04 | Semáforo, horizonte de 7 dias, `hora_sp 14:04` batendo com o relógio real, envio só para o Caio |
| 47772 | 01/09 15:36 | **Trava de 2 em 2 horas funcionando**: hora ímpar, o `Config` devolveu vazio e a cadeia parou |
| 47773 | 01/09 15:37 | Formulário rodou a versão **publicada**, ainda antiga — foi o que revelou a pegadinha rascunho × publicada |
| 47774 | 01/09 15:39 | Outlet fora, seções LEVES/PESADOS, ordem por encerramento, rodapé "de 2 em 2 horas", só para o Caio |
| 47777 | 01/09 16:00 | **Primeiro disparo automático na cadência nova** — 16h é hora par, saiu sozinho |
| 47784 | 01/09 16:13 | ✅ Versão final pelo formulário: 9 eventos com os 5 fechados de hoje marcados com cadeado, conclusão separada por seção |

Depois da 47784: `publish_workflow` e `triggerCount: 2` conferido.

⚠️ A execução automática **47766**, às 15:00, rodou a versão publicada da época — ainda de
hora em hora e com o Outlet dentro. Foi só para o Caio.
